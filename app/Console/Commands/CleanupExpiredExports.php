<?php

namespace App\Console\Commands;

use App\Models\ExportRequest;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class CleanupExpiredExports extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'exports:cleanup';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up expired export files and database records';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Cleaning up expired export files...');

        // Get all expired export requests
        $expiredExports = ExportRequest::expired()->get();

        if ($expiredExports->isEmpty()) {
            $this->info('No expired export requests found.');
            return 0;
        }

        $this->info("Found {$expiredExports->count()} expired export request(s).");

        $filesDeleted = 0;
        $recordsDeleted = 0;

        foreach ($expiredExports as $exportRequest) {
            try {
                // Delete the file if it exists
                if ($exportRequest->file_path && Storage::exists($exportRequest->file_path)) {
                    Storage::delete($exportRequest->file_path);
                    $filesDeleted++;
                    $this->info("Deleted file: {$exportRequest->file_path}");
                }

                // Delete the database record
                $exportRequest->delete();
                $recordsDeleted++;

                Log::info("Cleaned up expired export request ID: {$exportRequest->id}");
            } catch (\Exception $e) {
                $this->error("Failed to cleanup export request ID: {$exportRequest->id}");
                Log::error("Failed to cleanup export request: " . $e->getMessage());
            }
        }

        $this->info("Cleanup completed. Files deleted: {$filesDeleted}, Records deleted: {$recordsDeleted}");
        return 0;
    }
}
