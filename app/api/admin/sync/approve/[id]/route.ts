import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { uploadFileToR2 } from '@/lib/r2';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function processAndUploadImage(url: string | null, refNo: string, index: number, category: string): Promise<string | null> {
  if (!url || !url.startsWith('http')) return url; 

  console.log(`[TRACKER] 📥 Downloading Image ${index}: ${url}`);
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
    
    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    let ext = '.jpg';
    if (contentType.includes('png')) ext = '.png';
    if (contentType.includes('webp')) ext = '.webp';

    const categoryFolder = category ? category.toLowerCase().replace(/[^a-z0-9]/g, '') : 'misc';
    const r2Key = `${categoryFolder}/${refNo}_${index}${ext}`; 

    console.log(`[TRACKER] ☁️ Uploading Image ${index} to Cloudflare as: ${r2Key}`);
    await uploadFileToR2(arrayBuffer, r2Key, contentType);
    
    console.log(`[TRACKER] ✅ Success Upload Image ${index}!`);
    return r2Key; 
  } catch (error) {
    console.error(`[TRACKER ERROR] ❌ Error in image ${index}:`, error);
    return null;
  }
}

// Napansin mo yung Promise<{ id: string }>? Yan ang kailangan ng bagong Next.js!
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params; // 👈 Hihintayin muna natin
    const stagingId = resolvedParams.id; // 👈 Saka natin kukunin ang ID
    console.log(`\n\n=========================================`);
    console.log(`[TRACKER 1] 🚀 API Called for Staging ID: ${stagingId}`);

    // FAKE ADMIN MUNA
    const adminId = 'dev_admin'; 
    console.log(`[TRACKER 2] 🔓 Auth Bypassed. Admin is: ${adminId}`);

    console.log(`[TRACKER 3] 🔍 Fetching from database...`);
    const { data: stagingData, error: fetchError } = await supabaseAdmin
      .from('staging_products')
      .select('*')
      .eq('id', stagingId)
      .single();

    if (fetchError) throw new Error(`DB Fetch Error: ${fetchError.message}`);
    if (!stagingData) throw new Error('Product not found in database');

    console.log(`[TRACKER 4] 📦 Found Product: ${stagingData.scraped_name}`);

    const refNo = stagingData.scraped_ref_no || `prod_${stagingId}`;
    const cat = stagingData.raw_category_name || 'products';

    const image_1 = await processAndUploadImage(stagingData.image_url, refNo, 1, cat);
    const image_2 = await processAndUploadImage(stagingData.image_url_2, refNo, 2, cat);
    const image_3 = await processAndUploadImage(stagingData.image_url_3, refNo, 3, cat);

    console.log(`[TRACKER 5] 💾 Updating staging table with new R2 keys...`);
    const { error: updateError } = await supabaseAdmin
      .from('staging_products')
      .update({
        image_url: image_1 || stagingData.image_url,
        image_url_2: image_2 || stagingData.image_url_2,
        image_url_3: image_3 || stagingData.image_url_3,
      })
      .eq('id', stagingId);

    if (updateError) throw new Error(`Update Error: ${updateError.message}`);

    console.log(`[TRACKER 6] ⚙️ Calling SQL Function (approve_and_map_product)...`);
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('approve_and_map_product', {
      p_staging_id: parseInt(stagingId),
      p_approved_by: adminId,
    });

    if (rpcError) throw new Error(`RPC Error: ${rpcError.message}`);

    console.log(`[TRACKER 7] 🎉 EVERYTHING SUCCESSFUL!`);
    console.log(`=========================================\n\n`);

    return NextResponse.json({ success: true, message: 'Approved!' }, { status: 200 });

  } catch (error: any) {
    console.error('\n[TRACKER FATAL ERROR] 💥 System crashed at:', error.message);
    console.log(`=========================================\n\n`);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}