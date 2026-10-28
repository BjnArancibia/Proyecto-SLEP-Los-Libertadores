<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bitacora_movimientos', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('movimiento_id');
            $table->string('accion');
            $table->string('usuario_nombre');
            $table->string('usuario_rol')->nullable();
            $table->string('tipo_punto')->default('gris'); // verde, azul, gris
            
            $table->timestamps();

            $table->foreign('movimiento_id')->references('id')->on('movimientos')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bitacora_movimientos');
    }
};
