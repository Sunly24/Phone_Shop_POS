<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChatMessage extends Model
{
  protected $fillable = [
    'session_id',
    'message',
    'sender',
    'user_name',
    'user_email',
    'user_phone',
    'user_id',
    'support_user_id',
    'assigned_to',
    'assigned_at',
    'assignment_status',
    'is_read',
    'status',
    'read_at',
    'ip_address',
    'user_agent'
  ];

  protected $casts = [
    'is_read' => 'boolean',
    'read_at' => 'datetime',
    'assigned_at' => 'datetime',
    'created_at' => 'datetime',
    'updated_at' => 'datetime',
  ];

  public function user(): BelongsTo
  {
    return $this->belongsTo(User::class);
  }

  public function supportUser(): BelongsTo
  {
    return $this->belongsTo(User::class, 'support_user_id');
  }

  public function assignedTo(): BelongsTo
  {
    return $this->belongsTo(User::class, 'assigned_to');
  }

  public function scopeBySession($query, $sessionId)
  {
    return $query->where('session_id', $sessionId);
  }

  public function scopeUnread($query)
  {
    return $query->where('is_read', false);
  }

  public function scopePending($query)
  {
    return $query->where('status', 'pending');
  }

  public function scopeAssigned($query)
  {
    return $query->whereNotNull('assigned_to');
  }

  public function scopeUnassigned($query)
  {
    return $query->whereNull('assigned_to');
  }

  public function scopeAssignedToUser($query, $userId)
  {
    return $query->where('assigned_to', $userId);
  }
}
