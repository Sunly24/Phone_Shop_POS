<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use OwenIt\Auditing\Contracts\Auditable;
use OwenIt\Auditing\Auditable as AuditableTrait;

class Color extends Model implements Auditable
{
    use HasFactory, AuditableTrait;

    public $timestamps = true;
    protected $dates = ['created_at'];

    protected $table = 'colors';
    protected $primaryKey = 'color_id';

    protected $fillable = [
        'color_title',
        'user_id',
        'created_at',
    ];
}
