<?php

namespace App\Console\Commands;

use App\Models\ExportRequest;
use App\Jobs\ProcessExportJob;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ProcessExports extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'exports:process';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process pending export requests that have waited for 2 minutes';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking for pending export requests...');

        // Get all export requests that are ready for processing (waited 2 minutes)
        $pendingExports = ExportRequest::readyForProcessing()->get();

        if ($pendingExports->isEmpty()) {
            $this->info('No pending export requests found.');
            return 0;
        }

        $this->info("Found {$pendingExports->count()} export request(s) ready for processing.");

        foreach ($pendingExports as $exportRequest) {
            try {
                $this->info("Processing export request ID: {$exportRequest->id} for user: {$exportRequest->user->name}");

                // Dispatch the job to process the export
                ProcessExportJob::dispatch($exportRequest);

                Log::info("Dispatched export job for request ID: {$exportRequest->id}");
            } catch (\Exception $e) {
                $this->error("Failed to dispatch export job for request ID: {$exportRequest->id}");
                Log::error("Failed to dispatch export job: " . $e->getMessage());

                // Mark the request as failed
                $exportRequest->markAsFailed($e->getMessage());
            }
        }

        $this->info('Export processing completed.');
        return 0;
    }
}
