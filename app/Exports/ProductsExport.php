<?php

namespace App\Exports;

use App\Models\Product;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithDrawings;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;

class ProductsExport implements FromCollection, WithHeadings, WithMapping, WithEvents
{
  private $products;
  private $currentRow = 2;
  private $search;
  private $colorId;
  private $isPdfMode;

  public function __construct($search = null, $colorId = null, $isPdfMode = false)
  {
    $this->search = $search;
    $this->colorId = $colorId;
    $this->isPdfMode = $isPdfMode;
  }

  /**
   * @return \Illuminate\Support\Collection
   */
  public function collection()
  {
    $query = Product::with(['category', 'brand', 'maker', 'size', 'color', 'images']);

    // Apply filters
    if ($this->search) {
      $query->where('product_title', 'like', '%' . $this->search . '%');
    }

    if ($this->colorId) {
      $query->where('color_id', $this->colorId);
    }

    $this->products = $query->get();

    // For PDF mode, add header rows
    if ($this->isPdfMode) {
      $collection = collect();

      // Add header information rows
      $emptyRow = $this->isPdfMode ?
        ['', '', '', '', '', '', '', '', '', '', '', '', ''] :
        ['', '', '', '', '', '', '', '', '', '', '', '', '', ''];

      $collection->push($emptyRow); // Empty row for company name
      $collection->push($emptyRow); // Empty row for report name
      $collection->push($emptyRow); // Empty row for date range
      $collection->push($emptyRow); // Empty row for spacing

      // Add actual product data
      foreach ($this->products as $product) {
        $collection->push($product);
      }

      return $collection;
    }

    return $this->products;
  }

  /**
   * @param mixed $row
   * @return array
   */
  public function map($row): array
  {
    // Handle header rows for PDF mode (first 4 rows)
    if ($this->isPdfMode && !($row instanceof Product)) {
      if (is_array($row)) {
        return $row;
      }
      return $this->isPdfMode ?
        ['', '', '', '', '', '', '', '', '', '', '', '', ''] :
        ['', '', '', '', '', '', '', '', '', '', '', '', '', ''];
    }

    $product = $row;

    // For PDF/CSV mode, exclude the images column
    if ($this->isPdfMode) {
      return [
        $product->product_id,
        $product->product_title,
        $product->product_code,
        $product->product_description,
        $product->product_price,
        $product->product_stock,
        $product->product_ram,
        $product->category ? $product->category->name : '',
        $product->brand ? $product->brand->brand_title : '',
        $product->maker ? $product->maker->maker_title : '',
        $product->size ? $product->size->size_title : '',
        $product->color ? $product->color->color_title : '',
        $product->product_status ? 'Active' : 'Inactive',
      ];
    }

    // For Excel mode, include images column
    return [
      $product->product_id,
      $product->product_title,
      $product->product_code,
      $product->product_description,
      $product->product_price,
      $product->product_stock,
      $product->product_ram,
      $product->category ? $product->category->name : '',
      $product->brand ? $product->brand->brand_title : '',
      $product->maker ? $product->maker->maker_title : '',
      $product->size ? $product->size->size_title : '',
      $product->color ? $product->color->color_title : '',
      $product->product_status ? 'Active' : 'Inactive',
      '',
    ];
  }

  /**
   * @return array
   */
  public function headings(): array
  {
    // For PDF/CSV mode, exclude images column
    if ($this->isPdfMode) {
      return [
        'ID',
        'Title',
        'Code',
        'Description',
        'Price',
        'Stock',
        'RAM (GB)',
        'Category',
        'Brand',
        'Maker',
        'Size',
        'Color',
        'Status'
      ];
    }

    // For Excel mode, include images column
    return [
      'ID',
      'Title',
      'Code',
      'Description',
      'Price',
      'Stock',
      'RAM (GB)',
      'Category',
      'Brand',
      'Maker',
      'Size',
      'Color',
      'Status',
      'Images'
    ];
  }

