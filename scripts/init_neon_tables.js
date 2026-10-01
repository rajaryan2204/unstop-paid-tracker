import { neon } from '@neondatabase/serverless';

const databaseUrl = 'postgresql://neondb_owner:npg_Sr9XpW5sKcPU@ep-late-shadow-awcbgs14-pooler.c-12.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function initTables() {
  const sql = neon(databaseUrl);

  console.log('Creating tables in Neon PostgreSQL...');

  await sql`
    CREATE TABLE IF NOT EXISTS call_logs (
      id TEXT PRIMARY KEY,
      participant_id TEXT NOT NULL,
      call_number INT NOT NULL,
      timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      caller_name TEXT,
      caller_role TEXT,
      caller_team TEXT,
      status TEXT NOT NULL,
      remark TEXT,
      lead_number TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log('✓ call_logs table verified');

  await sql`CREATE INDEX IF NOT EXISTS idx_call_logs_participant ON call_logs(participant_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_call_logs_timestamp ON call_logs(timestamp DESC)`;
  console.log('✓ call_logs indexes created');

  await sql`
    CREATE TABLE IF NOT EXISTS payment_verifications (
      participant_id TEXT PRIMARY KEY,
      verification_state TEXT NOT NULL,
      verified_by TEXT,
      verified_by_name TEXT,
      notes TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log('✓ payment_verifications table verified');

  await sql`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      actor_name TEXT NOT NULL,
      actor_role TEXT,
      actor_team TEXT,
      action TEXT NOT NULL,
      target_id TEXT,
      target_name TEXT,
      event_name TEXT,
      prev_status TEXT,
      next_status TEXT,
      details TEXT
    )
  `;
  console.log('✓ audit_logs table verified');

  await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC)`;

  await sql`
    CREATE TABLE IF NOT EXISTS custom_passwords (
      username TEXT PRIMARY KEY,
      password TEXT NOT NULL,
      updated_by TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log('✓ custom_passwords table verified');

  // Verify all tables by querying information_schema
  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `;
  console.log('\nVerified Public Tables in Neon Database:');
  tables.forEach(t => console.log('  ->', t.table_name));

  console.log('\nAll Neon database tables successfully initialized!');
}

initTables().catch(console.error);
