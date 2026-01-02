<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use OwenIt\Auditing\Contracts\Auditable;
use OwenIt\Auditing\Auditable as AuditableTrait;

class Customer extends Model implements Auditable
{
    use HasFactory, AuditableTrait;

    protected $table      = 'customers';
    protected $primaryKey = 'customer_id';

    protected $fillable = [
        'user_id',
        'name',
        'phone',
        'password',
    ];
    protected $hidden = [
        'password',
    ];
}
