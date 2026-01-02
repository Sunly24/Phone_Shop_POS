<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class ExportRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'export_type',
        'format',
        'filters',
        'status',
        'priority',
        'record_count',
        'file_name',
        'file_path',
        'error_message',
        'requested_at',
        'processed_at',
        'expires_at',
        'dismissed_at'
    ];

    protected $casts = [
        'filters' => 'array',
        'requested_at' => 'datetime',
        'processed_at' => 'datetime',
        'expires_at' => 'datetime',
        'dismissed_at' => 'datetime'
    ];

    const STATUS_PENDING = 'pending';
    const STATUS_PROCESSING = 'processing';
    const STATUS_COMPLETED = 'completed';
    const STATUS_FAILED = 'failed';

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if the export request is ready for download
     */
    public function isReady(): bool
    {
        return $this->status === self::STATUS_COMPLETED &&
            $this->file_path &&
            file_exists(storage_path('app/' . $this->file_path));
    }

    /**
     * Check if the export request has expired
     */
    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    /**
     * Mark as processing
     */
    public function markAsProcessing(): void
    {
        $this->update([
            'status' => self::STATUS_PROCESSING,
            'processed_at' => now()
        ]);
    }

    /**
     * Mark as completed
     */
    public function markAsCompleted(string $fileName, string $filePath): void
    {
        $this->update([
            'status' => self::STATUS_COMPLETED,
            'file_name' => $fileName,
            'file_path' => $filePath,
            'processed_at' => now(),
            'expires_at' => now()->addDays(7) // Files expire after 7 days
        ]);
    }

    /**
     * Mark as failed
     */
    public function markAsFailed(string $errorMessage): void
    {
        $this->update([
            'status' => self::STATUS_FAILED,
            'error_message' => $errorMessage,
            'processed_at' => now()
        ]);
    }

    /**
     * Scope for pending requests that should be processed
     */
    public function scopeReadyForProcessing($query)
    {
        return $query->where('status', self::STATUS_PENDING)
            ->where('requested_at', '<=', now()->subMinutes(2));
    }

    /**
     * Scope for expired requests
     */
    public function scopeExpired($query)
    {
        return $query->where('expires_at', '<=', now())
            ->whereNotNull('expires_at');
    }

    /**
     * Check if notification is dismissed
     */
    public function isDismissed(): bool
    {
        return !is_null($this->dismissed_at);
    }

    /**
     * Mark notification as dismissed
     */
    public function markAsDismissed(): void
    {
        $this->update(['dismissed_at' => now()]);
    }

    /**
     * Scope for non-dismissed notifications
     */
    public function scopeNotDismissed($query)
    {
        return $query->whereNull('dismissed_at');
    }
}
