import { Table, Column, Model, DataType, HasMany, PrimaryKey, Default, BelongsToMany, ForeignKey, BelongsTo } from 'sequelize-typescript';
import KPI from './KPI';
import DonationIn from './DonationIn';
import DonationInGoal, { DonationOutGoal } from './DonationGoal';
import DonationOut from './DonationOut';
import Event from './Event';
import { Organization } from './Organization';

@Table({ tableName: 'goals', timestamps: true, indexes: [{ fields: ['status'] }] })
class Goal extends Model {
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

  @ForeignKey(() => Organization)
  @Column(DataType.UUID)
  organizationId!: string;

  @BelongsTo(() => Organization)
  organization!: Organization;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })

  region!: string;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    validate: { min: 0 },
  })
  targetAmount!: number;

  @Column({
    type: DataType.DECIMAL(5, 2),
    defaultValue: 0,
  })
  progress!: number;

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
        const startDate = (this as unknown as Goal).startDate;
        if (new Date(value) <= new Date(startDate)) {
          throw new Error('endDate must be after startDate');
        }
      },
    },
  })
  endDate!: Date;

  @Column({
    type: DataType.ENUM('Not Started', 'Started (Low Risk)', 'Started (High Risk)', 'At Risk', 'Achieved'),
    allowNull: false,
    defaultValue: 'Not Started',
  })
  status!: string;



  @Column({
    type: DataType.DECIMAL(5, 2),
    defaultValue: 0,
  })
  progressPercentage!: number;

  @Column({
    type: DataType.DECIMAL(5, 2),
    defaultValue: 0,
  })
  successRate!: number;

  @HasMany(() => KPI)
  kpis!: KPI[];

  @HasMany(() => Event)
  events!: Event[];

  @BelongsToMany(() => DonationIn, () => DonationInGoal)
  donationsIn!: DonationIn[];

  @BelongsToMany(() => DonationOut, () => DonationOutGoal)
  donationsOut!: DonationOut[];

  // Hooks for computed fields and status
  public static initializeHooks() {
    this.beforeSave(async (goal) => {
      const [kpis, events, donationsIn, donationsOut] = await Promise.all([
        KPI.findAll({ where: { goalId: goal.id } }),
        Event.findAll({ where: { goalId: goal.id } }),
        goal.$get('donationsIn'),
        goal.$get('donationsOut'),
      ]);

      const totalProgress = kpis.reduce((sum, kpi) => sum + (Number(kpi.progress) || 0), 0);
      goal.progress = totalProgress;
      goal.progressPercentage = goal.targetAmount ? (totalProgress / goal.targetAmount) * 100 : 0;
      goal.successRate = Math.min(Math.max(goal.progressPercentage, 0), 100);
      goal.progressPercentage = goal.successRate;

      const now = new Date();
      const timeRemainingMonths = (goal.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);

      const hasKeyResources = events.length > 0 || donationsIn.length > 0 || donationsOut.length > 0;

      if (goal.progressPercentage >= 100) {
        goal.status = 'Achieved';
      } else if (!hasKeyResources) {
        goal.status = 'Not Started';
      } else if (goal.progressPercentage < 25 && !hasKeyResources) {
        goal.status = 'At Risk';
      } else if (events.length < 5 && timeRemainingMonths < 2) {
        goal.status = 'Started (High Risk)';
      } else if (events.length < 5 && timeRemainingMonths >= 6) {
        goal.status = 'Started (Low Risk)';
      } else {
        goal.status = 'Started (Low Risk)';
      }
    });
  }

  get timeProgress(): number {
    const now = new Date();
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    const elapsed = now.getTime() - start.getTime();
    const total = end.getTime() - start.getTime();
    return total > 0 ? Math.min(Math.max((elapsed / total) * 100, 0), 100) : 0;
  }

}

export default Goal;