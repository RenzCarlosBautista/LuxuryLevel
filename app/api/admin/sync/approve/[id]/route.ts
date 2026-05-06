/**
 * API: Approve Product Sync Item
 * POST /api/admin/sync/approve/:id
 * 
 * Approves and processes a pending product sync item
 * Body: { notes?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/admin-auth';
import { approveSyncItem } from '@/lib/scraping/compare-products';

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
    const notes = body.notes || undefined;

    console.log(`[API] Approving sync item: ${syncId} by admin: ${adminId}`);

    // Approve the sync item
    const syncRecord = await approveSyncItem(syncId, adminId, notes);

    return NextResponse.json(
      {
        success: true,
        message: 'Sync item approved',
        syncRecord,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] Error approving sync item:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to approve sync item',
      },
      { status: 500 }
    );
  }
}
