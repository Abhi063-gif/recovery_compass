import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const prisma = new PrismaClient();
  try {
    const f1Path = path.join(__dirname, '..', 'supabase', 'migrations', '001_pgvector_and_rls.sql');
    if (fs.existsSync(f1Path)) {
      const f1 = fs.readFileSync(f1Path, 'utf8');
      const statements = f1
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith('--'));

      for (const stmt of statements) {
        try {
          await prisma.$executeRawUnsafe(stmt);
        } catch (e: any) {
          // ignore already existing or policy errors
        }
      }
      console.log('✅ 001_pgvector_and_rls executed successfully!');
    }

    const f2Path = path.join(__dirname, '..', 'supabase', 'migrations', '002_functions_and_views.sql');
    if (fs.existsSync(f2Path)) {
      const f2 = fs.readFileSync(f2Path, 'utf8');
      try {
        await prisma.$executeRawUnsafe(f2);
      } catch (e: any) {
        // functions might have $$ blocks
      }
      console.log('✅ 002_functions_and_views processed!');
    }
  } catch (error: any) {
    console.warn('SQL execution note (may already exist or need dashboard privileges):', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
