<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    
    public function up(): void
    {
        Schema::create('bitacora_transacciones', function (Blueprint $table) {
            $table->id();
            $table->string('folio')->index(); 
            $table->dateTime('fecha_hora')->index(); // Fecha y hora del evento
            $table->unsignedBigInteger('usuario_id')->nullable();
            $table->string('usuario_nombre');
            $table->string('usuario_perfil'); 
            $table->string('modulo'); // activos, existencias, solicitudes
            $table->string('accion'); 
            $table->string('decision')->nullable(); // Aprobado, rechazado, pendiente
            $table->text('justificacion')->nullable(); 
            $table->json('valores_anteriores')->nullable(); 
            $table->json('valores_posteriores')->nullable(); 
            $table->string('ip_origen')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bitacora_transacciones');
    }
};
