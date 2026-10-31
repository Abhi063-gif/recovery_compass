import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DocumentsModule } from './documents/documents.module';
import { OcrModule } from './ocr/ocr.module';
import { ExtractionModule } from './extraction/extraction.module';
import { PlansModule } from './plans/plans.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { MedicationsModule } from './medications/medications.module';
import { SymptomsModule } from './symptoms/symptoms.module';
import { SafetyModule } from './safety/safety.module';
import { FollowupsModule } from './followups/followups.module';
import { DoctorQuestionsModule } from './doctor-questions/doctor-questions.module';
import { FamilyModule } from './family/family.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuditModule } from './audit/audit.module';
import { PrivacyModule } from './privacy/privacy.module';
import { AdminModule } from './admin/admin.module';
import { PathwaysModule } from './pathways/pathways.module';
import { WorkersModule } from './workers/workers.module';
import { CommonModule } from './common/common.module';
import { StorageModule } from './storage/storage.module';
import { RagModule } from './rag/rag.module';
import { HealthModule } from './health/health.module';
import { SyncModule } from './sync/sync.module';
import { CommunityModule } from './community/community.module';
import { QueueModule } from './queue/queue.module';
import { createProducerRedisOptions } from './queue/redis.config';

@Module({
  imports: [
    // Configuration — loaded first
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      expandVariables: true,
    }),

    // Rate limiting (global)
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => [
        {
          ttl: cfg.get<number>('RATE_LIMIT_TTL', 60) * 1000,
          limit: cfg.get<number>('RATE_LIMIT_MAX', 100),
        },
      ],
    }),

    // Bull Queue Configuration with bounded retries & fast-fail producer behavior
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        redis: createProducerRedisOptions(cfg) as any,
      }),
    }),

    // Background queues & workers
    QueueModule,
    WorkersModule,

    // CRON / scheduled tasks
    ScheduleModule.forRoot(),

    // Event emitter for internal events
    EventEmitterModule.forRoot({ wildcard: true }),

    // Core modules
    DatabaseModule,
    CommonModule,
    StorageModule,
    AuditModule,
    RagModule,
    HealthModule,

    // Auth and users
    AuthModule,
    UsersModule,

    // Pathway templates
    PathwaysModule,

    // Document pipeline
    DocumentsModule,
    OcrModule,
    ExtractionModule,

    // Recovery plan and scheduling
    PlansModule,
    SchedulerModule,

    // Clinical modules
    MedicationsModule,
    SymptomsModule,
    SafetyModule,
    FollowupsModule,
    DoctorQuestionsModule,

    // Family and consent
    FamilyModule,

    // Notifications
    NotificationsModule,

    // Privacy and admin
    PrivacyModule,
    AdminModule,

    // Offline Sync and Community Health
    SyncModule,
    CommunityModule,
  ],
})
export class AppModule {}
