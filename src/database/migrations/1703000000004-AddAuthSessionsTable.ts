import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

/**
 * Create auth_sessions table for JWT refresh token management
 */
export class AddAuthSessionsTable1703000000004 implements MigrationInterface {
  name = 'AddAuthSessionsTable1703000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'auth_sessions',
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
            name: 'refresh_token_hash',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'expires_at',
            type: 'timestamp',
          },
          {
            name: 'device_info',
            type: 'jsonb',
          },
          {
            name: 'is_revoked',
            type: 'boolean',
            default: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Add foreign key
    await queryRunner.createForeignKey(
      'auth_sessions',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    // Add indexes
    await queryRunner.createIndex(
      'auth_sessions',
      new TableIndex({
        name: 'IDX_auth_sessions_user_id',
        columnNames: ['user_id'],
      })
    );

    await queryRunner.createIndex(
      'auth_sessions',
      new TableIndex({
        name: 'IDX_auth_sessions_refresh_token_hash',
        columnNames: ['refresh_token_hash'],
      })
    );

    console.log('✅ Auth sessions table created successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('auth_sessions', true);
    console.log('✅ Auth sessions table dropped successfully');
  }
}
