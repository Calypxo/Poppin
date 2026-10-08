import { Link } from "react-router-dom";
import { ArrowUpRight, BadgeCheck } from "lucide-react";
import type { VendorLineupItem } from "../../types/vendorApplication";
import Card from "../ui/Card";
import { ButtonLink } from "../ui/Button";

export default function VendorCard({ vendor }: { vendor: VendorLineupItem }) {
  const initials = vendor.businessName.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
  return (
    <Card className="poppin-lineup-card">
      <div className="poppin-lineup-card-top">
        <span className="poppin-business-avatar" aria-hidden="true">
          {vendor.logoUrl ? (
            <img src={vendor.logoUrl} alt="" loading="lazy" />
          ) : (
            initials
          )}
        </span>
        <span className="poppin-confirmed-label">
          <BadgeCheck size={15} aria-hidden="true" />
          Confirmed
        </span>
      </div>
      <p className="poppin-eyebrow">
        {vendor.category?.name || "LOCAL BUSINESS"}
      </p>
      <h4>
        {vendor.vendorId ? (
          <Link to={"/vendors/" + vendor.vendorId}>{vendor.businessName}</Link>
        ) : (
          vendor.businessName
        )}
      </h4>
      {vendor.description && <p>{vendor.description}</p>}
      {vendor.products && (
        <div className="poppin-vendor-products">
          <span>What you’ll find</span>
          <p>{vendor.products}</p>
        </div>
      )}
      {vendor.socialMedia && (
        <p className="poppin-vendor-social">Find them: {vendor.socialMedia}</p>
      )}
      {vendor.vendorId && (
        <ButtonLink
          variant="ghost"
          size="sm"
          to={"/vendors/" + vendor.vendorId}
          icon={<ArrowUpRight size={16} aria-hidden="true" />}
        >
          Meet the business
        </ButtonLink>
      )}
    </Card>
  );
}
