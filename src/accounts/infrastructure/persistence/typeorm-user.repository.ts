import { DataSource, Repository } from "typeorm";
import { User } from "../../domain/entities/User";
import { UserRepository } from "../../domain/repositories/UserRepository";
import { Email } from "../../domain/value-objects/Email";
import { UserAddressOrmEntity } from "./entities/addresses/UserAddressOrmEntity";
import { UserOrmEntity } from "./entities/UserOrmEntity";
import { UserMapper } from "./mappers/UserMapper";

export class TypeOrmUserRepository implements UserRepository {
  private readonly ormRepository: Repository<UserOrmEntity>;

  constructor(dataSource: DataSource) {
    this.ormRepository = dataSource.getRepository(UserOrmEntity);
  }

  async save(user: User): Promise<void> {
    await this.ormRepository.save(UserMapper.toOrm(user));
  }

  async findById(id: string): Promise<User | null> {
    const orm = await this.ormRepository.findOne({
      where: { id },
      relations: { addresses: true },
    });
    return orm ? UserMapper.toDomain(orm) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const orm = await this.ormRepository.findOne({
      where: { email: email.toString() },
      relations: { addresses: true },
    });
    return orm ? UserMapper.toDomain(orm) : null;
  }

  async deleteAddress(addressId: string): Promise<void> {
    await this.ormRepository.manager.delete(UserAddressOrmEntity, { id: addressId });
  }
}
