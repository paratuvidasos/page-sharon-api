# CLAUDE.md — Backend (E-commerce Productos Capilares)

Guía de contexto para Claude Code al trabajar en este repositorio. Este es el backend, un monolito modular en **Node.js + TypeScript, sin framework de aplicación tipo NestJS** (decisión del equipo: Node.js "plano", no decoradores de framework para controllers/módulos — ver la sección "Decoradores: dónde sí y dónde no" más abajo). El frontend vive en un repositorio separado (`page-sharon-ecommerce`) y se comunica con este servicio únicamente vía HTTPS/API.

## Git: commits y push

Claude Code **nunca** debe ejecutar `git commit` ni `git push` (ni ningún comando que publique o cree commits) en este repositorio, aunque el usuario lo pida explícitamente. El usuario hace sus propios commits y pushes manualmente. Lo único que Claude puede hacer es **redactar el texto/mensaje del commit** cuando se le pida, para que el usuario lo use él mismo.

## Arquitectura general

```
┌─────────────┐        HTTPS/API         ┌──────────────────┐
│   Frontend   │ ───────────────────────▶ │     Backend       │
│ (React+Vite) │                          │ (Node.js Modular  │
│  SPA, CDN    │                          │    Monolith)      │
└─────────────┘                          └──────────────────┘
                                                  │
                                          ┌───────┴────────┐
                                          │    Postgres     │
                                          │  Redis (cache)  │
                                          └────────────────┘
```

* Un solo servicio desplegable (monolito), pero internamente dividido en módulos independientes con su propio dominio.
* Cada módulo sigue Clean Architecture: `domain/ → application/ → infrastructure/`. Las dependencias apuntan siempre hacia adentro (`domain` no importa nada de `application` ni `infrastructure`).
* La comunicación entre módulos no se hace importando directamente clases de infraestructura de otro módulo — se hace a través de `shared-kernel/` (eventos de dominio, tipos/contratos comunes) o mediante los casos de uso (application layer) expuestos por el módulo, nunca accediendo a su infraestructura interna.
* **Un solo motor de base de datos: Postgres** (vía TypeORM). No hay MongoDB en este proyecto — si en el pasado viste esa mención en este archivo, quedó descartada; todo el catálogo (incluidos atributos variables por categoría) también vive en Postgres (columnas `jsonb` para lo verdaderamente dinámico, no una base de datos aparte).
* HTTP framework: **Express** (asumido por ser el más común para "Node.js plano" con este stack — confirmar con el equipo si prefieren Fastify; si cambia, el patrón de carpetas de `infrastructure/http/` de abajo se traduce casi 1:1).

## Decoradores: dónde sí y dónde no

Este proyecto **no usa un framework de aplicación con decoradores** (nada de `@Controller()`, `@Injectable()`, `@Module()` al estilo NestJS/Angular). Los controllers, rutas y casos de uso son **funciones y clases planas**, sin metaprogramación de framework.

La única excepción son los **decoradores de TypeORM** (`@Entity()`, `@Column()`, `@OneToMany()`, etc.), y viven **exclusivamente** en `infrastructure/persistence/entities/` — son mapeo de datos (le dicen a TypeORM cómo guardar una fila), no lógica de negocio ni framework de aplicación. Las entidades de **dominio** (`domain/entities/`) son clases TypeScript puras, sin ningún decorador, y nunca son las mismas clases que las entidades de TypeORM (ver regla 5 más abajo).

Si en algún punto se evalúa adoptar NestJS, esta sección y las reglas de "sin imports cruzados de infraestructura" siguen aplicando igual — NestJS es compatible con esta misma separación domain/application/infrastructure.

## Estructura de carpetas

