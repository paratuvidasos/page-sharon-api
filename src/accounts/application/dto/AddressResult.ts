import { Address } from "../../domain/entities/addresses/Address";

export interface AddressResult {
  id: string;
  alias: string;
  recipientName: string;
  phone: string;
  countryCode: string;
  stateProvince: string;
  city: string;
  postalCode: string;
  line1: string;
  line2: string | null;
  isDefault: boolean;
  archived: boolean;
}

export function toAddressResult(address: Address): AddressResult {
  const props = address.toProps();
  return {
    id: props.id,
    alias: props.label,
    recipientName: props.recipientName,
    phone: props.phone,
    countryCode: props.countryCode,
    stateProvince: props.stateProvince,
    city: props.city,
    postalCode: props.postalCode,
    line1: props.streetLine1,
    line2: props.streetLine2,
    isDefault: props.isDefaultShipping,
    archived: props.isArchived,
  };
}
