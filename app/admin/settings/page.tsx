// app/admin/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Settings as SettingsIcon, Save } from 'lucide-react';

export default function StoreSettingsPage() {
  const [rate, setRate] = useState<number | string>(3.67);
  const [markup, setMarkup] = useState<number | string>(10);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Fetch the current settings on page load
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.settings) {
          setRate(data.settings.usd_to_aed_rate);
          setMarkup(data.settings.markup_percentage);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to load settings:", err);
        setIsLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usd_to_aed_rate: rate, markup_percentage: markup })
      });
      
      const data = await res.json();
      if (data.success) {
        alert('Pricing settings updated successfully! All store prices will now adjust accordingly.');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link href="/admin/dashboard" className="text-sm font-semibold text-slate-500 hover:text-slate-900 mb-2 inline-block transition-colors">
          &larr; Back to Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-indigo-600" />
          <h1 className="text-3xl font-bold text-slate-900">Store Settings</h1>
        </div>
        <p className="text-slate-500 mt-2">Manage your global pricing formulas and exchange rates here.</p>
      </div>

      {isLoading ? (
        <div className="animate-pulse flex space-x-4">
          <div className="h-32 bg-slate-200 rounded-xl w-full"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden w-full">
          <div className="p-6 border-b border-slate-100 bg-slate-50">
            <h2 className="text-lg font-bold text-slate-800">Dynamic Pricing Engine</h2>
            <p className="text-sm text-slate-500">
              These values will be used to automatically convert the base AED price to USD, including your profit margin, before displaying it to customers.
            </p>
          </div>

          <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              
              {/* EXCHANGE RATE INPUT */}
              <div className="bg-slate-50 p-6 sm:p-8 rounded-xl border border-slate-100">
                <label className="block text-sm font-bold text-slate-700 mb-4">
                  Exchange Rate (USD to AED)
                </label>
                <div className="flex items-center shadow-sm">
                  <span className="px-6 py-4 bg-white border border-slate-200 border-r-0 rounded-l-lg font-bold text-slate-500">
                    AED
                  </span>
                  <input 
                    type="number" step="0.01" required 
                    value={rate} onChange={(e) => setRate(e.target.value)}
                    className="w-full p-4 border border-slate-200 rounded-r-lg focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-lg transition-shadow"
                  />
                </div>
                <p className="text-sm text-slate-500 mt-4 leading-relaxed">
                  How many Dirhams (AED) equal 1 US Dollar? The current standard rate is usually around <span className="font-bold text-slate-700">3.67</span>.
                </p>
              </div>

              {/* MARKUP PERCENTAGE INPUT */}
              <div className="bg-slate-50 p-6 sm:p-8 rounded-xl border border-slate-100">
                <label className="block text-sm font-bold text-slate-700 mb-4">
                  Global Profit Markup
                </label>
                <div className="flex items-center shadow-sm">
                  <span className="px-6 py-4 bg-white border border-slate-200 border-r-0 rounded-l-lg font-bold text-slate-500">
                    +
                  </span>
                  <input 
                    type="number" step="0.1" required 
                    value={markup} onChange={(e) => setMarkup(e.target.value)}
                    className="w-full p-4 border-y border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-lg transition-shadow"
                  />
                  <span className="px-6 py-4 bg-white border border-slate-200 border-l-0 rounded-r-lg font-bold text-slate-500">
                    %
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-4 leading-relaxed">
                  What percentage markup would you like to apply to the original AED price before converting and displaying it in USD? (e.g., <span className="font-bold text-slate-700">10%</span>)
                </p>
              </div>

            </div>

            <div className="pt-8 border-t border-slate-100 flex justify-end">
              <button 
                type="submit" disabled={isSaving}
                className="flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold px-10 py-4 rounded-lg hover:bg-indigo-700 transition-all duration-200 disabled:opacity-50 shadow-sm hover:shadow-md min-w-[200px]"
              >
                <Save size={20} />
                {isSaving ? 'Saving Changes...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}