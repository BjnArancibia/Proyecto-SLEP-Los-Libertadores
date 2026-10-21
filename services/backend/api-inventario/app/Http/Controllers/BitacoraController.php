<?php

namespace App\Http\Controllers;

use App\Models\BitacoraTransaccion;
use App\Services\AuditoriaService;
use Illuminate\Http\Request;

class BitacoraController extends Controller
{
    // Listado historico de transacciones
    public function index(Request $request)
    {
        $query = BitacoraTransaccion::query();

        if ($request->filled('folio')) {
            $query->where('folio', 'like', '%' . $request->folio . '%');
        }

        if ($request->filled('modulo')) {
            $query->where('modulo', $request->modulo);
        }

        if ($request->filled('decision')) {
            $query->where('decision', $request->decision);
        }

        if ($request->filled('usuario')) {
            $query->where(function ($q) use ($request) {
                $q->where('usuario_nombre', 'like', '%' . $request->usuario . '%')
                  ->orWhere('usuario_perfil', 'like', '%' . $request->usuario . '%');
            });
        }

        if ($request->filled('fecha_inicio')) {
            $query->whereDate('fecha_hora', '>=', $request->fecha_inicio);
        }

        if ($request->filled('fecha_fin')) {
            $query->whereDate('fecha_hora', '<=', $request->fecha_fin);
        }

        $transacciones = $query->orderBy('fecha_hora', 'desc')
                               ->orderBy('id', 'desc')
                               ->get();

        return response()->json($transacciones);
    }

    // Detalle de una transacción específica
    public function show($id)
    {
        $transaccion = BitacoraTransaccion::find($id);

        if (!$transaccion) {
            return response()->json(['message' => 'Registro de bitácora no encontrado'], 404);
        }

        return response()->json($transaccion);
    }

    // Registro de una nueva transacción de la bitácora
    public function store(Request $request)
    {
        $data = $request->validate([
            'folio' => 'required|string',
            'modulo' => 'required|string',
            'accion' => 'required|string',
            'decision' => 'nullable|string',
            'justificacion' => 'nullable|string',
            'valores_anteriores' => 'nullable|array',
            'valores_posteriores' => 'nullable|array',
            'usuario_nombre' => 'nullable|string',
            'usuario_perfil' => 'nullable|string',
        ]);

        $user = $request->user();

        $transaccion = AuditoriaService::registrar([
            'folio' => $data['folio'],
            'modulo' => $data['modulo'],
            'accion' => $data['accion'],
            'decision' => $data['decision'] ?? 'REGISTRADO',
            'justificacion' => $data['justificacion'] ?? 'Operación registrada en sistema',
            'valores_anteriores' => $data['valores_anteriores'] ?? null,
            'valores_posteriores' => $data['valores_posteriores'] ?? null,
            'usuario_id' => $user?->id,
            'usuario_nombre' => $data['usuario_nombre'] ?? ($user ? ($user->name . ' ' . ($user->apellido ?? '')) : 'Sistema'),
            'usuario_perfil' => $data['usuario_perfil'] ?? ($user?->rol ?? 'ADMIN'),
        ]);

        return response()->json([
            'message' => 'Evento de bitácora registrado exitosamente',
            'data' => $transaccion
        ], 201);
    }

    
    // Reinicia y precarga la bitácora con eventos históricos de prueba
     
