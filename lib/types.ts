export type ViewMode = 'manager' | 'seller';

export type UnitType = 'kg' | 'metro';

export interface Fabric {
  id: string;
  name: string;
  composition: string;
  pricePerUnit: number; // R$ por kg ou metro
  unitType: UnitType;
  yieldPerUnit: number; // Peças por kg ou por metro (ex: 3.2 peças/kg)
  wasteMarginPct: number; // Perda de corte (ex: 5%)
  notes?: string;
  // Cálculo e compra de Punho / Ribana / Gola
  hasPunho?: boolean; // Se o tecido/modelo utiliza punho ou ribana separada
  punhoPricePerUnit?: number; // Preço de compra do punho (R$ por kg ou metro)
  punhoYieldPerUnit?: number; // Rendimento do punho em peças por kg/metro (ex: 10 pçs/kg para moletom, 20 pçs/kg para gola)
  punhoWasteMarginPct?: number; // Margem de perda no corte do punho (ex: 6%)
  punhoUnitType?: UnitType; // 'kg' | 'metro'
  punhoNotes?: string; // Especificação do punho (ex: Ribana 2x1 com elastano, retilínea)
}

export interface SupplyItem {
  id: string;
  name: string;
  category: 'linha' | 'etiqueta' | 'embalagem' | 'ziper' | 'botao' | 'reforco';
  unitCost: number; // R$ por peça
  supplierId?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  phone: string;
  email?: string;
  category: 'Tecidos' | 'Aviamentos' | 'Estamparia' | 'Oficina' | 'Outros';
  leadTimeDays?: number;
  city?: string;
  notes?: string;
}

export interface SewingWorkshop {
  id: string;
  name: string;
  responsibleName: string;
  phone: string;
  city?: string;
  capacityPiecesPerMonth: number;
  costPerPieceTshirt: number;
  costPerPiecePolo: number;
  costPerPieceHoodie: number;
  costPerPiecePants: number;
  rating?: number;
  notes?: string;
}

export interface SewingComplexity {
  id: string;
  name: 'Simples (Básica)' | 'Média (Polo / Recortes)' | 'Alta (Jaqueta / Moletom / Calça)';
  baseCost: number; // R$ costura por peça
  multiplier: number;
}

// Estamparia: Silk Screen
export type SilkInkType = 'Hidrocryl (À Base de Água)' | 'Plastisol' | 'Corrosão / Discharge' | 'Metálico / Foil';

export interface SilkPosition {
  id: string;
  position: 'Frente (Peito Pequeno)' | 'Frente (Estampa Grande)' | 'Costas (Superior)' | 'Costas (Total)' | 'Manga Direita' | 'Manga Esquerda';
  colorsCount: number; // 1 a 6 cores
  inkType: SilkInkType;
  inkCostPerPiece: number; // Custo de tinta por cor por peça
}

export interface SilkScreenConfig {
  enabled: boolean;
  costPerScreen: number; // R$ por tela/fotolito (custo fixo diluído no lote)
  applicationLaborPerPass: number; // Mão de obra por passada de cor por peça
  positions: SilkPosition[];
}

// Estamparia: DTF (Direct to Film)
export interface DTFPosition {
  id: string;
  label: string; // Ex: "Logo Peito 10x10", "Costas A3 28x38"
  widthCm: number;
  heightCm: number;
  pressLaborCost: number; // R$ por prensagem da estampa
}

export interface DTFConfig {
  enabled: boolean;
  costPerSquareMeter: number; // R$ por m² de filme impresso
  wasteBufferPct: number; // Espaçamento entre artes no rolo (ex: 8%)
  positions: DTFPosition[];
}

// Estamparia: Sublimação
export type SublimationMode =
  | 'total' // Tecido + Impressão + Prensa + Corte
  | 'apenas_impressao' // Somente Impressão papel transfer
  | 'apenas_prensagem' // Somente Prensagem térmica
  | 'impressao_e_prensagem'; // Tecido + Impressão + Prensagem

