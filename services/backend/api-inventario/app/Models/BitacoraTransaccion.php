<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BitacoraTransaccion extends Model
{
    use HasFactory;

    protected $table = 'bitacora_transacciones';

    protected $fillable = [
        'folio',
        'fecha_hora',
        'usuario_id',
        'usuario_nombre',
        'usuario_perfil',
        'modulo',
        'accion',
        'decision',
        'justificacion',
        'valores_anteriores',
        'valores_posteriores',
        'ip_origen',
    ];

    protected $casts = [
        'fecha_hora' => 'datetime',
        'valores_anteriores' => 'array',
        'valores_posteriores' => 'array',
    ];
}
