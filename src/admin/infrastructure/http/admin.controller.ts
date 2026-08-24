import { Request, Response } from "express";
import { SetProductFeatured } from "../../../catalog/application/use-cases/SetProductFeatured";
import { SetFeaturedParamsSchema, SetFeaturedRequestSchema } from "./schemas/set-featured.schema";

export class AdminController {
  constructor(private readonly setProductFeatured: SetProductFeatured) {}

  setProductFeaturedHandler = async (req: Request, res: Response): Promise<void> => {
    const { id } = SetFeaturedParamsSchema.parse(req.params);
    const { isFeatured } = SetFeaturedRequestSchema.parse(req.body);
    await this.setProductFeatured.execute({ productId: id, isFeatured });
    res.status(204).send();
  };
}
