import Image from "next/image";

interface GalleryItemData {
  id: number;
  type: string;
  imageUrl: string;
  videoUrl: string | null;
  gridClass: string;
  order: number;
}

interface GallerySectionProps {
  items: GalleryItemData[];
}

export default function GallerySection({ items }: GallerySectionProps) {
  return (
    <section
      id="gallery"
      className="py-[120px] px-20 bg-white max-lg:py-20 max-lg:px-10 max-md:py-15 max-md:px-5"
    >
      <div className="mb-16">
        <div className="font-montserrat text-[13px] font-bold text-[var(--secondary)] tracking-[3px] uppercase mb-4">
          See Gangnam
        </div>
        <h2 className="text-5xl font-extrabold leading-[1.15] mb-4 max-md:text-[32px]">
          강남을 <span className="text-[var(--primary)]">보다</span>
        </h2>
        <p className="text-[17px] text-[var(--text-sub)] max-w-[500px] leading-[1.7]">
          영상과 사진으로 만나는 강남의 다채로운 순간들
        </p>
      </div>

      <div className="grid grid-cols-12 auto-rows-[200px] gap-3 max-w-[1400px] mx-auto max-md:grid-cols-2 max-md:auto-rows-[180px]">
        {items.map((item) => (
          <div
            key={item.id}
            className={`rounded-xl overflow-hidden relative cursor-pointer group ${getGridClass(item.gridClass)}`}
          >
            <Image
              src={item.imageUrl}
              alt={`강남 갤러리 ${item.order}`}
              fill
              className="object-cover transition-transform duration-600 group-hover:scale-[1.08]"
            />
            {item.type === "video" && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-[rgba(193,42,89,0.8)] backdrop-blur-[10px] flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <svg
                  viewBox="0 0 24 24"
                  className="w-6 h-6 fill-white ml-[3px]"
                >
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function getGridClass(gridClass: string): string {
  switch (gridClass) {
    case "gal-1":
      return "col-span-5 row-span-2 max-md:col-span-2";
    case "gal-2":
      return "col-span-4 row-span-1 max-md:col-span-1";
    case "gal-3":
      return "col-span-3 row-span-1 max-md:col-span-1";
    case "gal-4":
      return "col-span-3 row-span-1 max-md:col-span-1";
    case "gal-5":
      return "col-span-4 row-span-1 max-md:col-span-1";
    default:
      return "col-span-4 row-span-1";
  }
}
