import { Table, Column, Model, DataType, ForeignKey, BelongsTo, PrimaryKey, Default } from 'sequelize-typescript';
import Goal from './Goal';
import { Organization } from './Organization';

@Table({ tableName: 'kpis', timestamps: true })
class KPI extends Model {
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

  @ForeignKey(() => Goal)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  goalId!: string;

  @BelongsTo(() => Goal)
  goal!: Goal;

  @ForeignKey(() => Organization)
  @Column(DataType.UUID)
  organizationId!: string;

  @BelongsTo(() => Organization)
  organization!: Organization;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    validate: { min: 0 },
  })
  target!: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
    validate: { min: 0 },
  })
  progress!: number;

  @Column({
    type: DataType.DECIMAL(5, 2),
    defaultValue: 0,
  })
  successRate!: number;

  // @Column({
  //   type: DataType.DECIMAL(5, 2),
  //   defaultValue: 0,
  // })
  // timeProgress!: number;

  @Column({
    type: DataType.ENUM('Not Started', 'In Progress', 'Achieved'),
    allowNull: false,
    defaultValue: 'Not Started',
  })
  status!: string;

  // Hooks for computed fields and status
  public static initializeHooks() {
    this.beforeSave(async (kpi) => {
      // Calculate successRate
      kpi.successRate = kpi.target ? (kpi.progress / kpi.target) * 100 : 0;
      kpi.successRate = Math.min(Math.max(kpi.successRate, 0), 100);

      // Calculate timeProgress (uses Goal's dates)
      // const goal = await Goal.findByPk(kpi.goalId);
      // if (goal) {
      //   const currentDate = new Date();
      //   const startDate = new Date(goal.startDate);
      //   const endDate = new Date(goal.endDate);
      //   const timeElapsed = currentDate.getTime() - startDate.getTime();
      //   const totalTime = endDate.getTime() - startDate.getTime();
      //   kpi.timeProgress = totalTime > 0 ? (timeElapsed / totalTime) * 100 : 0;
      //   kpi.timeProgress = Math.min(Math.max(kpi.timeProgress, 0), 100);
      // }

      // Calculate status
      if (kpi.progress === 0) {
        kpi.status = 'Not Started';
      } else if (kpi.progress >= kpi.target) {
        kpi.status = 'Achieved';
      } else {
        kpi.status = 'In Progress';
      }
    });
  }
  get timeProgress(): number {
    if (!this.goal) {
      throw new Error('Goal must be loaded to compute timeProgress');
    }
    const now = new Date();
    const start = new Date(this.goal.startDate);
    const end = new Date(this.goal.endDate);
    const elapsed = now.getTime() - start.getTime();
    const total = end.getTime() - start.getTime();
    return total > 0 ? Math.min(Math.max((elapsed / total) * 100, 0), 100) : 0;
  }
}

export default KPI;