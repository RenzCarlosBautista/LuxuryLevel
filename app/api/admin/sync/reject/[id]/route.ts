import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 1. Await the params for Next.js 15 compatibility
    const resolvedParams = await params;
    const stagingId = resolvedParams.id;

    // --- 🚨 TEMPORARY BYPASS PARA SA TESTING 🚨 ---
    // I-comment out muna ang token checking:
    /*
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const adminId = await verifyAdminToken(token);
    if (!adminId) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    */
    // ----------------------------------------------

    console.log(`[API] Rejecting/Ignoring staging item: ${stagingId}`);

    // 2. Burahin ang row sa staging table dahil in-ignore mo na
    const { error: deleteError } = await supabaseAdmin
      .from('staging_products')
      .delete()
      .eq('id', stagingId);

    if (deleteError) {
      throw new Error(`Failed to reject item: ${deleteError.message}`);
    }

    return NextResponse.json({ success: true, message: 'Item rejected' }, { status: 200 });

  } catch (error: any) {
    console.error('[API] Error rejecting item:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}