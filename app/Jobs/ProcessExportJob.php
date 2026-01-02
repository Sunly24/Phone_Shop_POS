<?php

namespace App\Jobs;

use App\Models\ExportRequest;
use App\Models\Product;
use App\Models\Color;
use App\Exports\AuditLogExport;
use App\Exports\ProductsExport;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;
use Maatwebsite\Excel\Excel as ExcelWriter;
use Barryvdh\DomPDF\Facade\Pdf;
use OwenIt\Auditing\Models\Audit;

class ProcessExportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $exportRequest;

    /**
     * Create a new job instance.
     */
    public function __construct(ExportRequest $exportRequest)
    {
        $this->exportRequest = $exportRequest;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            Log::info('Processing export request ID: ' . $this->exportRequest->id);

            // Mark as processing
            $this->exportRequest->markAsProcessing();

            // Generate the export file
            $filePath = $this->generateExportFile();

            // Mark as completed
            $this->exportRequest->markAsCompleted($this->exportRequest->file_name, $filePath);

            Log::info('Export request completed successfully. ID: ' . $this->exportRequest->id);
        } catch (\Exception $e) {
            Log::error('Export job failed: ' . $e->getMessage());
            Log::error('Export job error trace: ' . $e->getTraceAsString());

            // Mark as failed
            $this->exportRequest->markAsFailed($e->getMessage());
        }
    }

    /**
     * Generate the export file based on export type and format
     */
    private function generateExportFile(): string
    {
        $timestamp = now()->format('Y-m-d_H-i-s');
        $exportType = $this->exportRequest->export_type;
        $format = $this->exportRequest->format;
        $filters = $this->exportRequest->filters ?? [];

        // Create exports directory if it doesn't exist
        $exportDir = 'exports/' . $exportType;
        if (!Storage::exists($exportDir)) {
            Storage::makeDirectory($exportDir);
        }

        switch ($exportType) {
            case 'audit_logs':
                return $this->generateAuditLogExport($timestamp, $format, $filters, $exportDir);

            case 'products':
                return $this->generateProductExport($timestamp, $format, $filters, $exportDir);

            default:
                throw new \Exception("Unknown export type: {$exportType}");
        }
    }

    /**
     * Generate audit log export
     */
    private function generateAuditLogExport(string $timestamp, string $format, array $filters, string $exportDir): string
    {
        $fileName = "audit_logs_{$timestamp}.{$format}";
        $filePath = "{$exportDir}/{$fileName}";

        // Update the export request with the filename
        $this->exportRequest->update(['file_name' => $fileName]);

        $search = $filters['search'] ?? null;

        switch ($format) {
            case 'pdf':
                // Use custom Blade template for PDF generation
                $this->generateAuditLogPdf($search, $filePath);
                break;

            case 'csv':
                $export = new AuditLogExport($search, false);
                Excel::store($export, $filePath, 'local', ExcelWriter::CSV);
                break;

            case 'xlsx':
            default:
                $export = new AuditLogExport($search, false);
                Excel::store($export, $filePath, 'local', ExcelWriter::XLSX);
                break;
        }

        return $filePath;
    }

    /**
     * Generate audit log PDF using custom Blade template
     */
    private function generateAuditLogPdf(string $search = null, string $filePath): void
    {
        // Fetch audit logs with same logic as the original export
        $query = Audit::with('user')->orderBy('created_at', 'desc');

        // Apply search filter
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('user', function ($userQuery) use ($search) {
                    $userQuery->where('name', 'like', '%' . $search . '%');
                })
                    ->orWhere('event', 'like', '%' . $search . '%')
                    ->orWhere('auditable_type', 'like', '%' . $search . '%')
                    ->orWhere('ip_address', 'like', '%' . $search . '%');
            });
        }

        $auditLogs = $query->get();

        // Generate PDF using the custom Blade template
        $pdf = Pdf::loadView('pdf.audit-logs', [
            'auditLogs' => $auditLogs,
            'search' => $search
        ]);

        // Set PDF options for better quality
        $pdf->setPaper('A4', 'portrait');
        $pdf->setOptions([
            'dpi' => 150,
            'defaultFont' => 'DejaVu Sans'
        ]);

        // Save the PDF to storage
        Storage::put($filePath, $pdf->output());
    }

    /**
     * Generate product export
     */
    private function generateProductExport(string $timestamp, string $format, array $filters, string $exportDir): string
    {
        $fileName = "products_{$timestamp}.{$format}";
        $filePath = "{$exportDir}/{$fileName}";

        // Update the export request with the filename
        $this->exportRequest->update(['file_name' => $fileName]);

        $search = $filters['search'] ?? null;
        $colorId = $filters['color_id'] ?? null;

        switch ($format) {
            case 'pdf':
                // Use custom PDF template for products (same as direct export)
                $this->generateProductPdf($search, $colorId, $filePath);
                break;

            case 'csv':
                $export = new ProductsExport($search, $colorId, true);
                Excel::store($export, $filePath, 'local', \Maatwebsite\Excel\Excel::CSV);
                break;

            case 'xlsx':
            default:
                $export = new ProductsExport($search, $colorId, false);
                Excel::store($export, $filePath, 'local');
                break;
        }

        return $filePath;
    }

    /**
     * Generate product PDF using custom Blade template
     */
    private function generateProductPdf(string $search = null, string $colorId = null, string $filePath): void
    {
        // Build query with same logic as the direct export
        $query = Product::with(['category', 'brand', 'maker', 'size', 'color']);

        // Apply filters
        if ($search) {
            $query->where('product_title', 'like', '%' . $search . '%');
        }

        if ($colorId) {
            $query->where('color_id', $colorId);
        }

        $products = $query->get();

        // Get color filter name if applied
        $colorFilter = null;
        if ($colorId) {
            $color = Color::find($colorId);
            $colorFilter = $color ? $color->color_title : 'Unknown Color';
        }

        // Generate PDF using the custom Blade template
        $pdf = Pdf::loadView('pdf.products', [
            'products' => $products,
            'search' => $search,
            'colorFilter' => $colorFilter,
        ]);

        // Set paper size and orientation (same as direct export)
        $pdf->setPaper('A4', 'landscape');

        // Save the PDF to storage
        Storage::put($filePath, $pdf->output());
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Export job failed permanently: ' . $exception->getMessage());
        $this->exportRequest->markAsFailed($exception->getMessage());
    }
}
