<?php

return [

  /*
    |--------------------------------------------------------------------------
    | Default Broadcaster
    |--------------------------------------------------------------------------
    |
    | This option controls the default broadcaster that will be used by the
    | framework when an event needs to be broadcast. You may set this to
    | any of the connections defined in the "connections" array below.
    |
    */

  'default' => env('BROADCAST_DRIVER', 'null'),

  /*
    |--------------------------------------------------------------------------
    | Broadcast Connections
    |--------------------------------------------------------------------------
    |
    | Here you may define all of the broadcast connections that will be used
    | to broadcast events to other systems or over websockets. Samples of
    | each available type of connection are provided inside this array.
    |
    */

  'connections' => [

    'pusher' => [
      'driver' => 'pusher',
      'key'    => env('PUSHER_APP_KEY'),
      'secret' => env('PUSHER_APP_SECRET'),
      'app_id' => env('PUSHER_APP_ID'),
      'options' => [
        // your cluster, e.g. 'ap1'
        'cluster' => env('PUSHER_APP_CLUSTER'),
        'useTLS'  => true,
        // no custom host/port/scheme here—Laravel will post to:
        // https://api-<cluster>.pusher.com
      ],
      // if you need to tweak the Guzzle client, you can add:
      // 'client_options' => [
      //     // e.g. CURLOPT_TIMEOUT => 10,
      // ],
    ],

    'ably' => [
      'driver' => 'ably',
      'key'    => env('ABLY_KEY'),
    ],

    'redis' => [
      'driver'     => 'redis',
      // name of your Redis connection from config/database.php
      'connection' => env('BROADCAST_REDIS_CONNECTION', 'default'),
    ],

    'log' => [
      'driver' => 'log',
    ],

    'null' => [
      'driver' => 'null',
    ],

  ],

];
