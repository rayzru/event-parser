import { Normalizers } from '../src/def';
import Normalizer from '../src/normalizer';

const n = new Normalizer().add(Normalizers);

describe("Normalizer", () => {
  it("Month `mar` normalized to `march`", () => {
    expect(n.normalize("mar")).toBe("march");
  })

  it("Month `Sept.` normalized to `september.`", () => {
    expect(n.normalize("Sept.")).toBe("september.");
  })
})

