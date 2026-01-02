<?php

namespace App\Listeners;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Auth\Events\Logout;

class LogSuccessfulLogout
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
    public function handle(Logout $event)
    {
        if ($event->user) {
            // Check if a logout audit was created in the last second to prevent duplicates
            $recentLogout = $event->user->audits()
                ->where('event', 'logout')
                ->where('created_at', '>=', now()->subSecond())
                ->exists();

            if (!$recentLogout) {
                $event->user->audits()->create([
                    'event' => 'logout',
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
