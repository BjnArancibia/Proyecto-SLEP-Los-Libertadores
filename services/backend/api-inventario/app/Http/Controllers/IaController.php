<?php

namespace App\Http\Controllers;

use App\Services\Ia\Exceptions\IaNoDisponibleException;
use App\Services\Ia\Exceptions\RespuestaIaInvalidaException;
use App\Services\Ia\OllamaClient;
use App\Services\Ia\SugerenciaCategoriaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class IaController extends Controller
{
    private SugerenciaCategoriaService $sugerenciaService;
    private OllamaClient $ollamaClient;

    public function __construct(
        SugerenciaCategoriaService $sugerenciaService,
        OllamaClient $ollamaClient
    ) {
        $this->sugerenciaService = $sugerenciaService;
        $this->ollamaClient = $ollamaClient;
    }

    /**
     * Endpoint para solicitar sugerencia de categoría para un bien.
     * POST /api/ia/sugerir-categoria
     */
    public function sugerirCategoria(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => 'required|string|min:2|max:255',
            'marca_modelo' => 'nullable|string|max:255',
            'estado_conservacion' => 'nullable|string|max:100',
            'establecimiento' => 'nullable|string|max:255',
        ], [
            'nombre.required' => 'El nombre o descripción del bien es obligatorio para generar una sugerencia.',
            'nombre.min' => 'El nombre del bien debe contener al menos 2 caracteres.',
        ]);

        try {
            $resultado = $this->sugerenciaService->sugerir($validated);

            return response()->json([
                'success' => true,
                'data' => $resultado,
            ], 200);
        } catch (IaNoDisponibleException $e) {
            Log::warning('IA Ollama no disponible al sugerir categoría', [
                'error' => $e->getMessage(),
                'activo' => $validated['nombre'],
            ]);

            return response()->json([
                'success' => false,
                'error' => 'ia_no_disponible',
                'message' => 'El asistente de IA local (Ollama) no se encuentra disponible. Puede continuar con el registro manual del activo sin interrupción.',
                'detalle' => $e->getMessage(),
            ], 503);
        } catch (RespuestaIaInvalidaException $e) {
            Log::error('Respuesta de IA inválida o fuera de catálogo', [
                'error' => $e->getMessage(),
                'activo' => $validated['nombre'],
            ]);

            return response()->json([
                'success' => false,
                'error' => 'respuesta_invalida',
                'message' => 'La sugerencia generada por la IA no pudo validarse contra el catálogo oficial. Seleccione la categoría manualmente.',
                'detalle' => $e->getMessage(),
            ], 502);
        } catch (\Throwable $e) {
            Log::error('Error inesperado al invocar IA', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'error_interno',
                'message' => 'Ocurrió un error inesperado al procesar la sugerencia.',
            ], 500);
        }
    }

    /**
     * Comprobación del estado de conexión con Ollama y verificación del modelo.
     * GET /api/ia/estado
     */
    public function estado(): JsonResponse
    {
        $estado = $this->ollamaClient->estado();

        return response()->json([
            'habilitado' => (bool) config('services.ollama.enabled', true),
            'servidor_ollama' => $estado['disponible'] ? 'conectado' : 'desconectado',
            'modelo_configurado' => $this->ollamaClient->modelo(),
            'modelo_descargado' => $estado['modelo_descargado'],
            'catalogo_version' => config('categorias_activos.version', '2026.10'),
            'total_categorias' => count(config('categorias_activos.categorias', [])),
        ], $estado['disponible'] ? 200 : 503);
    }

    /**
     * Catálogo oficial de categorías de activos y sus descripciones.
     * GET /api/ia/categorias
     */
    public function categorias(): JsonResponse
    {
        return response()->json([
            'version' => config('categorias_activos.version', '2026.10'),
            'categorias' => config('categorias_activos.categorias', []),
        ], 200);
    }
}
