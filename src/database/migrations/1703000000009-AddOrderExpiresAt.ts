import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddOrderExpiresAt1703000000009 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'orders',
      new TableColumn({
        name: 'expires_at',
        type: 'timestamp',
        isNullable: true,
      })
    );

    await queryRunner.createIndex(
      'orders',
      new TableIndex({
        name: 'IDX_orders_expires_at',
        columnNames: ['expires_at'],
      })
    );

    // Update existing draft/pending orders to expire in 48 hours from now
    await queryRunner.query(`
      UPDATE orders 
      SET expires_at = NOW() + INTERVAL '48 hours'
      WHERE status IN ('draft', 'pending') AND expires_at IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('orders', 'IDX_orders_expires_at');
    await queryRunner.dropColumn('orders', 'expires_at');
  }
}
