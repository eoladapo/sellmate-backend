import { injectable, inject } from 'tsyringe';
import { Repository, DataSource, LessThan } from 'typeorm';
import { OTPVerification } from '../entities/otp-verification.entity';
import { IOTPRepository } from '../interfaces/otp-repository.interface';
import { TOKENS } from '../../../di/tokens';

@injectable()
export class OTPVerificationRepository implements IOTPRepository {
  private repository: Repository<OTPVerification>;

  constructor(@inject(TOKENS.DataSource) private dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(OTPVerification);
  }

  async findByPhoneNumber(phoneNumber: string): Promise<OTPVerification | null> {
    return this.repository.findOne({
      where: { phoneNumber },
      order: { createdAt: 'DESC' },
    });
  }

  async create(otpData: Partial<OTPVerification>): Promise<OTPVerification> {
    const otp = this.repository.create(otpData);
    return this.repository.save(otp);
  }

  async update(id: string, otpData: Partial<OTPVerification>): Promise<OTPVerification> {
    await this.repository.update(id, otpData);
    const updatedOTP = await this.repository.findOne({ where: { id } });
    if (!updatedOTP) {
      throw new Error(`OTP verification with id ${id} not found`);
    }
    return updatedOTP;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async deleteExpired(): Promise<number> {
    const result = await this.repository.delete({
      expiresAt: LessThan(new Date()),
    });
    return result.affected ?? 0;
  }
}
