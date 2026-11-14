import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { conversationText, availableProducts = [], availableFabrics = [] } = body;

    if (!conversationText || typeof conversationText !== 'string' || !conversationText.trim()) {
      return NextResponse.json(
        { success: false, error: 'Por favor, informe ou cole o texto da conversa.' },
        { status: 400 }
      );
    }

    // Lista simplificada de modelos e tecidos para grounding
    const productCatalogSummary = availableProducts.map((p: any) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      defaultFabricId: p.defaultFabricId,
    }));

    const fabricCatalogSummary = availableFabrics.map((f: any) => ({
      id: f.id,
      name: f.name,
      composition: f.composition,
    }));

    const prompt = `Você é um assistente especialista em orçamentos para uma indústria e confecção têxtil de camisetas e uniformes personalizados (Nitro Camisetas & Uniformes).

Sua tarefa é ler atentamente a conversa fornecida (conversa de WhatsApp, e-mail, direct ou notas de atendimento) e extrair os dados estruturados do orçamento.

REGRA CRUCIAL E OBRIGATÓRIA:
"caso não tenha informação deixar os campos em branco"
Se qualquer dado (nome, telefone, empresa, email, frete, cidade, cor, etc.) NÃO for mencionado na conversa, preencha strings como "" (string vazia), números não informados como 0, e não invente dados fictícios.

Catálogo de Modelos Base disponíveis na confecção:
${JSON.stringify(productCatalogSummary, null, 2)}

Catálogo de Tecidos disponíveis:
${JSON.stringify(fabricCatalogSummary, null, 2)}

Texto da Conversa para Análise:
---
${conversationText}
---

Retorne estritamente um JSON com a seguinte estrutura:
{
  "client": {
    "clientType": "'PF' ou 'PJ' (se for empresa, academia, marca comercial ou tiver CNPJ use 'PJ', se for pessoa física use 'PF')",
    "document": "CPF ou CNPJ formatado se mencionado na conversa ou '' se não informado",
    "name": "nome do cliente/contato ou '' se não informado",
    "company": "nome da empresa/academia/marca ou '' se não informado",
    "phone": "telefone/whatsapp com DDD ou '' se não informado",
    "email": "email ou '' se não informado",
    "sellerName": "nome do vendedor se mencionado na conversa ou '' se não informado"
  },
  "commercial": {
    "paymentTerms": "condição de pagamento negociada ou '' se não informado",
    "deliveryLeadTimeDays": 0, // número de dias úteis se mencionado, ou 0 se não informado
    "deliveryLeadTimeCustom": "texto livre do prazo se mencionado (ex: '15 dias úteis') ou '' se não informado",
    "notes": "observações comerciais gerais mencionadas ou '' se não informado"
  },
  "shipping": {
    "cepDestino": "CEP de entrega (formato 00000-000) ou '' se não informado",
    "cidadeUf": "Cidade / UF de entrega ou '' se não informado",
    "shippingType": "correios_pac" | "correios_sedex" | "transportadora" | "frete_gratis" | "retirada" | ""
  },
  "items": [
    {
      "title": "Nome do modelo identificado (ex: Camiseta Tradicional Manga Curta, Camiseta Oversized, Polo, etc.) ou ''",
      "matchedProductId": "id do modelo mais compatível do catálogo (ex: prod-tshirt-basic) ou ''",
      "matchedFabricId": "id do tecido mais compatível do catálogo (ex: fab-meia-malha-30-1, fab-dry-fit) ou ''",
      "color": "Cor identificada (ex: Preto, Branco, Azul Marinho, Verde) ou '' se não informada",
      "sizes": {
        "pp": 0, "p": 0, "m": 0, "g": 0, "gg": 0, "exg": 0, "g1": 0, "g2": 0,
        "tam02": 0, "tam04": 0, "tam06": 0, "tam08": 0, "tam10": 0, "tam12": 0, "tam14": 0, "tam16": 0
      },
      "printing": {
        "technique": "silk" | "dtf" | "sublimation" | "vinyl" | "none", // escolha a técnica citada na conversa
        "silkPositions": [
          { "position": "Frente (Peito Pequeno)" | "Frente (Grande/A4)" | "Costas (Superior)" | "Costas (Grande/A4)" | "Manga Esquerda" | "Manga Direita", "colorsCount": 1 }
        ],
        "dtfPositions": [
          { "label": "Logo ou arte", "widthCm": 10, "heightCm": 10 }
        ],
        "sublimationMode": "total" | "localizada",
        "notes": "detalhes de estampa"
      },
      "notes": "observações específicas deste item ou ''"
    }
  ],
  "extractedSummary": "Resumo em 1 ou 2 frases em português dos dados identificados na conversa."
}

OBSERVAÇÕES IMPORTANTES SOBRE A GRADE:
- Se a conversa disser apenas a quantidade total sem especificar a grade por tamanho (ex: "quero 50 camisetas"), preencha o tamanho 'm' com essa quantidade total ou divida razoavelmente entre P, M, G, GG e informe nas notas!
- Se a conversa tiver múltiplos modelos (ex: camisetas + regatas ou 2 cores diferentes), crie um item no array "items" para cada modelo/variação.`;

    // Fallback resiliente entre modelos para contornar picos temporários de demanda (erro 503)
    const candidateModels = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-3.8-flash'];
    let rawText = '';
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        });
        if (response.text) {
          rawText = response.text;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Modelo ${model} indisponível ou com erro (${err?.message || err}). Tentando próximo modelo...`);
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
    }

    if (!rawText) {
      const isOverload =
        lastError?.status === 503 ||
        lastError?.code === 503 ||
        String(lastError?.message || '').includes('503') ||
        String(lastError?.message || '').toLowerCase().includes('high demand') ||
        String(lastError?.message || '').toLowerCase().includes('unavailable');

      if (isOverload) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Os servidores de Inteligência Artificial estão com alta demanda temporária no momento. Por favor, clique em "Analisar Conversa e Preencher" novamente em alguns segundos.',
          },
          { status: 503 }
        );
      }
      throw lastError || new Error('Não foi possível obter resposta dos modelos de IA.');
    }

    let parsed: any;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // Limpeza de possíveis formatações
      const clean = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(clean);
    }

    return NextResponse.json({
      success: true,
      data: parsed,
    });
  } catch (error: any) {
    console.error('Erro ao processar conversa com Gemini:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Falha ao processar a conversa com Inteligência Artificial.',
      },
      { status: 500 }
    );
  }
}
