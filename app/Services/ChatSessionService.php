<?php

namespace App\Services;

use App\Models\ChatMessage;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ChatSessionService
{
  /**
   * Auto-assign a chat session to the least busy available support agent
   * Only assigns if session is not already assigned
   */
  public function autoAssignSession(string $sessionId): ?User
  {
    // Check if session is already assigned
    $existingAssignment = $this->getSessionAssignment($sessionId);
    if ($existingAssignment && $existingAssignment->assigned_to) {
      return User::find($existingAssignment->assigned_to);
    }

    // Get all support agents (users with support role)
    $supportAgents = User::role(['admin', 'support'])->get();

    if ($supportAgents->isEmpty()) {
      return null;
    }

    // Find the agent with the least active assignments
    $leastBusyAgent = $supportAgents->map(function ($agent) {
      $activeAssignments = ChatMessage::where('assigned_to', $agent->id)
        ->where('status', '!=', 'closed')
        ->distinct('session_id')
        ->count();

      return [
        'agent' => $agent,
        'active_assignments' => $activeAssignments
      ];
    })->sortBy('active_assignments')->first();

    if ($leastBusyAgent) {
      $this->assignSession($sessionId, $leastBusyAgent['agent']->id, 'auto-assigned');
      return $leastBusyAgent['agent'];
    }

    return null;
  }

  /**
   * Manually assign a session to a specific agent
   */
  public function assignSession(string $sessionId, int $agentId, string $assignmentType = 'assigned'): bool
  {
    return DB::transaction(function () use ($sessionId, $agentId, $assignmentType) {
      logger("Assigning session {$sessionId} to agent {$agentId} with type {$assignmentType}");

      // Update all messages in the session
      $updated = ChatMessage::where('session_id', $sessionId)->update([
        'assigned_to' => $agentId,
        'assigned_at' => now(),
        'assignment_status' => $assignmentType,
        'status' => 'pending' // Reset to pending if it was closed
      ]);

      logger("Updated {$updated} messages for session {$sessionId}");

      return true;
    });
  }

  /**
   * Unassign a session
   */
  public function unassignSession(string $sessionId): bool
  {
    return ChatMessage::where('session_id', $sessionId)->update([
      'assigned_to' => null,
      'assigned_at' => null,
      'assignment_status' => 'unassigned'
    ]);
  }

  /**
   * Get sessions assigned to a specific agent
   */
  public function getAssignedSessions(int $agentId)
  {
    return ChatMessage::selectRaw('
                session_id,
                MAX(created_at) as last_message_time,
                COUNT(*) as message_count,
                SUM(CASE WHEN is_read = 0 AND sender = "user" THEN 1 ELSE 0 END) as unread_count,
                MAX(CASE WHEN sender = "user" THEN user_name END) as user_name,
                MAX(CASE WHEN sender = "user" THEN user_email END) as user_email,
                MAX(CASE WHEN sender = "user" THEN user_phone END) as user_phone,
                MAX(status) as status,
                MAX(assignment_status) as assignment_status,
                MAX(assigned_at) as assigned_at
            ')
      ->where('assigned_to', $agentId)
      ->where('status', '!=', 'closed')
      ->groupBy('session_id')
      ->orderBy('last_message_time', 'desc')
      ->get();
  }

  /**
   * Get unassigned sessions
   */
  public function getUnassignedSessions()
  {
    return ChatMessage::selectRaw('
                session_id,
                MAX(created_at) as last_message_time,
                COUNT(*) as message_count,
                SUM(CASE WHEN is_read = 0 AND sender = "user" THEN 1 ELSE 0 END) as unread_count,
                MAX(CASE WHEN sender = "user" THEN user_name END) as user_name,
                MAX(CASE WHEN sender = "user" THEN user_email END) as user_email,
                MAX(CASE WHEN sender = "user" THEN user_phone END) as user_phone,
                MAX(status) as status,
                MAX(assignment_status) as assignment_status
            ')
      ->whereNull('assigned_to')
      ->where('status', '!=', 'closed')
      ->groupBy('session_id')
      ->orderBy('last_message_time', 'desc')
      ->get();
  }

  /**
   * Check if a session is assigned to a specific agent
   */
  public function isSessionAssignedTo(string $sessionId, int $agentId): bool
  {
    return ChatMessage::where('session_id', $sessionId)
      ->where('assigned_to', $agentId)
      ->exists();
  }

  /**
   * Get session assignment info
   */
  public function getSessionAssignment(string $sessionId)
  {
    $assignment = ChatMessage::where('session_id', $sessionId)
      ->with('assignedTo')
      ->first();

    if ($assignment) {
      logger("Session {$sessionId} assignment data:", [
        'assigned_to' => $assignment->assigned_to,
        'assignedTo' => $assignment->assignedTo ? [
          'id' => $assignment->assignedTo->id,
          'name' => $assignment->assignedTo->name,
          'email' => $assignment->assignedTo->email,
        ] : null,
        'assignment_status' => $assignment->assignment_status,
        'assigned_at' => $assignment->assigned_at,
      ]);
    }

    return $assignment;
  }

  /**
   * Update session user information to ensure consistency
   */
  public function updateSessionUserInfo(string $sessionId, array $userInfo): bool
  {
    // Only update messages that don't have user info or have incomplete info
    return ChatMessage::where('session_id', $sessionId)
      ->where(function ($query) {
        $query->whereNull('user_name')
          ->orWhereNull('user_email')
          ->orWhereNull('user_id');
      })
      ->update(array_filter($userInfo, function ($value) {
        return $value !== null;
      }));
  }

  /**
   * Get the active session for a user (if any)
   */
  public function getUserActiveSession(int $userId): ?string
  {
    $activeSession = ChatMessage::where('user_id', $userId)
      ->where('status', '!=', 'closed')
      ->orderBy('created_at', 'desc')
      ->first();

    return $activeSession ? $activeSession->session_id : null;
  }

  /**
   * Consolidate multiple sessions for the same user into one
   * Moves all messages to the most recent session and deletes old ones
   */
  public function consolidateUserSessions(int $userId): array
  {
    return DB::transaction(function () use ($userId) {
      // Get all sessions for this user
      $userSessions = ChatMessage::where('user_id', $userId)
        ->where('status', '!=', 'closed')
        ->selectRaw('session_id, MAX(created_at) as last_message_time, COUNT(*) as message_count')
        ->groupBy('session_id')
        ->orderBy('last_message_time', 'desc')
        ->get();

      if ($userSessions->count() <= 1) {
        return [
          'consolidated' => false,
          'message' => 'User has only one or no active sessions',
          'sessions_processed' => $userSessions->count()
        ];
      }

      // Keep the most recent session
      $keepSession = $userSessions->first();
      $oldSessions = $userSessions->slice(1);

      $totalMessagesConsolidated = 0;
      $sessionsRemoved = [];

      foreach ($oldSessions as $oldSession) {
        // Move all messages from old session to the keep session
        $messagesUpdated = ChatMessage::where('session_id', $oldSession->session_id)
          ->update(['session_id' => $keepSession->session_id]);

        $totalMessagesConsolidated += $messagesUpdated;
        $sessionsRemoved[] = $oldSession->session_id;
      }

      return [
        'consolidated' => true,
        'main_session_id' => $keepSession->session_id,
        'sessions_removed' => $sessionsRemoved,
        'messages_consolidated' => $totalMessagesConsolidated,
        'sessions_processed' => $userSessions->count()
      ];
    });
  }

  /**
   * Consolidate all duplicate sessions for all users
   */
  public function consolidateAllDuplicateSessions(): array
  {
    // Find users with multiple active sessions
    $usersWithMultipleSessions = ChatMessage::selectRaw('user_id, COUNT(DISTINCT session_id) as session_count')
      ->whereNotNull('user_id')
      ->where('status', '!=', 'closed')
      ->groupBy('user_id')
      ->having('session_count', '>', 1)
      ->get();

    $results = [];
    $totalConsolidated = 0;

    foreach ($usersWithMultipleSessions as $userSession) {
      $result = $this->consolidateUserSessions($userSession->user_id);
      if ($result['consolidated']) {
        $results[] = [
          'user_id' => $userSession->user_id,
          'result' => $result
        ];
        $totalConsolidated++;
      }
    }

    return [
      'users_processed' => $usersWithMultipleSessions->count(),
      'users_consolidated' => $totalConsolidated,
      'details' => $results
    ];
  }
}
