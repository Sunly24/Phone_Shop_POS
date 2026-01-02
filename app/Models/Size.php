<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use OwenIt\Auditing\Contracts\Auditable;
use OwenIt\Auditing\Auditable as AuditableTrait;

class Size extends Model implements Auditable
{
    use HasFactory, AuditableTrait;

    public $timestamps = true;
    protected $dates = ['created_at'];

    protected $table      = 'sizes';
    protected $primaryKey = 'size_id';
    public $incrementing  = true;
    protected $keyType    = 'int';

    protected $fillable = [
        'size_title',
        'user_id',
        'created_at',
    ];
}
