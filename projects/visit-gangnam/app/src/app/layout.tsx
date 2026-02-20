import type { Metadata } from "next";
import { Montserrat, Noto_Sans_KR } from "next/font/google";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "800", "900"],
  display: "swap",
});

const notoSansKR = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "VISIT GANGNAM - 강남을 만나다",
  description:
    "K-컬처의 심장부, 강남. 트렌디한 맛집부터 화려한 나이트라이프까지 당신만의 강남을 발견하세요.",
  openGraph: {
    title: "VISIT GANGNAM - 강남을 만나다",
    description:
      "K-컬처의 심장부, 강남. 트렌디한 맛집부터 화려한 나이트라이프까지 당신만의 강남을 발견하세요.",
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
    <html lang="ko">
      <body
        className={`${montserrat.variable} ${notoSansKR.variable} antialiased`}
      >
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
