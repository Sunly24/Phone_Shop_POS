<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use OwenIt\Auditing\Contracts\Auditable;
use OwenIt\Auditing\Auditable as AuditableTrait;

class ProductImage extends Model implements Auditable
{
    use HasFactory, AuditableTrait;

    protected $table = 'product_images';
    protected $primaryKey = 'product_image_id';

    protected $fillable = [
        'product_id',
        'image_path',
        'image_name',
        'image_size',
        'image_type',
        'created_at',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
