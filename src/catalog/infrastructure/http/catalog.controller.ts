import { Request, Response } from "express";
import { AutocompleteProducts } from "../../application/use-cases/AutocompleteProducts";
import { GetProductDetail } from "../../application/use-cases/GetProductDetail";
import { GetProductFilterFacets } from "../../application/use-cases/GetProductFilterFacets";
import { ListCategories } from "../../application/use-cases/ListCategories";
import { ListFeaturedProducts } from "../../application/use-cases/ListFeaturedProducts";
import { ListProducts } from "../../application/use-cases/ListProducts";
import { ListRelatedProducts } from "../../application/use-cases/ListRelatedProducts";
import { SearchProducts } from "../../application/use-cases/SearchProducts";
import { AutocompleteQuerySchema } from "./schemas/autocomplete.schema";
import { ListCategoriesQuerySchema } from "./schemas/categories.schema";
import { GetProductFiltersQuerySchema } from "./schemas/filters.schema";
import { ListProductsQuerySchema } from "./schemas/list-products.schema";
import { ProductSlugParamsSchema } from "./schemas/product-detail.schema";
import { SearchProductsQuerySchema } from "./schemas/search.schema";

export class CatalogController {
  constructor(
    private readonly listProducts: ListProducts,
    private readonly getProductDetail: GetProductDetail,
    private readonly listCategories: ListCategories,
    private readonly getProductFilterFacets: GetProductFilterFacets,
    private readonly searchProducts: SearchProducts,
    private readonly autocompleteProducts: AutocompleteProducts,
    private readonly listRelatedProducts: ListRelatedProducts,
    private readonly listFeaturedProducts: ListFeaturedProducts,
  ) {}

  listProductsHandler = async (req: Request, res: Response): Promise<void> => {
    const query = ListProductsQuerySchema.parse(req.query);
    const result = await this.listProducts.execute({
      page: query.page,
      limit: query.limit,
      categoryId: query.categoryId,
      hairType: query.hairType,
      line: query.line,
      mainIngredient: query.ingredient,
      priceMin: query.priceMin,
      priceMax: query.priceMax,
      sort: query.sort,
    });
    res.status(200).json(result);
  };

  getProductFiltersHandler = async (req: Request, res: Response): Promise<void> => {
    const query = GetProductFiltersQuerySchema.parse(req.query);
    const result = await this.getProductFilterFacets.execute({ categoryId: query.categoryId });
    res.status(200).json(result);
  };

  getProductDetailHandler = async (req: Request, res: Response): Promise<void> => {
    const { slug } = ProductSlugParamsSchema.parse(req.params);
    const result = await this.getProductDetail.execute({ slug });
    res.status(200).json(result);
  };

  listCategoriesHandler = async (req: Request, res: Response): Promise<void> => {
    const query = ListCategoriesQuerySchema.parse(req.query);
    const result = await this.listCategories.execute({ page: query.page, limit: query.limit });
    res.status(200).json(result);
  };

  searchProductsHandler = async (req: Request, res: Response): Promise<void> => {
    const query = SearchProductsQuerySchema.parse(req.query);
    const result = await this.searchProducts.execute({ term: query.q, page: query.page, limit: query.limit });
    res.status(200).json(result);
  };

  autocompleteProductsHandler = async (req: Request, res: Response): Promise<void> => {
    const query = AutocompleteQuerySchema.parse(req.query);
    const suggestions = await this.autocompleteProducts.execute({ term: query.q });
    res.status(200).json({ suggestions });
  };

  listRelatedProductsHandler = async (req: Request, res: Response): Promise<void> => {
    const { slug } = ProductSlugParamsSchema.parse(req.params);
    const items = await this.listRelatedProducts.execute({ slug });
    res.status(200).json({ items });
  };

  listFeaturedProductsHandler = async (_req: Request, res: Response): Promise<void> => {
    const items = await this.listFeaturedProducts.execute({});
    res.status(200).json({ items });
  };
}
