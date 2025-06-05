import { Column, ForeignKey, Model, Table } from "sequelize-typescript";
import Event from "./Event";

@Table
export class Media extends Model {
    @Column url!: string;
    @Column type!: string;
    @Column size!: number;
    @Column name!: string;

    @ForeignKey(() => Event)
    @Column eventId!: string;
}
