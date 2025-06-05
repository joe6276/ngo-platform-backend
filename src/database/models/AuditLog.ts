import { Table, Column, Model, DataType, BelongsTo, ForeignKey } from 'sequelize-typescript';
import { User } from './User';

@Table({
  tableName: 'audit_logs',
  timestamps: true
})
export class AuditLog extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true
  })
  id!: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false
  })
  userId!: string;

  @BelongsTo(() => User)
  user!: User;

  @Column({
    type: DataType.STRING,
    allowNull: false
  })
  action!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false
  })
  resource!: string;

  @Column({
    type: DataType.UUID
  })
  resourceId!: string;

  @Column({
    type: DataType.JSON
  })
  oldValues!: object;

  @Column({
    type: DataType.JSON
  })
  newValues!: object;

  @Column({
    type: DataType.STRING
  })
  ipAddress!: string;

  @Column({
    type: DataType.TEXT
  })
  userAgent!: string;
}