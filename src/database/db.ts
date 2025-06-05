import { Sequelize } from 'sequelize-typescript';
import config from './config/config';
import Goal from './models/Goal';
import KPI from './models/KPI';
import Event from './models/Event';
import DonationIn from './models/DonationIn';
import DonationOut from './models/DonationOut';
import DonationInGoal, { DonationOutGoal } from './models/DonationGoal';
import { User } from './models/User';
import { Feedback } from './models/Feedback';
import { AuditLog } from './models/AuditLog';
import { Organization } from './models/Organization';
import { Volunteer } from './models/Volunteer';
import { Participant } from './models/Participant';
import { Media } from './models/Media';

const env = process.env.NODE_ENV || 'development';
const envConfig = config[env as keyof typeof config];

const db = new Sequelize({
  ...envConfig,
  models: [
    User,
    Organization,
    AuditLog,
    Goal,
    KPI,
    DonationIn,
    DonationInGoal,
    DonationOut,
    DonationOutGoal,
    Event,
    Volunteer,
    Participant,
    Feedback,
    Media
  ],
  define: {
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  modelMatch: (filename, member) => {
    return filename.substring(0, filename.indexOf('.model')) === member.toLowerCase();
  },
  logging: false
});

Goal.initializeHooks();
KPI.initializeHooks();

async function initializeDatabase() {
  try {
    // if (process.env.NODE_ENV === 'development') {
      await db.sync({ alter: true });
    // }
    console.log('Database synced successfuly!');
  } catch (error) {
    console.error('Failed to sync database:', error);
  }
}


export { db, initializeDatabase };