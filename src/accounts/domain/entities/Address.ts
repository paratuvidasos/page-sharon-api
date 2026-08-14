export interface AddressProps {
  id: string;
  label: string | null;
  recipientName: string;
  phone: string;
  countryCode: string;
  stateProvince: string;
  city: string;
  postalCode: string;
  streetLine1: string;
  streetLine2: string | null;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
}

export class Address {
  private constructor(private props: AddressProps) {}

  static create(props: AddressProps): Address {
    return new Address(props);
  }

  get id(): string {
    return this.props.id;
  }

  get isDefaultShipping(): boolean {
    return this.props.isDefaultShipping;
  }

  get isDefaultBilling(): boolean {
    return this.props.isDefaultBilling;
  }

  toProps(): AddressProps {
    return { ...this.props };
  }
}
