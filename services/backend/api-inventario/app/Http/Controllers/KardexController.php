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
}
