import {
    Table,
    Column,
    Model,
    DataType,
    ForeignKey,
    BelongsTo,
    PrimaryKey,
    Default,
    HasMany,
    BelongsToMany
} from 'sequelize-typescript';
import Goal from './Goal';
import DonationIn from './DonationIn';
import { Feedback } from './Feedback';
import { User } from './User';
import { Organization } from './Organization';
import { Volunteer } from './Volunteer';

export enum EventStatus {
    DRAFT = 'Draft',
    SUBMITTED = 'Submitted',
    APPROVED = 'Approved',
    COMPLETED = 'Completed',
    CANCELLED = 'Cancelled'
}

// export enum EventCategory {
//     TREE_PLANTING = 'Tree Planting',
//     TOURNAMENT = 'Tournament',
//     HEALTH_OUTREACH = 'Health',
//     EDUCATION = 'Education',
//     FUNDRAISING = 'Fundraising',
//     COMMUNITY_MEETING = 'Community Meeting',
//     OTHER = 'Other'
// }

@Table({ tableName: 'events', timestamps: true, indexes: [{ fields: ['status'] }] })
class Event extends Model {
    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column(DataType.UUID)
    id!: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    title!: string;

    @Column({
        type: DataType.TEXT,
        allowNull: false,
    })
    description!: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    category!: string;

    @Column({
        type: DataType.ENUM(...Object.values(EventStatus)),
        allowNull: false,
        defaultValue: EventStatus.DRAFT,
    })
    status!: EventStatus;

    @Column({
        type: DataType.DATE,
        allowNull: false,
    })
    startDate!: Date;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        validate: {
            isAfterStartDate(value: Date) {
                const startDate = (this as unknown as Event).startDate;
                if (new Date(value) <= new Date(startDate)) {
                    throw new Error('endDate must be after startDate');
                }
            },
        },
    })
    endDate!: Date;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    location!: string;

    @ForeignKey(() => Goal)
    @Column(DataType.UUID)
    goalId!: string;

    @BelongsTo(() => Goal)
    goal!: Goal;

    @ForeignKey(() => User)
    @Column({
        type: DataType.UUID,
        allowNull: true, // TODO: Change to true later
    })
    createdById!: string;

    @BelongsTo(() => User)
    creator!: User;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    expectedParticipants!: number | null;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0
    })
    actualParticipants!: number;

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: true,
    })
    budget!: number | null;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    outcomes!: string | null;

    @Column({
        type: DataType.JSONB,
        allowNull: true,
    })
    mediaUrls!: string[] | null;

    @HasMany(() => DonationIn)
    donations!: DonationIn[];

    @HasMany(() => Volunteer)
    volunteerAssignments!: Volunteer[];

    @HasMany(() => Volunteer)
    volunteers!: Volunteer[];

    @HasMany(() => Feedback)
    feedbacks!: Feedback[];

    @ForeignKey(() => Organization)
    @Column(DataType.UUID)
    organizationId!: string;

    @BelongsTo(() => Organization)
    organization!: Organization;

    // Calculate progress based on outcomes and actual participants vs expected
    get progress(): number {
        if (this.status === EventStatus.COMPLETED) {
            return 100;
        } else if (this.status === EventStatus.CANCELLED) {
            return 0;
        } else if (this.status === EventStatus.APPROVED || this.status === EventStatus.SUBMITTED) {
            return 50;
        } else {
            return 25;
        }
    }
}

export default Event;