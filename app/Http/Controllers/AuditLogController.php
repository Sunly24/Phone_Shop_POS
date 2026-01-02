<?php

namespace App\Http\Controllers;

use App\Helpers\AuditHelper;
use Illuminate\Http\Request;
use OwenIt\Auditing\Models\Audit;
use Inertia\Inertia;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Facades\Excel;
use Maatwebsite\Excel\Excel as ExcelWriter;
use App\Exports\AuditLogExport;
use Illuminate\Support\Facades\Auth;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\ExportRequest;
use App\Jobs\ProcessExportJob;

class AuditLogController extends Controller
{
  public function index(Request $request)
  {
    $search = $request->input('search');
    $perPage = $request->input('per_page', 10);

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

    $auditLogs = $query->paginate($perPage)->appends(request()->query());

    // Transform the data
    $auditLogs->getCollection()->transform(function ($audit) {
      return [
        'id' => $audit->id,
        'user' => $audit->user ? $audit->user->name : 'System',
        'event' => $audit->event,
        'type' => class_basename($audit->auditable_type),
        'date' => $audit->created_at,
        'ip_address' => $audit->ip_address,
        'url' => $audit->url,
        'user_agent' => $audit->user_agent,
        'details' => [
          'summary' => $this->getEventSummary($audit),
          'changes' => $this->formatChanges($audit)
        ]
      ];
    });

    if (request()->wantsJson()) {
      return response()->json($auditLogs);
    }

    return Inertia::render('AuditLog/Index', [
      'auditLogs' => $auditLogs,
      'filters' => [
        'search' => $search,
        'per_page' => $perPage
      ]
    ]);
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

  private function formatChanges($audit)
  {
    $changes = [];

    if ($audit->event === 'updated') {
      $old = $audit->old_values;
      $new = $audit->new_values;

      foreach ($new as $key => $value) {
        // Skip timestamps and certain fields
        if (in_array($key, ['updated_at', 'created_at', 'deleted_at'])) {
          continue;
        }

        // Get display values using AuditHelper
        $oldValue = AuditHelper::getDisplayValue($key, $old[$key] ?? null, $audit);
        $newValue = AuditHelper::getDisplayValue($key, $value, $audit);

        $changes[] = [
          'field' => AuditHelper::getFieldLabel($key),
          'old_value' => $oldValue,
          'new_value' => $newValue
        ];
      }
    } elseif ($audit->event === 'created') {
      foreach ($audit->new_values as $key => $value) {
        // Skip timestamps and certain fields
        if (in_array($key, ['updated_at', 'created_at', 'deleted_at'])) {
          continue;
        }

        // Get display value using AuditHelper
        $newValue = AuditHelper::getDisplayValue($key, $value, $audit);

        $changes[] = [
          'field' => AuditHelper::getFieldLabel($key),
          'new_value' => $newValue
        ];
      }
    } elseif ($audit->event === 'deleted') {
      foreach ($audit->old_values as $key => $value) {
        // Skip timestamps and certain fields
        if (in_array($key, ['updated_at', 'created_at', 'deleted_at'])) {
          continue;
        }

        // Get display value using AuditHelper
        $oldValue = AuditHelper::getDisplayValue($key, $value, $audit);

        $changes[] = [
          'field' => AuditHelper::getFieldLabel($key),
          'old_value' => $oldValue
        ];
      }
    }

    return $changes;
  }

  /**
   * Queue audit logs export request with 2-minute delay
   *
   * @param \Illuminate\Http\Request $request
   * @return \Illuminate\Http\RedirectResponse
   */
  public function export(Request $request)
  {
    try {
      // Check if user is authenticated
      if (!Auth::check()) {
        return redirect()->route('login');
      }

      // Get format from request (default to xlsx)
      $format = $request->input('format', 'xlsx');

      // Get filters from request
      $filters = [
        'search' => $request->input('search')
      ];

      // Create export request
      $exportRequest = ExportRequest::create([
        'user_id' => Auth::id(),
        'export_type' => 'audit_logs',
        'format' => $format,
        'filters' => $filters,
        'status' => ExportRequest::STATUS_PENDING,
        'requested_at' => now()
      ]);

      Log::info("Created audit log export request ID: {$exportRequest->id} for user: " . Auth::user()->name);

      return back()->with('success', 'Export request submitted successfully! Your file will be ready for download in 2 minutes. You will be notified when it\'s ready.');
    } catch (\Exception $e) {
      Log::error('Audit log export request failed: ' . $e->getMessage());
      Log::error('Audit log export error trace: ' . $e->getTraceAsString());
      return back()->withErrors(['error' => 'Failed to submit export request: ' . $e->getMessage()]);
    }
  }

  /**
   * Download completed export file
   *
   * @param \Illuminate\Http\Request $request
   * @return \Symfony\Component\HttpFoundation\BinaryFileResponse
   */
  public function downloadExport(Request $request)
  {
    try {
      // Check if user is authenticated
      if (!Auth::check()) {
        return redirect()->route('login');
      }

      $exportId = $request->input('export_id');

      // Find the export request
      $exportRequest = ExportRequest::where('id', $exportId)
        ->where('user_id', Auth::id())
        ->first();

      if (!$exportRequest) {
        return back()->withErrors(['error' => 'Export request not found.']);
      }

      if (!$exportRequest->isReady()) {
        return back()->withErrors(['error' => 'Export file is not ready yet or has expired.']);
      }

      if ($exportRequest->isExpired()) {
        return back()->withErrors(['error' => 'Export file has expired.']);
      }

      $filePath = storage_path('app/' . $exportRequest->file_path);

      if (!file_exists($filePath)) {
        return back()->withErrors(['error' => 'Export file not found.']);
      }

      Log::info("User {$exportRequest->user->name} downloading export: {$exportRequest->file_name}");

      return response()->download($filePath, $exportRequest->file_name);
    } catch (\Exception $e) {
      Log::error('Export download failed: ' . $e->getMessage());
      return back()->withErrors(['error' => 'Failed to download export: ' . $e->getMessage()]);
    }
  }

  /**
   * Get user's export requests
   *
   * @param \Illuminate\Http\Request $request
   * @return \Illuminate\Http\JsonResponse
   */
  public function getExportRequests(Request $request)
  {
    try {
      if (!Auth::check()) {
        return response()->json(['error' => 'Unauthorized'], 401);
      }

      $exportRequests = ExportRequest::where('user_id', Auth::id())
        ->where('export_type', 'audit_logs')
        ->orderBy('requested_at', 'desc')
        ->take(10)
        ->get()
        ->map(function ($request) {
          return [
            'id' => $request->id,
            'format' => $request->format,
            'status' => $request->status,
            'file_name' => $request->file_name,
            'requested_at' => $request->requested_at,
            'processed_at' => $request->processed_at,
            'expires_at' => $request->expires_at,
            'error_message' => $request->error_message,
            'is_ready' => $request->isReady(),
            'is_expired' => $request->isExpired()
          ];
        });

      return response()->json($exportRequests);
    } catch (\Exception $e) {
      Log::error('Failed to get export requests: ' . $e->getMessage());
      return response()->json(['error' => 'Failed to get export requests'], 500);
    }
  }

  /**
   * Export audit logs to PDF using DOMPDF with HTML template
   *
   * @param \Illuminate\Http\Request $request
   * @return \Illuminate\Http\Response
   */
  public function exportPdf(Request $request)
  {
    try {
      // Check if user is authenticated
      if (!Auth::check()) {
        return redirect()->route('login');
      }

      // Get search filter from request
      $search = $request->input('search');

      // Build query
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

      // Generate PDF using HTML template
      $pdf = Pdf::loadView('pdf.audit-logs', [
        'auditLogs' => $auditLogs,
        'search' => $search,
      ]);

      // Set paper size and orientation
      $pdf->setPaper('A4', 'landscape');

      // Generate filename with timestamp
      $timestamp = now()->format('Y-m-d_H-i-s');
      $filename = "audit_logs_{$timestamp}.pdf";

      // Return the PDF download
      return $pdf->download($filename);
    } catch (\Exception $e) {
      Log::error('Audit log PDF export failed: ' . $e->getMessage());
      Log::error('PDF export error trace: ' . $e->getTraceAsString());
      return back()->withErrors(['error' => 'Failed to export audit logs to PDF: ' . $e->getMessage()]);
    }
  }

  /**
   * Smart export - automatically chooses direct or queue based on data size
   *
   * @param \Illuminate\Http\Request $request
   * @return \Illuminate\Http\Response
   */
  public function exportDirect(Request $request)
  {
    try {
      // Check if user is authenticated
      if (!Auth::check()) {
        Log::info('Export failed: User not authenticated');
        return response()->json(['error' => 'User not authenticated'], 401);
      }

      Log::info('Export started for user: ' . Auth::id());

      // Get format from request (default to xlsx)
      $format = $request->input('format', 'xlsx');

      // Get filters from request
      $search = $request->input('search');

      Log::info('Export parameters', ['format' => $format, 'search' => $search]);

      // Build query to check data size
      $query = Audit::with('user')->orderBy('created_at', 'desc');

      // Apply filters
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

      // Check the total count first
      $totalRecords = $query->count();
      Log::info('Total records for export: ' . $totalRecords);

      // Define thresholds
      $SMALL_EXPORT_LIMIT = 1000;  // Direct download
      $MEDIUM_EXPORT_LIMIT = 5000; // Queue with faster processing

      if ($totalRecords <= $SMALL_EXPORT_LIMIT) {
        // Small dataset - Direct download
        Log::info('Processing direct export');
        return $this->processDirectExport($query, $format, $search);
      } elseif ($totalRecords <= $MEDIUM_EXPORT_LIMIT) {
        // Medium dataset - Queue with high priority
        Log::info('Processing queue export - high priority');
        return $this->processQueueExport($request, 'high', $totalRecords);
      } else {
        // Large dataset - Queue with normal priority
        Log::info('Processing queue export - normal priority');
        return $this->processQueueExport($request, 'normal', $totalRecords);
      }
    } catch (\Exception $e) {
      Log::error('Smart audit export failed: ' . $e->getMessage());
      Log::error('Smart audit export error trace: ' . $e->getTraceAsString());
      return back()->withErrors(['error' => 'Failed to export audit logs: ' . $e->getMessage()]);
    }
  }

  /**
   * Process direct export for small datasets
   */
  private function processDirectExport($query, $format, $search)
  {
    // Direct processing for small datasets
    $auditLogs = $query->get();
    $timestamp = now()->format('Y-m-d_H-i-s');

    if ($format === 'pdf') {
      return $this->generatePdfExport($auditLogs, $search, $timestamp);
    } else {
      return $this->generateExcelExport($auditLogs, $format, $timestamp, $search);
    }
  }

  /**
   * Process queue export for medium/large datasets
   */
  private function processQueueExport($request, $priority = 'normal', $recordCount = 0)
  {
    // Get filters from request
    $filters = [
      'search' => $request->input('search')
    ];

    // Create export request with priority and record count
    $exportRequest = ExportRequest::create([
      'user_id' => Auth::id(),
      'export_type' => 'audit_logs',
      'format' => $request->input('format', 'xlsx'),
      'filters' => $filters,
      'status' => ExportRequest::STATUS_PENDING,
      'priority' => $priority,
      'record_count' => $recordCount,
      'requested_at' => now()
    ]);

    // For high priority, process immediately
    if ($priority === 'high') {
      ProcessExportJob::dispatch($exportRequest)->onQueue('high');
      $estimatedTime = '1-2 minutes';
    } else {
      ProcessExportJob::dispatch($exportRequest)->onQueue('default');
      $estimatedTime = '3-5 minutes';
    }

    // Return JSON response for AJAX requests
    if ($request->wantsJson()) {
      return response()->json([
        'success' => true,
        'message' => "Export queued successfully! Estimated time: {$estimatedTime}",
        'export_id' => $exportRequest->id,
        'estimated_time' => $estimatedTime,
        'record_count' => $recordCount
      ]);
    }

    return back()->with('success', "Export queued successfully! Your file with {$recordCount} records will be ready in {$estimatedTime}. Check the notification bell for updates.");
  }

  /**
   * Generate PDF export
   */
  private function generatePdfExport($auditLogs, $search, $timestamp)
  {
    // Generate PDF using HTML template
    $pdf = Pdf::loadView('pdf.audit-logs', [
      'auditLogs' => $auditLogs,
      'search' => $search,
    ]);

    // Set paper size and orientation
    $pdf->setPaper('A4', 'portrait');

    $filename = "audit_logs_{$timestamp}.pdf";
    return $pdf->download($filename);
  }

  /**
   * Generate Excel/CSV export
   */
  private function generateExcelExport($auditLogs, $format, $timestamp, $search = null)
  {
    Log::info('Generating Excel export', ['format' => $format, 'timestamp' => $timestamp]);

    $extension = $format === 'csv' ? 'csv' : 'xlsx';
    $filename = "audit_logs_{$timestamp}.{$extension}";

    // Create the export using the existing AuditLogExport class
    $export = new AuditLogExport($search, false);

    try {
      if ($format === 'csv') {
        // Generate CSV and return as download directly
        return Excel::download($export, $filename, ExcelWriter::CSV);
      } else {
        // Generate Excel and return as download directly
        return Excel::download($export, $filename, ExcelWriter::XLSX);
      }
    } catch (\Exception $e) {
      Log::error('Error generating Excel export: ' . $e->getMessage());
      throw $e;
    }
  }

  /**
   * Get export notifications for the notification dropdown
   */
  public function getExportNotifications(Request $request)
  {
    try {
      if (!Auth::check()) {
        return response()->json(['error' => 'Unauthorized'], 401);
      }

      // Simple cache key for user's audit export notifications
      $cacheKey = "export_notifications_audit_logs_" . Auth::id();

      // Check if we have cached data (cache for 15 seconds to reduce DB load)
      $cachedData = Cache::get($cacheKey);
      if ($cachedData) {
        return response()->json($cachedData);
      }

      $notifications = ExportRequest::where('user_id', Auth::id())
        ->where('export_type', 'audit_logs')
        ->notDismissed() // Exclude dismissed notifications
        ->orderBy('requested_at', 'desc')
        ->take(10)
        ->get()
        ->map(function ($exportRequest) {
          return [
            'id' => $exportRequest->id,
            'title' => 'Audit Logs Export (' . strtoupper($exportRequest->format) . ')',
            'message' => $this->getExportStatusText($exportRequest),
            'status' => $exportRequest->status,
            'priority' => $exportRequest->priority ?? 'normal',
            'record_count' => $exportRequest->record_count,
            'progress' => $this->getProgressPercentage($exportRequest),
            'timestamp' => $exportRequest->requested_at,
            'time_ago' => $exportRequest->requested_at->diffForHumans(),
            'download_url' => $exportRequest->isReady() ? route('audit-logs.download-export', ['export_id' => $exportRequest->id]) : null,
            'can_download' => $exportRequest->isReady(),
          ];
        });

      $responseData = [
        'notifications' => $notifications,
        'total_count' => $notifications->count()
      ];

      // Cache the response for 15 seconds to reduce DB load during frequent polling
      Cache::put($cacheKey, $responseData, 15);

      return response()->json($responseData);
    } catch (\Exception $e) {
      Log::error('Failed to get audit export notifications: ' . $e->getMessage());
      return response()->json(['error' => 'Failed to get notifications'], 500);
    }
  }

  /**
   * Get user-friendly status text for export notifications
   */
  private function getExportStatusText($exportRequest)
  {
    switch ($exportRequest->status) {
      case ExportRequest::STATUS_PENDING:
        $estimatedTime = ($exportRequest->priority === 'high') ? '1-2 minutes' : '3-5 minutes';
        return "Export queued. Estimated time: {$estimatedTime}";
      case ExportRequest::STATUS_PROCESSING:
        return 'Export in progress...';
      case ExportRequest::STATUS_COMPLETED:
        return 'Export completed! Click to download.';
      case ExportRequest::STATUS_FAILED:
        return 'Export failed. Please try again.';
      default:
        return 'Unknown status';
    }
  }

  /**
   * Get progress percentage for export notifications
   */
  private function getProgressPercentage($exportRequest)
  {
    switch ($exportRequest->status) {
      case ExportRequest::STATUS_PENDING:
        return 10;
      case ExportRequest::STATUS_PROCESSING:
        return 50;
      case ExportRequest::STATUS_COMPLETED:
        return 100;
      case ExportRequest::STATUS_FAILED:
        return 0;
      default:
        return 0;
    }
  }

  /**
   * Dismiss export notification
   */
  public function dismissNotification(Request $request, $id)
  {
    try {
      $exportRequest = ExportRequest::where('id', $id)
        ->where('user_id', Auth::id())
        ->where('export_type', 'audit_logs')
        ->first();

      if (!$exportRequest) {
        return response()->json(['error' => 'Notification not found'], 404);
      }

      $exportRequest->markAsDismissed();

      return response()->json(['success' => true, 'message' => 'Notification dismissed']);
    } catch (\Exception $e) {
      Log::error('Failed to dismiss notification: ' . $e->getMessage());
      return response()->json(['error' => 'Failed to dismiss notification'], 500);
    }
  }
}
