<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAssetRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Temporalmente autorizado para esta etapa (Unidad 1) sin autenticación
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'numero_patrimonial' => 'required|string|unique:assets,numero_patrimonial',
            'numero_serie' => 'nullable|string',
            'nombre' => 'required|string',
            'marca_modelo' => 'nullable|string',
            'estado_conservacion' => 'required|string',
            'establecimiento' => 'required|string',
            'dependencia_sala' => 'nullable|string',
            'custodio' => 'nullable|string',
            'categoria_sugerida_ia' => 'nullable|string',
        ];
    }
}
