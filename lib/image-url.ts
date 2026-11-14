/**
 * Utilitários para normalizar URLs externas de imagens (Google Drive, Dropbox, URLs diretas)
 * e rotear via proxy same-origin (/api/image-proxy) para evitar bloqueios de CORS e permitir
 * exibição e exportação em PDF/impressão sem falhas.
 */

export function extractGoogleDriveFileId(rawUrl: string): string | null {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();

  // https://drive.google.com/file/d/<FILE_ID>/view...
  const fileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (fileMatch?.[1]) return fileMatch[1];

  // https://drive.google.com/open?id=<FILE_ID> ou /uc?id=<FILE_ID> ou /thumbnail?id=<FILE_ID>
  const queryMatch = trimmed.match(/drive\.google\.com\/(?:open|uc|thumbnail|file\/u\/\d+\/d)[^?#]*[?&]id=([a-zA-Z0-9_-]+)/i);
  if (queryMatch?.[1]) return queryMatch[1];

  // Fallback genérico para URLs drive.google.com com parâmetro id=
  if (/drive\.google\.com/i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      const id = parsed.searchParams.get('id');
      if (id && /^[a-zA-Z0-9_-]{10,}$/.test(id)) return id;
    } catch {
      // ignora URL inválida
    }
  }

  // https://lh3.googleusercontent.com/d/<FILE_ID>
  const lh3Match = trimmed.match(/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/i);
  if (lh3Match?.[1]) return lh3Match[1];

  return null;
}

export function normalizeExternalImageUrl(rawUrl?: string): string {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  if (
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('/')
  ) {
    return trimmed;
  }

  const driveId = extractGoogleDriveFileId(trimmed);
  if (driveId) {
    return `https://drive.google.com/thumbnail?id=${driveId}&sz=w1600`;
  }

  // Dropbox: converte ?dl=0 ou links padrão para raw=1
  if (/dropbox\.com/i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      parsed.searchParams.delete('dl');
      parsed.searchParams.set('raw', '1');
      return parsed.toString();
    } catch {
      return trimmed.replace(/[?&]dl=0\b/, '?raw=1');
    }
  }

  return trimmed;
}

export function getProxiedImageUrl(rawUrl?: string): string {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  if (
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('/')
  ) {
    return trimmed;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return `/api/image-proxy?url=${encodeURIComponent(trimmed)}`;
  }

  return trimmed;
}

export function isNonImageVectorExtension(rawUrl?: string): boolean {
  if (!rawUrl) return false;
  const clean = rawUrl.trim().split('?')[0].split('#')[0].toLowerCase();
  return /\.(cdr|ai|eps|psd|zip|rar|7z|svgz)$/i.test(clean);
}
