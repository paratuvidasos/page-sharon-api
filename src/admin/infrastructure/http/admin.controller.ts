import { Request, Response } from "express";
import { CreateBanner } from "../../../content/application/use-cases/CreateBanner";
import { DeleteBanner } from "../../../content/application/use-cases/DeleteBanner";
import { GetHomepageFeaturedConfig } from "../../../content/application/use-cases/GetHomepageFeaturedConfig";
import { ListBannersAdmin } from "../../../content/application/use-cases/ListBannersAdmin";
import { ReorderBanners } from "../../../content/application/use-cases/ReorderBanners";
import { SetHomepageFeaturedConfig } from "../../../content/application/use-cases/SetHomepageFeaturedConfig";
import { UpdateBanner } from "../../../content/application/use-cases/UpdateBanner";
import { UploadBannerImage } from "../../../content/application/use-cases/UploadBannerImage";
import { InvalidBannerImageFileException } from "../../../content/domain/exceptions/InvalidBannerImageFileException";
import { ApproveReview } from "../../../aftersales/application/use-cases/ApproveReview";
import { HideReview } from "../../../aftersales/application/use-cases/HideReview";
import { ListReviewsForModeration } from "../../../aftersales/application/use-cases/ListReviewsForModeration";
import { RejectReview } from "../../../aftersales/application/use-cases/RejectReview";
import { ListCustomers } from "../../../accounts/application/use-cases/admin/ListCustomers";
import { ReactivateCustomer } from "../../../accounts/application/use-cases/admin/ReactivateCustomer";
import { SuspendCustomer } from "../../../accounts/application/use-cases/admin/SuspendCustomer";
import { ListEmployees } from "../../../accounts/application/use-cases/admin/ListEmployees";
import { CreateEmployee } from "../../../accounts/application/use-cases/admin/CreateEmployee";
import { UpdateEmployee } from "../../../accounts/application/use-cases/admin/UpdateEmployee";
import { DeleteEmployee } from "../../../accounts/application/use-cases/admin/DeleteEmployee";
import { SetProductFeatured } from "../../../catalog/application/use-cases/SetProductFeatured";
import { SetProductTranslations } from "../../../catalog/application/use-cases/SetProductTranslations";
import { GetTranslationCoverage } from "../../../catalog/application/use-cases/GetTranslationCoverage";
import { AddProductVariant } from "../../../catalog/application/use-cases/AddProductVariant";
import { AdjustVariantStock } from "../../../catalog/application/use-cases/AdjustVariantStock";
import { CreateAttributeDefinition } from "../../../catalog/application/use-cases/CreateAttributeDefinition";
import { CreateCategory } from "../../../catalog/application/use-cases/CreateCategory";
import { CreateProduct } from "../../../catalog/application/use-cases/CreateProduct";
import { DeleteAttributeDefinition } from "../../../catalog/application/use-cases/DeleteAttributeDefinition";
import { DeleteCategory } from "../../../catalog/application/use-cases/DeleteCategory";
import { DeleteProduct } from "../../../catalog/application/use-cases/DeleteProduct";
import { ListAttributeDefinitions } from "../../../catalog/application/use-cases/ListAttributeDefinitions";
import { ListCategories } from "../../../catalog/application/use-cases/ListCategories";
import { ListInventory } from "../../../catalog/application/use-cases/ListInventory";
import { ListLowStockVariants } from "../../../catalog/application/use-cases/ListLowStockVariants";
import { RemoveProductVariant } from "../../../catalog/application/use-cases/RemoveProductVariant";
import { SetVariantLowStockThreshold } from "../../../catalog/application/use-cases/SetVariantLowStockThreshold";
import { UpdateAttributeDefinition } from "../../../catalog/application/use-cases/UpdateAttributeDefinition";
import { UpdateCategory } from "../../../catalog/application/use-cases/UpdateCategory";
import { UpdateProduct } from "../../../catalog/application/use-cases/UpdateProduct";
import { UpdateProductVariant } from "../../../catalog/application/use-cases/UpdateProductVariant";
import { UploadProductImages } from "../../../catalog/application/use-cases/UploadProductImages";
import { AdminGetOrderByNumber } from "../../../orders/application/use-cases/AdminGetOrderByNumber";
import { AdminListOrders } from "../../../orders/application/use-cases/AdminListOrders";
import { ExportSalesReportCsv } from "../../../orders/application/use-cases/ExportSalesReportCsv";
import { GetSalesReport } from "../../../orders/application/use-cases/GetSalesReport";
import { UpdateOrderFulfillmentStatus } from "../../../orders/application/use-cases/UpdateOrderFulfillmentStatus";
import { CreateCoupon } from "../../../cart/application/use-cases/CreateCoupon";
import { ListCoupons } from "../../../cart/application/use-cases/ListCoupons";
import { UpdateCoupon } from "../../../cart/application/use-cases/UpdateCoupon";
import { buildPaginationMeta } from "../../../shared-kernel/infrastructure/http/pagination";
import { CreateShippingZone } from "../../../shipping/application/use-cases/CreateShippingZone";
import { DeleteShippingZone } from "../../../shipping/application/use-cases/DeleteShippingZone";
import { GetShippingZoneById } from "../../../shipping/application/use-cases/GetShippingZoneById";
import { ListShippingZones } from "../../../shipping/application/use-cases/ListShippingZones";
import { SetZoneProductRestrictions } from "../../../shipping/application/use-cases/SetZoneProductRestrictions";
import { UpdateShippingZone } from "../../../shipping/application/use-cases/UpdateShippingZone";
import { SetFeaturedParamsSchema, SetFeaturedRequestSchema } from "./schemas/set-featured.schema";
import { SetProductTranslationsRequestSchema } from "./schemas/product-translation.schema";
import { CreateCouponRequestSchema } from "./schemas/create-coupon.schema";
import {
  AttributeParamsSchema,
  CreateAttributeRequestSchema,
  UpdateAttributeRequestSchema,
} from "./schemas/attribute.schema";
import {
  CategoryParamsSchema,
  CreateCategoryRequestSchema,
  ListCategoriesAdminQuerySchema,
  UpdateCategoryRequestSchema,
} from "./schemas/category.schema";
import {
  OrderFulfillmentParamsSchema,
  UpdateOrderFulfillmentStatusRequestSchema,
} from "./schemas/order-fulfillment.schema";
import {
  CreateProductRequestSchema,
  CreateVariantRequestSchema,
  ProductParamsSchema,
  ProductVariantParamsSchema,
  UpdateProductRequestSchema,
  UpdateVariantRequestSchema,
} from "./schemas/product.schema";
import {
  ListInventoryQuerySchema,
  ListLowStockQuerySchema,
  SetVariantLowStockThresholdRequestSchema,
  SetVariantStockRequestSchema,
} from "./schemas/inventory.schema";
import { AdminListOrdersQuerySchema, AdminOrderParamsSchema } from "./schemas/list-orders.schema";
import { CouponCodeParamsSchema, UpdateCouponRequestSchema } from "./schemas/update-coupon.schema";
import { ListCouponsQuerySchema } from "./schemas/list-coupons.schema";
import { SalesReportQuerySchema } from "./schemas/sales-report.schema";
import { CustomerParamsSchema, ListCustomersQuerySchema } from "./schemas/customer.schema";
import {
  CreateEmployeeRequestSchema,
  EmployeeParamsSchema,
  ListEmployeesQuerySchema,
  UpdateEmployeeRequestSchema,
} from "./schemas/employee.schema";
import {
  ListReviewsForModerationQuerySchema,
  RejectReviewRequestSchema,
  ReviewParamsSchema,
} from "./schemas/review-moderation.schema";
import {
  BannerParamsSchema,
  CreateBannerRequestSchema,
  ReorderBannersRequestSchema,
  UpdateBannerRequestSchema,
} from "./schemas/banner.schema";
import { SetHomepageFeaturedConfigRequestSchema } from "./schemas/homepage-config.schema";
import {
  CreateShippingZoneRequestSchema,
  SetZoneRestrictionsRequestSchema,
  ShippingZoneListQuerySchema,
  ShippingZoneParamsSchema,
  UpdateShippingZoneRequestSchema,
} from "./schemas/shipping-zone.schema";

