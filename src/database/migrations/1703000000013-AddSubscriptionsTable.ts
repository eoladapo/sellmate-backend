import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class AddSubscriptionsTable1703000000013 implements MigrationInterface {
  name = 'AddSubscriptionsTable1703000000013';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'subscriptions',
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
            name: 'plan',
            type: 'varchar',
            length: '20',
            default: "'starter'",
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'trial'",
          },
          {
            name: 'billing_cycle',
            type: 'varchar',
            length: '10',
            default: "'monthly'",
          },
          {
            name: 'current_period_start',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'current_period_end',
            type: 'timestamp',
            default: "CURRENT_TIMESTAMP + INTERVAL '1 month'",
          },
          {
            name: 'trial_end',
            type: 'timestamp',
            isNullable: true,
            default: "CURRENT_TIMESTAMP + INTERVAL '14 days'",
          },
          {
            name: 'cancelled_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'payment_methods',
            type: 'jsonb',
            default: "'[]'",
          },
          {
            name: 'usage_limits',
            type: 'jsonb',
            default: `'{
              "maxConversations": 100,
              "maxOrders": 50,
              "maxCustomers": 100,
              "maxIntegrations": 1,
              "aiRequestsPerMonth": 100,
              "storageGB": 1
            }'`,
          },
          {
            name: 'current_usage',
            type: 'jsonb',
            default: `'{
              "conversations": 0,
              "orders": 0,
              "customers": 0,
              "integrations": 0,
              "aiRequestsThisMonth": 0,
              "storageUsedGB": 0,
              "lastResetDate": null
            }'`,
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 5000,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '3',
            default: "'NGN'",
          },
          {
            name: 'failed_payment_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'last_payment_date',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'next_payment_date',
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

    // Create index on user_id
    await queryRunner.createIndex(
      'subscriptions',
      new TableIndex({
        name: 'IDX_subscriptions_user_id',
        columnNames: ['user_id'],
        isUnique: true,
      })
    );

    // Create index on status for querying active/past_due subscriptions
    await queryRunner.createIndex(
      'subscriptions',
      new TableIndex({
        name: 'IDX_subscriptions_status',
        columnNames: ['status'],
      })
    );

    // Create index on current_period_end for renewal queries
    await queryRunner.createIndex(
      'subscriptions',
      new TableIndex({
        name: 'IDX_subscriptions_period_end',
        columnNames: ['current_period_end'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('subscriptions', 'IDX_subscriptions_period_end');
    await queryRunner.dropIndex('subscriptions', 'IDX_subscriptions_status');
    await queryRunner.dropIndex('subscriptions', 'IDX_subscriptions_user_id');
    await queryRunner.dropTable('subscriptions');
  }
}
