import Image from "next/image";

interface RegionLogoProps {
  slug: string;
  name?: string;
  size?: number;
  className?: string;
}

export function RegionLogo({ slug, name, size = 32, className }: RegionLogoProps) {
  return (
    <Image
      src={`/regions/${slug}.png`}
      alt={name ?? slug}
      width={size}
      height={size}
      className={className}
      style={{ objectFit: "contain" }}
    />
  );
}