  /**
   * Register events to add images (only for Excel mode)
   */
  public function registerEvents(): array
  {
    // For PDF mode, add headers
    if ($this->isPdfMode) {
      return [
        AfterSheet::class => function (AfterSheet $event) {
          $sheet = $event->sheet->getDelegate();

          // Add PDF headers
          $sheet->setCellValue('A1', 'Phone Shop Company');
          $sheet->mergeCells('A1:M1');
          $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(18);
          $sheet->getStyle('A1')->getAlignment()->setHorizontal('center');

          // Add report name
          $sheet->setCellValue('A2', 'Products Report');
          $sheet->mergeCells('A2:M2');
          $sheet->getStyle('A2')->getFont()->setBold(true)->setSize(14);
          $sheet->getStyle('A2')->getAlignment()->setHorizontal('center');

          // Add date range
          $dateRange = 'From: ' . now()->format('m/d/Y') . ' - To: ' . now()->format('m/d/Y');
          if ($this->search) {
            $dateRange .= ' | Search: ' . $this->search;
          }
          if ($this->colorId) {
            $dateRange .= ' | Color Filter Applied';
          }
          $dateRange .= ' | Total Products: ' . $this->products->count();

          $sheet->setCellValue('A3', $dateRange);
          $sheet->mergeCells('A3:M3');
          $sheet->getStyle('A3')->getFont()->setBold(true)->setSize(11);
          $sheet->getStyle('A3')->getAlignment()->setHorizontal('center');

          // Empty row for spacing
          $sheet->setCellValue('A4', '');

          // Style the column headers (now at row 5)
          $sheet->getStyle('A5:M5')->getFont()->setBold(true)->setSize(10);
          $sheet->getStyle('A5:M5')->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID);
          $sheet->getStyle('A5:M5')->getFill()->getStartColor()->setRGB('2171B5');
          $sheet->getStyle('A5:M5')->getFont()->getColor()->setRGB('FFFFFF');
          $sheet->getStyle('A5:M5')->getBorders()->getAllBorders()->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN);

          // Add borders to all data
          $lastRow = $sheet->getHighestRow();
          if ($lastRow > 5) {
            $sheet->getStyle('A5:M' . $lastRow)->getBorders()->getAllBorders()->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN);

            // Alternate row colors for better readability
            for ($row = 6; $row <= $lastRow; $row++) {
              if (($row - 6) % 2 == 1) {
                $sheet->getStyle('A' . $row . ':M' . $row)->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID);
                $sheet->getStyle('A' . $row . ':M' . $row)->getFill()->getStartColor()->setRGB('F8F9FA');
              }
            }
          }

          // Set column widths for PDF consistency
          $sheet->getColumnDimension('A')->setWidth(6);   // ID
          $sheet->getColumnDimension('B')->setWidth(20);  // Title
          $sheet->getColumnDimension('C')->setWidth(12);  // Code
          $sheet->getColumnDimension('D')->setWidth(25);  // Description
          $sheet->getColumnDimension('E')->setWidth(10);  // Price
          $sheet->getColumnDimension('F')->setWidth(8);   // Stock
          $sheet->getColumnDimension('G')->setWidth(8);   // RAM
          $sheet->getColumnDimension('H')->setWidth(12);  // Category
          $sheet->getColumnDimension('I')->setWidth(12);  // Brand
          $sheet->getColumnDimension('J')->setWidth(12);  // Maker
          $sheet->getColumnDimension('K')->setWidth(10);  // Size
          $sheet->getColumnDimension('L')->setWidth(10);  // Color
          $sheet->getColumnDimension('M')->setWidth(10);  // Status

          // Set row height for consistency
          $sheet->getDefaultRowDimension()->setRowHeight(18);

          // Set page margins for PDF
          $sheet->getPageMargins()->setTop(0.75);
          $sheet->getPageMargins()->setRight(0.25);
          $sheet->getPageMargins()->setLeft(0.25);
          $sheet->getPageMargins()->setBottom(0.75);

          // Set page orientation to landscape for better fit
          $sheet->getPageSetup()->setOrientation(\PhpOffice\PhpSpreadsheet\Worksheet\PageSetup::ORIENTATION_LANDSCAPE);
          $sheet->getPageSetup()->setPaperSize(\PhpOffice\PhpSpreadsheet\Worksheet\PageSetup::PAPERSIZE_A4);

