import { getFieldErrors } from "@/lib/form-errors";
import { z } from "zod/v4";

describe("getFieldErrors", () => {
  it("parses ZodError into field→message map", () => {
    const schema = z.object({ name: z.string().min(1), age: z.number().min(0) });
    const result = schema.safeParse({ name: "", age: -1 });
    if (result.success) throw new Error("Should fail");
    const errors = getFieldErrors(result.error);
    expect(errors.name).toBeTruthy();
    expect(errors.age).toBeTruthy();
  });

  it("returns first error per field", () => {
    const schema = z.object({ email: z.string().min(1).email() });
    const result = schema.safeParse({ email: "" });
    if (result.success) throw new Error("Should fail");
    const errors = getFieldErrors(result.error);
    expect(typeof errors.email).toBe("string");
  });
});