export interface AdminControllerUseCases {
  setProductFeatured: SetProductFeatured;
  /** [0069]: traducciones y cobertura de idioma para el panel administrativo. */
  setProductTranslations: SetProductTranslations;
  getTranslationCoverage: GetTranslationCoverage;
  createCoupon: CreateCoupon;
  createShippingZone: CreateShippingZone;
  getShippingZoneById: GetShippingZoneById;
  updateShippingZone: UpdateShippingZone;
  deleteShippingZone: DeleteShippingZone;
  listShippingZones: ListShippingZones;
  setZoneProductRestrictions: SetZoneProductRestrictions;
  updateOrderFulfillmentStatus: UpdateOrderFulfillmentStatus;
  listCategoriesAdmin: ListCategories;
  createCategory: CreateCategory;
  updateCategory: UpdateCategory;
  deleteCategory: DeleteCategory;
  createAttributeDefinition: CreateAttributeDefinition;
  updateAttributeDefinition: UpdateAttributeDefinition;
  deleteAttributeDefinition: DeleteAttributeDefinition;
  listAttributeDefinitions: ListAttributeDefinitions;
  createProduct: CreateProduct;
  updateProduct: UpdateProduct;
  deleteProduct: DeleteProduct;
  addProductVariant: AddProductVariant;
  updateProductVariant: UpdateProductVariant;
  removeProductVariant: RemoveProductVariant;
  uploadProductImages: UploadProductImages;
  adjustVariantStock: AdjustVariantStock;
  setVariantLowStockThreshold: SetVariantLowStockThreshold;
  listLowStockVariants: ListLowStockVariants;
  listInventory: ListInventory;
  adminListOrders: AdminListOrders;
  adminGetOrderByNumber: AdminGetOrderByNumber;
  updateCoupon: UpdateCoupon;
  listCoupons: ListCoupons;
  getSalesReport: GetSalesReport;
  exportSalesReportCsv: ExportSalesReportCsv;
  listCustomers: ListCustomers;
  suspendCustomer: SuspendCustomer;
  reactivateCustomer: ReactivateCustomer;
  listEmployees: ListEmployees;
  createEmployee: CreateEmployee;
  updateEmployee: UpdateEmployee;
  deleteEmployee: DeleteEmployee;
  listReviewsForModeration: ListReviewsForModeration;
  approveReview: ApproveReview;
  rejectReview: RejectReview;
  hideReview: HideReview;
  createBanner: CreateBanner;
  updateBanner: UpdateBanner;
  deleteBanner: DeleteBanner;
  reorderBanners: ReorderBanners;
  listBannersAdmin: ListBannersAdmin;
  uploadBannerImage: UploadBannerImage;
  setHomepageFeaturedConfig: SetHomepageFeaturedConfig;
  getHomepageFeaturedConfig: GetHomepageFeaturedConfig;
}

