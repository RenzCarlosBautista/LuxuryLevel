// app/api/admin/products/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyAdminFromRequest } from "@/lib/admin-auth";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2 as r2Client } from "@/lib/r2";

const BUCKET_NAME = process.env.R2_BUCKET_NAME || "";

export async function POST(req: NextRequest) {
  try {
    // Verify admin
    const admin = await verifyAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();

    const name = formData.get("name") as string;
    const refNo = formData.get("refNo") as string;
    const gender = formData.get("gender") as string;
    const color = formData.get("color") as string;
    const description = formData.get("description") as string;
    const brandId = parseInt(formData.get("brandId") as string);
    const categoryId = formData.get("categoryId")
      ? parseInt(formData.get("categoryId") as string)
      : null;
    const price = parseFloat(formData.get("price") as string);

    // Get image files
    const images = [
      formData.get("image_1") as File | null,
      formData.get("image_2") as File | null,
      formData.get("image_3") as File | null,
    ];

    // Upload images to R2
    const imageKeys: (string | null)[] = [];
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
          imageKeys.push(key);
        } catch (error) {
          console.error(`Failed to upload image ${i + 1}:`, error);
          imageKeys.push(null);
        }
      } else {
        imageKeys.push(null);
      }
    }

    // Insert product into Supabase
    const { data: product, error } = await supabase
      .from("product")
      .insert([
        {
          name,
          ref_no: refNo,
          gender,
          color,
          description,
          brand_id: brandId,
          category_id: categoryId,
          price,
          image_1: imageKeys[0],
          image_2: imageKeys[1],
          image_3: imageKeys[2],
        },
      ])
      .select();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to create product" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, product: product[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
