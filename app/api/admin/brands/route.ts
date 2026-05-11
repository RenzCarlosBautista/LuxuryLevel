import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET lahat ng brands (para sa dropdown ng Sub-brands at sa Store frontend)
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('brand')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ success: true, brands: data });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch brands' }, { status: 500 });
  }
}

// POST para mag-add ng bagong brand
export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Dinagdag natin ang category_id dito
    const { name, description, logo_url, parent_id, featured, category_id } = body;

    const { data, error } = await supabase
      .from('brand')
      .insert([
        { 
          name, 
          description: description || null, 
          logo_url: logo_url || null, 
          parent_id: parent_id ? parseInt(parent_id) : null,
          category_id: category_id ? parseInt(category_id) : null, // Sini-save na natin!
          featured: featured || false
        }
      ])
      .select();

    if (error) throw error;
    return NextResponse.json({ success: true, brand: data[0] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}