```
src/
├── catalog/              ← productos, categorías, atributos, variantes, stock
│   ├── domain/
│   │   ├── entities/        (Product.ts — clase de dominio pura, sin decoradores)
│   │   ├── enums/           (ProductStatus.ts, StockStatus.ts)
│   │   ├── value-objects/   (Money.ts, Sku.ts)
│   │   └── repositories/    (ProductRepository.ts — interfaz/puerto, sin implementación)
│   ├── application/
│   │   └── use-cases/       (CreateProduct.ts, GetProductById.ts, ListProducts.ts)
│   └── infrastructure/
│       ├── http/
│       │   ├── catalog.routes.ts        (registra las rutas Express del módulo)
│       │   ├── catalog.controller.ts    (funciones handler: reciben req/res, llaman un use-case)
│       │   └── schemas/                 (product.schema.ts — zod: valida input Y genera el doc de Swagger)
│       └── persistence/
│           ├── entities/                (ProductOrmEntity.ts — @Entity() de TypeORM)
│           ├── mappers/                 (ProductMapper.ts — ProductOrmEntity ↔ Product de dominio)
│           ├── typeorm-product.repository.ts   (implementa ProductRepository)
│           └── migrations/
├── accounts/              ← registro, login, perfil, direcciones
│   └── (mismo patrón: domain/ → application/ → infrastructure/)
├── cart/                  ← carrito de compras
├── orders/                ← checkout, órdenes, estados del pedido
├── payments/              ← integración con pasarela de pago (pendiente de definir)
├── shipping/              ← cálculo de envío, zonas, transportadoras
├── aftersales/            ← devoluciones, reembolsos, reseñas, soporte
├── admin/                 ← casos de uso exclusivos de panel administrativo
└── shared-kernel/
    ├── domain/              (eventos de dominio, tipos comunes, Result/Either, DomainException base)
    └── infrastructure/
        ├── http/            (error-handler middleware, paginación común, respuesta estándar)
        └── swagger/          (registry central de OpenAPI, ver sección Swagger)
```

Nota: la lista de módulos se propone en base a los 8 módulos ya definidos en el backlog de historias de usuario (ClickUp, Space "sharon"). Ajusta nombres/alcance si cambian.

## Reglas de arquitectura (no negociables)

1. Dependencia hacia adentro: `infrastructure` puede importar `application` y `domain`; `application` puede importar `domain`; `domain` no importa nada de las otras dos capas.
2. Sin imports cruzados de infraestructura entre módulos. Si `orders` necesita datos de `catalog`, lo hace a través de un caso de uso/puerto expuesto, nunca importando el repositorio de `catalog` directamente.
3. Comunicación asíncrona entre módulos vía eventos de dominio (`shared-kernel`) cuando la acción de un módulo debe disparar efectos en otro (ej: `orders` confirma pago → evento → `shipping` genera la instrucción de envío).
4. Cada módulo es dueño de sus propias tablas. No hay joins directos entre esquemas de distintos módulos a nivel de base de datos — si `orders` necesita datos de `catalog`, los pide vía el caso de uso expuesto, no con un `JOIN` cruzando módulos.
5. **Entidad de dominio ≠ entidad de TypeORM.** `domain/entities/Product.ts` es la clase con las reglas de negocio; `infrastructure/persistence/entities/ProductOrmEntity.ts` es el mapeo a la tabla (con decoradores de TypeORM). Un `mapper` en infraestructura convierte entre ambas. Esto evita que un decorador de TypeORM (o una migración) filtre accidentalmente lógica de negocio a la capa de persistencia.
6. Los DTOs/schemas de entrada y salida de la capa HTTP viven en `infrastructure/http/schemas/` (como schemas de `zod`), nunca se exponen entidades de dominio ni entidades de TypeORM directamente en la respuesta de la API.

## Repository pattern

* Cada agregado raíz tiene **una interfaz de repositorio** en `domain/repositories/` (ej. `ProductRepository`), con los métodos que el dominio necesita — nombrados en términos de negocio, no de SQL (`findAvailableByCategory(categoryId)`, no `findWhereStatusEqualsAndCategoryIdEquals(...)`).
* La implementación concreta vive en `infrastructure/persistence/` como `TypeOrmProductRepository`, que implementa esa interfaz usando `Repository<ProductOrmEntity>` de TypeORM (inyectado vía constructor, sin contenedor de DI mágico — instanciación explícita en el composition root del módulo).
* **Separar comandos de queries dentro del propio repositorio:**
  - Métodos de **escritura** (`save`, `delete`) trabajan con la entidad de dominio completa — hidratan el agregado, aplican invariantes, y persisten.
  - Métodos de **lectura simple** (`findById`, `findByIds`) también devuelven la entidad de dominio hidratada.
  - Métodos de **lectura para listados/reportes** (`listForCatalogPage`, `searchByFilters`) pueden devolver un **read model** plano (DTO de solo lectura, no la entidad de dominio) cuando hidratar el agregado completo sea innecesario o costoso — ver sección Queries. Estos métodos NO viven en la interfaz `domain/repositories/`, sino en una interfaz aparte tipo `domain/repositories/ProductQueryRepository` (o directamente en infraestructura si el caso de uso los consume vía un puerto de solo-lectura específico), para que quede explícito en el nombre que no es el repositorio "de escritura" del agregado.
