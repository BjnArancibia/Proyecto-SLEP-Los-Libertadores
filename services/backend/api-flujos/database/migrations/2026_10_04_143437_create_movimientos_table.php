<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('movimientos', function (Blueprint $table) {
            $table->id();
            $table->string('codigo_solicitud')->unique(); // e.g. SOL-2026-0421
            $table->enum('tipo', ['TRASLADO', 'BAJA']);
            $table->enum('estado', ['PENDIENTE_REVISION', 'APROBADO', 'RECHAZADO', 'COMPLETADO'])->default('PENDIENTE_REVISION');
            
            $table->string('activo_codigo');
            $table->string('activo_nombre');
            
            $table->string('origen');
            $table->string('destino');
            
            $table->unsignedBigInteger('solicitante_id');
            $table->string('solicitante_nombre');
            $table->string('solicitante_rol');
            $table->string('solicitante_establecimiento');
            
            $table->text('justificacion')->nullable();
            
            $table->timestamps();

            $table->foreign('solicitante_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('movimientos');
    }
};
