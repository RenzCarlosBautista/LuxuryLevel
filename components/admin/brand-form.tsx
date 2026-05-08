'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function BrandForm({ initialData }: { initialData?: any }) {
  const router = useRouter();
  const isEditing = !!initialData;

  const [existingBrands, setExistingBrands] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form States (Pino-populate kung may initialData)
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [parentId, setParentId] = useState(initialData?.parent_id || '');
  const [featured, setFeatured] = useState(initialData?.featured || false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(initialData?.logo_url || '');

  // Category States
  const [selectedMainCategory, setSelectedMainCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');

  useEffect(() => {
    const fetchReferences = async () => {
      // 1. Fetch Brands
      const { data: brandsData } = await supabase.from('brand').select('*').order('name');
      if (brandsData) {
        // Huwag isama ang sarili sa listahan ng parent options kapag nag-e-edit
        setExistingBrands(brandsData.filter(b => b.parent_id === null && b.id !== initialData?.id));
      }

      // 2. Fetch Categories
      const { data: catData } = await supabase.from('category').select('*').order('name');
      if (catData) {
        setAllCategories(catData);

        // Logic para i-auto select ang tamang categories sa Edit Mode
        if (initialData?.category_id) {
          const selectedCat = catData.find(c => c.id === initialData.category_id);
          if (selectedCat) {
            if (selectedCat.parent_id !== null) {
              setSelectedMainCategory(selectedCat.parent_id.toString());
              setSelectedSubCategory(selectedCat.id.toString());
            } else {
              setSelectedMainCategory(selectedCat.id.toString());
            }
          }
        }
      }
    };
    fetchReferences();
  }, [initialData]);

  const mainCategories = allCategories.filter(c => c.parent_id === null);
  const subCategories = allCategories.filter(c => selectedMainCategory ? c.parent_id === parseInt(selectedMainCategory) : false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setPreviewUrl(URL.createObjectURL(file)); // Magpakita ng live preview
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let finalLogoUrl = initialData?.logo_url; // Default sa luma kung walang bagong in-upload

      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('brand-logos').upload(fileName, logoFile);
        if (uploadError) throw new Error(`Image Upload Failed: ${uploadError.message}`);
        const { data: { publicUrl } } = supabase.storage.from('brand-logos').getPublicUrl(fileName);
        finalLogoUrl = publicUrl;
      }

      const finalCategoryId = selectedSubCategory || selectedMainCategory || null;
      
      const endpoint = isEditing ? `/api/admin/brands/${initialData.id}` : '/api/admin/brands';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, description, logo_url: finalLogoUrl, parent_id: parentId, category_id: finalCategoryId, featured
        })
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.error);

      alert(`Brand successfully ${isEditing ? 'updated' : 'added'}!`);
      router.push('/admin/brands'); // I-redirect pabalik sa table dashboard
      router.refresh();

    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
      <form onSubmit={handleSubmit} className="space-y-6" suppressHydrationWarning>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Brand Name *</label>
              <input 
                type="text" required value={name} onChange={(e) => setName(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Main Category *</label>
                <select 
                  required value={selectedMainCategory} 
                  onChange={(e) => { setSelectedMainCategory(e.target.value); setSelectedSubCategory(''); }}
                  className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
                >
                  <option value="">Select...</option>
                  {mainCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name.toUpperCase()}</option>)}
                </select>
              </div>

              {subCategories.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Sub Category</label>
                  <select 
                    value={selectedSubCategory} onChange={(e) => setSelectedSubCategory(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-lg bg-slate-50 outline-none"
                  >
                    <option value="">Any (Optional)</option>
                    {subCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Parent Brand</label>
              <select 
                value={parentId} onChange={(e) => setParentId(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-lg outline-none"
              >
                <option value="">None (Main Brand)</option>
                {existingBrands.map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
              </select>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Brand Logo</label>
              <div className="flex items-center gap-6">
                {/* Logo Preview Bubble */}
                <div className="w-20 h-20 shrink-0 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden relative">
                  {previewUrl ? (
                    <Image src={previewUrl} alt="Preview" fill className="object-contain p-2" />
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">No Logo</span>
                  )}
                </div>
                <div className="flex-1">
                  <input 
                    type="file" accept="image/*" onChange={handleImageChange}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                  />
                  <p className="text-xs text-slate-400 mt-2">Upload a PNG, JPG, or WEBP file. Max 2MB.</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
              <textarea 
                value={description} onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-lg outline-none h-24"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <label className="flex items-center gap-3 cursor-pointer">
            <input 
              type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)}
              className="w-5 h-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <span className="text-sm font-semibold text-slate-800">Feature on Homepage</span>
          </label>

          <div className="flex gap-3">
            <button type="button" onClick={() => router.push('/admin/brands')} className="px-6 py-2.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="px-8 py-2.5 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition disabled:opacity-50">
              {isLoading ? 'Saving...' : isEditing ? 'Update Brand' : 'Save New Brand'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}