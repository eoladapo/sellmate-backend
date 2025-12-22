import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class AddOAuthTokensTable1703000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create oauth_tokens table
    await queryRunner.createTable(
      new Table({
        name: 'oauth_tokens',
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
            name: 'encryptedAccessToken',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'encryptedRefreshToken',
            type: 'text',
            isNullable: true,
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
            name: 'scope',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'expiresAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
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
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Create index on userId
    await queryRunner.createIndex(
      'oauth_tokens',
      new TableIndex({
        name: 'IDX_oauth_tokens_userId',
        columnNames: ['userId'],
      })
    );

    // Create unique index on userId + platform
    await queryRunner.createIndex(
      'oauth_tokens',
      new TableIndex({
        name: 'IDX_oauth_tokens_userId_platform',
        columnNames: ['userId', 'platform'],
        isUnique: true,
      })
    );

    // Create foreign key to users table
    await queryRunner.createForeignKey(
      'oauth_tokens',
      new TableForeignKey({
        name: 'FK_oauth_tokens_userId',
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    await queryRunner.dropForeignKey('oauth_tokens', 'FK_oauth_tokens_userId');

    // Drop indexes
    await queryRunner.dropIndex('oauth_tokens', 'IDX_oauth_tokens_userId_platform');
    await queryRunner.dropIndex('oauth_tokens', 'IDX_oauth_tokens_userId');

    // Drop table
    await queryRunner.dropTable('oauth_tokens');
  }
}