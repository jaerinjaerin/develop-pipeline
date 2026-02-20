import Link from "next/link";

const EXPLORE_LINKS = [
  { label: "볼거리", href: "#" },
  { label: "먹거리", href: "#" },
  { label: "즐길거리", href: "#" },
  { label: "여행코스", href: "#" },
];

const EVENT_LINKS = [
  { label: "축제/행사", href: "#" },
  { label: "강남페스티벌", href: "#" },
  { label: "공연/전시", href: "#" },
];

const INFO_LINKS = [
  { label: "개인정보처리방침", href: "#" },
  { label: "이용약관", href: "#" },
  { label: "찾아오시는 길", href: "#" },
];

const SOCIAL_LINKS = [
  { label: "IG", href: "#" },
  { label: "FB", href: "#" },
  { label: "YT", href: "#" },
  { label: "TW", href: "#" },
];

export default function Footer() {
  return (
    <footer className="bg-black text-white/50 pt-20 pb-10 px-20 max-md:px-5 max-md:pt-15 max-md:pb-[30px]">
      {/* Top */}
      <div className="flex justify-between pb-12 border-b border-white/[0.08] mb-8 max-md:flex-col max-md:gap-10">
        <div>
          <div className="font-montserrat font-black text-[28px] text-white tracking-[2px] mb-4">
            VISIT GANGNAM
          </div>
          <p className="text-sm max-w-[320px] leading-[1.7]">
            서울 강남구 관광진흥과가 운영하는 공식 관광 플랫폼
          </p>
          <div className="flex gap-3 mt-6">
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="w-11 h-11 rounded-full bg-white/[0.06] flex items-center justify-center text-white/50 no-underline text-sm transition-all duration-300 hover:bg-[var(--primary)] hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <div className="flex gap-14 max-md:flex-wrap max-md:gap-8">
          <FooterColumn title="EXPLORE" links={EXPLORE_LINKS} />
          <FooterColumn title="EVENTS" links={EVENT_LINKS} />
          <FooterColumn title="INFO" links={INFO_LINKS} />
        </div>
      </div>

      {/* Bottom */}
      <div className="flex justify-between text-xs text-white/25">
        <span>&copy; 2026 Visit Gangnam. All rights reserved.</span>
        <span>강남구청 관광진흥과</span>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="text-[13px] font-bold text-white mb-[18px] tracking-[1px]">
        {title}
      </h4>
      {links.map((link) => (
        <Link
          key={link.label}
          href={link.href}
          className="block text-[13px] text-white/40 no-underline mb-3 transition-colors duration-300 hover:text-[var(--secondary)]"
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}
