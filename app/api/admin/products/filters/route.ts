// app/api/admin/products/filters/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyAdminFromRequest } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  try {
    // Verify admin
    const admin = await verifyAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch unique brands
    const { data: brandData, error: brandError } = await supabase
      .from("brand")
      .select("id, name")
      .order("name");

    if (brandError) {
      console.error("Brand fetch error:", brandError);
    }

    // Fetch unique genders from products
    const { data: genderData, error: genderError } = await supabase
      .from("product")
      .select("gender")
      .not("gender", "is", null);

    if (genderError) {
      console.error("Gender fetch error:", genderError);
    }

    // Fetch unique colors from products
    const { data: colorData, error: colorError } = await supabase
      .from("product")
      .select("color")
      .not("color", "is", null);

    if (colorError) {
      console.error("Color fetch error:", colorError);
    }

    // Extract unique values
    const uniqueGenders = Array.from(
      new Set(genderData?.map((p: any) => p.gender).filter(Boolean) || [])
    ).sort() as string[];

    const uniqueColors = Array.from(
      new Set(colorData?.map((p: any) => p.color).filter(Boolean) || [])
    ).sort() as string[];

    return NextResponse.json(
      {
        brands: brandData || [],
        genders: uniqueGenders,
        colors: uniqueColors,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching filters:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
