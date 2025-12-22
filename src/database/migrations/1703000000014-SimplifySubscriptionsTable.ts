import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class SimplifySubscriptionsTable1703000000014 implements MigrationInterface {
  name = 'SimplifySubscriptionsTable1703000000014';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Remove columns that are no longer needed for MVP
    await queryRunner.dropColumn('subscriptions', 'usage_limits');
    await queryRunner.dropColumn('subscriptions', 'current_usage');
    await queryRunner.dropColumn('subscriptions', 'payment_methods');
    await queryRunner.dropColumn('subscriptions', 'failed_payment_count');

    // Add Paystack authorization columns for recurring charges
    await queryRunner.addColumn(
      'subscriptions',
      new TableColumn({
        name: 'paystack_authorization_code',
        type: 'varchar',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      'subscriptions',
      new TableColumn({
        name: 'paystack_customer_code',
        type: 'varchar',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove Paystack columns
    await queryRunner.dropColumn('subscriptions', 'paystack_customer_code');
    await queryRunner.dropColumn('subscriptions', 'paystack_authorization_code');

    // Restore removed columns
    await queryRunner.addColumn(
      'subscriptions',
      new TableColumn({
        name: 'failed_payment_count',
        type: 'int',
        default: 0,
      })
    );

    await queryRunner.addColumn(
      'subscriptions',
      new TableColumn({
        name: 'payment_methods',
        type: 'jsonb',
        default: "'[]'",
      })
    );

    await queryRunner.addColumn(
      'subscriptions',
      new TableColumn({
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
      })
    );

    await queryRunner.addColumn(
      'subscriptions',
      new TableColumn({
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
      })
    );
  }
}
