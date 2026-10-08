import type { ReactNode } from "react";
import { MapPin } from "lucide-react";
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
      <div className="poppin-profile-cover" aria-hidden="true">
        <span>People make the place.</span>
        <i>POPP’IN / PAMPANGA</i>
      </div>
      <div className="poppin-profile-identity">
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
        </div>
      </div>
      {children && (
        <div className="poppin-actions poppin-profile-actions">{children}</div>
      )}
    </header>
  );
}
