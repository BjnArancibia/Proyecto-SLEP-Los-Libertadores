<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BitacoraMovimiento extends Model
{
    use HasFactory;

    protected $fillable = [
        'movimiento_id',
        'accion',
        'usuario_nombre',
        'usuario_rol',
        'tipo_punto'
    ];

    public function movimiento()
    {
        return $this->belongsTo(Movimiento::class);
    }
}
