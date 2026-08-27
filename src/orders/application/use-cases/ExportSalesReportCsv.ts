import { SalesReportQueryRepository } from "../../domain/repositories/SalesReportQueryRepository";

const CSV_HEADERS = [
  "orderNumber",
  "placedAt",
  "status",
  "paymentMethod",
  "subtotal",
  "discount",
  "shippingCost",
  "total",
];

/**
 * [0062]: exporta el detalle de pedidos del período en CSV — texto plano
 * armado a mano, sin dependencia nueva. Abre bien en Excel/Sheets, que es lo
 * que el AC ("CSV/Excel") realmente necesita; un `.xlsx` binario real
 * quedaría para si alguna vez hace falta un archivo nativo con fórmulas o
 * múltiples hojas.
 */
export class ExportSalesReportCsv {
  constructor(private readonly salesReportQueryRepository: SalesReportQueryRepository) {}

  async execute(input: { dateFrom: Date; dateTo: Date }): Promise<string> {
    const rows = await this.salesReportQueryRepository.listOrderRows(input.dateFrom, input.dateTo);

    const lines = [CSV_HEADERS.join(",")];
    for (const row of rows) {
      lines.push(
        [
          escapeCsvField(row.orderNumber),
          escapeCsvField(row.placedAt.toISOString()),
          escapeCsvField(row.status),
          escapeCsvField(row.paymentMethod),
          row.subtotal.toFixed(2),
          row.discount.toFixed(2),
          row.shippingCost.toFixed(2),
          row.total.toFixed(2),
        ].join(","),
      );
    }

    return lines.join("\n");
  }
}

function escapeCsvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
