<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

// Automatically process export queue jobs every minute
Schedule::command('queue:work --once --timeout=60')
    ->everyMinute()
    ->withoutOverlapping()
    ->runInBackground();

// Process high priority queue every minute for faster exports
Schedule::command('queue:work --queue=high --once --timeout=60')
    ->everyMinute()
    ->withoutOverlapping()
    ->runInBackground();

// Cleanup expired exports daily at 2 AM
Schedule::command('exports:cleanup')
    ->dailyAt('02:00')
    ->withoutOverlapping()
    ->runInBackground();

Schedule::call(function () {
    Artisan::call('inventory:export-files');
})->everyMinute();

Schedule::call(function () {
    Artisan::call('khqr:check-payments');
})->everyTwoMinutes();
