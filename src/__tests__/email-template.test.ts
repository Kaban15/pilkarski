import { renderEmailHtml } from "@/lib/email-template";

describe("renderEmailHtml", () => {
  it("renders complete HTML with all params", () => {
    const html = renderEmailHtml("Tytuł", "Treść wiadomości", "Kliknij", "https://example.com");
    expect(html).toContain("Tytuł");
    expect(html).toContain("Treść wiadomości");
    expect(html).toContain("Kliknij");
    expect(html).toContain("https://example.com");
    expect(html).toContain("PilkaSport");
    expect(html).toContain("<!DOCTYPE html>");
  });

  it("escapes HTML in params", () => {
    const html = renderEmailHtml("<script>alert(1)</script>", "a&b", "ok", "https://x.com");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("a&amp;b");
  });

  it("includes PS logo and violet gradient", () => {
    const html = renderEmailHtml("T", "M", "C", "https://x.com");
    expect(html).toContain("#7c3aed");
    expect(html).toContain("PS");
  });
});
