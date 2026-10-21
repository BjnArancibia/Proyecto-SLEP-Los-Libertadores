<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Ollama (LLM local para sugerencias de categoría de activos)
    |--------------------------------------------------------------------------
    |
    | El backend es el único componente que habla con Ollama. El navegador
    | nunca recibe esta URL. Si Ollama no está disponible, el registro manual
    | de activos sigue funcionando (la IA es solo una recomendación).
    |
    */

    'ollama' => [
        'enabled' => filter_var(env('OLLAMA_ENABLED', true), FILTER_VALIDATE_BOOL),
        'base_url' => rtrim((string) env('OLLAMA_BASE_URL', 'http://ollama:11434'), '/'),
        'model' => env('OLLAMA_MODEL', 'qwen2.5:1.5b'),
        // Segundos máximos de espera por una sugerencia (incluye carga del modelo en RAM).
        'timeout' => (int) env('OLLAMA_TIMEOUT', 60),
        'connect_timeout' => (int) env('OLLAMA_CONNECT_TIMEOUT', 3),
        // Tiempo que Ollama mantiene el modelo cargado en memoria tras una petición.
        'keep_alive' => env('OLLAMA_KEEP_ALIVE', '10m'),
    ],

];
