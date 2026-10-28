<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AssetController;
use App\Http\Controllers\KardexController;
use App\Http\Controllers\IaController;
use Illuminate\Support\Facades\DB;

/*
|--------------------------------------------------------------------------
| Microservicio: API de Inventario, Kardex e IA (SLEP Los Libertadores)
| Responsabilidad: Gestión patrimonial (RF-02), Kardex (RF-04) y asistente IA
|--------------------------------------------------------------------------
*/

Route::prefix('activos')->group(function () {
    Route::get('/', [AssetController::class, 'index']);
    Route::post('/', [AssetController::class, 'store']);
    Route::get('/{id}', [AssetController::class, 'show']);
    Route::put('/{id}', [AssetController::class, 'update']);
});

Route::prefix('ia')->group(function () {
    Route::post('/sugerir-categoria', [IaController::class, 'sugerirCategoria']);
    Route::get('/estado', [IaController::class, 'estado']);
    Route::get('/categorias', [IaController::class, 'categorias']);
});

Route::post('/kardex/reset', [KardexController::class, 'reset']);
Route::prefix('kardex')->group(function () {
    Route::get('/', [KardexController::class, 'index']);
    Route::post('/', [KardexController::class, 'store']);
});

Route::get('/health', function () {
    $dbStatus = 'disconnected';
    try {
        DB::connection()->getPdo();
        $dbStatus = 'connected';
    } catch (\Exception $e) {
        $dbStatus = 'error: ' . $e->getMessage();
    }

    return response()->json([
        'service'   => 'api-inventario',
        'status'    => ($dbStatus === 'connected') ? 'UP' : 'DEGRADED',
        'timestamp' => now()->toIso8601String(),
        'database'  => $dbStatus,
        'hostname'  => gethostname()
    ], ($dbStatus === 'connected') ? 200 : 503);
});
