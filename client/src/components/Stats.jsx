import { useEffect, useRef, useState } from "react";

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

const stats = [
  {
    label: "Downloads Served",
    target: 10_000_000,
    formatter: (value) => `${Math.round(value / 1_000_000)}M+`,
  },
  {
    label: "Supported Sites",
    target: 1_000,
    formatter: (value) => `${Math.round(value)}+`,
  },
  {
    label: "Uptime",
    target: 99.9,
    formatter: (value) => `${value.toFixed(1)}%`,
  },
  {
    label: "Signups Required",
    target: 0,
    formatter: () => "0",
    animate: false,
  },
];

export default function Stats() {
  const [values, setValues] = useState(() =>
    stats.map((stat) => (stat.animate === false ? stat.target : 0))
  );
  const frameRef = useRef(null);

  useEffect(() => {
    const duration = 1800;
    const start = performance.now();

    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = easeOutCubic(progress);

      setValues(
        stats.map((stat) => {
          if (stat.animate === false) return stat.target;
          return stat.target * eased;
        })
      );

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <section className="w-full bg-[#161616] border-y border-[#2a2a2a] py-16">
      <div className="max-w-[1100px] mx-auto w-full px-6 grid gap-6 grid-cols-2 md:grid-cols-4">
        {stats.map((stat, index) => {
          const display = stat.formatter(values[index]);
          return (
            <div
              key={stat.label}
              className="flex flex-col items-center justify-center gap-2 text-center"
            >
              <div className="text-[48px] font-bold text-[#c8f135] leading-none tracking-[-0.03em]">
                {display}
              </div>
              <div className="text-[13px] font-medium text-[#555555] uppercase tracking-[0.1em]">
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
