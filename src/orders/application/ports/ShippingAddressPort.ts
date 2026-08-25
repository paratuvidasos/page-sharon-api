export interface ResolvedAddress {
  id: string;
  recipientName: string;
  phone: string;
  countryCode: string;
  stateProvince: string;
  city: string;
  postalCode: string;
  line1: string;
  line2: string | null;
}

/**
 * [0033]: resuelve una dirección guardada del usuario. Lo implementa
 * `accounts` con `GetAddressById`.
 */
export interface ShippingAddressPort {
  execute(input: { userId: string; addressId: string }): Promise<ResolvedAddress>;
}
