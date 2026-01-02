<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function index(Request $request): Response
    {
        $search  = $request->input('search', '');
        $perPage = $request->input('per_page', 10);

        // Build base query
        $query = Customer::query();

        // Apply search on name or phone
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name',  'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        // Paginate and preserve query params
        $customers = $query
            ->latest()
            ->paginate($perPage)
            ->appends($request->only(['search', 'per_page']));

        return Inertia::render('Customers/Index', [
            'customers' => $customers,
            'filters'   => [
                'search'   => $search,
                'per_page' => $perPage,
            ],
            'can' => [
                'customer-create' => Auth::user()->can('customer-create'),
                'customer-edit'   => Auth::user()->can('customer-edit'),
                'customer-delete' => Auth::user()->can('customer-delete'),
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('Customers/CreateEdit', [
            'customer' => null,
        ]);
    }

    public function store(Request $request)
    {
        // validate once, close the array with ]); immediately
        $validated = $request->validate([
            'name'     => 'required|min:2|max:255',
            'phone'    => 'required|max:15',
            'password' => [
                'required',
                Password::min(8)
                    ->letters()
                    ->mixedCase()
                    ->numbers()
                    ->symbols()
                    ->uncompromised(),
            ],
        ]);

        // hash password and create
        $validated['password'] = bcrypt($validated['password']);
        Customer::create($validated);

        return redirect()
            ->route('customers.index')
            ->with('success', 'Customer created successfully');
    }

    public function edit($id)
    {
        $customer = Customer::findOrFail($id);

        return Inertia::render('Customers/CreateEdit', [
            'customer' => $customer,  // <-- add the missing comma here
        ]);
    }

    public function update(Request $request, $id)
    {
        $customer = Customer::findOrFail($id);

        // again, validate only once
        $validated = $request->validate([
            'name'     => 'required|min:2|max:255',
            'phone'    => 'required|max:15',
            'password' => [
                'nullable',
                Password::min(8)
                    ->letters()
                    ->mixedCase()
                    ->numbers()
                    ->symbols()
                    ->uncompromised(),
            ],
        ]);

        // only re-hash if provided
        if (!empty($validated['password'])) {
            $validated['password'] = bcrypt($validated['password']);
        } else {
            unset($validated['password']);
        }

        $customer->update($validated);

        return redirect()
            ->route('customers.index')
            ->with('success', 'Customer updated successfully');
    }

    public function destroy($id)
    {
        $customer = Customer::findOrFail($id);
        $customer->delete();

        return redirect()
            ->route('customers.index')
            ->with('success', 'Customer deleted successfully');
    }
}
