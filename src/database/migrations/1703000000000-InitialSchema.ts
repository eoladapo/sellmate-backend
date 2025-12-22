import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

/**
 * Initial Database Schema Migration
 * Creates the foundational tables for the SellMate platform
 */
export class InitialSchema1703000000000 implements MigrationInterface {
  name = 'InitialSchema1703000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create users table
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'phone_number',
            type: 'varchar',
            length: '20',
            isUnique: true,
          },
          {
            name: 'business_name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'is_verified',
            type: 'boolean',
            default: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create index on phone_number for faster lookups
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_users_phone_number',
        columnNames: ['phone_number'],
      }),
    );

    // Create otp_verifications table
    await queryRunner.createTable(
      new Table({
        name: 'otp_verifications',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'phone_number',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'otp_hash',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'attempts',
            type: 'int',
            default: 0,
          },
          {
            name: 'is_verified',
            type: 'boolean',
            default: false,
          },
          {
            name: 'expires_at',
            type: 'timestamp',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create index on phone_number and expires_at for OTP lookups
    await queryRunner.createIndex(
      'otp_verifications',
      new TableIndex({
        name: 'IDX_otp_phone_expires',
        columnNames: ['phone_number', 'expires_at'],
      }),
    );

    // Create integrations table
    await queryRunner.createTable(
      new Table({
        name: 'integrations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'platform',
            type: 'varchar',
            length: '50',
            comment: 'whatsapp or instagram',
          },
          {
            name: 'platform_account_id',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'access_token_encrypted',
            type: 'text',
          },
          {
            name: 'refresh_token_encrypted',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'token_expires_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'last_sync_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add foreign key for integrations -> users
    await queryRunner.createForeignKey(
      'integrations',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Create index on user_id and platform
    await queryRunner.createIndex(
      'integrations',
      new TableIndex({
        name: 'IDX_integrations_user_platform',
        columnNames: ['user_id', 'platform'],
      }),
    );

    // Create customers table
    await queryRunner.createTable(
      new Table({
        name: 'customers',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'phone_number',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'whatsapp_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'instagram_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'total_orders',
            type: 'int',
            default: 0,
          },
          {
            name: 'total_spent',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'last_order_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add foreign key for customers -> users
    await queryRunner.createForeignKey(
      'customers',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Create indexes for customer lookups
    await queryRunner.createIndex(
      'customers',
      new TableIndex({
        name: 'IDX_customers_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'customers',
      new TableIndex({
        name: 'IDX_customers_whatsapp_id',
        columnNames: ['whatsapp_id'],
      }),
    );

    await queryRunner.createIndex(
      'customers',
      new TableIndex({
        name: 'IDX_customers_instagram_id',
        columnNames: ['instagram_id'],
      }),
    );

    console.log('✅ Initial schema migration completed successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order (respecting foreign keys)
    await queryRunner.dropTable('customers', true);
    await queryRunner.dropTable('integrations', true);
    await queryRunner.dropTable('otp_verifications', true);
    await queryRunner.dropTable('users', true);

    // Drop UUID extension
    await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp"`);

    console.log('✅ Initial schema migration reverted successfully');
  }
}
