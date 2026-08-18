import { Request, Response } from "express";
import { AddAddress } from "../../../application/use-cases/addresses/AddAddress";
import { ArchiveAddress } from "../../../application/use-cases/addresses/ArchiveAddress";
import { DeleteAddress } from "../../../application/use-cases/addresses/DeleteAddress";
import { ListAddresses } from "../../../application/use-cases/addresses/ListAddresses";
import { RestoreAddress } from "../../../application/use-cases/addresses/RestoreAddress";
import { SetDefaultShippingAddress } from "../../../application/use-cases/addresses/SetDefaultShippingAddress";
import { UpdateAddress } from "../../../application/use-cases/addresses/UpdateAddress";
import { UnauthorizedException } from "../../../../shared-kernel/domain/exceptions/UnauthorizedException";
import "../schemas/addresses/address-actions.schema";
import { AddressIdParamsSchema } from "../schemas/addresses/address-response.schema";
import { CreateAddressRequestSchema } from "../schemas/addresses/create-address.schema";
import "../schemas/addresses/list-addresses.schema";
import { UpdateAddressRequestSchema } from "../schemas/addresses/update-address.schema";

export class AddressesController {
  constructor(
    private readonly addAddress: AddAddress,
    private readonly listAddresses: ListAddresses,
    private readonly updateAddress: UpdateAddress,
    private readonly deleteAddress: DeleteAddress,
    private readonly setDefaultShippingAddress: SetDefaultShippingAddress,
    private readonly archiveAddress: ArchiveAddress,
    private readonly restoreAddress: RestoreAddress,
  ) {}

  private requireUserId(req: Request): string {
    if (!req.authUser) {
      throw new UnauthorizedException();
    }
    return req.authUser.sub;
  }

  create = async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const input = CreateAddressRequestSchema.parse(req.body);
    const result = await this.addAddress.execute({ userId, ...input });
    res.status(201).json(result);
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const result = await this.listAddresses.execute({ userId });
    res.status(200).json(result);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const { addressId } = AddressIdParamsSchema.parse(req.params);
    const input = UpdateAddressRequestSchema.parse(req.body);
    const result = await this.updateAddress.execute({ userId, addressId, ...input });
    res.status(200).json(result);
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const { addressId } = AddressIdParamsSchema.parse(req.params);
    await this.deleteAddress.execute({ userId, addressId });
    res.status(204).send();
  };

  setDefault = async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const { addressId } = AddressIdParamsSchema.parse(req.params);
    const result = await this.setDefaultShippingAddress.execute({ userId, addressId });
    res.status(200).json(result);
  };

  archive = async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const { addressId } = AddressIdParamsSchema.parse(req.params);
    const result = await this.archiveAddress.execute({ userId, addressId });
    res.status(200).json(result);
  };

  restore = async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const { addressId } = AddressIdParamsSchema.parse(req.params);
    const result = await this.restoreAddress.execute({ userId, addressId });
    res.status(200).json(result);
  };
}
