import type { VendorLineupItem } from "../../types/vendorApplication";
import VendorCard from "../shared/VendorCard";
import ResourceState from "../shared/ResourceState";
import { WatercolorSticker } from "../public/MarketDecorations";
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
      className="poppin-management-section"
      id="vendor-lineup"
      aria-labelledby="vendor-lineup-title"
    >
      <div className="poppin-lineup-heading">
        <WatercolorSticker motif="flower-bouquet" />
        <div>
          <p className="poppin-eyebrow">Meet the market</p>
          <h2 id="vendor-lineup-title">The vendor lineup</h2>
        </div>
      </div>
      <p>Local businesses joining this event, confirmed by the organizer.</p>
      <ResourceState
        loading={loading}
        error={error}
        reload={reload}
        empty={
          !vendors.length
            ? "The lineup is still taking shape. Meet the businesses here as they’re confirmed."
            : ""
        }
      />
      <div className="poppin-discover-grid">
        {vendors.map((vendor) => (
          <VendorCard key={vendor._id} vendor={vendor} />
        ))}
      </div>
    </section>
  );
}
