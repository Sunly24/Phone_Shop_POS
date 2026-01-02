<?php

namespace App\Models;


use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;


class Telegram extends Model
{
    use HasFactory;

    protected $table = 'telegrams';
    protected $primaryKey = 'id';

    protected $fillable = [
        'user_id',
        'customer_id',
        'app_key',
        'chatBotID',
        'tel_username',
        'url_redirect', 
    ];
}
