/**
 * API: Get Pending Product Sync Items
 * GET /api/admin/sync/pending
 * 
 * Retrieves pending product sync items for admin review
 * Query params:
 *   - syncType: 'missing' | 'price_diff' | 'extra' (optional)
 *   - limit: number (default 50)
 *   - offset: number (default 0)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/admin-auth';
import { getPendingSyncItems } from '@/lib/scraping/compare-products';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminId = await verifyAdminToken(token);
    if (!adminId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const syncType = searchParams.get('syncType') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch pending items
    const { items, total } = await getPendingSyncItems(syncType, limit, offset);

    return NextResponse.json(
      {
        success: true,
        items,
        total,
        limit,
        offset,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] Error fetching pending sync items:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch pending items',
      },
      { status: 500 }
    );
  }
}
