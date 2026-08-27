export interface BannerListItem {
  id: string;
  imageUrl: string;
  linkUrl: string | null;
  title: string;
  sortOrder: number;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
}

/**
 * Read model de solo lectura de banners. `listForAdmin` trae todos (el panel
 * necesita ver también los inactivos/programados para editarlos);
 * `listActiveForHomepage` es la query pública que sí filtra por vigencia —
 * es lo que hace que "los cambios se reflejen en la home sin despliegue
 * técnico" (AC): una consulta en vivo, sin caché que invalidar.
 */
export interface BannerQueryRepository {
  listForAdmin(): Promise<BannerListItem[]>;

  listActiveForHomepage(now: Date): Promise<BannerListItem[]>;
}
