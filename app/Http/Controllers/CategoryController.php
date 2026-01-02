<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
       $search = $request->input('search');
        $perPage = $request->input('per_page', 10);

        $query = Category::query();

        if ($search) {
            $query->where('name', 'like', "%{$search}%");
        }

        $rsDatas = $query->latest()
                        ->paginate($perPage)
                        ->appends($request->only(['search', 'per_page']));

        return Inertia::render('Categories/Index', [
            'categoryData' => $rsDatas,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Categories/CreateEdit', [
            'datas' => ''
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request, Category $model)
    {
        $model->create($request->validate([
            'name' => 'required|max:255|min:2',
           
        ]));
        return redirect()->route('categories.index');
        // return back()->with('message', 'Data added successfully');
    }

    /**
     * Display the specified resource.
     */
    public function show(Category $category, $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Category $category, $id)
    {
        $rsDatasModel = Category::find($id);
        return Inertia::render('Categories/CreateEdit', [
            'datas' => $rsDatasModel
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Category $model, $id)
    {
        $request->validate([
            'name' => 'required|max:255|min:2',
           
        ]);

        $rsDatasModel = Category::find($id);
        $rsDatasModel->update($request->all());

        return redirect()->route('categories.index');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Category $category, $id)
    {
        $rsDatasModel = Category::find($id);
        $rsDatasModel->delete();

        return back()->with('message', 'Deleted successfully');
    }
}
