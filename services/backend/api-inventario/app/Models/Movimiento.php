<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Movimiento extends Model
{
    use HasFactory;

    protected $fillable = [
        'codigo_solicitud',
        'tipo',
        'estado',
        'activo_codigo',
        'activo_nombre',
        'origen',
        'destino',
        'solicitante_id',
        'solicitante_nombre',
        'solicitante_rol',
        'solicitante_establecimiento',
        'justificacion'
    ];

    public function bitacora()
    {
        return $this->hasMany(BitacoraMovimiento::class);
    }

    public function solicitante()
    {
        return $this->belongsTo(User::class, 'solicitante_id');
    }
}
