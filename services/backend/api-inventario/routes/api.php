<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AssetController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\MovimientoController;
use App\Http\Controllers\KardexController;
use App\Http\Controllers\BitacoraController;

Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/movimientos/reset', [MovimientoController::class, 'reset']);
Route::post('/kardex/reset', [KardexController::class, 'reset']);
Route::post('/bitacora/reset', [BitacoraController::class, 'reset']);
Route::get('/bitacora', [BitacoraController::class, 'index']);

Route::prefix('activos')->group(function () {
    Route::get('/', [AssetController::class, 'index']);
    Route::post('/', [AssetController::class, 'store']);
    Route::get('/{id}', [AssetController::class, 'show']);
    Route::put('/{id}', [AssetController::class, 'update']);
});

Route::prefix('movimientos')->group(function () {
    Route::get('/', [MovimientoController::class, 'index']);
    Route::post('/', [MovimientoController::class, 'store']);
    Route::post('/{id}/resolver', [MovimientoController::class, 'resolver']);
});

Route::prefix('kardex')->group(function () {
    Route::get('/', [KardexController::class, 'index']);
    Route::post('/', [KardexController::class, 'store']);
});

Route::prefix('bitacora')->group(function () {
    Route::get('/', [BitacoraController::class, 'index']);
    Route::get('/{id}', [BitacoraController::class, 'show']);
    Route::post('/', [BitacoraController::class, 'store']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::post('/auth/logout', [AuthController::class, 'logout']);
});

