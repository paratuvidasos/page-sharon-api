export interface AddressProps {
  id: string;
  label: string;
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
  isArchived: boolean;
}

export interface AddressFields {
  label: string;
  recipientName: string;
  phone: string;
  countryCode: string;
  stateProvince: string;
  city: string;
  postalCode: string;
  streetLine1: string;
  streetLine2: string | null;
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

  get isArchived(): boolean {
    return this.props.isArchived;
  }

  update(fields: AddressFields): void {
    this.props.label = fields.label;
    this.props.recipientName = fields.recipientName;
    this.props.phone = fields.phone;
    this.props.countryCode = fields.countryCode;
    this.props.stateProvince = fields.stateProvince;
    this.props.city = fields.city;
    this.props.postalCode = fields.postalCode;
    this.props.streetLine1 = fields.streetLine1;
    this.props.streetLine2 = fields.streetLine2;
  }

  markAsDefaultShipping(): void {
    this.props.isDefaultShipping = true;
  }

  unmarkAsDefaultShipping(): void {
    this.props.isDefaultShipping = false;
  }

  /**
   * Archivar quita la dirección de la lista activa y le retira el estado de
   * predeterminada — una dirección archivada no puede seguir siendo la que
   * se usa por defecto en un pedido nuevo.
   */
  archive(): void {
    this.props.isArchived = true;
    this.props.isDefaultShipping = false;
  }

  restore(): void {
    this.props.isArchived = false;
  }

  toProps(): AddressProps {
    return { ...this.props };
  }
}
