import { NextRequest, NextResponse } from 'next/server';
import { extractGoogleDriveFileId } from '../../../lib/image-url';

function isBlockedPrivateHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (
    lower === 'localhost' ||
    lower === '::1' ||
    lower === '[::1]' ||
    lower.endsWith('.local') ||
    lower.endsWith('.internal')
  ) {
    return true;
  }

  const ipv4Match = lower.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number);
    if (a === 127 || a === 10 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
  }
  return false;
}

function detectImageMimeFromMagicBytes(buf: Uint8Array): string | null {
  if (buf.length < 4) return null;
  // PNG: 89 50 4E 47
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return 'image/png';
  }
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return 'image/jpeg';
  }
  // GIF: 47 49 46 38
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) {
    return 'image/gif';
  }
  // WEBP: RIFF....WEBP
  if (
    buf.length >= 12 &&
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return 'image/webp';
  }
  return null;
}

function buildCandidateFetchUrls(rawUrl: string): string[] {
  const driveId = extractGoogleDriveFileId(rawUrl);
  if (driveId) {
    return [
      `https://drive.google.com/thumbnail?id=${driveId}&sz=w1600`,
      `https://lh3.googleusercontent.com/d/${driveId}=w1600`,
      `https://drive.usercontent.google.com/download?id=${driveId}&export=view`,
      `https://drive.google.com/uc?export=view&id=${driveId}`,
    ];
  }

  if (/dropbox\.com/i.test(rawUrl)) {
    try {
      const parsed = new URL(rawUrl);
      parsed.searchParams.delete('dl');
      parsed.searchParams.set('raw', '1');
      return [parsed.toString(), rawUrl];
    } catch {
      return [rawUrl];
    }
  }

  return [rawUrl];
}

async function resolveExternalImage(
  rawUrl: string,
  accessToken?: string
): Promise<{ arrayBuf: ArrayBuffer; contentType: string } | { error: string; status: number }> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { error: 'URL inválida.', status: 400 };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { error: 'Protocolo não suportado.', status: 400 };
  }

  if (isBlockedPrivateHost(parsed.hostname)) {
    return { error: 'Host não permitido.', status: 403 };
  }

  const driveId = extractGoogleDriveFileId(rawUrl);
  const candidateRequests: Array<{ url: string; headers: Record<string, string> }> = [];

  if (driveId && accessToken && accessToken.trim()) {
    candidateRequests.push({
      url: `https://www.googleapis.com/drive/v3/files/${driveId}?alt=media`,
      headers: {
        Authorization: `Bearer ${accessToken.trim()}`,
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      },
    });
  }

  for (const candidateUrl of buildCandidateFetchUrls(rawUrl)) {
    candidateRequests.push({
      url: candidateUrl,
      headers: {
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
    });
  }

  for (const candidate of candidateRequests) {
    try {
      const candidateParsed = new URL(candidate.url);
      if (isBlockedPrivateHost(candidateParsed.hostname)) continue;

      const res = await fetch(candidate.url, {
        method: 'GET',
        redirect: 'follow',
        signal: AbortSignal.timeout(12000),
        headers: candidate.headers,
      });

      if (!res.ok) continue;

      const contentTypeHeader = (res.headers.get('content-type') || '').toLowerCase();
      const arrayBuf = await res.arrayBuffer();
      if (arrayBuf.byteLength === 0 || arrayBuf.byteLength > 15 * 1024 * 1024) continue;

      const bytes = new Uint8Array(arrayBuf);
      const magicMime = detectImageMimeFromMagicBytes(bytes);

      let finalContentType = '';
      if (contentTypeHeader.startsWith('image/')) {
        finalContentType = contentTypeHeader.split(';')[0].trim();
      } else if (magicMime) {
        finalContentType = magicMime;
      }

      if (!finalContentType) continue;

      return { arrayBuf, contentType: finalContentType };
    } catch {
      // Tenta próximo candidato
    }
  }

  return {
    error:
      'Não foi possível carregar a imagem a partir do link informado. Verifique se o link é público ou aponta diretamente para uma foto.',
    status: 422,
  };
}

export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get('url')?.trim() || '';
  const format = req.nextUrl.searchParams.get('format')?.trim() || 'binary';
  if (!rawUrl) {
    return NextResponse.json({ error: 'Parâmetro url ausente.' }, { status: 400 });
  }

  const authHeader = req.headers.get('authorization');
  const bearerToken = authHeader?.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : undefined;

  const result = await resolveExternalImage(rawUrl, bearerToken);
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  if (format === 'dataurl') {
    const base64 = Buffer.from(result.arrayBuf).toString('base64');
    return NextResponse.json(
      {
        dataUrl: `data:${result.contentType};base64,${base64}`,
        contentType: result.contentType,
      },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  }

  return new NextResponse(result.arrayBuf, {
    status: 200,
    headers: {
      'Content-Type': result.contentType,
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      url?: string;
      accessToken?: string;
      format?: 'dataurl' | 'binary';
    };
    const rawUrl = (body.url || '').trim();
    if (!rawUrl) {
      return NextResponse.json({ error: 'Parâmetro url ausente.' }, { status: 400 });
    }

    const result = await resolveExternalImage(rawUrl, body.accessToken);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    if (body.format === 'binary') {
      return new NextResponse(result.arrayBuf, {
        status: 200,
        headers: {
          'Content-Type': result.contentType,
          'Cache-Control': 'no-store',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const base64 = Buffer.from(result.arrayBuf).toString('base64');
    return NextResponse.json(
      {
        dataUrl: `data:${result.contentType};base64,${base64}`,
        contentType: result.contentType,
      },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch {
    return NextResponse.json({ error: 'Requisição inválida.' }, { status: 400 });
  }
}
