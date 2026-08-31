import { Request, Response } from "express";
import { GetShippingOptions } from "../../application/use-cases/GetShippingOptions";
import { ListShippingCoverage } from "../../application/use-cases/ListShippingCoverage";
import { ShippingQuoteRequestSchema } from "./schemas/shipping-quote.schema";

export class ShippingController {
  constructor(
    private readonly getShippingOptions: GetShippingOptions,
    private readonly listShippingCoverage: ListShippingCoverage,
  ) {}

  quote = async (req: Request, res: Response): Promise<void> => {
    const input = ShippingQuoteRequestSchema.parse(req.body);
    const result = await this.getShippingOptions.execute(input);
    res.status(200).json(result);
  };

  coverage = async (_req: Request, res: Response): Promise<void> => {
    const result = await this.listShippingCoverage.execute();
    res.status(200).json(result);
  };
}
