import Image from "next/image";

interface HotSpot {
  id: number;
  name: string;
  description: string;
  imageUrl: string | null;
  category: { name: string };
}

interface HotPlacesSectionProps {
  spots: HotSpot[];
}

export default function HotPlacesSection({ spots }: HotPlacesSectionProps) {
  return (
    <div id="hot" className="flex w-full overflow-hidden max-md:flex-col">
      {spots.map((spot, i) => (
        <div
          key={spot.id}
          className="group relative flex-1 min-h-[600px] overflow-hidden cursor-pointer transition-[flex] duration-600 ease-in-out hover:flex-[2] max-lg:min-h-[400px] max-md:min-h-[300px] max-md:hover:flex-1"
        >
          {spot.imageUrl && (
            <Image
              src={spot.imageUrl}
              alt={spot.name}
              fill
              className="object-cover transition-transform duration-600 group-hover:scale-105"
            />
          )}

          {/* Number */}
          <div className="absolute top-8 left-10 font-montserrat text-[64px] font-black text-white/10">
            {String(i + 1).padStart(2, "0")}
          </div>

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 flex flex-col justify-end p-10">
            <div className="text-xs font-bold text-[var(--secondary)] tracking-[2px] uppercase mb-2">
              {spot.category.name}
            </div>
            <div className="text-2xl font-extrabold text-white mb-1">
              {spot.name}
            </div>
            <div className="text-sm text-white/60">{spot.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
