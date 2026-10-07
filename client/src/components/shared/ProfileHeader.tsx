import type { ReactNode } from "react";
import { MapPin } from "lucide-react";
import { WatercolorSticker } from "../public/MarketDecorations";
export default function ProfileHeader({
  name,
  image,
  kind,
  city,
  children,
}: {
  name: string;
  image?: string;
  kind: string;
  city?: string;
  children?: ReactNode;
}) {
  return (
    <header className="poppin-profile-header">
      <div className="poppin-avatar" aria-hidden={!image}>
        {image ? (
          <img src={image} alt={`${name} profile`} />
        ) : (
          name.slice(0, 2).toUpperCase()
        )}
      </div>
      <div className="poppin-profile-copy">
        <span className="poppin-eyebrow">{kind}</span>
        <h1>{name}</h1>
        {city && (
          <p className="flex items-center gap-2">
            <MapPin size={15} aria-hidden="true" />
            {city}
          </p>
        )}
        <div className="poppin-actions">{children}</div>
      </div>
      <WatercolorSticker
        motif={
          kind === "vendor"
            ? "flower-bouquet"
            : kind === "organizer"
              ? "craft-booth"
              : "croissant"
        }
        className="poppin-profile-art"
      />
    </header>
  );
}
