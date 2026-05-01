import { useState } from 'react';
import { FESTIVAL_LOGO_URL } from '@/constants/event';

type FestivalLogoProps = {
  className?: string;
  alt?: string;
};

export default function FestivalLogo({ className = 'h-14 w-auto max-w-[200px]', alt = 'Festival de la Niñez 2026' }: FestivalLogoProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl bg-[#EBB205]/15 border-2 border-dashed border-[#EBB205]/40 ${className}`}
        aria-hidden
      >
        <span className="text-4xl" title={alt}>
          🚀
        </span>
      </div>
    );
  }

  return (
    <img
      src={FESTIVAL_LOGO_URL}
      alt={alt}
      className={`object-contain ${className}`}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
