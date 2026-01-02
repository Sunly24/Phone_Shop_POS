<?php

namespace App\Imports;

use App\Models\Product;
use App\Models\Category;
use App\Models\Brand;
use App\Models\Maker;
use App\Models\Size;
use App\Models\Color;
use App\Models\ProductImage;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\Importable;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Validators\Failure;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Worksheet\MemoryDrawing;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;

class ProductsImport implements ToModel, WithHeadingRow, WithValidation, SkipsEmptyRows, SkipsOnFailure
{
  use Importable;

  protected $spreadsheet;
  protected $imageColumnIndex;
  protected $currentRow = 0;

  public function __construct()
  {
    $this->spreadsheet = null;
    $this->imageColumnIndex = null;
    $this->currentRow = 0;
  }

  /**
   * Initialize spreadsheet for image extraction
   */
  public function initSpreadsheet($filePath)
  {
    try {
      $this->spreadsheet = IOFactory::load($filePath);
      $worksheet = $this->spreadsheet->getActiveSheet();

      // Find the image column index
      $headerRow = 1;
      foreach ($worksheet->getColumnIterator() as $column) {
        $cellValue = $worksheet->getCell($column->getColumnIndex() . $headerRow)->getValue();
        if (strtolower($cellValue) === 'image') {
          $this->imageColumnIndex = Coordinate::columnIndexFromString($column->getColumnIndex());
          break;
        }
      }
    } catch (\Exception $e) {
      Log::error('Failed to initialize spreadsheet for image extraction', [
        'error' => $e->getMessage()
      ]);
    }
  }

  /**
   * Extract embedded image from Excel cell
   */
  protected function extractEmbeddedImage($rowIndex)
  {
    if (!$this->spreadsheet || !$this->imageColumnIndex) {
      return null;
    }

    try {
      $worksheet = $this->spreadsheet->getActiveSheet();
      // Excel row calculation: header is row 1, data starts at row 2
      // So currentRow 1 maps to Excel row 2, currentRow 2 maps to Excel row 3, etc.
      $excelRow = $rowIndex + 1;
      $coordinate = Coordinate::stringFromColumnIndex($this->imageColumnIndex) . $excelRow;



      foreach ($worksheet->getDrawingCollection() as $drawing) {
        $drawingCoordinate = $drawing->getCoordinates();
        $drawingColumn = Coordinate::columnIndexFromString(preg_replace('/[0-9]+/', '', $drawingCoordinate));
        $drawingRow = (int) preg_replace('/[A-Z]+/', '', $drawingCoordinate);



        // Match if it's in the image column and the correct row (with tolerance for adjacent rows)
        if (
          $drawingColumn === $this->imageColumnIndex &&
          ($drawingRow === $excelRow || $drawingRow === $excelRow + 1)
        ) {


          if ($drawing instanceof MemoryDrawing) {
            ob_start();
            call_user_func(
              $drawing->getRenderingFunction(),
              $drawing->getImageResource()
            );
            $imageData = ob_get_contents();
            ob_end_clean();

            return [
              'data' => $imageData,
              'mime' => $drawing->getMimeType(),
              'extension' => $this->getExtensionFromMime($drawing->getMimeType())
            ];
          } else {
            $zipReader = fopen($drawing->getPath(), 'r');
            $imageData = '';
            while (!feof($zipReader)) {
              $imageData .= fread($zipReader, 1024);
            }
            fclose($zipReader);

            $tempFile = tempnam(sys_get_temp_dir(), 'excel_img_');
            file_put_contents($tempFile, $imageData);
            $mimeType = mime_content_type($tempFile);
            unlink($tempFile);

            if (!$mimeType || $mimeType === 'application/octet-stream') {
              $extension = strtolower(pathinfo($drawing->getPath(), PATHINFO_EXTENSION));
              $mimeType = $this->getMimeFromExtension($extension);
            }

            return [
              'data' => $imageData,
              'mime' => $mimeType,
              'extension' => $this->getExtensionFromMime($mimeType)
            ];
          }
        }
      }
    } catch (\Exception $e) {
      Log::error('Failed to extract embedded image', [
        'error' => $e->getMessage(),
        'row' => $rowIndex
      ]);
    }

    return null;
  }

  /**
   * Store image and create database record
   */
  protected function storeImage($product, $imageData, $imageName = null)
  {
    try {
      // Ensure storage directory exists
      $storagePath = storage_path('app/public/product-images');
      if (!file_exists($storagePath)) {
        mkdir($storagePath, 0775, true);
      }

      // Generate filename
      $filename = 'product-images/' . Str::random(40) . '.' . $imageData['extension'];

      // Store the image
      $stored = Storage::disk('public')->put($filename, $imageData['data']);

      if (!$stored) {
        throw new \Exception('Failed to store image file');
      }

      // Create image record
      ProductImage::create([
        'product_id' => $product->product_id,
        'image_path' => $filename,
        'image_name' => $imageName ?? ($product->product_title . '_image.' . $imageData['extension']),
        'image_size' => strlen($imageData['data']),
        'image_type' => $imageData['mime'],
      ]);



      return true;
    } catch (\Exception $e) {
      Log::error('Error storing image', [
        'error' => $e->getMessage(),
        'product_id' => $product->product_id
      ]);
      return false;
    }
  }

  protected function getMimeFromExtension($extension)
  {
    $mimeTypes = [
      'jpg' => 'image/jpeg',
      'jpeg' => 'image/jpeg',
      'png' => 'image/png',
      'gif' => 'image/gif',
      'webp' => 'image/webp'
    ];

    return $mimeTypes[strtolower($extension)] ?? 'image/jpeg';
  }

