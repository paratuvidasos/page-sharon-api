import { Request, Response } from "express";
import { UnauthorizedException } from "../../../shared-kernel/domain/exceptions/UnauthorizedException";
import { GetOrderByNumber } from "../../application/use-cases/GetOrderByNumber";
import { GetOrderHistory } from "../../application/use-cases/GetOrderHistory";
import { RetryOrderPayment } from "../../application/use-cases/RetryOrderPayment";
import { StartCheckout } from "../../application/use-cases/StartCheckout";
import { CheckoutRequestSchema } from "./schemas/checkout.schema";
import { GetOrderQuerySchema, RetryPaymentRequestSchema } from "./schemas/order-detail.schema";
import { OrderHistoryQuerySchema } from "./schemas/order-history.schema";

const REFRESH_TOKEN_COOKIE_NAME = "refresh_token";

export class OrdersController {
  constructor(
    private readonly getOrderHistory: GetOrderHistory,
    private readonly startCheckout: StartCheckout,
    private readonly getOrderByNumber: GetOrderByNumber,
    private readonly retryOrderPayment: RetryOrderPayment,
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
      onlyShipped: query.onlyShipped,
      page: query.page,
      limit: query.limit,
    });
    res.status(200).json(result);
  };

  checkout = async (req: Request, res: Response): Promise<void> => {
    const input = CheckoutRequestSchema.parse(req.body);

    const result = await this.startCheckout.execute({
      authUserId: req.authUser?.sub ?? null,
      items: input.items,
      shippingAddressId: input.shippingAddressId ?? null,
      shippingAddress: input.shippingAddress
        ? { ...input.shippingAddress, streetLine2: input.shippingAddress.streetLine2 ?? null }
        : null,
      shippingMethod: input.shippingMethod,
      couponCode: input.couponCode ?? null,
      currency: input.currency,
      paymentMethod: input.paymentMethod,
      paymentMethodLabel: input.paymentMethodLabel ?? null,
      documentNumber: input.documentNumber ?? null,
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
      payment: result.payment,
      account: result.account
        ? {
            accessToken: result.account.accessToken,
            expiresIn: result.account.accessTokenExpiresIn,
            user: result.account.user,
          }
        : null,
    });
  };

  getByNumber = async (req: Request, res: Response): Promise<void> => {
    const query = GetOrderQuerySchema.parse(req.query);
    const order = await this.getOrderByNumber.execute({
      orderNumber: req.params.orderNumber,
      authUserId: req.authUser?.sub ?? null,
      guestEmail: query.email ?? null,
    });
    // [0060]: `statusHistory[].changedByAdminLabel` es el email del admin que
    // hizo el cambio — información interna del panel, no algo que el
    // comprador deba ver en su propio pedido.
    res.status(200).json({
      ...order,
      statusHistory: order.statusHistory.map(({ changedByAdminLabel: _changedByAdminLabel, ...change }) => change),
    });
  };

  retryPayment = async (req: Request, res: Response): Promise<void> => {
    const input = RetryPaymentRequestSchema.parse(req.body);
    const result = await this.retryOrderPayment.execute({
      orderNumber: req.params.orderNumber,
      authUserId: req.authUser?.sub ?? null,
      guestEmail: input.email ?? null,
      paymentMethod: input.paymentMethod,
      paymentMethodLabel: input.paymentMethodLabel ?? null,
      documentNumber: input.documentNumber ?? null,
    });
    res.status(200).json(result);
  };
}
