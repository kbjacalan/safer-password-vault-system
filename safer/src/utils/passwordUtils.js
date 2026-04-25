export const calcStrength = (pw) => {
  let score = 0;
  const checks = {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    number: /[0-9]/.test(pw),
    symbol: /[^A-Za-z0-9]/.test(pw),
  };
  if (pw.length >= 6) score++;
  if (checks.length) score++;
  if (checks.upper) score++;
  if (checks.number) score++;
  if (checks.symbol) score++;
  return { score: Math.min(score, 4), checks };
};

export const generatePassword = () => {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  return Array.from({ length: 16 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length)),
  ).join("");
};
