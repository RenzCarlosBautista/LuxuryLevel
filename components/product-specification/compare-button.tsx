'use client';

import { useState } from 'react';
import { ScaleIcon } from 'lucide-react';
import ComparisonModal from './comparison-modal';
import { useComparison } from '@/contexts/ComparisonContext';
import { Product } from '@/lib/types';

interface CompareButtonProps {
  product: Product | any; 
}

export default function CompareButton({ product }: CompareButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Hinugot natin ang clearComparison dito
  const { addToComparison, clearComparison } = useComparison();

  const handleCompareClick = () => {
    // 1. FRESH START: Burahin muna lahat ng lumang na-save na products
    clearComparison();
    
    // 2. I-add itong bagong product na tinitingnan ngayon
    addToComparison(product);
    
    // 3. Saka buksan ang modal
    setIsModalOpen(true);
  };

  return (
    <>
      <button
        onClick={handleCompareClick} 
        className="w-full flex items-center justify-center gap-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm py-4 rounded-xl transition-all duration-300 shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] group"
      >
        <ScaleIcon 
          size={18} 
          className="text-slate-400 group-hover:text-white transition-colors duration-300 group-hover:scale-110" 
        />
        <span>Compare with Other Products</span>
      </button>
      
      <ComparisonModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentProductId={product.id}
      />
    </>
  );
}