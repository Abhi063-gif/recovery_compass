import {
  PrismaClient,
  UserRole,
  PathwayIdentifier,
  ExtractionCategory,
  RedFlagSeverity,
  RedFlagAction,
  RedFlagRuleStatus,
  PlanStatus,
  TaskStatus,
  ValidationStatus,
  CaregiverPermission,
  ConsentStatus,
  DocumentStatus,
  QualityStatus,
  ExtractionStatus,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Recovery Compass database...');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Users & Profiles
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@recoverycompass.com' },
    update: {},
    create: {
      email: 'admin@recoverycompass.com',
      passwordHash,
      role: UserRole.ADMIN,
      firstName: 'Admin',
      lastName: 'Director',
      isActive: true,
      isEmailVerified: true,
    },
  });

  const patientUser = await prisma.user.upsert({
    where: { email: 'patient@recoverycompass.com' },
    update: {},
    create: {
      email: 'patient@recoverycompass.com',
      passwordHash,
      phone: '+15551234567',
      role: UserRole.PATIENT,
      firstName: 'Jane',
      lastName: 'Doe',
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: true,
    },
  });

  const patientProfile = await prisma.patientProfile.upsert({
    where: { userId: patientUser.id },
    update: {},
    create: {
      userId: patientUser.id,
      dateOfBirth: new Date('1985-06-15'),
      gender: 'Female',
      nhsNumber: '943 476 5919',
      emergencyContact: '+15559876543 (John Doe)',
    },
  });

  await prisma.notificationPreference.upsert({
    where: { userId: patientUser.id },
    update: {},
    create: {
      userId: patientUser.id,
      emailEnabled: true,
      smsEnabled: true,
      pushEnabled: true,
      quietHoursStart: 22,
      quietHoursEnd: 7,
    },
  });

  const caregiverUser = await prisma.user.upsert({
    where: { email: 'caregiver@recoverycompass.com' },
    update: {},
    create: {
      email: 'caregiver@recoverycompass.com',
      passwordHash,
      phone: '+15559876543',
      role: UserRole.CAREGIVER,
      firstName: 'John',
      lastName: 'Doe',
      isActive: true,
      isEmailVerified: true,
    },
  });

  const caregiverProfile = await prisma.caregiverProfile.upsert({
    where: { userId: caregiverUser.id },
    update: {},
    create: {
      userId: caregiverUser.id,
      relationship: 'Spouse',
    },
  });

  await prisma.notificationPreference.upsert({
    where: { userId: caregiverUser.id },
    update: {},
    create: {
      userId: caregiverUser.id,
      emailEnabled: true,
      smsEnabled: true,
      pushEnabled: true,
    },
  });

  // 2. Pathway Templates
  const postSurgeryTemplate = await prisma.pathwayTemplate.upsert({
    where: { id: 'pathway-post-surgery-standard' },
    update: {},
    create: {
      id: 'pathway-post-surgery-standard',
      identifier: PathwayIdentifier.POST_SURGERY,
      name: 'Post-Surgery Standard Recovery',
      description: 'Standard clinical recovery pathway for general, laparoscopic, and day-case surgeries.',
      version: 1,
      isActive: true,
      supportedCategories: [
        ExtractionCategory.MEDICINES,
        ExtractionCategory.FOLLOW_UPS,
        ExtractionCategory.TESTS,
        ExtractionCategory.RESTRICTIONS,
        ExtractionCategory.DIET,
        ExtractionCategory.HYDRATION,
        ExtractionCategory.TASKS,
        ExtractionCategory.SYMPTOMS,
        ExtractionCategory.RED_FLAGS,
        ExtractionCategory.CONDITIONAL_INSTRUCTIONS,
      ],
      schedulingRules: {
        defaultFollowUpDay: 14,
        stapleRemovalDay: 10,
        dressingsCheckDay: 3,
      },
    },
  });

  // 3. Symptom Definitions
  const symptoms = [
    { code: 'PAIN', name: 'Pain', description: 'Pain level at surgery site (0-10)' },
    { code: 'FEVER', name: 'Fever', description: 'Body temperature in Celsius' },
    { code: 'NAUSEA', name: 'Nausea or Vomiting', description: 'Difficulty keeping food/fluids down' },
    { code: 'WOUND_REDNESS', name: 'Incision Redness / Swelling', description: 'Expanding redness or discharge at wound' },
    { code: 'SHORTNESS_BREATH', name: 'Shortness of Breath', description: 'Sudden onset difficulty breathing' },
  ];

  for (const s of symptoms) {
    await prisma.symptomDefinition.upsert({
      where: { code: s.code },
      update: {},
      create: s,
    });
  }

  // 4. Red Flag Rules (DETERMINISTIC)
  const redFlags = [
    {
      ruleCode: 'RF-TEMP-HIGH',
      name: 'High Fever Post-Op',
      description: 'Temperature at or above 38.5°C indicates potential surgical site infection or sepsis.',
      triggerType: 'temperature_high',
      triggerConfig: { field: 'temperature', operator: 'gte', value: 38.5, unit: 'C' },
      severity: RedFlagSeverity.URGENT,
      action: RedFlagAction.CONTACT_CLINICIAN,
      messageTemplate: 'High fever recorded (>= 38.5°C). Contact your surgical team or triage immediately.',
      emergencyMessage: 'If accompanied by chills, confusion or fast heart rate, seek emergency care immediately.',
      status: RedFlagRuleStatus.ACTIVE,
      isSystemRule: true,
    },
    {
      ruleCode: 'RF-PAIN-SEVERE',
      name: 'Uncontrolled Severe Pain',
      description: 'Pain score greater than 8 despite prescribed analgesia.',
      triggerType: 'pain_high',
      triggerConfig: { field: 'painScore', operator: 'gt', value: 8 },
      severity: RedFlagSeverity.WARNING,
      action: RedFlagAction.CONTACT_CLINICIAN,
      messageTemplate: 'Severe pain reported (score > 8). Please contact your healthcare provider for pain regimen review.',
      status: RedFlagRuleStatus.ACTIVE,
      isSystemRule: true,
    },
    {
      ruleCode: 'RF-CHEST-PAIN-BREATH',
      name: 'Shortness of Breath / Chest Symptoms',
      description: 'Potential pulmonary embolism or deep vein thrombosis complication.',
      triggerType: 'symptom_present',
      triggerConfig: { field: 'symptomCodes', operator: 'contains', value: 'SHORTNESS_BREATH' },
      severity: RedFlagSeverity.EMERGENCY,
      action: RedFlagAction.SEEK_EMERGENCY_HELP,
      messageTemplate: 'Shortness of breath reported. Seek immediate emergency medical care (call 911 / 999).',
      emergencyMessage: 'Call emergency services immediately. Do not drive yourself.',
      status: RedFlagRuleStatus.ACTIVE,
      isSystemRule: true,
    },
  ];

  for (const rf of redFlags) {
    await prisma.redFlagRule.upsert({
      where: { ruleCode: rf.ruleCode },
      update: {},
      create: {
        ...rf,
        pathwayTemplateId: postSurgeryTemplate.id,
      },
    });
  }

  // 5. Source Document & Extraction
  const patientProfileId = patientProfile.id;
  const caregiverProfileId = caregiverProfile.id;

  const document = await prisma.sourceDocument.create({
    data: {
      patientProfileId,
      originalFileName: 'Discharge_Summary_Jane_Doe_Laparoscopic_Cholecystectomy.pdf',
      storagePath: 'documents/demo-discharge-summary.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 245000,
      pageCount: 2,
      status: DocumentStatus.CONFIRMED,
      qualityStatus: QualityStatus.ACCEPTABLE,
      qualityReport: { score: 96, status: 'ACCEPTABLE' },
      pages: {
        create: [
          {
            pageNumber: 1,
            rawText: `ST. JUDE HOSPITAL - DISCHARGE SUMMARY
Patient: Jane Doe | DOB: 15/06/1985 | NHS: 943 476 5919
Admission: 2026-09-20 | Discharge: 2026-09-22
Consultant: Dr. Marcus Vance, FRCS
Procedure: Elective Laparoscopic Cholecystectomy

MEDICATIONS:
1. Paracetamol 500mg - 2 tablets (1000mg) QDS (four times daily) for 7 days.
2. Ibuprofen 400mg - TDS (three times daily) with food for 5 days.
3. Codeine Phosphate 30mg - 1 tablet PRN (as needed for severe breakthrough pain), max 4 daily.

POST-OPERATIVE INSTRUCTIONS:
- Keep incisions clean and dry for 48 hours.
- Waterproof dressings may be removed on Day 5.
- Light walking encouraged from Day 1. No heavy lifting (>5kg) for 4 weeks.
- Driving restricted for 7-10 days until able to perform emergency stop without hesitation.

FOLLOW-UP:
- Surgical clinic review with Dr. Vance in 3 weeks (approx. 2026-10-13).
- Contact surgical triage if experiencing fever > 38.5C, persistent vomiting, or worsening jaundice.`,
          },
        ],
      },
    },
  });

  const extraction = await prisma.extraction.create({
    data: {
      documentId: document.id,
      status: ExtractionStatus.CONFIRMED,
      llmModel: 'gpt-4o',
      schemaVersion: '1.0',
      fields: {
        create: [
          {
            category: ExtractionCategory.MEDICINES,
            fieldKey: 'med_paracetamol',
            value: 'Paracetamol 1000mg four times daily for 7 days',
            sourceText: 'Paracetamol 500mg - 2 tablets (1000mg) QDS (four times daily) for 7 days.',
            page: 1,
            confidence: 0.98,
            validationStatus: ValidationStatus.CONFIRMED,
          },
          {
            category: ExtractionCategory.MEDICINES,
            fieldKey: 'med_ibuprofen',
            value: 'Ibuprofen 400mg three times daily with food for 5 days',
            sourceText: 'Ibuprofen 400mg - TDS (three times daily) with food for 5 days.',
            page: 1,
            confidence: 0.96,
            validationStatus: ValidationStatus.CONFIRMED,
          },
          {
            category: ExtractionCategory.TASKS,
            fieldKey: 'task_dressing',
            value: 'Remove waterproof dressings on Day 5',
            sourceText: 'Waterproof dressings may be removed on Day 5.',
            page: 1,
            confidence: 0.94,
            validationStatus: ValidationStatus.CONFIRMED,
          },
          {
            category: ExtractionCategory.TASKS,
            fieldKey: 'task_walking',
            value: 'Light walking encouraged from Day 1',
            sourceText: 'Light walking encouraged from Day 1.',
            page: 1,
            confidence: 0.92,
            validationStatus: ValidationStatus.CONFIRMED,
          },
          {
            category: ExtractionCategory.RESTRICTIONS,
            fieldKey: 'restriction_lifting',
            value: 'No heavy lifting (>5kg) for 4 weeks',
            sourceText: 'No heavy lifting (>5kg) for 4 weeks.',
            page: 1,
            confidence: 0.95,
            validationStatus: ValidationStatus.CONFIRMED,
          },
        ],
      },
    },
  });

  // 6. Active Recovery Plan
  const plan = await prisma.recoveryPlan.create({
    data: {
      patientProfileId,
      extractionId: extraction.id,
      pathwayTemplateId: postSurgeryTemplate.id,
      planVersion: 1,
      status: PlanStatus.ACTIVE,
      surgeryDate: new Date('2026-09-20'),
      dischargeDate: new Date('2026-09-22'),
      surgeryType: 'Laparoscopic Cholecystectomy',
      clinicianName: 'Dr. Marcus Vance, FRCS',
      hospitalName: 'St. Jude Hospital',
      confirmedAt: new Date('2026-09-22T14:30:00Z'),
      confirmedBy: patientUser.id,
    },
  });

  // 7. Recovery Tasks
  await prisma.recoveryTask.createMany({
    data: [
      {
        planId: plan.id,
        title: 'Keep surgical dressings dry',
        description: 'Do not soak incisions in bath. Sponge bath only.',
        dayOffset: 1,
        scheduledDate: new Date('2026-09-23T09:00:00Z'),
        status: TaskStatus.COMPLETED,
        sourceDocumentId: document.id,
        sourcePage: 1,
      },
      {
        planId: plan.id,
        title: 'Light walking session (10 mins)',
        description: 'Gentle walking helps prevent blood clots and aids digestion.',
        dayOffset: 2,
        scheduledDate: new Date('2026-09-24T10:00:00Z'),
        status: TaskStatus.SCHEDULED,
        sourceDocumentId: document.id,
        sourcePage: 1,
      },
      {
        planId: plan.id,
        title: 'Remove waterproof dressings',
        description: 'Gently peel dressings; incisions can now be washed with mild soap and patted dry.',
        dayOffset: 5,
        scheduledDate: new Date('2026-09-27T09:00:00Z'),
        status: TaskStatus.SCHEDULED,
        sourceDocumentId: document.id,
        sourcePage: 1,
      },
    ],
  });

  // 8. Medications & Schedules
  const paracetamol = await prisma.medication.create({
    data: {
      planId: plan.id,
      name: 'Paracetamol',
      normalizedName: 'paracetamol',
      dose: '1000',
      doseUnit: 'mg',
      frequency: 'four times daily',
      frequencyCode: 'QDS',
      durationDays: 7,
      startDate: new Date('2026-09-22'),
      validationStatus: ValidationStatus.CONFIRMED,
      fuzzyMatchScore: 1.0,
      sourceText: 'Paracetamol 500mg - 2 tablets (1000mg) QDS (four times daily) for 7 days.',
      sourcePage: 1,
    },
  });

  const ibuprofen = await prisma.medication.create({
    data: {
      planId: plan.id,
      name: 'Ibuprofen',
      normalizedName: 'ibuprofen',
      dose: '400',
      doseUnit: 'mg',
      frequency: 'three times daily',
      frequencyCode: 'TDS',
      durationDays: 5,
      startDate: new Date('2026-09-22'),
      instructions: 'Take with or after food',
      validationStatus: ValidationStatus.CONFIRMED,
      fuzzyMatchScore: 1.0,
      sourceText: 'Ibuprofen 400mg - TDS (three times daily) with food for 5 days.',
      sourcePage: 1,
    },
  });

  // Schedule slots for Paracetamol
  const timeSlots = [
    { hour: 8, label: 'morning' },
    { hour: 12, label: 'midday' },
    { hour: 18, label: 'evening' },
    { hour: 22, label: 'bedtime' },
  ];

  for (let d = 0; d < 7; d++) {
    const dayDate = new Date('2026-09-22');
    dayDate.setDate(dayDate.getDate() + d);

    for (const slot of timeSlots) {
      const scheduledAt = new Date(dayDate);
      scheduledAt.setHours(slot.hour, 0, 0, 0);

      await prisma.medicationSchedule.create({
        data: {
          medicationId: paracetamol.id,
          scheduledAt,
          timeLabel: slot.label,
          idempotencyKey: `paracetamol-${plan.id}-${scheduledAt.toISOString()}`,
        },
      });
    }
  }

  // 9. Follow Up & Doctor Questions
  await prisma.followUp.create({
    data: {
      planId: plan.id,
      appointmentType: 'Surgical Clinic Outpatient Review',
      clinicianName: 'Dr. Marcus Vance, FRCS',
      purpose: 'Assess wound healing, pathology review, and dietary transition',
      scheduledDate: new Date('2026-10-13T10:30:00Z'),
      relativeDuration: 21,
      sourceText: 'Surgical clinic review with Dr. Vance in 3 weeks',
    },
  });

  await prisma.doctorQuestion.create({
    data: {
      planId: plan.id,
      questionText: 'When is it safe to resume full abdominal exercises (pilates/core)?',
      sourceType: 'PATIENT_INQUIRY',
      context: 'Discharge notes restrict heavy lifting >5kg for 4 weeks but do not specify core exercises.',
    },
  });

  // 10. Family Membership & Granular Consents
  const membership = await prisma.familyMembership.create({
    data: {
      patientProfileId,
      caregiverProfileId,
      permissions: [
        CaregiverPermission.VIEW_PLAN,
        CaregiverPermission.RECEIVE_ALERTS,
        CaregiverPermission.MARK_MEDICATIONS,
      ],
      isActive: true,
    },
  });

  for (const perm of [
    CaregiverPermission.VIEW_PLAN,
    CaregiverPermission.RECEIVE_ALERTS,
    CaregiverPermission.MARK_MEDICATIONS,
  ]) {
    await prisma.consentRecord.create({
      data: {
        patientProfileId,
        membershipId: membership.id,
        permission: perm,
        status: ConsentStatus.ACTIVE,
        actorId: patientUser.id,
      },
    });
  }

  // 11. Initial Audit Log
  await prisma.auditEvent.create({
    data: {
      actorId: adminUser.id,
      actorRole: UserRole.ADMIN,
      action: 'SYSTEM_SEEDED',
      resourceType: 'System',
      resourceId: 'initial-seed',
      planId: plan.id,
      documentId: document.id,
      metadata: {
        seededAt: new Date().toISOString(),
        dataset: 'demo_recovery_compass_seed',
      },
    },
  });

  console.log('Seed completed successfully!');
  console.log('Seeded Users:');
  console.log('  Admin:     admin@recoverycompass.com / Password123!');
  console.log('  Patient:   patient@recoverycompass.com / Password123!');
  console.log('  Caregiver: caregiver@recoverycompass.com / Password123!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
