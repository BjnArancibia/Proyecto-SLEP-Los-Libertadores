<?php

namespace App\Services\Ia\Exceptions;

use RuntimeException;

/**
 * El modelo respondió, pero el contenido no cumple el contrato esperado
 * (JSON inválido, categoría fuera del catálogo, campos vacíos...).
 * El controlador la traduce a HTTP 502.
 */
class RespuestaIaInvalidaException extends RuntimeException
{
}
