import { Request, Response } from "express";
import { SetProductFeatured } from "../../../catalog/application/use-cases/SetProductFeatured";
import { UpdateOrderFulfillmentStatus } from "../../../orders/application/use-cases/UpdateOrderFulfillmentStatus";
import { CreateCoupon } from "../../../cart/application/use-cases/CreateCoupon";
import { buildPaginationMeta } from "../../../shared-kernel/infrastructure/http/pagination";
import { CreateShippingZone } from "../../../shipping/application/use-cases/CreateShippingZone";
import { DeleteShippingZone } from "../../../shipping/application/use-cases/DeleteShippingZone";
import { ListShippingZones } from "../../../shipping/application/use-cases/ListShippingZones";
import { SetZoneProductRestrictions } from "../../../shipping/application/use-cases/SetZoneProductRestrictions";
import { UpdateShippingZone } from "../../../shipping/application/use-cases/UpdateShippingZone";
import { SetFeaturedParamsSchema, SetFeaturedRequestSchema } from "./schemas/set-featured.schema";
import { CreateCouponRequestSchema } from "./schemas/create-coupon.schema";
import {
  OrderFulfillmentParamsSchema,
  UpdateOrderFulfillmentStatusRequestSchema,
} from "./schemas/order-fulfillment.schema";
import {
  CreateShippingZoneRequestSchema,
  SetZoneRestrictionsRequestSchema,
  ShippingZoneListQuerySchema,
  ShippingZoneParamsSchema,
  UpdateShippingZoneRequestSchema,
} from "./schemas/shipping-zone.schema";

export interface AdminControllerUseCases {
  setProductFeatured: SetProductFeatured;
  createCoupon: CreateCoupon;
  createShippingZone: CreateShippingZone;
  updateShippingZone: UpdateShippingZone;
  deleteShippingZone: DeleteShippingZone;
  listShippingZones: ListShippingZones;
  setZoneProductRestrictions: SetZoneProductRestrictions;
  updateOrderFulfillmentStatus: UpdateOrderFulfillmentStatus;
}

export class AdminController {
  constructor(private readonly useCases: AdminControllerUseCases) {}

  setProductFeaturedHandler = async (req: Request, res: Response): Promise<void> => {
    const { id } = SetFeaturedParamsSchema.parse(req.params);
    const { isFeatured } = SetFeaturedRequestSchema.parse(req.body);
    await this.useCases.setProductFeatured.execute({ productId: id, isFeatured });
    res.status(204).send();
  };

  createCouponHandler = async (req: Request, res: Response): Promise<void> => {
    const input = CreateCouponRequestSchema.parse(req.body);
    await this.useCases.createCoupon.execute(input);
    res.status(201).json({ code: input.code.toUpperCase() });
  };

  listShippingZonesHandler = async (req: Request, res: Response): Promise<void> => {
    const { page, limit } = ShippingZoneListQuerySchema.parse(req.query);
    const result = await this.useCases.listShippingZones.execute({ page, limit });
    res.status(200).json({
      items: result.items,
      meta: buildPaginationMeta(page, limit, result.total),
    });
  };

  createShippingZoneHandler = async (req: Request, res: Response): Promise<void> => {
    const input = CreateShippingZoneRequestSchema.parse(req.body);
    const result = await this.useCases.createShippingZone.execute(input);
    res.status(201).json(result);
  };

  updateShippingZoneHandler = async (req: Request, res: Response): Promise<void> => {
    const { id } = ShippingZoneParamsSchema.parse(req.params);
    const input = UpdateShippingZoneRequestSchema.parse(req.body);
    await this.useCases.updateShippingZone.execute({ zoneId: id, ...input });
    res.status(204).send();
  };

  deleteShippingZoneHandler = async (req: Request, res: Response): Promise<void> => {
    const { id } = ShippingZoneParamsSchema.parse(req.params);
    await this.useCases.deleteShippingZone.execute({ zoneId: id });
    res.status(204).send();
  };

  updateOrderStatusHandler = async (req: Request, res: Response): Promise<void> => {
    const { orderNumber } = OrderFulfillmentParamsSchema.parse(req.params);
    const input = UpdateOrderFulfillmentStatusRequestSchema.parse(req.body);
    const order = await this.useCases.updateOrderFulfillmentStatus.execute({
      orderNumber,
      ...input,
    });
    res.status(200).json(order);
  };

  setZoneRestrictionsHandler = async (req: Request, res: Response): Promise<void> => {
    const { id } = ShippingZoneParamsSchema.parse(req.params);
    const { restrictions } = SetZoneRestrictionsRequestSchema.parse(req.body);
    await this.useCases.setZoneProductRestrictions.execute({ zoneId: id, restrictions });
    res.status(204).send();
  };
}
