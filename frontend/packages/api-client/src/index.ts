export function apiBase(scope: 'customer' | 'admin'): string {
  return scope === 'admin' ? '/api/admin' : '/api';
}

