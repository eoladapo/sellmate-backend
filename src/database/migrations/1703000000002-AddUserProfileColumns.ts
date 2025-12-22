import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Add missing user profile columns
 */
export class AddUserProfileColumns1703000000002 implements MigrationInterface {
  name = 'AddUserProfileColumns1703000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add registration_method column
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'registration_method',
        type: 'varchar',
        length: '20',
        default: "'phone'",
      })
    );

    // Add business_profile column (JSONB)
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'business_profile',
        type: 'jsonb',
        default: "'{\"name\": \"\", \"contactPhone\": \"\", \"defaultLocation\": \"\"}'",
      })
    );

    // Add connected_platforms column (JSONB)
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'connected_platforms',
        type: 'jsonb',
        default: "'{\"whatsapp\": {\"connected\": false}, \"instagram\": {\"connected\": false}}'",
      })
    );

    // Add onboarding_completed column
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'onboarding_completed',
        type: 'boolean',
        default: false,
      })
    );

    console.log('✅ User profile columns added successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'onboarding_completed');
    await queryRunner.dropColumn('users', 'connected_platforms');
    await queryRunner.dropColumn('users', 'business_profile');
    await queryRunner.dropColumn('users', 'registration_method');

    console.log('✅ User profile columns removed successfully');
  }
}
