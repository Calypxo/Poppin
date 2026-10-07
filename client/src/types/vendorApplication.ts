import type { Category, Event } from "./event";
export interface VendorApplicationListItem {
  _id: string;
  user?: string;
  event?: string;
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
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  organizerRemarks: string;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  vendor?: { _id: string; businessName: string; logoUrl: string; user: string };
  vendorCall: {
    _id: string;
    title: string;
    event: Event;
    applicationStartDate: string;
    applicationDeadline: string;
    totalSlots: number;
    status: string;
    isActive?: boolean;
  };
}

export interface VendorLineupItem {
  _id: string;
  businessName: string;
  category: Category | null;
  products: string;
  description: string;
  socialMedia?: string;
  logoUrl?: string;
  vendorId?: string;
}
