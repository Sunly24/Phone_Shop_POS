<?php

namespace App\Http\Controllers;

use App\Models\ChatMessage;
use App\Models\User;
use App\Events\MessageSent;
use App\Services\ChatSessionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Illuminate\Support\Str;

class ChatController extends Controller
{
  protected $chatSessionService;

  public function __construct(ChatSessionService $chatSessionService)
  {
    $this->chatSessionService = $chatSessionService;
  }

  public function index(Request $request)
  {
    $user = Auth::user();
    $filter = $request->get('filter', 'all'); // all, assigned, unassigned

    // Base query
    $query = ChatMessage::with(['user', 'supportUser', 'assignedTo'])
      ->orderBy('created_at', 'desc');

    // Filter by status
    if ($request->status && $request->status !== 'all') {
      $query->where('status', $request->status);
    }

    // Search by user name or email
    if ($request->search) {
      $search = $request->search;
      $query->where(function ($q) use ($search) {
        $q->where('user_name', 'like', "%{$search}%")
          ->orWhere('user_email', 'like', "%{$search}%")
          ->orWhere('message', 'like', "%{$search}%");
      });
    }

    $messages = $query->paginate(15);

    // Get chat sessions based on filter
    $sessionsQuery = ChatMessage::selectRaw('
                chat_messages.session_id,
                MAX(chat_messages.created_at) as last_message_time,
                COUNT(*) as message_count,
                SUM(CASE WHEN chat_messages.is_read = 0 AND chat_messages.sender = "user" THEN 1 ELSE 0 END) as unread_count,
                MAX(CASE WHEN chat_messages.sender = "user" THEN COALESCE(chat_messages.user_name, users.name) END) as user_name,
                MAX(CASE WHEN chat_messages.sender = "user" THEN COALESCE(chat_messages.user_email, users.email) END) as user_email,
                MAX(CASE WHEN chat_messages.sender = "user" THEN chat_messages.user_phone END) as user_phone,
                MAX(CASE WHEN chat_messages.sender = "user" THEN chat_messages.user_id END) as user_id,
                MAX(chat_messages.status) as status,
                MAX(chat_messages.assigned_to) as assigned_to,
                MAX(chat_messages.assignment_status) as assignment_status,
                MAX(chat_messages.assigned_at) as assigned_at,
                MAX(assigned_users.name) as assignedTo_name,
                MAX(assigned_users.email) as assignedTo_email,
                MAX(assigned_users.id) as assignedTo_id
            ')
      ->leftJoin('users', 'chat_messages.user_id', '=', 'users.id')
      ->leftJoin('users as assigned_users', 'chat_messages.assigned_to', '=', 'assigned_users.id');

    // Filter by status for sessions as well
    if ($request->status && $request->status !== 'all') {
      $sessionsQuery->where('chat_messages.status', $request->status);
    }

    // Search in sessions
    if ($request->search) {
      $search = $request->search;
      $sessionsQuery->where(function ($q) use ($search) {
        $q->where('chat_messages.user_name', 'like', "%{$search}%")
          ->orWhere('chat_messages.user_email', 'like', "%{$search}%")
          ->orWhere('users.name', 'like', "%{$search}%")
          ->orWhere('users.email', 'like', "%{$search}%")
          ->orWhere('chat_messages.message', 'like', "%{$search}%");
      });
    }

    // Apply filters
    switch ($filter) {
      case 'assigned':
        $sessionsQuery->where('chat_messages.assigned_to', $user->id);
        break;
      case 'unassigned':
        $sessionsQuery->whereNull('chat_messages.assigned_to');
        break;
      case 'my-team':
        // Show sessions assigned to current user or unassigned
        $sessionsQuery->where(function ($q) use ($user) {
          $q->where('chat_messages.assigned_to', $user->id)->orWhereNull('chat_messages.assigned_to');
        });
        break;
      default:
        // Show all sessions for admin/manager, only assigned for regular support
        if (!$user->hasRole(['admin', 'manager'])) {
          $sessionsQuery->where(function ($q) use ($user) {
            $q->where('chat_messages.assigned_to', $user->id)->orWhereNull('chat_messages.assigned_to');
          });
        }
        break;
    }

    $sessions = $sessionsQuery
      ->groupBy('chat_messages.session_id')
      ->orderBy('last_message_time', 'desc')
      ->limit(20)
      ->get()
      ->map(function ($session) {
        // Transform assignedTo data into proper object format
        if ($session->assigned_to && $session->assignedTo_id) {
          $session->assignedTo = (object) [
            'id' => $session->assignedTo_id,
            'name' => $session->assignedTo_name,
            'email' => $session->assignedTo_email,
          ];
        } else {
          $session->assignedTo = null;
        }

        // Clean up the raw fields
        unset($session->assignedTo_id, $session->assignedTo_name, $session->assignedTo_email);

        // Add debug logging
        if ($session->assigned_to) {
          logger("Session {$session->session_id} assigned to user {$session->assigned_to}", [
            'assignedTo' => $session->assignedTo
          ]);
        }

        return $session;
      });

    return Inertia::render('Admin/Chat/Index', [
      'messages' => $messages,
      'sessions' => $sessions,
      'filters' => $request->only(['search', 'status', 'filter']),
      'currentFilter' => $filter,
      'assignmentStats' => [
        'total' => ChatMessage::distinct('session_id')->where('status', '!=', 'closed')->count(),
        'assigned' => ChatMessage::distinct('session_id')->whereNotNull('assigned_to')->where('status', '!=', 'closed')->count(),
        'unassigned' => ChatMessage::distinct('session_id')->whereNull('assigned_to')->where('status', '!=', 'closed')->count(),
        'my_sessions' => ChatMessage::distinct('session_id')->where('assigned_to', $user->id)->where('status', '!=', 'closed')->count(),
      ]
    ]);
  }

  public function show($sessionId)
  {
    $messages = ChatMessage::bySession($sessionId)
      ->with(['user', 'supportUser'])
      ->orderBy('created_at', 'asc')
      ->get();

    // Mark user messages as read
    ChatMessage::bySession($sessionId)
      ->where('sender', 'user')
      ->where('is_read', false)
      ->update(['is_read' => true, 'read_at' => now()]);

    if ($messages->isEmpty()) {
      return redirect()->route('chat.index')
        ->with('error', 'Chat session not found.');
    }

    // Get assignment information
    $assignment = $this->chatSessionService->getSessionAssignment($sessionId);
    $assignedAgent = null;
    if ($assignment && $assignment->assigned_to) {
      $assignedAgent = User::find($assignment->assigned_to);
    }

    // Get available agents for assignment
    $availableAgents = User::whereHas('roles', function ($query) {
      $query->whereIn('name', ['admin', 'manager', 'support']);
    })->select('id', 'name', 'email')->get();

    return Inertia::render('Admin/Chat/Show', [
      'messages' => $messages,
      'sessionId' => $sessionId,
      'sessionInfo' => [
        'user_name' => $messages->where('sender', 'user')->first()?->user_name ??
          ($messages->where('sender', 'user')->first()?->user?->name ?? 'Anonymous User'),
        'user_email' => $messages->where('sender', 'user')->first()?->user_email ??
          ($messages->where('sender', 'user')->first()?->user?->email ?? 'No email provided'),
        'user_phone' => $messages->where('sender', 'user')->first()?->user_phone,
        'status' => $messages->first()->status,
        'started_at' => $messages->first()->created_at,
      ],
      'assignedAgent' => $assignedAgent ? [
        'id' => $assignedAgent->id,
        'name' => $assignedAgent->name,
        'email' => $assignedAgent->email,
      ] : null,
      'availableAgents' => $availableAgents,
    ]);
  }

  public function reply(Request $request, $sessionId)
  {
    $request->validate([
      'message' => 'required|string|max:1000'
    ]);

    $user = Auth::user();

    // Check if session is assigned and if current user can reply
    $assignment = $this->chatSessionService->getSessionAssignment($sessionId);

    if ($assignment && $assignment->assigned_to && $assignment->assigned_to !== $user->id) {
      // Only admin/manager can reply to sessions assigned to others
      if (!$user->hasRole(['admin', 'manager'])) {
        return redirect()->back()->with('error', 'This session is assigned to another agent.');
      }
    }

    // Auto-assign to current user if unassigned
    if (!$assignment || !$assignment->assigned_to) {
      $this->chatSessionService->assignSession($sessionId, $user->id, 'auto-assigned');
    }

    // Support messages should NOT copy customer user info
    // They represent the support agent's response, not the customer
    $message = ChatMessage::create([
      'session_id' => $sessionId,
      'message' => $request->message,
      'sender' => 'support',
      'support_user_id' => Auth::id(),
      'assigned_to' => $user->id, // Set assignment to current support user
      'is_read' => true,
      'status' => 'answered',
      // Support messages should have NULL user info (they're from support, not user)
      'user_id' => null,
      'user_name' => null,
      'user_email' => null,
      'user_phone' => null,
    ]);

    // Update session status to answered and ensure assignment is set
    ChatMessage::bySession($sessionId)
      ->update([
        'status' => 'answered',
        'assigned_to' => $user->id,
        'assignment_status' => 'assigned'
      ]);

    // Broadcast the message
    try {
      // We provide the message model directly to MessageSent constructor
      // The MessageSent class now extracts just the data it needs to avoid model serialization issues
      broadcast(new MessageSent($message));
    } catch (\Exception $e) {
      logger('Broadcasting failed: ' . $e->getMessage());
      // Continue execution - don't fail the request if broadcasting fails
    }

    return redirect()->back()->with('success', 'Reply sent successfully!');
  }

  public function updateStatus(Request $request, $sessionId)
  {
    $request->validate([
      'status' => 'required|in:pending,answered,closed'
    ]);

    ChatMessage::bySession($sessionId)
      ->update(['status' => $request->status]);

    return redirect()->back()->with('success', 'Chat status updated successfully!');
  }

  public function markAsRead($sessionId)
  {
    // Mark user messages as read
    ChatMessage::bySession($sessionId)
      ->where('sender', 'user')
      ->where('is_read', false)
      ->update(['is_read' => true, 'read_at' => now()]);

    return response()->json(['success' => true]);
  }

  public function destroy($sessionId)
  {
    ChatMessage::bySession($sessionId)->delete();

    return redirect()->route('chat.index')
      ->with('success', 'Chat session deleted successfully!');
  }

  // API endpoint to create new chat session
  public function createSession()
  {
    // For authenticated users, check if they have an existing active session
    if (Auth::check()) {
      $existingSession = ChatMessage::where('user_id', Auth::id())
        ->where('status', '!=', 'closed')
        ->orderBy('created_at', 'desc')
        ->first();

      if ($existingSession) {
        return response()->json([
          'session_id' => $existingSession->session_id,
          'status' => 'existing_session_reused'
        ]);
      }
    }

    $sessionId = Str::uuid();

    return response()->json([
      'session_id' => $sessionId,
      'status' => 'new_session_created'
    ]);
  }

  // API endpoint for frontend chat
  public function store(Request $request)
  {
    $request->validate([
      'message' => 'required|string|max:1000',
      'session_id' => 'nullable|string',
      'user_name' => 'nullable|string|max:255',
      'user_email' => 'nullable|email|max:255',
    ]);

    // For authenticated users, check for existing active sessions first
    if (Auth::check()) {
      $existingActiveSession = ChatMessage::where('user_id', Auth::id())
        ->where('status', '!=', 'closed')
        ->orderBy('created_at', 'desc')
        ->first();

      // If user has an active session, use that session ID regardless of what was provided
      if ($existingActiveSession) {
        $sessionId = $existingActiveSession->session_id;
        $isNewSession = false;
      } else {
        $sessionId = $request->session_id ?: Str::uuid();
        $isNewSession = !$request->session_id;
      }
    } else {
      // For guest users, use the provided session or create new one
      $sessionId = $request->session_id ?: Str::uuid();
      $isNewSession = !$request->session_id;
    }

    // Check if session already exists (for validation)
    if (!$isNewSession) {
      $existingSession = ChatMessage::where('session_id', $sessionId)->first();
      $isNewSession = !$existingSession;
    }

    // For existing sessions, get user info from previous messages to maintain consistency
    $userInfo = [];
    if (!$isNewSession) {
      $existingUserMessage = ChatMessage::where('session_id', $sessionId)
        ->where('sender', 'user')
        ->first();

      if ($existingUserMessage) {
        $userInfo = [
          'user_id' => $existingUserMessage->user_id ?: Auth::id(),
          'user_name' => $existingUserMessage->user_name ?: (Auth::user()->name ?? $request->user_name),
          'user_email' => $existingUserMessage->user_email ?: (Auth::user()->email ?? $request->user_email),
          'user_phone' => $existingUserMessage->user_phone ?: (Auth::user()->phone ?? null),
        ];
      }
    }

    // If no existing user info found, use provided/auth info
    if (empty($userInfo)) {
      $userInfo = [
        'user_id' => Auth::id(),
        'user_name' => Auth::user()->name ?? $request->user_name,
        'user_email' => Auth::user()->email ?? $request->user_email,
        'user_phone' => Auth::user()->phone ?? null,
        'ip_address' => $request->ip(),
        'user_agent' => $request->header('User-Agent'),
      ];
    } else {
      // For existing sessions, ensure we maintain IP tracking for security
      $userInfo['ip_address'] = $request->ip();
      $userInfo['user_agent'] = $request->header('User-Agent');
    }

    // For existing sessions, preserve assignment information
    $assignmentInfo = [];
    if (!$isNewSession) {
      $existingAssignment = $this->chatSessionService->getSessionAssignment($sessionId);
      if ($existingAssignment && $existingAssignment->assigned_to) {
        $assignmentInfo = [
          'assigned_to' => $existingAssignment->assigned_to,
          'assigned_at' => $existingAssignment->assigned_at,
          'assignment_status' => $existingAssignment->assignment_status,
          'status' => 'pending' // New user message makes it pending again
        ];
      } else {
        $assignmentInfo = ['status' => 'pending'];
      }
    } else {
      $assignmentInfo = ['status' => 'pending'];
    }

    // Ensure message content is not null
    $messageContent = $request->message ?: '';

    $message = ChatMessage::create([
      'session_id' => $sessionId,
      'message' => $messageContent,
      'sender' => 'user'
    ] + $userInfo + $assignmentInfo);

    // Update all messages in the session to have consistent user information and assignment
    $this->chatSessionService->updateSessionUserInfo($sessionId, $userInfo);

    // If this is an existing session with assignment, preserve it
    if (!$isNewSession && !empty($assignmentInfo['assigned_to'])) {
      ChatMessage::where('session_id', $sessionId)->update([
        'assigned_to' => $assignmentInfo['assigned_to'],
        'assigned_at' => $assignmentInfo['assigned_at'],
        'assignment_status' => $assignmentInfo['assignment_status'],
        'status' => 'pending' // New user message requires attention
      ]);
    }

    // Only auto-assign if it's truly a new session AND not already assigned
    if ($isNewSession) {
      $existingAssignment = $this->chatSessionService->getSessionAssignment($sessionId);
      if (!$existingAssignment || !$existingAssignment->assigned_to) {
        $this->chatSessionService->autoAssignSession($sessionId);
      }
    }

    // Broadcast the message
    try {
      // We provide the message model directly to MessageSent constructor
      // The MessageSent class now extracts just the data it needs to avoid model serialization issues
      logger('Broadcasting message from customer: ' . json_encode([
        'id' => $message->id,
        'message' => $message->message,
        'sender' => $message->sender,
        'session_id' => $message->session_id,
        'user_name' => $message->user_name
      ]));

      broadcast(new MessageSent($message));

      logger('Message broadcast completed successfully');
    } catch (\Exception $e) {
      logger('Broadcasting failed: ' . $e->getMessage());
      // Continue execution - don't fail the request if broadcasting fails
    }

    return response()->json([
      'message' => $message,
      'session_id' => $sessionId
    ]);
  }

  public function getMessages($sessionId)
  {
    // For authenticated users
    if (Auth::check()) {
      $user = Auth::user();

      // Check if user has admin/support permissions to view all chat sessions
      if ($user->hasRole(['admin', 'support', 'manager']) || $user->can('chat-list')) {
        // Admin/support users can access ALL messages in ANY session
        $messages = ChatMessage::bySession($sessionId)
          ->with(['user', 'supportUser', 'assignedTo'])
          ->orderBy('created_at', 'asc')
          ->get();
      } else {
        // Regular users can only access their own sessions
        $messages = ChatMessage::bySession($sessionId)
          ->where(function ($query) {
            $query->where('user_id', Auth::id())
              ->orWhere('sender', 'support')
              ->orWhere('sender', 'admin');
          })
          ->with(['user', 'supportUser', 'assignedTo'])
          ->orderBy('created_at', 'asc')
          ->get();
      }
    } else {
      // For guest users, validate session ownership using IP address
      $userIp = request()->ip();

      // Get the first user message in this session to validate ownership
      $firstUserMessage = ChatMessage::bySession($sessionId)
        ->where('sender', 'user')
        ->orderBy('created_at', 'asc')
        ->first();

      // If no user message exists in this session, don't allow access
      if (!$firstUserMessage) {
        return response()->json([
          'messages' => [],
          'error' => 'Session not found or access denied'
        ], 403);
      }

      // For sessions that have IP tracking, validate the IP matches
      if ($firstUserMessage->ip_address && $firstUserMessage->ip_address !== $userIp) {
        return response()->json([
          'messages' => [],
          'error' => 'Access denied - session belongs to different user'
        ], 403);
      }

      // Return messages from this specific session only
      $messages = ChatMessage::bySession($sessionId)
        ->with(['user', 'supportUser', 'assignedTo'])
        ->orderBy('created_at', 'asc')
        ->get();
    }

    return response()->json([
      'messages' => $messages,
      'session_id' => $sessionId,
      'total_count' => $messages->count(),
      'user_messages_count' => $messages->where('sender', 'user')->count(),
      'support_messages_count' => $messages->where('sender', 'support')->count(),
    ]);
  }

  // Assignment methods
  public function assignSession(Request $request, $sessionId)
  {
    $request->validate([
      'agent_id' => 'required|exists:users,id'
    ]);

    $success = $this->chatSessionService->assignSession(
      $sessionId,
      $request->agent_id,
      'assigned'
    );

    if ($success) {
      return redirect()->back()->with('success', 'Session assigned successfully');
    }

    return redirect()->back()->with('error', 'Failed to assign session');
  }

  public function autoAssignSession($sessionId)
  {
    $agent = $this->chatSessionService->autoAssignSession($sessionId);

    if ($agent) {
      return redirect()->back()->with('success', "Session auto-assigned to {$agent->name}");
    }

    return redirect()->back()->with('error', 'No available agents for assignment');
  }

  public function unassignSession($sessionId)
  {
    $success = $this->chatSessionService->unassignSession($sessionId);

    if ($success) {
      return redirect()->back()->with('success', 'Session unassigned successfully');
    }

    return redirect()->back()->with('error', 'Failed to unassign session');
  }

  public function takeSession($sessionId)
  {
    $user = Auth::user();

    logger("Taking session {$sessionId} for user {$user->id}");

    // Check if session is already assigned
    $assignment = $this->chatSessionService->getSessionAssignment($sessionId);

    if ($assignment && $assignment->assigned_to && $assignment->assigned_to !== $user->id) {
      logger("Session {$sessionId} already assigned to user {$assignment->assigned_to}");
      return redirect()->back()->with('error', 'Session is already assigned to another agent');
    }

    $success = $this->chatSessionService->assignSession($sessionId, $user->id, 'assigned');

    if ($success) {
      logger("Successfully assigned session {$sessionId} to user {$user->id}");
      return redirect()->back()->with('success', 'Session taken successfully');
    }

    logger("Failed to assign session {$sessionId} to user {$user->id}");
    return redirect()->back()->with('error', 'Failed to take session');
  }

  // API endpoint to check if a session exists and user has access
  public function checkSessionExists($sessionId)
  {
    if (Auth::check()) {
      $user = Auth::user();

      // Check if user has admin/support permissions
      if ($user->hasRole(['admin', 'support', 'manager']) || $user->can('chat-list')) {
        // Admin/support users can access ANY session
        $exists = ChatMessage::where('session_id', $sessionId)->exists();
      } else {
        // Regular users can only access their own sessions
        $exists = ChatMessage::where('session_id', $sessionId)
          ->where(function ($query) {
            $query->where('user_id', Auth::id())
              ->orWhere('sender', 'support')
              ->orWhere('sender', 'admin');
          })
          ->exists();
      }
    } else {
      // For guest users, validate session ownership using IP address
      $userIp = request()->ip();

      // Get the first user message in this session to validate ownership
      $firstUserMessage = ChatMessage::where('session_id', $sessionId)
        ->where('sender', 'user')
        ->orderBy('created_at', 'asc')
        ->first();

      // If no user message exists in this session, session doesn't exist for this user
      if (!$firstUserMessage) {
        $exists = false;
      } else {
        // For sessions that have IP tracking, validate the IP matches
        if ($firstUserMessage->ip_address && $firstUserMessage->ip_address !== $userIp) {
          $exists = false; // Session exists but doesn't belong to this user
        } else {
          $exists = true; // Session exists and belongs to this user (or no IP tracking)
        }
      }
    }

    return response()->json([
      'exists' => $exists
    ]);
  }

  public function getAvailableAgents()
  {
    try {
      // Get all users with support, admin, or manager roles
      $agents = User::whereHas('roles', function ($query) {
        $query->whereIn('name', ['admin', 'support', 'manager']);
      })
        ->select(['id', 'name', 'email'])
        ->orderBy('name')
        ->get();

      return response()->json($agents);
    } catch (\Exception $e) {
      // Fallback: get all users if roles system isn't working
      $agents = User::select(['id', 'name', 'email'])
        ->orderBy('name')
        ->take(50) // Limit to 50 users for performance
        ->get();

      return response()->json($agents);
    }
  }

  // Debug method to check assignment data - remove in production
  public function debugSession($sessionId)
  {
    $assignment = $this->chatSessionService->getSessionAssignment($sessionId);

    $allMessages = ChatMessage::where('session_id', $sessionId)
      ->with('assignedTo')
      ->get();

    $sessionData = ChatMessage::selectRaw('
                session_id,
                MAX(created_at) as last_message_time,
                COUNT(*) as message_count,
                MAX(assigned_to) as assigned_to,
                MAX(assignment_status) as assignment_status,
                MAX(assigned_at) as assigned_at
            ')
      ->leftJoin('users as assigned_users', 'chat_messages.assigned_to', '=', 'assigned_users.id')
      ->where('session_id', $sessionId)
      ->first();

    return response()->json([
      'session_id' => $sessionId,
      'assignment' => $assignment,
      'all_messages' => $allMessages,
      'session_data' => $sessionData,
      'current_user' => Auth::user()
    ]);
  }
}
