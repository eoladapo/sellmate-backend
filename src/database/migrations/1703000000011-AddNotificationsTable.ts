import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class AddNotificationsTable1703000000011 implements MigrationInterface {
  name = 'AddNotificationsTable1703000000011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'notifications',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'channel',
            type: 'varchar',
            length: '20',
            default: "'in_app'",
          },
          {
            name: 'priority',
            type: 'varchar',
            length: '20',
            default: "'medium'",
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'pending'",
          },
          {
            name: 'payload',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'related_entity_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'related_entity_type',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'is_read',
            type: 'boolean',
            default: false,
          },
          {
            name: 'read_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'sent_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'delivered_at',
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
      true
    );

    // Create indexes
    await queryRunner.createIndex(
      'notifications',
      new TableIndex({
        name: 'IDX_notifications_user_id',
        columnNames: ['user_id'],
      })
    );

    await queryRunner.createIndex(
      'notifications',
      new TableIndex({
        name: 'IDX_notifications_user_created',
        columnNames: ['user_id', 'created_at'],
      })
    );

    await queryRunner.createIndex(
      'notifications',
      new TableIndex({
        name: 'IDX_notifications_user_read',
        columnNames: ['user_id', 'is_read'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('notifications', 'IDX_notifications_user_read');
    await queryRunner.dropIndex('notifications', 'IDX_notifications_user_created');
    await queryRunner.dropIndex('notifications', 'IDX_notifications_user_id');
    await queryRunner.dropTable('notifications');
  }
}
