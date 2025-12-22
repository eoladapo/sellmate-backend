import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class AddUserSettingsTable1703000000012 implements MigrationInterface {
  name = 'AddUserSettingsTable1703000000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'user_settings',
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
            isUnique: true,
          },
          {
            name: 'notifications',
            type: 'jsonb',
            default: `'{
              "newMessage": {"enabled": true, "channels": ["in_app", "push"]},
              "orderDetected": {"enabled": true, "channels": ["in_app", "push"]},
              "orderStatusChanged": {"enabled": true, "channels": ["in_app"]},
              "orderExpiring": {"enabled": true, "channels": ["in_app", "push"]},
              "lowInventory": {"enabled": false, "channels": ["in_app"], "threshold": 10},
              "profitAlert": {"enabled": false, "channels": ["in_app"], "minMargin": 20}
            }'`,
          },
          {
            name: 'business_profile',
            type: 'jsonb',
            default: `'{
              "name": "",
              "contactPhone": "",
              "defaultLocation": "",
              "businessHours": {"start": "09:00", "end": "18:00"}
            }'`,
          },
          {
            name: 'integrations',
            type: 'jsonb',
            default: `'{
              "whatsapp": {"autoSync": true, "syncInterval": 0},
              "instagram": {"autoSync": true, "syncComments": false}
            }'`,
          },
          {
            name: 'data_privacy',
            type: 'jsonb',
            default: `'{
              "dataRetentionDays": 365,
              "allowAnalytics": true,
              "allowMarketing": false,
              "allowDataSharing": false,
              "allowAiProcessing": true
            }'`,
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

    // Create index on user_id
    await queryRunner.createIndex(
      'user_settings',
      new TableIndex({
        name: 'IDX_user_settings_user_id',
        columnNames: ['user_id'],
        isUnique: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('user_settings', 'IDX_user_settings_user_id');
    await queryRunner.dropTable('user_settings');
  }
}
