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
import { DonationOutGoal } from './DonationGoal';
import { Organization } from './Organization';
// import User from './User';

export enum DonationOutStatus {
    DISBURSED = 'DISBURSED',
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}

export enum DonationOutType {
    CASH = "CASH",
    CREDIT_CARD = "CREDIT_CARD",
    BANK_TRANSFER = "BANK_TRANSFER",
    CHECK = "CHECK",
    CRYPTO = "CRYPTO",
    IN_KIND = "IN_KIND",
    OTHER = "OTHER"
}

@Table({ tableName: 'donations_out', timestamps: true, indexes: [{ fields: ['status'] }] })
class DonationOut extends Model {
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
        type: DataType.ENUM(...Object.values(DonationOutType)),
        allowNull: false,
    })
    type!: DonationOutType;

    @Column({
        type: DataType.JSONB,
        allowNull: true,
    })
    itemDetails!: {
        itemType: string;
        quantity: number;
        description: string;
        stockSource?: string;
    } | null;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    purpose!: string;
    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    beneficiaryType!: string | null;
    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    beneficiaryName!: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
        validate: {
            isEmail: true,
        },
    })
    beneficiaryEmail!: string | null;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    beneficiaryPhone!: string | null;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    receiptUrl!: string | null;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    region!: string;

    @Column({
        type: DataType.ENUM(...Object.values(DonationOutStatus)),
        allowNull: false,
        defaultValue: DonationOutStatus.PENDING,
    })
    status!: DonationOutStatus;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    disbursementDate!: Date | null;

    @BelongsToMany(() => Goal, () => DonationOutGoal)
    goals!: Goal[];

    @ForeignKey(() => Event)
    @Column(DataType.UUID)
    eventId!: string | null;

    @BelongsTo(() => Event)
    event!: Event;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    notes!: string | null;

    @Column({
        type: DataType.JSONB,
        allowNull: true,
    })
    impactMetrics!: Record<string, any> | null;

    //   @ForeignKey(() => User)
    //   @Column({
    //     type: DataType.UUID,
    //     allowNull: false,
    //   })
    //   createdById!: string;

    //   @BelongsTo(() => User)
    //   creator!: User;'
    @ForeignKey(() => Organization)
    @Column(DataType.UUID)
    organizationId!: string;

    @BelongsTo(() => Organization)
    organization!: Organization;
}

export default DonationOut;