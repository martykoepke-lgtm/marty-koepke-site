import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { supabaseAdmin } from '../src/index';

loadEnv(resolve(process.cwd(), '../../.env.local'));
loadEnv(resolve(process.cwd(), '.env.local'));

const supabase = supabaseAdmin();

const { data: audits, error: auditsError } = await supabase
  .from('audits_v2')
  .select('id,started_at,completed_at,mode,status,tier,errors,engines_used,query_count,engine_count')
  .order('started_at', { ascending: false })
  .limit(10);

const { data: calls, error: callsError } = await supabase
  .from('api_calls')
  .select('created_at,provider,model,endpoint,status,error_message,duration_ms')
  .order('created_at', { ascending: false })
  .limit(80);

console.log(JSON.stringify({
  audits_error: auditsError?.message,
  recent_audits: audits,
  api_calls_error: callsError?.message,
  recent_api_calls: calls,
}, null, 2));

function loadEnv(path: string) {
  if (!existsSync(path)) return;
  const lines = readFileSync(path, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && !process.env[key]) process.env[key] = value;
  }
}
