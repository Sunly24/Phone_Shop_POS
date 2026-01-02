<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Inventory;
use App\Exports\InventoryExport;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;

class ExportInventoryFiles extends Command
{
    protected $signature = 'inventory:export-files';
    protected $description = 'Export inventory to Excel and PDF and store in storage/app/public';

    public function handle()
    {
        $inventories = Inventory::with('product')->get();

        // Export Excel to public disk
        $excelFilename = "exports/inventory_list.xlsx";
        Excel::store(new InventoryExport($inventories), $excelFilename, 'public');
        $this->info("Excel exported: storage/app/public/{$excelFilename}");

        // Export PDF to public disk
        $pdfFilename = "exports/inventory_list.pdf";
        $pdf = Pdf::loadView('exports.inventory_pdf', [
            'inventories' => $inventories,
            'systemName' => 'Smart Tech POS',
            'date' => now()->format('F d, Y')
        ]);
        Storage::disk('public')->put($pdfFilename, $pdf->output());
        $this->info("PDF exported: storage/app/public/{$pdfFilename}");

        // Save export info (add status and message)
        $info = [
            'pdf' => $pdfFilename,
            'excel' => $excelFilename,
            'last_export' => now()->toDateTimeString(),
            'status' => 'success',
            'message' => 'Export completed successfully!',
        ];
        Storage::disk('local')->put('inventory_export_info.json', json_encode($info));
        $this->info("Inventory export info saved.");

        $this->info("Inventory export task completed.");
    }
}