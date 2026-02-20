import Link from "next/link";

const HERO_BG =
  "https://images.unsplash.com/photo-1546636889-ba9fdd63583e?w=1920&q=80";

const STATS = [
  { num: "150+", label: "관광 명소" },
  { num: "50+", label: "추천 코스" },
  { num: "365", label: "날마다 축제" },
];

export default function HeroSection() {
  return (
    <section className="relative h-screen min-h-[800px] flex items-end pb-[100px] pl-20 overflow-hidden max-lg:pl-10 max-lg:pb-20 max-md:pl-6 max-md:pb-15">
      {/* Background */}
      <div
        className="absolute inset-0 bg-center bg-cover"
        style={{ backgroundImage: `url('${HERO_BG}')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/60 to-black/90" />
      </div>

      {/* Content */}
      <div className="relative z-[2] max-w-[700px]">
        <div className="font-montserrat text-sm font-bold text-[var(--secondary)] tracking-[4px] uppercase mb-5">
          Seoul&rsquo;s Hottest District
        </div>
        <h1 className="font-montserrat text-[80px] font-black text-white leading-[0.95] mb-6 tracking-[-3px] max-lg:text-[56px] max-md:text-[40px]">
          DISCOVER
          <br />
          <em className="not-italic text-gradient-primary">GANGNAM</em>
        </h1>
        <p className="text-lg text-white/70 font-light leading-[1.7] mb-10 max-w-[500px] max-md:text-[15px]">
          K-컬처의 심장부, 강남. 트렌디한 맛집부터 화려한 나이트라이프까지
          당신만의 강남을 발견하세요.
        </p>
        <div className="flex gap-4">
          <Link
            href="#theme"
            className="px-10 py-[18px] bg-[var(--primary)] text-white rounded-[50px] text-base font-bold no-underline transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(193,42,89,0.4)]"
          >
            코스 추천받기
          </Link>
          <Link
            href="#gallery"
            className="px-10 py-[18px] bg-transparent border-2 border-white/30 text-white rounded-[50px] text-base font-semibold no-underline transition-all duration-300 hover:border-white hover:bg-white/10"
          >
            영상 보기
          </Link>
        </div>
      </div>

      {/* Side Stats */}
      <div className="absolute right-20 bottom-[100px] z-[2] flex flex-col gap-3 max-lg:hidden">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="glass rounded-[var(--radius)] p-5 px-7 text-center min-w-[160px]"
          >
            <div className="font-montserrat text-[32px] font-extrabold text-[var(--secondary)]">
              {stat.num}
            </div>
            <div className="text-[13px] text-white/60 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
