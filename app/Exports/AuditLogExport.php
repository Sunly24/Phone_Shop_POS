<?php

namespace App\Exports;

use OwenIt\Auditing\Models\Audit;
use App\Helpers\AuditHelper;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithProperties;
use Maatwebsite\Excel\Events\AfterSheet;

class AuditLogExport implements FromCollection, WithHeadings, WithMapping, WithEvents, WithTitle, WithProperties
{
  private $search;
  private $auditLogs;
  private $isPdfMode;

  public function __construct($search = null, $isPdfMode = false)
  {
    $this->search = $search;
    $this->isPdfMode = $isPdfMode;
  }

  /**
   * @return \Illuminate\Support\Collection
   */
  public function collection()
  {
    $query = Audit::with('user')->orderBy('created_at', 'desc');

    // Apply search filter
    if ($this->search) {
      $query->where(function ($q) {
        $q->whereHas('user', function ($userQuery) {
          $userQuery->where('name', 'like', '%' . $this->search . '%');
        })
          ->orWhere('event', 'like', '%' . $this->search . '%')
          ->orWhere('auditable_type', 'like', '%' . $this->search . '%')
          ->orWhere('ip_address', 'like', '%' . $this->search . '%');
      });
    }

    $this->auditLogs = $query->get();

    // For PDF mode, add header rows
    if ($this->isPdfMode) {
      $collection = collect();

      // Add header information rows
      $emptyRow = ['', '', '', '', '', '', '', '', ''];

      $collection->push($emptyRow); // Empty row for company name
      $collection->push($emptyRow); // Empty row for report name
      $collection->push($emptyRow); // Empty row for date range
      $collection->push($emptyRow); // Empty row for spacing

      // Add actual audit log data
      foreach ($this->auditLogs as $audit) {
        $collection->push($audit);
      }

      return $collection;
    }

    return $this->auditLogs;
  }

  /**
   * @param mixed $row
   * @return array
   */
  public function map($row): array
  {
    // Handle header rows for PDF mode (first 4 rows)
    if ($this->isPdfMode && !($row instanceof Audit)) {
      if (is_array($row)) {
        return $row;
      }
      return ['', '', '', '', '', '', '', '', ''];
    }

    $audit = $row;
    $changes = $this->formatChangesForExport($audit);

    return [
      $audit->id,
      $audit->created_at->format('Y-m-d H:i:s'),
      $audit->user ? $audit->user->name : 'System',
      $audit->user ? $audit->user->email : '',  // Add user email column
      class_basename($audit->auditable_type),
      ucfirst($audit->event),
      $audit->ip_address,
      $changes,
      $this->getEventSummary($audit)
    ];
  }

  /**
   * @return array
   */
  public function headings(): array
  {
    return [
      'Log ID',           // Changed from 'ID'
      'Timestamp',        // Changed from 'Date & Time'
      'User Name',        // Changed from 'User'
      'User Email',       // New column
      'Entity Type',      // Changed from 'Model Type'
      'Action',           // Changed from 'Event'
      'IP Address',
      'Field Changes',    // Changed from 'Changes'
      'Description'       // Changed from 'Summary'
    ];
  }

