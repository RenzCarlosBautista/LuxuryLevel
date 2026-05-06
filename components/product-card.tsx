import Image from "next/image";
import Link from "next/link";

export interface ProductCardProps {
  imgSrc: string;
  hoverImgSrc: string | null;
  productName: string;
  price?: number | null;
  salePrice?: number | null;
  href: string;
  className?: string;
}

export default function ProductCard({
  imgSrc,
  hoverImgSrc,
  productName,
  price,
  salePrice,
  href,
  className,
}: ProductCardProps) {
  // Determine which price to display
  const displayPrice = salePrice || price;
  const showDiscountBadge = salePrice && price ? true : false;
  const discountPercent = showDiscountBadge && price && salePrice
    ? Math.round(((price - salePrice) / price) * 100)
    : 0;

  return (
    <Link href={href} className="block ">
      <div
        className={`${className} h-[300px] md:h-[400px] w-full overflow-hidden group transition duration-300 flex flex-col  border-transparent relative`}
      >
        {/* Discount Badge */}
        {showDiscountBadge && (
          <div className="absolute top-3 right-3 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold z-10">
            -{discountPercent}%
          </div>
        )}

        {/* Image container */}
        <div className="relative h-2/3 w-full">
          {/* Stacked images */}
          <div className="absolute inset-0">
            <Image
              src={imgSrc}
              alt={productName}
              fill
              sizes="400"
              className={`object-cover  transition-opacity duration-300 ${
                !!hoverImgSrc ? "group-hover:opacity-0" : ""
              }`}
            />
          </div>
          {hoverImgSrc && (
            <div className="absolute inset-0">
              <Image
                src={hoverImgSrc}
                alt={`${productName} (Hover)`}
                fill
                sizes="400"
                className="object-contain transition-opacity duration-300 opacity-0 group-hover:opacity-100"
              />
            </div>
          )}
        </div>

        {/* Info section */}
        <div className="h-1/3 flex flex-col justify-center items-center  px-2">
          <p className="text-sm 2xl:text-base text-black w-full leading-tight text-center">
            {productName}
          </p>

          {displayPrice && (
            <div className="flex items-center gap-2 pt-2">
              <p className="font-semibold text-sm text-gray-900">
                AED {displayPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              {showDiscountBadge && price && (
                <p className="text-xs text-gray-400 line-through">
                  AED {price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
