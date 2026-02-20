import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--primary-dark)]">
      <div className="text-center px-5">
        <div className="font-montserrat text-[120px] font-black text-white/10 leading-none mb-4 max-md:text-[80px]">
          404
        </div>
        <h1 className="text-3xl font-bold text-white mb-4 max-md:text-2xl">
          페이지를 찾을 수 없습니다
        </h1>
        <p className="text-white/50 mb-8 max-w-md mx-auto">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
        </p>
        <Link
          href="/"
          className="inline-block px-10 py-4 bg-[var(--primary)] text-white rounded-[50px] text-base font-bold no-underline transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(193,42,89,0.4)]"
        >
          메인으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
