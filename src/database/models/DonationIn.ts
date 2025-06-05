import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  PrimaryKey,
  Default,
  BelongsToMany
} from 'sequelize-typescript';
import Goal from './Goal';
import Event from './Event';
import DonationInGoal from './DonationGoal';
import { Organization } from './Organization';
// import User from './User';

export enum DonationSource {
  INDIVIDUAL = 'Individual',
  INSTITUTIONAL = 'Institutional',
  GRANT = 'Grant',
  CORPORATE = 'Corporate',
  GOVERNMENT = 'Government',
  OTHER = 'Other'
}

export enum DonationStatus {
  PENDING = 'PENDING',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED',
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED"
}

export enum DonationType {
  CASH = "CASH",
  CREDIT_CARD = "CREDIT_CARD",
  BANK_TRANSFER = "BANK_TRANSFER",
  CHECK = "CHECK",
  CRYPTO = "CRYPTO",
  IN_KIND = "IN_KIND",
  OTHER = "OTHER"
}

@Table({ tableName: 'donations_in', timestamps: true, indexes: [{ fields: ['status'] }] })
class DonationIn extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    validate: { min: 0 },
  })
  amount!: number;

  @Column({
    type: DataType.STRING(3),
    allowNull: false,
    defaultValue: 'USD',
  })
  currency!: string;

  @Column({
    type: DataType.ENUM(...Object.values(DonationType)),
    allowNull: false,
  })
  type!: DonationType;

  @Column({
    type: DataType.ENUM(...Object.values(DonationSource)),
    allowNull: false,
  })
  source!: DonationSource;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  purpose!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  donorName!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    validate: {
      isEmail: true,
    },
  })
  donorEmail!: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  donorPhone!: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  receiptUrl!: string | null;

  @Column({
    type: DataType.ENUM(...Object.values(DonationStatus)),
    allowNull: false,
    defaultValue: DonationStatus.PENDING,
  })
  status!: DonationStatus;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  isAnonymous!: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  receivedDate!: Date | null;

  @BelongsToMany(() => Goal, () => DonationInGoal)
  goals!: Goal[];

  @ForeignKey(() => Event)
  @Column(DataType.UUID)
  eventId!: string | null;

  @BelongsTo(() => Event)
  event!: Event;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  isRecurring!: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  recurringFrequency!: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  notes!: string | null;

  @ForeignKey(() => Organization)
  @Column(DataType.UUID)
  organizationId!: string;

  @BelongsTo(() => Organization)
  organization!: Organization;

  //   @ForeignKey(() => User)
  //   @Column({
  //     type: DataType.UUID,
  //     allowNull: false,
  //   })
  //   createdById!: string;

  //   @BelongsTo(() => User)
  //   creator!: User;
}

export default DonationIn;