import { Request, Response } from "express";
import { SetProductFeatured } from "../../../catalog/application/use-cases/SetProductFeatured";
import { CreateCoupon } from "../../../cart/application/use-cases/CreateCoupon";
import { SetFeaturedParamsSchema, SetFeaturedRequestSchema } from "./schemas/set-featured.schema";
import { CreateCouponRequestSchema } from "./schemas/create-coupon.schema";

export class AdminController {
  constructor(
    private readonly setProductFeatured: SetProductFeatured,
    private readonly createCoupon: CreateCoupon,
  ) {}

  setProductFeaturedHandler = async (req: Request, res: Response): Promise<void> => {
    const { id } = SetFeaturedParamsSchema.parse(req.params);
    const { isFeatured } = SetFeaturedRequestSchema.parse(req.body);
    await this.setProductFeatured.execute({ productId: id, isFeatured });
    res.status(204).send();
  };

  createCouponHandler = async (req: Request, res: Response): Promise<void> => {
    const input = CreateCouponRequestSchema.parse(req.body);
    await this.createCoupon.execute(input);
    res.status(201).json({ code: input.code.toUpperCase() });
  };
}
