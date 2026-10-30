import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { PathwayIdentifier } from '@prisma/client';

@Injectable()
export class PathwaysService {
  constructor(private readonly prisma: PrismaService) {}

  async findActive(identifier: PathwayIdentifier) {
    return this.prisma.pathwayTemplate.findFirst({
      where: { identifier, isActive: true },
      include: { redFlagRules: { where: { status: 'ACTIVE', deletedAt: null } } },
    });
  }

  async findAll() {
    return this.prisma.pathwayTemplate.findMany({ where: { isActive: true } });
  }
}
