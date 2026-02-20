import { test, expect } from "@playwright/test";

test.describe("스팟 상세 페이지 (TC-17~TC-19)", () => {
  test("TC-17: 스팟 상세가 정상 표시된다", async ({ page }) => {
    await page.goto("/spots/1");
    await expect(page.locator("h1")).toBeVisible();
    // 주소 등 정보가 표시된다
    await expect(page.locator("text=주소")).toBeVisible();
  });

  test("TC-18: 존재하지 않는 스팟은 404가 된다", async ({ page }) => {
    const res = await page.goto("/spots/99999");
    expect(res?.status()).toBe(404);
  });

  test("TC-19: 관련 스팟이 표시된다", async ({ page }) => {
    await page.goto("/spots/1");
    await expect(page.locator("text=관련 장소")).toBeVisible();
  });
});

test.describe("코스 상세 페이지 (TC-20~TC-21)", () => {
  test("TC-20: 코스 상세 + 스팟 순서가 정상 표시된다", async ({ page }) => {
    await page.goto("/courses/1");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("text=코스 스팟")).toBeVisible();
    // SPOT 01, SPOT 02 등 순서 표시
    await expect(page.locator("text=SPOT 01")).toBeVisible();
    await expect(page.locator("text=SPOT 02")).toBeVisible();
  });

  test("TC-21: 존재하지 않는 코스는 404가 된다", async ({ page }) => {
    const res = await page.goto("/courses/99999");
    expect(res?.status()).toBe(404);
  });
});

test.describe("API 상세 엔드포인트", () => {
  test("스팟 상세 API가 정상 응답한다", async ({ request }) => {
    const res = await request.get("/api/spots/1");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveProperty("name");
    expect(body.data).toHaveProperty("category");
    expect(body.data).toHaveProperty("relatedSpots");
  });

  test("스팟 상세 API 404", async ({ request }) => {
    const res = await request.get("/api/spots/99999");
    expect(res.status()).toBe(404);
  });

  test("코스 상세 API가 정상 응답한다", async ({ request }) => {
    const res = await request.get("/api/courses/1");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveProperty("name");
    expect(body.data).toHaveProperty("courseSpots");
    expect(body.data.courseSpots.length).toBeGreaterThan(0);
  });

  test("코스 상세 API 404", async ({ request }) => {
    const res = await request.get("/api/courses/99999");
    expect(res.status()).toBe(404);
  });
});

test.describe("404 페이지", () => {
  test("Not Found 페이지가 표시된다", async ({ page }) => {
    await page.goto("/nonexistent-page");
    await expect(page.locator("text=페이지를 찾을 수 없습니다")).toBeVisible();
    await expect(page.locator("text=메인으로 돌아가기")).toBeVisible();
  });
});
