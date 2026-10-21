<?php

namespace App\Services\Ia;

use App\Services\Ia\Exceptions\IaNoDisponibleException;
use App\Services\Ia\Exceptions\RespuestaIaInvalidaException;
use Illuminate\Support\Facades\Log;

class SugerenciaCategoriaService
{
    private OllamaClient $client;

    public function __construct(?OllamaClient $client = null)
    {
        $this->client = $client ?? new OllamaClient();
    }

    /**
     * Obtiene el catálogo oficial de categorías permitidas.
     *
     * @return array<string, string> [nombre_categoria => descripcion]
     */
    public function obtenerCatalogo(): array
    {
        return config('categorias_activos.categorias', []);
    }

    /**
     * Genera una sugerencia de categoría para un activo patrimonial.
     *
     * @param array{
     *     nombre: string,
     *     marca_modelo?: string|null,
     *     estado_conservacion?: string|null,
     *     establecimiento?: string|null
     * } $datosActivo
     * @return array{
     *     categoria_sugerida: string,
     *     justificacion: string,
     *     confianza: string,
     *     atributos_clave: array<int, string>,
     *     modelo_utilizado: string,
     *     catalogo_version: string
     * }
     *
     * @throws IaNoDisponibleException
     * @throws RespuestaIaInvalidaException
     */
    public function sugerir(array $datosActivo): array
    {
        if (!config('services.ollama.enabled', true)) {
            throw new IaNoDisponibleException('El servicio de IA con Ollama está deshabilitado por configuración (OLLAMA_ENABLED=false).');
        }

        $catalogo = $this->obtenerCatalogo();
        if (empty($catalogo)) {
            throw new RespuestaIaInvalidaException('El catálogo de categorías de activos está vacío o no configurado.');
        }

        $categoriasPermitidas = array_keys($catalogo);

        // Construir contexto del catálogo para el prompt
        $lineasCatalogo = [];
        foreach ($catalogo as $nombreCat => $desc) {
            $lineasCatalogo[] = "- {$nombreCat}: {$desc}";
        }
        $textoCatalogo = implode("\n", $lineasCatalogo);

        // Datos del bien a clasificar
        $nombre = trim((string) ($datosActivo['nombre'] ?? ''));
        $marcaModelo = trim((string) ($datosActivo['marca_modelo'] ?? ''));
        $estado = trim((string) ($datosActivo['estado_conservacion'] ?? ''));
        $establecimiento = trim((string) ($datosActivo['establecimiento'] ?? ''));

        $descripcionBien = "Nombre del bien: {$nombre}";
        if ($marcaModelo !== '') {
            $descripcionBien .= "\nMarca / Modelo / Especificaciones: {$marcaModelo}";
        }
        if ($estado !== '') {
            $descripcionBien .= "\nEstado de conservación: {$estado}";
        }
        if ($establecimiento !== '') {
            $descripcionBien .= "\nEstablecimiento destino: {$establecimiento}";
        }

        $systemPrompt = <<<PROMPT
Eres un asistente experto en clasificación y gestión patrimonial para el Servicio Local de Educación Pública (SLEP) Los Libertadores.
Tu labor es clasificar un bien mueble institucional asignándole EXACTAMENTE UNA de las categorías del catálogo oficial predefinido.

CATÁLOGO OFICIAL DE CATEGORÍAS PERMITIDAS:
{$textoCatalogo}

REGLAS ESTRICTAS:
1. El campo "categoria_sugerida" DEBE ser una de las opciones textuales del catálogo oficial. No inventes categorías nuevas.
2. Si ninguna categoría específica aplica claramente, usa "Otros bienes muebles".
3. Proporciona una "justificacion" breve (máximo 2 oraciones en español formal) fundamentando la sugerencia según la naturaleza del bien.
4. El campo "confianza" debe ser exactamente "alta", "media" o "baja".
5. En "atributos_clave", lista de 1 a 3 características o términos clave del bien que justificaron la elección (ej: "RAM 16GB", "Pantalla táctil", "Mobiliario estudiantil").
PROMPT;

        $mensajes = [
            [
                'role' => 'system',
                'content' => $systemPrompt,
            ],
            [
                'role' => 'user',
                'content' => "Clasifica el siguiente activo patrimonial:\n\n{$descripcionBien}",
            ],
        ];

        $jsonSchema = [
            'type' => 'object',
            'properties' => [
                'categoria_sugerida' => [
                    'type' => 'string',
                    'enum' => $categoriasPermitidas,
                ],
                'justificacion' => [
                    'type' => 'string',
                ],
                'confianza' => [
                    'type' => 'string',
                    'enum' => ['alta', 'media', 'baja'],
                ],
                'atributos_clave' => [
                    'type' => 'array',
                    'items' => ['type' => 'string'],
                ],
            ],
            'required' => ['categoria_sugerida', 'justificacion', 'confianza'],
        ];

        // Opciones de inferencia orientadas a baja latencia y reproducibilidad
        $opcionesInferencia = [
            'temperature' => 0.1, // Respuesta determinista
            'num_predict' => 256, // Respuesta concisa
        ];

        $inicio = microtime(true);
        $respuesta = $this->client->chatJson($mensajes, $jsonSchema, $opcionesInferencia);
        $duracionMs = round((microtime(true) - $inicio) * 1000);

        Log::info('Sugerencia de categoría IA generada', [
            'activo' => $nombre,
            'categoria' => $respuesta['categoria_sugerida'] ?? null,
            'duracion_ms' => $duracionMs,
        ]);

        // Validación exhaustiva de la respuesta devuelta por el LLM
        $categoriaSugerida = trim((string) ($respuesta['categoria_sugerida'] ?? ''));
        $justificacion = trim((string) ($respuesta['justificacion'] ?? ''));
        $confianza = strtolower(trim((string) ($respuesta['confianza'] ?? 'media')));
        $atributos = is_array($respuesta['atributos_clave'] ?? null) ? $respuesta['atributos_clave'] : [];

        // Normalización y búsqueda en catálogo (case-insensitive fallback si hubo variación sutil)
        $categoriaValida = null;
        foreach ($categoriasPermitidas as $catOficial) {
            if (strcasecmp($catOficial, $categoriaSugerida) === 0) {
                $categoriaValida = $catOficial;
                break;
            }
        }

        if ($categoriaValida === null) {
            throw new RespuestaIaInvalidaException("La categoría sugerida '{$categoriaSugerida}' no pertenece al catálogo oficial de SLEP.");
        }

        if ($justificacion === '') {
            $justificacion = "Clasificación sugerida en base a la descripción del activo ({$categoriaValida}).";
        }

        if (!in_array($confianza, ['alta', 'media', 'baja'], true)) {
            $confianza = 'media';
        }

        return [
            'categoria_sugerida' => $categoriaValida,
            'justificacion' => $justificacion,
            'confianza' => $confianza,
            'atributos_clave' => array_values(array_slice($atributos, 0, 5)),
            'modelo_utilizado' => $this->client->modelo(),
            'catalogo_version' => (string) config('categorias_activos.version', '2026.10'),
        ];
    }
}
