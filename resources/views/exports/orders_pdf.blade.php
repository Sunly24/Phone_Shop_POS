<!DOCTYPE html>
<html>

<head>
  <meta charset="utf-8">
  <title>Orders Report - Phone Store</title>
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

    .status-pending {
      background-color: #fef3c7;
      color: #d97706;
      font-weight: bold;
      border-radius: 3px;
      padding: 2px 6px;
      display: inline-block;
    }

    .status-completed {
      background-color: #dcfce7;
      color: #166534;
      font-weight: bold;
      border-radius: 3px;
      padding: 2px 6px;
      display: inline-block;
    }

    .status-cancelled {
      background-color: #fee2e2;
      color: #dc2626;
      font-weight: bold;
      border-radius: 3px;
      padding: 2px 6px;
      display: inline-block;
    }

    .status-processing {
      background-color: #dbeafe;
      color: #1e40af;
      font-weight: bold;
      border-radius: 3px;
      padding: 2px 6px;
      display: inline-block;
    }

    .price {
      text-align: right;
      font-weight: bold;
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
        content: "Phone Store - Orders Report | Page " counter(page) " of " counter(pages);
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
      <div class="report-title">Orders Report</div>
    </div>

    <div class="contact-row">
      <span class="contact-info">Pine Rd. Arcadia, Texas US</span>
      <span class="contact-info"> | Phone: +1 999-000-7777</span>
      <span class="contact-info"> | Email: xyz@example.com</span>
    </div>
  </div>

  <div class="filters-info">
    Total Orders: {{ count($orders) }} | Generated on: {{ now()->format('F j, Y \a\t g:i A') }}
  </div>
  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th style="width: 8%;">ID</th>
          <th style="width: 20%;">Customer</th>
          <th style="width: 8%;">Items</th>
          <th style="width: 15%;">Subtotal</th>
          <th style="width: 12%;">Discount</th>
          <th style="width: 15%;">Total</th>
          <th style="width: 12%;">Status</th>
          <th style="width: 10%;">Date</th>
        </tr>
      </thead>
      <tbody>
        @foreach($orders as $order)
        <tr>
          <td class="text-center">{{ $order['id'] }}</td>
          <td><strong>{{ $order['customer'] }}</strong></td>
          <td class="text-center">{{ $order['items'] }}</td>
          <td class="price">{{ $order['subtotal'] }}</td>
          <td class="price">{{ $order['discount'] }}</td>
          <td class="price"><strong>{{ $order['total'] }}</strong></td>
          <td class="text-center">
            <span class="status-{{ strtolower(str_replace(' ', '', $order['status'])) }}">
              {{ $order['status'] }}
            </span>
          </td>
          <td class="text-center">{{ $order['date'] }}</td>
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