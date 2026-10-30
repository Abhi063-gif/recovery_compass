import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { createHash, randomBytes } from 'crypto';
import { UserRole } from '@prisma/client';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  async register(dto: RegisterDto, ipAddress?: string): Promise<TokenPair & { user: { userId: string; email: string; role: string; firstName: string; lastName: string } }> {
    // Check for existing user
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role ?? UserRole.PATIENT,
        phone: dto.phone,
        patientProfile: dto.role === UserRole.PATIENT || !dto.role
          ? { create: {} }
          : undefined,
        caregiverProfile: dto.role === UserRole.CAREGIVER
          ? { create: {} }
          : undefined,
        notificationPrefs: {
          create: { emailEnabled: true },
        },
      },
    });

    await this.auditService.log({
      actorId: user.id,
      actorRole: user.role,
      action: 'USER_REGISTERED',
      resourceType: 'User',
      resourceId: user.id,
      ipAddress,
    });

    // Generate and return token pair so frontend can immediately authenticate
    const tokens = await this.generateTokenPair(user.id, user.email, user.role);

    return {
      ...tokens,
      user: {
        userId: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }


  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.passwordHash) {
      // Constant-time failure to prevent email enumeration
      await bcrypt.compare(password, '$2a$12$invalidhashplaceholderXXXXXXXXXXXXXXXXXXXXXXXXXXXX');
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string): Promise<TokenPair & { user: { userId: string; email: string; role: string; firstName: string; lastName: string } }> {
    const user = await this.validateUser(dto.email, dto.password);

    const tokens = await this.generateTokenPair(user.id, user.email, user.role);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await this.auditService.log({
      actorId: user.id,
      actorRole: user.role,
      action: 'USER_LOGIN',
      resourceType: 'User',
      resourceId: user.id,
      ipAddress,
      metadata: { userAgent },
    });

    return {
      ...tokens,
      user: {
        userId: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { userId, tokenHash },
      data: { isRevoked: true },
    });

    await this.auditService.log({
      actorId: userId,
      action: 'USER_LOGOUT',
      resourceType: 'User',
      resourceId: userId,
    });
  }

  async getProfile(userId: string): Promise<{ userId: string; email: string; role: string; firstName: string; lastName: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, firstName: true, lastName: true },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  async logoutAll(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored || stored.isRevoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Rotate refresh token (invalidate old)
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { isRevoked: true },
    });

    return this.generateTokenPair(stored.userId, stored.user.email, stored.user.role);
  }

  async generateOtp(userId: string, purpose: string): Promise<string> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(
      Date.now() + (this.configService.get<number>('OTP_EXPIRY_MINUTES', 10)) * 60 * 1000,
    );

    await this.prisma.otpCode.create({
      data: { userId, code, purpose, expiresAt },
    });

    return code;
  }

  async verifyOtp(userId: string, code: string, purpose: string): Promise<boolean> {
    const otp = await this.prisma.otpCode.findFirst({
      where: {
        userId,
        code,
        purpose,
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) return false;

    await this.prisma.otpCode.update({
      where: { id: otp.id },
      data: { usedAt: new Date() },
    });

    return true;
  }

  private async generateTokenPair(
    userId: string,
    email: string,
    role: UserRole,
  ): Promise<TokenPair> {
    const payload: JwtPayload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload);
    const refreshTokenRaw = randomBytes(64).toString('hex');
    const tokenHash = this.hashToken(refreshTokenRaw);

    const refreshExpiryDays = parseInt(
      this.configService.get<string>('JWT_REFRESH_EXPIRY', '7d').replace('d', ''),
    );
    const expiresAt = new Date(Date.now() + refreshExpiryDays * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });

    return {
      accessToken,
      refreshToken: refreshTokenRaw,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
