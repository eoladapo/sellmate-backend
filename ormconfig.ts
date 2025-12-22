import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config();

/**
 * TypeORM CLI Configuration
 * Used for running migrations via CLI commands
 */
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'sellmate_user',
  password: process.env.DB_PASSWORD || 'your_secure_password',
  database: process.env.DB_NAME || process.env.DB_DATABASE || 'sellmate_dev',

  entities: [
    path.join(__dirname, 'src/modules/**/entities/*.entity{.ts,.js}'),
  ],

  migrations: [
    path.join(__dirname, 'src/database/migrations/*{.ts,.js}'),
  ],

  synchronize: false,
  logging: true,
});
