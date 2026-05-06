'use client';

import Link from 'next/link';
import { useComparison } from '@/contexts/ComparisonContext';
import { ScaleIcon } from 'lucide-react';

export default function ComparisonBadge() {
  const { comparisonProducts } = useComparison();

  if (comparisonProducts.length === 0) {
    return null;
  }

  return (
    <Link
      href="/compare"
      className="relative inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
    >
      <ScaleIcon size={18} />
      <span className="font-medium">Compare</span>
      <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
        {comparisonProducts.length}
      </span>
    </Link>
  );
}
