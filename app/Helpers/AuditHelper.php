<?php

namespace App\Helpers;

use App\Models\Brand;
use App\Models\Maker;
use App\Models\Product;
use App\Models\Size;
use App\Models\Color;
use Illuminate\Support\Str;

class AuditHelper
{
  /**
   * Map of field names to their display values
   */
  protected static $fieldMappings = [
    'brand_id' => [
      'model' => Brand::class,
      'display' => 'brand_title'
    ],
    'maker_id' => [
      'model' => Maker::class,
      'display' => 'maker_title'
    ],
    'product_id' => [
      'model' => Product::class,
      'display' => 'product_title'
    ],
    'size_id' => [
      'model' => Size::class,
      'display' => 'size_title'
    ],
    'color_id' => [
      'model' => Color::class,
      'display' => 'color_title'
    ],
  ];

  /**
   * Get the display value for a field
   */
  public static function getDisplayValue($fieldName, $value, $audit = null)
  {
    // If value is null or empty, return a dash
    if ($value === null || $value === '') {
      return '-';
    }

    // If value is an array with a name key (from transformed audit data)
    if (is_array($value) && isset($value['name'])) {
      return $value['name'];
    }

    // Check if this is an ID field
    if (Str::endsWith($fieldName, '_id')) {
      $mapping = static::$fieldMappings[$fieldName] ?? null;

      if ($mapping) {
        try {
          $model = $mapping['model']::find($value);
          if ($model) {
            return $model->{$mapping['display']};
          }
        } catch (\Exception $e) {
          return $value;
        }
      }
    }

    // For boolean values
    if (is_bool($value) || in_array($value, [0, 1, '0', '1'])) {
      return filter_var($value, FILTER_VALIDATE_BOOLEAN) ? 'Yes' : 'No';
    }

    // For all other fields
    return $value;
  }

  /**
   * Get a human-readable field name
   */
  public static function getFieldLabel($fieldName)
  {
    // Remove _id suffix if present
    $fieldName = Str::replace('_id', '', $fieldName);

    // Convert snake_case to Title Case
    return Str::title(Str::replace('_', ' ', $fieldName));
  }
}
