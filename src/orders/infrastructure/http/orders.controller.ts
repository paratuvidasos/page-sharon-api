import { Request, Response } from "express";
import { UnauthorizedException } from "../../../shared-kernel/domain/exceptions/UnauthorizedException";
import { GetOrderHistory } from "../../application/use-cases/GetOrderHistory";
import { OrderHistoryQuerySchema } from "./schemas/order-history.schema";

export class OrdersController {
  constructor(private readonly getOrderHistory: GetOrderHistory) {}

  private requireUserId(req: Request): string {
    if (!req.authUser) {
      throw new UnauthorizedException();
    }
    return req.authUser.sub;
  }

  listHistory = async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const query = OrderHistoryQuerySchema.parse(req.query);
    const result = await this.getOrderHistory.execute({
      userId,
      status: query.status,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      page: query.page,
      limit: query.limit,
    });
    res.status(200).json(result);
  };
}