export interface SublimationConfig {
  enabled: boolean;
  mode: SublimationMode;
  linearMeters: number; // Metragem impressa necessária
  paperAndInkCostPerMeter: number; // R$ por metro linear impresso
  pressOrCalenderCostPerMeter: number; // R$ por metro de calandra/prensa
  fabricCostIncluded: boolean;
}

// Estamparia: Filme de Recorte (Plotter)
export type WeedingComplexity = 'facil' | 'media' | 'alta';

export interface VinylConfig {
  enabled: boolean;
  vinylCostPerSqMeter: number; // R$ por m² do vinil
  widthCm: number;
  heightCm: number;
  complexity: WeedingComplexity;
  weedingMinutes: number; // Tempo de depilação
  operatorMinuteCost: number; // Custo por minuto da mão de obra
  pressCost: number; // Prensagem térmica
}

export interface PrintingEngine {
  silk: SilkScreenConfig;
  dtf: DTFConfig;
  sublimation: SublimationConfig;
  vinyl: VinylConfig;
}

export interface SizeGrid {
  // Adulto
  pp: number;
  p: number;
  m: number;
  g: number;
  gg: number;
  exg: number;
  g1: number; // Especial
  g2: number; // Especial
  // Infantil
  tam02: number;
  tam04: number;
  tam06: number;
  tam08: number;
  tam10: number;
  tam12: number;
  tam14: number;
  tam16: number;
}

export interface ProductTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  defaultFabricId: string;
  defaultSewingCost: number;
  defaultComplexity: 'Simples (Básica)' | 'Média (Polo / Recortes)' | 'Alta (Jaqueta / Moletom / Calça)';
  defaultThreadCost: number;
  defaultTagCost: number;
  defaultPackagingCost: number;
  defaultZipperCost?: number;
  defaultButtonCost?: number;
  imageUrl?: string;
}

export interface QuoteItem {
  id: string;
  productTemplateId: string;
  title: string;
  fabricId: string;
  fabricCostOverride?: number;
  sewingCost: number;
  sewingComplexity: 'Simples (Básica)' | 'Média (Polo / Recortes)' | 'Alta (Jaqueta / Moletom / Calça)';
  // Insumos
  threadCost: number;
  tagCost: number;
  packagingCost: number;
  zipperCost: number;
  buttonCost: number;
  // Logística rateada do item
  workshopLogisticsCost: number; // Entrega e retirada oficinas
  clientShippingCost: number; // Frete cliente
  // Estamparia
  printing: PrintingEngine;
  // Grade
  sizes: SizeGrid;
  // Acréscimo para tamanhos especiais (G1, G2)
  specialSizeSurchargePct: number; // Ex: 15% a mais de custo
  itemProfitMarginPct: number; // Margem específica deste item (ou herdada do orçamento)
  fitType?: string; // Tipo de Modelagem: Unissex (Padrão), Feminina, Babylook ou personalizada
  sleeveType?: string; // Tipo de Manga: Manga Curta (Padrão), Manga Longa, Regata ou personalizada
  color?: string; // Cor do modelo (ex: Preto, Branco, Azul Marinho, Pantone, etc.)
  notes?: string;
  approvedMockupUrl?: string; // Link URL da imagem do Mockup aprovado
  finalArtUrl?: string; // Link URL do arquivo de Arte Final para produção
  mockupImages?: string[]; // Fotos/referências legadas se houver
  mockupDesignFee?: number; // Cobrança de criação de arte ou mockup deste modelo (R$)
}

export type ShippingType =
  | 'correios_pac'
  | 'correios_sedex'
  | 'transportadora'
  | 'frete_gratis'
  | 'retirada';

export interface ShippingOption {
  type: ShippingType;
  name: string; // Ex: "Correios PAC", "Correios SEDEX", "Transportadora Jadlog", "Frete Grátis", "Retirada no Balcão"
  price: number; // R$ valor do frete
  deliveryTime: string; // Ex: "5 a 8 dias úteis"
  carrierName?: string; // Ex: "Correios", "Jadlog", "Braspress", etc.
  notes?: string;
  cepOrigem?: string; // Remetente / Origem (padrão: fábrica Nitro)
  cidadeUfOrigem?: string; // Ex: "São Paulo / SP"
  cepDestino?: string; // Destinatário / Destino
  cidadeUf?: string; // Ex: "Rio de Janeiro / RJ"
  pesoKg?: number; // Peso total em kg (calculado pelo total de peças ou editado)
  fretePorConta?: 'CIF' | 'FOB'; // CIF: Incluso no orçamento | FOB: A pagar no destino
}

