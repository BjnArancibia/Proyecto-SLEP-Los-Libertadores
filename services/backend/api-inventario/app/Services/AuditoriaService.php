<?php

namespace App\Services;

use App\Models\BitacoraTransaccion;
use Illuminate\Support\Facades\Request;

class AuditoriaService
{
    /**
     * Registra un evento en la bitácora  histórica
     *
     * @param array $datos {
     *   folio: string,
     *   usuario_id: int|null,
     *   usuario_nombre: string,
     *   usuario_perfil: string,
     *   modulo: string, // ACTIVOS, EXISTENCIAS, SOLICITUDES
     *   accion: string,
     *   decision: string|null,
     *   justificacion: string|null,
     *   valores_anteriores: array|null,
     *   valores_posteriores: array|null,
     *   fecha_hora: string|null,
     *   ip_origen: string|null
     * }
     * @return BitacoraTransaccion
     */
    public static function registrar(array $datos): BitacoraTransaccion
    {
        return BitacoraTransaccion::create([
            'folio' => $datos['folio'],
            'fecha_hora' => $datos['fecha_hora'] ?? now(),
            'usuario_id' => $datos['usuario_id'] ?? null,
            'usuario_nombre' => $datos['usuario_nombre'] ?? 'Sistema',
            'usuario_perfil' => $datos['usuario_perfil'] ?? 'SISTEMA',
            'modulo' => $datos['modulo'],
            'accion' => $datos['accion'],
            'decision' => $datos['decision'] ?? 'REGISTRADO',
            'justificacion' => $datos['justificacion'] ?? 'Operación registrada en sistema patrimonial',
            'valores_anteriores' => $datos['valores_anteriores'] ?? null,
            'valores_posteriores' => $datos['valores_posteriores'] ?? null,
            'ip_origen' => $datos['ip_origen'] ?? (Request::ip() ?? '127.0.0.1'),
        ]);
    }
}