export class AdminController {
  constructor(private readonly useCases: AdminControllerUseCases) {}

  setProductFeaturedHandler = async (req: Request, res: Response): Promise<void> => {
    const { id } = SetFeaturedParamsSchema.parse(req.params);
    const { isFeatured } = SetFeaturedRequestSchema.parse(req.body);
    await this.useCases.setProductFeatured.execute({ productId: id, isFeatured });
    res.status(204).send();
  };

  setProductTranslationsHandler = async (req: Request, res: Response): Promise<void> => {
    const { id } = ProductParamsSchema.parse(req.params);
    const { translations } = SetProductTranslationsRequestSchema.parse(req.body);
    await this.useCases.setProductTranslations.execute({ productId: id, translations });
    res.status(204).send();
  };

  getTranslationCoverageHandler = async (_req: Request, res: Response): Promise<void> => {
    const items = await this.useCases.getTranslationCoverage.execute();
    res.status(200).json({
      items: items.map((item) => ({
        ...item,
        percentage: item.total === 0 ? 0 : Math.round((item.translated / item.total) * 100),
      })),
    });
  };

  createCouponHandler = async (req: Request, res: Response): Promise<void> => {
    const input = CreateCouponRequestSchema.parse(req.body);
    await this.useCases.createCoupon.execute(input);
    res.status(201).json({ code: input.code.toUpperCase() });
  };

