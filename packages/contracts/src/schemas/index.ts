// Recovery Compass — Zod Validation Schemas
import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['PATIENT', 'CAREGIVER']),
  phone: z.string().optional(),
  relationship: z.string().optional(),
});

export const CreatePlanSchema = z.object({
  pathwayIdentifier: z.enum(['POST_SURGERY', 'CARDIAC_REHAB', 'ORTHOPEDIC_RECOVERY']),
  extractionId: z.string().optional(),
  surgeryDate: z.string().optional(),
  dischargeDate: z.string().optional(),
  surgeryType: z.string().optional(),
  clinicianName: z.string().optional(),
  hospitalName: z.string().optional(),
});

export const UpdateFieldSchema = z.object({
  value: z.string().min(1, 'Value cannot be empty'),
  notes: z.string().optional(),
});

export const LogMedicationEventSchema = z.object({
  status: z.enum(['TAKEN', 'SKIPPED', 'MISSED']),
  notes: z.string().optional(),
});

export const LogSymptomSchema = z.object({
  planId: z.string().uuid(),
  painScore: z.number().min(0).max(10).optional(),
  temperature: z.number().min(30).max(45).optional(),
  customSymptom: z.string().optional(),
  symptomDefinitionId: z.string().optional(),
  notes: z.string().optional(),
});

export const SafetyCheckSchema = z.object({
  painScore: z.number().min(0).max(10).optional(),
  temperature: z.number().optional(),
  symptomCodes: z.array(z.string()).optional(),
  notes: z.string().optional(),
  symptomLogId: z.string().optional(),
});

export const FamilyInviteSchema = z.object({
  email: z.string().email(),
  permissions: z.array(
    z.enum(['VIEW_PLAN', 'RECEIVE_ALERTS', 'LOG_SYMPTOMS', 'MARK_MEDICATIONS']),
  ),
});

export const FamilyAcceptSchema = z.object({
  otp: z.string().min(4),
});

export const UpdatePermissionsSchema = z.object({
  permissions: z.array(
    z.enum(['VIEW_PLAN', 'RECEIVE_ALERTS', 'LOG_SYMPTOMS', 'MARK_MEDICATIONS']),
  ),
});
