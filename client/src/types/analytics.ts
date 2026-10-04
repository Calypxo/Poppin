export interface AdminAnalytics {
  totals: {
    organizers: number;
    verifiedOrganizers: number;
    events: number;
    venues: number;
    vendorCalls: number;
    vendorApplications: number;
  };

  events: {
    draft: number;
    pending: number;
    published: number;
    rejected: number;
    cancelled: number;
    upcoming: number;
  };

  vendorApplications: {
    pending: number;
    approved: number;
    rejected: number;
    withdrawn: number;
    approvalRate: number;
  };

  vendorSlots: {
    total: number;
    occupied: number;
    available: number;
  };
}