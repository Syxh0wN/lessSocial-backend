export function sanitizeText(rawValue: string) {
  return rawValue.replace(/[<>]/g, '').trim();
}
