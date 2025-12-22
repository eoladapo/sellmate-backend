import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class AddConversationsAndMessagesTable1703000000006 implements MigrationInterface {
  name = 'AddConversationsAndMessagesTable1703000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create conversations table
    await queryRunner.createTable(
      new Table({
        name: 'conversations',
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
            name: 'customerId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'platform',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'platformConversationId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'platformParticipantId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'participantName',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'participantProfilePicture',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'lastMessage',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'unreadCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'hasOrderDetected',
            type: 'boolean',
            default: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'active'",
          },
          {
            name: 'entryMode',
            type: 'varchar',
            length: '20',
            default: "'synced'",
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
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

    // Create indexes for conversations
    await queryRunner.createIndex(
      'conversations',
      new TableIndex({
        name: 'IDX_conversations_userId',
        columnNames: ['userId'],
      })
    );

    await queryRunner.createIndex(
      'conversations',
      new TableIndex({
        name: 'IDX_conversations_customerId',
        columnNames: ['customerId'],
      })
    );

    await queryRunner.createIndex(
      'conversations',
      new TableIndex({
        name: 'IDX_conversations_platformConversationId',
        columnNames: ['platformConversationId'],
      })
    );

    await queryRunner.createIndex(
      'conversations',
      new TableIndex({
        name: 'IDX_conversations_userId_platform',
        columnNames: ['userId', 'platform'],
      })
    );

    await queryRunner.createIndex(
      'conversations',
      new TableIndex({
        name: 'IDX_conversations_userId_customerId',
        columnNames: ['userId', 'customerId'],
      })
    );

    await queryRunner.createIndex(
      'conversations',
      new TableIndex({
        name: 'IDX_conversations_userId_updatedAt',
        columnNames: ['userId', 'updated_at'],
      })
    );

    // Create messages table
    await queryRunner.createTable(
      new Table({
        name: 'messages',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'conversationId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'content',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'sender',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'platform',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'platformMessageId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'messageType',
            type: 'varchar',
            length: '20',
            default: "'text'",
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'delivered'",
          },
          {
            name: 'timestamp',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'aiAnalysis',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'entryMode',
            type: 'varchar',
            length: '20',
            default: "'synced'",
          },
          {
            name: 'isRead',
            type: 'boolean',
            default: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Add foreign key for messages -> conversations
    await queryRunner.createForeignKey(
      'messages',
      new TableForeignKey({
        columnNames: ['conversationId'],
        referencedTableName: 'conversations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );

    // Create indexes for messages
    await queryRunner.createIndex(
      'messages',
      new TableIndex({
        name: 'IDX_messages_conversationId',
        columnNames: ['conversationId'],
      })
    );

    await queryRunner.createIndex(
      'messages',
      new TableIndex({
        name: 'IDX_messages_timestamp',
        columnNames: ['timestamp'],
      })
    );

    await queryRunner.createIndex(
      'messages',
      new TableIndex({
        name: 'IDX_messages_platformMessageId',
        columnNames: ['platformMessageId'],
      })
    );

    await queryRunner.createIndex(
      'messages',
      new TableIndex({
        name: 'IDX_messages_conversationId_timestamp',
        columnNames: ['conversationId', 'timestamp'],
      })
    );

    await queryRunner.createIndex(
      'messages',
      new TableIndex({
        name: 'IDX_messages_conversationId_sender',
        columnNames: ['conversationId', 'sender'],
      })
    );

    console.log('✅ Conversations and Messages tables created successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop messages table (will also drop foreign key and indexes)
    await queryRunner.dropTable('messages', true, true, true);

    // Drop conversations table (will also drop indexes)
    await queryRunner.dropTable('conversations', true, true, true);

    console.log('✅ Conversations and Messages tables dropped successfully');
  }
}
