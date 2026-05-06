// app/api/admin/categories/route.ts
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

    // Fetch all categories
    const { data: categories, error } = await supabase
      .from("category")
      .select("id, name, parent_id")
      .order("name");

    if (error) {
      console.error("Category fetch error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Organize into parent and subcategories
    const parentCategories = categories?.filter(c => !c.parent_id) || [];
    const subCategories = categories?.filter(c => c.parent_id) || [];

    // Create structure: parents with their children
    const categoryTree = parentCategories.map(parent => ({
      ...parent,
      subcategories: subCategories.filter(sub => sub.parent_id === parent.id)
    }));

    return NextResponse.json(
      {
        success: true,
        parentCategories,
        subCategories,
        categoryTree,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
