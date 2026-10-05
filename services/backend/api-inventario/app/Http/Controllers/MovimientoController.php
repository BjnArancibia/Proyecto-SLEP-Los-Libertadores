<?php

namespace App\Http\Controllers;

use App\Models\Movimiento;
use App\Models\BitacoraMovimiento;
use Illuminate\Http\Request;

class MovimientoController extends Controller
{
    public function index()
    {
        $movimientos = Movimiento::with('bitacora')->orderBy('created_at', 'desc')->get();
        return response()->json($movimientos);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'tipo' => 'required|string',
            'activo_codigo' => 'required|string',
            'activo_nombre' => 'required|string',
            'origen' => 'required|string',
            'destino' => 'required|string',
            'justificacion' => 'nullable|string',
        ]);

        $user = $request->user();

        $codigo = 'SOL-' . date('Y') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);

        $movimiento = Movimiento::create([
            'codigo_solicitud' => $codigo,
            'tipo' => $data['tipo'],
            'estado' => 'PENDIENTE_REVISION',
            'activo_codigo' => $data['activo_codigo'],
            'activo_nombre' => $data['activo_nombre'],
            'origen' => $data['origen'],
            'destino' => $data['destino'],
            'solicitante_id' => $user->id,
            'solicitante_nombre' => $user->name . ' ' . $user->apellido,
            'solicitante_rol' => $user->rol,
            'solicitante_establecimiento' => $user->establecimiento_nombre,
            'justificacion' => $data['justificacion'] ?? null,
        ]);

        BitacoraMovimiento::create([
            'movimiento_id' => $movimiento->id,
            'accion' => 'Solicitud creada y enviada a revisión',
            'usuario_nombre' => $user->name . ' ' . $user->apellido,
            'usuario_rol' => $user->rol,
            'tipo_punto' => 'verde'
        ]);

        return response()->json($movimiento->load('bitacora'), 201);
    }

    public function reset()
    {
        BitacoraMovimiento::query()->delete();
        Movimiento::query()->delete();

        $sol1 = Movimiento::create([
            'codigo_solicitud' => 'SOL-2026-0421',
            'tipo' => 'TRASLADO',
            'estado' => 'PENDIENTE_REVISION',
            'activo_codigo' => 'AF-2023-01847',
            'activo_nombre' => 'Escritorio ejecutivo ergonómico',
            'origen' => 'Esc. Los Andes',
            'destino' => 'Esc. El Palqui',
            'solicitante_id' => 1,
            'solicitante_nombre' => 'Carmen Tapia',
            'solicitante_rol' => 'SOLICITANTE',
            'solicitante_establecimiento' => 'Escuela Los Andes',
            'justificacion' => 'Necesidad urgente de mobiliario para sala de profesores de sede El Palqui.',
        ]);

        BitacoraMovimiento::create([
            'movimiento_id' => $sol1->id,
            'accion' => 'Solicitud creada y enviada a revisión',
            'usuario_nombre' => 'Carmen Tapia',
            'usuario_rol' => 'SOLICITANTE',
            'tipo_punto' => 'verde'
        ]);

        $sol2 = Movimiento::create([
            'codigo_solicitud' => 'SOL-2026-0422',
            'tipo' => 'BAJA',
            'estado' => 'PENDIENTE_REVISION',
            'activo_codigo' => 'AF-2021-00912',
            'activo_nombre' => 'Servidor ProLiant DL380 G9',
            'origen' => 'Bodega Central SLEP',
            'destino' => 'Baja definitiva / Reciclaje RAEE',
            'solicitante_id' => 2,
            'solicitante_nombre' => 'Pedro Henríquez',
            'solicitante_rol' => 'APROBADOR',
            'solicitante_establecimiento' => 'Escuela Los Andes',
            'justificacion' => 'Equipo con placa madre dañada y fuera de garantía. Declarado irreparable por soporte TI.',
        ]);

        BitacoraMovimiento::create([
            'movimiento_id' => $sol2->id,
            'accion' => 'Solicitud de baja creada por Pedro Henríquez',
            'usuario_nombre' => 'Pedro Henríquez',
            'usuario_rol' => 'APROBADOR',
            'tipo_punto' => 'verde'
        ]);

        return response()->json(['message' => 'Solicitudes reiniciadas en BD exitosamente']);
    }
}
