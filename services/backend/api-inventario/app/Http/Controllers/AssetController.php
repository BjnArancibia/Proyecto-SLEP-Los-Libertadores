<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Http\Requests\StoreAssetRequest;
use Illuminate\Http\Request;

class AssetController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json(Asset::all(), 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreAssetRequest $request)
    {
        $asset = Asset::create($request->validated());

        return response()->json([
            'message' => 'Activo registrado correctamente',
            'data' => $asset
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $asset = Asset::find($id);

        if (!$asset) {
            return response()->json(['message' => 'Activo no encontrado'], 404);
        }

        return response()->json($asset, 200);
    }
}
