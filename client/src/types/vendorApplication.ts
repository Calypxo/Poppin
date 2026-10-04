import type { Category } from "./event";

export interface VendorApplicationListItem {
  _id: string;

  applicationCode: string;

  businessName: string;

  representativeName: string;

  email: string;

  contactNumber: string;

  category: Category;

  products: string;

  businessDescription: string;

  socialMedia: string;

  notes: string;

  status:
    | "pending"
    | "approved"
    | "rejected"
    | "withdrawn";

  organizerRemarks: string;

  reviewedAt: string | null;

  createdAt: string;
  updatedAt: string;

  vendorCall: {
    _id: string;
    title: string;
    event: string;
    applicationStartDate: string;
    applicationDeadline: string;
    totalSlots: number;
    status: string;
    isActive?: boolean;
  };
}

export interface TrackedApplication {
  applicationCode: string;

  businessName: string;

  representativeName: string;

  category: {
    _id: string;
    name: string;
  };

  status:
    | "pending"
    | "approved"
    | "rejected"
    | "withdrawn";

  organizerRemarks: string;

  reviewedAt: string | null;

  submittedAt: string;

  vendorCall: {
    _id: string;

    title: string;

    applicationStartDate: string;

    applicationDeadline: string;

    boothFee: number;

    status: string;

    event: {
      _id: string;
      title: string;
      startDate: string;
      endDate: string;
      startTime: string;
      endTime: string;
    };
  };
}