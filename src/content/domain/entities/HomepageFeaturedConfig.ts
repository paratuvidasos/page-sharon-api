import { AutomaticFeaturedRule } from "../enums/AutomaticFeaturedRule";
import { FeaturedSelectionMode } from "../enums/FeaturedSelectionMode";

/** Id fijo de la única fila de configuración — es un singleton, no un catálogo. */
export const HOMEPAGE_FEATURED_CONFIG_ID = "default";

export interface HomepageFeaturedConfigProps {
  id: string;
  mode: FeaturedSelectionMode;
  manualProductIds: string[];
  automaticRule: AutomaticFeaturedRule;
}

export interface SetHomepageFeaturedConfigInput {
  mode: FeaturedSelectionMode;
  manualProductIds?: string[];
  automaticRule?: AutomaticFeaturedRule;
}

/**
 * [0066]: "se pueden seleccionar manualmente los productos destacados o
 * dejarlos automáticos según reglas (más vendidos, novedades)" (AC).
 * Singleton: una sola fila para toda la tienda, no una por categoría ni por
 * campaña — eso queda fuera de alcance de esta US.
 */
export class HomepageFeaturedConfig {
  private constructor(private props: HomepageFeaturedConfigProps) {}

  /** Default seguro para cuando todavía no existe la fila (primer arranque). */
  static defaults(): HomepageFeaturedConfig {
    return new HomepageFeaturedConfig({
      id: HOMEPAGE_FEATURED_CONFIG_ID,
      mode: FeaturedSelectionMode.AUTOMATIC,
      manualProductIds: [],
      automaticRule: AutomaticFeaturedRule.BEST_SELLERS,
    });
  }

  static reconstitute(props: HomepageFeaturedConfigProps): HomepageFeaturedConfig {
    return new HomepageFeaturedConfig(props);
  }

  get mode(): FeaturedSelectionMode {
    return this.props.mode;
  }

  get manualProductIds(): string[] {
    return [...this.props.manualProductIds];
  }

  get automaticRule(): AutomaticFeaturedRule {
    return this.props.automaticRule;
  }

  set(input: SetHomepageFeaturedConfigInput): void {
    this.props.mode = input.mode;
    if (input.manualProductIds !== undefined) {
      this.props.manualProductIds = Array.from(new Set(input.manualProductIds));
    }
    if (input.automaticRule !== undefined) {
      this.props.automaticRule = input.automaticRule;
    }
  }

  toProps(): HomepageFeaturedConfigProps {
    return { ...this.props, manualProductIds: [...this.props.manualProductIds] };
  }
}
