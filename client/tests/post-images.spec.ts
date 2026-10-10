import { test, expect, type Page } from "@playwright/test";

const eventId = "000000000000000000000901";
const image = "/event-gallery/kulitan-youthfest.jpg";
const caption = "A little bit of coffee, a little bit of matcha. 👀✨\nMeet our merchants this October 9–12.\nSee you around the loop!";
const organizer = { _id: "organizer-images", user: "user-images", name: "Kulitan Flea Market", description: "Local markets", logoUrl: "", city: "Angeles City" };
const event = { _id: eventId, title: "Kulitan Flea Market: Angeles City Youthfest", description: "A local market", organizer, status: "published", startDate: "2026-10-09", endDate: "2026-10-12", startTime: "10:00", endTime: "21:00", categories: [], venue: { _id: "venue-images", name: "Nepo", city: "Angeles City", address: "Nepo Street" }, posterUrl: image, eventState: "ongoing", isFeatured: false, createdAt: "2026-10-01", updatedAt: "2026-10-01" };
const legacyPost = { _id: "post-legacy", event, title: "Meet our merchants", content: caption, type: "lineup", imageUrl: image, isPublished: true, publishedAt: "2026-10-09T01:00:00Z", createdAt: "2026-10-09T01:00:00Z", updatedAt: "2026-10-09T01:00:00Z" };
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jVb8AAAAASUVORK5CYII=", "base64");
const file = (name: string, mimeType = "image/png", buffer = png) => ({ name, mimeType, buffer });

async function mockPosts(page: Page, uploads?: (index: number) => Promise<{ status?: number; json: object }>) {
  let posts: object[] = [legacyPost];
  let uploadCount = 0;
  const writes: { method: string; data: Record<string, unknown> }[] = [];
  await page.addInitScript(() => localStorage.setItem("poppin.session", "isolated-post-images-preview"));
  await page.route(/^http:\/\/(localhost|127\.0\.0\.1):300[01]\/api\//, async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace("/api", "");
    if (path === "/auth/me") return route.fulfill({ json: { _id: "user-images", name: "Jolanne", email: "organizer@example.test", avatarUrl: "", organizerId: organizer._id, vendorId: null } });
    if (path === "/events/mine") return route.fulfill({ json: [event] });
    if (path === "/posts/mine") return route.fulfill({ json: posts });
    if (path === "/saved-events") return route.fulfill({ json: [] });
    if (path === "/uploads/image") {
      uploadCount += 1;
      const result = uploads ? await uploads(uploadCount) : { json: { secureUrl: `${image}?upload=${uploadCount}` } };
      return route.fulfill(result);
    }
    if (path === "/feed") return route.fulfill({ json: { items: posts.map((post, index) => ({ _id: `feed-${index}`, kind: "post", type: "lineup", timestamp: legacyPost.createdAt, event, post })), page: 1, hasMore: false, count: posts.length } });
    if ((path === "/posts" && request.method() === "POST") || (path.startsWith("/posts/") && request.method() === "PATCH")) {
      const data = request.postDataJSON();
      writes.push({ method: request.method(), data });
      const post = { ...legacyPost, ...data, event, _id: path === "/posts" ? "post-new" : path.split("/").at(-1) };
      posts = request.method() === "POST" ? [post, ...posts] : [post];
      return route.fulfill({ status: request.method() === "POST" ? 201 : 200, json: post });
    }
    return route.fulfill({ status: 404, json: { message: `Unexpected mock request: ${path}` } });
  });
  return { writes, uploadCount: () => uploadCount };
}

