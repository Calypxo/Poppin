import { test, expect, type Page } from "@playwright/test";

const apiUrl = "http://127.0.0.1:3001/api";
const eventId = "000000000000000000000101";
const password = "SavedEventsDemo123!";
const saveName = "Save Future community market to Saved Events";
const removeName = "Remove Future community market from Saved Events";

async function signIn(page: Page, email = "viewer@example.test", redirect = "/feed") {
  await page.goto("/login");
  await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(redirect + "$"));
}

async function openAccountMenu(page: Page) {
  if (await page.getByRole("button", { name: "Close navigation" }).isVisible()) return;
  const menu = page.getByRole("button", { name: "Open navigation" });
  if (await menu.isVisible()) {
    await menu.click();
    return;
  }
  const account = page.getByRole("button", { name: "Account menu" });
  if (await account.getAttribute("aria-expanded") !== "true") await account.click();
}

function accountAction(page: Page, name: string) {
  const header = page.locator(".site-header");
  return header.getByRole("link", { name, exact: true })
    .or(header.getByRole("menuitem", { name, exact: true }))
    .or(header.getByRole("button", { name, exact: true }));
}

async function logOut(page: Page) {
  await openAccountMenu(page);
  await accountAction(page, "Log out").click();
  await page.getByRole("dialog", { name: "Log out?", exact: true })
    .getByRole("button", { name: "Log out", exact: true }).click();
}

test.beforeEach(async ({ request }) => {
  const login = await request.post(apiUrl + "/auth/login", { data: { email: "viewer@example.test", password } });
  const { token } = await login.json();
  const headers = { Authorization: "Bearer " + token };
  const saved = await request.get(apiUrl + "/saved-events", { headers });
  for (const entry of await saved.json()) await request.delete(apiUrl + "/saved-events/" + entry.eventId, { headers });
});

test("save with the keyboard, persist through reload and sign-in, then remove", async ({ page }) => {
  await signIn(page);
  await page.goto("/discover");
  const save = page.getByRole("button", { name: saveName, exact: true });
  await expect(save).toBeEnabled();
  await save.focus();
  await save.press("Enter");
  await expect(page).toHaveURL(/\/discover$/);
  await expect(page.getByRole("button", { name: removeName, exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: removeName, exact: true })).toBeFocused();
  await expect(page.getByText("Event saved. Find it in Saved Events.", { exact: true })).toBeVisible();
  await page.locator("article.event-card").filter({ hasText: "Future community market" }).getByRole("link").click();
  await expect(page.getByRole("button", { name: removeName, exact: true })).toBeEnabled();
  await openAccountMenu(page);
  await accountAction(page, "Saved Events").click();
  await expect(page.getByRole("heading", { name: "Future community market", exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: removeName, exact: true })).toBeEnabled();
  await logOut(page);
  await expect(page).toHaveURL(/\/login$/);
  await page.getByRole("textbox", { name: "Email", exact: true }).fill("viewer@example.test");
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL(/\/saved-events$/);
  const remove = page.getByRole("button", { name: removeName, exact: true });
  await expect(remove).toBeEnabled();
  await remove.focus();
  await remove.press("Space");
  await expect(page.getByText("Your next good plan starts here.", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "0 saved events", exact: true })).toBeFocused();
  await page.goto("/events/" + eventId);
  await expect(page.getByRole("button", { name: saveName, exact: true })).toHaveAttribute("aria-pressed", "false");
});

