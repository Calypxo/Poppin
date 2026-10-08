import type { VendorProfile } from "../../types/account";
import type { Organizer } from "../../types/event";
import { Mail, Phone, ArrowUpRight } from "lucide-react";
export default function ProfileAbout({
  profile,
  name,
}: {
  profile: VendorProfile | Organizer;
  name: string;
}) {
  return (
    <aside className="poppin-profile-about">
      <p className="poppin-eyebrow">GET TO KNOW US</p>
      <h2>About {name}</h2>
      <p className="poppin-preserve-lines">
        {profile.description || "This local story is just getting started."}
      </p>
      {"products" in profile && (
        <>
          <h3>{profile.category?.name || "Products & services"}</h3>
          <p>{profile.products}</p>
        </>
      )}
      {(profile.email || profile.contactNumber || profile.socialMedia) && (
        <h3 className="poppin-profile-contact-heading">Get in touch</h3>
      )}
      {profile.email && (
        <p className="poppin-contact-row">
          <Mail size={16} aria-hidden="true" />
          <a href={`mailto:${profile.email}`}>{profile.email}</a>
        </p>
      )}
      {profile.contactNumber && (
        <p className="poppin-contact-row">
          <Phone size={16} aria-hidden="true" />
          {profile.contactNumber}
        </p>
      )}
      {profile.socialMedia && (
        <p className="poppin-contact-row">
          <ArrowUpRight size={16} aria-hidden="true" />
          {/^https?:\/\//.test(profile.socialMedia) ? (
            <a href={profile.socialMedia} target="_blank" rel="noreferrer">
              Social page ↗
            </a>
          ) : (
            profile.socialMedia
          )}
        </p>
      )}
    </aside>
  );
}
