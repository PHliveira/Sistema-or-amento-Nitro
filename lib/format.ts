/**
 * Utilitários de formatação determinística para evitar erros de hidratação (SSR vs Client).
 */

export function formatBRL(val: number): string {
  const safeVal = isNaN(val) ? 0 : Number(val);
  const parts = safeVal.toFixed(2).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `R$ ${integerPart},${parts[1]}`;
}

export function formatDateBR(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '27/10/2026';
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year = d.getUTCFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '27/10/2026';
  }
}
