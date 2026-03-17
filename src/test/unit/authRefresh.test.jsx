import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act, cleanup } from "@testing-library/react";
import React from "react";
import AuthProvider, {
  TOKEN_LIFETIME_MS,
  REFRESH_BEFORE_EXPIRY_MS,
} from "../../AuthProvider.jsx";

// ─── Module mocks ─────────────────────────────────────────────────────────────

const mockTriggerSilentRefresh = vi.fn();

vi.mock("@react-oauth/google", () => ({
  useGoogleLogin: vi.fn(() => mockTriggerSilentRefresh),
}));
vi.mock("../../App.jsx", () => ({ default: () => <div data-testid="app" /> }));
vi.mock("../../LoginPage.jsx", () => ({
  default: () => <div data-testid="login" />,
}));
vi.mock("../../apiClient.js", () => ({
  fetchSettings: vi.fn(() => Promise.resolve({})),
  fetchProjects: vi.fn(() => Promise.resolve({ projects: [] })),
}));

// ─── localStorage stub (vi.useFakeTimers clobbers it in vitest 4) ─────────────

let lsStore = {};
const localStorageMock = {
  getItem: (k) => (k in lsStore ? lsStore[k] : null),
  setItem: (k, v) => { lsStore[k] = String(v); },
  removeItem: (k) => { delete lsStore[k]; },
};
vi.stubGlobal("localStorage", localStorageMock);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeUser = (overrides = {}) => ({
  id: "user-1",
  name: "Test User",
  credential: "mock-access-token",
  tokenExpiresAt: Date.now() + TOKEN_LIFETIME_MS,
  ...overrides,
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("AuthProvider — silent token refresh", () => {
  // All setTimeout calls captured during each test
  let capturedTimers;

  beforeEach(() => {
    lsStore = {};
    capturedTimers = [];
    mockTriggerSilentRefresh.mockClear();

    vi.spyOn(globalThis, "setTimeout").mockImplementation((cb, delay) => {
      const id = capturedTimers.length + 1;
      capturedTimers.push({ cb, delay, id });
      return id;
    });
    vi.spyOn(globalThis, "clearTimeout").mockImplementation(vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  // ── Constants ──────────────────────────────────────────────────────────────

  it("exports TOKEN_LIFETIME_MS of 1 hour", () => {
    expect(TOKEN_LIFETIME_MS).toBe(3600 * 1000);
  });

  it("exports REFRESH_BEFORE_EXPIRY_MS of 5 minutes", () => {
    expect(REFRESH_BEFORE_EXPIRY_MS).toBe(5 * 60 * 1000);
  });

  it("refresh fires before token expiry", () => {
    expect(REFRESH_BEFORE_EXPIRY_MS).toBeLessThan(TOKEN_LIFETIME_MS);
  });

  // ── Timer setup ────────────────────────────────────────────────────────────

  it("schedules a refresh timer when a user is authenticated", () => {
    const user = makeUser();
    lsStore["plenum3d_user"] = JSON.stringify(user);

    render(<AuthProvider />);

    // Our refresh timer has a delay close to 55 minutes — very distinct from React internals
    const expectedDelay = TOKEN_LIFETIME_MS - REFRESH_BEFORE_EXPIRY_MS;
    const refreshTimer = capturedTimers.find(
      (t) => Math.abs(t.delay - expectedDelay) < 500
    );
    expect(refreshTimer).toBeDefined();
  });

  it("does not schedule a refresh timer when no user is present", () => {
    render(<AuthProvider />);

    const expectedDelay = TOKEN_LIFETIME_MS - REFRESH_BEFORE_EXPIRY_MS;
    const refreshTimer = capturedTimers.find(
      (t) => Math.abs(t.delay - expectedDelay) < 500
    );
    expect(refreshTimer).toBeUndefined();
  });

  // ── Timer callback ─────────────────────────────────────────────────────────

  it("calls triggerSilentRefresh when the timer fires", () => {
    const user = makeUser();
    lsStore["plenum3d_user"] = JSON.stringify(user);

    render(<AuthProvider />);

    const expectedDelay = TOKEN_LIFETIME_MS - REFRESH_BEFORE_EXPIRY_MS;
    const refreshTimer = capturedTimers.find(
      (t) => Math.abs(t.delay - expectedDelay) < 500
    );
    expect(refreshTimer).toBeDefined();

    act(() => { refreshTimer.cb(); });
    expect(mockTriggerSilentRefresh).toHaveBeenCalledOnce();
  });

  // ── Expiry edge case ───────────────────────────────────────────────────────

  it("clamps delay to 0 when the token is already past its refresh window", () => {
    // tokenExpiresAt is in the past → delay = max(0, negative) = 0
    const user = makeUser({ tokenExpiresAt: Date.now() - 1000 });
    lsStore["plenum3d_user"] = JSON.stringify(user);

    render(<AuthProvider />);

    const zeroTimer = capturedTimers.find((t) => t.delay === 0);
    expect(zeroTimer).toBeDefined();
  });

  // ── Cleanup ────────────────────────────────────────────────────────────────

  it("clears the refresh timer on unmount", () => {
    const user = makeUser();
    lsStore["plenum3d_user"] = JSON.stringify(user);

    const { unmount } = render(<AuthProvider />);

    const expectedDelay = TOKEN_LIFETIME_MS - REFRESH_BEFORE_EXPIRY_MS;
    const refreshTimer = capturedTimers.find(
      (t) => Math.abs(t.delay - expectedDelay) < 500
    );
    expect(refreshTimer).toBeDefined();

    unmount();

    expect(clearTimeout).toHaveBeenCalledWith(refreshTimer.id);
  });
});
