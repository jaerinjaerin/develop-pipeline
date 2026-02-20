import Image from "next/image";
import SectionHeader from "@/components/ui/SectionHeader";
import {
  sectionLabel,
  sectionTitle,
  sectionHighlight,
  sectionDescription,
  galleryItems,
} from "@/data/gallery";

export default function Gallery() {
  return (
    <section id="gallery" className="bg-white px-8 py-24">
      <div className="mx-auto max-w-[1200px]">
        <SectionHeader
          label={sectionLabel}
          title={sectionTitle}
          highlight={sectionHighlight}
          description={sectionDescription}
        />

        <div className="grid auto-rows-[200px] grid-cols-[repeat(12,1fr)] gap-3 max-md:auto-rows-[180px] max-md:grid-cols-2">
          {galleryItems.map((item, idx) => (
            <div
              key={idx}
              className={`${item.className} group relative overflow-hidden rounded-2xl`}
            >
              <Image
                src={item.image}
                alt={`강남 갤러리 ${idx + 1}`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 768px) 50vw, 40vw"
              />

              {/* Dark overlay on hover */}
              <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/20" />

              {/* Video play button */}
              {item.isVideo && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/80 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <svg
                      viewBox="0 0 24 24"
                      className="ml-1 h-6 w-6 fill-white"
                    >
                      <polygon points="5,3 19,12 5,21" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
