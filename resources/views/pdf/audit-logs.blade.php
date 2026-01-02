<!DOCTYPE html>
<html>

<head>
  <meta charset="utf-8">
  <title>Audit Logs Report - Phone Store</title>
  <style>
    @page {
      margin: 0;
      size: A4;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'DejaVu Sans', Arial, sans-serif;
      font-size: 9px;
      line-height: 1.2;
      color: #333;
      margin: 0;
      padding: 0;
    }

    .header {
      width: 100%;
      margin-top: 30px;
      margin-bottom: 20px;
      border-bottom: 2px solid #2171B5;
      padding-bottom: 15px;
    }

    .header-top-row {
      text-align: center;
      margin-bottom: 15px;
      width: 100%;
    }

    .header-logo-section {
      display: inline-block;
      vertical-align: middle;
      margin-right: 15px;
    }

    .company-section {
      display: inline-block;
      vertical-align: middle;
    }

    .report-section {
      text-align: center;
      margin-bottom: 10px;
    }

    .contact-row {
      text-align: center;
      margin-top: 10px;
    }

    .logo {
      width: 120px;
      height: 80px;
      border-radius: 8px;
      display: inline-block;
    }

    .logo img {
      width: 120px;
      height: 80px;
      object-fit: contain;
      border-radius: 8px;
    }

    .company-name {
      font-size: 28px;
      font-weight: bold;
      color: #000;
      margin-bottom: 8px;
    }

    .contact-info {
      font-size: 12px;
      color: #374151;
      line-height: 1.5;
    }

    .report-title {
      font-size: 24px;
      font-weight: bold;
      color: #000;
      font-style: italic;
      margin-top: 10px;
    }

    .filters-info {
      text-align: center;
      font-size: 10px;
      color: #2171B5;
      font-weight: bold;
      margin-bottom: 15px;
    }

    .table-container {
      width: 100%;
      margin: 20px 0;
    }

    table {
      width: calc(100% - 30px);
      margin: 0 auto;
      border-collapse: collapse;
      font-size: 8px;
    }

    th {
      background-color: #e8f2ff;
      border: 1px solid #2171B5;
      padding: 8px 6px;
      font-weight: bold;
      text-align: center;
      color: #2171B5;
    }

    td {
      border: 1px solid #d1d5db;
      padding: 6px 4px;
      text-align: left;
      vertical-align: top;
    }

    tr:nth-child(even) {
      background-color: #fefefe;
    }

    tr:nth-child(odd) {
      background-color: #ffffff;
    }

    .text-center {
      text-align: center;
    }

    .text-right {
      text-align: right;
    }

    .event-created {
      background-color: #dcfce7;
      color: #166534;
      font-weight: bold;
      border-radius: 3px;
      padding: 2px 6px;
      display: inline-block;
    }

    .event-updated {
      background-color: #dbeafe;
      color: #1e40af;
      font-weight: bold;
      border-radius: 3px;
      padding: 2px 6px;
      display: inline-block;
    }

    .event-deleted {
      background-color: #fee2e2;
      color: #dc2626;
      font-weight: bold;
      border-radius: 3px;
      padding: 2px 6px;
      display: inline-block;
    }

    .event-login {
      background-color: #f3e8ff;
      color: #7c3aed;
      font-weight: bold;
      border-radius: 3px;
      padding: 2px 6px;
      display: inline-block;
    }

    .event-logout {
      background-color: #fef3c7;
      color: #d97706;
      font-weight: bold;
      border-radius: 3px;
      padding: 2px 6px;
      display: inline-block;
    }

    .user-system {
      color: #6b7280;
      font-style: italic;
    }

    .user-admin {
      color: #2171B5;
      font-weight: bold;
    }

    .user-regular {
      color: #374151;
    }

    .summary-text {
      font-size: 8px;
      max-width: 250px;
      word-wrap: break-word;
    }

    .changes-text {
      font-size: 7px;
      color: #6b7280;
      margin-top: 2px;
    }

    .footer {
      width: 100%;
      text-align: center;
      font-size: 8px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
      padding-top: 5px;
      margin-top: 20px;
    }

    @page {
      margin: 30px;

      @bottom-center {
        content: "Phone Store - Audit Logs Report | Page " counter(page) " of " counter(pages);
        font-size: 8px;
        color: #6b7280;
      }
    }
  </style>