export type ClientType = 'PF' | 'PJ';

export interface Seller {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  active: boolean;
  notes?: string;
  defaultCommissionPct?: number; // % padrão de comissão do vendedor (ex: 5%)
}

export interface DeliveryAddress {
  cep: string;
  street: string; // Logradouro / Rua
  number: string; // Número
  complement?: string; // Complemento
  neighborhood: string; // Bairro
  city: string; // Cidade
  state: string; // UF (ex: SP, RJ)
}

export interface Quote {
  id: string;
  quoteNumber: string;
  clientType?: ClientType; // 'PF' (Pessoa Física) ou 'PJ' (Pessoa Jurídica)
  clientDocument?: string; // CPF (se PF) ou CNPJ (se PJ)
  clientName: string;
  clientCompany?: string;
  clientPhone: string;
  clientEmail?: string;
  deliveryAddress?: DeliveryAddress; // Endereço completo de entrega separado
  sellerName: string;
  sellerCommissionPct?: number; // % de comissão do vendedor na proposta (ex: 5%)
  sellerCommissionFee?: number; // Valor em R$ fixo ou ajustado da comissão
  createdAt: string;
  validityDays: number;
  validityDate?: string; // Data específica de expiração calculada ou personalizada (YYYY-MM-DD)
  deliveryLeadTimeDays: number;
  deliveryLeadTimeCustom?: string; // Texto personalizado de prazo (ex: "10 a 15 dias úteis")
  paymentTerms: string;
  notes?: string;
  overallProfitMarginPct: number; // Padrão ex: 35%
  items: QuoteItem[];
  shipping?: ShippingOption;
  artCreationFee?: number; // Cobrança de criação de arte / mockup geral do pedido (R$)
  status: 'Rascunho' | 'Enviado' | 'Aprovado' | 'Cancelado';
  syncedToGoogleSheets?: boolean;
  clientMockups?: string[]; // Fotos/mockups gerais do pedido/orçamento
}

export interface CalculatedItemCost {
  totalQuantity: number;
  standardQuantity: number;
  specialQuantity: number; // G1 + G2
  fabricUnitCost: number;
  fabricBodyUnitCost?: number; // Custo do tecido principal por peça
  punhoUnitCost?: number; // Custo do punho/ribana por peça
  fabricTotalPurchaseKg?: number; // Total a comprar do tecido principal no lote
  punhoTotalPurchaseKg?: number; // Total a comprar de punho no lote
  fabricTotalPurchaseCost?: number; // Custo total da compra de tecido
  punhoTotalPurchaseCost?: number; // Custo total da compra de punho
  sewingUnitCost: number;
  suppliesUnitCost: number; // linha + tag + embalagem + ziper + botao
  logisticsUnitCost: number;
  // Estamparia
  silkTotalCost: number;
  silkUnitCost: number;
  dtfTotalCost: number;
  dtfUnitCost: number;
  sublimationTotalCost: number;
  sublimationUnitCost: number;
  vinylTotalCost: number;
  vinylUnitCost: number;
  printingTotalCost: number;
  printingUnitCost: number;
  // Totais
  totalProductionCost: number; // Custo de fabricação do lote
  unitProductionCost: number; // Custo médio por peça
  specialUnitProductionCost: number;
  mockupDesignFee: number; // Cobrança de criação de arte ou mockup deste modelo
  // Venda
  totalSellingPrice: number;
  unitSellingPrice: number;
  specialUnitSellingPrice: number;
  totalProfit: number;
  effectiveMarginPct: number;
}

