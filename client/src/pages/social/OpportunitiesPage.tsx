import { ArrowUpRight, Check, Send, Store } from "lucide-react";
import { useAuth } from "../../auth/context";
import useResource from "../../hooks/useResource";
import type {
  VendorCall,
  VendorCallAvailability,
} from "../../types/vendorCall";
import ResourceState from "../../components/shared/ResourceState";
import VendorOpportunityCard from "../../components/vendors/VendorOpportunityCard";
import { PageContainer, PageHeader } from "../../components/layout/Page";
import { ButtonLink } from "../../components/ui/Button";

export default function OpportunitiesPage() {
  const resource =
    useResource<(VendorCall & VendorCallAvailability)[]>("/vendor-calls");
  const { user } = useAuth();
  const accepting =
    resource.data?.filter((call) => call.availability.canApply).length || 0;
  return (
    <PageContainer className="poppin-opportunities-page">
      <PageHeader
        eyebrow="SMALL BUSINESS. BIG POSSIBILITIES."
        title="Find your next market."
        featured
        motif="woven-bracelets"
        description="Put your work out there. Discover local events looking for businesses like yours."
        actions={
          user ? (
            <ButtonLink
              to="/my-applications"
              variant="outline"
              icon={<ArrowUpRight size={17} aria-hidden="true" />}
            >
              My applications
            </ButtonLink>
          ) : undefined
        }
      />
      <section className="poppin-join-steps" aria-label="How to join a market">
        <div>
          <span>
            <Store size={20} aria-hidden="true" />
          </span>
          <div>
            <strong>01. Find your fit</strong>
            <p>Check the event, categories and available spaces.</p>
          </div>
        </div>
        <div>
          <span>
            <Send size={20} aria-hidden="true" />
          </span>
          <div>
            <strong>02. Send your details</strong>
            <p>Tell the organizer what your business brings.</p>
          </div>
        </div>
        <div>
          <span>
            <Check size={20} aria-hidden="true" />
          </span>
          <div>
            <strong>03. Join the lineup</strong>
            <p>Accepted applications become confirmed vendors.</p>
          </div>
        </div>
      </section>
      <div className="poppin-results-heading">
        <div>
          <p className="poppin-eyebrow">MAKE YOUR NEXT MOVE</p>
          <h2>A space for your good ideas.</h2>
        </div>
        {!resource.loading && !resource.error && (
          <span className="poppin-results-count">
            {accepting} accepting applications
          </span>
        )}
      </div>
      <ResourceState
        {...resource}
        empty={
          !resource.data?.length
            ? "No recruitment listings just yet. Check back for your next opportunity."
            : ""
        }
        action={
          <ButtonLink variant="outline" to="/discover">
            Explore the events
          </ButtonLink>
        }
      />
      <div className="poppin-opportunity-grid">
        {resource.data?.map((call) => (
          <VendorOpportunityCard
            key={call._id}
            call={call}
            availability={call}
          />
        ))}
      </div>
    </PageContainer>
  );
}
