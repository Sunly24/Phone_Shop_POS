<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

// Public channel for chat sessions (anyone can listen)
Broadcast::channel('chat.{sessionId}', function ($user, $sessionId) {
  return true; // Allow all users to listen to chat channels
});

// Public channel for chat notifications (for admin sidebar)
Broadcast::channel('chat.notifications', function ($user) {
  return true; // Allow all users to listen to notifications
});
