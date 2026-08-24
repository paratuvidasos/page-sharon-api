import { vi } from "vitest";
import { User } from "../../../src/accounts/domain/entities/User";
import { Address } from "../../../src/accounts/domain/entities/addresses/Address";
import { PasswordResetToken } from "../../../src/accounts/domain/entities/password-reset/PasswordResetToken";
import { EmailVerificationToken } from "../../../src/accounts/domain/entities/registration/EmailVerificationToken";
import { RefreshToken } from "../../../src/accounts/domain/entities/session/RefreshToken";
import { Email } from "../../../src/accounts/domain/value-objects/Email";
import { UserRepository } from "../../../src/accounts/domain/repositories/UserRepository";
import { PasswordResetTokenRepository } from "../../../src/accounts/domain/repositories/password-reset/PasswordResetTokenRepository";
import { EmailVerificationTokenRepository } from "../../../src/accounts/domain/repositories/registration/EmailVerificationTokenRepository";
import { RefreshTokenRepository } from "../../../src/accounts/domain/repositories/session/RefreshTokenRepository";
import { PasswordHasher } from "../../../src/accounts/domain/ports/PasswordHasher";
import { EmailSender } from "../../../src/shared-kernel/domain/ports/EmailSender";
import { AccessTokenPayload, TokenService } from "../../../src/shared-kernel/domain/ports/TokenService";
import { DomainEventPublisher } from "../../../src/shared-kernel/domain/ports/DomainEventPublisher";
import { FileStorage, StoredFile } from "../../../src/shared-kernel/domain/ports/FileStorage";

/**
 * Dobles de prueba en memoria para los puertos de `accounts`, reusados por
 * todos los tests de casos de uso (application layer con puertos
 * mockeados, ver sección "Testing" del CLAUDE.md del repo). Cada método es
 * un `vi.fn(...)` con comportamiento real en memoria, así que los tests
 * pueden tanto ejercer la lógica de negocio como aserir sobre las llamadas.
 */

export interface FakeUserRepository extends UserRepository {
  seed(user: User): void;
  isSoftDeleted(userId: string): boolean;
}

export function createFakeUserRepository(seed: User[] = []): FakeUserRepository {
  const usersById = new Map(seed.map((user) => [user.id, user]));
  const deletedIds = new Set<string>();

  return {
    save: vi.fn(async (user: User) => {
      usersById.set(user.id, user);
    }),
    findById: vi.fn(async (id: string) => {
      if (deletedIds.has(id)) return null;
      return usersById.get(id) ?? null;
    }),
    findByEmail: vi.fn(async (email: Email) => {
      for (const user of usersById.values()) {
        if (!deletedIds.has(user.id) && user.email.equals(email)) return user;
      }
      return null;
    }),
    deleteAddress: vi.fn(async (_addressId: string) => {}),
    deleteAllAddresses: vi.fn(async (_userId: string) => {}),
    softDelete: vi.fn(async (userId: string) => {
      deletedIds.add(userId);
    }),
    seed(user: User) {
      usersById.set(user.id, user);
    },
    isSoftDeleted(userId: string) {
      return deletedIds.has(userId);
    },
  };
}

function createInMemoryExpiringTokenRepo<T extends { id: string; toProps(): { tokenHash: string } }>(
  seed: T[] = [],
) {
  const byId = new Map(seed.map((token) => [token.id, token]));

  return {
    byId,
    save: vi.fn(async (token: T) => {
      byId.set(token.id, token);
    }),
    findByTokenHash: vi.fn(async (tokenHash: string) => {
      for (const token of byId.values()) {
        if (token.toProps().tokenHash === tokenHash) return token;
      }
      return null;
    }),
    invalidateActiveByUserId: vi.fn(async (_userId: string) => {}),
  };
}

export type FakePasswordResetTokenRepository = ReturnType<
  typeof createInMemoryExpiringTokenRepo<PasswordResetToken>
> &
  PasswordResetTokenRepository;

export function createFakePasswordResetTokenRepository(
  seed: PasswordResetToken[] = [],
): FakePasswordResetTokenRepository {
  return createInMemoryExpiringTokenRepo(seed) as FakePasswordResetTokenRepository;
}

export type FakeEmailVerificationTokenRepository = ReturnType<
  typeof createInMemoryExpiringTokenRepo<EmailVerificationToken>
> &
  EmailVerificationTokenRepository;

export function createFakeEmailVerificationTokenRepository(
  seed: EmailVerificationToken[] = [],
): FakeEmailVerificationTokenRepository {
  return createInMemoryExpiringTokenRepo(seed) as FakeEmailVerificationTokenRepository;
}

export interface FakeRefreshTokenRepository extends RefreshTokenRepository {
  byId: Map<string, RefreshToken>;
}

export function createFakeRefreshTokenRepository(seed: RefreshToken[] = []): FakeRefreshTokenRepository {
  const byId = new Map(seed.map((token) => [token.id, token]));

  return {
    byId,
    save: vi.fn(async (token: RefreshToken) => {
      byId.set(token.id, token);
    }),
    findByTokenHash: vi.fn(async (tokenHash: string) => {
      for (const token of byId.values()) {
        if (token.toProps().tokenHash === tokenHash) return token;
      }
      return null;
    }),
    revokeAllForUser: vi.fn(async (_userId: string) => {}),
  };
}

/** hash determinista y reversible: evita depender de bcrypt real en tests. */
export function createFakePasswordHasher(overrides: Partial<PasswordHasher> = {}): PasswordHasher {
  return {
    hash: vi.fn(async (plain: string) => `hashed:${plain}`),
    compare: vi.fn(async (plain: string, hash: string) => hash === `hashed:${plain}`),
    ...overrides,
  };
}

export function createFakeEmailSender(overrides: Partial<EmailSender> = {}): EmailSender {
  return {
    send: vi.fn(async () => {}),
    ...overrides,
  };
}

export function createFakeTokenService(overrides: Partial<TokenService> = {}): TokenService {
  return {
    signAccessToken: vi.fn((payload: AccessTokenPayload, _ttlSeconds: number) => `access-token-for-${payload.sub}`),
    verifyAccessToken: vi.fn(() => {
      throw new Error("createFakeTokenService: verifyAccessToken no está implementado en el doble de prueba");
    }),
    ...overrides,
  };
}

export function createFakeDomainEventPublisher(): DomainEventPublisher {
  return { publish: vi.fn(async () => {}) };
}

export function createFakeFileStorage(overrides: Partial<FileStorage> = {}): FileStorage {
  return {
    save: vi.fn(async (): Promise<StoredFile> => ({ url: "https://cdn.example.com/avatars/uploaded.png" })),
    ...overrides,
  };
}

export { Address };