test("multiple uploads preserve selection order and successful images after a failure", async ({ page }) => {
  let release = () => {};
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const api = await mockPosts(page, async (index) => {
    if (index === 1) await gate;
    return index === 2 ? { status: 503, json: { message: "Please retry this image." } } : { json: { secureUrl: `${image}?upload=${index}` } };
  });
  await page.goto(`/events/${eventId}/posts`);
  await page.getByRole("textbox", { name: "Title", exact: true }).fill("Kulitan merchant lineup");
  await page.getByRole("textbox", { name: "Update", exact: true }).fill(caption);
  await page.getByLabel("Post type", { exact: true }).selectOption("lineup");
  await page.getByLabel("Choose post images", { exact: true }).setInputFiles([file("coffee.png"), file("matcha.png"), file("food.png")]);
  await expect(page.getByRole("button", { name: "Publish update", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Save draft", exact: true })).toBeDisabled();
  await expect(page.locator(".poppin-post-upload-grid li")).toHaveCount(3);
  release();
  const uploader = page.locator(".poppin-post-uploader");
  await expect(uploader.getByRole("status")).toContainText("2 images uploaded");
  await expect(uploader.getByRole("alert")).toContainText("matcha.png: Please retry this image.");
  await expect(page.getByRole("button", { name: "Publish update", exact: true })).toBeEnabled();
  await expect(page.locator(".poppin-post-upload-grid li")).toHaveCount(2);
  await page.getByRole("button", { name: "Publish update", exact: true }).click();
  await expect.poll(() => api.writes.length).toBe(1);
  expect(api.writes[0].data.imageUrls).toEqual([`${image}?upload=1`, `${image}?upload=3`]);
  expect(api.writes[0].data.imageUrl).toBe(`${image}?upload=1`);
  expect(api.writes[0].data.content).toBe(caption);
  expect(api.writes[0].data.isPublished).toBe(true);
  await expect(page.locator(".poppin-post-gallery-grid li")).toHaveCount(2);
});

test("legacy single-image updates can add and remove images without losing edits", async ({ page }) => {
  const api = await mockPosts(page);
  await page.goto(`/events/${eventId}/posts?edit=post-legacy`);
  await expect(page.getByRole("textbox", { name: "Title", exact: true })).toHaveValue(legacyPost.title);
  await expect(page.locator(".poppin-post-upload-grid li")).toHaveCount(1);
  await page.getByLabel("Choose post images", { exact: true }).setInputFiles([file("coffee.png"), file("food.png")]);
  await expect(page.locator(".poppin-post-uploader").getByRole("status")).toContainText("2 images uploaded");
  await page.getByRole("button", { name: "Remove image 2", exact: true }).click();
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect.poll(() => api.writes.length).toBe(1);
  expect(api.writes[0].method).toBe("PATCH");
  expect(api.writes[0].data.imageUrls).toEqual([image, `${image}?upload=2`]);
  expect(api.writes[0].data.imageUrl).toBe(image);
  expect(api.writes[0].data.isPublished).toBe(false);
  await page.goto(`/events/${eventId}/posts?edit=post-legacy`);
  await expect(page.locator(".poppin-post-upload-grid li")).toHaveCount(2);
  await page.getByRole("button", { name: "Remove image 2", exact: true }).click();
  await page.getByRole("button", { name: "Remove image 1", exact: true }).click();
  await page.getByRole("button", { name: "Publish update", exact: true }).click();
  await expect.poll(() => api.writes.length).toBe(2);
  expect(api.writes[1].data.imageUrls).toEqual([]);
  expect(api.writes[1].data.imageUrl).toBe("");
});

test("uploads validate formats, per-image size and the twelve-image limit", async ({ page }) => {
  const api = await mockPosts(page);
  await page.goto(`/events/${eventId}/posts`);
  await page.getByLabel("Choose post images", { exact: true }).setInputFiles([file("unsafe.svg", "image/svg+xml"), file("large.png", "image/png", Buffer.alloc(5 * 1024 * 1024 + 1)), ...Array.from({ length: 13 }, (_, index) => file(`merchant-${index + 1}.png`))]);
  const uploader = page.locator(".poppin-post-uploader");
  await expect(uploader.getByRole("status")).toContainText("12 images uploaded");
  await expect(uploader.getByRole("alert")).toContainText("unsafe.svg: choose a JPG, PNG or WEBP image.");
  await expect(uploader.getByRole("alert")).toContainText("large.png: image must be 5 MB or less.");
  await expect(uploader.getByRole("alert")).toContainText("merchant-13.png: an update can have up to 12 images.");
  expect(api.uploadCount()).toBe(12);
  await expect(page.locator(".poppin-post-upload-grid li")).toHaveCount(12);
  await expect(page.getByRole("button", { name: "Add images", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Remove image 1", exact: true }).click();
  await expect(page.getByRole("button", { name: "Add images", exact: true })).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("post galleries scroll equal portrait tiles and preserve full captions with keyboard previews", async ({ page }, info) => {
  const api = await mockPosts(page);
  await page.goto(`/events/${eventId}/posts?edit=post-legacy`);
  await page.getByLabel("Choose post images", { exact: true }).setInputFiles(Array.from({ length: 7 }, (_, index) => file(`merchant-${index + 1}.png`)));
  await expect(page.locator(".poppin-post-uploader").getByRole("status")).toContainText("7 images uploaded");
  await page.getByRole("button", { name: "Publish update", exact: true }).click();
  await expect.poll(() => api.writes.length).toBe(1);
  await page.goto("/feed");
  const card = page.locator(".poppin-update-card");
  const gallery = card.locator(".poppin-post-gallery-grid");
  await expect(gallery.locator("li")).toHaveCount(8);
  expect(await card.locator(".poppin-preserve-lines").textContent()).toBe(caption);
  expect(await card.locator(".poppin-preserve-lines").evaluate((element) => getComputedStyle(element).whiteSpace)).toBe("pre-line");
  const tiles = await gallery.locator("button").evaluateAll((buttons) => buttons.map((button) => {
    const { x, y, width, height } = button.getBoundingClientRect();
    return { x, y, width, height };
  }));
  for (const [index, tile] of tiles.entries()) {
    expect(tile.width).toBeGreaterThanOrEqual(44);
    expect(tile.height).toBeGreaterThanOrEqual(44);
    expect(tile.width / tile.height).toBeCloseTo(3 / 4, 2);
    expect(Math.abs(tile.width - tiles[0].width)).toBeLessThan(1);
    expect(Math.abs(tile.height - tiles[0].height)).toBeLessThan(1);
    expect(Math.abs(tile.y - tiles[0].y)).toBeLessThan(1);
    if (index > 0) expect(tile.x).toBeGreaterThan(tiles[index - 1].x);
  }
  expect(await gallery.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
  expect(await gallery.evaluate((element) => element.scrollHeight <= element.clientHeight + 1)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const previousPhotos = card.getByRole("button", { name: "Previous photos", exact: true });
  const nextPhotos = card.getByRole("button", { name: "Next photos", exact: true });
  await expect(previousPhotos).toBeDisabled();
  await expect(nextPhotos).toBeEnabled();
  const firstPosition = await gallery.evaluate((element) => element.scrollLeft);
  await nextPhotos.click();
  await expect.poll(() => gallery.evaluate((element) => element.scrollLeft)).toBeGreaterThan(firstPosition);
  await expect(previousPhotos).toBeEnabled();
  for (let step = 0; step < 8 && await nextPhotos.isEnabled(); step += 1) {
    const position = await gallery.evaluate((element) => ({ left: element.scrollLeft, width: element.clientWidth, end: element.scrollWidth - element.clientWidth }));
    await nextPhotos.click();
    await expect.poll(() => gallery.evaluate((element) => element.scrollLeft)).toBeGreaterThanOrEqual(Math.min(position.left + position.width / 2, position.end - 1));
  }
  await expect(nextPhotos).toBeDisabled();
  const finalImageVisible = () => gallery.locator("button").last().evaluate((button) => {
    const tile = button.getBoundingClientRect();
    const viewport = button.closest("ul")!.getBoundingClientRect();
    return tile.left >= viewport.left - 1 && tile.right <= viewport.right + 1;
  });
  await expect.poll(finalImageVisible).toBe(true);
  for (let step = 0; step < 8 && await previousPhotos.isEnabled(); step += 1) {
    const position = await gallery.evaluate((element) => ({ left: element.scrollLeft, width: element.clientWidth }));
    await previousPhotos.click();
    await expect.poll(() => gallery.evaluate((element) => element.scrollLeft)).toBeLessThanOrEqual(Math.max(position.left - position.width / 2, 1));
  }
  await expect(previousPhotos).toBeDisabled();
  await expect(nextPhotos).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await gallery.focus();
  await expect(gallery).toBeFocused();
  await gallery.press("ArrowRight");
  await expect.poll(() => gallery.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  const lastPreview = gallery.getByRole("button", { name: "View image: Meet our merchants — image 8 of 8", exact: true });
  expect(await lastPreview.evaluate((button) => button.getBoundingClientRect().right > button.closest("ul")!.getBoundingClientRect().right)).toBe(true);
  await lastPreview.focus();
  await expect.poll(() => lastPreview.evaluate((button) => {
    const tile = button.getBoundingClientRect();
    const viewport = button.closest("ul")!.getBoundingClientRect();
    return tile.left >= viewport.left - 1 && tile.right <= viewport.right + 1;
  })).toBe(true);
  await lastPreview.press("Enter");
  await expect(page.getByRole("dialog", { name: "Meet our merchants — image 8 of 8", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(lastPreview).toBeFocused();
  const preview = card.getByRole("button", { name: "View image: Meet our merchants — image 3 of 8", exact: true });
  await preview.focus();
  await preview.press("Enter");
  await expect(page.getByRole("dialog", { name: "Meet our merchants — image 3 of 8", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(preview).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await card.screenshot({ path: info.outputPath("post-gallery.png") });
});
