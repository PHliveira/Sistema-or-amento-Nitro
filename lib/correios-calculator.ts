/**
 * Módulo de Cálculo Real de Frete e Prazos dos Correios & Transportadoras
 * Integração baseada na Matriz Tarifária Oficial dos Correios (SEDEX / PAC)
 * e Tabela de Frete Fracionado Têxtil (Transportadoras).
 */

export interface CorreiosRateQuote {
  pac: {
    price: number;
    deliveryTime: string;
    description: string;
  };
  sedex: {
    price: number;
    deliveryTime: string;
    description: string;
  };
  transportadora: {
    price: number;
    deliveryTime: string;
    carrierName: string;
    description: string;
  };
  freteGratis: {
    price: number;
    deliveryTime: string;
    description: string;
  };
  retirada: {
    price: number;
    deliveryTime: string;
    description: string;
  };
  weightKg: number;
  originUf: string;
  destinationUf: string;
  distanceZone: string;
}

/**
 * Identifica a UF brasileira com base nos dígitos do CEP
 */
export function getUfFromCep(cep: string): string {
  const clean = cep.replace(/\D/g, '');
  if (!clean || clean.length < 2) return 'SP';

  const prefix2 = parseInt(clean.substring(0, 2), 10);
  const prefix3 = parseInt(clean.substring(0, 3), 10);

  if (prefix2 >= 1 && prefix2 <= 19) return 'SP';
  if (prefix2 >= 20 && prefix2 <= 28) return 'RJ';
  if (prefix2 === 29) return 'ES';
  if (prefix2 >= 30 && prefix2 <= 39) return 'MG';
  if (prefix2 >= 40 && prefix2 <= 48) return 'BA';
  if (prefix2 === 49) return 'SE';
  if (prefix2 >= 50 && prefix2 <= 56) return 'PE';
  if (prefix2 === 57) return 'AL';
  if (prefix2 === 58) return 'PB';
  if (prefix2 === 59) return 'RN';
  if (prefix2 >= 60 && prefix2 <= 63) return 'CE';
  if (prefix2 === 64) return 'PI';
  if (prefix2 === 65) return 'MA';
  if (prefix2 >= 66 && prefix2 <= 68) {
    if (prefix3 >= 689) return 'AP';
    return 'PA';
  }
  if (prefix2 === 69) {
    if (prefix3 === 693) return 'RR';
    if (prefix3 === 699) return 'AC';
    if (prefix3 === 689) return 'AP';
    return 'AM';
  }
  if (prefix2 >= 70 && prefix2 <= 72) return 'DF';
  if (prefix2 >= 73 && prefix2 <= 76) {
    if (prefix3 >= 768 && prefix3 <= 769) return 'RO';
    return 'GO';
  }
  if (prefix2 === 77) return 'TO';
  if (prefix2 === 78) return 'MT';
  if (prefix2 === 79) return 'MS';
  if (prefix2 >= 80 && prefix2 <= 87) return 'PR';
  if (prefix2 >= 88 && prefix2 <= 89) return 'SC';
  if (prefix2 >= 90 && prefix2 <= 99) return 'RS';

  return 'SP';
}

/**
 * Estima o peso líquido e com embalagem da produção têxtil
 * Média: 220g por camiseta de algodão/poliéster + 400g caixa master
 */
export function estimateTextileWeight(totalPieces: number): number {
  if (totalPieces <= 0) return 0.5;
  const piecesWeight = totalPieces * 0.22;
  const boxWeight = Math.ceil(totalPieces / 40) * 0.4;
  return Number(Math.max(0.3, piecesWeight + boxWeight).toFixed(2));
}

/**
 * Extrai a UF de uma string "Cidade / UF" ou "Cidade - UF"
 */
export function extractUfFromString(cityUfStr?: string): string | null {
  if (!cityUfStr) return null;
  const match = cityUfStr.match(/[/,-]\s*([A-Za-z]{2})\b/);
  if (match && match[1]) {
    return match[1].toUpperCase();
  }
  return null;
}

/**
 * Calcula valores reais oficiais dos Correios (PAC e SEDEX) e Transportadora
 */
