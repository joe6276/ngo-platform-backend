import { Table, Column, Model, DataType, ForeignKey, AllowNull, BelongsTo, PrimaryKey, Default } from 'sequelize-typescript';
import Event from './Event';

@Table({ tableName: 'volunteers', timestamps: false })
export class Volunteer extends Model {
    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column(DataType.UUID)
    id!: string;


    @Column({ type: DataType.STRING, allowNull: false })
    name!: string;

    @Column({ type: DataType.STRING, allowNull: false })
    task!: string;

    @ForeignKey(() => Event)
    @AllowNull(false)
    @Column(DataType.UUID)
    eventId!: string;

    @BelongsTo(() => Event)
    event!: Event;
}