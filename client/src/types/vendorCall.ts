import type { Category, Organizer, Venue } from "./event";

export interface VendorCallEvent {
  _id: string;
  title: string;
  startDate: string;
  endDate: string;
  status: string;
  organizer?: Organizer;
  venue?: Venue;
}

export interface VendorCall {
  _id: string;
  event: VendorCallEvent;
  title: string;
  description: string;

  applicationStartDate: string;
  applicationDeadline: string;

  totalSlots: number;
  boothFee: number;
  boothSize: string;

  requirements: string[];

  acceptedCategories: Category[];

  status: "draft" | "open" | "closed";
  isActive: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface VendorCallAvailability {
  statistics: {
    totalApplications?: number;
    acceptedApplications: number;
    pendingApplications?: number;
    rejectedApplications?: number;
    slotsRemaining: number;
  };

  availability: {
    status: "draft" | "upcoming" | "open" | "full" | "closed";

    canApply: boolean;
  };
}
