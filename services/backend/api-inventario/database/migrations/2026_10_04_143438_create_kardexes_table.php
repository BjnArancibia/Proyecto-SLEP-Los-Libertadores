<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kardexes', function (Blueprint $table) {
            $table->id();
            $table->string('activo_codigo');
            $table->string('activo_nombre');
            $table->string('fecha_registro');
            $table->string('tipo_movimiento'); // INGRESO, TRASLADO, BAJA
            $table->string('origen_destino');
            $table->string('responsable');
            $table->integer('cantidad')->default(1);
            $table->integer('saldo')->default(1);
            $table->string('estado_stock'); // DISPONIBLE, EN_TRANSITO, DADO_DE_BAJA
            $table->string('documento_respaldo')->nullable();
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kardexes');
    }
};
