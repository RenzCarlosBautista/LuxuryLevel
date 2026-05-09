import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('*')
      .eq('id', 1)
      .single();
      
    if (error) throw error;
    return NextResponse.json({ success: true, settings: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { usd_to_aed_rate, markup_percentage } = body;

    const { data, error } = await supabase
      .from('store_settings')
      .update({ 
        usd_to_aed_rate: Number(usd_to_aed_rate), 
        markup_percentage: Number(markup_percentage) 
      })
      .eq('id', 1)
      .select();

    if (error) throw error;

    // --- AGGRESSIVE CACHE CLEARING ---
    // Instead of relying on a broad layout clear, we explicitly tell Next.js 
    // to purge the cache for every specific page that shows products.
    revalidatePath('/');
    revalidatePath('/watches');
    revalidatePath('/jewelry');
    revalidatePath('/bags');
    revalidatePath('/brands');
    
    // This clears all dynamic product pages (e.g., /products/123)
    revalidatePath('/products/[id]', 'page'); 
    // ---------------------------------

    return NextResponse.json({ success: true, settings: data[0] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}