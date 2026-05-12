"use client";

import { useState, useEffect } from "react";
import { Brand } from "@/lib/types";
import { Poppins } from "next/font/google";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

// Load Poppins font with a CSS variable
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Setup Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function BagsMenu({
  toggleMobileNav,
  brands: initialBrands, // Accept pre-fetched brands to restrict to category
}: {
  toggleMobileNav?: () => void;
  brands?: Brand[];
}) {
  const router = useRouter();

  // Use provided brands if present; otherwise fetch all brands
  const [brandsList, setBrandsList] = useState<Brand[]>(initialBrands || []);

  useEffect(() => {
    if (initialBrands && initialBrands.length > 0) {
      setBrandsList(initialBrands);
      return;
    }

    const fetchBrands = async () => {
      const { data, error } = await supabase
        .from("brand")
        .select("*")
        .order("name", { ascending: true });

      if (data && !error) {
        setBrandsList(data);
      }
    };

    fetchBrands();
  }, [initialBrands]);

  const redirect = (brand: Brand) => {
    if (toggleMobileNav) {
      toggleMobileNav();
    }
    // Set banner title through local storage
    localStorage.setItem("banner-title", brand.name);
    router.push(`/brands/${brand.id}`); // Siguraduhing tama ang ruta mo, minsan ay /products?brand=...
  };

  return (
    <div
      className={`grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-6 gap-4 ${poppins.className} p-4 bg-white`}
    >
      {brandsList.map((brand) => {
        if (!brand.name) return null;

        return (
          <button
            key={brand.id}
            onClick={() => redirect(brand)}
            className={`font-normal pr-2 lg:text-[12px] xl:text-[14px] text-start 
               lg:border-r-[1px] border-gray-300 hover:font-semibold uppercase`}
          >
            {brand.name}
          </button>
        );
      })}
    </div>
  );
}