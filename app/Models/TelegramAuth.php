<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class TelegramAuth extends Model
{
    use HasFactory;

    protected $table = 'telegram_auths';
    protected $primaryKey = 'id';
    protected $fillable = [
        'user_id',
        'app_key',
        'chat_id',
        'chatBotID',
        'username',
        'url_redirect',
        'webhook_url',
        'webhook_configured',
        'webhook_configured_at',
    ];

    protected $dates = [
        'webhook_configured_at',
    ];

    /**
     * Get the user that owns the telegram configuration.
     */
    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }
}
