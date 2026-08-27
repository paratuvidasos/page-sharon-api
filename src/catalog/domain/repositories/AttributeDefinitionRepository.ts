import { AttributeDefinition } from "../entities/AttributeDefinition";

/**
 * [0058]: repositorio único (sin split de lectura/escritura) para el
 * vocabulario controlado de atributos — es una tabla de referencia chica que
 * el admin edita ocasionalmente, no un listado de catálogo de alto volumen
 * (desviación deliberada del split CQ estricto, ver CLAUDE.md sección
 * "Repository pattern").
 */
export interface AttributeDefinitionRepository {
  save(attribute: AttributeDefinition): Promise<void>;

  findById(id: string): Promise<AttributeDefinition | null>;

  findByKey(key: string): Promise<AttributeDefinition | null>;

  findAll(): Promise<AttributeDefinition[]>;

  delete(id: string): Promise<void>;
}
