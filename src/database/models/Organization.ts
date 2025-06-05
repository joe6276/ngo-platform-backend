import {
  Table,
  Column,
  Model,
  PrimaryKey,
  Default,
  DataType,
  HasMany,
} from 'sequelize-typescript';
import { User } from './User';

@Table({ tableName: 'organizations' })
export class Organization extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Column
  name!: string;

  @Column({ unique: true })
  subdomain!: string;

  @Default('free')
  @Column
  plan!: string;

  @HasMany(() => User)
  users!: User[];
}
