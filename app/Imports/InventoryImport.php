<?php

namespace App\Imports;

use App\Models\Inventory;
use App\Models\Product;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\Importable;

class InventoryImport implements ToModel, WithHeadingRow
{
    use Importable;

    /**
     * This function will map the data in each row to a model
     */
    public function model(array $row)
    {
        // Assuming your Excel file has columns like 'product_id', 'product_title', 'product_price', etc.
        return new Inventory([
            'product_id' => $row['product_id'], // Ensure the header matches exactly with your Excel headers
            'product_title' => $row['product_title'],
            'product_price' => $row['product_price'],
            'product_stock' => $row['product_stock'],
            'quantity_booked' => $row['quantity_booked'] ?? 0, // Use default value if missing
            'last_updated_by' => auth()->id(), // Use the current logged-in user as the last updater
        ]);
    }
}
