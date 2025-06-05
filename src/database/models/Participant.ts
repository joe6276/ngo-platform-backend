import { Table, Column, Model, DataType, PrimaryKey, Default, ForeignKey, AllowNull, BelongsTo } from 'sequelize-typescript';
import Event from './Event';

@Table({ tableName: 'participants', timestamps: false })
export class Participant extends Model {
    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column(DataType.UUID)
    id!: string;

    @Column({ type: DataType.STRING, allowNull: false })
    name!: string;

    @Column({ type: DataType.STRING, allowNull: false })
    role!: string;

    @Column({ type: DataType.INTEGER, allowNull: false })
    age!: number;

    @Column({ type: DataType.STRING, allowNull: false })
    contact!: string;

    @Column({ type: DataType.STRING, allowNull: false })
    address!: string;

    @ForeignKey(() => Event)
    @AllowNull(false)
    @Column(DataType.UUID)
    eventId!: string;

    @BelongsTo(() => Event)
    event!: Event;
}