* Un repositorio por agregado raíz, no un repositorio genérico por tabla — si `Order` tiene `OrderLine` como parte del mismo agregado, `OrderRepository.save(order)` persiste ambos en una transacción, no hay un `OrderLineRepository` aparte.
* Nunca se inyecta `DataSource`/`EntityManager` de TypeORM directamente en un caso de uso — siempre a través de la interfaz de repositorio del dominio, así los tests de `application` pueden mockear la interfaz sin tocar TypeORM.

## Enums

* Los enums de **dominio** (los que representan reglas de negocio: `OrderStatus`, `ProductStatus`, `PaymentMethod`) se definen como `enum` de TypeScript en `domain/enums/`, con valores en `UPPER_SNAKE_CASE` (ej. `PENDING`, `IN_PREPARATION`) — son el vocabulario del negocio, no deben cambiar por conveniencia de la base de datos.
* En la entidad de TypeORM, la columna se mapea contra ese mismo enum (`@Column({ type: 'enum', enum: OrderStatus })`) — **un solo enum, importado tanto por el dominio como por la entidad de persistencia**, nunca dos listas de valores separadas que puedan desincronizarse.
* Los schemas de Swagger/zod para la capa HTTP también importan el mismo enum de dominio (`z.nativeEnum(OrderStatus)`) — así el enum tiene una única fuente de verdad que se propaga a la DB, al dominio y a la documentación de la API.
* No usar `string` suelto ni "magic strings" donde exista un enum de dominio — si un valor tiene un conjunto cerrado de opciones válidas conocido de antemano, es un enum, no un `string`.
* Migraciones de enum (agregar un valor nuevo) se hacen con una migración explícita de TypeORM (`ALTER TYPE ... ADD VALUE`), nunca editando el enum de TypeScript sin la migración correspondiente — el enum de código y el `enum` nativo de Postgres deben avanzar juntos.

## Queries

* Para operaciones CRUD simples sobre un agregado (buscar por id, guardar, borrar): métodos del repositorio de dominio (ver arriba), no query builder suelto en el caso de uso.
* Para queries de **lectura compleja** (listados con filtros, paginación, agregaciones, joins de solo-lectura entre varias tablas del mismo módulo): usar el **QueryBuilder de TypeORM** dentro de un método del `*QueryRepository`, devolviendo un read model plano — no forzar esas queries a pasar por `find()`/relaciones eager del repositorio de escritura.
* **Evitar N+1:** cualquier relación que se sepa que se va a necesitar en la respuesta se trae con `leftJoinAndSelect` explícito en la query, nunca confiando en carga perezosa (`lazy: true`) disparada campo por campo dentro de un loop.
* **Paginación:** todo listado expuesto por HTTP es paginado por defecto (cursor o `limit`/`offset`, a definir por el equipo — pero nunca "traer todo" sin límite). El contrato de paginación (nombres de query params, forma de la respuesta con `items` + metadata) vive en `shared-kernel/infrastructure/http/pagination.ts` para que todos los módulos respondan igual.
* Las queries de reporting/analítica pesadas (si aparecen) no van contra las tablas transaccionales en caliente sin evaluar antes una réplica de lectura o una vista materializada — no es una limitación de hoy, es una señal de alerta a validar antes de escribir la query.

## Documentación con Swagger

