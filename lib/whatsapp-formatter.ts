import { CalculatedQuoteTotals, Quote, SizeGrid } from './types';
import { formatBRL, formatDateBR } from './format';

function formatSizeGridText(sizes: SizeGrid): string {
  const adultParts: string[] = [];
  if (sizes.pp) adultParts.push(`PP: ${sizes.pp}`);
  if (sizes.p) adultParts.push(`P: ${sizes.p}`);
  if (sizes.m) adultParts.push(`M: ${sizes.m}`);
  if (sizes.g) adultParts.push(`G: ${sizes.g}`);
  if (sizes.gg) adultParts.push(`GG: ${sizes.gg}`);
  if (sizes.exg) adultParts.push(`EXG: ${sizes.exg}`);
  if (sizes.g1) adultParts.push(`G1: ${sizes.g1}`);
  if (sizes.g2) adultParts.push(`G2: ${sizes.g2}`);

  const childParts: string[] = [];
  if (sizes.tam02) childParts.push(`02: ${sizes.tam02}`);
  if (sizes.tam04) childParts.push(`04: ${sizes.tam04}`);
  if (sizes.tam06) childParts.push(`06: ${sizes.tam06}`);
  if (sizes.tam08) childParts.push(`08: ${sizes.tam08}`);
  if (sizes.tam10) childParts.push(`10: ${sizes.tam10}`);
  if (sizes.tam12) childParts.push(`12: ${sizes.tam12}`);
  if (sizes.tam14) childParts.push(`14: ${sizes.tam14}`);
  if (sizes.tam16) childParts.push(`16: ${sizes.tam16}`);

  const lines: string[] = [];
  if (adultParts.length > 0) {
    lines.push(`Adulto: [ ${adultParts.join(' | ')} ]`);
  }
  if (childParts.length > 0) {
    lines.push(`Infantil: [ ${childParts.join(' | ')} ]`);
  }

  return lines.length > 0 ? lines.join('\n      ') : 'A definir';
}

function formatPrintSummary(item: Quote['items'][0]): string {
  const techniques: string[] = [];
  const p = item.printing;

  if (p.silk.enabled) {
    const posDetails = p.silk.positions
      .map((pos) => `${pos.position} (${pos.colorsCount} ${pos.colorsCount === 1 ? 'cor' : 'cores'} em ${pos.inkType.split(' ')[0]})`)
      .join(', ');
    techniques.push(`Silk Screen (${posDetails || 'personalizado'})`);
  }

  if (p.dtf.enabled) {
    const posDetails = p.dtf.positions
      .map((pos) => `${pos.label || 'Estampa'} (${pos.widthCm}x${pos.heightCm}cm)`)
      .join(', ');
    techniques.push(`DTF Alta Definição (${posDetails})`);
  }

  if (p.sublimation.enabled) {
    const modeLabel =
      p.sublimation.mode === 'total'
        ? 'Total Frente + Costas + Mangas'
        : p.sublimation.mode === 'impressao_e_prensagem'
        ? 'Impressão e Prensagem'
        : p.sublimation.mode === 'apenas_impressao'
        ? 'Somente Impressão'
        : 'Somente Prensagem';
    techniques.push(`Sublimação (${modeLabel})`);
  }

  if (p.vinyl.enabled) {
    techniques.push(`Filme de Recorte Termotransferível (${p.vinyl.widthCm}x${p.vinyl.heightCm}cm)`);
  }

  return techniques.length > 0 ? techniques.join('\n      • ') : 'Peça Lisa (Sem estampa)';
}

