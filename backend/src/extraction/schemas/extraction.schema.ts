import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// EXTRACTION SCHEMA v1.0
//
// CRITICAL SAFETY CONTRACT:
// - Every field must have a source reference
// - Null/uncertain values are explicitly allowed and preferred over guessing
// - The LLM must preserve source wording
// - The system must REJECT any output not matching this schema
// ─────────────────────────────────────────────────────────────────────────────

export const ExtractionFieldSchema = z.object({
  value: z.string().nullable(),
  sourceText: z.string().nullable(), // verbatim from document
  page: z.number().int().positive().nullable(),
  boundingBox: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  }).nullable(),
  confidence: z.number().min(0).max(1),
  isUncertain: z.boolean().default(false),
  uncertaintyReason: z.string().nullable().optional(),
});

export type ExtractionFieldOutput = z.infer<typeof ExtractionFieldSchema>;

export const MedicineExtractionSchema = z.object({
  name: ExtractionFieldSchema,
  dose: ExtractionFieldSchema,
  doseUnit: ExtractionFieldSchema,
  frequency: ExtractionFieldSchema,
  timing: ExtractionFieldSchema.optional(),
  duration: ExtractionFieldSchema.optional(),
  instructions: ExtractionFieldSchema.optional(),
  asNeeded: z.boolean().default(false),
});

export const FollowUpExtractionSchema = z.object({
  type: ExtractionFieldSchema,
  clinician: ExtractionFieldSchema.optional(),
  date: ExtractionFieldSchema,
  relativeDays: ExtractionFieldSchema.optional(),
  purpose: ExtractionFieldSchema.optional(),
});

export const TestExtractionSchema = z.object({
  name: ExtractionFieldSchema,
  purpose: ExtractionFieldSchema.optional(),
  timing: ExtractionFieldSchema.optional(),
});

export const RestrictionExtractionSchema = z.object({
  restriction: ExtractionFieldSchema,
  duration: ExtractionFieldSchema.optional(),
  condition: ExtractionFieldSchema.optional(),
});

export const DietExtractionSchema = z.object({
  instruction: ExtractionFieldSchema,
  duration: ExtractionFieldSchema.optional(),
});

export const TaskExtractionSchema = z.object({
  task: ExtractionFieldSchema,
  startDay: ExtractionFieldSchema.optional(),
  frequency: ExtractionFieldSchema.optional(),
  duration: ExtractionFieldSchema.optional(),
  condition: ExtractionFieldSchema.optional(),
  isConditional: z.boolean().default(false),
});

export const SymptomExtractionSchema = z.object({
  symptom: ExtractionFieldSchema,
  threshold: ExtractionFieldSchema.optional(),
});

export const RedFlagExtractionSchema = z.object({
  sign: ExtractionFieldSchema,
  action: ExtractionFieldSchema,
  severity: ExtractionFieldSchema.optional(),
});

export const ConditionalInstructionSchema = z.object({
  instruction: ExtractionFieldSchema,
  condition: ExtractionFieldSchema,
  conditionType: z.enum([
    'CLINICIAN_APPROVAL_REQUIRED',
    'SYMPTOM_DEPENDENT',
    'TIME_DEPENDENT',
    'OTHER',
  ]),
});

/**
 * ROOT EXTRACTION SCHEMA
 *
 * This is the strict schema the LLM must produce.
 * Any deviation = REJECTED by the schema validator.
 * Never trust LLM output directly.
 */
export const RootExtractionSchema = z.object({
  schemaVersion: z.literal('1.0'),
  extractionConfidence: z.number().min(0).max(1),
  documentType: z.string().nullable(),
  surgeryType: z.string().nullable(),
  surgeryDate: ExtractionFieldSchema.optional(),
  dischargeDate: ExtractionFieldSchema.optional(),
  clinicianName: ExtractionFieldSchema.optional(),
  hospitalName: ExtractionFieldSchema.optional(),
  medicines: z.array(MedicineExtractionSchema),
  followUps: z.array(FollowUpExtractionSchema),
  tests: z.array(TestExtractionSchema),
  restrictions: z.array(RestrictionExtractionSchema),
  diet: z.array(DietExtractionSchema),
  hydration: z.array(DietExtractionSchema),
  tasks: z.array(TaskExtractionSchema),
  symptoms: z.array(SymptomExtractionSchema),
  redFlags: z.array(RedFlagExtractionSchema),
  conditionalInstructions: z.array(ConditionalInstructionSchema),
  extractionNotes: z.string().nullable(),
});

export type RootExtraction = z.infer<typeof RootExtractionSchema>;
