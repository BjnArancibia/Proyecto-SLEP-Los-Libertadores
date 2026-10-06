<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Kardex extends Model
{
    use HasFactory;

    protected $fillable = [
        'activo_codigo',
        'activo_nombre',
        'fecha_registro',
        'tipo_movimiento',
        'origen_destino',
        'responsable',
        'cantidad',
        'saldo',
        'estado_stock',
        'documento_respaldo'
    ];
}
