import { describe, expect, it } from "vitest";
import { sniffImage } from "./images";

describe("sniffImage", () => {
  it("reconoce JPG, PNG y WEBP por sus primeros bytes", () => {
    expect(sniffImage(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))?.ext).toBe("jpg");
    expect(sniffImage(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))?.ext).toBe("png");
    const webp = new TextEncoder().encode("RIFF0000WEBPVP8 ");
    expect(sniffImage(webp)?.ext).toBe("webp");
  });

  it("rechaza una página HTML con extensión de imagen", () => {
    expect(sniffImage(new TextEncoder().encode("<!doctype html><html>"))).toBeNull();
  });
});
