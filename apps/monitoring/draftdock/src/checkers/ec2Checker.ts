import net from 'net';
import { config } from '../config';
import type { CheckResult } from '../types';

const DEFAULT_TIMEOUT = 3000;

export async function runEc2Checks(): Promise<CheckResult[]> {
  const ips = config.ec2.instanceIps || [];
  const now = new Date().toISOString();
  if (ips.length === 0) {
    return [{ id: 'ec2-status', name: 'EC2 Instance — not configured', group: 'ec2', status: 'UNKNOWN', responseTimeMs: 0, message: 'No EC2_INSTANCE_IPS provided', timestamp: now, severity: 'WARNING' }];
  }

  const checks: CheckResult[] = [];
  for (const [i, ip] of ips.entries()) {
    const id = i === 0 ? 'ec2-status' : `ec2-status-${i}`;
    try {
      const elapsed = await tcpConnectMs(ip, 22, DEFAULT_TIMEOUT);
      checks.push({ id, name: `EC2 SSH ${ip}`, group: 'ec2', status: 'UP', responseTimeMs: elapsed, message: 'SSH port open', timestamp: now, severity: 'CRITICAL', details: { ip } });
    } catch (err: any) {
      checks.push({ id, name: `EC2 SSH ${ip}`, group: 'ec2', status: 'DOWN', responseTimeMs: 0, message: err.message || 'Unreachable', timestamp: now, severity: 'CRITICAL', details: { ip } });
    }
  }

  return checks;
}

function tcpConnectMs(host: string, port: number, timeoutMs = 3000): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    const start = Date.now();
    const s = new net.Socket();
    let settled = false;
    s.setTimeout(timeoutMs);
    s.once('connect', () => {
      const elapsed = Date.now() - start;
      settled = true;
      s.destroy();
      resolve(elapsed);
    });
    s.once('timeout', () => {
      if (settled) return;
      settled = true;
      s.destroy();
      reject(new Error('Timeout'));
    });
    s.once('error', (err) => {
      if (settled) return;
      settled = true;
      s.destroy();
      reject(err);
    });
    s.connect(port, host);
  });
}
