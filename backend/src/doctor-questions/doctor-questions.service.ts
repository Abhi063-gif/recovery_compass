import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ValidationStatus } from '@prisma/client';

/**
 * Doctor Questions Generator
 *
 * SAFETY CONTRACT:
 * ─────────────────────────────────────────────────────────────────────────────
 * Questions are generated from SYSTEM-DETECTED issues — NOT clinical inference.
 * The generator identifies structural problems in the extraction, NOT medical advice.
 *
 * Sources of questions:
 * 1. Unclear extraction fields (isUnclear = true)
 * 2. Conditional instructions awaiting approval
 * 3. Unresolved conflicts between fields
 * 4. Missed medications (no action recorded)
 * 5. Pending tests
 *
 * Question format:
 * - Template-based, never free-form AI generation
 * - Always references the specific field/source
 * - Never recommends an action or treatment
 * ─────────────────────────────────────────────────────────────────────────────
 */
@Injectable()
export class DoctorQuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async generateForPlan(planId: string): Promise<void> {
    const plan = await this.prisma.recoveryPlan.findUnique({
      where: { id: planId },
      include: {
        extraction: {
          include: {
            fields: { where: { isUnclear: true, deletedAt: null } },
          },
        },
        tasks: { where: { isConditional: true, conditionalStatus: 'PENDING', deletedAt: null } },
        medications: { where: { deletedAt: null, validationStatus: { in: ['CONFLICT', 'NEEDS_REVIEW'] } } },
      },
    });

    if (!plan) return;

    // ─── 1. Unclear extraction fields ─────────────────────────────────────────
    for (const field of plan.extraction?.fields ?? []) {
      await this.createOrSkip(planId, {
        questionText: this.buildUnclearFieldQuestion(field),
        context: `Field: ${field.fieldKey}, Category: ${field.category}`,
        sourceType: 'UNCLEAR_FIELD',
        extractionFieldId: field.id,
      });
    }

    // ─── 2. Conditional tasks awaiting approval ───────────────────────────────
    for (const task of plan.tasks) {
      await this.createOrSkip(planId, {
        questionText: `The following instruction requires clinician approval before you can do it: "${task.title}". Please confirm with your clinician.`,
        context: task.sourceText ?? undefined,
        sourceType: 'CONDITIONAL',
      });
    }

    // ─── 3. Medications with conflict/review status ────────────────────────────
    for (const med of plan.medications) {
      if (med.validationStatus === 'CONFLICT') {
        await this.createOrSkip(planId, {
          questionText: `There is a conflict in your discharge instructions for ${med.name}. Please ask your clinician to clarify the correct dose and frequency.`,
          context: JSON.stringify(med.conflictInfo),
          sourceType: 'CONFLICT',
        });
      }
    }
  }

  async getForPlan(planId: string) {
    return this.prisma.doctorQuestion.findMany({
      where: { planId, isResolved: false, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
  }

  async resolve(questionId: string, note?: string) {
    return this.prisma.doctorQuestion.update({
      where: { id: questionId },
      data: { isResolved: true, resolvedAt: new Date(), resolvedNote: note },
    });
  }

  private buildUnclearFieldQuestion(field: any): string {
    const templates: Record<string, string> = {
      MEDICINES: `Your discharge document does not clearly specify ${field.fieldKey}. Please ask your clinician to confirm.`,
      FOLLOW_UPS: `The follow-up appointment details in your discharge document are unclear. Please contact your clinician to confirm.`,
      TASKS: `An instruction in your discharge document is unclear: "${field.sourceText ?? 'unknown'}". Please ask your clinician to clarify.`,
      RESTRICTIONS: `A restriction in your discharge document is unclear. Please ask your clinician to clarify.`,
    };

    return (
      templates[field.category] ??
      `An instruction in category ${field.category} is unclear. Please ask your clinician to clarify.`
    );
  }

  private async createOrSkip(
    planId: string,
    data: {
      questionText: string;
      context?: string;
      sourceType: string;
      extractionFieldId?: string;
    },
  ): Promise<void> {
    // Avoid duplicate questions
    const existing = await this.prisma.doctorQuestion.findFirst({
      where: {
        planId,
        extractionFieldId: data.extractionFieldId,
        sourceType: data.sourceType,
        isResolved: false,
      },
    });

    if (!existing) {
      await this.prisma.doctorQuestion.create({
        data: {
          planId,
          questionText: data.questionText,
          context: data.context,
          sourceType: data.sourceType,
          extractionFieldId: data.extractionFieldId,
        },
      });
    }
  }
}