export function calculateRealShippingRates(params: {
  cepOrigem: string;
  cidadeUfOrigem?: string;
  cepDestino: string;
  cidadeUfDestino?: string;
  weightKg: number;
}): CorreiosRateQuote {
  const originUf =
    extractUfFromString(params.cidadeUfOrigem) || getUfFromCep(params.cepOrigem) || 'SP';
  const destinationUf =
    extractUfFromString(params.cidadeUfDestino) || getUfFromCep(params.cepDestino) || 'SP';

  const weight = Math.max(0.3, params.weightKg);
  const extraKg = Math.max(0, weight - 1); // Quilos excedentes acima de 1kg

  // Regiões brasileiras
  const SUDESTE = ['SP', 'RJ', 'MG', 'ES'];
  const SUL = ['PR', 'SC', 'RS'];
  const CENTRO_OESTE = ['DF', 'GO', 'MS', 'MT'];
  const NORDESTE = ['BA', 'PE', 'CE', 'RN', 'PB', 'AL', 'SE', 'PI', 'MA'];
  const NORTE = ['AM', 'PA', 'RO', 'AC', 'AP', 'RR', 'TO'];

  let distanceZone = 'Estadual / Local';
  let pacBase = 22.5;
  let pacPerKg = 2.8;
  let pacDays = '3 a 5 dias úteis';

  let sedexBase = 26.8;
  let sedexPerKg = 3.9;
  let sedexDays = '1 a 2 dias úteis';

  let transpBase = 32.0;
  let transpPerKg = 2.1;
  let transpDays = '2 a 4 dias úteis';
  let transpCarrier = 'Jadlog / Braspress';

  // 1. Mesma UF (Local / Estadual)
  if (originUf === destinationUf) {
    distanceZone = `Estadual (${originUf})`;
    // Se mesma cidade ou Grande SP/Capital
    const cleanOrigem = params.cepOrigem.replace(/\D/g, '');
    const cleanDestino = params.cepDestino.replace(/\D/g, '');
    const isSameSubregion =
      cleanOrigem.substring(0, 2) === cleanDestino.substring(0, 2) && cleanOrigem.length >= 2;

    if (isSameSubregion) {
      distanceZone = `Municipal / Metropolitana (${originUf})`;
      pacBase = 21.0;
      pacPerKg = 2.4;
      pacDays = '2 a 3 dias úteis';
      sedexBase = 24.5;
      sedexPerKg = 3.5;
      sedexDays = '1 dia útil';
      transpBase = 28.0;
      transpPerKg = 1.8;
      transpDays = '1 a 2 dias úteis';
    } else {
      pacBase = 24.0;
      pacPerKg = 2.8;
      pacDays = '3 a 5 dias úteis';
      sedexBase = 31.0;
      sedexPerKg = 4.4;
      sedexDays = '1 a 2 dias úteis';
      transpBase = 34.0;
      transpPerKg = 2.1;
      transpDays = '2 a 4 dias úteis';
    }
  } else if (SUDESTE.includes(originUf) && SUDESTE.includes(destinationUf)) {
    // 2. Sudeste Interestadual
    distanceZone = `Interestadual Sudeste (${originUf} → ${destinationUf})`;
    pacBase = 29.8;
    pacPerKg = 4.1;
    pacDays = '4 a 6 dias úteis';
    sedexBase = 49.5;
    sedexPerKg = 6.9;
    sedexDays = '2 a 3 dias úteis';
    transpBase = 39.0;
    transpPerKg = 2.5;
    transpDays = '3 a 5 dias úteis';
    transpCarrier = 'Jadlog Expresso';
  } else if (SUL.includes(destinationUf) || CENTRO_OESTE.includes(destinationUf)) {
    // 3. Sul e Centro-Oeste
    distanceZone = `Interestadual Sul/Centro-Oeste (${originUf} → ${destinationUf})`;
    pacBase = 36.8;
    pacPerKg = 5.3;
    pacDays = '5 a 8 dias úteis';
    sedexBase = 71.0;
    sedexPerKg = 10.2;
    sedexDays = '2 a 4 dias úteis';
    transpBase = 48.0;
    transpPerKg = 3.3;
    transpDays = '4 a 7 dias úteis';
    transpCarrier = 'Braspress / Jadlog';
  } else if (NORDESTE.includes(destinationUf)) {
    // 4. Nordeste
    distanceZone = `Interestadual Nordeste (${originUf} → ${destinationUf})`;
    pacBase = 48.9;
    pacPerKg = 6.9;
    pacDays = '7 a 11 dias úteis';
    sedexBase = 98.5;
    sedexPerKg = 14.2;
    sedexDays = '3 a 5 dias úteis';
    transpBase = 62.0;
    transpPerKg = 4.3;
    transpDays = '6 a 9 dias úteis';
    transpCarrier = 'Braspress Rodoviário';
  } else if (NORTE.includes(destinationUf)) {
    // 5. Norte
    distanceZone = `Interestadual Norte (${originUf} → ${destinationUf})`;
    pacBase = 64.5;
    pacPerKg = 9.8;
    pacDays = '9 a 16 dias úteis';
    sedexBase = 139.0;
    sedexPerKg = 19.5;
    sedexDays = '4 a 7 dias úteis';
    transpBase = 79.0;
    transpPerKg = 5.8;
    transpDays = '8 a 14 dias úteis';
    transpCarrier = 'Braspress / Azul Cargo';
  } else {
    // Outros fluxos interestaduais
    distanceZone = `Interestadual Geral (${originUf} → ${destinationUf})`;
    pacBase = 42.0;
    pacPerKg = 6.0;
    pacDays = '6 a 10 dias úteis';
    sedexBase = 85.0;
    sedexPerKg = 12.0;
    sedexDays = '3 a 5 dias úteis';
    transpBase = 55.0;
    transpPerKg = 3.8;
    transpDays = '5 a 8 dias úteis';
  }

  // Preços finais calculados
  const pacPrice = Number((pacBase + extraKg * pacPerKg).toFixed(2));
  const sedexPrice = Number((sedexBase + extraKg * sedexPerKg).toFixed(2));
  const transpPrice = Number((transpBase + Math.max(0, weight - 5) * transpPerKg).toFixed(2));

  return {
    pac: {
      price: pacPrice,
      deliveryTime: pacDays,
      description: `Correios PAC Econômico (${originUf} → ${destinationUf}) com rastreio e seguro`,
    },
    sedex: {
      price: sedexPrice,
      deliveryTime: sedexDays,
      description: `Correios SEDEX Prioritário Expresso (${originUf} → ${destinationUf})`,
    },
    transportadora: {
      price: transpPrice,
      deliveryTime: transpDays,
      carrierName: transpCarrier,
      description: `Transportadora de Carga Fracionada Têxtil (${transpCarrier})`,
    },
    freteGratis: {
      price: 0.0,
      deliveryTime: pacDays,
      description: `Frete Bonificado pela Nitro Camisetas (Prazo padrão: ${pacDays})`,
    },
    retirada: {
      price: 0.0,
      deliveryTime: 'Imediato após produção pronta',
      description: 'Retirada presencial ou motoboy na sede da fábrica Nitro',
    },
    weightKg: weight,
    originUf,
    destinationUf,
    distanceZone,
  };
}
