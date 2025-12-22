import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { RegistrationMethod } from '../enums/registration-method.enum';
import { BusinessProfile } from '../interfaces/business-profile.interface';
import { ConnectedPlatforms } from '../interfaces/connected-platforms.interface';

@Entity('users')
@Index(['phoneNumber'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'phone_number', type: 'varchar', length: 20, unique: true })
  @Index()
  phoneNumber!: string;

  @Column({ name: 'business_name', type: 'varchar', length: 255 })
  businessName!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified!: boolean;

  @Column({
    name: 'registration_method',
    type: 'varchar',
    length: 20,
    default: 'phone',
  })
  registrationMethod!: RegistrationMethod;

  @Column({ name: 'business_profile', type: 'jsonb' })
  businessProfile!: BusinessProfile;

  @Column({ name: 'connected_platforms', type: 'jsonb' })
  connectedPlatforms!: ConnectedPlatforms;

  @Column({ name: 'onboarding_completed', type: 'boolean', default: false })
  onboardingCompleted!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  constructor() {
    this.businessProfile = {
      name: '',
      contactPhone: '',
      defaultLocation: '',
    };

    this.connectedPlatforms = {
      whatsapp: {
        connected: false,
      },
      instagram: {
        connected: false,
      },
    };
  }
}