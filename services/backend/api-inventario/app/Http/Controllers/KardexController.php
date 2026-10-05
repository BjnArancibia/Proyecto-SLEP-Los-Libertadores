<?php

namespace App\Http\Controllers;

use App\Models\Kardex;
use Illuminate\Http\Request;

class KardexController extends Controller
{
    public function index()
    {
        $kardexes = Kardex::orderBy('created_at', 'desc')->get();
        return response()->json($kardexes);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'activo_codigo' => 'required|string',
            'activo_nombre' => 'required|string',
            'fecha_registro' => 'required|string',
            'tipo_movimiento' => 'required|string',
            'origen_destino' => 'required|string',
            'responsable' => 'required|string',
            'cantidad' => 'integer',
            'saldo' => 'integer',
            'estado_stock' => 'required|string',
            'documento_respaldo' => 'nullable|string'
        ]);

        $kardex = Kardex::create($data);
        return response()->json($kardex, 201);
    }

    public function reset()
    {
        Kardex::query()->delete();

        $movimientos = [
            [
                'activo_codigo' => 'INS-2024-00312',
                'activo_nombre' => 'Papel bond 75g A4 — Bodega central SLEP',
                'fecha_registro' => '08/09/2026 14:33',
                'tipo_movimiento' => 'SALIDA',
                'origen_destino' => '→ Liceo Bicentenario',
                'responsable' => 'C. Tapia',
                'cantidad' => -20,
                'saldo' => 122,
                'estado_stock' => 'DISPONIBLE',
                'documento_respaldo' => 'GD-8921'
            ],
            [
                'activo_codigo' => 'INS-2024-00312',
                'activo_nombre' => 'Papel bond 75g A4 — Bodega central SLEP',
                'fecha_registro' => '05/09/2026 09:11',
                'tipo_movimiento' => 'TRASLADO',
                'origen_destino' => '→ Esc. El Palqui',
                'responsable' => 'R. Fuentes',
                'cantidad' => -15,
                'saldo' => 142,
                'estado_stock' => 'DISPONIBLE',
                'documento_respaldo' => 'TRAS-2026-014'
            ],
            [
                'activo_codigo' => 'INS-2024-00312',
                'activo_nombre' => 'Papel bond 75g A4 — Bodega central SLEP',
                'fecha_registro' => '02/09/2026 16:45',
                'tipo_movimiento' => 'ENTRADA',
                'origen_destino' => 'Proveedor externo',
                'responsable' => 'J. Morales',
                'cantidad' => 100,
                'saldo' => 157,
                'estado_stock' => 'DISPONIBLE',
                'documento_respaldo' => 'FAC-44021'
            ],
            [
                'activo_codigo' => 'INS-2024-00312',
                'activo_nombre' => 'Papel bond 75g A4 — Bodega central SLEP',
                'fecha_registro' => '28/08/2026 11:20',
                'tipo_movimiento' => 'DEVOLUCION',
                'origen_destino' => '← Esc. Los Andes',
                'responsable' => 'M. Sepúlveda',
                'cantidad' => 30,
                'saldo' => 57,
                'estado_stock' => 'DISPONIBLE',
                'documento_respaldo' => 'DEV-2026-004'
            ],
        ];

        foreach ($movimientos as $mov) {
            Kardex::create($mov);
        }

        return response()->json([
            'message' => 'Kardex de bodega reiniciado en BD exitosamente',
            'registros_restablecidos' => count($movimientos)
        ]);
    }
}
