export interface VerifiedClerkIdentity {
  clerkUserId: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface ClerkIdentityVerifier {
  /**
   * Verifica del lado del servidor el session token que Clerk emitió en el
   * frontend tras el login con Google, y devuelve la identidad ya
   * confirmada (email verificado por Google incluido).
   */
  verifySessionToken(sessionToken: string): Promise<VerifiedClerkIdentity>;
}
