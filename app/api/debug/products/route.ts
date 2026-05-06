// app/api/debug/products/route.ts
import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Check how many products exist
    const { data: products, error, count } = await supabase
      .from("product")
      .select("id, name, price, sale_price, stock", { count: "exact" })
      .limit(5);

    if (error) {
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      totalProducts: count,
      sampleProducts: products,
      message: count === 0 ? "No products in database. Run seeding scripts!" : `${count} products found`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
