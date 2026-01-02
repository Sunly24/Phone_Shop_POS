    <?php

    namespace App\Http\Controllers;

    use App\Models\ProductImage;
    use Illuminate\Http\Request;
    use Inertia\Inertia;

    class ProductImageController extends Controller
    {
        /**
         * Display a listing of the resource.
         */
        public function index(Request $request)
        {
            $images = ProductImage::latest()->paginate(10)->appends(request()->query());

            $images = ProductImage::listProductImage();
            return Inertia::render('ProductImages/Index', [
                'productImages' => $images,
            ]);
        }

        /**
         * Show the form for creating a new resource.
         */
        public function create()
        {
            return Inertia::render('ProductImages/CreateEdit', [
                'productImage' => $images,
            ]);
        }

        /**
         * Store a newly created resource in storage.
         */
        public function store(Request $request)
        {
            $validated = $request->validate([
                'product_image_title'     => 'required|string|max:255|unique:product_images,product_image_title',
                'product_image_size'      => 'required|string|max:50',
                'product_image_extension' => 'required|string|max:10',
            ]);

            ProductImage::create($validated);

            return redirect()
                ->route('product-images.index')
                ->with('success', 'Product image created successfully.');
        }

        /**
         * Display the specified resource.
         */
        public function show(ProductImage $images)
        {
            return Inertia::render('ProductImages/Show', [
                'productImage' => $images,
            ]);
        }

        /**
         * Show the form for editing the specified resource.
         */
        public function edit(ProductImage $images)
        {
            return Inertia::render('ProductImages/CreateEdit', [
                'productImage' => $images,
            ]);
        }

        /**
         * Update the specified resource in storage.
         */
        public function update(Request $request, ProductImage $images)
        {
            $validated = $request->validate([
                'product_image_title'     => 'required|string|max:255|unique:product_images,product_image_title,' . $images->id,
                'product_image_size'      => 'required|string|max:50',
                'product_image_extension' => 'required|string|max:10',
            ]);

            ProductImage::update($images->id, $validated);

            return redirect()
                ->route('product-images.index')
                ->with('success', 'Product image updated successfully.');
        }

        /**
         * Remove the specified resource from storage.
         */
        public function destroy(ProductImage $images)
        {
            $images = ProductImage::findOrFail($id);
            $images->delete();

            return redirect()
                ->route('productImages.index')
                ->with('success', 'Product deleted successfully.');
        }

        public function checkExists(Request $request)
        {
            $request->validate([
                'product_image_title' => 'required|string',
            ]);

            $exists = ProductImage::where('product_image_title', $request->input('product_image_title'))->exists();

            return response()->json(['exists' => $exists]);
        }
    }
