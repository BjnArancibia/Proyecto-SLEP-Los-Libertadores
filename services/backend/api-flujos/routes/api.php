<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MovimientoController;
use App\Http\Controllers\BitacoraController;
use Illuminate\Support\Facades\DB;

/*
|--------------------------------------------------------------------------
| Microservicio: API de Flujos y Auditoría (SLEP Los Libertadores)
| Responsabilidad: Flujo de movimientos con segregación (RF-03) y bitácora auditable (RF-05)
|--------------------------------------------------------------------------
*/

Route::post('/movimientos/reset', [MovimientoController::class, 'reset']);
Route::prefix('movimientos')->group(function () {
    Route::get('/', [MovimientoController::class, 'index']);
    Route::post('/', [MovimientoController::class, 'store']);
    Route::post('/{id}/resolver', [MovimientoController::class, 'resolver']);
});

Route::post('/bitacora/reset', [BitacoraController::class, 'reset']);
Route::prefix('bitacora')->group(function () {
    Route::get('/', [BitacoraController::class, 'index']);
    Route::get('/{id}', [BitacoraController::class, 'show']);
    Route::post('/', [BitacoraController::class, 'store']);
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
        'service'   => 'api-flujos',
        'status'    => ($dbStatus === 'connected') ? 'UP' : 'DEGRADED',
        'timestamp' => now()->toIso8601String(),
        'database'  => $dbStatus,
        'hostname'  => gethostname()
    ], ($dbStatus === 'connected') ? 200 : 503);
});
