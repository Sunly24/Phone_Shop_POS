<?php

namespace App\Http\Controllers;

use App\Models\Size;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SizeController extends Controller
{
    public function index(Request $request)
    {
        $search  = $request->input('search');
        $perPage = $request->input('per_page', 10);

       
        $query = Size::when($search, fn($q) =>
            $q->where('size_title', 'like', "%{$search}%")
        );

        $sizes = $query
            ->orderBy('size_id', 'asc')
            ->paginate($perPage)
            ->appends($request->only(['search','per_page']));

        return Inertia::render('Sizes/Index', [
            'sizes'   => $sizes,
            'filters' => ['search' => $search],
        ]);
    }

    public function create()
    {
        return Inertia::render('Sizes/CreateEdit', [
            'size' => new Size(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'size_title' => 'required|string|max:255|unique:sizes,size_title',
            'user_id'    => 'required|integer|exists:users,id',
        ]);

        Size::create($validated);

        return redirect()->route('sizes.index')
                         ->with('success', 'Size created successfully.');
    }

    public function show(Size $size)
    {
        return Inertia::render('Sizes/Show', [
            'size' => $size,
        ]);
    }

    public function edit(Size $size, $id)
    {

        return Inertia::render('Sizes/CreateEdit', [
            'size' => Size::findOrFail($id),
         ]);
    }

    public function update(Request $request, $id)
    {
        $size = Size::findOrFail($id);

        $validated = $request->validate([
            'size_title' => "required|string|max:255|unique:sizes,size_title,{$id},size_id",
            'user_id'    => 'required|integer|exists:users,id',
        ]);

        $size->update($validated);

        return redirect()->route('sizes.index')
                         ->with('success', 'Size updated successfully.');
    }

    public function destroy($id)
    {
        $size = Size::findOrFail($id);
        $size->delete();

        return redirect()->route('sizes.index')
                         ->with('success', 'Size deleted successfully.');
    }

    public function checkExists(Request $request)
    {
        $request->validate([
            'size_title' => 'required|string',
        ]);

        $exists = Size::checkExists($request->input('size_title'));

        return response()->json(['exists' => $exists]);
    }
}
