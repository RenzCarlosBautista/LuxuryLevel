'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Check,
  X,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Trash2
} from 'lucide-react';

interface StagingProduct {
  id: number;
  scraped_ref_no: string;
  scraped_name: string;
  scraped_price: number | null;
  raw_brand_name: string;
  raw_category_name: string;
  sync_status: string;
  created_at: string;
  error_message?: string;
  local_product?: { id: number; price: number } | null;
  is_price_change?: boolean;
  is_archive?: boolean;
}

let supabaseClient: ReturnType<typeof createClient> | null = null;
const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return supabaseClient;
};

export default function StagingApprovalDashboard() {
  const [stagingProducts, setStagingProducts] = useState<StagingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<number | null>(null);
  const [rejecting, setRejecting] = useState<number | null>(null);
  
  // BAGONG TABS: isinama na natin ang 'archive'
  const [filter, setFilter] = useState<'new' | 'updates' | 'archive' | 'all'>('new');
  const [stats, setStats] = useState({ total: 0, newProducts: 0, priceUpdates: 0, toArchive: 0 });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchStagingProducts = async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      
const { data: stagingData, error: stagingError } = await supabase
        .from('staging_products')
        .select('*')
        .in('sync_status', ['pending', 'missing']) // 👈 ITO ANG FIX!
        .order('created_at', { ascending: false });

      if (stagingError) throw new Error(stagingError.message);
      if (!stagingData || stagingData.length === 0) {
        setStagingProducts([]);
        setStats({ total: 0, newProducts: 0, priceUpdates: 0, toArchive: 0 });
        setLoading(false);
        return;
      }

      const refNos = stagingData.map(p => p.scraped_ref_no).filter(Boolean);
      const { data: localProducts } = await supabase
        .from('product')
        .select('id, ref_no, price')
        .in('ref_no', refNos);

      let newCount = 0;
      let updateCount = 0;
      let archiveCount = 0;

      const enrichedData: StagingProduct[] = stagingData.map(staging => {
        const local = localProducts?.find(p => p.ref_no === staging.scraped_ref_no);
        
        // DETECTION LOGIC:
        // Kung local exists, pero null/0 ang scraped price O 'missing' ang sync status = ARCHIVE
        const isArchive = local && (!staging.scraped_price || staging.sync_status === 'missing');
        const isPriceChange = local && !isArchive && Number(local.price) !== Number(staging.scraped_price);
        const isNew = !local;

        if (isNew) newCount++;
        else if (isArchive) archiveCount++;
        else if (isPriceChange) updateCount++;

        return {
          ...staging,
          local_product: local || null,
          is_price_change: isPriceChange,
          is_archive: isArchive
        };
      });

      let filteredData = enrichedData;
      if (filter === 'new') filteredData = enrichedData.filter(p => !p.local_product);
      else if (filter === 'updates') filteredData = enrichedData.filter(p => p.is_price_change);
      else if (filter === 'archive') filteredData = enrichedData.filter(p => p.is_archive);

      setStagingProducts(filteredData);
      setStats({ total: stagingData.length, newProducts: newCount, priceUpdates: updateCount, toArchive: archiveCount });
      setMessage(null);
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Failed to load data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStagingProducts(); }, [filter]);

  const handleApprove = async (stagingId: number) => {
    setApproving(stagingId);
    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const response = await fetch(`/api/admin/sync/approve/${stagingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ notes: 'Approved via Dashboard' })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Approval failed');

      if (data.success) {
        setMessage({ type: 'success', text: `✓ Product successfully synced!` });
        fetchStagingProducts(); 
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: `Failed to approve: ${error.message}` });
    } finally {
      setApproving(null);
    }
  };

  const handleArchive = async (stagingId: number) => {
    setApproving(stagingId); // Reusing loading state
    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const response = await fetch(`/api/admin/sync/archive/${stagingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Archive failed');

      if (data.success) {
        setMessage({ type: 'success', text: `✓ Product successfully archived from live store!` });
        fetchStagingProducts();
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: `Failed to archive: ${error.message}` });
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async (stagingId: number) => {
    setRejecting(stagingId);
    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const response = await fetch(`/api/admin/sync/reject/${stagingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ reason: 'Manual rejection' })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Rejection failed');

      if (data.success) {
        setMessage({ type: 'success', text: '✓ Item ignored and removed from list.' });
        fetchStagingProducts();
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: `Failed to ignore: ${error.message}` });
    } finally {
      setRejecting(null);
    }
  };

  const PriceDisplay = ({ product }: { product: StagingProduct }) => {
    if (product.is_archive) {
      return (
        <div className="flex flex-col gap-1">
          <div className="text-xs text-slate-500 line-through">
            AED {Number(product.local_product?.price).toFixed(2)}
          </div>
          <div className="flex items-center gap-1 font-bold text-red-600">
            Missing from Reference
            <Trash2 size={14} />
          </div>
        </div>
      );
    }

    if (product.is_price_change && product.local_product) {
      const isIncrease = Number(product.scraped_price) > Number(product.local_product.price);
      return (
        <div className="flex flex-col gap-1">
          <div className="text-xs text-slate-500 line-through">
            AED {Number(product.local_product.price).toFixed(2)}
          </div>
          <div className={`flex items-center gap-1 font-bold ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
            AED {Number(product.scraped_price).toFixed(2)}
            {isIncrease ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          </div>
        </div>
      );
    }

    return <span className="font-semibold text-slate-900">AED {Number(product.scraped_price).toFixed(2)}</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Staging Approval Dashboard</h1>
          <p className="text-slate-600">Review new products, price updates, and missing items.</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg border flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            {message.type === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => setFilter('new')} className={`px-5 py-2.5 rounded-lg font-medium transition-colors ${filter === 'new' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}`}>
            New ({stats.newProducts})
          </button>
          <button onClick={() => setFilter('updates')} className={`px-5 py-2.5 rounded-lg font-medium transition-colors ${filter === 'updates' ? 'bg-orange-600 text-white shadow-md' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}`}>
            Updates ({stats.priceUpdates})
          </button>
          <button onClick={() => setFilter('archive')} className={`px-5 py-2.5 rounded-lg font-medium transition-colors ${filter === 'archive' ? 'bg-red-600 text-white shadow-md' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}`}>
            To Archive ({stats.toArchive})
          </button>
          <button onClick={() => setFilter('all')} className={`px-5 py-2.5 rounded-lg font-medium transition-colors ${filter === 'all' ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}`}>
            View All ({stats.total})
          </button>
          
          <button onClick={fetchStagingProducts} className="ml-auto px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition flex items-center gap-2 font-medium">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Reload
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
          ) : stagingProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <CheckCircle2 size={48} className="mb-4 text-slate-300" />
              <p className="text-lg font-medium">No items in this category</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Product Name</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">SKU</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Pricing Status</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stagingProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900 max-w-[250px] truncate">{product.scraped_name}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-mono">{product.scraped_ref_no}</td>
                      <td className="px-6 py-4">
                        {product.is_archive ? (
                           <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Missing</span>
                        ) : product.local_product ? (
                           <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Existing</span>
                        ) : (
                           <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">New</span>
                        )}
                      </td>
                      <td className="px-6 py-4"><PriceDisplay product={product} /></td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {/* DYNAMIC BUTTON BASED ON TYPE */}
                          {product.is_archive ? (
                            <button
                              onClick={() => handleArchive(product.id)}
                              disabled={approving === product.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
                            >
                              {approving === product.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                              Archive Product
                            </button>
                          ) : (
                            <button
                              onClick={() => handleApprove(product.id)}
                              disabled={approving === product.id}
                              className={`flex items-center gap-1.5 px-3 py-1.5 text-white rounded-md transition-colors text-sm font-medium disabled:opacity-50 ${product.is_price_change ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                              {approving === product.id ? <Loader2 size={16} className="animate-spin" /> : (product.is_price_change ? <RefreshCw size={14}/> : <Check size={16} />)}
                              {product.is_price_change ? 'Update Price' : 'Approve'}
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleReject(product.id)}
                            disabled={rejecting === product.id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 disabled:opacity-50 transition-colors text-sm font-medium"
                          >
                            {rejecting === product.id ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />} Ignore
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
      </div>
    </div>
  );
}