  /**
   * Register events for formatting
   */
  public function registerEvents(): array
  {
    return [
      AfterSheet::class => function (AfterSheet $event) {
        $sheet = $event->sheet->getDelegate();

        if ($this->isPdfMode) {
          // Add PDF headers
          $sheet->setCellValue('A1', 'Phone Shop Company');
          $sheet->mergeCells('A1:I1');
          $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(18);
          $sheet->getStyle('A1')->getAlignment()->setHorizontal('center');

          // Add report name
          $sheet->setCellValue('A2', 'Audit Logs Report');
          $sheet->mergeCells('A2:I2');
          $sheet->getStyle('A2')->getFont()->setBold(true)->setSize(14);
          $sheet->getStyle('A2')->getAlignment()->setHorizontal('center');

          // Add date range and search info
          $dateRange = 'From: ' . now()->format('m/d/Y') . ' - To: ' . now()->format('m/d/Y');
          if ($this->search) {
            $dateRange .= ' | Search: ' . $this->search;
          }
          $dateRange .= ' | Total Records: ' . $this->auditLogs->count();

          $sheet->setCellValue('A3', $dateRange);
          $sheet->mergeCells('A3:I3');
          $sheet->getStyle('A3')->getFont()->setBold(true)->setSize(11);
          $sheet->getStyle('A3')->getAlignment()->setHorizontal('center');

          // Empty row for spacing
          $sheet->setCellValue('A4', '');

          // Style the column headers (now at row 5)
          $sheet->getStyle('A5:I5')->getFont()->setBold(true)->setSize(10);
          $sheet->getStyle('A5:I5')->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID);
          $sheet->getStyle('A5:I5')->getFill()->getStartColor()->setRGB('E2E8F0');
          $sheet->getStyle('A5:I5')->getBorders()->getAllBorders()->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN);

          // Add borders to all data
          $lastRow = $sheet->getHighestRow();
          if ($lastRow > 5) {
            $sheet->getStyle('A5:I' . $lastRow)->getBorders()->getAllBorders()->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN);

            // Alternate row colors for better readability
            for ($row = 6; $row <= $lastRow; $row++) {
              if (($row - 6) % 2 == 1) {
                $sheet->getStyle('A' . $row . ':I' . $row)->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID);
                $sheet->getStyle('A' . $row . ':I' . $row)->getFill()->getStartColor()->setRGB('F8F9FA');
              }
            }
          }

