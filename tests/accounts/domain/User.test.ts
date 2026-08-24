import { describe, expect, it } from "vitest";
import { UserStatus } from "../../../src/accounts/domain/enums/UserStatus";
import { Email } from "../../../src/accounts/domain/value-objects/Email";
import { buildAddress, buildUser } from "./fixtures";

describe("User", () => {
  describe("estado y verificación", () => {
    it("isActive() es true solo con status ACTIVE", () => {
      expect(buildUser({ status: UserStatus.ACTIVE }).isActive()).toBe(true);
      expect(buildUser({ status: UserStatus.SUSPENDED }).isActive()).toBe(false);
      expect(buildUser({ status: UserStatus.INACTIVE }).isActive()).toBe(false);
      expect(buildUser({ status: UserStatus.DELETED }).isActive()).toBe(false);
    });

    it("isEmailVerified() refleja emailVerifiedAt", () => {
      expect(buildUser({ emailVerifiedAt: null }).isEmailVerified()).toBe(false);
      expect(buildUser({ emailVerifiedAt: new Date() }).isEmailVerified()).toBe(true);
    });

    it("markEmailAsVerified() setea emailVerifiedAt a la fecha dada", () => {
      const user = buildUser({ emailVerifiedAt: null });
      const now = new Date("2026-01-01T00:00:00.000Z");
      user.markEmailAsVerified(now);
      expect(user.toProps().emailVerifiedAt).toEqual(now);
      expect(user.isEmailVerified()).toBe(true);
    });
  });

  describe("bloqueo por intentos fallidos", () => {
    it("isLockedOut() es false sin lockedUntil", () => {
      expect(buildUser({ lockedUntil: null }).isLockedOut()).toBe(false);
    });

    it("isLockedOut() es true si lockedUntil es futuro respecto a `now`", () => {
      const user = buildUser({ lockedUntil: new Date("2026-01-10T00:00:00.000Z") });
      expect(user.isLockedOut(new Date("2026-01-01T00:00:00.000Z"))).toBe(true);
    });

    it("isLockedOut() es false si lockedUntil ya pasó respecto a `now`", () => {
      const user = buildUser({ lockedUntil: new Date("2026-01-01T00:00:00.000Z") });
      expect(user.isLockedOut(new Date("2026-01-10T00:00:00.000Z"))).toBe(false);
    });

    it("recordFailedLoginAttempt() incrementa el contador", () => {
      const user = buildUser({ failedLoginAttempts: 2 });
      user.recordFailedLoginAttempt();
      expect(user.failedLoginAttempts).toBe(3);
    });

    it("lockUntil() setea la fecha de bloqueo", () => {
      const user = buildUser();
      const until = new Date("2026-02-01T00:00:00.000Z");
      user.lockUntil(until);
      expect(user.lockedUntil).toEqual(until);
    });

    it("resetFailedLoginAttempts() vuelve el contador a 0 y limpia el bloqueo", () => {
      const user = buildUser({ failedLoginAttempts: 5, lockedUntil: new Date() });
      user.resetFailedLoginAttempts();
      expect(user.failedLoginAttempts).toBe(0);
      expect(user.lockedUntil).toBeNull();
    });

    it("changePassword() también levanta el bloqueo por intentos fallidos", () => {
      const user = buildUser({ failedLoginAttempts: 5, lockedUntil: new Date() });
      user.changePassword("new-hash");
      expect(user.toProps().passwordHash).toBe("new-hash");
      expect(user.failedLoginAttempts).toBe(0);
      expect(user.lockedUntil).toBeNull();
    });
  });

  describe("perfil", () => {
    it("updateProfile() actualiza nombre/apellido/teléfono/avatar pero no el email", () => {
      const user = buildUser({ firstName: "Ana", lastName: "Ruiz" });
      const originalEmail = user.email;

      user.updateProfile({
        firstName: "Ana María",
        lastName: "Ruiz Gómez",
        phone: "+573001112233",
        avatarUrl: "https://example.com/avatar.png",
      });

      const props = user.toProps();
      expect(props.firstName).toBe("Ana María");
      expect(props.lastName).toBe("Ruiz Gómez");
      expect(props.phone).toBe("+573001112233");
      expect(props.avatarUrl).toBe("https://example.com/avatar.png");
      expect(user.email).toBe(originalEmail);
    });
  });

  describe("anonymize", () => {
    it("reemplaza los datos identificables y marca el status como DELETED", () => {
      const user = buildUser({
        firstName: "Ana",
        lastName: "Ruiz",
        phone: "+573001234567",
        avatarUrl: "https://example.com/avatar.png",
      });
      const anonymizedEmail = Email.create(`deleted-${user.id}@sharon.invalid`);

      user.anonymize(anonymizedEmail, "unusable-hash");

      const props = user.toProps();
      expect(props.email).toBe(anonymizedEmail);
      expect(props.passwordHash).toBe("unusable-hash");
      expect(props.firstName).toBe("Usuario");
      expect(props.lastName).toBe("eliminado");
      expect(props.phone).toBeNull();
      expect(props.avatarUrl).toBeNull();
      expect(props.status).toBe(UserStatus.DELETED);
    });
  });

  describe("direcciones", () => {
    it("addAddress()/findAddressById() agregan y encuentran por id", () => {
      const user = buildUser({ addresses: [] });
      const address = buildAddress({ id: "addr-1" });
      user.addAddress(address);

      expect(user.findAddressById("addr-1")).toBe(address);
      expect(user.findAddressById("no-existe")).toBeUndefined();
      expect(user.addresses).toHaveLength(1);
    });

    it("removeAddress() la quita de la lista", () => {
      const user = buildUser({ addresses: [buildAddress({ id: "addr-1" }), buildAddress({ id: "addr-2" })] });
      user.removeAddress("addr-1");
      expect(user.addresses.map((a) => a.id)).toEqual(["addr-2"]);
    });

    it("hasActiveAddresses() ignora las archivadas", () => {
      const onlyArchived = buildUser({ addresses: [buildAddress({ isArchived: true })] });
      expect(onlyArchived.hasActiveAddresses()).toBe(false);

      const withActive = buildUser({
        addresses: [buildAddress({ isArchived: true }), buildAddress({ id: "addr-2", isArchived: false })],
      });
      expect(withActive.hasActiveAddresses()).toBe(true);
    });

    it("setDefaultShippingAddress() marca una y desmarca las demás", () => {
      const a1 = buildAddress({ id: "addr-1", isDefaultShipping: true });
      const a2 = buildAddress({ id: "addr-2", isDefaultShipping: false });
      const user = buildUser({ addresses: [a1, a2] });

      user.setDefaultShippingAddress("addr-2");

      expect(user.findAddressById("addr-1")!.isDefaultShipping).toBe(false);
      expect(user.findAddressById("addr-2")!.isDefaultShipping).toBe(true);
    });

    it("promoteFirstActiveAddressToDefault() promueve la primera dirección no archivada", () => {
      const archived = buildAddress({ id: "addr-1", isArchived: true });
      const active = buildAddress({ id: "addr-2", isArchived: false, isDefaultShipping: false });
      const user = buildUser({ addresses: [archived, active] });

      user.promoteFirstActiveAddressToDefault();

      expect(user.findAddressById("addr-2")!.isDefaultShipping).toBe(true);
    });

    it("promoteFirstActiveAddressToDefault() no falla si no queda ninguna activa", () => {
      const user = buildUser({ addresses: [buildAddress({ isArchived: true })] });
      expect(() => user.promoteFirstActiveAddressToDefault()).not.toThrow();
    });
  });

  describe("toProps", () => {
    it("devuelve una copia independiente del array de direcciones", () => {
      const user = buildUser({ addresses: [buildAddress({ id: "addr-1" })] });
      const props = user.toProps();
      props.addresses.push(buildAddress({ id: "addr-2" }));
      expect(user.addresses).toHaveLength(1);
    });
  });
});
