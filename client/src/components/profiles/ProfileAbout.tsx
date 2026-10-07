import type { VendorProfile } from "../../types/account";
import type { Organizer } from "../../types/event";
export default function ProfileAbout({
  profile,
  name,
}: {
  profile: VendorProfile | Organizer;
  name: string;
}) {
  return (
    <aside className="poppin-profile-about">
      <p className="poppin-eyebrow">THE LOCAL STORY</p>
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
        <h3>Say hello</h3>
      )}
      {profile.email && (
        <p>
          <a href={`mailto:${profile.email}`}>{profile.email}</a>
        </p>
      )}
      {profile.contactNumber && <p>{profile.contactNumber}</p>}
      {profile.socialMedia && (
        <p>
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
