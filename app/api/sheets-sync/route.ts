import { NextRequest, NextResponse } from 'next/server';

const PERMANENT_WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycbz1LeE5hwyKob5_Q-jveqh47hOqei0Ei6JalXJ4KB7Gb-TaAWaZTbvyUxamDRiGGFgc/exec';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const targetUrl =
      body.webhookUrl && typeof body.webhookUrl === 'string' && body.webhookUrl.trim().startsWith('http')
        ? body.webhookUrl.trim()
        : PERMANENT_WEBHOOK_URL;

    const payload = body.payload || body;
    if (payload.webhookUrl) {
      delete payload.webhookUrl;
    }

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = { rawText: text };
    }

    const isSuccess = response.ok && data?.status !== 'error';

    return NextResponse.json({
      success: isSuccess,
      status: response.status,
      data,
      message: data?.message || (isSuccess ? 'Gravado no Google Sheets!' : 'Erro na resposta do Google Sheets'),
    });
  } catch (error: any) {
    console.error('Erro na rota /api/sheets-sync:', error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Falha de rede ao conectar com o Google Apps Script.',
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const webhookUrl = searchParams.get('webhookUrl') || PERMANENT_WEBHOOK_URL;
    const action = searchParams.get('action') || 'get_data';

    const url = `${webhookUrl}?action=${encodeURIComponent(action)}&t=${Date.now()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    const text = await response.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = { rawText: text };
    }

    return NextResponse.json({
      success: response.ok,
      data,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Erro ao consultar Google Sheets.',
      },
      { status: 500 }
    );
  }
}
