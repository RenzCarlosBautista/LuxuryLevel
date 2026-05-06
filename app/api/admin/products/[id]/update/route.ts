// app/api/admin/products/[id]/update/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyAdminFromRequest } from "@/lib/admin-auth";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2 as r2Client } from "@/lib/r2";

const BUCKET_NAME = process.env.R2_BUCKET_NAME || "";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin
    const admin = await verifyAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const productId = parseInt(resolvedParams.id);
    
    // Get existing product
    const { data: existingProduct, error: fetchError } = await supabase
      .from("product")
      .select("*")
      .eq("id", productId)
      .single();

    if (fetchError || !existingProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    const contentType = req.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      // Handle JSON body from modal
      const body = await req.json();
      
      if (body.name) updateData.name = body.name;
      if (body.ref_no) updateData.ref_no = body.ref_no;
      if (body.gender) updateData.gender = body.gender;
      if (body.color) updateData.color = body.color;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.brand_id) updateData.brand_id = body.brand_id;
      if (body.category_id !== undefined) updateData.category_id = body.category_id;
      if (body.price) updateData.price = body.price;
      if (body.sale_price !== undefined) updateData.sale_price = body.sale_price;
      if (body.sale_start_date) updateData.sale_start_date = body.sale_start_date;
      if (body.sale_end_date) updateData.sale_end_date = body.sale_end_date;
    } else {
      // Handle FormData from product form
      const formData = await req.formData();
      
      if (formData.get("name")) updateData.name = formData.get("name");
      if (formData.get("refNo")) updateData.ref_no = formData.get("refNo");
      if (formData.get("gender")) updateData.gender = formData.get("gender");
      if (formData.get("color")) updateData.color = formData.get("color");
      if (formData.get("description"))
        updateData.description = formData.get("description");
      if (formData.get("brandId"))
        updateData.brand_id = parseInt(formData.get("brandId") as string);
      if (formData.get("categoryId"))
        updateData.category_id = parseInt(formData.get("categoryId") as string);
      if (formData.get("price"))
        updateData.price = parseFloat(formData.get("price") as string);
      if (formData.get("salePrice"))
        updateData.sale_price = parseFloat(formData.get("salePrice") as string);
      if (formData.get("saleStartDate"))
        updateData.sale_start_date = formData.get("saleStartDate");
      if (formData.get("saleEndDate"))
        updateData.sale_end_date = formData.get("saleEndDate");

      // Handle image updates
      const images = [
        formData.get("image_1") as File | null,
        formData.get("image_2") as File | null,
        formData.get("image_3") as File | null,
      ];

      const imageKeys = [
        existingProduct.image_1,
        existingProduct.image_2,
        existingProduct.image_3,
      ];

      for (let i = 0; i < images.length; i++) {
        if (images[i]) {
          try {
            const buffer = await images[i]!.arrayBuffer();
            const key = `products/${Date.now()}-${i}-${images[i]!.name}`;

            await r2Client.send(
              new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: key,
                Body: Buffer.from(buffer),
                ContentType: images[i]!.type,
              })
            );
            imageKeys[i] = key;
          } catch (error) {
            console.error(`Failed to upload image ${i + 1}:`, error);
          }
        }
      }

      updateData.image_1 = imageKeys[0];
      updateData.image_2 = imageKeys[1];
      updateData.image_3 = imageKeys[2];
    }
    updateData.updated_at = new Date().toISOString();

    // Update product
    const { data: updatedProduct, error: updateError } = await supabase
      .from("product")
      .update(updateData)
      .eq("id", productId)
      .select();

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update product" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, product: updatedProduct[0] },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}