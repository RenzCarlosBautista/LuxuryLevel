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
}

// Lazy initialize Supabase client
let supabaseClient: ReturnType<typeof createClient> | null = null;

const getSupabaseClient = () => {
  if (!supabaseClient) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
    }
    
    // TINGNAN NATIN KUNG ANO ANG BINABASA NG NEXT.JS
    console.log("ACTUAL KEY READ:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20) + "...");

    supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }
  return supabaseClient;
};

export default function StagingApprovalDashboard() {
  const [stagingProducts, setStagingProducts] = useState<StagingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<number | null>(null);
  const [rejecting, setRejecting] = useState<number | null>(null);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0 });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [configError, setConfigError] = useState<string | null>(null);

  // Fetch staging products
  const fetchStagingProducts = async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      let query = supabase.from('staging_products').select('*').order('created_at', {ascending: false});

      if (filter === 'pending') {
        query = query.eq('sync_status', 'pending');
      }

      const { data, error } = await query;

      if (error) {
        const errorMsg = error.message || JSON.stringify(error);
        throw new Error(`Failed to fetch staging products: ${errorMsg}`);
      }

      setStagingProducts(data || []);

      // Fetch stats
      const { data: allData, error: statsError } = await supabase
        .from('staging_products')
        .select('sync_status')
        .eq('sync_status', 'pending');

      if (statsError) {
        console.warn('Stats fetch warning:', statsError);
        // Don't throw, just warn
      }

      setStats({
        total: data?.length || 0,
        pending: allData?.length || 0,
        approved: 0,
      });

      setMessage(null);
    } catch (error: any) {
      console.error('Error fetching staging products:', error);
      const errorMessage = error?.message || 'Failed to load staging products. Please ensure migrations have been run.';
      setMessage({ 
        type: 'error', 
        text: errorMessage 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if Supabase is properly configured
    try {
      getSupabaseClient();
      setConfigError(null);
      fetchStagingProducts();
    } catch (error: any) {
      setConfigError(error.message);
      setLoading(false);
    }
  }, [filter]);

  // Approve product
  const handleApprove = async (stagingId: number) => {
    if (configError) {
      setMessage({ type: 'error', text: 'Configuration error: ' + configError });
      return;
    }
    
    setApproving(stagingId);
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.rpc('approve_and_map_product', {
        p_staging_id: stagingId,
        p_approved_by: 'admin_user', // In production, use actual user
      });

      if (error) throw error;

      if (data?.success) {
        setMessage({
          type: 'success',
          text: `✓ Product approved! Synced as ${data.sync_status}`,
        });
        setStagingProducts(prev => prev.filter(p => p.id !== stagingId));
      } else {
        throw new Error(data?.error || 'Approval failed');
      }
    } catch (error: any) {
      console.error('Error approving product:', error);
      setMessage({
        type: 'error',
        text: `Failed to approve: ${error.message}`,
      });
    } finally {
      setApproving(null);
    }
  };

  // Reject product
  const handleReject = async (stagingId: number) => {
    if (configError) {
      setMessage({ type: 'error', text: 'Configuration error: ' + configError });
      return;
    }
    
    setRejecting(stagingId);
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.rpc('reject_staging_product', {
        p_staging_id: stagingId,
        p_rejected_by: 'admin_user',
        p_rejection_reason: 'Manual rejection from dashboard',
      });

      if (error) throw error;

      if (data?.success) {
        setMessage({ type: 'success', text: '✓ Product rejected and removed' });
        setStagingProducts(prev => prev.filter(p => p.id !== stagingId));
      } else {
        throw new Error(data?.error || 'Rejection failed');
      }
    } catch (error: any) {
      console.error('Error rejecting product:', error);
      setMessage({
        type: 'error',
        text: `Failed to reject: ${error.message}`,
      });
    } finally {
      setRejecting(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
            <AlertCircle size={14} />
            Pending
          </span>
        );
      case 'new_product':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
            <CheckCircle2 size={14} />
            New
          </span>
        );
      case 'price_updated':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            <RefreshCw size={14} />
            Updated
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
            <XCircle size={14} />
            Error
          </span>
        );
      default:
        return <span className="text-xs text-gray-600">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Configuration Error Alert */}
        {configError && (
          <div className="mb-8 p-6 bg-red-50 border-2 border-red-300 rounded-lg">
            <div className="flex items-start gap-4">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={24} />
              <div>
                <h2 className="text-lg font-bold text-red-900 mb-2">Configuration Error</h2>
                <p className="text-red-800 mb-4">{configError}</p>
                <div className="bg-red-100 p-3 rounded text-sm text-red-900 font-mono">
                  <p className="mb-2">Please add to your <code className="font-bold">.env.local</code>:</p>
                  <p>NEXT_PUBLIC_SUPABASE_URL=your_supabase_url</p>
                  <p>NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Staging Approval Dashboard</h1>
          <p className="text-slate-600">Review and approve scraped products before syncing to production</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Total Staged</p>
                <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <AlertCircle className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Pending Review</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <RefreshCw className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Refresh</p>
                <button
                  onClick={fetchStagingProducts}
                  disabled={loading}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium text-sm flex items-center gap-2"
                >
                  <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                  Reload
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              message.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            } flex items-center gap-3`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 size={20} />
            ) : (
              <XCircle size={20} />
            )}
            <div className="flex-1">
              <span className="font-medium">{message.text}</span>
              {message.type === 'error' && (
                <p className="text-xs mt-1 opacity-75">
                  💡 Tip: Check browser console (F12) for detailed error information
                </p>
              )}
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Pending ({stats.pending})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All ({stats.total})
          </button>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="animate-spin text-blue-600" size={40} />
            </div>
          ) : stagingProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-slate-500">
              <AlertCircle size={48} className="mb-4 opacity-30" />
              <p className="text-lg font-medium">No staged products</p>
              <p className="text-sm">Run the scraper to import products</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Product Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Brand
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stagingProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-slate-900 font-medium max-w-xs truncate">
                        {product.scraped_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                        {product.scraped_ref_no}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900">
                        <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 font-medium">
                          {product.raw_brand_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900">
                        <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 font-medium">
                          {product.raw_category_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                        {product.scraped_price ? `AED ${product.scraped_price.toFixed(2)}` : 'N/A'}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(product.sync_status)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApprove(product.id)}
                            disabled={approving === product.id}
                            className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-all font-medium text-sm"
                            title="Approve and sync to production"
                          >
                            {approving === product.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Check size={16} />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(product.id)}
                            disabled={rejecting === product.id}
                            className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all font-medium text-sm"
                            title="Reject and remove"
                          >
                            {rejecting === product.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <X size={16} />
                            )}
                            Reject
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

        {/* Footer Info */}
        <div className="mt-8 p-4 bg-slate-100 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600">
            <strong>How it works:</strong> Scraped products appear here in "pending" status. Click
            "Approve" to sync to production (auto-maps brands/categories or creates new ones). Click
            "Reject" to discard. All actions are logged for audit purposes.
          </p>
        </div>
      </div>
    </div>
  );
}
