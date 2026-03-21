import type { ZodError } from "zod/v4";

export type FieldErrors = Record<string, string>;

export function getFieldErrors(error: ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (key && !errors[key]) {
      errors[key] = issue.message;
    }
  }
  return errors;
}
