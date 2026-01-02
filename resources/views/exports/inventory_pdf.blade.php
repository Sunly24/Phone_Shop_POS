<!DOCTYPE html>
<html>

<head>
  <meta charset="utf-8">
  <title>Inventory Report - Phone Store</title>
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

    .status-active {
      color: #059669;
      font-weight: bold;
    }

    .status-inactive {
      color: #dc2626;
      font-weight: bold;
    }

    .price {
      text-align: right;
      font-weight: bold;
    }

    .stock {
      text-align: center;
      font-weight: bold;
    }

    .stock-low {
      color: #dc2626;
    }

    .stock-medium {
      color: #d97706;
    }

    .stock-high {
      color: #059669;
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
        content: "Phone Store - Inventory Report | Page " counter(page) " of " counter(pages);
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
      <div class="report-title">Inventory Report</div>
    </div>

    <div class="contact-row">
      <span class="contact-info">Pine Rd. Arcadia, Texas US</span>
      <span class="contact-info"> | Phone: +1 999-000-7777</span>
      <span class="contact-info"> | Email: xyz@example.com</span>
    </div>
  </div>

  <div class="filters-info">
    Total Items: {{ $inventories->count() }} | Generated on: {{ now()->format('F j, Y \a\t g:i A') }}
  </div>

  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th style="width: 8%;">ID</th>
          <th style="width: 30%;">Product</th>
          <th style="width: 15%;">Price</th>
          <th style="width: 12%;">Stock</th>
          <th style="width: 12%;">Booked</th>
          <th style="width: 12%;">Available</th>
          <th style="width: 11%;">Last Update</th>
        </tr>
      </thead>
      <tbody>
        @foreach ($inventories as $inventory)
        <tr>
          <td class="text-center">{{ $inventory->product_id }}</td>
          <td><strong>{{ $inventory->product->product_title }}</strong></td>
          <td class="price">${{ number_format($inventory->product->product_price, 2) }}</td>
          <td class="stock text-center 
                                @if($inventory->product->product_stock <= 5) stock-low
                                @elseif($inventory->product->product_stock <= 20) stock-medium  
                                @else stock-high
                                @endif">
            {{ $inventory->product->product_stock }}
          </td>
          <td class="text-center">{{ $inventory->quantity_booked }}</td>
          <td class="text-center 
                                @php $available = $inventory->product->product_stock - $inventory->quantity_booked; @endphp
                                @if($available <= 0) stock-low
                                @elseif($available <= 10) stock-medium  
                                @else stock-high
                                @endif">
            {{ $available }}
          </td>
          <td class="text-center">{{ $inventory->updated_at->format('m/d/Y') }}</td>
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