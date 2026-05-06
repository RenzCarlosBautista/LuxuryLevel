// app/admin/products/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Trash2, Edit2, Plus, Search, ChevronDown, 
  X, Filter, Package, AlertCircle, LayoutDashboard,
  ChevronLeft, ChevronRight, ImageIcon
} from 'lucide-react';
import { Product } from '@/lib/types';
import ProductDetailsModal from '@/components/admin/product-details-modal';

interface FilterOptions {
  brands: { id: number; name: string }[];
  genders: string[];
  colors: string[];
}

interface CategoryMap {
  [key: number]: { id: number; name: string; parent_id: number | null };
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryMap>({});
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [brands, setBrands] = useState<any[]>([]);
  const [categoryTree, setCategoryTree] = useState<any[]>([]);
  
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    brands: [],
    genders: [],
    colors: [],
  });
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch categories for lookup
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/admin/categories');
        if (response.ok) {
          const data = await response.json();
          // Create a lookup map: id -> category object
          const categoryMap: CategoryMap = {};
          data.parentCategories?.forEach((cat: any) => {
            categoryMap[cat.id] = cat;
          });
          data.subCategories?.forEach((cat: any) => {
            categoryMap[cat.id] = cat;
          });
          setCategories(categoryMap);
          setCategoryTree([...(data.parentCategories || []), ...(data.subCategories || [])]);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await fetch('/api/brands');
        if (response.ok) {
          const data = await response.json();
          setBrands(data.brands || []);
        }
      } catch (error) {
        console.error('Failed to fetch brands:', error);
      }
    };
    fetchBrands();
  }, []);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const response = await fetch('/api/admin/products/filters');
        if (response.ok) {
          const data = await response.json();
          setFilterOptions(data);
        }
      } catch (error) {
        console.error('Failed to fetch filter options:', error);
      }
    };
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [page, search, selectedBrand, selectedGender, selectedColor, selectedCategory]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
      });
      if (search) params.append('search', search);
      if (selectedBrand) params.append('brand', selectedBrand);
      if (selectedGender) params.append('gender', selectedGender);
      if (selectedColor) params.append('color', selectedColor);
      
      // FIX: Changed parameter name to match standard API expectations
      if (selectedCategory) params.append('categoryId', selectedCategory);

      const response = await fetch(`/api/admin/products/list?${params}`);
      if (!response.ok) {
        console.error('Failed to fetch products');
        return;
      }

      const data = await response.json();
      setProducts(data.products || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searching);
    setPage(1);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;

    setDeleting(id);
    try {
      const response = await fetch(`/api/admin/products/${id}/delete`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProducts(products.filter(p => p.id !== id));
      } else {
        alert('Failed to delete product');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('An error occurred while deleting');
    } finally {
      setDeleting(null);
    }
  };

  const clearFilters = () => {
    setSelectedBrand('');
    setSelectedGender('');
    setSelectedColor('');
    setSelectedCategory('');
    setPage(1);
  };

  const hasActiveFilters = selectedBrand || selectedGender || selectedColor || selectedCategory;

  const handleOpenProductDetails = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (updatedData: Partial<Product>) => {
    if (!selectedProduct) return false;

    try {
      const response = await fetch(`/api/admin/products/${selectedProduct.id}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        throw new Error('Failed to update product');
      }

      // Update the product in the list
      setProducts(prevProducts =>
        prevProducts.map(p =>
          p.id === selectedProduct.id
            ? { ...p, ...updatedData }
            : p
        )
      );

      return true;
    } catch (error) {
      console.error('Error saving product:', error);
      return false;
    }
  };

  return (
    <main className="flex-1 bg-[#F4F4F5] min-h-screen p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* PREMIUM HEADER SECTION */}
        <div className="relative overflow-hidden bg-white rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-slate-100 p-8 sm:p-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-slate-100 to-transparent rounded-full blur-3xl -mr-20 -mt-20 opacity-60 pointer-events-none"></div>
          
          <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-slate-500 text-xs font-semibold uppercase tracking-widest mb-1">
                <LayoutDashboard size={14} /> Workspace
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                Product Inventory
              </h1>
              <p className="text-slate-500 text-sm sm:text-base">
                Curate and manage your luxury catalog.
              </p>
            </div>
            <Link
              href="/admin/products/add"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 px-6 rounded-2xl transition-all duration-300 shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 group"
            >
              <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
              <span>New Product</span>
            </Link>
          </div>
        </div>

        {/* SEARCH & FILTER BAR */}
        <div className="bg-white p-3 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100">
          <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1 relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={18} />
              <input
                type="text"
                value={searching}
                onChange={(e) => setSearching(e.target.value)}
                placeholder="Search by product name, SKU, or reference..."
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 hover:bg-slate-100/50 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:bg-white transition-all text-sm text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl transition-all text-sm font-medium
                ${showFilters || hasActiveFilters 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              <Filter size={18} />
              Filters
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-white ml-1 animate-pulse"></span>
              )}
            </button>

            <button
              type="submit"
              className="px-8 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-medium rounded-xl transition-all text-sm"
            >
              Search
            </button>
          </form>

          {/* Expandable Filters */}
          <div className={`transition-all duration-300 overflow-hidden ${showFilters ? 'max-h-96 mt-3 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="p-5 bg-slate-50 rounded-xl grid grid-cols-1 sm:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900/10 outline-none shadow-sm text-slate-700"
                >
                  <option value="">All Categories</option>
                  {categoryTree.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Brand</label>
                <select
                  value={selectedBrand}
                  onChange={(e) => { setSelectedBrand(e.target.value); setPage(1); }}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900/10 outline-none shadow-sm text-slate-700"
                >
                  <option value="">All Brands</option>
                  {filterOptions.brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>{brand.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Gender</label>
                <select
                  value={selectedGender}
                  onChange={(e) => { setSelectedGender(e.target.value); setPage(1); }}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900/10 outline-none shadow-sm text-slate-700"
                >
                  <option value="">All Genders</option>
                  {filterOptions.genders.map((gender) => (
                    <option key={gender} value={gender}>{gender}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Color</label>
                <select
                  value={selectedColor}
                  onChange={(e) => { setSelectedColor(e.target.value); setPage(1); }}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900/10 outline-none shadow-sm text-slate-700"
                >
                  <option value="">All Colors</option>
                  {filterOptions.colors.map((color) => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {hasActiveFilters && (
              <div className="mt-3 flex justify-end px-2">
                <button onClick={clearFilters} className="text-xs font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors uppercase tracking-wider">
                  <X size={14} /> Clear Active Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* PREMIUM DATA TABLE */}
        <div className="bg-white rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="p-24 text-center flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin mb-6"></div>
              <p className="text-slate-500">Syncing inventory data...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="p-24 text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <Package size={32} className="text-slate-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">No products found</h3>
              <p className="text-slate-500 mt-2 max-w-sm text-sm">We couldn't find any items matching your current filters and search criteria.</p>
              <button onClick={clearFilters} className="mt-6 px-6 py-2 bg-slate-100 text-slate-900 font-medium rounded-full hover:bg-slate-200 transition-colors">
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto pb-4">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-8 py-5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest bg-white">Product Item</th>
                    <th className="px-6 py-5 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-widest bg-white">Reference / SKU</th>
                    <th className="px-6 py-5 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-widest bg-white">Category</th>
                    <th className="px-6 py-5 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-widest bg-white">Pricing</th>
                    <th className="px-8 py-5 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-widest bg-white">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50/50">
                  {products.map((product) => (
                    <tr 
                      key={product.id}
                      className="group bg-white hover:bg-slate-50/50 hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:relative hover:z-10 transition-all duration-300"
                    >
                      
                      {/* Product Name & Image */}
                      <td className="px-8 py-4 text-left">
                        <div className="flex items-center gap-5">
                          <div className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-sm group-hover:shadow-md transition-shadow relative">
                            {product.image_1 ? (
                              <img 
                                src={`${process.env.NEXT_PUBLIC_R2_DOMAIN}/${product.image_1}`} 
                                alt={product.name}
                                className="object-cover w-full h-full"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            
                            <div className={`absolute inset-0 flex items-center justify-center ${product.image_1 ? 'hidden' : ''}`}>
                              <ImageIcon size={24} className="text-slate-300" strokeWidth={1.5} />
                            </div>
                          </div>
                          <div className="flex flex-col justify-center">
                            <button
                              onClick={() => handleOpenProductDetails(product)}
                              className="font-medium text-slate-900 text-sm hover:text-blue-600 transition-colors line-clamp-1 text-left"
                            >
                              {product.name}
                            </button>
                            {product.brand && <div className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{product.brand?.name || 'Unbranded'}</div>}
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="px-6 py-4 text-center align-middle">
                        <span className="font-mono text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60 inline-block">
                          {product.ref_no || 'N/A'}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4 text-center align-middle">
                        <div className="flex flex-col items-center justify-center">
                          {product.category ? (
                            <>
                              <span className="font-medium text-slate-900 text-sm uppercase">
                                {product.category.name}
                              </span>
                              {product.category.parent_id && categories[product.category.parent_id] && (
                                <span className="text-xs text-slate-500 mt-0.5 tracking-wider uppercase">
                                  {categories[product.category.parent_id].name}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Uncategorized</span>
                          )}
                        </div>
                      </td>

                      {/* Pricing */}
                      <td className="px-6 py-4 text-center align-middle">
                        <div className="flex flex-col items-center justify-center">
                          <span className={`text-sm font-medium ${product.sale_price ? 'text-slate-400 line-through text-xs' : 'text-slate-900'}`}>
                            AED {product.price?.toFixed(2) || '0.00'}
                          </span>
                          {product.sale_price && (
                            <span className="text-sm font-semibold text-slate-900 mt-0.5">
                              AED {product.sale_price.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-8 py-4 text-right align-middle">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
                            title="Edit Product"
                          >
                            <Edit2 size={18} strokeWidth={2} />
                          </Link>
                          <button
                            onClick={() => handleDelete(product.id)}
                            disabled={deleting === product.id}
                            className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all disabled:opacity-50"
                            title="Delete Product"
                          >
                            <Trash2 size={18} strokeWidth={2} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* LUXURY PAGINATION */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white px-8 py-5 rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-slate-100">
            <span className="text-sm text-slate-500">
              Showing page <span className="font-medium text-slate-900">{page}</span> of <span className="font-medium text-slate-900">{totalPages}</span>
            </span>
            
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-2xl border border-slate-100">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-2 rounded-xl text-slate-600 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all"
              >
                <ChevronLeft size={20} strokeWidth={2} />
              </button>
              
              <div className="flex items-center gap-2 px-2">
                {/* FIX: Added special Tailwind classes to remove the spin buttons */}
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={page}
                  onChange={(e) => {
                    const newPage = Math.min(Math.max(1, parseInt(e.target.value) || 1), totalPages);
                    setPage(newPage);
                  }}
                  className="w-12 h-8 rounded-xl bg-slate-900 text-white text-sm font-medium text-center border-none focus:outline-none focus:ring-2 focus:ring-slate-900/50 shadow-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-slate-300 px-1">/</span>
                <span className="w-12 h-8 flex items-center justify-center text-slate-500 text-sm font-medium">
                  {totalPages}
                </span>
              </div>

              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-xl text-slate-600 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all"
              >
                <ChevronRight size={20} strokeWidth={2} />
              </button>
            </div>
          </div>
        )}

        {/* Product Details Modal */}
        <ProductDetailsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          product={selectedProduct}
          brands={brands}
          categories={categoryTree}
          onSave={handleSaveProduct}
        />
      </div>
    </main>
  );
}