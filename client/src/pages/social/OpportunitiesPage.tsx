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
  return (
    <PageContainer>
      <PageHeader
        eyebrow="A space for your business"
        title="Vendor opportunities"
        featured
        description="Bring your good finds to the next local market. Send your business details directly to an event organizer."
        motif="bilao"
        actions={
          user ? (
            <>
              <ButtonLink to="/my-applications">My applications</ButtonLink>
            </>
          ) : undefined
        }
      />
      <ResourceState
        {...resource}
        empty={
          !resource.data?.length
            ? "No vendor calls are open yet. New places for your business will pop up here."
            : ""
        }
        action={
          <ButtonLink variant="outline" to="/discover">
            Explore the events
          </ButtonLink>
        }
      />
      <div className="poppin-social-grid">
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
