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
}
