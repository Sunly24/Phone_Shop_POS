<?php

namespace App\Listeners;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

use Illuminate\Auth\Events\Login;


class LogSuccessfulLogin
{
    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(Login $event)
    {
        if ($event->user) {
            // Check if a login audit was created in the last second to prevent duplicates
            $recentLogin = $event->user->audits()
                ->where('event', 'login')
                ->where('created_at', '>=', now()->subSecond())
                ->exists();

            if (!$recentLogin) {
                $event->user->audits()->create([
                    'event' => 'login',
                    'url' => request()->fullUrl(),
                    'ip_address' => request()->ip(),
                    'user_agent' => request()->userAgent(),
                    'user_type' => get_class($event->user),
                    'user_id' => $event->user->id,
                    'auditable_type' => get_class($event->user),
                    'auditable_id' => $event->user->id,
                    'created_at' => now()
                ]);
            }
        }
    }
}