          // Set column widths for PDF consistency
          $sheet->getColumnDimension('A')->setWidth(8);   // ID
          $sheet->getColumnDimension('B')->setWidth(18);  // Date & Time
          $sheet->getColumnDimension('C')->setWidth(12);  // User
          $sheet->getColumnDimension('D')->setWidth(12);  // Model Type
          $sheet->getColumnDimension('E')->setWidth(10);  // Event
          $sheet->getColumnDimension('F')->setWidth(12);  // IP Address
          $sheet->getColumnDimension('G')->setWidth(25);  // URL
          $sheet->getColumnDimension('H')->setWidth(30);  // Changes
          $sheet->getColumnDimension('I')->setWidth(20);  // Summary

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
        } else {
          // Add company header first for Excel export
          $this->addCompanyHeader($sheet);

          // Enhanced Excel formatting
          $lastRow = $sheet->getHighestRow();
          $lastColumn = 'I'; // Updated for removed columns
          $headerRow = 5; // Headers are now on row 5 due to company header

          // Header styling
          $sheet->getStyle('A' . $headerRow . ':' . $lastColumn . $headerRow)->applyFromArray([
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
            $sheet->getStyle('A' . ($headerRow + 1) . ':' . $lastColumn . $lastRow)->applyFromArray([
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
                $sheet->getStyle('A' . $row . ':' . $lastColumn . $row)->applyFromArray([
                  'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'F8FAFC'] // Light gray
                  ]
                ]);
              }
            }
          }

          // Set custom column widths
          $sheet->getColumnDimension('A')->setWidth(8);   // Log ID
          $sheet->getColumnDimension('B')->setWidth(20);  // Timestamp
          $sheet->getColumnDimension('C')->setWidth(15);  // User Name
          $sheet->getColumnDimension('D')->setWidth(25);  // User Email
          $sheet->getColumnDimension('E')->setWidth(12);  // Entity Type
          $sheet->getColumnDimension('F')->setWidth(10);  // Action
          $sheet->getColumnDimension('G')->setWidth(15);  // IP Address
          $sheet->getColumnDimension('H')->setWidth(50);  // Field Changes
          $sheet->getColumnDimension('I')->setWidth(25);  // Description

          // Wrap text for long content
          $sheet->getStyle('H' . ($headerRow + 1) . ':I' . $lastRow)->getAlignment()->setWrapText(true);

          // Center align headers
          $sheet->getStyle('A' . $headerRow . ':' . $lastColumn . $headerRow)->getAlignment()->setHorizontal('center');
        }
      },
    ];
  }

  /**
   * Set the title of the Excel sheet
   */
  public function title(): string
  {
    return 'Audit Logs ' . now()->format('Y-m-d');
  }

  /**
   * Set Excel document properties
   */
  public function properties(): array
  {
    return [
      'creator'        => 'Phone Shop System',
      'lastModifiedBy' => 'Phone Shop System',
      'title'          => 'Audit Logs Report',
      'description'    => 'System audit logs export generated on ' . now()->format('Y-m-d H:i:s'),
      'subject'        => 'Audit Logs',
      'keywords'       => 'audit,logs,system,export',
      'category'       => 'Reports',
      'manager'        => 'Phone Shop Admin',
      'company'        => 'JB Phone Shop',
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
    $sheet->setCellValue('A1', 'JB PHONE SHOP');
    $sheet->mergeCells('A1:I1');
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
    $sheet->setCellValue('A2', 'System Audit Logs Report');
    $sheet->mergeCells('A2:I2');
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
    $reportInfo .= ' | Total Records: ' . $this->auditLogs->count();

    $sheet->setCellValue('A3', $reportInfo);
    $sheet->mergeCells('A3:I3');
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

    // Optional: Add logo if file exists
    $logoPath = public_path('images/logo.png');
    if (file_exists($logoPath)) {
      try {
        $drawing = new \PhpOffice\PhpSpreadsheet\Worksheet\Drawing();
        $drawing->setName('Company Logo');
        $drawing->setDescription('Company Logo');
        $drawing->setPath($logoPath);
        $drawing->setHeight(50);
        $drawing->setCoordinates('A1');
        $drawing->setOffsetX(10);
        $drawing->setOffsetY(5);
        $drawing->setWorksheet($sheet);
      } catch (\Exception $e) {
        // Logo loading failed, continue without logo
      }
    }
  }

  private function getEventSummary($audit)
  {
    $modelType = class_basename($audit->auditable_type);
    switch ($audit->event) {
      case 'created':
        return "Created new {$modelType}";
      case 'updated':
        return "Updated {$modelType}";
      case 'deleted':
        return "Deleted {$modelType}";
      case 'restored':
        return "Restored {$modelType}";
      default:
        return ucfirst($audit->event) . " {$modelType}";
    }
  }

  private function formatChangesForExport($audit)
  {
    $changes = [];

    if ($audit->event === 'updated') {
      $old = $audit->old_values ?? [];
      $new = $audit->new_values ?? [];

      foreach ($new as $key => $value) {
        // Skip timestamps and certain fields
        if (in_array($key, ['updated_at', 'created_at', 'deleted_at'])) {
          continue;
        }

        $oldValue = isset($old[$key]) ? $old[$key] : null;
        $fieldLabel = $this->getFieldLabel($key);

        $changes[] = "{$fieldLabel}: {$oldValue} → {$value}";
      }
    } elseif ($audit->event === 'created') {
      foreach ($audit->new_values ?? [] as $key => $value) {
        // Skip timestamps and certain fields
        if (in_array($key, ['updated_at', 'created_at', 'deleted_at'])) {
          continue;
        }

        $fieldLabel = $this->getFieldLabel($key);
        $changes[] = "{$fieldLabel}: {$value}";
      }
    } elseif ($audit->event === 'deleted') {
      foreach ($audit->old_values ?? [] as $key => $value) {
        // Skip timestamps and certain fields
        if (in_array($key, ['updated_at', 'created_at', 'deleted_at'])) {
          continue;
        }

        $fieldLabel = $this->getFieldLabel($key);
        $changes[] = "{$fieldLabel}: {$value} (deleted)";
      }
    }

    return implode('; ', $changes);
  }

  private function getFieldLabel($key)
  {
    // Simple field label mapping - can be enhanced based on AuditHelper if available
    $labels = [
      'product_title' => 'Title',
      'product_code' => 'Code',
      'product_price' => 'Price',
      'product_stock' => 'Stock',
      'product_status' => 'Status',
      'name' => 'Name',
      'email' => 'Email',
      'status' => 'Status'
    ];

    return $labels[$key] ?? ucfirst(str_replace('_', ' ', $key));
  }

  /**
   * @return array
   */
}
