<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Asset extends Model
{
    use HasFactory;

    protected $fillable = [
        'numero_patrimonial',
        'numero_serie',
        'nombre',
        'marca_modelo',
        'estado_conservacion',
        'establecimiento',
        'dependencia_sala',
        'custodio',
        'categoria_sugerida_ia',
    ];
}
