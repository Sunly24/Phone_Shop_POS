<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use OwenIt\Auditing\Contracts\Auditable;
use OwenIt\Auditing\Auditable as AuditableTrait;

class Brand extends Model implements Auditable
{
    use HasFactory, AuditableTrait;

    public $timestamps = true;
    protected $dates = ['created_at'];

    protected $table      = 'brands';
    protected $primaryKey = 'brand_id';
    public    $incrementing = true;
    protected $keyType    = 'int';

    protected $fillable = [
        'brand_title',
        'maker_id',
        'user_id',
        'created_at',
    ];

    public function maker()
    {
        // foreignKey is maker_id on brands, ownerKey is maker_id on makers
        return $this->belongsTo(Maker::class, 'maker_id', 'maker_id');
    }
}
