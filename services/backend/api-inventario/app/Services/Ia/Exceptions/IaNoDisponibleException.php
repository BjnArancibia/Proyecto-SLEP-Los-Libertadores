<?php

namespace App\Services\Ia\Exceptions;

use RuntimeException;

/**
 * Ollama no responde, no está habilitado o el modelo no está descargado.
 * El controlador la traduce a HTTP 503 sin afectar al resto del inventario.
 */
class IaNoDisponibleException extends RuntimeException
{
}