  getShippingZoneByIdHandler = async (req: Request, res: Response): Promise<void> => {
    const { id } = ShippingZoneParamsSchema.parse(req.params);
    const zone = await this.useCases.getShippingZoneById.execute({ zoneId: id });
    res.status(200).json(zone);
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
      adminLabel: req.authUser?.email ?? null,
    });
    res.status(200).json(order);
  };

  listOrdersHandler = async (req: Request, res: Response): Promise<void> => {
    const { page, limit, status, dateFrom, dateTo, paymentMethod } = AdminListOrdersQuerySchema.parse(
      req.query,
    );
    const result = await this.useCases.adminListOrders.execute({
      page,
      limit,
      status,
      dateFrom,
      dateTo,
      paymentMethod,
    });
    res.status(200).json(result);
  };

  getOrderByNumberHandler = async (req: Request, res: Response): Promise<void> => {
    const { orderNumber } = AdminOrderParamsSchema.parse(req.params);
    const order = await this.useCases.adminGetOrderByNumber.execute({ orderNumber });
    res.status(200).json(order);
  };

  updateCouponHandler = async (req: Request, res: Response): Promise<void> => {
    const { code } = CouponCodeParamsSchema.parse(req.params);
    const input = UpdateCouponRequestSchema.parse(req.body);
    await this.useCases.updateCoupon.execute({ code, ...input });
    res.status(204).send();
  };

  listCouponsHandler = async (req: Request, res: Response): Promise<void> => {
    const { page, limit } = ListCouponsQuerySchema.parse(req.query);
    const result = await this.useCases.listCoupons.execute({ page, limit });
    res.status(200).json(result);
  };

  getSalesReportHandler = async (req: Request, res: Response): Promise<void> => {
    const { dateFrom, dateTo } = SalesReportQuerySchema.parse(req.query);
    const result = await this.useCases.getSalesReport.execute({ dateFrom, dateTo });
    res.status(200).json(result);
  };

  exportSalesReportCsvHandler = async (req: Request, res: Response): Promise<void> => {
    const { dateFrom, dateTo } = SalesReportQuerySchema.parse(req.query);
    const csv = await this.useCases.exportSalesReportCsv.execute({ dateFrom, dateTo });
    res.status(200).header("Content-Type", "text/csv; charset=utf-8");
    res.header("Content-Disposition", `attachment; filename="ventas-${Date.now()}.csv"`);
    res.send(csv);
  };

  setZoneRestrictionsHandler = async (req: Request, res: Response): Promise<void> => {
    const { id } = ShippingZoneParamsSchema.parse(req.params);
    const { restrictions } = SetZoneRestrictionsRequestSchema.parse(req.body);
    await this.useCases.setZoneProductRestrictions.execute({ zoneId: id, restrictions });
    res.status(204).send();
  };

  listCategoriesHandler = async (req: Request, res: Response): Promise<void> => {
    const { page, limit } = ListCategoriesAdminQuerySchema.parse(req.query);
    const result = await this.useCases.listCategoriesAdmin.execute({ page, limit });
    res.status(200).json(result);
  };

  createCategoryHandler = async (req: Request, res: Response): Promise<void> => {
    const input = CreateCategoryRequestSchema.parse(req.body);
    const result = await this.useCases.createCategory.execute(input);
    res.status(201).json(result);
  };

  updateCategoryHandler = async (req: Request, res: Response): Promise<void> => {
    const { id } = CategoryParamsSchema.parse(req.params);
    const input = UpdateCategoryRequestSchema.parse(req.body);
    await this.useCases.updateCategory.execute({ categoryId: id, ...input });
    res.status(204).send();
  };

  deleteCategoryHandler = async (req: Request, res: Response): Promise<void> => {
    const { id } = CategoryParamsSchema.parse(req.params);
    await this.useCases.deleteCategory.execute({ categoryId: id });
    res.status(204).send();
  };

  listAttributesHandler = async (_req: Request, res: Response): Promise<void> => {
    const items = await this.useCases.listAttributeDefinitions.execute();
    res.status(200).json({ items });
  };

  createAttributeHandler = async (req: Request, res: Response): Promise<void> => {
    const input = CreateAttributeRequestSchema.parse(req.body);
    const result = await this.useCases.createAttributeDefinition.execute(input);
    res.status(201).json(result);
  };

  updateAttributeHandler = async (req: Request, res: Response): Promise<void> => {
    const { id } = AttributeParamsSchema.parse(req.params);
    const input = UpdateAttributeRequestSchema.parse(req.body);
    await this.useCases.updateAttributeDefinition.execute({ attributeId: id, ...input });
    res.status(204).send();
  };

  deleteAttributeHandler = async (req: Request, res: Response): Promise<void> => {
    const { id } = AttributeParamsSchema.parse(req.params);
    await this.useCases.deleteAttributeDefinition.execute({ attributeId: id });
    res.status(204).send();
  };

  createProductHandler = async (req: Request, res: Response): Promise<void> => {
    const input = CreateProductRequestSchema.parse(req.body);
    const result = await this.useCases.createProduct.execute(input);
    res.status(201).json(result);
  };

  updateProductHandler = async (req: Request, res: Response): Promise<void> => {
    const { id } = ProductParamsSchema.parse(req.params);
    const input = UpdateProductRequestSchema.parse(req.body);
    await this.useCases.updateProduct.execute({ productId: id, ...input });
    res.status(204).send();
  };

  deleteProductHandler = async (req: Request, res: Response): Promise<void> => {
    const { id } = ProductParamsSchema.parse(req.params);
    const result = await this.useCases.deleteProduct.execute({ productId: id });
    res.status(200).json(result);
  };

  addProductVariantHandler = async (req: Request, res: Response): Promise<void> => {
    const { id } = ProductParamsSchema.parse(req.params);
    const input = CreateVariantRequestSchema.parse(req.body);
    const result = await this.useCases.addProductVariant.execute({ productId: id, ...input });
    res.status(201).json(result);
  };

  updateProductVariantHandler = async (req: Request, res: Response): Promise<void> => {
    const { id, variantId } = ProductVariantParamsSchema.parse(req.params);
    const input = UpdateVariantRequestSchema.parse(req.body);
    await this.useCases.updateProductVariant.execute({ productId: id, variantId, ...input });
    res.status(204).send();
  };

  removeProductVariantHandler = async (req: Request, res: Response): Promise<void> => {
    const { id, variantId } = ProductVariantParamsSchema.parse(req.params);
    await this.useCases.removeProductVariant.execute({ productId: id, variantId });
    res.status(204).send();
  };

  uploadProductImagesHandler = async (req: Request, res: Response): Promise<void> => {
    const { id } = ProductParamsSchema.parse(req.params);
    const files = ((req.files as Express.Multer.File[] | undefined) ?? []).map((file) => ({
      buffer: file.buffer,
      mimeType: file.mimetype,
      originalName: file.originalname,
    }));
    const result = await this.useCases.uploadProductImages.execute({ productId: id, files });
    res.status(201).json(result);
  };

  adjustVariantStockHandler = async (req: Request, res: Response): Promise<void> => {
    const { variantId } = ProductVariantParamsSchema.parse(req.params);
    const { quantity } = SetVariantStockRequestSchema.parse(req.body);
    await this.useCases.adjustVariantStock.execute({ variantId, quantity });
    res.status(204).send();
  };

  setVariantLowStockThresholdHandler = async (req: Request, res: Response): Promise<void> => {
    const { variantId } = ProductVariantParamsSchema.parse(req.params);
    const { threshold } = SetVariantLowStockThresholdRequestSchema.parse(req.body);
    await this.useCases.setVariantLowStockThreshold.execute({ variantId, threshold });
    res.status(204).send();
  };

  listLowStockVariantsHandler = async (req: Request, res: Response): Promise<void> => {
    const { page, limit } = ListLowStockQuerySchema.parse(req.query);
    const result = await this.useCases.listLowStockVariants.execute({ page, limit });
    res.status(200).json(result);
  };

  listInventoryHandler = async (req: Request, res: Response): Promise<void> => {
    const { page, limit, search, categoryId, onlyLowStock, sort } = ListInventoryQuerySchema.parse(
      req.query,
    );
    const result = await this.useCases.listInventory.execute({
      page,
      limit,
      search,
      categoryId,
      onlyLowStock,
      sort,
    });
    res.status(200).json(result);
  };

  listCustomersHandler = async (req: Request, res: Response): Promise<void> => {
    const { page, limit, search, status } = ListCustomersQuerySchema.parse(req.query);
    const result = await this.useCases.listCustomers.execute({ page, limit, search, status });
    res.status(200).json(result);
  };

  suspendCustomerHandler = async (req: Request, res: Response): Promise<void> => {
    const { id } = CustomerParamsSchema.parse(req.params);
    await this.useCases.suspendCustomer.execute({ userId: id });
    res.status(204).send();
  };

  reactivateCustomerHandler = async (req: Request, res: Response): Promise<void> => {
    const { id } = CustomerParamsSchema.parse(req.params);
    await this.useCases.reactivateCustomer.execute({ userId: id });
    res.status(204).send();
  };

  listEmployeesHandler = async (req: Request, res: Response): Promise<void> => {
    const { page, limit, search } = ListEmployeesQuerySchema.parse(req.query);
    const result = await this.useCases.listEmployees.execute({ page, limit, search });
    res.status(200).json(result);
  };

  createEmployeeHandler = async (req: Request, res: Response): Promise<void> => {
    const input = CreateEmployeeRequestSchema.parse(req.body);
    const result = await this.useCases.createEmployee.execute(input);
    res.status(201).json(result);
  };

  updateEmployeeHandler = async (req: Request, res: Response): Promise<void> => {
    const { id } = EmployeeParamsSchema.parse(req.params);
    const input = UpdateEmployeeRequestSchema.parse(req.body);
    await this.useCases.updateEmployee.execute({ userId: id, ...input });
    res.status(204).send();
  };

  deleteEmployeeHandler = async (req: Request, res: Response): Promise<void> => {
    const { id } = EmployeeParamsSchema.parse(req.params);
    await this.useCases.deleteEmployee.execute({ userId: id });
    res.status(204).send();
  };

  listReviewsForModerationHandler = async (req: Request, res: Response): Promise<void> => {
    const { page, limit, status } = ListReviewsForModerationQuerySchema.parse(req.query);
    const result = await this.useCases.listReviewsForModeration.execute({ page, limit, status });
    res.status(200).json(result);
  };

  approveReviewHandler = async (req: Request, res: Response): Promise<void> => {
    const { id } = ReviewParamsSchema.parse(req.params);
    await this.useCases.approveReview.execute({ reviewId: id });
    res.status(204).send();
  };

  rejectReviewHandler = async (req: Request, res: Response): Promise<void> => {
    const { id } = ReviewParamsSchema.parse(req.params);
    const { reason } = RejectReviewRequestSchema.parse(req.body);
    await this.useCases.rejectReview.execute({ reviewId: id, reason });
    res.status(204).send();
  };

  hideReviewHandler = async (req: Request, res: Response): Promise<void> => {
    const { id } = ReviewParamsSchema.parse(req.params);
    await this.useCases.hideReview.execute({ reviewId: id });
    res.status(204).send();
  };

  listBannersAdminHandler = async (_req: Request, res: Response): Promise<void> => {
    const items = await this.useCases.listBannersAdmin.execute();
    res.status(200).json({ items });
  };

  createBannerHandler = async (req: Request, res: Response): Promise<void> => {
    const input = CreateBannerRequestSchema.parse(req.body);
    const result = await this.useCases.createBanner.execute(input);
    res.status(201).json(result);
  };

  updateBannerHandler = async (req: Request, res: Response): Promise<void> => {
    const { id } = BannerParamsSchema.parse(req.params);
    const input = UpdateBannerRequestSchema.parse(req.body);
    await this.useCases.updateBanner.execute({ bannerId: id, ...input });
    res.status(204).send();
  };

  deleteBannerHandler = async (req: Request, res: Response): Promise<void> => {
    const { id } = BannerParamsSchema.parse(req.params);
    await this.useCases.deleteBanner.execute({ bannerId: id });
    res.status(204).send();
  };

  reorderBannersHandler = async (req: Request, res: Response): Promise<void> => {
    const { bannerIds } = ReorderBannersRequestSchema.parse(req.body);
    await this.useCases.reorderBanners.execute({ bannerIds });
    res.status(204).send();
  };

  uploadBannerImageHandler = async (req: Request, res: Response): Promise<void> => {
    const file = req.file;
    if (!file) {
      throw new InvalidBannerImageFileException("Falta el archivo de imagen.");
    }
    const result = await this.useCases.uploadBannerImage.execute({
      file: { buffer: file.buffer, mimeType: file.mimetype, originalName: file.originalname },
    });
    res.status(201).json(result);
  };

  getHomepageFeaturedConfigHandler = async (_req: Request, res: Response): Promise<void> => {
    const config = await this.useCases.getHomepageFeaturedConfig.execute();
    res.status(200).json(config);
  };

  setHomepageFeaturedConfigHandler = async (req: Request, res: Response): Promise<void> => {
    const input = SetHomepageFeaturedConfigRequestSchema.parse(req.body);
    await this.useCases.setHomepageFeaturedConfig.execute(input);
    res.status(204).send();
  };
}
