import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
      include: {
        patientProfile: true,
        caregiverProfile: true,
        notificationPrefs: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return this.sanitizeUser(user);
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase(), deletedAt: null },
      include: { patientProfile: true, caregiverProfile: true },
    });
  }

  async getPatientProfile(userId: string) {
    const profile = await this.prisma.patientProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('Patient profile not found');
    return profile;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        updatedAt: new Date(),
      },
    });
    return this.sanitizeUser(user);
  }

  async getNotificationPreferences(userId: string) {
    return this.prisma.notificationPreference.findUnique({
      where: { userId },
    });
  }

  async updateNotificationPreferences(userId: string, prefs: any) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId, ...prefs },
      update: { ...prefs },
    });
  }

  private sanitizeUser(user: any) {
    const { passwordHash, ...safe } = user;
    return safe;
  }
}
