type PhoneMockupProps = {
  imageSrc?: string;
  alt?: string;
  className?: string;
};

export default function PhoneMockup({
  imageSrc = '/visuel.png',
  alt = 'Capture de l’application Cap Revenu',
  className = '',
}: PhoneMockupProps) {
  return (
    <div className={`relative mx-auto w-full max-w-[290px] sm:max-w-[350px] ${className}`}>
      <div className="absolute inset-x-8 top-6 h-20 rounded-full bg-cyan-400/20 blur-3xl sm:top-8 sm:h-24" />
      <div className="absolute inset-x-12 bottom-3 h-16 rounded-full bg-slate-950/30 blur-2xl sm:bottom-4 sm:h-20" />

      <div className="relative rounded-[2.9rem] border border-cyan-200/10 bg-[linear-gradient(180deg,#050816_0%,#0a1021_45%,#070b16_100%)] p-[8px] shadow-[0_32px_90px_rgba(2,8,23,0.52),0_14px_40px_rgba(6,182,212,0.14),inset_0_1px_0_rgba(255,255,255,0.05)] sm:rounded-[3.2rem] sm:p-[10px] sm:shadow-[0_40px_120px_rgba(2,8,23,0.55),0_18px_50px_rgba(6,182,212,0.14),inset_0_1px_0_rgba(255,255,255,0.05)]">
        <div className="pointer-events-none absolute inset-[5px] rounded-[2.65rem] border border-white/5 sm:inset-[6px] sm:rounded-[2.9rem]" />

        <div className="relative overflow-hidden rounded-[2.45rem] bg-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] sm:rounded-[2.7rem]">
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-14 bg-[linear-gradient(180deg,rgba(2,6,23,0.35)_0%,rgba(2,6,23,0)_100%)] sm:h-16" />
          <div className="absolute left-1/2 top-2.5 z-30 h-4.5 w-[104px] -translate-x-1/2 rounded-full bg-black shadow-[inset_0_-1px_0_rgba(255,255,255,0.05),0_8px_18px_rgba(0,0,0,0.45)] sm:top-3 sm:h-5 sm:w-[120px]" />

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
