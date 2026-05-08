import BrandForm from '@/components/admin/brand-form';
import Link from 'next/link';

export default function AddBrandPage() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <Link href="/admin/brands" className="text-sm font-semibold text-slate-500 hover:text-slate-900 mb-2 inline-block">&larr; Back to Brands</Link>
        <h1 className="text-3xl font-bold text-slate-900">Add New Brand</h1>
      </div>
      <BrandForm />
    </div>
  );
} 