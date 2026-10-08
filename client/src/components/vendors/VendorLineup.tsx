import { Store } from "lucide-react";
import type { VendorLineupItem } from "../../types/vendorApplication";
import VendorCard from "../shared/VendorCard";
import ResourceState from "../shared/ResourceState";

export default function VendorLineup({
  vendors,
  loading,
  error,
  reload,
}: {
  vendors: VendorLineupItem[];
  loading: boolean;
  error: string;
  reload?: () => void;
}) {
  return (
    <section
      className="poppin-vendor-lineup"
      id="vendor-lineup"
      aria-labelledby="vendor-lineup-title"
    >
      <div className="poppin-section-heading">
        <div>
          <p className="poppin-eyebrow">MEET THE VENDORS</p>
          <h2 id="vendor-lineup-title">The people behind the good finds.</h2>
          <p>Discover the businesses confirmed for this event.</p>
        </div>
        {!loading && !error && (
          <span className="poppin-results-count">
            <Store size={16} aria-hidden="true" />
            {vendors.length} {vendors.length === 1 ? "business" : "businesses"}
          </span>
        )}
      </div>
      <ResourceState
        loading={loading}
        error={error}
        reload={reload}
        empty={
          !vendors.length
            ? "The lineup is taking shape. Confirmed businesses will appear here as the organizer accepts applications."
            : ""
        }
      />
      <div className="poppin-lineup-grid">
        {vendors.map((vendor) => (
          <VendorCard key={vendor._id} vendor={vendor} />
        ))}
      </div>
    </section>
  );
}
