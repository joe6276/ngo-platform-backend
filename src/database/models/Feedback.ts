import {
    Table,
    Column,
    Model,
    ForeignKey,
    BelongsTo,
    DataType,
    PrimaryKey,
    AllowNull,
    Default,
} from 'sequelize-typescript';
import Event from './Event';
import { User } from './User';

export enum FeedbackType {
    EVENT_PARTICIPANT = 'EventParticipant',
    VOLUNTEER_REFLECTION = 'VolunteerReflection',
    COMMUNITY_GENERAL = 'CommunityGeneral',
    TESTIMONIAL_PROPOSAL = 'TestimonialProposal',
}

export enum FeedbackStatus {
    UNDER_REVIEW = 'Under review',
    NEEDS_FOLLOW_UP = 'Needs follow up',
    APPROVED_FOR_PUBLIC = 'Approved',
    ARCHIVED = 'Archived',
    REJECTED = 'Rejected',
}

@Table({
    tableName: 'feedbacks',
    timestamps: true,
})
export class Feedback extends Model {
    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column(DataType.UUID)
    id!: string;

    @ForeignKey(() => Event)
    @AllowNull(true)
    @Column(DataType.UUID)
    eventId?: string;

    @BelongsTo(() => Event)
    event?: Event;

    @ForeignKey(() => User)
    @AllowNull(true)
    @Column(DataType.UUID)
    userId?: string;

    @BelongsTo(() => User)
    user?: User;

    @AllowNull(true)
    @Column(DataType.STRING)
    submittedByName?: string;

    @AllowNull(true)
    @Column(DataType.STRING)
    submittedByEmail?: string;

    @AllowNull(false)
    @Column(DataType.ENUM(...Object.values(FeedbackType)))
    feedbackType!: FeedbackType;

    @AllowNull(false)
    @Column(DataType.TEXT)
    content!: string;

    @AllowNull(true)
    @Column(DataType.INTEGER)
    rating?: number;

    @AllowNull(false)
    @Default(FeedbackStatus.UNDER_REVIEW)
    @Column(DataType.ENUM(...Object.values(FeedbackStatus)))
    status!: FeedbackStatus;

    @ForeignKey(() => User)
    @AllowNull(true)
    @Column(DataType.UUID)
    reviewedByUserId?: string;

    @BelongsTo(() => User, 'reviewedByUserId')
    reviewedByUser?: User;

    @AllowNull(true)
    @Column(DataType.DATE)
    reviewedAt?: Date;

    @AllowNull(true)
    @Column(DataType.TEXT)
    notes?: string;
}
