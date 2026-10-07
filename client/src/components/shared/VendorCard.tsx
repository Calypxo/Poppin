import { Link } from "react-router-dom";
import type { VendorLineupItem } from "../../types/vendorApplication";
import Card from "../ui/Card";
import { ButtonLink } from "../ui/Button";
export default function VendorCard({ vendor }: { vendor: VendorLineupItem }) {
  return (
    <Card className="poppin-vendor-card">
      <div className="poppin-person">
        <span className="poppin-avatar poppin-avatar-small">
          {vendor.logoUrl ? (
            <img src={vendor.logoUrl} alt={`${vendor.businessName} logo`} />
          ) : (
            vendor.businessName.slice(0, 2)
          )}
        </span>
        <div>
          {vendor.vendorId ? (
            <Link to={`/vendors/${vendor.vendorId}`}>
              <h3>{vendor.businessName}</h3>
            </Link>
          ) : (
            <h3>{vendor.businessName}</h3>
          )}
          <p>{vendor.category?.name}</p>
        </div>
      </div>
      <p>{vendor.description}</p>
      <p>{vendor.products}</p>
      {vendor.socialMedia && <p>Social page: {vendor.socialMedia}</p>}
      {vendor.vendorId && (
        <ButtonLink
          variant="ghost"
          size="sm"
          to={`/vendors/${vendor.vendorId}`}
        >
          Meet the business ↗
        </ButtonLink>
      )}
    </Card>
  );
}
