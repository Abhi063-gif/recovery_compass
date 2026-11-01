import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RedFlagEngine } from '../safety/red-flag.engine';
import { LogSymptomDto } from './dto/log-symptom.dto';

@Injectable()
export class SymptomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redFlagEngine: RedFlagEngine,
  ) {}

  async log(dto: LogSymptomDto, userId: string) {
    // Validate pain score range
    if (dto.painScore !== undefined && (dto.painScore < 0 || dto.painScore > 10)) {
      throw new BadRequestException('Pain score must be between 0 and 10');
    }

    const log = await this.prisma.symptomLog.create({
      data: {
        planId: dto.planId,
        loggedBy: userId,
        symptomDefinitionId: dto.symptomDefinitionId,
        customSymptom: dto.customSymptom,
        painScore: dto.painScore,
        temperature: dto.temperature,
        notes: dto.notes,
        recordedAt: dto.recordedAt ? new Date(dto.recordedAt) : new Date(),
      },
    });

    // Extract structured symptom codes
    const symptomCodes = dto.symptomCodes && dto.symptomCodes.length > 0
      ? dto.symptomCodes
      : dto.customSymptom
      ? dto.customSymptom.split(',').map((s) => s.trim())
      : [];

    // ─── Run deterministic red-flag check after every symptom log ─────────
    const safetyResult = await this.redFlagEngine.evaluate(
      dto.planId,
      log.id,
      {
        painScore: dto.painScore,
        temperature: dto.temperature,
        symptomCodes,
        customSymptom: dto.customSymptom,
        notes: dto.notes,
      },
      userId,
    );

    return { log, safetyResult };
  }

  async getByPlan(planId: string) {
    return this.prisma.symptomLog.findMany({
      where: { planId },
      include: { symptomDefinition: true },
      orderBy: { recordedAt: 'desc' },
    });
  }

  async getSymptomDefinitions() {
    return this.prisma.symptomDefinition.findMany({
      where: { isSystemDefined: true },
    });
  }
}
