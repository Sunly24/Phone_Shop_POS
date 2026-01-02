<!DOCTYPE html>
<html>

<head>
  <meta charset="utf-8">
  <title>Products Report - Phone Store</title>
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
      margin: 30px;
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

    .report-title {
      font-size: 24px;
      font-weight: bold;
      color: #000;
      font-style: italic;
      margin-top: 10px;
      margin-bottom: 8px;
    }

    .contact-info {
      font-size: 12px;
      color: #374151;
      line-height: 1.5;
    }

    .report-info {
      font-size: 11px;
      color: #6b7280;
      margin-bottom: 5px;
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
      padding: 6px 4px;
      font-weight: bold;
      text-align: center;
      color: #2171B5;
    }

    td {
      border: 1px solid #d1d5db;
      padding: 5px 4px;
      text-align: left;
      vertical-align: top;
    }

    tr:nth-child(even) {
      background-color: #f9fafb;
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
      <div class="report-title">Products Report</div>
    </div>

    <div class="contact-row">
      <span class="contact-info">Pine Rd. Arcadia, Texas US</span>
      <span class="contact-info"> | Phone: +1 999-000-7777</span>
      <span class="contact-info"> | Email: xyz@example.com</span>
    </div>
  </div>

  <div class="filters-info">
    @if($search || $colorFilter)
    Filters Applied:
    @if($search) Search: "{{ $search }}" @endif
    @if($search && $colorFilter) | @endif
    @if($colorFilter) Color: {{ $colorFilter }} @endif
    |
    @endif
    Total Products: {{ is_array($products) ? count($products) : $products->count() }} | Generated on: {{ now()->format('F j, Y \a\t g:i A') }}
  </div>

  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th style="width: 4%;">ID</th>
          <th style="width: 20%;">Title</th>
          <th style="width: 8%;">Code</th>
          <th style="width: 25%;">Description</th>
          <th style="width: 8%;">Price</th>
          <th style="width: 5%;">Stock</th>
          <th style="width: 6%;">RAM</th>
          <th style="width: 8%;">Category</th>
          <th style="width: 8%;">Brand</th>
          <th style="width: 8%;">Status</th>
        </tr>
      </thead>
      <tbody>
        @foreach($products as $product)
        <tr>
          <td class="text-center">{{ $product->product_id }}</td>
          <td><strong>{{ $product->product_title }}</strong></td>
          <td class="text-center">{{ $product->product_code ?: '-' }}</td>
          <td>{{ Str::limit($product->product_description, 80) }}</td>
          <td class="price">${{ number_format($product->product_price, 2) }}</td>
          <td class="stock text-center 
                            @if($product->product_stock <= 5) stock-low
                            @elseif($product->product_stock <= 20) stock-medium  
                            @else stock-high
                            @endif">
            {{ $product->product_stock }}
          </td>
          <td class="text-center">{{ $product->product_ram }}GB</td>
          <td>{{ $product->category ? $product->category->name : '-' }}</td>
          <td>{{ $product->brand ? $product->brand->brand_title : '-' }}</td>
          <td class="text-center {{ $product->product_status ? 'status-active' : 'status-inactive' }}">
            {{ $product->product_status ? 'Active' : 'Inactive' }}
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