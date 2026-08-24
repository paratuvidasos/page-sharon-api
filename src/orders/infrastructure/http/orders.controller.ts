import { Request, Response } from "express";
import { UnauthorizedException } from "../../../shared-kernel/domain/exceptions/UnauthorizedException";
import { GetOrderHistory } from "../../application/use-cases/GetOrderHistory";
import { PlaceOrder } from "../../application/use-cases/PlaceOrder";
import { CheckoutRequestSchema } from "./schemas/checkout.schema";
import { OrderHistoryQuerySchema } from "./schemas/order-history.schema";

const REFRESH_TOKEN_COOKIE_NAME = "refresh_token";

export class OrdersController {
  constructor(
    private readonly getOrderHistory: GetOrderHistory,
    private readonly placeOrder: PlaceOrder,
  ) {}

  private requireUserId(req: Request): string {
    if (!req.authUser) {
      throw new UnauthorizedException();
    }
    return req.authUser.sub;
  }

  // Duplica el helper equivalente de AccountsController: la cookie sigue
  // scopeada a /api/v1/accounts (donde vive refresh-token/logout), no a
  // /api/v1/orders, así que basta con setearla igual aquí sin depender de
  // shared-kernel para esto.
  private setRefreshTokenCookie(res: Response, token: string, expiresAt: Date): void {
    res.cookie(REFRESH_TOKEN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/v1/accounts",
      expires: expiresAt,
    });
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

  checkout = async (req: Request, res: Response): Promise<void> => {
    const input = CheckoutRequestSchema.parse(req.body);
    const result = await this.placeOrder.execute({
      authUserId: req.authUser?.sub ?? null,
      items: input.items,
      shippingCost: input.shippingCost,
      paymentMethod: input.paymentMethod,
      paymentMethodLabel: input.paymentMethodLabel ?? null,
      shippingAddress: {
        ...input.shippingAddress,
        streetLine2: input.shippingAddress.streetLine2 ?? null,
      },
      guestEmail: input.guestEmail ?? null,
      createAccount: input.createAccount
        ? { firstName: input.firstName!, lastName: input.lastName!, password: input.password! }
        : null,
    });

    if (result.account) {
      this.setRefreshTokenCookie(res, result.account.refreshToken, result.account.refreshTokenExpiresAt);
    }

    res.status(201).json({
      order: result.order,
      account: result.account
        ? {
            accessToken: result.account.accessToken,
            expiresIn: result.account.accessTokenExpiresIn,
            user: result.account.user,
          }
        : null,
    });
  };
}