    public function reset()
    {
        BitacoraTransaccion::query()->delete();

        // 1. Alta de Activo Patrimonial
        AuditoriaService::registrar([
            'folio' => 'AF-2023-01847',
            'fecha_hora' => now()->subDays(5)->setTime(9, 15, 0),
            'usuario_id' => 1,
            'usuario_nombre' => 'Carmen Tapia',
            'usuario_perfil' => 'SOLICITANTE',
            'modulo' => 'ACTIVOS',
            'accion' => 'Alta de Activo Fijo',
            'decision' => 'REGISTRADO',
            'justificacion' => 'Incorporación al patrimonio institucional según factura de compra F-88391.',
            'valores_anteriores' => null,
            'valores_posteriores' => [
                'numero_patrimonial' => 'AF-2023-01847',
                'nombre' => 'Escritorio ejecutivo ergonómico',
                'marca_modelo' => 'Steelcase Actiu Pro',
                'estado_conservacion' => 'Bueno',
                'establecimiento' => 'Bodega Central SLEP',
                'dependencia_sala' => 'Piso 1 - Recepción',
                'custodio' => 'Carmen Tapia'
            ],
        ]);

        // 2. Solicitud de Traslado Creada
        AuditoriaService::registrar([
            'folio' => 'SOL-2026-0421',
            'fecha_hora' => now()->subDays(3)->setTime(10, 30, 0),
            'usuario_id' => 1,
            'usuario_nombre' => 'Carmen Tapia',
            'usuario_perfil' => 'SOLICITANTE',
            'modulo' => 'SOLICITUDES',
            'accion' => 'Creación de Solicitud de Traslado',
            'decision' => 'PENDIENTE_REVISION',
            'justificacion' => 'Necesidad urgente de mobiliario para sala de profesores de sede El Palqui.',
            'valores_anteriores' => null,
            'valores_posteriores' => [
                'codigo_solicitud' => 'SOL-2026-0421',
                'tipo' => 'TRASLADO',
                'estado' => 'PENDIENTE_REVISION',
                'activo_codigo' => 'AF-2023-01847',
                'origen' => 'Esc. Los Andes',
                'destino' => 'Esc. El Palqui',
                'solicitante' => 'Carmen Tapia'
            ],
        ]);

        // 3. Aprobación de la Solicitud
        AuditoriaService::registrar([
            'folio' => 'SOL-2026-0421',
            'fecha_hora' => now()->subDays(2)->setTime(14, 20, 0),
            'usuario_id' => 2,
            'usuario_nombre' => 'Pedro Henríquez',
            'usuario_perfil' => 'APROBADOR',
            'modulo' => 'SOLICITUDES',
            'accion' => 'Resolución de Solicitud de Traslado',
            'decision' => 'APROBADO',
            'justificacion' => 'Aprobado tras verificar disponibilidad de inventario y justificación docente.',
            'valores_anteriores' => [
                'estado' => 'PENDIENTE_REVISION',
                'aprobador' => null,
                'fecha_resolucion' => null
            ],
            'valores_posteriores' => [
                'estado' => 'APROBADO',
                'aprobador' => 'Pedro Henríquez',
                'fecha_resolucion' => now()->subDays(2)->setTime(14, 20, 0)->toIso8601String()
            ],
        ]);

        // 4. Salida por Traslado en Existencias (Kardex Bodega)
        AuditoriaService::registrar([
            'folio' => 'KD-2026-0089',
            'fecha_hora' => now()->subDays(1)->setTime(8, 45, 0),
            'usuario_id' => 3,
            'usuario_nombre' => 'Raúl Morales',
            'usuario_perfil' => 'ENCARGADO_BODEGA',
            'modulo' => 'EXISTENCIAS',
            'accion' => 'Despacho de Traslado en Bodega',
            'decision' => 'EJECUTADO',
            'justificacion' => 'Entrega física a chofer institucional según guía de despacho GD-4491.',
            'valores_anteriores' => [
                'activo_codigo' => 'AF-2023-01847',
                'ubicacion_actual' => 'Esc. Los Andes',
                'estado_stock' => 'DISPONIBLE'
            ],
            'valores_posteriores' => [
                'activo_codigo' => 'AF-2023-01847',
                'ubicacion_actual' => 'Esc. El Palqui',
                'estado_stock' => 'EN_TRANSITO'
            ],
        ]);

        // 5. Ajuste de Auditoría Física en Existencias
        AuditoriaService::registrar([
            'folio' => 'KD-2026-0095',
            'fecha_hora' => now()->subHours(4)->setTime(16, 10, 0),
            'usuario_id' => 4,
            'usuario_nombre' => 'Valeska Soto',
            'usuario_perfil' => 'ADMIN',
            'modulo' => 'EXISTENCIAS',
            'accion' => 'Ajuste de Conteo Físico de Existencias',
            'decision' => 'AJUSTADO',
            'justificacion' => 'Corrección tras inventario trimestral sorpresivo de insumos en bodega central.',
            'valores_anteriores' => [
                'item_codigo' => 'INS-2026-0044',
                'item_nombre' => 'Papel Fotocopia Carta 75g',
                'saldo_stock' => 120,
                'estado' => 'DISPONIBLE'
            ],
            'valores_posteriores' => [
                'item_codigo' => 'INS-2026-0044',
                'item_nombre' => 'Papel Fotocopia Carta 75g',
                'saldo_stock' => 115,
                'diferencia' => -5,
                'estado' => 'DISPONIBLE'
            ],
        ]);

        return response()->json(['message' => 'Bitácora auditable inicializada con 5 transacciones históricas']);
    }
}
