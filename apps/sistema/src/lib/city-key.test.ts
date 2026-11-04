import { describe, expect, it } from "vitest";
import { cityKey } from "./city-key";

describe("cityKey", () => {
  it("ignora caixa, espaços e acentos", () => {
    expect(cityKey("Palmas")).toBe("palmas");
    expect(cityKey("  PALMAS ")).toBe("palmas");
    expect(cityKey("Araguaína")).toBe(cityKey("araguaina"));
    expect(cityKey("Porto   Nacional")).toBe("porto nacional");
  });

  it("cidade vazia ou ausente vira chave vazia", () => {
    expect(cityKey(null)).toBe("");
    expect(cityKey(undefined)).toBe("");
    expect(cityKey("   ")).toBe("");
  });
});
