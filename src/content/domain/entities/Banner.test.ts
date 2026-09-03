import { describe, expect, it } from "vitest";
import { BannerActionType } from "../enums/BannerActionType";
import { BannerCategory } from "../enums/BannerCategory";
import { BannerPlacement } from "../enums/BannerPlacement";
import { InvalidBannerException } from "../exceptions/InvalidBannerException";
import { Banner } from "./Banner";

function createBanner(overrides: Partial<Parameters<typeof Banner.create>[0]> = {}) {
  return Banner.create({
    id: "banner-1",
    imageUrl: "https://cdn.example.com/banner.jpg",
    title: "Promo de verano",
    sortOrder: 0,
    category: BannerCategory.PROMOCION,
    actionType: BannerActionType.COMPRAR,
    placements: [BannerPlacement.HOME_SECTION],
    ...overrides,
  });
}

describe("Banner.create", () => {
  it("rechaza un título vacío", () => {
    expect(() => createBanner({ title: "   " })).toThrow(InvalidBannerException);
  });

  it("rechaza endsAt anterior o igual a startsAt", () => {
    const startsAt = new Date("2026-06-01T00:00:00.000Z");
    expect(() => createBanner({ startsAt, endsAt: startsAt })).toThrow(InvalidBannerException);
    expect(() =>
      createBanner({ startsAt, endsAt: new Date("2026-05-01T00:00:00.000Z") }),
    ).toThrow(InvalidBannerException);
  });

  it("acepta una ventana de fechas válida", () => {
    const banner = createBanner({
      startsAt: new Date("2026-06-01T00:00:00.000Z"),
      endsAt: new Date("2026-06-30T00:00:00.000Z"),
    });
    expect(banner.id).toBe("banner-1");
  });

  it("nace activo por defecto", () => {
    expect(createBanner().toProps().isActive).toBe(true);
  });

  it("rechaza un placements vacío", () => {
    expect(() => createBanner({ placements: [] })).toThrow(InvalidBannerException);
  });
});

describe("Banner.update", () => {
  it("valida la ventana de fechas combinando lo nuevo con lo existente", () => {
    const banner = createBanner({ startsAt: new Date("2026-06-01T00:00:00.000Z") });

    expect(() => banner.update({ endsAt: new Date("2026-05-01T00:00:00.000Z") })).toThrow(
      InvalidBannerException,
    );
  });

  it("rechaza vaciar placements en un update", () => {
    const banner = createBanner();
    expect(() => banner.update({ placements: [] })).toThrow(InvalidBannerException);
  });

  it("deja placements sin tocar cuando no se manda en el update", () => {
    const banner = createBanner({ placements: [BannerPlacement.WELCOME_MODAL] });
    banner.update({ title: "Nuevo título" });
    expect(banner.toProps().placements).toEqual([BannerPlacement.WELCOME_MODAL]);
  });
});

describe("Banner.reorder", () => {
  it("cambia el sortOrder sin tocar el resto de los campos", () => {
    const banner = createBanner({ sortOrder: 0 });
    banner.reorder(3);

    expect(banner.toProps().sortOrder).toBe(3);
    expect(banner.toProps().title).toBe("Promo de verano");
  });
});
