import { Download, Link as LinkIcon, Settings2 } from "lucide-react";

const steps = [
  {
    title: "Paste the link",
    description:
      "Copy the URL of any video or reel from any supported platform and paste it into the Cliprr input.",
    Icon: LinkIcon,
  },
  {
    title: "Choose your format",
    description:
      "Select your preferred quality and format — MP4, MP3, 1080p, 720p and more depending on the source.",
    Icon: Settings2,
  },
  {
    title: "Download instantly",
    description:
      "Hit download and your file starts immediately. No signup, no waiting, no watermarks.",
    Icon: Download,
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-[#0f0f0f] pt-20 pb-20">
      <div className="max-w-[1100px] mx-auto w-full px-6 flex flex-col items-center gap-12">
        <div className="text-center">
          <p className="text-[11px] font-medium text-[#555555] tracking-[0.12em] uppercase mb-3">
            HOW IT WORKS
          </p>
          <h2 className="text-[40px] font-bold text-[#f0f0f0] tracking-[-0.03em] leading-[1.1]">
            Three steps. That's it.
          </h2>
        </div>

        <div className="relative w-full">
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map(({ title, description, Icon }, index) => (
              <div
                key={title}
                className="flex flex-col gap-5 bg-[#161616] border border-[#2a2a2a] rounded-2xl p-8 transition-colors duration-200 hover:border-[#c8f13530]"
              >
                <div className="w-9 h-9 rounded-[10px] bg-[#c8f13515] border border-[#c8f13530] flex items-center justify-center">
                  <span className="text-[13px] font-bold text-[#c8f135]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <Icon size={22} className="text-[#888888]" aria-hidden="true" />

                <div className="space-y-2">
                  <h3 className="text-[18px] font-bold text-[#f0f0f0] tracking-[-0.02em]">
                    {title}
                  </h3>
                  <p className="text-[14px] text-[#888888] leading-[1.6]">{description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block absolute top-1/2 -translate-y-1/2 -mt-[60px] left-1/3 -translate-x-1/2 w-6 border-t border-dashed border-[#2a2a2a]" aria-hidden="true" />
          <div className="hidden md:block absolute top-1/2 -translate-y-1/2 -mt-[60px] left-2/3 -translate-x-1/2 w-6 border-t border-dashed border-[#2a2a2a]" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
