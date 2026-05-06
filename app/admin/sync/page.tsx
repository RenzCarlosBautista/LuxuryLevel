'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle, RefreshCw, Trash2, Eye } from 'lucide-react';

interface SyncItem {
  id: string;
  sync_type: 'missing' | 'price_diff' | 'extra';
  product_category: string;
  reference_data: any;
  local_product_id?: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at: string;
}

interface TabStats {
  missing: number;
  price_diff: number;
  extra: number;
}

export default function ProductSyncPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'missing' | 'price_diff' | 'extra'>('missing');
  const [items, setItems] = useState<SyncItem[]>([]);
  const [stats, setStats] = useState<TabStats>({ missing: 0, price_diff: 0, extra: 0 });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SyncItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  // Get auth token from localStorage
  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin_token');
    }
    return null;
  };

  // Fetch pending sync items
  const fetchPendingItems = async (type: 'missing' | 'price_diff' | 'extra') => {
    try {
      setLoading(true);
      const token = getToken();

      const response = await fetch(`/api/admin/sync/pending?syncType=${type}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sync items');
      }

      const data = await response.json();
      setItems(data.items || []);

      // Update stats
      if (type === 'missing') setStats((s) => ({ ...s, missing: data.total }));
      if (type === 'price_diff') setStats((s) => ({ ...s, price_diff: data.total }));
      if (type === 'extra') setStats((s) => ({ ...s, extra: data.total }));
    } catch (error) {
      console.error('Error fetching sync items:', error);
      alert('Failed to fetch sync items');
    } finally {
      setLoading(false);
    }
  };

  // Trigger manual sync
  const triggerManualSync = async () => {
    try {
      setSyncing(true);
      const token = getToken();

      const response = await fetch('/api/admin/sync/manual-trigger', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to trigger sync');
      }

      const data = await response.json();
      alert('Sync started! Check back in a few minutes for results.');

      // Reload after a delay
      setTimeout(() => {
        fetchPendingItems(activeTab);
      }, 5000);
    } catch (error) {
      console.error('Error triggering sync:', error);
      alert('Failed to trigger sync');
    } finally {
      setSyncing(false);
    }
  };

  // Approve sync item
  const approveSyncItem = async (itemId: string) => {
    try {
      const token = getToken();

      const response = await fetch(`/api/admin/sync/approve/${itemId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: adminNotes }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve sync item');
      }

      alert('Sync item approved!');
      setShowDetailModal(false);
      fetchPendingItems(activeTab);
    } catch (error) {
      console.error('Error approving sync item:', error);
      alert('Failed to approve sync item');
    }
  };

  // Reject sync item
  const rejectSyncItem = async (itemId: string) => {
    try {
      const token = getToken();

      const response = await fetch(`/api/admin/sync/reject/${itemId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: adminNotes }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject sync item');
      }

      alert('Sync item rejected!');
      setShowDetailModal(false);
      fetchPendingItems(activeTab);
    } catch (error) {
      console.error('Error rejecting sync item:', error);
      alert('Failed to reject sync item');
    }
  };

  useEffect(() => {
    fetchPendingItems(activeTab);
  }, [activeTab]);

  const getTabColor = (type: 'missing' | 'price_diff' | 'extra') => {
    if (type === 'missing') return 'bg-blue-50 border-blue-200';
    if (type === 'price_diff') return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  const getTabIcon = (type: 'missing' | 'price_diff' | 'extra') => {
    if (type === 'missing') return <AlertCircle className="w-5 h-5 text-blue-600" />;
    if (type === 'price_diff') return <RefreshCw className="w-5 h-5 text-orange-600" />;
    return <Trash2 className="w-5 h-5 text-red-600" />;
  };

  const getTabLabel = (type: 'missing' | 'price_diff' | 'extra') => {
    if (type === 'missing') return 'Missing Products';
    if (type === 'price_diff') return 'Price Differences';
    return 'Extra Products';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Product Synchronization</h1>
        <p className="text-gray-600">Manage product sync from luxurysouq.com</p>

        <button
          onClick={triggerManualSync}
          disabled={syncing}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          {syncing ? 'Syncing...' : 'Trigger Manual Sync Now'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {(['missing', 'price_diff', 'extra'] as const).map((type) => (
          <div key={type} className={`border p-4 rounded-lg ${getTabColor(type)}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{getTabLabel(type)}</p>
                <p className="text-2xl font-bold mt-1">
                  {type === 'missing'
                    ? stats.missing
                    : type === 'price_diff'
                      ? stats.price_diff
                      : stats.extra}
                </p>
              </div>
              {getTabIcon(type)}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b">
        {(['missing', 'price_diff', 'extra'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setActiveTab(type)}
            className={`px-4 py-2 font-medium border-b-2 transition ${
              activeTab === type
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {getTabLabel(type)}
          </button>
        ))}
      </div>

      {/* Items List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading sync items...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No pending sync items</div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="border bg-white rounded-lg p-4 hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{item.reference_data.name}</h3>
                  <p className="text-sm text-gray-600">
                    Brand: {item.reference_data.brand} | Category: {item.product_category}
                  </p>

                  {activeTab === 'price_diff' && (
                    <p className="text-sm text-orange-600 mt-1">
                      Reference: AED {item.reference_data.price.toLocaleString()} | Current: AED{' '}
                      {item.reference_data.local_price?.toLocaleString()}
                    </p>
                  )}

                  {activeTab === 'missing' && (
                    <p className="text-sm text-blue-600 mt-1">Price: AED {item.reference_data.price.toLocaleString()}</p>
                  )}

                  {activeTab === 'extra' && (
                    <p className="text-sm text-red-600 mt-1">
                      This product is not in the reference website. Consider archiving or deleting.
                    </p>
                  )}

                  {item.admin_notes && (
                    <p className="text-sm text-gray-500 mt-2">Notes: {item.admin_notes}</p>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => {
                      setSelectedItem(item);
                      setAdminNotes(item.admin_notes || '');
                      setShowDetailModal(true);
                    }}
                    className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    Details
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold">{selectedItem.reference_data.name}</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {/* Product Details */}
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-semibold mb-3">Product Information</h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Brand:</span> {selectedItem.reference_data.brand}
                  </p>
                  <p>
                    <span className="font-medium">Category:</span> {selectedItem.product_category}
                  </p>
                  <p>
                    <span className="font-medium">Price:</span> AED{' '}
                    {selectedItem.reference_data.price.toLocaleString()}
                  </p>
                  {selectedItem.reference_data.color && (
                    <p>
                      <span className="font-medium">Color:</span> {selectedItem.reference_data.color}
                    </p>
                  )}
                  {selectedItem.reference_data.gender && (
                    <p>
                      <span className="font-medium">Gender:</span> {selectedItem.reference_data.gender}
                    </p>
                  )}
                  {selectedItem.reference_data.description && (
                    <p>
                      <span className="font-medium">Description:</span>{' '}
                      {selectedItem.reference_data.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Admin Notes */}
              <div>
                <label className="block font-semibold mb-2">Admin Notes</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full border rounded p-2 text-sm"
                  rows={4}
                  placeholder="Add notes about this product..."
                />
              </div>

              {/* Image Preview */}
              {selectedItem.reference_data.image_url && (
                <div>
                  <p className="font-semibold mb-2">Product Image</p>
                  <img
                    src={selectedItem.reference_data.image_url}
                    alt={selectedItem.reference_data.name}
                    className="max-w-full h-auto rounded max-h-64"
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t p-6 flex gap-3 justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => rejectSyncItem(selectedItem.id)}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
              >
                Reject
              </button>
              <button
                onClick={() => approveSyncItem(selectedItem.id)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Approve & Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
