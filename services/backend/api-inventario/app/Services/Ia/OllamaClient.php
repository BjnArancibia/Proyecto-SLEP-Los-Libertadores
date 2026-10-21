<?php

namespace App\Services\Ia;

use App\Services\Ia\Exceptions\IaNoDisponibleException;
use App\Services\Ia\Exceptions\RespuestaIaInvalidaException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

/**
 * Cliente HTTP mínimo para la API REST de Ollama (/api/chat y /api/tags).
 *
 * No contiene lógica de negocio: solo transporte, timeouts y traducción de
 * errores de red/HTTP a excepciones de dominio.
 */
class OllamaClient
{
    private string $baseUrl;
    private string $model;
    private int $timeout;
    private int $connectTimeout;
    private string|int $keepAlive;

    public function __construct(
        ?string $baseUrl = null,
        ?string $model = null,
        ?int $timeout = null,
        ?int $connectTimeout = null,
        string|int|null $keepAlive = null,
    ) {
        $this->baseUrl = $baseUrl ?? (string) config('services.ollama.base_url');
        $this->model = $model ?? (string) config('services.ollama.model');
        $this->timeout = $timeout ?? (int) config('services.ollama.timeout', 60);
        $this->connectTimeout = $connectTimeout ?? (int) config('services.ollama.connect_timeout', 3);
        $this->keepAlive = $keepAlive ?? config('services.ollama.keep_alive', '10m');
    }

    public function modelo(): string
    {
        return $this->model;
    }

    /**
     * Envía una conversación a /api/chat exigiendo salida estructurada
     * (JSON Schema en el campo "format") y devuelve el JSON decodificado.
     *
     * @param  array<int, array{role: string, content: string}>  $mensajes
     * @param  array<string, mixed>  $schema
     * @param  array<string, mixed>  $opciones
     * @return array<string, mixed>
     *
     * @throws IaNoDisponibleException
     * @throws RespuestaIaInvalidaException
     */
    public function chatJson(array $mensajes, array $schema, array $opciones = []): array
    {
        try {
            $respuesta = Http::baseUrl($this->baseUrl)
                ->acceptJson()
                ->connectTimeout($this->connectTimeout)
                ->timeout($this->timeout)
                ->post('/api/chat', [
                    'model' => $this->model,
                    'messages' => $mensajes,
                    'stream' => false,
                    'format' => $schema,
                    'keep_alive' => $this->keepAlive,
                    'options' => $opciones,
                ]);
        } catch (ConnectionException $e) {
            // Incluye "connection refused", DNS y timeouts de cURL.
            throw new IaNoDisponibleException('No fue posible conectar con Ollama: '.$e->getMessage(), 0, $e);
        }

        if ($respuesta->status() === 404) {
            throw new IaNoDisponibleException("El modelo '{$this->model}' no está descargado en Ollama.");
        }

        if ($respuesta->failed()) {
            throw new IaNoDisponibleException('Ollama respondió HTTP '.$respuesta->status().'.');
        }

        $contenido = $respuesta->json('message.content');

        if (! is_string($contenido) || trim($contenido) === '') {
            throw new RespuestaIaInvalidaException('Ollama devolvió una respuesta vacía.');
        }

        $datos = json_decode($contenido, true);

        if (! is_array($datos)) {
            throw new RespuestaIaInvalidaException('La respuesta del modelo no es un JSON válido.');
        }

        return $datos;
    }

    /**
     * Comprobación ligera de disponibilidad: servidor accesible y modelo descargado.
     *
     * @return array{disponible: bool, modelo_descargado: bool}
     */
    public function estado(): array
    {
        try {
            $respuesta = Http::baseUrl($this->baseUrl)
                ->acceptJson()
                ->connectTimeout($this->connectTimeout)
                ->timeout(5)
                ->get('/api/tags');
        } catch (ConnectionException) {
            return ['disponible' => false, 'modelo_descargado' => false];
        }

        if ($respuesta->failed()) {
            return ['disponible' => false, 'modelo_descargado' => false];
        }

        $modelos = collect($respuesta->json('models', []))
            ->flatMap(fn ($m) => [$m['name'] ?? null, $m['model'] ?? null])
            ->filter()
            ->all();

        return [
            'disponible' => true,
            'modelo_descargado' => in_array($this->model, $modelos, true),
        ];
    }
}
