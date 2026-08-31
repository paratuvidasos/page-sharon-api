import { createClerkClient, verifyToken } from "@clerk/backend";
import { ClerkIdentityVerifier, VerifiedClerkIdentity } from "../../domain/ports/ClerkIdentityVerifier";
import { InvalidClerkSessionException } from "../../domain/exceptions/session/InvalidClerkSessionException";

export class ClerkBackendIdentityVerifier implements ClerkIdentityVerifier {
  private readonly clerkClient: ReturnType<typeof createClerkClient>;

  constructor(private readonly secretKey: string) {
    this.clerkClient = createClerkClient({ secretKey });
  }

  async verifySessionToken(sessionToken: string): Promise<VerifiedClerkIdentity> {
    try {
      const claims = await verifyToken(sessionToken, { secretKey: this.secretKey });
      const clerkUser = await this.clerkClient.users.getUser(claims.sub);
      const primaryEmail = clerkUser.emailAddresses.find(
        (candidate) => candidate.id === clerkUser.primaryEmailAddressId,
      );

      if (!primaryEmail || primaryEmail.verification?.status !== "verified") {
        throw new InvalidClerkSessionException();
      }

      return {
        clerkUserId: clerkUser.id,
        email: primaryEmail.emailAddress,
        firstName: clerkUser.firstName ?? "",
        lastName: clerkUser.lastName ?? "",
      };
    } catch (err) {
      if (err instanceof InvalidClerkSessionException) {
        throw err;
      }
      throw new InvalidClerkSessionException();
    }
  }
}
