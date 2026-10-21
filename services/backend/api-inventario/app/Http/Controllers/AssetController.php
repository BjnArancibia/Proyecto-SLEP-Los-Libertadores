<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Http\Requests\StoreAssetRequest;
use App\Services\AuditoriaService;
use Illuminate\Http\Request;

class AssetController extends Controller
{
  
    public function index()
    {
        return response()->json(Asset::all(), 200);
    }

    
    public function store(StoreAssetRequest $request)
    {
        $asset = Asset::create($request->validated());

        // Registrar la acción en la auditoría
        AuditoriaService::registrar([
            'folio' => $asset->numero_patrimonial,
            'usuario_id' => $request->user()?->id,
            'usuario_nombre' => $request->user() ? ($request->user()->name . ' ' . ($request->user()->apellido ?? '')) : 'Administrador',
            'usuario_perfil' => $request->user()?->rol ?? 'ADMIN',
            'modulo' => 'ACTIVOS',
            'accion' => 'Alta de Activo Fijo',
            'decision' => 'REGISTRADO',
            'justificacion' => $request->input('justificacion', 'Incorporación de activo al inventario patrimonial'),
            'valores_anteriores' => null,
            'valores_posteriores' => [
                'numero_patrimonial' => $asset->numero_patrimonial,
                'numero_serie' => $asset->numero_serie,
                'nombre' => $asset->nombre,
                'marca_modelo' => $asset->marca_modelo,
                'estado_conservacion' => $asset->estado_conservacion,
                'establecimiento' => $asset->establecimiento,
                'dependencia_sala' => $asset->dependencia_sala,
                'custodio' => $asset->custodio,
            ],
        ]);

        return response()->json([
            'message' => 'Activo registrado correctamente',
            'data' => $asset
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $asset = Asset::find($id);
        if (!$asset) {
            return response()->json(['message' => 'Activo no encontrado'], 404);
        }

        $valoresAnteriores = [
            'numero_patrimonial' => $asset->numero_patrimonial,
            'numero_serie' => $asset->numero_serie,
            'nombre' => $asset->nombre,
            'marca_modelo' => $asset->marca_modelo,
            'estado_conservacion' => $asset->estado_conservacion,
            'establecimiento' => $asset->establecimiento,
            'dependencia_sala' => $asset->dependencia_sala,
            'custodio' => $asset->custodio,
        ];

        $asset->update($request->only([
            'nombre',
            'numero_serie',
            'marca_modelo',
            'estado_conservacion',
            'establecimiento',
            'dependencia_sala',
            'custodio'
        ]));

        $valoresPosteriores = [
            'numero_patrimonial' => $asset->numero_patrimonial,
            'numero_serie' => $asset->numero_serie,
            'nombre' => $asset->nombre,
            'marca_modelo' => $asset->marca_modelo,
            'estado_conservacion' => $asset->estado_conservacion,
            'establecimiento' => $asset->establecimiento,
            'dependencia_sala' => $asset->dependencia_sala,
            'custodio' => $asset->custodio,
        ];

        AuditoriaService::registrar([
            'folio' => $asset->numero_patrimonial,
            'usuario_id' => $request->user()?->id,
            'usuario_nombre' => $request->user() ? ($request->user()->name . ' ' . ($request->user()->apellido ?? '')) : 'Administrador',
            'usuario_perfil' => $request->user()?->rol ?? 'ADMIN',
            'modulo' => 'ACTIVOS',
            'accion' => 'Modificación de Activo Fijo',
            'decision' => 'ACTUALIZADO',
            'justificacion' => $request->input('justificacion', 'Actualización de ficha patrimonial'),
            'valores_anteriores' => $valoresAnteriores,
            'valores_posteriores' => $valoresPosteriores,
        ]);

        return response()->json([
            'message' => 'Activo actualizado correctamente',
            'data' => $asset
        ]);
    }

    public function show($id)
    {
        $asset = Asset::find($id);

        if (!$asset) {
            return response()->json(['message' => 'Activo no encontrado'], 404);
        }

        return response()->json($asset, 200);
    }
}
