// components/admin/product-form.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Product, Brand } from '@/lib/types';
import { 
  UploadCloud, X, Image as ImageIcon, Tag, 
  DollarSign, FileText, Layers, CheckCircle2, Loader2,
  Calendar
} from 'lucide-react';

interface CategoryTree {
  id: number;
  name: string;
  parent_id: number | null;
  subcategories?: CategoryTree[];
}

interface ProductFormProps {
  product?: Product;
  brands: Brand[];
  categories?: CategoryTree[];
  onSubmit?: (success: boolean) => void;
}

export default function ProductForm({ product, brands, categories = [], onSubmit }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // REVERTED TO 3 SLOTS
  const [images, setImages] = useState<(File | null)[]>([null, null, null]);
  const [categoryTree, setCategoryTree] = useState<CategoryTree[]>(categories);
  const [subcategories, setSubcategories] = useState<CategoryTree[]>([]);

  useEffect(() => {
    if (categories.length === 0) {
      const fetchCategories = async () => {
        try {
          const response = await fetch('/api/admin/categories');
          if (response.ok) {
            const data = await response.json();
            setCategoryTree(data.categoryTree);
          }
        } catch (error) {
          console.error('Failed to fetch categories:', error);
        }
      };
      fetchCategories();
    }
  }, [categories]);

  const [formData, setFormData] = useState({
    name: product?.name || '',
    refNo: product?.ref_no || '',
    gender: product?.gender || 'Unisex',
    color: product?.color || '',
    description: product?.description || '',
    brandId: product?.brand_id?.toString() || '',
    categoryId: product?.category_id?.toString() || '',
    // Added subcategoryId to capture the new dropdown selection
    subcategoryId: (product as any)?.subcategory_id?.toString() || '',
    price: product?.price?.toString() || '',
    salePrice: product?.sale_price?.toString() || '',
    saleStartDate: product?.sale_start_date?.split('T')[0] || '',
    saleEndDate: product?.sale_end_date?.split('T')[0] || '',
  });

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const categoryId = e.target.value;
    
    // When parent category changes, reset the subcategory selection
    setFormData(prev => ({ 
      ...prev, 
      categoryId,
      subcategoryId: '' 
    }));

    if (categoryId) {
      const parentCat = categoryTree.find(c => c.id === parseInt(categoryId));
      setSubcategories(parentCat?.subcategories || []);
    } else {
      setSubcategories([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (name === 'categoryId') {
      handleCategoryChange(e as any);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
      }));
    }
  };

  const handleImageChange = (index: number, file: File | null) => {
    const newImages = [...images];
    newImages[index] = file;
    setImages(newImages);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, String(value));
      });

      images.forEach((img, idx) => {
        if (img) {
          data.append(`image_${idx + 1}`, img);
        }
      });

      const url = product ? `/api/admin/products/${product.id}/update` : '/api/admin/products/create';
      const method = product ? 'PUT' : 'POST';

      const response = await fetch(url, { method, body: data });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save product');
        return;
      }

      onSubmit?.(true);
      router.push('/admin/products');
      router.refresh();
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-5 py-4 rounded-xl flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="rotate-45" size={20} />
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}

      {/* SECTION 1: BASIC DETAILS */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <FileText size={20} className="text-slate-400" />
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Basic Information</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Product Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="e.g. Omega Speedmaster Professional"
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-slate-900/10 outline-none transition-all placeholder:text-slate-400 font-medium text-slate-900"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Reference / SKU *</label>
            <input
              type="text"
              name="refNo"
              value={formData.refNo}
              onChange={handleInputChange}
              required
              placeholder="e.g. REF-311.30.42.30"
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-slate-900/10 outline-none transition-all placeholder:text-slate-400 font-bold text-slate-900 font-mono tracking-wider"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            placeholder="Describe the product details, materials, and features..."
            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-slate-900/10 outline-none transition-all placeholder:text-slate-400 font-medium text-slate-900 resize-none"
          />
        </div>
      </div>

      {/* SECTION 2: PRODUCT MEDIA */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <ImageIcon size={20} className="text-slate-400" />
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Product Media</h2>
        </div>
        <p className="text-sm text-slate-500 -mt-4 mb-2">Upload up to 3 high-quality images. The first image acts as the cover.</p>

        {/* REVERTED TO 3 COLUMNS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[0, 1, 2].map((index) => {
            const existingImage = 
              index === 0 ? product?.image_1 : 
              index === 1 ? product?.image_2 : 
              product?.image_3;
              
            const imageUrl = existingImage ? `${process.env.NEXT_PUBLIC_R2_DOMAIN}/${existingImage}` : null;
            
            return (
              <PremiumImageUpload
                key={index}
                index={index}
                onImageChange={handleImageChange}
                existingImage={imageUrl}
              />
            );
          })}
        </div>
      </div>

      {/* SECTION 3: ORGANIZATION */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Layers size={20} className="text-slate-400" />
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Organization</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Brand *</label>
            <div className="relative">
              <Tag size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                name="brandId"
                value={formData.brandId}
                onChange={handleInputChange}
                required
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-slate-900/10 outline-none transition-all font-medium text-slate-900 appearance-none bg-right bg-no-repeat"
                style={{
                  backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%228%22 viewBox=%220 0 12 8%22%3E%3Cpath fill=%22%23444%22 d=%22M0 0l6 8 6-8z%22/%3E%3C/svg%3E")',
                  backgroundPosition: 'right 1rem center',
                  backgroundSize: '12px'
                }}
              >
                <option value="">Select Brand</option>
                {brands.map(brand => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Category</label>
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleCategoryChange}
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-slate-900/10 outline-none transition-all font-medium text-slate-900 appearance-none bg-right bg-no-repeat"
              style={{
                backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%228%22 viewBox=%220 0 12 8%22%3E%3Cpath fill=%22%23444%22 d=%22M0 0l6 8 6-8z%22/%3E%3C/svg%3E")',
                backgroundPosition: 'right 1rem center',
                backgroundSize: '12px'
              }}
            >
              <option value="">Select Category</option>
              {categoryTree.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>

          {/* REDESIGNED SUBCATEGORY DROPDOWN */}
          {subcategories.length > 0 && (
            <div className="space-y-2 animate-fade-in">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Subcategory</label>
              <select
                name="subcategoryId"
                value={formData.subcategoryId}
                onChange={handleInputChange}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-slate-900/10 outline-none transition-all font-medium text-slate-900 appearance-none bg-right bg-no-repeat"
                style={{
                  backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%228%22 viewBox=%220 0 12 8%22%3E%3Cpath fill=%22%23444%22 d=%22M0 0l6 8 6-8z%22/%3E%3C/svg%3E")',
                  backgroundPosition: 'right 1rem center',
                  backgroundSize: '12px'
                }}
              >
                <option value="">Select Subcategory</option>
                {subcategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Gender *</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-slate-900/10 outline-none transition-all font-medium text-slate-900 appearance-none bg-right bg-no-repeat"
              style={{
                backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%228%22 viewBox=%220 0 12 8%22%3E%3Cpath fill=%22%23444%22 d=%22M0 0l6 8 6-8z%22/%3E%3C/svg%3E")',
                backgroundPosition: 'right 1rem center',
                backgroundSize: '12px'
              }}
            >
              <option value="Unisex">Unisex</option>
              <option value="Men">Men</option>
              <option value="Women">Women</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Primary Color *</label>
            <input
              type="text"
              name="color"
              value={formData.color}
              onChange={handleInputChange}
              required
              placeholder="e.g. Rose Gold"
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-slate-900/10 outline-none transition-all placeholder:text-slate-400 font-medium text-slate-900"
            />
          </div>
        </div>
      </div>

      {/* SECTION 4: PRICING */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <DollarSign size={20} className="text-slate-400" />
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Pricing</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Regular Price *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">AED</span>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                min="0" step="0.01"
                placeholder="0.00"
                className="w-full pl-14 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-slate-900/10 outline-none transition-all font-bold text-slate-900"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sale Price</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">AED</span>
              <input
                type="number"
                name="salePrice"
                value={formData.salePrice}
                onChange={handleInputChange}
                min="0" step="0.01"
                placeholder="0.00"
                className="w-full pl-14 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-slate-900/10 outline-none transition-all font-bold text-rose-600"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Calendar size={14} /> Sale Start
            </label>
            <input
              type="date"
              name="saleStartDate"
              value={formData.saleStartDate}
              onChange={handleInputChange}
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-slate-900/10 outline-none transition-all font-medium text-slate-900 uppercase"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Calendar size={14} /> Sale End
            </label>
            <input
              type="date"
              name="saleEndDate"
              value={formData.saleEndDate}
              onChange={handleInputChange}
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-slate-900/10 outline-none transition-all font-medium text-slate-900 uppercase"
            />
          </div>

        </div>
      </div>

      {/* BOTTOM ACTION BAR */}
      <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-full sm:w-auto px-6 py-3.5 text-sm font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-all shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CheckCircle2 size={18} />
              {product ? 'Update Product Details' : 'Publish New Product'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// Sub-component for the Premium Drag-and-Drop Image Zone
interface PremiumImageUploadProps {
  index: number;
  onImageChange: (index: number, file: File | null) => void;
  existingImage?: string | null;
}

function PremiumImageUpload({ index, onImageChange, existingImage }: PremiumImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDeleted, setIsDeleted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageChange(index, file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setIsDeleted(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClear = () => {
    setPreview(null);
    setIsDeleted(true);
    onImageChange(index, null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const activeImage = preview || (!isDeleted && existingImage ? existingImage : null);

  return (
    <div className="relative group animate-fade-in">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      
      {activeImage ? (
        <div className="relative w-full aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm group-hover:shadow-md transition-all">
          <img src={activeImage} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              type="button"
              onClick={handleClear}
              className="bg-white/90 text-rose-600 p-2.5 rounded-full hover:bg-white hover:scale-110 transition-all shadow-lg"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full aspect-square rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100/50 hover:border-slate-400 flex flex-col items-center justify-center gap-3 transition-all outline-none focus:ring-4 focus:ring-slate-900/5 group-hover:shadow-inner"
        >
          <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
            <UploadCloud size={24} />
          </div>
          <div className="text-center">
            <span className="text-sm font-bold text-slate-700 block">Click to upload</span>
            <span className="text-xs text-slate-400 font-medium tracking-wide">Image {index + 1}</span>
          </div>
        </button>
      )}
    </div>
  );
}