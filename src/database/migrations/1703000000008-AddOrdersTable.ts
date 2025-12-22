import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class AddOrdersTable1703000000008 implements MigrationInterface {
  name = 'AddOrdersTable1703000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'orders',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'userId', type: 'uuid', isNullable: false },
          { name: 'customerId', type: 'uuid', isNullable: true },
          { name: 'conversationId', type: 'uuid', isNullable: true },
          { name: 'sourceMessageId', type: 'uuid', isNullable: true },
          { name: 'status', type: 'varchar', length: '20', default: "'draft'" },
          { name: 'product', type: 'jsonb', isNullable: false },
          { name: 'customer', type: 'jsonb', isNullable: false },
          { name: 'totalAmount', type: 'decimal', precision: 12, scale: 2, default: 0 },
          { name: 'profit', type: 'decimal', precision: 12, scale: 2, isNullable: true },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true
    );

    await queryRunner.createIndex('orders', new TableIndex({ name: 'IDX_orders_userId', columnNames: ['userId'] }));
    await queryRunner.createIndex('orders', new TableIndex({ name: 'IDX_orders_customerId', columnNames: ['customerId'] }));
    await queryRunner.createIndex('orders', new TableIndex({ name: 'IDX_orders_userId_status', columnNames: ['userId', 'status'] }));
    await queryRunner.createIndex('orders', new TableIndex({ name: 'IDX_orders_userId_createdAt', columnNames: ['userId', 'created_at'] }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('orders', 'IDX_orders_userId_createdAt');
    await queryRunner.dropIndex('orders', 'IDX_orders_userId_status');
    await queryRunner.dropIndex('orders', 'IDX_orders_customerId');
    await queryRunner.dropIndex('orders', 'IDX_orders_userId');
    await queryRunner.dropTable('orders');
  }
}
