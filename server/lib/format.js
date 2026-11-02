/** Utilitários de formatação e sanitização compartilhados. */

export function brl(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function nowIso() {
  return new Date().toISOString();
}

export function dateTimeBR(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

export function isValidCPF(value) {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const calc = (slice) => {
    let sum = 0;
    for (let i = 0; i < slice; i += 1) sum += Number(cpf[i]) * (slice + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return calc(9) === Number(cpf[9]) && calc(10) === Number(cpf[10]);
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(String(value || '').trim());
}

export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

export function maskCpf(value) {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11) return value || '';
  return `***.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-**`;
}

export function isValidPhoneBR(value) {
  const digits = onlyDigits(value);
  if (digits.length !== 10 && digits.length !== 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false;
  const ddd = parseInt(digits.slice(0, 2), 10);
  const validDdds = [
    11, 12, 13, 14, 15, 16, 17, 18, 19,
    21, 22, 24, 27, 28,
    31, 32, 33, 34, 35, 37, 38,
    41, 42, 43, 44, 45, 46, 47, 48, 49,
    51, 53, 54, 55,
    61, 62, 63, 64, 65, 66, 67, 68, 69,
    71, 73, 74, 75, 77, 79,
    81, 82, 83, 84, 85, 86, 87, 88, 89,
    91, 92, 93, 94, 95, 96, 97, 98, 99
  ];
  if (!validDdds.includes(ddd)) return false;
  if (digits.length === 11 && digits[2] !== '9') return false;
  return true;
}

export function isValidFullName(value) {
  const clean = String(value || '').trim();
  const parts = clean.split(/\s+/).filter((p) => p.length >= 2);
  if (parts.length < 2) return false;
  const blacklist = ['teste', 'test', 'admin', 'asdf', 'usuario', 'cliente', 'fake', 'desconhecido', 'abc'];
  if (parts.some((p) => blacklist.includes(p.toLowerCase()))) return false;
  return true;
}

export function startOfDay(date = new Date()) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function daysAgo(days) {
  const copy = new Date();
  copy.setDate(copy.getDate() - days);
  return copy;
}

export function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
