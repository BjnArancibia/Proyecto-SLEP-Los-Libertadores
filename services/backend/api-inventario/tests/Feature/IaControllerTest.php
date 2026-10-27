<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class IaControllerTest extends TestCase
{
    public function test_endpoint_categorias_retorna_catalogo_oficial(): void
    {
        $response = $this->getJson('/api/ia/categorias');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'version',
                'categorias' => [
                    'Equipos computacionales — Notebooks y portátiles',
                    'Mobiliario escolar — Mesas y sillas de estudiantes',
                ],
            ]);
    }

    public function test_sugerir_categoria_valida_campo_nombre_obligatorio(): void
    {
        $response = $this->postJson('/api/ia/sugerir-categoria', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['nombre']);
    }

    public function test_sugerir_categoria_retorna_503_si_ollama_esta_caido(): void
    {
        // Simular fallo de conexión con Ollama
        Http::fake([
            '*/api/chat' => Http::failedConnection('Connection refused'),
        ]);

        $response = $this->postJson('/api/ia/sugerir-categoria', [
            'nombre' => 'Notebook Lenovo ThinkPad',
            'marca_modelo' => 'L14 Gen 3, 16GB RAM',
        ]);

        $response->assertStatus(503)
            ->assertJson([
                'success' => false,
                'error' => 'ia_no_disponible',
            ]);
    }

    public function test_sugerir_categoria_retorna_sugerencia_valida_con_mock_ollama(): void
    {
        $categoriaValida = 'Equipos computacionales — Notebooks y portátiles';

        Http::fake([
            '*/api/chat' => Http::response([
                'message' => [
                    'role' => 'assistant',
                    'content' => json_encode([
                        'categoria_sugerida' => $categoriaValida,
                        'justificacion' => 'Corresponde a un computador portátil de uso administrativo o docente.',
                        'confianza' => 'alta',
                        'atributos_clave' => ['Portátil', '16GB RAM', 'Lenovo ThinkPad'],
                    ]),
                ],
            ], 200),
        ]);

        $response = $this->postJson('/api/ia/sugerir-categoria', [
            'nombre' => 'Notebook Lenovo ThinkPad L14',
            'marca_modelo' => 'Intel Core i5, 16GB RAM, SSD 512GB',
            'estado_conservacion' => 'Bueno',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'categoria_sugerida' => $categoriaValida,
                    'confianza' => 'alta',
                ],
            ]);
    }

    public function test_sugerir_categoria_rechaza_categoria_fuera_de_catalogo(): void
    {
        Http::fake([
            '*/api/chat' => Http::response([
                'message' => [
                    'role' => 'assistant',
                    'content' => json_encode([
                        'categoria_sugerida' => 'Categoría Inventada Que No Existe',
                        'justificacion' => 'No válida.',
                        'confianza' => 'baja',
                        'atributos_clave' => [],
                    ]),
                ],
            ], 200),
        ]);

        $response = $this->postJson('/api/ia/sugerir-categoria', [
            'nombre' => 'Objeto Desconocido',
        ]);

        $response->assertStatus(502)
            ->assertJson([
                'success' => false,
                'error' => 'respuesta_invalida',
            ]);
    }

    public function test_estado_ollama_reporta_desconectado_cuando_falla_endpoint(): void
    {
        Http::fake([
            '*/api/tags' => Http::failedConnection('Connection refused'),
        ]);

        $response = $this->getJson('/api/ia/estado');

        $response->assertStatus(503)
            ->assertJson([
                'servidor_ollama' => 'desconectado',
            ]);
    }
}