export interface CalculatedQuoteTotals {
  totalQuantity: number;
  totalProductionCost: number;
  totalProductsSellingPrice: number;
  artCreationCost: number; // Total de taxas de criação de arte/mockup
  shippingCost: number;
  totalSellingPrice: number;
  totalProfit: number;
  averageMarginPct: number;
  sellerCommissionPct: number; // % comissão
  sellerCommissionFee: number; // Valor R$ pago ao vendedor
  netProfitAfterCommission: number; // Lucro líquido real da fábrica pós-comissão
  effectiveMarginAfterCommissionPct: number; // Margem líquida real pós-comissão
  itemsCalculated: Record<string, CalculatedItemCost>;
}

export interface GoogleSheetsConfig {
  webhookUrl: string;
  sheetId?: string;
  autoSyncOnApprove: boolean;
  lastSyncTimestamp?: string;
}

export interface OrderParentPayload {
  id: string;
  timestamp: string;
  quoteNumber: string;
  status: string;
  cliente: {
    tipo: ClientType;
    nome: string;
    empresa: string;
    cpfCnpj: string;
    telefone: string;
    email: string;
  };
  entrega: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    uf: string;
    cidadeUf: string;
    enderecoCompleto: string;
  };
  logistica: {
    modalidade: string;
    tipo: ShippingType;
    transportadora: string;
    valorFrete: number;
    cidadeUfDestino: string;
    cepDestino: string;
    prazoEntrega: string;
    fretePorConta: 'CIF' | 'FOB';
  };
  financeiro: {
    totalPecas: number;
    custoTotalProducao: number;
    margemLucroPct: number;
    taxaArte: number;
    valorProdutos: number;
    valorTotalVenda: number;
    lucroLiquido: number;
    vendedor: string;
    comissaoPct: number;
    comissaoValor: number;
    lucroPosComissao: number;
  };
  comercial: {
    prazoProducaoDias: number;
    prazoProducaoTexto: string;
    condicoesPagamento: string;
    observacoes: string;
    resumoItens: string;
    gradeTamanhosResumo?: string;
  };
}

export interface OrderItemChildPayload {
  id: string;
  orderId: string;
  quoteNumber: string;
  ordemItem: number;
  produto: string;
  produtoId: string;
  tecido: string;
  tecidoId: string;
  composicaoTecido: string;
  corMalha: string;
  modelagem: string;
  tipoManga: string;
  gradeTamanhos: {
    pp: number;
    p: number;
    m: number;
    g: number;
    gg: number;
    exg: number;
    g1: number;
    g2: number;
    infantil: {
      tam02: number;
      tam04: number;
      tam06: number;
      tam08: number;
      tam10: number;
      tam12: number;
      tam14: number;
      tam16: number;
    };
    infantilResumo: string;
    totalPecas: number;
  };
  estamparia: {
    tecnicasAtivas: string[];
    tecnicasResumo: string;
    posicoes: string[];
    posicoesResumo: string;
    detalhesTecnicos: PrintingEngine;
  };
  arquivosVisuais: {
    linkMockupAprovado: string;
    linkArteFinal: string;
  };
  valores: {
    custoUnitario: number;
    precoVendaUnitario: number;
    totalVendaItem: number;
  };
  observacoesTecnicas: string;
}

export interface StructuredOrderPayload {
  action: 'save_order';
  pedido: OrderParentPayload;
  itens: OrderItemChildPayload[];
  // Chaves planas explícitas para compatibilidade imediata com scripts v2.0
  id?: string;
  timestamp?: string;
  quoteNumber?: string;
  status?: string;
  clientName?: string;
  clientCompany?: string;
  clientDocument?: string;
  clientPhone?: string;
  clientEmail?: string;
  deliveryAddressFull?: string;
  totalQuantity?: number;
  itemsSummary?: string;
  sizeGridSummary?: string;
  totalProductionCost?: number;
  marginPct?: number;
  shippingMethod?: string;
  shippingCost?: number;
  shippingDestination?: string;
  totalSellingPrice?: number;
  totalProfit?: number;
  deliveryLeadTimeDays?: number;
  paymentTerms?: string;
  sellerName?: string;
  sellerCommissionPct?: number;
  sellerCommissionFee?: number;
  netProfitAfterCommission?: number;
}
