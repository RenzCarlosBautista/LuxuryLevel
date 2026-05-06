// app/compare/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Scale, ArrowRight, Sparkles } from 'lucide-react';
import ComparisonTable from '@/components/product-specification/comparison-table';
import { Product } from '@/lib/types';
import { useComparison } from '@/contexts/ComparisonContext';

export default function ComparePage() {
  const { comparisonProducts } = useComparison();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydration phase - ensure localStorage is synced
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    // Slight artificial delay to allow smooth entry animations
    const timer = setTimeout(() => setIsLoaded(true), 150);
    return () => clearTimeout(timer);
  }, []);

  // Show loading while hydrating
  if (!isHydrated || !isLoaded) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-6 animate-fade-in-slow">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-16 h-16 bg-slate-50 rounded-full blur-xl animate-pulse"></div>
            <div className="w-8 h-8 border-[1px] border-slate-200 border-t-slate-900 rounded-full animate-spin relative z-10"></div>
          </div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.3em] animate-pulse">Curating Selection</p>
        </div>
      </div>
    );
  }

  // 2. BOUTIQUE EMPTY STATE (Highly Animated)
  if (comparisonProducts.length === 0) {
    return (
      <div className="min-h-screen bg-white py-24 px-4 md:px-8 font-sans flex flex-col items-center justify-center relative overflow-hidden">
        
        {/* Soft Ambient Lighting Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-slate-50 rounded-full blur-[120px] opacity-70 pointer-events-none animate-pulse-slow"></div>

        <div className="text-center max-w-xl w-full relative z-10">
          
          {/* Floating Icon with Glow */}
          <div className="relative w-32 h-32 mx-auto mb-10 flex items-center justify-center">
            <div className="absolute inset-0 bg-slate-100/50 rounded-full blur-2xl animate-pulse-slow"></div>
            <div className="relative animate-float bg-white w-20 h-20 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50 flex items-center justify-center">
              <Scale size={32} strokeWidth={1} className="text-slate-900" />
              <Sparkles size={14} className="absolute -top-2 -right-2 text-slate-300 animate-pulse" />
            </div>
          </div>
          
          <div className="animate-slide-up-stagger-1">
            <h1 className="text-3xl font-medium text-slate-900 mb-5 tracking-tight">Your Selection is Empty</h1>
          </div>
          
          <div className="animate-slide-up-stagger-2">
            <p className="text-sm text-slate-500 mb-12 leading-relaxed max-w-md mx-auto">
              You haven't selected any pieces yet. Browse our exclusive boutique and select up to 3 items to evaluate their unique characteristics side-by-side.
            </p>
          </div>
          
          {/* Premium Hover-Reveal Button */}
          <div className="animate-slide-up-stagger-3">
            <Link
              href="/products"
              className="group relative inline-flex items-center justify-center overflow-hidden bg-slate-900 text-white px-10 py-4 text-[11px] font-semibold uppercase tracking-[0.2em] transition-all duration-500 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] hover:shadow-[0_15px_50px_-10px_rgba(0,0,0,0.4)] hover:-translate-y-1"
            >
              <span className="relative z-10 flex items-center gap-3">
                Discover the Collection
                <ArrowRight size={14} strokeWidth={1.5} className="group-hover:translate-x-2 transition-transform duration-500 ease-out" />
              </span>
              {/* Glossy swipe effect on hover */}
              <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:translate-x-0 transition-transform duration-700 ease-out skew-x-12"></div>
            </Link>
          </div>

        </div>
      </div>
    );
  }

  // 3. BOUTIQUE POPULATED STATE (Staggered Entrances)
  return (
    <div className="min-h-screen bg-white py-12 md:py-20 px-4 md:px-8 font-sans relative overflow-hidden">
      
      {/* Subtle Background Lighting for Depth */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-slate-50/80 rounded-full blur-[150px] opacity-60 -z-10 pointer-events-none translate-x-1/3 -translate-y-1/3"></div>

      <div className="max-w-[1200px] mx-auto space-y-12">
        
        {/* Minimalist Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-100 pb-10 relative">
          
          <div>
            <div className="animate-slide-up-stagger-1">
              <Link
                href="/products"
                className="inline-flex items-center gap-3 text-[10px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-[0.2em] mb-8 transition-colors group"
              >
                <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:border-slate-300 transition-colors">
                  <ArrowLeft size={12} strokeWidth={2} className="group-hover:-translate-x-0.5 transition-transform" />
                </div>
                Return to Boutique
              </Link>
            </div>
            
            <div className="animate-slide-up-stagger-2 relative inline-block">
              <h1 className="text-3xl md:text-5xl font-medium text-slate-900 tracking-tight relative z-10">Compare Selection</h1>
              {/* Text highlight underline animation */}
              <div className="absolute bottom-1 left-0 w-full h-3 bg-slate-100 -z-10 animate-reveal-width origin-left"></div>
            </div>

            <div className="animate-slide-up-stagger-3">
              <p className="text-sm text-slate-500 mt-4 tracking-wide">
                Evaluating <span className="text-slate-900 font-medium">{comparisonProducts.length}</span> exquisite {comparisonProducts.length === 1 ? 'piece' : 'pieces'}
              </p>
            </div>
          </div>

          <div className="animate-slide-up-stagger-3 w-full md:w-auto">
            <Link
              href="/products"
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-white border border-slate-200 text-slate-900 text-[10px] font-bold uppercase tracking-[0.15em] hover:border-slate-900 transition-all duration-500 w-full md:w-auto hover:shadow-lg"
            >
              <div className="relative w-4 h-4 flex items-center justify-center overflow-hidden">
                <Plus size={14} strokeWidth={1.5} className="absolute transition-transform duration-500 group-hover:rotate-90" />
              </div>
              Add Another Piece
            </Link>
          </div>
        </div>

        {/* The Comparison Table with a slow, elegant fade-up */}
        <div className="relative z-10 animate-fade-in-up" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
          <ComparisonTable products={comparisonProducts as Product[]} />
        </div>

      </div>

      <style jsx>{`
        /* Smooth, flowing animations for luxury feel */
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes reveal-width {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }

        /* Utility Classes */
        .animate-fade-in-slow {
          animation: fade-in 1.2s ease-out forwards;
        }
        .animate-fade-in-up {
          animation: slide-up 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animate-reveal-width {
          animation: reveal-width 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          animation-delay: 0.3s;
        }

        /* Staggered Slide Ups */
        .animate-slide-up-stagger-1 {
          animation: slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
          animation-delay: 0.1s;
        }
        .animate-slide-up-stagger-2 {
          animation: slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
          animation-delay: 0.2s;
        }
        .animate-slide-up-stagger-3 {
          animation: slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
          animation-delay: 0.3s;
        }
      `}</style>
    </div>
  );
}