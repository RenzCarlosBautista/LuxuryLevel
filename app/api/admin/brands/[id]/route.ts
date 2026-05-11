import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Kunin ang data ng isang specific na brand para sa Edit form
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // FIX: I-await ang params bago kunin ang id!
    const resolvedParams = await params;
    const id = resolvedParams.id;

    const { data, error } = await supabase
      .from('brand')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, brand: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH: I-update ang existing brand
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // FIX: I-await ang params
    const resolvedParams = await params;
    const id = resolvedParams.id;

    const body = await request.json();
    const { name, description, logo_url, parent_id, category_id, featured } = body;

    const { data, error } = await supabase
      .from('brand')
      .update({
        name,
        description: description || null,
        logo_url: logo_url !== undefined ? logo_url : null,
        parent_id: parent_id ? parseInt(parent_id) : null,
        category_id: category_id ? parseInt(category_id) : null,
        featured: featured || false,
      })
      .eq('id', id)
      .select();

    if (error) throw error;
    return NextResponse.json({ success: true, brand: data[0] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Burahin ang brand
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // FIX: I-await ang params
    const resolvedParams = await params;
    const id = resolvedParams.id;

    const { data: brand } = await supabase.from('brand').select('logo_url').eq('id', id).single();
    
    // Gamitin ang nakuha nating id dito
    const { error } = await supabase.from('brand').delete().eq('id', id);
    if (error) throw error;

    if (brand && brand.logo_url && brand.logo_url.includes('brand-logos')) {
      const urlParts = brand.logo_url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      await supabase.storage.from('brand-logos').remove([fileName]);
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}