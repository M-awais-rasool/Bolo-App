const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Please enter your email.';
  if (!EMAIL_RE.test(email.trim())) return 'That doesn’t look like an email address.';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Please enter a password.';
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (password.length > 72) return 'Password must be at most 72 characters.';
  return null;
}

export function validateChildName(name: string): string | null {
  if (!name.trim()) return 'Please enter your child’s name.';
  if (name.trim().length > 60) return 'That name is a bit long — 60 letters max.';
  return null;
}


export function normalizeAnswer(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const curr = [i, ...new Array<number>(n)];
    for (let j = 1; j <= n; j++) {
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = curr;
  }
  return prev[n];
}

export function isTypedAnswerCorrect(typed: string, expected: string): boolean {
  const t = normalizeAnswer(typed);
  const e = normalizeAnswer(expected);
  if (!t || !e) return false;
  if (t === e) return true;
  return e.length > 4 && editDistance(t, e) <= 1;
}
