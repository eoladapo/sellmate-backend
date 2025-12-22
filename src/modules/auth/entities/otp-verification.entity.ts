import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('otp_verifications')
@Index(['phoneNumber'])
export class OTPVerification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'phone_number', type: 'varchar', length: 20 })
  @Index()
  phoneNumber!: string;

  @Column({ name: 'otp_hash', type: 'varchar', length: 255 })
  otpHash!: string;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt!: Date;

  @Column({ type: 'int', default: 0 })
  attempts!: number;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  verified!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}