  protected function getExtensionFromMime($mimeType)
  {
    $extensions = [
      'image/jpeg' => 'jpg',
      'image/jpg' => 'jpg',
      'image/png' => 'png',
      'image/gif' => 'gif',
      'image/webp' => 'webp'
    ];

    return $extensions[$mimeType] ?? 'jpg';
  }

  /**
   * @param array $row
   *
   * @return \Illuminate\Database\Eloquent\Model|null
   */
  public function model(array $row)
  {
    try {
      $this->currentRow++;

      // Skip empty rows
      if (empty($row['title']) && empty($row['code'])) {
        return null;
      }

      // Basic validation
      if (empty($row['title']) || empty($row['code'])) {
        return null;
      }

      // Create the product
      $product = Product::create([
        'product_title' => $row['title'],
        'product_code' => $row['code'],
        'product_description' => $row['description'] ?? null,
        'product_price' => floatval($row['price'] ?? 0),
        'product_stock' => intval($row['stock'] ?? 0),
        'product_ram' => intval($row['ram_gb'] ?? 0),
        'category_id' => $this->findOrCreateCategory($row['category'] ?? null),
        'brand_id' => $this->findBrand($row['brand'] ?? null),
        'maker_id' => $this->findMaker($row['maker'] ?? null),
        'size_id' => $this->findSize($row['size'] ?? null),
        'color_id' => $this->findColor($row['color'] ?? null),
        'product_status' => strtolower($row['status'] ?? '') === 'active' ? 1 : 0,
        'user_id' => Auth::id() ?? 1
      ]);

      // Handle embedded image if present
      try {
        $embeddedImage = $this->extractEmbeddedImage($this->currentRow);
        if ($embeddedImage) {
          $this->storeImage($product, $embeddedImage);
        }
      } catch (\Exception $e) {
        // Silently continue if embedded image extraction fails
      }

      // Handle image URLs if present
      if (!empty($row['image_urls'])) {
        $imageUrls = explode(',', $row['image_urls']);
        foreach ($imageUrls as $imageUrl) {
          $imageUrl = trim($imageUrl);
          if (filter_var($imageUrl, FILTER_VALIDATE_URL)) {
            try {
              $response = Http::get($imageUrl);
              if ($response->successful()) {
                $imageData = [
                  'data' => $response->body(),
                  'mime' => $response->header('Content-Type', 'image/jpeg'),
                  'extension' => $this->getExtensionFromMime($response->header('Content-Type', 'image/jpeg'))
                ];
                $this->storeImage($product, $imageData, basename($imageUrl));
              }
            } catch (\Exception $e) {
              // Continue with next image if one fails
            }
          }
        }
      }

      return $product;
    } catch (\Exception $e) {
      Log::error('Error importing product row', [
        'row_number' => $this->currentRow,
        'error' => $e->getMessage()
      ]);
      throw $e;
    }
  }



  protected function findOrCreateCategory($name)
  {
    if (empty($name)) return null;
    $category = Category::firstOrCreate(
      ['name' => $name]
    );
    return $category->id;
  }

  protected function findBrand($name)
  {
    if (empty($name)) return null;
    $brand = Brand::where('brand_title', $name)->first();
    return $brand ? $brand->brand_id : null;
  }

  protected function findMaker($name)
  {
    if (empty($name)) return null;
    $maker = Maker::where('maker_title', $name)->first();
    return $maker ? $maker->maker_id : null;
  }

  protected function findSize($name)
  {
    if (empty($name)) return null;
    $size = Size::where('size_title', $name)->first();
    return $size ? $size->size_id : null;
  }

  protected function findColor($name)
  {
    if (empty($name)) return null;
    $color = Color::where('color_title', $name)->first();
    return $color ? $color->color_id : null;
  }

  public function rules(): array
  {
    return [
      'title' => 'required|string|max:255',
      'code' => 'required|string|max:50',
      'description' => 'nullable|string',
      'price' => 'required|numeric|min:0',
      'stock' => 'required|integer|min:0',
      'ram_gb' => 'nullable|integer|min:0',
      'category' => 'required|string|max:255',
      'brand' => 'nullable|string|max:255',
      'maker' => 'nullable|string|max:255',
      'size' => 'nullable|string|max:255',
      'color' => 'nullable|string|max:255',
      'status' => 'required|in:Active,Inactive',
      'image_urls' => 'nullable|string'
    ];
  }

  /**
   * Handle validation failures
   */
  public function onFailure(Failure ...$failures)
  {
    foreach ($failures as $failure) {
      Log::warning('Import validation failure', [
        'row' => $failure->row(),
        'errors' => $failure->errors()
      ]);
    }
  }

  /**
   * Skip empty rows
   */
  public function isEmpty($row): bool
  {
    $row = array_filter($row, function ($value) {
      return !is_null($value) && $value !== '';
    });

    return empty($row);
  }

  public function customValidationMessages()
  {
    return [
      'title.required' => 'The product title is required',
      'code.required' => 'The product code is required',
      'price.required' => 'The price is required',
      'price.numeric' => 'The price must be a number',
      'stock.required' => 'The stock quantity is required',
      'stock.integer' => 'The stock must be a whole number',
      'category.required' => 'The category is required',
      'status.required' => 'The status is required',
      'status.in' => 'The status must be either Active or Inactive'
    ];
  }
}
