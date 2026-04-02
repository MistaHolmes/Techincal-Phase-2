import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(__dirname, '..', 'data');

/**
 * Return cached/dummy EC2 logs for the dashboard. This scaffold writes
 * simple placeholder logs if none exist so the UI can display something.
 */
export function getCachedLogs() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch {}

  // Single dummy log file per service — in real deployments, this would fetch over SSH.
  const dummy = {
    'ec2-1': {
      timestamp: new Date().toISOString(),
      logs: '--- DUMMY EC2 LOGS FOR DRAFTDOCK ---\nSystem boot OK.\nService: draftdock-app running.\nNo errors found.\n',
    },
  };

  // Persist a cache file so subsequent calls return something.
  try {
    const file = path.join(DATA_DIR, 'ec2-logs.json');
    if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify(dummy, null, 2), 'utf8');
    const raw = fs.readFileSync(file, 'utf8');
    return JSON.parse(raw);
  } catch {
    return dummy;
  }
}

/**
 * Placeholder for a function that would fetch logs from a real EC2 host.
 * For now, return an array of single-entry results mirroring the root monitor API.
 */
export async function fetchEc2Logs(_publicIp: string) {
  const now = new Date().toISOString();
  return [
    { id: 'ec2-journal', name: 'EC2 Journal (dummy)', group: 'ec2', status: 'UP', responseTimeMs: 10, message: 'Dummy logs fetched', timestamp: now, severity: 'NOTICE', details: { note: 'local dummy' } }
  ];
}
