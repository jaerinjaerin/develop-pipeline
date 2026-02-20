"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const NAV_ITEMS = [
  { label: "강남 소개", href: "#about" },
  { label: "볼거리", href: "#now" },
  { label: "먹거리", href: "#hot" },
  { label: "즐길거리", href: "#hot" },
  { label: "여행코스", href: "#theme" },
  { label: "축제/행사", href: "#festival" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[1000] flex items-center justify-between h-20 px-12 transition-all duration-400 ${
        scrolled
          ? "bg-black/85 backdrop-blur-[20px]"
          : "bg-transparent"
      }`}
    >
      <Link
        href="/"
        className="font-montserrat font-black text-xl text-white tracking-[2px] no-underline"
      >
        VISIT GANGNAM
      </Link>

      <nav className="hidden lg:flex">
        <ul className="flex gap-9 list-none">
          {NAV_ITEMS.map((item) => (
            <li key={item.label}>
              <a
                href={item.href}
                className="text-sm font-medium text-white/75 no-underline tracking-[0.5px] transition-colors duration-300 hover:text-white"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex items-center gap-5">
        <button className="font-montserrat text-xs font-bold text-white bg-transparent border border-white/30 px-[18px] py-2 rounded-[30px] cursor-pointer tracking-[1px] transition-all duration-300 hover:bg-[var(--primary)] hover:border-[var(--primary)]">
          ENG
        </button>
      </div>
    </header>
  );
}
