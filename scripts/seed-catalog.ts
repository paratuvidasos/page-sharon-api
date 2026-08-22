import "dotenv/config";
import { Product } from "../src/catalog/domain/entities/Product";
import { TypeOrmProductRepository } from "../src/catalog/infrastructure/persistence/typeorm-product.repository";
import { generateId } from "../src/shared-kernel/infrastructure/ids/generate-id";
import { AppDataSource } from "../src/shared-kernel/infrastructure/persistence/data-source";

/**
 * Datos de prueba para desarrollo local: no hay todavía ningún endpoint de
 * creación de productos (el CRUD de admin no está en el backlog [0013]-
 * [0022]), así que esto es lo único que puebla `catalog` hoy. No se corre
 * en producción — no es una migración, es una herramienta de `scripts/`.
 */
async function seedCatalog(): Promise<void> {
  await AppDataSource.initialize();

  const categories = [
    { id: generateId(), name: "Shampoos", slug: "shampoos" },
    { id: generateId(), name: "Acondicionadores", slug: "acondicionadores" },
    { id: generateId(), name: "Tratamientos", slug: "tratamientos" },
  ];

  for (const category of categories) {
    await AppDataSource.query(
      `INSERT INTO categories (id, name, slug) VALUES ($1, $2, $3) ON CONFLICT (slug) DO NOTHING`,
      [category.id, category.name, category.slug],
    );
  }

  const productRepository = new TypeOrmProductRepository(AppDataSource);

  const products = [
    Product.create({
      id: generateId(),
      categoryId: categories[0].id,
      name: "Shampoo reparador de argán",
      slug: "shampoo-reparador-argan",
      description: "Shampoo con aceite de argán para cabello dañado o con puntas abiertas.",
      brand: "Sharon",
      ingredients: "Aceite de argán, keratina, pantenol",
      attributes: { hairType: "dañado", line: "reparación", mainIngredient: "argán" },
      basePrice: 45000,
      compareAtPrice: 39000,
      images: ["https://picsum.photos/seed/shampoo-argan/600/600"],
      variants: [
        { id: generateId(), sku: "SH-ARG-250", size: "250ml", stockQuantity: 20 },
        { id: generateId(), sku: "SH-ARG-500", size: "500ml", stockQuantity: 3 },
      ],
    }),
    Product.create({
      id: generateId(),
      categoryId: categories[0].id,
      name: "Shampoo hidratante de coco",
      slug: "shampoo-hidratante-coco",
      description: "Shampoo hidratante con extracto de coco para cabello seco.",
      brand: "Sharon",
      ingredients: "Aceite de coco, glicerina",
      attributes: { hairType: "seco", line: "hidratación", mainIngredient: "coco" },
      basePrice: 42000,
      images: ["https://picsum.photos/seed/shampoo-coco/600/600"],
      variants: [{ id: generateId(), sku: "SH-COC-250", size: "250ml", stockQuantity: 0 }],
    }),
    Product.create({
      id: generateId(),
      categoryId: categories[1].id,
      name: "Acondicionador nutritivo de karité",
      slug: "acondicionador-nutritivo-karite",
      description: "Acondicionador con manteca de karité para nutrición profunda.",
      brand: "Sharon",
      ingredients: "Manteca de karité, vitamina E",
      attributes: { hairType: "rizado", line: "nutrición", mainIngredient: "karité" },
      basePrice: 48000,
      images: ["https://picsum.photos/seed/acond-karite/600/600"],
      variants: [
        { id: generateId(), sku: "AC-KAR-250", size: "250ml", scent: "vainilla", stockQuantity: 15 },
        { id: generateId(), sku: "AC-KAR-250-CO", size: "250ml", scent: "coco", stockQuantity: 8 },
      ],
    }),
    Product.create({
      id: generateId(),
      categoryId: categories[2].id,
      name: "Tratamiento capilar de keratina",
      slug: "tratamiento-capilar-keratina",
      description: "Tratamiento intensivo de keratina para alisado y brillo.",
      brand: "Sharon",
      ingredients: "Keratina hidrolizada, colágeno",
      attributes: { hairType: "todos", line: "alisado", mainIngredient: "keratina" },
      basePrice: 89000,
      compareAtPrice: 75000,
      images: ["https://picsum.photos/seed/tratamiento-keratina/600/600"],
      variants: [{ id: generateId(), sku: "TR-KER-150", size: "150ml", stockQuantity: 12 }],
    }),
  ];

  for (const product of products) {
    await productRepository.save(product);
  }

  // Marca el primer producto como destacado para poder probar [0022]
  // (GET /products/featured) sin pasar por el endpoint de admin.
  await productRepository.setFeatured(products[0].id, true);

  console.log(`Seed de catálogo completo: ${categories.length} categorías, ${products.length} productos.`);
  await AppDataSource.destroy();
}

seedCatalog().catch((err) => {
  console.error("Error al poblar el catálogo:", err);
  process.exit(1);
});
