<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use OwenIt\Auditing\Contracts\Auditable;
use OwenIt\Auditing\Auditable as AuditableTrait;

class Maker extends Model implements Auditable
{
    use HasFactory, AuditableTrait;

    protected $table = 'makers';
    protected $primaryKey = 'maker_id'; // Corrected property name

    protected $fillable = [
        'maker_title',
    ];
}
