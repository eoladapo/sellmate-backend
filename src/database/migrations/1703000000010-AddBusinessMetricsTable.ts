import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class AddBusinessMetricsTable1703000000010 implements MigrationInterface {
  name = 'AddBusinessMetricsTable1703000000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'business_metrics',
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
            name: 'period_start',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'period_end',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'revenue',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'profit',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'orders',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'customers',
            type: 'jsonb',
            isNullable: false,
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
      'business_metrics',
      new TableIndex({
        name: 'IDX_business_metrics_user_id',
        columnNames: ['user_id'],
      })
    );

    await queryRunner.createIndex(
      'business_metrics',
      new TableIndex({
        name: 'IDX_business_metrics_user_period',
        columnNames: ['user_id', 'period_start', 'period_end'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('business_metrics', 'IDX_business_metrics_user_period');
    await queryRunner.dropIndex('business_metrics', 'IDX_business_metrics_user_id');
    await queryRunner.dropTable('business_metrics');
  }
}
