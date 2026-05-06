// app/api/debug/seed-test-products/route.ts
import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    // First, get a brand to use
    const { data: brands, error: brandError } = await supabase
      .from("brand")
      .select("id")
      .limit(1);

    if (brandError || !brands || brands.length === 0) {
      return NextResponse.json(
        { error: "No brands found. Please seed brands first." },
        { status: 400 }
      );
    }

    const brandId = brands[0].id;

    // Sample test products with prices and sales prices
    const testProducts = [
      {
        name: "Luxury Watch - Rolex Submariner",
        ref_no: "ROLEX-SUB-001",
        description: "Iconic dive watch with precision engineering",
        color: "Black",
        gender: "Unisex",
        stock: 5,
        price: 45000,
        sale_price: 42000,
        sale_start_date: new Date().toISOString(),
        sale_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
        brand_id: brandId,
        category_id: null,
        image_1: null,
        image_2: null,
        image_3: null,
      },
      {
        name: "Diamond Ring - White Gold",
        ref_no: "DIAMOND-RING-001",
        description: "Elegant diamond ring crafted in white gold",
        color: "White",
        gender: "Female",
        stock: 3,
        price: 85000,
        sale_price: null,
        sale_start_date: null,
        sale_end_date: null,
        is_active: true,
        brand_id: brandId,
        category_id: null,
        image_1: null,
        image_2: null,
        image_3: null,
      },
      {
        name: "Designer Handbag - Louis Vuitton",
        ref_no: "LV-BAG-001",
        description: "Premium leather handbag with iconic LV monogram",
        color: "Monogram",
        gender: "Female",
        stock: 2,
        price: 12000,
        sale_price: 10500,
        sale_start_date: new Date().toISOString(),
        sale_end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
        brand_id: brandId,
        category_id: null,
        image_1: null,
        image_2: null,
        image_3: null,
      },
      {
        name: "Luxury Watch - Omega Seamaster",
        ref_no: "OMEGA-SM-001",
        description: "Professional seamaster watch trusted by divers",
        color: "Silver",
        gender: "Male",
        stock: 4,
        price: 38000,
        sale_price: null,
        sale_start_date: null,
        sale_end_date: null,
        is_active: true,
        brand_id: brandId,
        category_id: null,
        image_1: null,
        image_2: null,
        image_3: null,
      },
      {
        name: "Gold Bracelet - Italian Crafted",
        ref_no: "GOLD-BRACE-001",
        description: "18K gold bracelet with intricate Italian craftsmanship",
        color: "Gold",
        gender: "Female",
        stock: 6,
        price: 25000,
        sale_price: 22000,
        sale_start_date: new Date().toISOString(),
        sale_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
        brand_id: brandId,
        category_id: null,
        image_1: null,
        image_2: null,
        image_3: null,
      },
    ];

    // Insert test products
    const { data: inserted, error: insertError } = await supabase
      .from("product")
      .insert(testProducts)
      .select();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message, details: insertError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully created ${inserted?.length || 0} test products`,
      products: inserted,
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
