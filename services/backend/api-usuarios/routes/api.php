<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\DB;

/*
|--------------------------------------------------------------------------
| Microservicio: API de Usuarios y Autenticación (SLEP Los Libertadores)
| Responsabilidad: Gestión de acceso, roles y perfiles (RF-01)
|--------------------------------------------------------------------------
*/

Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::post('/auth/logout', [AuthController::class, 'logout']);
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
        'service'   => 'api-usuarios',
        'status'    => ($dbStatus === 'connected') ? 'UP' : 'DEGRADED',
        'timestamp' => now()->toIso8601String(),
        'database'  => $dbStatus,
        'hostname'  => gethostname()
    ], ($dbStatus === 'connected') ? 200 : 503);
});
