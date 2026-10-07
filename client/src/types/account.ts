import type { Category, Event, Organizer } from "./event";
import type { Announcement } from "./announcement";
import type { VendorCall, VendorCallAvailability } from "./vendorCall";
export interface User {
  _id: string;
  name: string;
  email: string;
  avatarUrl: string;
  bio: string;
  city: string;
  contactNumber: string;
  organizerId: string | null;
  vendorId: string | null;
}
export interface VendorProfile {
  _id: string;
  user: string;
  businessName: string;
  description: string;
  logoUrl: string;
  category: Category | null;
  products: string;
  city: string;
  contactNumber?: string;
  email?: string;
  socialMedia: string;
}
export interface ProfileResponse {
  profile: Organizer | VendorProfile;
  events: Event[];
  posts: Announcement[];
}
export interface FeedItem {
  _id: string;
  kind: "event" | "post" | "vendor_call";
  type: string;
  timestamp: string;
  event: Event;
  post?: Announcement;
  vendorCall?: VendorCall & VendorCallAvailability;
}
export interface FeedResponse {
  items: FeedItem[];
  page: number;
  hasMore: boolean;
  count: number;
}

export interface MyProfiles {
  user: User;
  organizer: Organizer | null;
  vendor: VendorProfile | null;
}
