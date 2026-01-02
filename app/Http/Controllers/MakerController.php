<?php
// app/Http/Controllers/MakerController.php

namespace App\Http\Controllers;

use App\Models\Maker;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MakerController extends Controller
{

    /** GET /makers */
    public function index(Request $request): Response
    {
        $search = $request->input('search');
        $perPage = $request->input('per_page', 10);
    
        $makers = Maker::when($search, fn($q) =>
                            $q->where('maker_title', 'like', "%{$search}%")
                        )
                        ->orderBy('maker_id', 'asc') 
                        ->paginate($perPage)
                        ->appends($request->query());
    
        return Inertia::render('Makers/Index', [
            'makers' => $makers, 
            'filters' => ['search' => $search],
        ]);
    }

    /** GET /makers/create */
    public function create(): Response
    {
        return Inertia::render('Makers/CreateEdit', [
            'maker' => new Maker(),
        ]);
    }

    /** POST /makers */
    public function store(Request $request, Maker $maker): RedirectResponse
    {
        $validated = $request->validate([
            'maker_title' => 'required|string|min:2|max:255',
        ]);

        Maker::create($validated);

        return redirect()
            ->route('makers.index')
            ->with('success', 'Maker created successfully.');
    }

    /** GET /makers/{maker}/edit */
    public function edit(Maker $maker, $id): Response
    {
        $maker = Maker::find($id);
        return Inertia::render('Makers/CreateEdit', [
            'maker' => $maker,
        ]);
    }

    /** PATCH /makers/{maker} */
    public function update(Request $request, Maker $maker, $id): RedirectResponse
    {
        $validated = $request->validate([
            'maker_title' => 'required|string|min:2|max:255',
        ]);

        $maker = Maker::find($id);
        $maker->update($validated);

        return redirect()
            ->route('makers.index')
            ->with('success', 'Maker updated successfully.');
    }

    /** DELETE /makers/{maker} */
    public function destroy(Maker $maker, $id): RedirectResponse
    {
        $maker = Maker::find($id);
        $maker->delete();

        return redirect()
            ->route('makers.index')
            ->with('success', 'Maker deleted successfully.');
    }

    public function checkExists() {
        $maker_title = request('maker_title');
        $exists = Maker::where('maker_title', $maker_title)->exists();

        return response()->json([
            'exists' => $exists,
        ]);
    }
}
