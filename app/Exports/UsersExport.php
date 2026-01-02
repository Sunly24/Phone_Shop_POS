<?php

namespace App\Exports;

use App\Models\User;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithProperties;
use Maatwebsite\Excel\Events\AfterSheet;

class UsersExport implements FromCollection, WithHeadings, WithMapping, WithEvents, WithTitle, WithProperties
{
    private $search;
    private $users;
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
        $query = User::with('roles');

        // Apply search filter
        if ($this->search) {
            $query->where(function ($q) {
                $q->where('name', 'like', '%' . $this->search . '%')
                    ->orWhere('email', 'like', '%' . $this->search . '%');
            });
        }

        $this->users = $query->get();

        // For PDF mode, add header rows
        if ($this->isPdfMode) {
            $collection = collect();

            // Add header information rows
            $emptyRow = ['', '', '', '', ''];

            $collection->push($emptyRow); // Empty row for company name
            $collection->push($emptyRow); // Empty row for report name
            $collection->push($emptyRow); // Empty row for date range
            $collection->push($emptyRow); // Empty row for spacing

            // Add actual user data
            foreach ($this->users as $user) {
                $collection->push($user);
            }

            return $collection;
        }

        return $this->users;
    }

    /**
     * @param mixed $row
     * @return array
     */
    public function map($row): array
    {
        // Handle header rows for PDF mode (first 4 rows)
        if ($this->isPdfMode && !($row instanceof User)) {
            if (is_array($row)) {
                return $row;
            }
            return ['', '', '', '', ''];
        }

        $user = $row;

        return [
            $user->id,
            $user->name,
            $user->email,
            $user->roles->first() ? $user->roles->first()->name : '',
            $user->created_at ? $user->created_at->format('d/m/Y') : '',
        ];
    }

    /**
     * Write code on Method
     *
     * @return response()
     */
    public function headings(): array
    {
        return ["ID", "Name", "Email", "Role", "Created At"];
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
                    $sheet->mergeCells('A1:E1');
                    $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(18);
                    $sheet->getStyle('A1')->getAlignment()->setHorizontal('center');

                    // Add report name
                    $sheet->setCellValue('A2', 'Users Report');
                    $sheet->mergeCells('A2:E2');
                    $sheet->getStyle('A2')->getFont()->setBold(true)->setSize(14);
                    $sheet->getStyle('A2')->getAlignment()->setHorizontal('center');

                    // Add date range and search info
                    $dateRange = 'Generated on: ' . now()->format('F j, Y \a\t g:i A');
                    if ($this->search) {
                        $dateRange .= ' | Search: ' . $this->search;
                    }
                    $dateRange .= ' | Total Users: ' . $this->users->count();

                    $sheet->setCellValue('A3', $dateRange);
                    $sheet->mergeCells('A3:E3');
                    $sheet->getStyle('A3')->getFont()->setBold(true)->setSize(11);
                    $sheet->getStyle('A3')->getAlignment()->setHorizontal('center');

                    // Empty row for spacing
                    $sheet->setCellValue('A4', '');

                    // Style the column headers (now at row 5)
                    $sheet->getStyle('A5:E5')->getFont()->setBold(true)->setSize(10);
                    $sheet->getStyle('A5:E5')->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID);
                    $sheet->getStyle('A5:E5')->getFill()->getStartColor()->setRGB('2171B5');
                    $sheet->getStyle('A5:E5')->getFont()->getColor()->setRGB('FFFFFF');
                    $sheet->getStyle('A5:E5')->getBorders()->getAllBorders()->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN);

                    // Add borders to all data
                    $lastRow = $sheet->getHighestRow();
                    if ($lastRow > 5) {
                        $sheet->getStyle('A5:E' . $lastRow)->getBorders()->getAllBorders()->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN);

                        // Alternate row colors for better readability
                        for ($row = 6; $row <= $lastRow; $row++) {
                            if (($row - 6) % 2 == 1) {
                                $sheet->getStyle('A' . $row . ':E' . $row)->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID);
                                $sheet->getStyle('A' . $row . ':E' . $row)->getFill()->getStartColor()->setRGB('F8F9FA');
                            }
                        }
                    }
                } else {
                    // Add company header first for Excel export
                    $this->addCompanyHeader($sheet);

                    // Enhanced Excel formatting
                    $lastRow = $sheet->getHighestRow();
                    $lastColumn = 'E';
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
                    $sheet->getColumnDimension('A')->setWidth(8);   // ID
                    $sheet->getColumnDimension('B')->setWidth(25);  // Name
                    $sheet->getColumnDimension('C')->setWidth(30);  // Email
                    $sheet->getColumnDimension('D')->setWidth(15);  // Role
                    $sheet->getColumnDimension('E')->setWidth(15);  // Created At

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
        return 'Users ' . now()->format('Y-m-d');
    }

    /**
     * Set Excel document properties
     */
    public function properties(): array
    {
        return [
            'creator'        => 'Phone Shop System',
            'lastModifiedBy' => 'Phone Shop System',
            'title'          => 'Users Report',
            'description'    => 'System users export generated on ' . now()->format('Y-m-d H:i:s'),
            'subject'        => 'Users',
            'keywords'       => 'users,system,export',
            'category'       => 'Reports',
            'manager'        => 'Phone Shop Admin',
            'company'        => 'Phone Shop Company',
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
        $sheet->mergeCells('A1:E1');
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
        $sheet->setCellValue('A2', 'Users Report');
        $sheet->mergeCells('A2:E2');
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
        $reportInfo .= ' | Total Users: ' . $this->users->count();

        $sheet->setCellValue('A3', $reportInfo);
        $sheet->mergeCells('A3:E3');
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
}
