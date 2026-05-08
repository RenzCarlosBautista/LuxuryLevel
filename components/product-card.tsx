import Image from "next/image";
import Link from "next/link";

export interface ProductCardProps {
  imgSrc: string;
  hoverImgSrc: string | null;
  productName: string;
  // Binago natin ito sa string | number para tanggapin ang formatted USD price
  price?: number | string | null; 
  salePrice?: number | string | null;
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

  // Markup/Discount calculation - gagana lang ito kung number ang ipinasa
  // Sa bagong setup natin, ang 'price' ay string na kaya i-disable muna natin ang badge logic 
  // o i-parse kung kailangan. Sa ngayon, simplehan natin ang display.
  const discountPercent = 0; 

  return (
    <Link href={href} className="block ">
      <div
        className={`${className} h-[300px] md:h-[400px] w-full overflow-hidden group transition duration-300 flex flex-col  border-transparent relative`}
      >
        {/* Discount Badge */}
        {showDiscountBadge && (
          <div className="absolute top-3 right-3 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold z-10">
            SALE
          </div>
        )}

        {/* Image container */}
        <div className="relative h-2/3 w-full">
          <div className="absolute inset-0">
            <Image
              src={imgSrc}
              alt={productName}
              fill
              sizes="400px"
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
                sizes="400px"
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
                {/* TINANGGAL ANG 'AED'. 
                   Dahil ang 'displayPrice' ay formatted na sa Wrapper ($4,196.18),
                   idi-display na lang natin ito nang direkta.
                */}
                {typeof displayPrice === 'number' 
                  ? `AED ${displayPrice.toLocaleString('en-US')}` 
                  : displayPrice}
              </p>
              
              {showDiscountBadge && price && (
                <p className="text-xs text-gray-400 line-through">
                  {typeof price === 'number' ? `AED ${price.toLocaleString()}` : price}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}