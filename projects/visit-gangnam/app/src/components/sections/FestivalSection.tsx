import Image from "next/image";
import Link from "next/link";

interface FestivalItem {
  id: number;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  startDate: Date;
  endDate: Date;
  venue: string | null;
  isFeatured: boolean;
}

interface FestivalSectionProps {
  featured: FestivalItem | null;
  festivals: FestivalItem[];
}

function getFestivalStatus(
  startDate: Date,
  endDate: Date
): { label: string; className: string } {
  const now = new Date();
  if (now >= startDate && now <= endDate) {
    return { label: "진행중", className: "bg-[var(--primary)] text-white" };
  }
  if (now < startDate) {
    return { label: "예정", className: "bg-[var(--secondary)] text-white" };
  }
  return { label: "종료", className: "bg-gray-500 text-white" };
}

function formatDate(date: Date) {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

export default function FestivalSection({
  featured,
  festivals,
}: FestivalSectionProps) {
  return (
    <div id="festival" className="bg-[var(--primary-dark)]">
      {/* Featured Hero */}
      {featured && (
        <div className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
          <div
            className="absolute inset-0 bg-center bg-cover"
            style={featured.imageUrl ? { backgroundImage: `url('${featured.imageUrl}')` } : undefined}
          >
            <div className="absolute inset-0 bg-[rgba(27,31,59,0.75)]" />
          </div>
          <div className="relative z-[2] text-center max-w-[700px] px-10">
            <div className="inline-block px-6 py-2 bg-[var(--primary)] text-white rounded-[30px] text-sm font-bold mb-6 tracking-[1px]">
              COMING SOON
            </div>
            <h2 className="font-montserrat text-[56px] font-black text-white mb-4 leading-[1.1] max-md:text-4xl">
              {featured.name.split(" ").map((word, i) =>
                i === 0 ? (
                  <span key={i}>
                    {word}
                    <br />
                  </span>
                ) : (
                  <span key={i}>{word} </span>
                )
              )}
            </h2>
            <div className="text-lg text-white/70 mb-8">
              {formatDate(new Date(featured.startDate))} -{" "}
              {formatDate(new Date(featured.endDate))}
              {featured.venue && ` | ${featured.venue}`}
            </div>
            <Link
              href="#"
              className="inline-block px-10 py-[18px] bg-[var(--primary)] text-white rounded-[50px] text-base font-bold no-underline transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(193,42,89,0.4)]"
            >
              자세히 보기
            </Link>
          </div>
        </div>
      )}

      {/* Festival Cards */}
      <div className="grid grid-cols-3 gap-6 max-w-[1200px] mx-auto p-20 max-lg:grid-cols-1 max-lg:p-10">
        {festivals
          .filter((f) => !f.isFeatured)
          .map((fest) => {
            const status = getFestivalStatus(
              new Date(fest.startDate),
              new Date(fest.endDate)
            );
            return (
              <div
                key={fest.id}
                className="glass-dark rounded-[var(--radius)] overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-[var(--secondary)]"
              >
                <div className="h-[200px] overflow-hidden">
                  {fest.imageUrl && (
                    <Image
                      src={fest.imageUrl}
                      alt={fest.name}
                      width={400}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="p-6">
                  <span
                    className={`inline-block px-3 py-1 rounded-[20px] text-xs font-bold mb-2.5 ${status.className}`}
                  >
                    {status.label}
                  </span>
                  <h3 className="text-lg font-bold text-white mb-2">
                    {fest.name}
                  </h3>
                  <div className="text-[13px] text-white/50">
                    {formatDate(new Date(fest.startDate))} -{" "}
                    {formatDate(new Date(fest.endDate))}
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
