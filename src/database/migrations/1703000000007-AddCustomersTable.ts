import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class AddCustomersTable1703000000007 implements MigrationInterface {
  name = 'AddCustomersTable1703000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'customers',
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
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'phoneNumber',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'platforms',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'orderHistory',
            type: 'jsonb',
            default: "'{\"totalOrders\":0,\"completedOrders\":0,\"totalValue\":0}'",
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'active'",
          },
          {
            name: 'notes',
            type: 'text',
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

    await queryRunner.createIndex(
      'customers',
      new TableIndex({ name: 'IDX_customers_userId', columnNames: ['userId'] })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('customers', 'IDX_customers_userId');
    await queryRunner.dropTable('customers');
  }
}
