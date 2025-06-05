import { Dialect } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

interface Config {
    username: string;
    password: string;
    database: string;
    host: string;
    dialect: Dialect;
    port?: number;
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
}

const baseConfig: Config = {
    username: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
};

export = {
    development: baseConfig,
    test: { ...baseConfig, database: 'coltium_test_db' },
    production: { ...baseConfig, database: 'postgres' },
};
