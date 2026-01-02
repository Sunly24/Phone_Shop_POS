<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use App\Models\Maker;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BrandController extends Controller
{
    public function index(Request $request)
    {
        $search  = $request->input('search');
        $perPage = $request->input('per_page', 10);

        $query = Brand::with('maker');

        if ($search) {
            $query->where('brand_title', 'like', "%{$search}%");
        }

        $brands = $query
            ->orderBy('brand_id', 'asc')
            ->paginate($perPage)
            ->appends($request->only('search'));

        return Inertia::render('Brands/Index', [
            'brands'  => $brands,
            'filters' => ['search' => $search],
        ]);
    }

    public function create()
    {
        return Inertia::render('Brands/CreateEdit', [
            'brand'  => new Brand(),
            'makers' => Maker::orderBy('maker_title')
                              ->get(['maker_id', 'maker_title']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'brand_title' => 'required|string|max:255|unique:brands,brand_title', 
            'maker_id'    => 'required|integer|exists:makers,maker_id',
            'user_id'     => 'required|integer|exists:users,id',
        ]);

        Brand::create($validated);

        return redirect()
            ->route('brands.index')
            ->with('success', 'Brand created successfully.');
    }

    public function show(Brand $brand)
    {
        return Inertia::render('Brands/Show', [
            'brand' => $brand,
        ]);
    }

    public function edit($id)
    {
        $brands = Brand::select('brand_id', 'brand_title')
            ->orderBy('brand_title')
            ->get()
            ->map(fn($b) => [
                'brand_id'   => $b->brand_id,
                'title'      => $b->brand_title,   
            ]);

        return Inertia::render('Brands/CreateEdit', [
            'brand'  => Brand::findOrFail($id),
            'makers' => Maker::orderBy('maker_title')
                              ->get(['maker_id', 'maker_title']),
        ]);
    }

    public function update(Request $request, $id)
    {
        $brand = Brand::findOrFail($id);

        $validated = $request->validate([
            'brand_title' => 'required|string|max:255|unique:brands,brand_title,' . $brand->brand_id . ',brand_id',
            'maker_id'    => 'required|integer|exists:makers,maker_id',
            'user_id'     => 'required|integer|exists:users,id',
        ]);

        $brand->update($validated);

        return redirect()
            ->route('brands.index')
            ->with('success', 'Brand updated successfully.');
    }

    public function destroy($brand_id)
    {
        $brand = Brand::findOrFail($brand_id);
        $brand->delete();

        return redirect()
            ->route('brands.index')
            ->with('success', 'Brand deleted successfully.');
    }

    public function checkExists(Request $request)
    {
        $request->validate([
            'brand_title' => 'required|string',
        ]);

        $exists = Brand::checkExists($request->input('brand_title'));

        return response()->json(['exists' => $exists]);
    }
}
