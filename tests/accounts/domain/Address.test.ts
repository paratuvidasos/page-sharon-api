import { describe, expect, it } from "vitest";
import { buildAddress } from "./fixtures";

describe("Address", () => {
  it("update() reemplaza todos los campos editables", () => {
    const address = buildAddress({ label: "Casa" });

    address.update({
      label: "Oficina",
      recipientName: "Otro Nombre",
      phone: "+573009998877",
      countryCode: "CO",
      stateProvince: "Antioquia",
      city: "Medellín",
      postalCode: "050001",
      streetLine1: "Carrera 1 #2-3",
      streetLine2: "Piso 4",
    });

    const props = address.toProps();
    expect(props.label).toBe("Oficina");
    expect(props.city).toBe("Medellín");
    expect(props.streetLine2).toBe("Piso 4");
  });

  it("markAsDefaultShipping()/unmarkAsDefaultShipping() alternan el flag", () => {
    const address = buildAddress({ isDefaultShipping: false });
    address.markAsDefaultShipping();
    expect(address.isDefaultShipping).toBe(true);
    address.unmarkAsDefaultShipping();
    expect(address.isDefaultShipping).toBe(false);
  });

  it("archive() marca isArchived y retira isDefaultShipping", () => {
    const address = buildAddress({ isDefaultShipping: true, isArchived: false });
    address.archive();
    expect(address.isArchived).toBe(true);
    expect(address.isDefaultShipping).toBe(false);
  });

  it("restore() revierte isArchived", () => {
    const address = buildAddress({ isArchived: true });
    address.restore();
    expect(address.isArchived).toBe(false);
  });

  it("toProps() devuelve una copia (no la misma referencia)", () => {
    const address = buildAddress();
    const props = address.toProps();
    props.label = "Mutado";
    expect(address.toProps().label).not.toBe("Mutado");
  });
});
