export interface Organizer {
  _id: string;
  name: string;
  description?: string;
  email?: string;
  contactNumber?: string;
  city: string;
  socialMedia?: string;

  user?: string;
  logoUrl?: string;
  isActive?: boolean;

  createdAt?: string;
  updatedAt?: string;
}

export interface Venue {
  _id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  venueType: string;
  createdBy?: string;
  description?: string;
  isActive?: boolean;
}

export interface Category {
  createdBy?: string;
  _id: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface Event {
  _id: string;

  title: string;
  description: string;

  organizer: Organizer;
  venue: Venue;
  categories: Category[];

  startDate: string;
  endDate: string;

  startTime: string;
  endTime: string;

  posterUrl: string;

  status: "draft" | "published" | "cancelled";

  isFeatured: boolean;

  eventState?: "upcoming" | "ongoing" | "completed";

  daysUntilStart?: number;
  managementStats?: {
    totalApplications: number;
    pendingApplications: number;
    acceptedVendors: number;
    totalSlots: number;
    remainingSlots: number;
  };

  createdAt: string;
  updatedAt: string;
}

export interface DiscoverEventsResponse {
  count: number;

  filters: {
    search: string | null;
    city: string | null;
    category: string | null;
    featured: boolean;
  };

  events: Event[];
}
