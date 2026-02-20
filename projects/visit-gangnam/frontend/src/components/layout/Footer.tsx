import {
  footerBrand,
  footerDescription,
  socialLinks,
  footerColumns,
  copyright,
  organization,
} from "@/data/footer";

export default function Footer() {
  return (
    <footer className="bg-[#0a0a0a] px-8 pt-20 pb-10 text-gray-400">
      <div className="mx-auto max-w-[1200px]">
        {/* Top */}
        <div className="flex flex-col justify-between gap-12 md:flex-row">
          <div>
            <div className="mb-4 font-display text-2xl font-extrabold tracking-wider text-white">
              {footerBrand}
            </div>
            <p className="mb-6 max-w-xs text-sm leading-relaxed">
              {footerDescription}
            </p>
            <div className="flex gap-3">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-xs font-bold text-white/60 transition-colors hover:border-primary hover:text-primary"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:gap-16">
            {footerColumns.map((col) => (
              <div key={col.title}>
                <h4 className="mb-4 font-display text-sm font-semibold tracking-wider text-white">
                  {col.title}
                </h4>
                <div className="flex flex-col gap-3">
                  {col.links.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      className="text-sm transition-colors hover:text-white"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs text-white/30 sm:flex-row">
          <span>{copyright}</span>
          <span>{organization}</span>
        </div>
      </div>
    </footer>
  );
}
