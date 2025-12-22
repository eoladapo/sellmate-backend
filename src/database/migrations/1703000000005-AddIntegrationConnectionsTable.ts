import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class AddIntegrationConnectionsTable1703000000005 implements MigrationInterface {
  name = 'AddIntegrationConnectionsTable1703000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'integration_connections',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'platform',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'disconnected'",
          },
          {
            name: 'businessAccountId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'businessAccountName',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'connectedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'lastSyncAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'lastSyncCursor',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'lastError',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'lastErrorAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'consecutiveErrors',
            type: 'int',
            default: 0,
          },
          {
            name: 'tokenExpiresAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'syncInProgress',
            type: 'boolean',
            default: false,
          },
          {
            name: 'settings',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Create unique index on userId + platform
    await queryRunner.createIndex(
      'integration_connections',
      new TableIndex({
        name: 'IDX_integration_connections_user_platform',
        columnNames: ['userId', 'platform'],
        isUnique: true,
      })
    );

    // Create index on userId for faster lookups
    await queryRunner.createIndex(
      'integration_connections',
      new TableIndex({
        name: 'IDX_integration_connections_userId',
        columnNames: ['userId'],
      })
    );

    // Create index on status for finding connected integrations
    await queryRunner.createIndex(
      'integration_connections',
      new TableIndex({
        name: 'IDX_integration_connections_status',
        columnNames: ['status'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('integration_connections', 'IDX_integration_connections_status');
    await queryRunner.dropIndex('integration_connections', 'IDX_integration_connections_userId');
    await queryRunner.dropIndex('integration_connections', 'IDX_integration_connections_user_platform');
    await queryRunner.dropTable('integration_connections');
  }
}
