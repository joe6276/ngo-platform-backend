import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    Default,
    AllowNull,
    Unique,
    HasMany,
    BelongsToMany,
    IsEmail,
    ForeignKey,
    BelongsTo,
} from 'sequelize-typescript';
import Event from './Event';
import { Feedback } from './Feedback';
import { UserRole } from '../../types/rbac.types';
import { AuditLog } from './AuditLog';
import { Organization } from './Organization';

@Table({
    tableName: 'users',
    timestamps: true,
})
export class User extends Model {
    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column(DataType.UUID)
    id!: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    firstName!: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    lastName!: string;

    @AllowNull(false)
    @Unique
    @IsEmail
    @Column(DataType.STRING)
    email!: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    password!: string;

    @AllowNull(true)
    @Column(DataType.STRING)
    phoneNumber?: string;

    @Column({
        type: DataType.ENUM(...Object.values(UserRole)),
        allowNull: false,
        defaultValue: UserRole.VOLUNTEER
    })
    role!: UserRole;

    @ForeignKey(() => Organization)
    @Column(DataType.UUID)
    organizationId!: string;

    @BelongsTo(() => Organization)
    organization!: Organization;

    @AllowNull(true)
    @Column(DataType.ARRAY(DataType.STRING))
    skills?: string[];

    @AllowNull(true)
    @Column(DataType.TEXT)
    availability?: string;

    @AllowNull(true)
    @Column(DataType.STRING)
    profilePictureUrl?: string;

    @AllowNull(false)
    @Default(true)
    @Column(DataType.BOOLEAN)
    isActive!: boolean;

    @AllowNull(false)
    @Default(false)
    @Column(DataType.BOOLEAN)
    isEmailVerified!: boolean;

    @AllowNull(true)
    @Column(DataType.DATE)
    lastLoginAt?: Date;

    @HasMany(() => Feedback, 'userId')
    submittedFeedbacks!: Feedback[];

    @HasMany(() => Feedback, 'reviewedByUserId')
    reviewedFeedbacks!: Feedback[];

    @HasMany(() => AuditLog)
    auditLogs!: AuditLog[];

    get fullName(): string {
        return `${this.firstName} ${this.lastName}`;
    }
}
