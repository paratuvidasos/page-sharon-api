import { afterEach, describe, expect, it, vi } from "vitest";
import { HttpTrack123Provider } from "./HttpTrack123Provider";

const apiSecret = process.env.TRACK123_API_SECRET;

/**
 * Test de integración contra la API real de Track123: si el contrato de
 * `query-realtime` cambia (nombres de campo, forma de la respuesta), este
 * test avisa primero, antes que un usuario real. Se salta si no hay
 * `TRACK123_API_SECRET` en el entorno (CI, o una máquina sin la credencial).
 */
describe.skipIf(!apiSecret)("HttpTrack123Provider (integración real)", () => {
  it(
    "query() no lanza y devuelve un resultado con status UNKNOWN para una guía que no existe",
    async () => {
      const provider = new HttpTrack123Provider({
        apiSecret: apiSecret as string,
        courierCode: "inter-rapidisimo-inter-rapidsimo",
        timeoutMs: 8000,
      });

      const result = await provider.query({
        trackingNumber: "NO-EXISTE-1234567890",
        carrierCode: "inter-rapidisimo-inter-rapidsimo",
      });

      expect(result).not.toBeNull();
      expect(result?.status).toBe("UNKNOWN");
    },
    10000,
  );
});

describe("HttpTrack123Provider (mapeo mockeado)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("query() devuelve null cuando la respuesta no trae data.accepted", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ code: "00000", data: {} }),
      }),
    );

    const provider = new HttpTrack123Provider({
      apiSecret: "fake-secret",
      courierCode: "inter-rapidisimo-inter-rapidsimo",
      timeoutMs: 8000,
    });

    const result = await provider.query({
      trackingNumber: "ANY-NUMBER",
      carrierCode: "inter-rapidisimo-inter-rapidsimo",
    });

    expect(result).toBeNull();
  });
});
