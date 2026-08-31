import { RequestHandler, Router } from "express";
import { asyncHandler } from "../../../shared-kernel/infrastructure/http/async-handler";
import "./schemas/set-featured.schema";
import "./schemas/create-coupon.schema";
import "./schemas/shipping-zone.schema";
import "./schemas/order-fulfillment.schema";
import "./schemas/category.schema";
import "./schemas/attribute.schema";
import "./schemas/product.schema";
import "./schemas/product-translation.schema";
import "./schemas/inventory.schema";
import "./schemas/list-orders.schema";
import "./schemas/update-coupon.schema";
import "./schemas/list-coupons.schema";
import "./schemas/sales-report.schema";
import "./schemas/customer.schema";
import "./schemas/review-moderation.schema";
import "./schemas/banner.schema";
import "./schemas/homepage-config.schema";
import { AdminController } from "./admin.controller";
import { uploadBannerImage } from "./upload-banner-image.middleware";
import { uploadProductImages } from "./upload-product-images.middleware";

export function buildAdminRoutes(
  controller: AdminController,
  authenticate: RequestHandler,
  requireAdmin: RequestHandler,
): Router {
  const router = Router();

  router.use(authenticate, requireAdmin);
  router.patch("/products/:id/featured", asyncHandler(controller.setProductFeaturedHandler));
  router.post("/coupons", asyncHandler(controller.createCouponHandler));
  router.get("/coupons", asyncHandler(controller.listCouponsHandler));
  router.patch("/coupons/:code", asyncHandler(controller.updateCouponHandler));

  // [0062]: reportes de ventas.
  router.get("/reports/sales", asyncHandler(controller.getSalesReportHandler));
  router.get("/reports/sales/export", asyncHandler(controller.exportSalesReportCsvHandler));

  // [0063]: usuarios y clientes registrados.
  router.get("/customers", asyncHandler(controller.listCustomersHandler));
  router.patch("/customers/:id/suspend", asyncHandler(controller.suspendCustomerHandler));
  router.patch("/customers/:id/reactivate", asyncHandler(controller.reactivateCustomerHandler));

  // [0064]: moderación de reseñas.
  router.get("/reviews", asyncHandler(controller.listReviewsForModerationHandler));
  router.patch("/reviews/:id/approve", asyncHandler(controller.approveReviewHandler));
  router.patch("/reviews/:id/reject", asyncHandler(controller.rejectReviewHandler));
  router.patch("/reviews/:id/hide", asyncHandler(controller.hideReviewHandler));

  // [0066]: banners y contenido de la home.
  router.get("/banners", asyncHandler(controller.listBannersAdminHandler));
  router.post("/banners", asyncHandler(controller.createBannerHandler));
  router.patch("/banners/:id", asyncHandler(controller.updateBannerHandler));
  router.delete("/banners/:id", asyncHandler(controller.deleteBannerHandler));
  router.put("/banners/order", asyncHandler(controller.reorderBannersHandler));
  router.post(
    "/banners/upload-image",
    uploadBannerImage,
    asyncHandler(controller.uploadBannerImageHandler),
  );
  router.get("/homepage/featured-config", asyncHandler(controller.getHomepageFeaturedConfigHandler));
  router.put("/homepage/featured-config", asyncHandler(controller.setHomepageFeaturedConfigHandler));

  // [0049]: configuración de zonas de cobertura y restricciones de envío.
  router.get("/shipping/zones", asyncHandler(controller.listShippingZonesHandler));
  router.get("/shipping/zones/:id", asyncHandler(controller.getShippingZoneByIdHandler));
  router.post("/shipping/zones", asyncHandler(controller.createShippingZoneHandler));
  router.patch("/shipping/zones/:id", asyncHandler(controller.updateShippingZoneHandler));
  router.delete("/shipping/zones/:id", asyncHandler(controller.deleteShippingZoneHandler));
  router.put("/shipping/zones/:id/restrictions", asyncHandler(controller.setZoneRestrictionsHandler));

  // [0047]: avanzar el pedido en su ciclo de cumplimiento (preparación, envío
  // con guía, entrega).
  router.patch("/orders/:orderNumber/status", asyncHandler(controller.updateOrderStatusHandler));

  // [0060]: listado y detalle de pedidos.
  router.get("/orders", asyncHandler(controller.listOrdersHandler));
  router.get("/orders/:orderNumber", asyncHandler(controller.getOrderByNumberHandler));

  // [0058]: categorías y atributos del catálogo.
  router.get("/categories", asyncHandler(controller.listCategoriesHandler));
  router.post("/categories", asyncHandler(controller.createCategoryHandler));
  router.patch("/categories/:id", asyncHandler(controller.updateCategoryHandler));
  router.delete("/categories/:id", asyncHandler(controller.deleteCategoryHandler));
  router.get("/attributes", asyncHandler(controller.listAttributesHandler));
  router.post("/attributes", asyncHandler(controller.createAttributeHandler));
  router.patch("/attributes/:id", asyncHandler(controller.updateAttributeHandler));
  router.delete("/attributes/:id", asyncHandler(controller.deleteAttributeHandler));

  // [0069]: traducciones y cobertura de idioma.
  router.get("/products/translation-coverage", asyncHandler(controller.getTranslationCoverageHandler));
  router.put("/products/:id/translations", asyncHandler(controller.setProductTranslationsHandler));

  // [0057]: CRUD de productos y variantes.
  router.post("/products", asyncHandler(controller.createProductHandler));
  router.patch("/products/:id", asyncHandler(controller.updateProductHandler));
  router.delete("/products/:id", asyncHandler(controller.deleteProductHandler));
  router.post("/products/:id/variants", asyncHandler(controller.addProductVariantHandler));
  router.patch("/products/:id/variants/:variantId", asyncHandler(controller.updateProductVariantHandler));
  router.delete("/products/:id/variants/:variantId", asyncHandler(controller.removeProductVariantHandler));
  router.post(
    "/products/:id/images",
    uploadProductImages,
    asyncHandler(controller.uploadProductImagesHandler),
  );

  // [0059]: inventario y stock por variante.
  router.get("/inventory", asyncHandler(controller.listInventoryHandler));
  router.get("/inventory/low-stock", asyncHandler(controller.listLowStockVariantsHandler));
  router.patch(
    "/products/:id/variants/:variantId/stock",
    asyncHandler(controller.adjustVariantStockHandler),
  );
  router.patch(
    "/products/:id/variants/:variantId/low-stock-threshold",
    asyncHandler(controller.setVariantLowStockThresholdHandler),
  );

  return router;
}
