import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "Is Cliprr free to use?",
    answer:
      "Yes, Cliprr is completely free. No subscription, no hidden fees, no signup required. Just paste your link and download.",
  },
  {
    question: "Which platforms does Cliprr support?",
    answer:
      "Cliprr supports over 1000 platforms including YouTube, Instagram, TikTok, X (Twitter), Facebook, Pinterest, Vimeo, Dailymotion and many more.",
  },
  {
    question: "What formats and qualities can I download in?",
    answer:
      "Depending on the source platform, you can download in MP4, MP3, WEBM and more. Quality options range from 360p up to 1080p or original quality where available.",
  },
  {
    question: "Do I need to create an account?",
    answer:
      "No account needed. Cliprr works instantly without any signup or login. Your privacy is fully respected.",
  },
  {
    question: "Is it safe to use Cliprr?",
    answer:
      "Yes. Cliprr does not store your links, does not track your downloads, and does not install anything on your device. Your data stays yours.",
  },
  {
    question: "Why is my download failing?",
    answer:
      "Some platforms restrict certain content or update their systems frequently. If a download fails, try again in a few minutes. If the issue persists, the content may be private or geo-restricted.",
  },
];

export default function FAQ() {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggle = (index) => {
    setActiveIndex((current) => (current === index ? null : index));
  };

  return (
    <section className="w-full bg-[#0f0f0f] pt-20 pb-20">
      <div className="max-w-[720px] mx-auto w-full px-6 flex flex-col gap-12">
        <div className="text-center">
          <p className="text-[11px] font-medium text-[#555555] tracking-[0.12em] uppercase mb-3">
            FAQ
          </p>
          <h2 className="text-[40px] font-bold text-[#f0f0f0] tracking-[-0.03em] leading-[1.1]">
            Questions we get a lot.
          </h2>
        </div>

        <div className="flex flex-col">
          {faqs.map((faq, index) => {
            const isOpen = index === activeIndex;
            return (
              <div
                key={faq.question}
                className={`${index === 0 ? "border-t" : ""} border-b border-[#2a2a2a]`}
              >
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  className="w-full flex items-center justify-between py-5 text-left cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span
                    className={`text-[16px] font-semibold leading-[1.4] transition-colors duration-200 ${
                      isOpen ? "text-[#c8f135]" : "text-[#f0f0f0] hover:text-[#c8f135]"
                    }`}
                  >
                    {faq.question}
                  </span>
                  <ChevronDown
                    size={18}
                    className={`transition-all duration-200 ${
                      isOpen ? "rotate-180 text-[#c8f135]" : "text-[#555555]"
                    }`}
                    aria-hidden="true"
                  />
                </button>

                <div
                  className={`overflow-hidden transition-[max-height] duration-300 ease-in-out transition-opacity ${
                    isOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <p className="text-[14px] text-[#888888] leading-[1.7] pb-5">
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
