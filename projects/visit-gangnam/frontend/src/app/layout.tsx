import type { Metadata } from "next";
import { Montserrat, Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
  weight: ["300", "400", "600", "700", "800", "900"],
});

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  variable: "--font-noto-sans-kr",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "VISIT GANGNAM - 강남 관광 가이드",
  description:
    "K-컬처의 심장부, 강남. 트렌디한 맛집부터 화려한 나이트라이프까지 당신만의 강남을 발견하세요.",
  openGraph: {
    title: "VISIT GANGNAM",
    description: "서울 강남 여행 가이드",
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${montserrat.variable} ${notoSansKR.variable}`}
    >
      <body className="antialiased">{children}</body>
    </html>
  );
}
