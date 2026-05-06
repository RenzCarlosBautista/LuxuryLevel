/**
 * API: Reject Product Sync Item
 * POST /api/admin/sync/reject/:id
 * 
 * Rejects a pending product sync item
 * Body: { reason?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/admin-auth';
import { rejectSyncItem } from '@/lib/scraping/compare-products';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const syncId = params.id;

    // Verify admin authentication
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminId = await verifyAdminToken(token);
    if (!adminId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const reason = body.reason || undefined;

    console.log(`[API] Rejecting sync item: ${syncId} by admin: ${adminId}`);

    // Reject the sync item
    await rejectSyncItem(syncId, adminId, reason);

    return NextResponse.json(
      {
        success: true,
        message: 'Sync item rejected',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] Error rejecting sync item:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reject sync item',
      },
      { status: 500 }
    );
  }
}
