import {
  FaYoutube,
  FaInstagram,
  FaTiktok,
  FaTwitter,
  FaFacebookF,
  FaPinterestP,
  FaVimeoV,
} from "react-icons/fa6";
import { SiDailymotion } from "react-icons/si";

const platforms = [
  { label: "YouTube", Icon: FaYoutube },
  { label: "Instagram", Icon: FaInstagram },
  { label: "TikTok", Icon: FaTiktok },
  { label: "X (Twitter)", Icon: FaTwitter },
  { label: "Facebook", Icon: FaFacebookF },
  { label: "Pinterest", Icon: FaPinterestP },
  { label: "Vimeo", Icon: FaVimeoV },
  { label: "Dailymotion", Icon: SiDailymotion },
];

export default function Platforms() {
  return (
    <section
      id="platforms"
      className="bg-[#0f0f0f] flex flex-col items-center gap-6 pt-0 pb-20 px-4"
    >
      <p className="text-[11px] font-medium text-[#555555] tracking-[0.12em] uppercase text-center">
        WORKS WITH YOUR FAVORITE PLATFORMS
      </p>

      <div className="flex flex-wrap justify-center gap-3 w-full max-w-[720px]">
        {platforms.map(({ label, Icon }) => (
          <div
            key={label}
            className="group flex items-center gap-2 rounded-full border border-[#2a2a2a] bg-[#1c1c1c] px-4 py-2 text-[13px] font-medium text-[#888888] cursor-default transition-colors duration-200 hover:border-[#c8f13540] hover:bg-[#222222] hover:text-[#f0f0f0]"
          >
            <Icon size={14} className="text-inherit" aria-hidden="true" />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
