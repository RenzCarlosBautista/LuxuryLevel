// app/api/admin/products/list/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyAdminFromRequest } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  try {
    // Verify admin
    const admin = await verifyAdminFromRequest(req);
    if (!admin) {
      console.error("Admin verification failed");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "15"); // Matched to frontend
    const search = searchParams.get("search") || "";
    const brandId = searchParams.get("brand") || "";
    const gender = searchParams.get("gender") || "";
    const color = searchParams.get("color") || "";

    const offset = (page - 1) * limit;

    // Build query - Include parent category info
    let query = supabase
      .from("product")
      .select(
        `
        id,
        ref_no,
        name,
        description,
        color,
        gender,
        price,
        sale_price,
        sale_start_date,
        sale_end_date,
        brand_id,
        category_id,
        image_1,
        image_2,
        image_3,
        created_at,
        updated_at,
        brand(id, name),
        category!product_category_id_fkey(id, name, parent_id)
      `,
        { count: "exact" }
      );

    // Apply filters
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,ref_no.ilike.%${search}%,color.ilike.%${search}%`
      );
    }

    if (brandId) {
      query = query.eq("brand_id", parseInt(brandId));
    }

    if (gender) {
      query = query.eq("gender", gender);
    }

    if (color) {
      query = query.eq("color", color);
    }

    // Add category filter
    const categoryId = searchParams.get("categoryId") || "";
    if (categoryId) {
      query = query.eq("category_id", parseInt(categoryId));
    }

    const { data: products, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch products", details: error.message },
        { status: 500 }
      );
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json(
      {
        success: true,
        products: products || [],
        pagination: {
          page,
          limit,
          total: count,
          totalPages,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}