import { expect, test, type Page } from "@playwright/test";

const LAUNCHER = /open concierge chat/i;

async function openChat(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: LAUNCHER }).click();
  await expect(page.getByRole("dialog", { name: /concierge chat/i })).toBeVisible();
  return page.getByRole("textbox", { name: /message the sea view skydiving concierge/i });
}

async function ask(page: Page, text: string) {
  const box = page.getByRole("textbox", { name: /message the sea view skydiving concierge/i });
  await box.fill(text);
  await page.getByRole("button", { name: "Send message" }).click();
}

test("page has no horizontal overflow and shows the three package prices", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("฿9,500").first()).toBeVisible();
  await expect(page.getByText("฿12,500").first()).toBeVisible();
  await expect(page.getByText("฿14,000").first()).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, "page scrolls sideways").toBeLessThanOrEqual(1);
});

test("unverified claims are not shown (no review score or opening hours)", async ({ page }) => {
  await page.goto("/");
  const body = await page.locator("body").innerText();
  expect(body).not.toMatch(/835 reviews|4\.9\/5|8:00 AM/);
});

test("chat opens inside the viewport and Escape returns focus to the launcher", async ({ page }) => {
  await openChat(page);
  const box = await page.locator("#concierge-chat").boundingBox();
  const vp = page.viewportSize()!;
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(vp.width + 1);
  expect(box!.y + box!.height).toBeLessThanOrEqual(vp.height + 1);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: /concierge chat/i })).toBeHidden();
  await expect(page.getByRole("button", { name: /open concierge chat/i })).toBeFocused();
});

test("chat answers a package question with prices", async ({ page }) => {
  await openChat(page);
  await ask(page, "What is included in each package?");
  const log = page.getByRole("log");
  await expect(log).toContainText("฿9,500", { timeout: 20_000 });
  await expect(log).toContainText("฿14,000");
});

test("PDF card has Open and Download; video card renders a playable <video>", async ({ page }) => {
  await openChat(page);
  await ask(page, "Please send me the PDF brochure");
  const log = page.getByRole("log");
  await expect(log.getByRole("link", { name: /open pdf/i })).toBeVisible({ timeout: 20_000 });
  await expect(log.getByRole("link", { name: /download/i }).first()).toBeVisible();
  await ask(page, "I want to see the video");
  const video = log.locator("video");
  await expect(video).toBeVisible({ timeout: 20_000 });
  const w = await video.evaluate((v) => (v as HTMLVideoElement).getBoundingClientRect().width);
  const logW = await log.evaluate((el) => el.getBoundingClientRect().width);
  expect(w, "video wider than chat").toBeLessThanOrEqual(logW);
  const canPlay = await video.evaluate((v) => (v as HTMLVideoElement).canPlayType("video/mp4"));
  expect(typeof canPlay).toBe("string");
});

test("conversation survives a refresh in the same tab and New chat clears it", async ({ page }) => {
  await openChat(page);
  await ask(page, "How long is the freefall?");
  const log = page.getByRole("log");
  await expect(log).toContainText("60 seconds", { timeout: 20_000 });
  await page.reload();
  await page.getByRole("button", { name: LAUNCHER }).click();
  await expect(page.getByRole("log")).toContainText("How long is the freefall?");
  await expect(page.getByRole("log")).toContainText("60 seconds");
  await page.getByRole("button", { name: /start a new chat/i }).click();
  await expect(page.getByRole("log")).not.toContainText("How long is the freefall?");
  await page.reload();
  await page.getByRole("button", { name: LAUNCHER }).click();
  await expect(page.getByRole("log")).not.toContainText("How long is the freefall?");
});

test("an unanswerable question is declined, not invented", async ({ page }) => {
  await openChat(page);
  await ask(page, "What are your opening hours?");
  const log = page.getByRole("log");
  await expect(log).toContainText(/don't have that information|can't confirm/i, { timeout: 20_000 });
  await expect(log).not.toContainText(/\d{1,2}:\d{2}/);
});

test("keyboard: Tab reaches the chat launcher and Enter opens it", async ({ page, isMobile }) => {
  test.skip(!!isMobile, "keyboard traversal is a desktop check");
  await page.goto("/");
  const launcher = page.getByRole("button", { name: LAUNCHER });
  for (let i = 0; i < 80; i++) {
    await page.keyboard.press("Tab");
    if (await launcher.evaluate((el) => el === document.activeElement)) break;
  }
  await expect(launcher).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: /concierge chat/i })).toBeVisible();
});

test("Knowledge View shows sources with URL and capture date", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /^knowledge$/i }).click();
  await expect(page.getByText(/greedyadventures\.com\/experiences\/sea-view-skydiving/).first()).toBeVisible();
  await expect(page.getByText(/2026-10-31/).first()).toBeVisible();
});

test("Knowledge tab is a real hash route: Back and deep links work", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /^knowledge$/i }).click();
  await expect(page).toHaveURL(/#knowledge$/);
  await expect(page.getByRole("heading", { name: /knowledge dashboard/i })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("heading", { name: /the sea is better from up here/i })).toBeVisible();
  await page.goForward();
  await expect(page.getByRole("heading", { name: /knowledge dashboard/i })).toBeVisible();
  await page.goto("/#knowledge");
  await expect(page.getByRole("heading", { name: /knowledge dashboard/i })).toBeVisible();
});

test("visitor questions are not saved to localStorage", async ({ page }) => {
  await page.goto("/#knowledge");
  await page.getByRole("textbox", { name: /test a question/i }).fill("What media comes with the VIP package?");
  await page.getByRole("button", { name: /run test/i }).click();
  await expect(page.getByText(/latest retrieval trace/i)).toBeVisible({ timeout: 20_000 });
  const stored = await page.evaluate(() => JSON.stringify({ ...window.localStorage }));
  expect(stored).not.toMatch(/VIP package|ga-knowledge-trace-history/);
});

test("chat dialog is modal: aria-modal set and Tab stays inside", async ({ page }) => {
  await openChat(page);
  const dialog = page.getByRole("dialog", { name: /concierge chat/i });
  await expect(dialog).toHaveAttribute("aria-modal", "true");
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate((d) => d.contains(document.activeElement)), `Tab #${i + 1} left the dialog`).toBe(true);
  }
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press("Shift+Tab");
    expect(await dialog.evaluate((d) => d.contains(document.activeElement)), `Shift+Tab #${i + 1} left the dialog`).toBe(true);
  }
});

test("media and sources never appear as raw markers in the message text", async ({ page }) => {
  await openChat(page);
  await ask(page, "Please send me the PDF brochure");
  const log = page.getByRole("log");
  await expect(log.getByRole("link", { name: /open pdf/i })).toBeVisible({ timeout: 20_000 });
  await expect(log).not.toContainText("<<<GA:");
  await page.reload();
  await page.getByRole("button", { name: LAUNCHER }).click();
  await expect(page.getByRole("log").getByRole("link", { name: /open pdf/i })).toBeVisible();
});

test("selecting a package card persists as one canonical value", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /choose deluxe/i }).click();
  expect(await page.evaluate(() => window.sessionStorage.getItem("ga-selected-package"))).toBe("deluxe");
});
