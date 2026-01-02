<?php

namespace App\Http\Controllers;

use App\Models\Color;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ColorController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Color::latest();

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where('color_title', 'like', '%' . $search . '%');
        }

        $color = $query->paginate(10)->appends($request->query());

        return Inertia::render('Colors/Index', [
            'color' => $color,
            'filters' => $request->only(['search'])
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Colors/CreateEdit');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'color_title' => 'required|string|max:255|unique:colors,color_title',
            'created_at'  => 'nullable|date',
        ]);

        $validated['user_id'] = $request->user()->id;
        Color::create($validated);

        return redirect()
            ->route('colors.index')
            ->with('success', 'Color created successfully.');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Color $color)
    {
        return Inertia::render('Colors/CreateEdit', [
            'color' => $color,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Color $color)
    {
        $validated = $request->validate([
            'color_title' => 'required|string|max:255|unique:colors,color_title,' . $color->color_id . ',color_id',
            'created_at'  => 'nullable|date',
        ]);

        $color->update($validated);

        return redirect()
            ->route('colors.index')
            ->with('success', 'Color updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Color $color)
    {
        $color->delete();
        return redirect()
            ->route('colors.index')
            ->with('success', 'Color deleted successfully.');
    }

    public function checkExists(Request $request)
    {
        $request->validate([
            'color_title' => 'required|string',
        ]);

        $exists = Color::checkExists($request->input('color_title'));

        return response()->json(['exists' => $exists]);
    }
}