</head>

<body>
  <div class="header">
    <div class="header-top-row">
      <div class="header-logo-section">
        <div class="logo">
          <img src="{{ public_path('/images/brand-logo/blue-logo.png') }}" alt="Phone Store Logo">
        </div>
      </div>
      <div class="company-section">
        <div class="company-name">Phone Store</div>
      </div>
    </div>

    <div class="report-section">
      <div class="report-title">Audit Logs Report</div>
    </div>

    <div class="contact-row">
      <span class="contact-info">Pine Rd. Arcadia, Texas US</span>
      <span class="contact-info"> | Phone: +1 999-000-7777</span>
      <span class="contact-info"> | Email: xyz@example.com</span>
    </div>
  </div>

  <div class="filters-info">
    @if($search)
    Search Filter: "{{ $search }}" |
    @endif
    Total Records: {{ $auditLogs->count() }}
  </div>

  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th style="width: 18%;">Date & Time</th>
          <th style="width: 15%;">User</th>
          <th style="width: 12%;">Event</th>
          <th style="width: 15%;">IP Address</th>
          <th style="width: 40%;">Summary</th>
        </tr>
      </thead>
      <tbody>
        @foreach($auditLogs as $audit)
        <tr>
          <td class="text-center">{{ $audit->created_at->format('m/d/Y H:i:s') }}</td>
          <td class="text-center 
                            @if(!$audit->user) user-system
                            @elseif(strpos(strtolower($audit->user->name), 'admin') !== false) user-admin
                            @else user-regular
                            @endif">
            {{ $audit->user ? $audit->user->name : 'System' }}
          </td>
          <td class="text-center">
            <span class="event-{{ strtolower($audit->event) }}">
              {{ ucfirst($audit->event) }}
            </span>
          </td>
          <td class="text-center">{{ $audit->ip_address ?: '-' }}</td>
          <td class="summary-text">
            @php
            $modelType = class_basename($audit->auditable_type);
            switch ($audit->event) {
            case 'created':
            $summary = "Created new {$modelType}";
            break;
            case 'updated':
            $summary = "Updated {$modelType}";
            break;
            case 'deleted':
            $summary = "Deleted {$modelType}";
            break;
            case 'restored':
            $summary = "Restored {$modelType}";
            break;
            case 'login':
            $summary = "User logged into system";
            break;
            case 'logout':
            $summary = "User logged out of system";
            break;
            default:
            $summary = ucfirst($audit->event) . " {$modelType}";
            }
            @endphp
            <strong>{{ $summary }}</strong>

            @if($audit->new_values || $audit->old_values)
            <div class="changes-text">
              @if($audit->event === 'updated' && $audit->new_values)
              @php
              $changes = [];
              $changeCount = 0;
              foreach($audit->new_values as $key => $value) {
              if(!in_array($key, ['updated_at', 'created_at', 'deleted_at']) && $changeCount < 3) {
                $oldValue=isset($audit->old_values[$key]) ? $audit->old_values[$key] : null;
                $fieldName = ucfirst(str_replace('_', ' ', $key));
                $changes[] = "{$fieldName}: {$oldValue} → {$value}";
                $changeCount++;
                }
                }
                if(count($audit->new_values) > 3) {
                $changes[] = "... and " . (count($audit->new_values) - 3) . " more changes";
                }
                @endphp
                {{ implode('; ', $changes) }}
                @elseif($audit->event === 'created' && $audit->new_values)
                @php
                $changes = [];
                $changeCount = 0;
                foreach($audit->new_values as $key => $value) {
                if(!in_array($key, ['updated_at', 'created_at', 'deleted_at']) && strlen($value) < 30 && $changeCount < 2) {
                  $fieldName=ucfirst(str_replace('_', ' ' , $key));
                  $changes[]="{$fieldName}: {$value}" ;
                  $changeCount++;
                  }
                  }
                  @endphp
                  {{ implode('; ', $changes) }}
                  @endif
                  </div>
                  @endif
          </td>
        </tr>
        @endforeach
      </tbody>
    </table>
  </div>

  <div class="footer">
    <div>Generated on {{ now()->format('l, F j, Y \a\t H:i:s') }}</div>
  </div>
</body>

</html>