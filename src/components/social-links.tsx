import { Facebook, Instagram } from "lucide-react";

interface SocialLinksProps {
  facebookUrl?: string | null;
  instagramUrl?: string | null;
}

export function SocialLinks({ facebookUrl, instagramUrl }: SocialLinksProps) {
  if (!facebookUrl && !instagramUrl) return null;

  return (
    <>
      {facebookUrl && (
        <a
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/10 text-white transition hover:bg-white/20"
        >
          <Facebook className="h-4 w-4" />
        </a>
      )}
      {instagramUrl && (
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/10 text-white transition hover:bg-white/20"
        >
          <Instagram className="h-4 w-4" />
        </a>
      )}
    </>
  );
}
