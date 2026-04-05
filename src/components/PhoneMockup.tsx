type PhoneMockupProps = {
  imageSrc?: string;
  alt?: string;
  className?: string;
};

export default function PhoneMockup({
  imageSrc = '/visuel.png',
  alt = 'Capture de l’application Cash Pilot',
  className = '',
}: PhoneMockupProps) {
  return (
    <div className={`relative mx-auto w-full max-w-[350px] ${className}`}>
      <div className="absolute inset-x-8 top-8 h-24 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="absolute inset-x-12 bottom-4 h-20 rounded-full bg-slate-950/30 blur-2xl" />

      <div className="relative rounded-[3.2rem] border border-cyan-200/10 bg-[linear-gradient(180deg,#050816_0%,#0a1021_45%,#070b16_100%)] p-[10px] shadow-[0_40px_120px_rgba(2,8,23,0.55),0_18px_50px_rgba(6,182,212,0.14),inset_0_1px_0_rgba(255,255,255,0.05)]">
        <div className="pointer-events-none absolute inset-[6px] rounded-[2.9rem] border border-white/5" />

        <div className="relative overflow-hidden rounded-[2.7rem] bg-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-16 bg-[linear-gradient(180deg,rgba(2,6,23,0.35)_0%,rgba(2,6,23,0)_100%)]" />
          <div className="absolute left-1/2 top-3 z-30 h-5 w-[120px] -translate-x-1/2 rounded-full bg-black shadow-[inset_0_-1px_0_rgba(255,255,255,0.05),0_8px_18px_rgba(0,0,0,0.45)]" />

          <img
            src={imageSrc}
            alt={alt}
            className="block aspect-[9/19.5] w-full object-cover object-top"
          />
        </div>
      </div>
    </div>
  );
}