          // Set print area and scaling
          $sheet->getPageSetup()->setFitToWidth(1);
          $sheet->getPageSetup()->setFitToHeight(0);
        },
      ];
    }

    // For Excel mode, add images
    return [
      AfterSheet::class => function (AfterSheet $event) {
        // Add company header first for Excel export
        $this->addCompanyHeader($event->sheet->getDelegate());

        // Enhanced Excel formatting
        $lastRow = $event->sheet->getDelegate()->getHighestRow();
        $lastColumn = 'N'; // Updated for images column
        $headerRow = 5; // Headers are now on row 5 due to company header

        // Header styling
        $event->sheet->getDelegate()->getStyle('A' . $headerRow . ':' . $lastColumn . $headerRow)->applyFromArray([
          'font' => [
            'bold' => true,
            'size' => 12,
            'color' => ['rgb' => 'FFFFFF']
          ],
          'fill' => [
            'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
            'startColor' => ['rgb' => '2171B5'] // Blue background
          ],
          'borders' => [
            'allBorders' => [
              'borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN,
              'color' => ['rgb' => '000000']
            ]
          ]
        ]);

        // Data rows styling
        if ($lastRow > $headerRow) {
          $event->sheet->getDelegate()->getStyle('A' . ($headerRow + 1) . ':' . $lastColumn . $lastRow)->applyFromArray([
            'borders' => [
              'allBorders' => [
                'borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN,
                'color' => ['rgb' => 'D1D5DB']
              ]
            ]
          ]);

          // Alternate row colors
          for ($row = $headerRow + 1; $row <= $lastRow; $row++) {
            if (($row - $headerRow) % 2 == 0) {
              $event->sheet->getDelegate()->getStyle('A' . $row . ':' . $lastColumn . $row)->applyFromArray([
                'fill' => [
                  'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                  'startColor' => ['rgb' => 'F8FAFC'] // Light gray
                ]
              ]);
            }
          }
        }

        // Set custom column widths
        $event->sheet->getDelegate()->getColumnDimension('A')->setWidth(8);   // ID
        $event->sheet->getDelegate()->getColumnDimension('B')->setWidth(25);  // Title
        $event->sheet->getDelegate()->getColumnDimension('C')->setWidth(12);  // Code
        $event->sheet->getDelegate()->getColumnDimension('D')->setWidth(30);  // Description
        $event->sheet->getDelegate()->getColumnDimension('E')->setWidth(12);  // Price
        $event->sheet->getDelegate()->getColumnDimension('F')->setWidth(8);   // Stock
        $event->sheet->getDelegate()->getColumnDimension('G')->setWidth(10);  // RAM
        $event->sheet->getDelegate()->getColumnDimension('H')->setWidth(15);  // Category
        $event->sheet->getDelegate()->getColumnDimension('I')->setWidth(15);  // Brand
        $event->sheet->getDelegate()->getColumnDimension('J')->setWidth(15);  // Maker
        $event->sheet->getDelegate()->getColumnDimension('K')->setWidth(10);  // Size
        $event->sheet->getDelegate()->getColumnDimension('L')->setWidth(10);  // Color
        $event->sheet->getDelegate()->getColumnDimension('M')->setWidth(10);  // Status
        $event->sheet->getDelegate()->getColumnDimension('N')->setWidth(25);  // Images

        // Wrap text for long content
        $event->sheet->getDelegate()->getStyle('B' . ($headerRow + 1) . ':D' . $lastRow)->getAlignment()->setWrapText(true);

        // Center align headers
        $event->sheet->getDelegate()->getStyle('A' . $headerRow . ':' . $lastColumn . $headerRow)->getAlignment()->setHorizontal('center');

        $row = $headerRow + 1;

        foreach ($this->products as $product) {
          if ($product->images && $product->images->count() > 0) {
            $imageCount = 0;
            foreach ($product->images as $image) {
              if ($imageCount >= 3) break; // Limit to 3 images per product

              $imagePath = storage_path('app/public/' . $image->image_path);

              if (file_exists($imagePath)) {
                $drawing = new Drawing();
                $drawing->setName('Product Image ' . ($imageCount + 1));
                $drawing->setDescription('Product Image');
                $drawing->setPath($imagePath);
                $drawing->setHeight(60);
                $drawing->setWidth(60);
                // Place images side by side
                $drawing->setCoordinates('N' . $row);
                $drawing->setOffsetX(5 + ($imageCount * 45)); // Offset each image
                $drawing->setOffsetY(5);
                $drawing->setWorksheet($event->sheet->getDelegate());

                $imageCount++;
              }
            }

            if ($imageCount > 0) {
              $event->sheet->getDelegate()->getRowDimension($row)->setRowHeight(50);
            }
          }
          $row++;
        }

        // Make images column wider for multiple images
        $event->sheet->getDelegate()->getColumnDimension('N')->setWidth(25);
      },
    ];
  }

  /**
   * Add company header with optional logo
   */
  private function addCompanyHeader($sheet)
  {
    // Insert rows at the top for company header
    $sheet->insertNewRowBefore(1, 4);

    // Company name
    $sheet->setCellValue('A1', 'PHONE SHOP COMPANY');
    $sheet->mergeCells('A1:N1');
    $sheet->getStyle('A1')->applyFromArray([
      'font' => [
        'bold' => true,
        'size' => 20,
        'color' => ['rgb' => '1F2937']
      ],
      'alignment' => [
        'horizontal' => 'center',
        'vertical' => 'center'
      ]
    ]);

    // Report title
    $sheet->setCellValue('A2', 'Products Report');
    $sheet->mergeCells('A2:N2');
    $sheet->getStyle('A2')->applyFromArray([
      'font' => [
        'bold' => true,
        'size' => 16,
        'color' => ['rgb' => '374151']
      ],
      'alignment' => [
        'horizontal' => 'center',
        'vertical' => 'center'
      ]
    ]);

    // Date and filters info
    $reportInfo = 'Generated on: ' . now()->format('F j, Y \a\t g:i A');
    if ($this->search) {
      $reportInfo .= ' | Search Filter: "' . $this->search . '"';
    }
    if ($this->colorId) {
      $reportInfo .= ' | Color Filter Applied';
    }
    $reportInfo .= ' | Total Products: ' . $this->products->count();

    $sheet->setCellValue('A3', $reportInfo);
    $sheet->mergeCells('A3:N3');
    $sheet->getStyle('A3')->applyFromArray([
      'font' => [
        'size' => 11,
        'color' => ['rgb' => '6B7280']
      ],
      'alignment' => [
        'horizontal' => 'center',
        'vertical' => 'center'
      ]
    ]);

    // Empty row for spacing
    $sheet->setCellValue('A4', '');

    // Set row heights for header
    $sheet->getRowDimension(1)->setRowHeight(30);
    $sheet->getRowDimension(2)->setRowHeight(25);
    $sheet->getRowDimension(3)->setRowHeight(20);
    $sheet->getRowDimension(4)->setRowHeight(10);
  }
}
