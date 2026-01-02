<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use OwenIt\Auditing\Contracts\Auditable;
use OwenIt\Auditing\Auditable as AuditableTrait;
use App\Models\Brand;
use App\Models\Maker;
use App\Models\Category;
use App\Models\Size;
use App\Models\Color;
use App\Models\OrderItem;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class Product extends Model implements Auditable
{
    use HasFactory, AuditableTrait;

    protected $table = 'products';
    protected $primaryKey = 'product_id';

    /**
     * Boot the model and set up event listeners
     */
    protected static function boot()
    {
        parent::boot();

        // Delete associated images when product is deleted
        static::deleting(function ($product) {
            try {
                // Load the images if not already loaded
                if (!$product->relationLoaded('images')) {
                    $product->load('images');
                }

                // Delete each image file from storage and database
                foreach ($product->images as $image) {
                    try {
                        // Delete the physical file from storage
                        if (Storage::disk('public')->exists($image->image_path)) {
                            Storage::disk('public')->delete($image->image_path);
                        }

                        // Delete the image record from database
                        $image->delete();
                    } catch (\Exception $e) {
                        Log::error('Failed to delete product image', [
                            'product_id' => $product->product_id,
                            'image_id' => $image->product_image_id ?? 'unknown',
                            'error' => $e->getMessage()
                        ]);
                        // Continue with other images even if one fails
                    }
                }
            } catch (\Exception $e) {
                Log::error('Failed to cleanup product images during deletion', [
                    'product_id' => $product->product_id,
                    'error' => $e->getMessage()
                ]);
                // Don't prevent product deletion even if image cleanup fails
            }
        });
    }

    /**
     * Attributes to include in the Audit.
     */
    protected $auditInclude = [
        'product_title',
        'product_description',
        'product_code',
        'product_price',
        'product_stock',
        'product_status',
        'product_ram',
        'category_id',
        'brand_id',
        'maker_id',
        'size_id',
        'color_id',
        'user_id',
    ];

    /**
     * Generate modified value for auditing
     */
    protected function generateAuditValue($key, $value)
    {
        if ($value === null) {
            return null;
        }

        switch ($key) {
            case 'brand_id':
                $brand = Brand::find($value);
                return [
                    'id' => $value,
                    'name' => $brand ? $brand->brand_title : 'Unknown'
                ];
            case 'maker_id':
                $maker = Maker::find($value);
                return [
                    'id' => $value,
                    'name' => $maker ? $maker->maker_title : 'Unknown'
                ];
            case 'category_id':
                $category = Category::find($value);
                return [
                    'id' => $value,
                    'name' => $category ? $category->name : 'Unknown'
                ];
            case 'size_id':
                $size = Size::find($value);
                return [
                    'id' => $value,
                    'name' => $size ? $size->size_title : 'Unknown'
                ];
            case 'color_id':
                $color = Color::find($value);
                return [
                    'id' => $value,
                    'name' => $color ? $color->color_title : 'Unknown'
                ];
            default:
                return $value;
        }
    }

    /**
     * Prepare audit data
     */
    public function transformAudit(array $data): array
    {
        foreach ($data as $key => $value) {
            // Skip if value is null
            if ($value === null) {
                continue;
            }

            // Transform relationship fields
            if (in_array($key, ['brand_id', 'maker_id', 'category_id', 'size_id', 'color_id'])) {
                $data[$key] = $this->generateAuditValue($key, $value);
            }
        }

        return $data;
    }

    protected $fillable = [
        'product_title',
        'product_description',
        'product_code',
        'product_price',
        'product_stock',
        'product_status',
        'product_ram',
        'category_id',
        'brand_id',
        'maker_id',
        'size_id',
        'color_id',
        'user_id',
        'created_at',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'product_price' => 'decimal:2',
        'product_stock' => 'integer',
        'product_status' => 'boolean',
        'product_ram' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * The attributes that should have default values.
     */
    protected $attributes = [
        'product_status' => true,
    ];

    public function images()
    {
        return $this->hasMany(ProductImage::class, 'product_id');
    }

    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id', 'id');
    }

    public function brand()
    {
        return $this->belongsTo(Brand::class, 'brand_id', 'brand_id');
    }

    public function maker()
    {
        return $this->belongsTo(Maker::class, 'maker_id', 'maker_id');
    }

    public function size()
    {
        return $this->belongsTo(Size::class, 'size_id', 'size_id');
    }

    public function color()
    {
        return $this->belongsTo(Color::class, 'color_id', 'color_id');
    }

    /**
     * Check if a product title exists
     */
    public static function checkExists($title)
    {
        return static::where('product_title', $title)->exists();
    }

    /**
     * Clean up orphaned images (images without products)
     * This can be useful for maintenance
     */
    public static function cleanupOrphanedImages()
    {
        try {
            // Find images that don't have corresponding products
            $orphanedImages = ProductImage::whereNotIn('product_id', function ($query) {
                $query->select('product_id')->from('products');
            })->get();

            $deletedCount = 0;
            foreach ($orphanedImages as $image) {
                try {
                    // Delete the physical file
                    if (Storage::disk('public')->exists($image->image_path)) {
                        Storage::disk('public')->delete($image->image_path);
                    }

                    // Delete the database record
                    $image->delete();
                    $deletedCount++;
                } catch (\Exception $e) {
                    Log::error('Failed to cleanup orphaned image', [
                        'image_id' => $image->product_image_id,
                        'error' => $e->getMessage()
                    ]);
                }
            }



            return $deletedCount;
        } catch (\Exception $e) {
            Log::error('Failed to cleanup orphaned images', [
                'error' => $e->getMessage()
            ]);
            return 0;
        }
    }

    public function inventory()
    {
        return $this->hasOne(Inventory::class, 'product_id', 'product_id');
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class, 'product_id', 'product_id');
    }
}
