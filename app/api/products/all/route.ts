import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Para laging fresh ang data na kukunin mula sa database
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Safety check
    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase variables: Check your .env.local or Vercel settings.");
      return NextResponse.json(
        { error: "Server configuration error" }, 
        { status: 500 }
      );
    }

    // Initialize Supabase Admin
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // DITO ANG PAGBABAGO: Pinalitan ng 'product' imbes na 'products'
const { data: products, error } = await supabaseAdmin
      .from('product') 
      // DITO: Nilagyan natin ng !fk_product_category_id para sabihin kay Supabase kung alin ang gagamitin
      .select('*, category!fk_product_category_id(*), brand(*)') 
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Supabase Error:", error.message, error.details);
      return NextResponse.json(
        { error: 'Failed to fetch products' }, 
        { status: 500 }
      );
    }

    // Ibinabato nang direkta ang array para mabasa agad ng frontend / modal
    return NextResponse.json(products || [], { status: 200 });

  } catch (error) {
    console.error("Unexpected API error:", error);
    return NextResponse.json(
      { error: 'An internal server error occurred' }, 
      { status: 500 }
    );
  }
}