export function formatQuoteForWhatsApp(
  quote: Quote,
  totals: CalculatedQuoteTotals
): string {
  let message = `⚡ *NITRO CAMISETAS & UNIFORMES* ⚡\n`;
  message += `_Confecção Têxtil Especializada & Estamparia de Alta Performance_\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  message += `Olá! Segue a proposta comercial detalhada do pedido:\n\n`;
  message += `📄 *Orçamento:* \`${quote.quoteNumber}\`\n`;
  message += `📅 *Data:* ${formatDateBR(quote.createdAt)}\n`;
  message += `⏰ *Validade da Proposta:* ${quote.validityDays} dias${quote.validityDate ? ` (até ${formatDateBR(quote.validityDate)})` : ''}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  message += `👕 *ITENS DO PEDIDO:*\n\n`;

  quote.items.forEach((item, index) => {
    const itemCalc = totals.itemsCalculated[item.id];
    const totalQty = itemCalc ? itemCalc.totalQuantity : 0;
    const unitPrice = itemCalc ? formatBRL(itemCalc.unitSellingPrice) : 'R$ 0,00';
    const totalPrice = itemCalc ? formatBRL(itemCalc.totalSellingPrice) : 'R$ 0,00';
    const sizeText = formatSizeGridText(item.sizes);
    const printText = formatPrintSummary(item);

    message += `*Item ${index + 1}: ${item.title}*\n`;
    message += `   • *Modelagem:* ${item.fitType || 'Unissex'}\n`;
    message += `   • *Manga:* ${item.sleeveType || 'Manga Curta'}\n`;
    if (item.color) {
      message += `   • *Cor do Modelo:* ${item.color}\n`;
    }
    message += `   • *Quantidade:* ${totalQty} unidades\n`;
    message += `   • *Estamparia / Acabamento:*\n      • ${printText}\n`;
    message += `   • *Grade de Tamanhos:*\n      ${sizeText}\n`;
    message += `   • *Valor Unitário:* *${unitPrice}*\n`;
    message += `   • *Subtotal do Item:* *${totalPrice}*\n`;

    if (item.approvedMockupUrl) {
      message += `   • 🖼️ *Mockup Aprovado:* ${item.approvedMockupUrl}\n`;
    }
    if (item.finalArtUrl) {
      message += `   • 🎨 *Arquivo Arte Final:* ${item.finalArtUrl}\n`;
    }
    if (item.mockupImages && item.mockupImages.length > 0) {
      message += `   • 📸 *Referências Anexadas:* ${item.mockupImages.length} ${item.mockupImages.length === 1 ? 'arquivo' : 'arquivos'}\n`;
    }

    if (item.notes) {
      message += `   • _Obs: ${item.notes}_\n`;
    }
    message += `\n`;
  });

  message += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `📊 *RESUMO GERAL DO PEDIDO:*\n`;
  message += `📦 *Total de Peças:* ${totals.totalQuantity} unidades\n`;
  message += `👕 *Subtotal dos Produtos:* ${formatBRL(totals.totalProductsSellingPrice || totals.totalSellingPrice)}\n`;
  if (totals.artCreationCost > 0) {
    message += `🎨 *Criação de Arte / Mockup:* ${formatBRL(totals.artCreationCost)}\n`;
  }

  if (quote.clientDocument) {
    message += `🪪 *${quote.clientType === 'PJ' ? 'CNPJ' : 'CPF'}:* ${quote.clientDocument}\n`;
  }

  if (quote.deliveryAddress) {
    const addr = quote.deliveryAddress;
    const addrParts = [
      addr.street ? `${addr.street}${addr.number ? `, ${addr.number}` : ''}` : '',
      addr.complement || '',
      addr.neighborhood || '',
      addr.city ? `${addr.city}${addr.state ? `/${addr.state}` : ''}` : '',
      addr.cep ? `CEP ${addr.cep}` : '',
    ].filter(Boolean);
    if (addrParts.length > 0) {
      message += `📍 *Endereço de Entrega:* ${addrParts.join(' - ')}\n`;
    }
  }

  if (quote.shipping) {
    const s = quote.shipping;
    const shippingPriceStr =
      s.type === 'frete_gratis' || s.type === 'retirada' || s.price === 0
        ? 'GRÁTIS (Cortesia Nitro)'
        : `${formatBRL(s.price)}${s.fretePorConta === 'FOB' ? ' (A pagar no destino / FOB)' : ' (Incluso no total / CIF)'}`;

    message += `🚚 *Forma de Envio:* ${s.name}\n`;
    message += `   • *Frete:* *${shippingPriceStr}*\n`;
    message += `   • *Prazo Estimado de Transporte:* ${s.deliveryTime}\n`;
    if (s.cidadeUf) {
      message += `   • *Trajeto:* ${s.cidadeUfOrigem || 'São Paulo / SP'} ➔ ${s.cidadeUf}\n`;
    }
  }

  message += `💰 *VALOR TOTAL DO INVESTIMENTO:* *${formatBRL(totals.totalSellingPrice)}*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  message += `📋 *CONDIÇÕES COMERCIAIS:*\n`;
  message += `• *Condições de Pagamento:* ${quote.paymentTerms}\n`;
  message += `• *Prazo de Produção:* ${quote.deliveryLeadTimeCustom || `${quote.deliveryLeadTimeDays} dias úteis após aprovação de layout e sinal`}\n`;
  if (quote.notes) {
    message += `• *Observações Gerais:* ${quote.notes}\n`;
  }
  message += `\nEstamos à disposição para formalizar o pedido e iniciar a produção! Qualquer dúvida ou alteração, só nos avisar por aqui. 🚀`;

  return message;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Failed to copy to clipboard', err);
    return false;
  }
}
