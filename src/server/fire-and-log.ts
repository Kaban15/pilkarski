/**
 * Fire-and-forget with error logging.
 * Use instead of .catch(() => {}) to avoid silent failures.
 */
export function fireAndLog<T>(promise: Promise<T>, context: string): void {
  promise.catch((err) => console.error(`[${context}]`, err));
}
