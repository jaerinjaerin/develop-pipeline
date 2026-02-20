import { test, expect } from "@playwright/test";

test.describe("S1: Hero Section", () => {
  test("Hero 콘텐츠가 정상 표시된다", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("DISCOVER");
    await expect(page.getByRole("emphasis")).toContainText("GANGNAM");
    await expect(page.locator("text=코스 추천받기")).toBeVisible();
    await expect(page.locator("text=영상 보기")).toBeVisible();
  });

  test("Header 스크롤 시 배경 변경된다", async ({ page }) => {
    await page.goto("/");
    const header = page.locator("header");
    // 초기: 투명 배경
    await expect(header).not.toHaveClass(/bg-black/);
    // 스크롤
    await page.evaluate(() => window.scrollTo(0, 100));
    await page.waitForTimeout(500);
    // 스크롤 후: 배경 적용
    await expect(header).toHaveClass(/bg-black/);
  });

  test("통계 카드가 3개 표시된다", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("150+")).toBeVisible();
    await expect(page.getByText("50+", { exact: true })).toBeVisible();
    await expect(page.getByText("365")).toBeVisible();
  });
});

test.describe("S2: Now in Gangnam (TC-01~TC-04)", () => {
  test("TC-01: 오전 탭이 기본 활성이다", async ({ page }) => {
    await page.goto("/");
    await page.locator("#now").scrollIntoViewIfNeeded();
    const morningTab = page.locator("button", { hasText: "오전" });
    await expect(morningTab).toHaveClass(/text-\[var\(--primary\)\]/);
  });

  test("TC-02: 오후 탭 클릭 시 전환된다", async ({ page }) => {
    await page.goto("/");
    await page.locator("#now").scrollIntoViewIfNeeded();
    await page.locator("button", { hasText: "오후" }).click();
    const afternoonTab = page.locator("button", { hasText: "오후" });
    await expect(afternoonTab).toHaveClass(/text-\[var\(--primary\)\]/);
  });

  test("TC-03: 저녁 탭 클릭 시 전환된다", async ({ page }) => {
    await page.goto("/");
    await page.locator("#now").scrollIntoViewIfNeeded();
    await page.locator("button", { hasText: "저녁" }).click();
    const eveningTab = page.locator("button", { hasText: "저녁" });
    await expect(eveningTab).toHaveClass(/text-\[var\(--primary\)\]/);
  });
});

test.describe("S3: Hot Places (TC-05~TC-06)", () => {
  test("TC-05: 핫플레이스 4개가 표시된다", async ({ page }) => {
    await page.goto("/");
    await page.locator("#hot").scrollIntoViewIfNeeded();
    const panels = page.locator("#hot > div");
    await expect(panels).toHaveCount(4);
  });

  test("TC-05: 핫플레이스 이름이 표시된다", async ({ page }) => {
    await page.goto("/");
    await page.locator("#hot").scrollIntoViewIfNeeded();
    await expect(page.locator("#hot").locator("text=코엑스 별마당 도서관")).toBeVisible();
    await expect(page.locator("#hot").locator("text=봉은사 야경")).toBeVisible();
  });
});

test.describe("S4: Theme Travel (TC-09~TC-10)", () => {
  test("TC-09: 코스 4개가 표시된다", async ({ page }) => {
    await page.goto("/");
    await page.locator("#theme").scrollIntoViewIfNeeded();
    await expect(page.locator("#theme").locator("text=K-POP 성지순례")).toBeVisible();
    await expect(page.locator("#theme").locator("text=강남 미식 투어")).toBeVisible();
    await expect(page.locator("#theme").locator("text=K-뷰티 체험 코스")).toBeVisible();
    await expect(page.locator("#theme").locator("text=강남 둘레길 트레킹")).toBeVisible();
  });

  test("TC-10: 코스 클릭 시 상세 페이지로 이동한다", async ({ page }) => {
    await page.goto("/");
    await page.locator("#theme").scrollIntoViewIfNeeded();
    await page.locator("#theme a").first().click();
    await page.waitForURL(/\/courses\/\d+/);
    await expect(page).toHaveURL(/\/courses\/\d+/);
  });
});

test.describe("S5: Influencer (TC-12)", () => {
  test("TC-12: 인플루언서 2명이 교대 배치로 표시된다", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=김서현")).toBeVisible();
    await expect(page.locator("text=Alex Kim")).toBeVisible();
  });
});

test.describe("S6: Festival (TC-14)", () => {
  test("TC-14: 피처드 축제 + 예정 축제가 표시된다", async ({ page }) => {
    await page.goto("/");
    await page.locator("#festival").scrollIntoViewIfNeeded();
    await expect(page.locator("#festival").locator("text=GANGNAM FESTIVAL")).toBeVisible();
    await expect(page.locator("#festival").locator("text=COMING SOON")).toBeVisible();
  });
});

test.describe("S7: Gallery", () => {
  test("갤러리 아이템이 표시된다", async ({ page }) => {
    await page.goto("/");
    await page.locator("#gallery").scrollIntoViewIfNeeded();
    await expect(page.locator("#gallery").locator("text=강남을")).toBeVisible();
    await expect(page.locator("#gallery").locator("text=보다")).toBeVisible();
  });
});

test.describe("API Health", () => {
  test("Health check가 200을 반환한다", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.db).toBe("connected");
  });

  test("Categories API가 3개를 반환한다", async ({ request }) => {
    const res = await request.get("/api/categories");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(3);
  });

  test("Spots API가 데이터를 반환한다", async ({ request }) => {
    const res = await request.get("/api/spots");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.count).toBeGreaterThan(0);
  });

  test("Courses API가 4개를 반환한다", async ({ request }) => {
    const res = await request.get("/api/courses");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(4);
  });

  test("Festivals API가 데이터를 반환한다", async ({ request }) => {
    const res = await request.get("/api/festivals");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.count).toBeGreaterThan(0);
  });
});
