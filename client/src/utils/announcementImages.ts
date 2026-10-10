import type { Announcement } from "../types/announcement";

export const MAX_POST_IMAGES = 12;

export function announcementImages(
  post: Pick<Announcement, "imageUrl" | "imageUrls">,
): string[] {
  const images = post.imageUrls?.length
    ? post.imageUrls
    : post.imageUrl
      ? [post.imageUrl]
      : [];
  return [...new Set(images.filter((image) => image.trim()))];
}
