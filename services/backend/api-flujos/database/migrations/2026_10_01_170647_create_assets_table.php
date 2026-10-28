<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('assets', function (Blueprint $table) {
            $table->id();
            $table->string('numero_patrimonial')->unique();
            $table->string('numero_serie')->nullable();
            $table->string('nombre');
            $table->string('marca_modelo')->nullable();
            $table->string('estado_conservacion');
            $table->string('establecimiento');
            $table->string('dependencia_sala')->nullable();
            $table->string('custodio')->nullable();
            $table->string('categoria_sugerida_ia')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assets');
    }
};
