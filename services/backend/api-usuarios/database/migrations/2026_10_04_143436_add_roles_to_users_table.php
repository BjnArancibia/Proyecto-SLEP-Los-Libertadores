<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('apellido')->after('name')->nullable();
            $table->enum('rol', ['ADMIN', 'ENCARGADO_BODEGA', 'SOLICITANTE', 'APROBADOR'])->default('SOLICITANTE')->after('apellido');
            $table->unsignedBigInteger('establecimiento_id')->nullable()->after('rol');
            $table->string('establecimiento_nombre')->nullable()->after('establecimiento_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['apellido', 'rol', 'establecimiento_id', 'establecimiento_nombre']);
        });
    }
};
