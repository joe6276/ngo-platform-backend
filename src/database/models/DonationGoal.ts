// DonationGoal.ts
import {
    Table,
    Column,
    Model,
    DataType,
    ForeignKey,
    PrimaryKey,
    Default
} from 'sequelize-typescript';
import Goal from './Goal';
import DonationIn from './DonationIn';
import DonationOut from './DonationOut';

@Table({ tableName: 'donation_in_goals', timestamps: true })
class DonationInGoal extends Model {
    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column(DataType.UUID)
    id!: string;

    @ForeignKey(() => DonationIn)
    @Column(DataType.UUID)
    donationInId!: string;

    @ForeignKey(() => Goal)
    @Column(DataType.UUID)
    goalId!: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    notes!: string | null;
}

@Table({ tableName: 'donation_out_goals', timestamps: true })
export class DonationOutGoal extends Model {
    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column(DataType.UUID)
    id!: string;

    @ForeignKey(() => DonationOut)
    @Column(DataType.UUID)
    donationOutId!: string;

    @ForeignKey(() => Goal)
    @Column(DataType.UUID)
    goalId!: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    notes!: string | null;
}
export default DonationInGoal;