import { Link } from "react-router-dom";

const navLinkClasses =
  "block text-[14px] text-[#888888] mb-2 transition-colors duration-200 hover:text-[#f0f0f0]";

export default function Footer() {
  return (
    <footer className="w-full bg-[#0f0f0f] border-t border-[#2a2a2a] pt-16 pb-10">
      <div className="max-w-[1100px] mx-auto w-full px-6 flex flex-col gap-12">
        <div className="flex flex-col md:flex-row justify-between items-start gap-10 md:gap-0">
          <div>
            <Link to="/" className="inline-flex items-center gap-1" aria-label="Cliprr home">
              <span className="text-[22px] font-bold text-[#f0f0f0]">Clip</span>
              <span className="text-[22px] font-bold text-[#c8f135]">rr</span>
            </Link>
            <p className="text-[14px] text-[#555555] leading-[1.6] mt-3 max-w-[260px]">
              Download anything. From anywhere. Free.
            </p>
          </div>

          <div className="flex gap-8 md:gap-16">
            <div>
              <p className="text-[11px] font-medium text-[#555555] tracking-[0.1em] uppercase mb-4">
                PRODUCT
              </p>
              <Link to="/" className={navLinkClasses}>
                Home
              </Link>
              <Link to="/#downloader" className={navLinkClasses}>
                How it Works
              </Link>
              <Link to="/#platforms" className={navLinkClasses}>
                Supported Sites
              </Link>
            </div>

            <div>
              <p className="text-[11px] font-medium text-[#555555] tracking-[0.1em] uppercase mb-4">
                LEGAL
              </p>
              <Link to="/privacy" className={navLinkClasses}>
                Privacy Policy
              </Link>
              <Link to="/terms" className={navLinkClasses}>
                Terms of Service
              </Link>
            </div>

            <div>
              <p className="text-[11px] font-medium text-[#555555] tracking-[0.1em] uppercase mb-4">
                CONNECT
              </p>
              <a href="#" target="_blank" rel="noreferrer" className={navLinkClasses}>
                Twitter / X
              </a>
              <a href="#" target="_blank" rel="noreferrer" className={navLinkClasses}>
                Instagram
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-[#2a2a2a]" />

        <div className="flex flex-col md:flex-row items-center md:items-center justify-between gap-3 text-center md:text-left">
          <span className="text-[13px] text-[#555555]">© 2025 Cliprr. All rights reserved.</span>
          <span className="text-[13px] text-[#555555]">
            Made for the <span className="text-[#c8f135]">internet</span>.
          </span>
        </div>
      </div>
    </footer>
  );
}
