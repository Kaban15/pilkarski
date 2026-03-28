import { shouldSendEmail, _resetThrottle } from "@/lib/email-throttle";
import { beforeEach, describe, it, expect } from "vitest";

beforeEach(() => {
  _resetThrottle();
});

describe("shouldSendEmail", () => {
  it("allows first send", () => {
    expect(shouldSendEmail("user-1", "message")).toBe(true);
  });

  it("blocks rapid second send for same user+type", () => {
    shouldSendEmail("user-1", "message");
    expect(shouldSendEmail("user-1", "message")).toBe(false);
  });

  it("allows different users", () => {
    shouldSendEmail("user-1", "message");
    expect(shouldSendEmail("user-2", "message")).toBe(true);
  });

  it("allows different types for same user", () => {
    shouldSendEmail("user-1", "message");
    expect(shouldSendEmail("user-1", "sparing")).toBe(true);
  });
});
