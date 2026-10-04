<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Solicitante
        User::updateOrCreate(['email' => 'carmen.tapia@slep.cl'], [
            'name' => 'Carmen',
            'apellido' => 'Tapia',
            'email' => 'carmen.tapia@slep.cl',
            'password' => bcrypt('password123'),
            'rol' => 'SOLICITANTE',
            'establecimiento_id' => 1,
            'establecimiento_nombre' => 'Escuela Los Andes',
        ]);

        // 2. Aprobador
        User::updateOrCreate(['email' => 'pedro.henriquez@slep.cl'], [
            'name' => 'Pedro',
            'apellido' => 'Henríquez',
            'email' => 'pedro.henriquez@slep.cl',
            'password' => bcrypt('password123'),
            'rol' => 'APROBADOR',
            'establecimiento_id' => 1,
            'establecimiento_nombre' => 'Escuela Los Andes',
        ]);

        // 3. Encargado de Bodega
        User::updateOrCreate(['email' => 'rodrigo.soto@slep.cl'], [
            'name' => 'Rodrigo',
            'apellido' => 'Soto',
            'email' => 'rodrigo.soto@slep.cl',
            'password' => bcrypt('password123'),
            'rol' => 'ENCARGADO_BODEGA',
            'establecimiento_id' => null,
            'establecimiento_nombre' => 'Bodega Central SLEP',
        ]);

        // 4. Admin
        User::updateOrCreate(['email' => 'admin@slep.cl'], [
            'name' => 'Admin',
            'apellido' => 'Sistema',
            'email' => 'admin@slep.cl',
            'password' => bcrypt('password123'),
            'rol' => 'ADMIN',
            'establecimiento_id' => null,
            'establecimiento_nombre' => 'Administración Central',
        ]);
    }
}
