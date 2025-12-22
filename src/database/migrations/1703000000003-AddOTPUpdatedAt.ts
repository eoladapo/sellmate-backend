import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Add updated_at column to otp_verifications table
 */
export class AddOTPUpdatedAt1703000000003 implements MigrationInterface {
  name = 'AddOTPUpdatedAt1703000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'otp_verifications',
      new TableColumn({
        name: 'updated_at',
        type: 'timestamp',
        default: 'CURRENT_TIMESTAMP',
      })
    );

    console.log('✅ OTP updated_at column added successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('otp_verifications', 'updated_at');
    console.log('✅ OTP updated_at column removed successfully');
  }
}
