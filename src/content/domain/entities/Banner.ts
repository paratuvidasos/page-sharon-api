import { BannerActionType } from "../enums/BannerActionType";
import { BannerCategory } from "../enums/BannerCategory";
import { BannerPlacement } from "../enums/BannerPlacement";
import { InvalidBannerException } from "../exceptions/InvalidBannerException";

export interface BannerProps {
  id: string;
  imageUrl: string;
  linkUrl: string | null;
  title: string;
  sortOrder: number;
  /** `null` = sin fecha de inicio (ya visible). */
  startsAt: Date | null;
  /** `null` = sin fecha de fin (no expira). */
  endsAt: Date | null;
  isActive: boolean;
  category: BannerCategory;
  actionType: BannerActionType;
  /** Dónde se muestra el banner — puede vivir en varios lugares a la vez, nunca vacío. */
  placements: BannerPlacement[];
  createdAt: Date;
}

export interface CreateBannerInput {
  id: string;
  imageUrl: string;
  linkUrl?: string | null;
  title: string;
  sortOrder: number;
  startsAt?: Date | null;
  endsAt?: Date | null;
  isActive?: boolean;
  category: BannerCategory;
  actionType: BannerActionType;
  placements: BannerPlacement[];
}

export interface UpdateBannerInput {
  imageUrl?: string;
  linkUrl?: string | null;
  title?: string;
  startsAt?: Date | null;
  endsAt?: Date | null;
  isActive?: boolean;
  category?: BannerCategory;
  actionType?: BannerActionType;
  placements?: BannerPlacement[];
}

/**
 * [0066]: banner promocional de la home. "Se pueden subir, ordenar y
 * programar banners con fecha de inicio y fin" (AC) — el orden vive en
 * `sortOrder`, reasignado siempre con el set completo (`ReorderBanners`,
 * igual que `ShippingZone.replaceRates`: el panel manda la lista ordenada
 * completa, no un parche).
 */
export class Banner {
  private constructor(private props: BannerProps) {}

  static create(input: CreateBannerInput): Banner {
    validateSchedule(input.startsAt ?? null, input.endsAt ?? null);
    validatePlacements(input.placements);
    const title = input.title.trim();
    if (!title) {
      throw new InvalidBannerException("El banner necesita un título.");
    }

    return new Banner({
      id: input.id,
      imageUrl: input.imageUrl,
      linkUrl: input.linkUrl ?? null,
      title,
      sortOrder: input.sortOrder,
      startsAt: input.startsAt ?? null,
      endsAt: input.endsAt ?? null,
      isActive: input.isActive ?? true,
      category: input.category,
      actionType: input.actionType,
      placements: input.placements,
      createdAt: new Date(),
    });
  }

  static reconstitute(props: BannerProps): Banner {
    return new Banner(props);
  }

  get id(): string {
    return this.props.id;
  }

  update(input: UpdateBannerInput): void {
    const startsAt = input.startsAt !== undefined ? input.startsAt : this.props.startsAt;
    const endsAt = input.endsAt !== undefined ? input.endsAt : this.props.endsAt;
    validateSchedule(startsAt, endsAt);

    if (input.imageUrl !== undefined) {
      this.props.imageUrl = input.imageUrl;
    }
    if (input.linkUrl !== undefined) {
      this.props.linkUrl = input.linkUrl;
    }
    if (input.title !== undefined) {
      const title = input.title.trim();
      if (!title) {
        throw new InvalidBannerException("El banner necesita un título.");
      }
      this.props.title = title;
    }
    this.props.startsAt = startsAt;
    this.props.endsAt = endsAt;
    if (input.isActive !== undefined) {
      this.props.isActive = input.isActive;
    }
    if (input.category !== undefined) {
      this.props.category = input.category;
    }
    if (input.actionType !== undefined) {
      this.props.actionType = input.actionType;
    }
    if (input.placements !== undefined) {
      validatePlacements(input.placements);
      this.props.placements = input.placements;
    }
  }

  reorder(sortOrder: number): void {
    this.props.sortOrder = sortOrder;
  }

  toProps(): BannerProps {
    return { ...this.props };
  }
}

function validateSchedule(startsAt: Date | null, endsAt: Date | null): void {
  if (startsAt && endsAt && endsAt <= startsAt) {
    throw new InvalidBannerException("La fecha de fin debe ser posterior a la de inicio.");
  }
}

function validatePlacements(placements: BannerPlacement[]): void {
  if (placements.length === 0) {
    throw new InvalidBannerException("El banner necesita al menos un lugar donde mostrarse.");
  }
}