test("guests are prompted to sign in and can save from event details", async ({ page }) => {
  await page.goto("/events/" + eventId);
  await page.getByRole("button", { name: saveName, exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.getByRole("textbox", { name: "Email", exact: true }).fill("viewer@example.test");
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL(new RegExp("/events/" + eventId + "$"));
  await page.getByRole("button", { name: saveName, exact: true }).click();
  await expect(page.getByRole("button", { name: removeName, exact: true })).toBeEnabled();
  await page.reload();
  await expect(page.getByRole("button", { name: removeName, exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("completed, cancelled and unavailable saves display correctly without overflow", async ({ page }, info) => {
  await signIn(page, "statuses@example.test");
  await page.goto("/saved-events");
  await expect(page.getByRole("heading", { name: "4 saved events", exact: true })).toBeVisible();
  await expect(page.getByText("Completed", { exact: true })).toBeVisible();
  await expect(page.getByText("Cancelled", { exact: true })).toBeVisible();
  await expect(page.getByText("Unavailable", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const controls = page.locator(".poppin-saved-grid button");
  for (const control of await controls.all()) {
    const box = await control.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(40);
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  }
  await page.screenshot({ path: info.outputPath("saved-events.png"), fullPage: true });
  await page.locator("article.event-card").filter({ hasText: "Cancelled neighbourhood market" }).getByRole("link").click();
  await expect(page.getByRole("heading", { name: "Cancelled neighbourhood market", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Remove Cancelled neighbourhood market from Saved Events", exact: true })).toBeEnabled();
});

test("loading, errors and failed writes allow retry without false saved state", async ({ page }) => {
  await signIn(page);
  await page.route("**/api/saved-events", (route) => route.fulfill({ status: 503, json: { message: "Saved plans temporarily unavailable." } }));
  await page.goto("/saved-events");
  await expect(page.getByText("Saved plans temporarily unavailable.", { exact: true })).toBeVisible();
  await page.unroute("**/api/saved-events");
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.getByText("Your next good plan starts here.", { exact: true })).toBeVisible();
  await page.goto("/discover");
  await page.route("**/api/saved-events/" + eventId, (route) => route.fulfill({ status: 503, json: { message: "Please try saving again." } }));
  await page.getByRole("button", { name: saveName, exact: true }).click();
  await expect(page.getByText("Please try saving again.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: saveName, exact: true })).toHaveAttribute("aria-pressed", "false");
  await page.unroute("**/api/saved-events/" + eventId);
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/api/saved-events/" + eventId, async (route) => { await gate; await route.continue(); });
  await page.getByRole("button", { name: saveName, exact: true }).click();
  await expect(page.getByRole("button", { name: saveName, exact: true })).toBeDisabled();
  await expect(page.getByText("Saving…", { exact: true })).toBeVisible();
  release();
  await expect(page.getByRole("button", { name: removeName, exact: true })).toBeEnabled();
  await page.unroute("**/api/saved-events/" + eventId);
  await page.route("**/api/saved-events/" + eventId, (route) => route.fulfill({ status: 503, json: { message: "Please try removing again." } }));
  await page.getByRole("button", { name: removeName, exact: true }).click();
  await expect(page.getByText("Please try removing again.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: removeName, exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.unroute("**/api/saved-events/" + eventId);
  await page.getByRole("button", { name: removeName, exact: true }).click();
  await expect(page.getByRole("button", { name: saveName, exact: true })).toBeEnabled();
});

test("switching accounts clears the previous user's saved list", async ({ page }) => {
  await signIn(page);
  await page.goto("/events/" + eventId);
  await page.getByRole("button", { name: saveName, exact: true }).click();
  await expect(page.getByRole("button", { name: removeName, exact: true })).toBeEnabled();
  await page.goto("/saved-events");
  await expect(page.getByRole("heading", { name: "Future community market", exact: true })).toBeVisible();
  await logOut(page);
  await expect(page).toHaveURL(/\/login$/);
  await page.getByRole("textbox", { name: "Email", exact: true }).fill("other@example.test");
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL(/\/saved-events$/);
  await expect(page.getByText("Your next good plan starts here.", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Future community market", exact: true })).toHaveCount(0);
});

test("logout requires confirmation and cancellation keeps the session", async ({ page }, info) => {
  await signIn(page);
  await page.goto("/saved-events");
  await expect(page.getByRole("heading", { name: "0 saved events", exact: true })).toBeVisible();
  const token = await page.evaluate(() => localStorage.getItem("poppin.session"));
  expect(token).toBeTruthy();
  await openAccountMenu(page);
  const trigger = accountAction(page, "Log out");
  const account = page.getByRole("button", { name: "Account menu" });
  const returnFocus = await account.isVisible() ? account : trigger;
  await trigger.focus();
  await trigger.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Log out?", exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Stay logged in" })).toBeFocused();
  expect(await page.evaluate(() => localStorage.getItem("poppin.session"))).toBe(token);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const box = await dialog.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  await page.screenshot({ path: info.outputPath("logout-confirmation.png") });
  await dialog.getByRole("button", { name: "Stay logged in" }).press("Enter");
  await expect(dialog).toHaveCount(0);
  await expect(returnFocus).toBeFocused();
  await expect(page).toHaveURL(/\/saved-events$/);
  expect(await page.evaluate(() => localStorage.getItem("poppin.session"))).toBe(token);
  await openAccountMenu(page);
  await trigger.press("Enter");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(returnFocus).toBeFocused();
  await page.reload();
  await expect(page.getByRole("heading", { name: "0 saved events", exact: true })).toBeVisible();
  await logOut(page);
  await expect(page).toHaveURL(/\/login$/);
  expect(await page.evaluate(() => localStorage.getItem("poppin.session"))).toBeNull();
});

test("organizer navigation remains accessible at tablet widths", async ({ page }) => {
  await signIn(page, "host@example.test");
  for (const width of [1024, 1199, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const menu = page.getByRole("button", { name: "Open navigation" });
    if (await menu.isVisible()) {
      await menu.click();
      await expect(accountAction(page, "Saved Events")).toBeVisible();
      await page.getByRole("button", { name: "Close navigation" }).click();
    } else {
      const navigation = page.getByRole("navigation", { name: "Main navigation" });
      await expect(navigation.getByRole("link")).toHaveCount(4);
      await expect(navigation.getByRole("link", { name: "Create event", exact: true })).toHaveCount(0);
      const nav = await navigation.boundingBox();
      const account = await page.locator(".site-account").boundingBox();
      expect(nav!.x + nav!.width).toBeLessThanOrEqual(account!.x);
      expect(account!.x + account!.width).toBeLessThanOrEqual(width);
      await expect(page.locator(".site-account").getByRole("link", { name: "Create event", exact: true })).toBeVisible();
      const trigger = page.getByRole("button", { name: "Account menu" });
      await trigger.focus();
      await trigger.press("ArrowDown");
      await expect(page.getByRole("menuitem", { name: "Saved Events", exact: true })).toBeFocused();
      await expect(page.getByRole("menuitem", { name: "My events", exact: true })).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(trigger).toBeFocused();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