* La API se documenta con **OpenAPI 3**, generado a partir de los mismos schemas de `zod` que ya validan el request/response — **una sola fuente de verdad para validación y documentación**, para que no se desincronicen (paquete sugerido: `zod-to-openapi`; ajustar si el equipo prefiere `swagger-jsdoc` con comentarios, pero entonces asumir el costo de mantenerlos sincronizados a mano).
* Cada schema de request/response (`infrastructure/http/schemas/*.schema.ts`) se registra una vez en `shared-kernel/infrastructure/swagger/registry.ts`, con su `tag` (nombre del módulo: `catalog`, `orders`, etc.) y ejemplo.
* La UI interactiva se sirve en `/api/docs` (vía `swagger-ui-express`), y el JSON crudo en `/api/docs.json`. Nunca se documenta manualmente en un README aparte — si el schema de zod cambió, el doc cambia solo.
* Versionado de API: prefijo `/api/v1/...` desde el día uno, aunque hoy solo exista v1 — evita una migración dolorosa cuando haya un v2.
* Todo enum expuesto en un schema usa `z.nativeEnum(...)` contra el enum de dominio (ver sección Enums) — así Swagger siempre muestra los valores válidos reales, no una lista copiada a mano que se desactualiza.

## Persistencia

* **Postgres** para todo: datos transaccionales (orders, payments, accounts, inventario/stock) y catálogo (incluyendo atributos variables por categoría vía columnas `jsonb` cuando de verdad lo requieran — no por defecto).
* **Redis**: cache de lectura (catálogo, sesiones de carrito de invitados, rate-limiting de login) — nunca como fuente de verdad.
* Migraciones de TypeORM versionadas en `infrastructure/persistence/migrations/` de cada módulo, nunca `synchronize: true` fuera de un entorno local efímero.

## Convenciones de código

* TypeScript estricto (`strict: true`).
* Casos de uso (application layer) con un método público por caso de uso (patrón Command/UseCase), no "services" gigantes con 20 métodos.
* Value Objects para conceptos de dominio con validación propia (ej. `Email`, `Money`, `Sku`), no strings/numbers sueltos.
* Errores de dominio como excepciones tipadas propias (`DomainException` y subclases), mapeadas a códigos HTTP en un middleware de manejo de errores de Express (`shared-kernel/infrastructure/http/error-handler.ts`), no al revés.
* Inyección de dependencias explícita (constructor injection manual, sin contenedor de DI ni decoradores) — un módulo expone una función `buildCatalogModule()` (o similar) que instancia repositorio → casos de uso → controller y devuelve el router de Express listo para montar.

## Testing

* Domain: pruebas unitarias puras, sin mocks de infraestructura.
* Application: pruebas de casos de uso con repositorios/puertos mockeados (interfaces del dominio) — nunca contra TypeORM real.
* Infrastructure: pruebas de integración contra Postgres real (contenedor de test, ej. Testcontainers), incluyendo los repositorios de TypeORM y las queries complejas del `*QueryRepository`.
* Los flujos críticos de negocio (checkout completo, pago fallido, cancelación con reverso de stock) requieren al menos un test de integración end-to-end del módulo.

## Trazabilidad con el backlog

Las historias de usuario y sus subtasks viven en ClickUp (Space "sharon"), numeradas `[0001]` a `[0072]`. Al trabajar en una funcionalidad, referenciar el ID correspondiente en el commit o PR (ej. `[0038] Confirmar y colocar el pedido`) para mantener trazabilidad entre código y requerimiento.

## Pendiente de definir (no asumir en el código)

* Confirmar Express vs Fastify (este doc asume Express).
* Herramienta exacta de generación de Swagger (`zod-to-openapi` asumido; confirmar si el equipo prefiere `swagger-jsdoc` u otra).
* Estrategia de paginación (cursor vs offset) para el contrato común de `shared-kernel`.
* Pasarela(s) de pago a integrar.
* Transportadora(s) de envío a integrar.
* Alcance final de multi-moneda/multi-idioma (marcado como "a futuro" en el backlog del frontend).

## Comandos (ajustar según package.json real — proyecto aún sin scaffolding)

```bash
npm run start:dev       # desarrollo con watch
npm run migration:run   # aplicar migraciones de TypeORM
npm run test            # unit tests
npm run test:e2e        # integración/e2e
npm run lint
npm run build
```