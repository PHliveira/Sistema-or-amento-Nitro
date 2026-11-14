import {
  CalculatedQuoteTotals,
  Fabric,
  GoogleSheetsConfig,
  OrderItemChildPayload,
  OrderParentPayload,
  ProductTemplate,
  Quote,
  QuoteItem,
  SewingWorkshop,
  SizeGrid,
  StructuredOrderPayload,
  Supplier,
  SupplyItem,
  Seller,
} from './types';
import {
  DEFAULT_FABRICS,
  DEFAULT_PRODUCT_TEMPLATES,
  DEFAULT_SUPPLIERS,
  DEFAULT_SUPPLIES,
  DEFAULT_WORKSHOPS,
  DEFAULT_SELLERS,
} from './default-data';

export const PERMANENT_GOOGLE_SHEETS_WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycbz1LeE5hwyKob5_Q-jveqh47hOqei0Ei6JalXJ4KB7Gb-TaAWaZTbvyUxamDRiGGFgc/exec';

export const GOOGLE_SHEETS_SCHEMA = {
  spreadsheetTitle: 'Historico_Pedidos_sistema_Nitrocamisetas',
  tabs: [
    {
      name: 'Historico_Pedidos',
      description: 'Aba Pai: Armazena os dados gerais, fiscais, endereço completo de entrega, logística e totais financeiros de cada pedido (mapeado por nome de cabeçalho).',
      columns: [
        'ID_Pedido',
        'Data_Hora',
        'Numero_Orcamento',
        'Cliente_Nome',
        'Cliente_Empresa',
        'CPF_CNPJ',
        'Telefone',
        'Email',
        'CEP_Entrega',
        'Logradouro_Entrega',
        'Numero_Entrega',
        'Complemento_Entrega',
        'Bairro_Entrega',
        'Cidade_UF_Entrega',
        'Endereco_Completo',
        'Total_Pecas',
        'Resumo_Itens',
        'Grade_Tamanhos',
        'Custo_Total_Producao_R$',
        'Margem_Lucro_Pct',
        'Forma_Envio',
        'Valor_Frete_R$',
        'Destino_Envio',
        'Valor_Total_Venda_R$',
        'Lucro_Liquido_R$',
        'Prazo_Dias',
        'Condicoes_Pagamento',
        'Status',
        'Vendedor',
        'Comissao_Vendedor_Pct',
        'Comissao_Vendedor_R$',
        'Lucro_Liquido_Pos_Comissao_R$',
      ],
    },
    {
      name: 'Itens_Pedido',
      description: 'Aba Filha (Relacional via ID_Pedido): Registra cada modelo do pedido com cor, grade detalhada por tamanho (Adulto PP-G2 e Infantil 02-16), estamparia, posições e links de mockup/arte final.',
      columns: [
        'ID_Pedido',
        'ID_Item',
        'Numero_Orcamento',
        'Ordem_Item',
        'Produto',
        'Tecido',
        'Composicao_Tecido',
        'Cor_Malha',
        'Modelagem',
        'Tipo_Manga',
        'Tecnicas_Estamparia',
        'Posicoes_Estampa',
        'Link_Mockup_Aprovado',
        'Link_Arte_Final',
        'PP',
        'P',
        'M',
        'G',
        'GG',
        'EXG',
        'G1',
        'G2',
        'Tam_02',
        'Tam_04',
        'Tam_06',
        'Tam_08',
        'Tam_10',
        'Tam_12',
        'Tam_14',
        'Tam_16',
        'Infantil_02_16',
        'Total_Pecas_Item',
        'Custo_Unitario_R$',
        'Preco_Venda_Unit_R$',
        'Total_Venda_Item_R$',
        'Observacoes_Tecnicas',
      ],
    },
    {
      name: 'Produtos',
      description: 'Catálogo base de modelos de produtos, tecidos padrão, custos de costura e aviamentos.',
      columns: [
        'ID',
        'Nome_Produto',
        'Categoria',
        'Descricao',
        'ID_Tecido_Padrao',
        'Custo_Costura_R$',
        'Complexidade',
        'Custo_Linha_R$',
        'Custo_Etiqueta_R$',
        'Custo_Embalagem_R$',
        'Custo_Ziper_R$',
        'Custo_Botao_R$',
        'Atualizado_Em',
      ],
    },
    {
      name: 'Tecidos',
      description: 'Tabela base de custos de tecidos, cálculo para compra de punho/ribana e margem de perda no corte.',
      columns: [
        'ID',
        'Nome_Tecido',
        'Composicao',
        'Preco_Por_Unidade_R$',
        'Tipo_Medida',
        'Rendimento_Pecas',
        'Perda_Corte_Pct',
        'Usa_Punho',
        'Preco_Punho_R$',
        'Rendimento_Punho_Pecas',
        'Perda_Punho_Pct',
        'Tipo_Medida_Punho',
        'Notas_Punho',
        'Observacoes',
        'Atualizado_Em',
      ],
    },
    {
      name: 'Insumos_MaoDeObra',
      description: 'Custos unitários por peça para costura, aviamentos e logística.',
      columns: ['ID', 'Item', 'Categoria', 'Custo_Unitario_R$', 'Notas', 'Atualizado_Em'],
    },
    {
      name: 'Parametros_Estamparia',
      description: 'Parâmetros matemáticos para Silk Screen, DTF, Sublimação e Vinil.',
      columns: ['Tecnica', 'Parametro', 'Valor_R$', 'Unidade_Medida', 'Descricao'],
    },
    {
      name: 'Fornecedores',
      description: 'Cadastro de fornecedores de tecidos, aviamentos e serviços.',
      columns: ['ID', 'Nome_Empresa', 'Contato', 'Telefone', 'Email', 'Categoria', 'Prazo_Dias', 'Cidade_UF', 'Notas', 'Atualizado_Em'],
    },
    {
      name: 'Oficinas',
      description: 'Cadastro de oficinas de corte, costura e facções parceiras.',
      columns: ['ID', 'Nome_Oficina', 'Responsavel', 'Telefone', 'Cidade_UF', 'Capacidade_Mensal', 'Custo_Camiseta_R$', 'Custo_Polo_R$', 'Custo_Moletom_R$', 'Custo_Calca_R$', 'Notas', 'Atualizado_Em'],
    },
  ],
};

export const GOOGLE_APPS_SCRIPT_TEMPLATE = `/**
 * NITRO CAMISETAS E UNIFORMES - GOOGLE APPS SCRIPT WEB APP (v3.1)
 * Banco de Dados Relacional (Pai & Filho) + Cadastros Base com Mapeamento 100% por Cabeçalho:
 * - Historico_Pedidos (Pai - 31 colunas mapeadas por nome na Linha 1)
 * - Itens_Pedido (Filho - 28 colunas vinculadas via ID_Pedido)
 * - Produtos (13 colunas)
 * - Tecidos (15 colunas incluindo Punho/Ribana)
 * - Insumos_MaoDeObra (6 colunas - compatível com aba legada Insumos)
 * - Parametros_Estamparia (5 colunas)
 * - Fornecedores (10 colunas)
 * - Oficinas (12 colunas)
 *
 * INSTRUÇÕES DE INSTALAÇÃO / ATUALIZAÇÃO:
 * 1. Abra a planilha "Historico_Pedidos_sistema_Nitrocamisetas" no Google Sheets.
 * 2. Clique em: Extensões > Apps Script.
 * 3. Substitua todo o código de Code.gs por este script v3.1.
 * 4. Clique em "Implantar" > "Gerenciar implantações" > Editar (lápis) > Versão: "Nova versão" > "Implantar".
 *    (Ou "Implantar" > "Nova implantação" > Aplicativo da Web > Executar como: Eu > Quem pode acessar: Qualquer pessoa).
 */

var SCHEMA_HEADERS = {
  Historico_Pedidos: [
    'ID_Pedido', 'Data_Hora', 'Numero_Orcamento', 'Cliente_Nome',
    'Cliente_Empresa', 'CPF_CNPJ', 'Telefone', 'Email',
    'CEP_Entrega', 'Logradouro_Entrega', 'Numero_Entrega', 'Complemento_Entrega',
    'Bairro_Entrega', 'Cidade_UF_Entrega', 'Endereco_Completo',
    'Total_Pecas', 'Resumo_Itens', 'Grade_Tamanhos', 'Custo_Total_Producao_R$', 'Margem_Lucro_Pct',
    'Forma_Envio', 'Valor_Frete_R$', 'Destino_Envio',
    'Valor_Total_Venda_R$', 'Lucro_Liquido_R$', 'Prazo_Dias',
    'Condicoes_Pagamento', 'Status', 'Vendedor',
    'Comissao_Vendedor_Pct', 'Comissao_Vendedor_R$', 'Lucro_Liquido_Pos_Comissao_R$'
  ],
  Itens_Pedido: [
    'ID_Pedido', 'ID_Item', 'Numero_Orcamento', 'Ordem_Item',
    'Produto', 'Tecido', 'Composicao_Tecido', 'Cor_Malha',
    'Modelagem', 'Tipo_Manga', 'Tecnicas_Estamparia', 'Posicoes_Estampa',
    'Link_Mockup_Aprovado', 'Link_Arte_Final',
    'PP', 'P', 'M', 'G', 'GG', 'EXG', 'G1', 'G2',
    'Tam_02', 'Tam_04', 'Tam_06', 'Tam_08', 'Tam_10', 'Tam_12', 'Tam_14', 'Tam_16',
    'Infantil_02_16',
    'Total_Pecas_Item', 'Custo_Unitario_R$', 'Preco_Venda_Unit_R$',
    'Total_Venda_Item_R$', 'Observacoes_Tecnicas'
  ],
  Produtos: [
    'ID', 'Nome_Produto', 'Categoria', 'Descricao', 'ID_Tecido_Padrao',
    'Custo_Costura_R$', 'Complexidade', 'Custo_Linha_R$', 'Custo_Etiqueta_R$',
    'Custo_Embalagem_R$', 'Custo_Ziper_R$', 'Custo_Botao_R$', 'Atualizado_Em'
  ],
  Tecidos: [
    'ID', 'Nome_Tecido', 'Composicao', 'Preco_Por_Unidade_R$', 'Tipo_Medida',
    'Rendimento_Pecas', 'Perda_Corte_Pct', 'Usa_Punho', 'Preco_Punho_R$',
    'Rendimento_Punho_Pecas', 'Perda_Punho_Pct', 'Tipo_Medida_Punho', 'Notas_Punho',
    'Observacoes', 'Atualizado_Em'
  ],
  Insumos_MaoDeObra: [
    'ID', 'Item', 'Categoria', 'Custo_Unitario_R$', 'Notas', 'Atualizado_Em'
  ],
  Parametros_Estamparia: [
    'Tecnica', 'Parametro', 'Valor_R$', 'Unidade_Medida', 'Descricao'
  ],
  Fornecedores: [
    'ID', 'Nome_Empresa', 'Contato', 'Telefone', 'Email',
    'Categoria', 'Prazo_Dias', 'Cidade_UF', 'Notas', 'Atualizado_Em'
  ],
  Oficinas: [
    'ID', 'Nome_Oficina', 'Responsavel', 'Telefone', 'Cidade_UF',
    'Capacidade_Mensal', 'Custo_Camiseta_R$', 'Custo_Polo_R$', 'Custo_Moletom_R$',
    'Custo_Calca_R$', 'Notas', 'Atualizado_Em'
  ]
};

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var result = {
      status: 'online',
      version: 'v3.1',
      system: 'Nitro Camisetas & Uniformes Database Webhook (v3.1)',
      timestamp: new Date().toISOString(),
      produtos: [],
      fornecedores: [],
      oficinas: [],
      insumos: [],
      tecidos: [],
      estamparia: [],
      tabsSummary: []
    };

    var tabNames = Object.keys(SCHEMA_HEADERS);
    for (var tIdx = 0; tIdx < tabNames.length; tIdx++) {
      var tName = tabNames[tIdx];
      var sh = ss.getSheetByName(tName);
      var headers = [];
      var rowCount = 0;
      if (sh && sh.getLastRow() >= 1 && sh.getLastColumn() >= 1) {
        headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(function(h) { return String(h || '').trim(); });
        rowCount = Math.max(0, sh.getLastRow() - 1);
      }
      result.tabsSummary.push({ name: tName, exists: !!sh, rowCount: rowCount, columnsCount: headers.length });
    }

    // 1. Aba Produtos (leitura por cabeçalho)
    var prodRows = readSheetAsObjects(ss.getSheetByName('Produtos'));
    for (var p = 0; p < prodRows.length; p++) {
      var rp = prodRows[p];
      if (rp['id'] || rp['nome_produto']) {
        result.produtos.push({
          id: String(rp['id'] || 'prod-' + (p + 1)),
          name: String(rp['nome_produto'] || ''),
          category: String(rp['categoria'] || 'Camisetas'),
          description: String(rp['descricao'] || ''),
          defaultFabricId: String(rp['id_tecido_padrao'] || ''),
          defaultSewingCost: Number(rp['custo_costura_r$']) || 0,
          defaultComplexity: String(rp['complexidade'] || 'Simples (Básica)'),
          defaultThreadCost: Number(rp['custo_linha_r$']) || 0,
          defaultTagCost: Number(rp['custo_etiqueta_r$']) || 0,
          defaultPackagingCost: Number(rp['custo_embalagem_r$']) || 0,
          defaultZipperCost: Number(rp['custo_ziper_r$']) || 0,
          defaultButtonCost: Number(rp['custo_botao_r$']) || 0
        });
      }
    }

    // 2. Aba Fornecedores (leitura por cabeçalho)
    var fornRows = readSheetAsObjects(ss.getSheetByName('Fornecedores'));
    for (var f = 0; f < fornRows.length; f++) {
      var rf = fornRows[f];
      if (rf['id'] || rf['nome_empresa']) {
        result.fornecedores.push({
          id: String(rf['id'] || 'forn-' + (f + 1)),
          name: String(rf['nome_empresa'] || ''),
          contactName: String(rf['contato'] || ''),
          phone: String(rf['telefone'] || ''),
          email: String(rf['email'] || ''),
          category: String(rf['categoria'] || 'Tecidos'),
          leadTimeDays: Number(rf['prazo_dias']) || 7,
          city: String(rf['cidade_uf'] || ''),
          notes: String(rf['notas'] || '')
        });
      }
    }

    // 3. Aba Oficinas (suporta Custo_Camiseta_R$ e legado Custo_Camiseta)
    var oficRows = readSheetAsObjects(ss.getSheetByName('Oficinas'));
    for (var o = 0; o < oficRows.length; o++) {
      var ro = oficRows[o];
      if (ro['id'] || ro['nome_oficina']) {
        result.oficinas.push({
          id: String(ro['id'] || 'ws-' + (o + 1)),
          name: String(ro['nome_oficina'] || ''),
          responsibleName: String(ro['responsavel'] || ''),
          phone: String(ro['telefone'] || ''),
          city: String(ro['cidade_uf'] || ''),
          capacityPiecesPerMonth: Number(ro['capacidade_mensal']) || 3000,
          costPerPieceTshirt: Number(ro['custo_camiseta_r$'] !== undefined ? ro['custo_camiseta_r$'] : ro['custo_camiseta']) || 5.5,
          costPerPiecePolo: Number(ro['custo_polo_r$'] !== undefined ? ro['custo_polo_r$'] : ro['custo_polo']) || 9.8,
          costPerPieceHoodie: Number(ro['custo_moletom_r$'] !== undefined ? ro['custo_moletom_r$'] : ro['custo_moletom']) || 16.0,
          costPerPiecePants: Number(ro['custo_calca_r$'] !== undefined ? ro['custo_calca_r$'] : ro['custo_calca']) || 14.5,
          notes: String(ro['notas'] || '')
        });
      }
    }

    // 4. Aba Insumos_MaoDeObra (com fallback para aba legada Insumos)
    var insRows = readSheetAsObjects(ss.getSheetByName('Insumos_MaoDeObra') || ss.getSheetByName('Insumos'));
    for (var i = 0; i < insRows.length; i++) {
      var ri = insRows[i];
      if (ri['id'] || ri['item']) {
        result.insumos.push({
          id: String(ri['id'] || 'insumo-' + (i + 1)),
          name: String(ri['item'] || ''),
          category: String(ri['categoria'] || 'linha').toLowerCase(),
          unitCost: Number(ri['custo_unitario_r$']) || 0,
          notes: String(ri['notas'] || '')
        });
      }
    }

    // 5. Aba Tecidos (leitura por cabeçalho incluindo parâmetros de punho/ribana)
    var tecRows = readSheetAsObjects(ss.getSheetByName('Tecidos'));
    for (var t = 0; t < tecRows.length; t++) {
      var rt = tecRows[t];
      if (rt['id'] || rt['nome_tecido']) {
        var usaPunhoRaw = String(rt['usa_punho'] || '').toUpperCase();
        var hasPunho = usaPunhoRaw === 'SIM' || usaPunhoRaw === 'TRUE' || rt['usa_punho'] === true;
        result.tecidos.push({
          id: String(rt['id'] || 'fab-' + (t + 1)),
          name: String(rt['nome_tecido'] || ''),
          composition: String(rt['composicao'] || ''),
          pricePerUnit: Number(rt['preco_por_unidade_r$']) || 0,
          unitType: String(rt['tipo_medida'] || 'kg').toLowerCase(),
          yieldPerUnit: Number(rt['rendimento_pecas']) || 3.2,
          wasteMarginPct: Number(rt['perda_corte_pct']) || 5.0,
          hasPunho: hasPunho,
          punhoPricePerUnit: Number(rt['preco_punho_r$']) || 0,
          punhoYieldPerUnit: Number(rt['rendimento_punho_pecas']) || 0,
          punhoWasteMarginPct: Number(rt['perda_punho_pct']) || 0,
          punhoUnitType: String(rt['tipo_medida_punho'] || 'kg').toLowerCase(),
          punhoNotes: String(rt['notas_punho'] || ''),
          notes: String(rt['observacoes'] || '')
        });
      }
    }

    // 6. Aba Parametros_Estamparia
    var estRows = readSheetAsObjects(ss.getSheetByName('Parametros_Estamparia'));
    for (var k = 0; k < estRows.length; k++) {
      var re = estRows[k];
      if (re['tecnica'] || re['parametro']) {
        result.estamparia.push({
          tecnica: String(re['tecnica'] || ''),
          parametro: String(re['parametro'] || ''),
          valor: Number(re['valor_r$']) || 0,
          unidade: String(re['unidade_medida'] || ''),
          descricao: String(re['descricao'] || '')
        });
      }
    }

    return responseJSON(result);

  } catch(err) {
    return responseJSON({ status: 'error', message: err.toString() });
  }
}

function doPost(e) {
  try {
    var raw = e.postData.contents;
    var payload = JSON.parse(raw);
    var action = payload.action || 'save_order';
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var now = new Date().toISOString();

    // 0. Teste de Conexão e Versão
    if (action === 'ping_test') {
      return responseJSON({
        status: 'success',
        version: 'v3.1',
        message: 'Webhook v3.1 ativo com gravação relacional Pai-Filho e mapeamento 100% por cabeçalho!'
      });
    }

    // 0.1 Recriar/Padronizar todas as 8 abas v3.0 preservando dados existentes
    if (action === 'rebuild_schema_v3') {
      var tabNames = Object.keys(SCHEMA_HEADERS);
      var migrated = [];
      for (var tIdx = 0; tIdx < tabNames.length; tIdx++) {
        var tabName = tabNames[tIdx];
        var sh = getOrCreateSheet(ss, tabName, SCHEMA_HEADERS[tabName]);
        alignSheetColumnsToSchema(sh, SCHEMA_HEADERS[tabName]);
        migrated.push(tabName);
      }
      if (payload.catalogs) {
        syncCatalogBundle(ss, payload.catalogs, now);
      }
      return responseJSON({
        status: 'success',
        version: 'v3.1',
        message: 'Todas as ' + migrated.length + ' abas foram padronizadas no formato v3.1 sem perda de dados!'
      });
    }

    // 0.2 Sincronizar lote completo de cadastros
    if (action === 'sync_all_catalogs') {
      var stats = syncCatalogBundle(ss, payload.catalogs || payload, now);
      return responseJSON({
        status: 'success',
        version: 'v3.1',
        message: 'Cadastros sincronizados com sucesso: ' + stats.total + ' registros atualizados!'
      });
    }

    // 1. Gravar Pedido / Orçamento (Estrutura Relacional Pai + Filho com Mapeamento por Cabeçalho)
    if (action === 'save_order') {
      var sheetPedidos = getOrCreateSheet(ss, 'Historico_Pedidos', SCHEMA_HEADERS.Historico_Pedidos);
      var sheetItens = getOrCreateSheet(ss, 'Itens_Pedido', SCHEMA_HEADERS.Itens_Pedido);

      var ped = payload.pedido || {};
      var cli = ped.cliente || {};
      var ent = ped.entrega || {};
      var log = ped.logistica || {};
      var fin = ped.financeiro || {};
      var com = ped.comercial || {};

      var orderId = ped.id || payload.id || Utilities.getUuid();
      var quoteNum = ped.quoteNumber || payload.quoteNumber || '';

      var pedidoMap = {
        'ID_Pedido': orderId,
        'Data_Hora': ped.timestamp || payload.timestamp || now,
        'Numero_Orcamento': quoteNum,
        'Cliente_Nome': cli.nome !== undefined ? cli.nome : (payload.clientName || ''),
        'Cliente_Empresa': cli.empresa !== undefined ? cli.empresa : (payload.clientCompany || ''),
        'CPF_CNPJ': cli.cpfCnpj !== undefined ? cli.cpfCnpj : (payload.clientDocument || ''),
        'Telefone': cli.telefone !== undefined ? cli.telefone : (payload.clientPhone || ''),
        'Email': cli.email !== undefined ? cli.email : (payload.clientEmail || ''),
        'CEP_Entrega': ent.cep || '',
        'Logradouro_Entrega': ent.logradouro || '',
        'Numero_Entrega': ent.numero || '',
        'Complemento_Entrega': ent.complemento || '',
        'Bairro_Entrega': ent.bairro || '',
        'Cidade_UF_Entrega': ent.cidadeUf || '',
        'Endereco_Completo': ent.enderecoCompleto || payload.deliveryAddressFull || '',
        'Total_Pecas': Number(fin.totalPecas !== undefined ? fin.totalPecas : payload.totalQuantity) || 0,
        'Resumo_Itens': com.resumoItens !== undefined ? com.resumoItens : (payload.itemsSummary || ''),
        'Grade_Tamanhos': com.gradeTamanhosResumo !== undefined ? com.gradeTamanhosResumo : (payload.sizeGridSummary || ''),
        'Custo_Total_Producao_R$': Number(fin.custoTotalProducao !== undefined ? fin.custoTotalProducao : payload.totalProductionCost) || 0,
        'Margem_Lucro_Pct': Number(fin.margemLucroPct !== undefined ? fin.margemLucroPct : payload.marginPct) || 0,
        'Forma_Envio': log.modalidade !== undefined ? log.modalidade : (payload.shippingMethod || ''),
        'Valor_Frete_R$': Number(log.valorFrete !== undefined ? log.valorFrete : payload.shippingCost) || 0,
        'Destino_Envio': log.cidadeUfDestino !== undefined ? log.cidadeUfDestino : (payload.shippingDestination || ''),
        'Valor_Total_Venda_R$': Number(fin.valorTotalVenda !== undefined ? fin.valorTotalVenda : payload.totalSellingPrice) || 0,
        'Lucro_Liquido_R$': Number(fin.lucroLiquido !== undefined ? fin.lucroLiquido : payload.totalProfit) || 0,
        'Prazo_Dias': Number(com.prazoProducaoDias !== undefined ? com.prazoProducaoDias : payload.deliveryLeadTimeDays) || 15,
        'Condicoes_Pagamento': com.condicoesPagamento !== undefined ? com.condicoesPagamento : (payload.paymentTerms || ''),
        'Status': ped.status || payload.status || 'Aprovado',
        'Vendedor': fin.vendedor !== undefined ? fin.vendedor : (payload.sellerName || 'Nitro Comercial'),
        'Comissao_Vendedor_Pct': Number(fin.comissaoPct !== undefined ? fin.comissaoPct : payload.sellerCommissionPct) || 0,
        'Comissao_Vendedor_R$': Number(fin.comissaoValor !== undefined ? fin.comissaoValor : payload.sellerCommissionFee) || 0,
        'Lucro_Liquido_Pos_Comissao_R$': Number(fin.lucroPosComissao !== undefined ? fin.lucroPosComissao : payload.netProfitAfterCommission) || 0
      };

      appendRowByHeaderMap(sheetPedidos, SCHEMA_HEADERS.Historico_Pedidos, pedidoMap);

      var itensList = Array.isArray(payload.itens) ? payload.itens : [];
      for (var idx = 0; idx < itensList.length; idx++) {
        var it = itensList[idx];
        var grade = it.gradeTamanhos || {};
        var inf = grade.infantil || {};
        var est = it.estamparia || {};
        var arq = it.arquivosVisuais || {};
        var val = it.valores || {};

        var itemMap = {
          'ID_Pedido': orderId,
          'ID_Item': it.id || ('item-' + (idx + 1)),
          'Numero_Orcamento': it.quoteNumber || quoteNum,
          'Ordem_Item': Number(it.ordemItem) || (idx + 1),
          'Produto': it.produto || '',
          'Tecido': it.tecido || '',
          'Composicao_Tecido': it.composicaoTecido || '',
          'Cor_Malha': it.corMalha || '',
          'Modelagem': it.modelagem || 'Unissex',
          'Tipo_Manga': it.tipoManga || 'Manga Curta',
          'Tecnicas_Estamparia': est.tecnicasResumo || '',
          'Posicoes_Estampa': est.posicoesResumo || '',
          'Link_Mockup_Aprovado': arq.linkMockupAprovado || '',
          'Link_Arte_Final': arq.linkArteFinal || '',
          'PP': Number(grade.pp) || 0,
          'P': Number(grade.p) || 0,
          'M': Number(grade.m) || 0,
          'G': Number(grade.g) || 0,
          'GG': Number(grade.gg) || 0,
          'EXG': Number(grade.exg) || 0,
          'G1': Number(grade.g1) || 0,
          'G2': Number(grade.g2) || 0,
          'Tam_02': Number(inf.tam02) || 0,
          'Tam_04': Number(inf.tam04) || 0,
          'Tam_06': Number(inf.tam06) || 0,
          'Tam_08': Number(inf.tam08) || 0,
          'Tam_10': Number(inf.tam10) || 0,
          'Tam_12': Number(inf.tam12) || 0,
          'Tam_14': Number(inf.tam14) || 0,
          'Tam_16': Number(inf.tam16) || 0,
          'Infantil_02_16': grade.infantilResumo || '',
          'Total_Pecas_Item': Number(grade.totalPecas) || 0,
          'Custo_Unitario_R$': Number(val.custoUnitario) || 0,
          'Preco_Venda_Unit_R$': Number(val.precoVendaUnitario) || 0,
          'Total_Venda_Item_R$': Number(val.totalVendaItem) || 0,
          'Observacoes_Tecnicas': it.observacoesTecnicas || ''
        };

        appendRowByHeaderMap(sheetItens, SCHEMA_HEADERS.Itens_Pedido, itemMap);
      }

      return responseJSON({
        status: 'success',
        version: 'v3.1',
        message: 'Pedido gravado em Historico_Pedidos + ' + itensList.length + ' item(ns) na aba Itens_Pedido (v3.1)!'
      });
    }

    // 2. Produtos (Upsert por cabeçalho)
    if (action === 'save_product') {
      var sheetProd = getOrCreateSheet(ss, 'Produtos', SCHEMA_HEADERS.Produtos);
      var p = payload.item || payload;
      var prodId = p.id || 'prod-' + Utilities.getUuid().slice(0, 8);
      var resProd = upsertRowByHeaderMap(sheetProd, SCHEMA_HEADERS.Produtos, 'ID', prodId, {
        'ID': prodId,
        'Nome_Produto': p.name || '',
        'Categoria': p.category || 'Camisetas',
        'Descricao': p.description || '',
        'ID_Tecido_Padrao': p.defaultFabricId || '',
        'Custo_Costura_R$': Number(p.defaultSewingCost) || 0,
        'Complexidade': p.defaultComplexity || 'Simples (Básica)',
        'Custo_Linha_R$': Number(p.defaultThreadCost) || 0,
        'Custo_Etiqueta_R$': Number(p.defaultTagCost) || 0,
        'Custo_Embalagem_R$': Number(p.defaultPackagingCost) || 0,
        'Custo_Ziper_R$': Number(p.defaultZipperCost) || 0,
        'Custo_Botao_R$': Number(p.defaultButtonCost) || 0,
        'Atualizado_Em': now
      });
      return responseJSON({ status: 'success', version: 'v3.1', message: 'Produto gravado com sucesso na aba Produtos!', result: resProd });
    }

    if (action === 'delete_product') {
      var sheetProdDel = ss.getSheetByName('Produtos');
      if (sheetProdDel) deleteRowById(sheetProdDel, payload.id);
      return responseJSON({ status: 'success', version: 'v3.1', message: 'Produto excluído da aba Produtos!' });
    }

    // 3. Fornecedores (Upsert por cabeçalho)
    if (action === 'save_supplier') {
      var sheetForn = getOrCreateSheet(ss, 'Fornecedores', SCHEMA_HEADERS.Fornecedores);
      var s = payload.item || payload;
      var supId = s.id || 'sup-' + Utilities.getUuid().slice(0, 8);
      var resForn = upsertRowByHeaderMap(sheetForn, SCHEMA_HEADERS.Fornecedores, 'ID', supId, {
        'ID': supId,
        'Nome_Empresa': s.name || '',
        'Contato': s.contactName || '',
        'Telefone': s.phone || '',
        'Email': s.email || '',
        'Categoria': s.category || 'Tecidos',
        'Prazo_Dias': Number(s.leadTimeDays) || 7,
        'Cidade_UF': s.city || '',
        'Notas': s.notes || '',
        'Atualizado_Em': now
      });
      return responseJSON({ status: 'success', version: 'v3.1', message: 'Fornecedor gravado com sucesso na aba Fornecedores!', result: resForn });
    }

    if (action === 'delete_supplier') {
      var sheetFornDel = ss.getSheetByName('Fornecedores');
      if (sheetFornDel) deleteRowById(sheetFornDel, payload.id);
      return responseJSON({ status: 'success', version: 'v3.1', message: 'Fornecedor excluído da aba Fornecedores!' });
    }

    // 4. Oficinas (Upsert por cabeçalho)
    if (action === 'save_workshop') {
      var sheetOfic = getOrCreateSheet(ss, 'Oficinas', SCHEMA_HEADERS.Oficinas);
      var w = payload.item || payload;
      var wsId = w.id || 'ws-' + Utilities.getUuid().slice(0, 8);
      var resOfic = upsertRowByHeaderMap(sheetOfic, SCHEMA_HEADERS.Oficinas, 'ID', wsId, {
        'ID': wsId,
        'Nome_Oficina': w.name || '',
        'Responsavel': w.responsibleName || '',
        'Telefone': w.phone || '',
        'Cidade_UF': w.city || '',
        'Capacidade_Mensal': Number(w.capacityPiecesPerMonth) || 3000,
        'Custo_Camiseta_R$': Number(w.costPerPieceTshirt) || 5.5,
        'Custo_Polo_R$': Number(w.costPerPiecePolo) || 9.8,
        'Custo_Moletom_R$': Number(w.costPerPieceHoodie) || 16.0,
        'Custo_Calca_R$': Number(w.costPerPiecePants) || 14.5,
        'Notas': w.notes || '',
        'Atualizado_Em': now
      });
      return responseJSON({ status: 'success', version: 'v3.1', message: 'Oficina gravada com sucesso na aba Oficinas!', result: resOfic });
    }

    if (action === 'delete_workshop') {
      var sheetOficDel = ss.getSheetByName('Oficinas');
      if (sheetOficDel) deleteRowById(sheetOficDel, payload.id);
      return responseJSON({ status: 'success', version: 'v3.1', message: 'Oficina excluída da aba Oficinas!' });
    }

    // 5. Insumos_MaoDeObra (Upsert por cabeçalho na aba canônica)
    if (action === 'save_supply') {
      var sheetIns = getOrCreateSheet(ss, 'Insumos_MaoDeObra', SCHEMA_HEADERS.Insumos_MaoDeObra);
      var itemSup = payload.item || payload;
      var insId = itemSup.id || 'sup-item-' + Utilities.getUuid().slice(0, 8);
      var resIns = upsertRowByHeaderMap(sheetIns, SCHEMA_HEADERS.Insumos_MaoDeObra, 'ID', insId, {
        'ID': insId,
        'Item': itemSup.name || '',
        'Categoria': itemSup.category || 'linha',
        'Custo_Unitario_R$': Number(itemSup.unitCost) || 0,
        'Notas': itemSup.notes || '',
        'Atualizado_Em': now
      });
      return responseJSON({ status: 'success', version: 'v3.1', message: 'Insumo gravado com sucesso na aba Insumos_MaoDeObra!', result: resIns });
    }

    if (action === 'delete_supply') {
      var sheetInsDel = ss.getSheetByName('Insumos_MaoDeObra') || ss.getSheetByName('Insumos');
      if (sheetInsDel) deleteRowById(sheetInsDel, payload.id);
      return responseJSON({ status: 'success', version: 'v3.1', message: 'Insumo excluído da aba Insumos_MaoDeObra!' });
    }

    // 6. Tecidos (Upsert por cabeçalho incluindo parâmetros de punho/ribana)
    if (action === 'save_fabric') {
      var sheetTec = getOrCreateSheet(ss, 'Tecidos', SCHEMA_HEADERS.Tecidos);
      var fab = payload.item || payload;
      var fabId = fab.id || 'fab-' + Utilities.getUuid().slice(0, 8);
      var resTec = upsertRowByHeaderMap(sheetTec, SCHEMA_HEADERS.Tecidos, 'ID', fabId, {
        'ID': fabId,
        'Nome_Tecido': fab.name || '',
        'Composicao': fab.composition || '',
        'Preco_Por_Unidade_R$': Number(fab.pricePerUnit) || 0,
        'Tipo_Medida': fab.unitType || 'kg',
        'Rendimento_Pecas': Number(fab.yieldPerUnit) || 3.2,
        'Perda_Corte_Pct': Number(fab.wasteMarginPct) || 5.0,
        'Usa_Punho': fab.hasPunho ? 'SIM' : 'NÃO',
        'Preco_Punho_R$': Number(fab.punhoPricePerUnit) || 0,
        'Rendimento_Punho_Pecas': Number(fab.punhoYieldPerUnit) || 0,
        'Perda_Punho_Pct': Number(fab.punhoWasteMarginPct) || 0,
        'Tipo_Medida_Punho': fab.punhoUnitType || 'kg',
        'Notas_Punho': fab.punhoNotes || '',
        'Observacoes': fab.notes || '',
        'Atualizado_Em': now
      });
      return responseJSON({ status: 'success', version: 'v3.1', message: 'Tecido gravado com sucesso na aba Tecidos com parâmetros de punho!', result: resTec });
    }

    if (action === 'delete_fabric') {
      var sheetTecDel = ss.getSheetByName('Tecidos');
      if (sheetTecDel) deleteRowById(sheetTecDel, payload.id);
      return responseJSON({ status: 'success', version: 'v3.1', message: 'Tecido excluído da aba Tecidos!' });
    }

    return responseJSON({ status: 'error', message: 'Ação não reconhecida: ' + action });

  } catch(err) {
    return responseJSON({ status: 'error', message: err.toString() });
  }
}

// Helpers para Google Sheets (Leitura e Gravação 100% por Cabeçalho)
function getOrCreateSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#ff8300');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, headers.length);
  }
  return sheet;
}

function readSheetAsObjects(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return [];
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var rows = [];
  for (var r = 1; r < values.length; r++) {
    var obj = {};
    var hasAny = false;
    for (var c = 0; c < headers.length; c++) {
      var key = String(headers[c] || '').trim().toLowerCase();
      if (key) {
        obj[key] = values[r][c];
      }
      if (values[r][c] !== '' && values[r][c] !== null && values[r][c] !== undefined) {
        hasAny = true;
      }
    }
    if (hasAny) rows.push(obj);
  }
  return rows;
}

function alignSheetColumnsToSchema(sheet, expectedHeaders) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow === 0 || lastCol === 0) {
    sheet.appendRow(expectedHeaders);
    return;
  }
  var data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var oldHeaders = data[0];
  var remapped = [expectedHeaders];
  for (var r = 1; r < data.length; r++) {
    var map = {};
    var hasData = false;
    for (var c = 0; c < oldHeaders.length; c++) {
      var k = String(oldHeaders[c] || '').trim().toLowerCase();
      if (k) map[k] = data[r][c];
      if (data[r][c] !== '' && data[r][c] !== null) hasData = true;
    }
    if (!hasData) continue;
    var rowOut = [];
    for (var e = 0; e < expectedHeaders.length; e++) {
      var expKey = expectedHeaders[e].trim().toLowerCase();
      rowOut.push(map[expKey] !== undefined ? map[expKey] : '');
    }
    remapped.push(rowOut);
  }
  sheet.clearContents();
  sheet.getRange(1, 1, remapped.length, expectedHeaders.length).setValues(remapped);
  var hRange = sheet.getRange(1, 1, 1, expectedHeaders.length);
  hRange.setBackground('#ff8300');
  hRange.setFontColor('#ffffff');
  hRange.setFontWeight('bold');
  sheet.setFrozenRows(1);
}

function ensureSheetHeaders(sheet, expectedHeaders, extraKeys) {
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) {
    sheet.appendRow(expectedHeaders);
    lastCol = expectedHeaders.length;
  }
  var existingHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var normalizedIndex = {};
  for (var c = 0; c < existingHeaders.length; c++) {
    var keyNorm = String(existingHeaders[c] || '').trim().toLowerCase();
    if (keyNorm) normalizedIndex[keyNorm] = c;
  }
  var keysToEnsure = expectedHeaders.concat(extraKeys || []);
  for (var k = 0; k < keysToEnsure.length; k++) {
    var hName = keysToEnsure[k];
    var hNorm = String(hName || '').trim().toLowerCase();
    if (hNorm && normalizedIndex[hNorm] === undefined) {
      var newColPos = existingHeaders.length + 1;
      var cell = sheet.getRange(1, newColPos);
      cell.setValue(hName);
      cell.setBackground('#ff8300');
      cell.setFontColor('#ffffff');
      cell.setFontWeight('bold');
      existingHeaders.push(hName);
      normalizedIndex[hNorm] = newColPos - 1;
    }
  }
  return { existingHeaders: existingHeaders, normalizedIndex: normalizedIndex };
}

function appendRowByHeaderMap(sheet, expectedHeaders, recordMap) {
  var headerInfo = ensureSheetHeaders(sheet, expectedHeaders, Object.keys(recordMap));
  var rowValues = [];
  for (var i = 0; i < headerInfo.existingHeaders.length; i++) rowValues.push('');
  var recordKeys = Object.keys(recordMap);
  for (var r = 0; r < recordKeys.length; r++) {
    var fieldName = recordKeys[r];
    var targetIdx = headerInfo.normalizedIndex[String(fieldName).trim().toLowerCase()];
    if (targetIdx !== undefined) {
      rowValues[targetIdx] = recordMap[fieldName] !== undefined && recordMap[fieldName] !== null ? recordMap[fieldName] : '';
    }
  }
  sheet.appendRow(rowValues);
}

function upsertRowByHeaderMap(sheet, expectedHeaders, idHeader, idValue, recordMap) {
  var headerInfo = ensureSheetHeaders(sheet, expectedHeaders, Object.keys(recordMap));
  var idColIdx = headerInfo.normalizedIndex[String(idHeader).trim().toLowerCase()];
  if (idColIdx === undefined) idColIdx = 0;

  var lastRow = sheet.getLastRow();
  var targetRow = -1;
  if (lastRow > 1) {
    var data = sheet.getRange(1, 1, lastRow, headerInfo.existingHeaders.length).getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][idColIdx]).trim() === String(idValue).trim()) {
        targetRow = i + 1;
        break;
      }
    }
  }

  var rowValues = [];
  if (targetRow > 1) {
    rowValues = sheet.getRange(targetRow, 1, 1, headerInfo.existingHeaders.length).getValues()[0];
  } else {
    for (var j = 0; j < headerInfo.existingHeaders.length; j++) rowValues.push('');
  }

  var recordKeys = Object.keys(recordMap);
  for (var r = 0; r < recordKeys.length; r++) {
    var fieldName = recordKeys[r];
    var targetIdx = headerInfo.normalizedIndex[String(fieldName).trim().toLowerCase()];
    if (targetIdx !== undefined) {
      rowValues[targetIdx] = recordMap[fieldName] !== undefined && recordMap[fieldName] !== null ? recordMap[fieldName] : '';
    }
  }

  if (targetRow > 1) {
    sheet.getRange(targetRow, 1, 1, rowValues.length).setValues([rowValues]);
    return { action: 'updated', row: targetRow };
  }
  sheet.appendRow(rowValues);
  return { action: 'appended', row: sheet.getLastRow() };
}

function syncCatalogBundle(ss, catalogs, now) {
  var total = 0;
  if (Array.isArray(catalogs.products)) {
    var sP = getOrCreateSheet(ss, 'Produtos', SCHEMA_HEADERS.Produtos);
    for (var i = 0; i < catalogs.products.length; i++) {
      var p = catalogs.products[i];
      upsertRowByHeaderMap(sP, SCHEMA_HEADERS.Produtos, 'ID', p.id, {
        'ID': p.id, 'Nome_Produto': p.name || '', 'Categoria': p.category || 'Camisetas',
        'Descricao': p.description || '', 'ID_Tecido_Padrao': p.defaultFabricId || '',
        'Custo_Costura_R$': Number(p.defaultSewingCost) || 0, 'Complexidade': p.defaultComplexity || 'Simples (Básica)',
        'Custo_Linha_R$': Number(p.defaultThreadCost) || 0, 'Custo_Etiqueta_R$': Number(p.defaultTagCost) || 0,
        'Custo_Embalagem_R$': Number(p.defaultPackagingCost) || 0, 'Custo_Ziper_R$': Number(p.defaultZipperCost) || 0,
        'Custo_Botao_R$': Number(p.defaultButtonCost) || 0, 'Atualizado_Em': now
      });
      total++;
    }
  }
  if (Array.isArray(catalogs.fabrics)) {
    var sT = getOrCreateSheet(ss, 'Tecidos', SCHEMA_HEADERS.Tecidos);
    for (var j = 0; j < catalogs.fabrics.length; j++) {
      var f = catalogs.fabrics[j];
      upsertRowByHeaderMap(sT, SCHEMA_HEADERS.Tecidos, 'ID', f.id, {
        'ID': f.id, 'Nome_Tecido': f.name || '', 'Composicao': f.composition || '',
        'Preco_Por_Unidade_R$': Number(f.pricePerUnit) || 0, 'Tipo_Medida': f.unitType || 'kg',
        'Rendimento_Pecas': Number(f.yieldPerUnit) || 3.2, 'Perda_Corte_Pct': Number(f.wasteMarginPct) || 5.0,
        'Usa_Punho': f.hasPunho ? 'SIM' : 'NÃO', 'Preco_Punho_R$': Number(f.punhoPricePerUnit) || 0,
        'Rendimento_Punho_Pecas': Number(f.punhoYieldPerUnit) || 0, 'Perda_Punho_Pct': Number(f.punhoWasteMarginPct) || 0,
        'Tipo_Medida_Punho': f.punhoUnitType || 'kg', 'Notas_Punho': f.punhoNotes || '',
        'Observacoes': f.notes || '', 'Atualizado_Em': now
      });
      total++;
    }
  }
  if (Array.isArray(catalogs.supplies)) {
    var sI = getOrCreateSheet(ss, 'Insumos_MaoDeObra', SCHEMA_HEADERS.Insumos_MaoDeObra);
    for (var k = 0; k < catalogs.supplies.length; k++) {
      var sup = catalogs.supplies[k];
      upsertRowByHeaderMap(sI, SCHEMA_HEADERS.Insumos_MaoDeObra, 'ID', sup.id, {
        'ID': sup.id, 'Item': sup.name || '', 'Categoria': sup.category || 'linha',
        'Custo_Unitario_R$': Number(sup.unitCost) || 0, 'Notas': sup.notes || '', 'Atualizado_Em': now
      });
      total++;
    }
  }
  if (Array.isArray(catalogs.suppliers)) {
    var sF = getOrCreateSheet(ss, 'Fornecedores', SCHEMA_HEADERS.Fornecedores);
    for (var m = 0; m < catalogs.suppliers.length; m++) {
      var forn = catalogs.suppliers[m];
      upsertRowByHeaderMap(sF, SCHEMA_HEADERS.Fornecedores, 'ID', forn.id, {
        'ID': forn.id, 'Nome_Empresa': forn.name || '', 'Contato': forn.contactName || '',
        'Telefone': forn.phone || '', 'Email': forn.email || '', 'Categoria': forn.category || 'Tecidos',
        'Prazo_Dias': Number(forn.leadTimeDays) || 7, 'Cidade_UF': forn.city || '',
        'Notas': forn.notes || '', 'Atualizado_Em': now
      });
      total++;
    }
  }
  if (Array.isArray(catalogs.workshops)) {
    var sO = getOrCreateSheet(ss, 'Oficinas', SCHEMA_HEADERS.Oficinas);
    for (var n = 0; n < catalogs.workshops.length; n++) {
      var ws = catalogs.workshops[n];
      upsertRowByHeaderMap(sO, SCHEMA_HEADERS.Oficinas, 'ID', ws.id, {
        'ID': ws.id, 'Nome_Oficina': ws.name || '', 'Responsavel': ws.responsibleName || '',
        'Telefone': ws.phone || '', 'Cidade_UF': ws.city || '',
        'Capacidade_Mensal': Number(ws.capacityPiecesPerMonth) || 3000,
        'Custo_Camiseta_R$': Number(ws.costPerPieceTshirt) || 5.5,
        'Custo_Polo_R$': Number(ws.costPerPiecePolo) || 9.8,
        'Custo_Moletom_R$': Number(ws.costPerPieceHoodie) || 16.0,
        'Custo_Calca_R$': Number(ws.costPerPiecePants) || 14.5,
        'Notas': ws.notes || '', 'Atualizado_Em': now
      });
      total++;
    }
  }
  return { total: total };
}

function deleteRowById(sheet, id) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(id).trim()) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

function doOptions(e) {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

function responseJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

const LOCAL_STORAGE_SAVED_QUOTES = 'nitro_saved_quotes_v1';
const LOCAL_STORAGE_SHEETS_CONFIG = 'nitro_sheets_config_v1';
const LOCAL_STORAGE_FABRICS = 'nitro_fabrics_v1';
const LOCAL_STORAGE_SUPPLIERS = 'nitro_suppliers_v1';
const LOCAL_STORAGE_SUPPLIES = 'nitro_supplies_v1';
const LOCAL_STORAGE_WORKSHOPS = 'nitro_workshops_v1';
const LOCAL_STORAGE_PRODUCTS = 'nitro_products_v1';

export function loadSavedQuotes(): Quote[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SAVED_QUOTES);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao carregar orçamentos salvos do localStorage', e);
    return [];
  }
}

export function saveQuoteLocally(quote: Quote): Quote[] {
  if (typeof window === 'undefined') return [];
  try {
    const quotes = loadSavedQuotes();
    const index = quotes.findIndex((q) => q.id === quote.id);
    if (index >= 0) {
      quotes[index] = quote;
    } else {
      quotes.unshift(quote);
    }
    localStorage.setItem(LOCAL_STORAGE_SAVED_QUOTES, JSON.stringify(quotes));
    return quotes;
  } catch (e) {
    console.error('Erro ao salvar no localStorage', e);
    return [];
  }
}

export function loadGoogleSheetsConfig(): GoogleSheetsConfig {
  if (typeof window === 'undefined') {
    return { webhookUrl: PERMANENT_GOOGLE_SHEETS_WEBHOOK_URL, autoSyncOnApprove: true };
  }
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SHEETS_CONFIG);
    if (!raw) {
      return { webhookUrl: PERMANENT_GOOGLE_SHEETS_WEBHOOK_URL, autoSyncOnApprove: true };
    }
    const parsed = JSON.parse(raw);
    return {
      webhookUrl: parsed.webhookUrl && parsed.webhookUrl.trim().length > 0 ? parsed.webhookUrl : PERMANENT_GOOGLE_SHEETS_WEBHOOK_URL,
      autoSyncOnApprove: parsed.autoSyncOnApprove !== undefined ? parsed.autoSyncOnApprove : true,
      lastSyncTimestamp: parsed.lastSyncTimestamp,
    };
  } catch (e) {
    return { webhookUrl: PERMANENT_GOOGLE_SHEETS_WEBHOOK_URL, autoSyncOnApprove: true };
  }
}

export function saveGoogleSheetsConfig(config: GoogleSheetsConfig) {
  if (typeof window === 'undefined') return;
  const toSave = {
    ...config,
    webhookUrl: config.webhookUrl?.trim() || PERMANENT_GOOGLE_SHEETS_WEBHOOK_URL,
  };
  localStorage.setItem(LOCAL_STORAGE_SHEETS_CONFIG, JSON.stringify(toSave));
}

// Persistência de Tecidos
export function loadFabricsLocally(): Fabric[] {
  if (typeof window === 'undefined') return DEFAULT_FABRICS;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_FABRICS);
    if (!raw) return DEFAULT_FABRICS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_FABRICS;
  } catch {
    return DEFAULT_FABRICS;
  }
}

export function saveFabricsLocally(fabrics: Fabric[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_FABRICS, JSON.stringify(fabrics));
  } catch {}
}

// Persistência de Fornecedores
export function loadSuppliersLocally(): Supplier[] {
  if (typeof window === 'undefined') return DEFAULT_SUPPLIERS;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SUPPLIERS);
    if (!raw) return DEFAULT_SUPPLIERS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_SUPPLIERS;
  } catch {
    return DEFAULT_SUPPLIERS;
  }
}

export function saveSuppliersLocally(suppliers: Supplier[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_SUPPLIERS, JSON.stringify(suppliers));
  } catch {}
}

// Persistência de Aviamentos / Insumos
export function loadSuppliesLocally(): SupplyItem[] {
  if (typeof window === 'undefined') return DEFAULT_SUPPLIES;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SUPPLIES);
    if (!raw) return DEFAULT_SUPPLIES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_SUPPLIES;
  } catch {
    return DEFAULT_SUPPLIES;
  }
}

export function saveSuppliesLocally(supplies: SupplyItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_SUPPLIES, JSON.stringify(supplies));
  } catch {}
}

// Persistência de Oficinas
export function loadWorkshopsLocally(): SewingWorkshop[] {
  if (typeof window === 'undefined') return DEFAULT_WORKSHOPS;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_WORKSHOPS);
    if (!raw) return DEFAULT_WORKSHOPS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_WORKSHOPS;
  } catch {
    return DEFAULT_WORKSHOPS;
  }
}

export function saveWorkshopsLocally(workshops: SewingWorkshop[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_WORKSHOPS, JSON.stringify(workshops));
  } catch {}
}

// Persistência de Produtos Reais
export function loadProductsLocally(): ProductTemplate[] {
  if (typeof window === 'undefined') return DEFAULT_PRODUCT_TEMPLATES;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PRODUCTS);
    if (!raw) return DEFAULT_PRODUCT_TEMPLATES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PRODUCT_TEMPLATES;
  } catch {
    return DEFAULT_PRODUCT_TEMPLATES;
  }
}

const LOCAL_STORAGE_SELLERS = 'nitro_sellers_v1';

export function loadSellersLocally(): Seller[] {
  if (typeof window === 'undefined') return DEFAULT_SELLERS;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SELLERS);
    if (!raw) return DEFAULT_SELLERS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_SELLERS;
  } catch {
    return DEFAULT_SELLERS;
  }
}

export function saveSellersLocally(sellers: Seller[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_SELLERS, JSON.stringify(sellers));
  } catch {}
}

export function saveProductsLocally(products: ProductTemplate[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_PRODUCTS, JSON.stringify(products));
  } catch {}
}

/**
 * Puxa as listas reais do banco de dados do Google Sheets via GET
 */
export async function fetchGoogleSheetsDatabase(
  webhookUrl?: string
): Promise<{
  success: boolean;
  message: string;
  tecidos?: Fabric[];
  insumos?: SupplyItem[];
  fornecedores?: Supplier[];
  oficinas?: SewingWorkshop[];
  produtos?: ProductTemplate[];
  rawOnline?: boolean;
}> {
  const url = webhookUrl || loadGoogleSheetsConfig().webhookUrl || PERMANENT_GOOGLE_SHEETS_WEBHOOK_URL;

  try {
    let json: any = null;

    // 1. Tenta via proxy server-side para evitar restrições de CORS
    try {
      const proxyRes = await fetch(
        `/api/sheets-sync?action=get_data&webhookUrl=${encodeURIComponent(url)}`
      );
      if (proxyRes.ok) {
        const proxyData = await proxyRes.json();
        if (proxyData.success && proxyData.data) {
          json = proxyData.data;
        }
      }
    } catch (proxyErr) {
      console.warn('Proxy GET falhou, tentando chamada direta:', proxyErr);
    }

    // 2. Fallback direto se o proxy não retornou
    if (!json) {
      const fetchUrl = url.includes('?') ? `${url}&action=get_data&t=${Date.now()}` : `${url}?action=get_data&t=${Date.now()}`;
      const response = await fetch(fetchUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        json = await response.json();
      }
    }

    if (!json) {
      return {
        success: false,
        message: 'Não foi possível carregar os dados remotos da planilha.',
      };
    }

    // Se o script atual retornar apenas status online básico sem dados
    if (json.status === 'online' && (!json.tecidos || json.tecidos.length === 0) && (!json.produtos || json.produtos.length === 0)) {
      return {
        success: true,
        rawOnline: true,
        message: 'Conexão confirmada com Google Sheets! O Webhook está online e ativo.',
      };
    }

    let importedFabrics: Fabric[] | undefined;
    if (Array.isArray(json.tecidos) && json.tecidos.length > 0) {
      importedFabrics = json.tecidos.map((t: any, idx: number) => {
        const usaPunhoRaw = String(t.hasPunho || t.Usa_Punho || '').toUpperCase();
        const hasPunho = usaPunhoRaw === 'SIM' || usaPunhoRaw === 'TRUE' || t.hasPunho === true;
        return {
          id: t.id || `fab-sheet-${idx}`,
          name: t.name || t.Nome_Tecido || `Tecido ${idx + 1}`,
          composition: t.composition || t.Composicao || '100% Algodão',
          pricePerUnit: Number(t.pricePerUnit || t['Preco_Por_Unidade_R$'] || 40),
          unitType: (t.unitType || t.Tipo_Medida || 'kg').toLowerCase() === 'metro' ? 'metro' : 'kg',
          yieldPerUnit: Number(t.yieldPerUnit || t.Rendimento_Pecas || 3.2),
          wasteMarginPct: Number(t.wasteMarginPct || t.Perda_Corte_Pct || 5),
          notes: t.notes || t.Observacoes || '',
          hasPunho,
          punhoPricePerUnit: Number(t.punhoPricePerUnit || t['Preco_Punho_R$'] || 0),
          punhoYieldPerUnit: Number(t.punhoYieldPerUnit || t.Rendimento_Punho_Pecas || 0),
          punhoWasteMarginPct: Number(t.punhoWasteMarginPct || t.Perda_Punho_Pct || 0),
          punhoUnitType: (t.punhoUnitType || t.Tipo_Medida_Punho || 'kg').toLowerCase() === 'metro' ? 'metro' : 'kg',
          punhoNotes: t.punhoNotes || t.Notas_Punho || t.Observacoes_Punho || '',
        };
      });
      if (importedFabrics) saveFabricsLocally(importedFabrics);
    }

    let importedSupplies: SupplyItem[] | undefined;
    if (Array.isArray(json.insumos) && json.insumos.length > 0) {
      importedSupplies = json.insumos.map((i: any, idx: number) => ({
        id: i.id || `insumo-sheet-${idx}`,
        name: i.name || i.Item || `Insumo ${idx + 1}`,
        category: (i.category || i.Categoria || 'linha').toLowerCase(),
        unitCost: Number(i.unitCost || i['Custo_Unitario_R$'] || 0.5),
        notes: i.notes || i.Notas || '',
      }));
      if (importedSupplies) saveSuppliesLocally(importedSupplies);
    }

    let importedSuppliers: Supplier[] | undefined;
    if (Array.isArray(json.fornecedores) && json.fornecedores.length > 0) {
      importedSuppliers = json.fornecedores.map((f: any, idx: number) => ({
        id: f.id || `forn-sheet-${idx}`,
        name: f.name || f.Nome_Empresa || `Fornecedor ${idx + 1}`,
        contactName: f.contactName || f.Contato || '',
        phone: f.phone || f.Telefone || '',
        email: f.email || f.Email || '',
        category: f.category || f.Categoria || 'Tecidos',
        leadTimeDays: Number(f.leadTimeDays || f.Prazo_Dias || 7),
        city: f.city || f.Cidade_UF || '',
        notes: f.notes || f.Notas || '',
      }));
      if (importedSuppliers) saveSuppliersLocally(importedSuppliers);
    }

    let importedWorkshops: SewingWorkshop[] | undefined;
    if (Array.isArray(json.oficinas) && json.oficinas.length > 0) {
      importedWorkshops = json.oficinas.map((w: any, idx: number) => ({
        id: w.id || `ws-sheet-${idx}`,
        name: w.name || w.Nome_Oficina || `Oficina ${idx + 1}`,
        responsibleName: w.responsibleName || w.Responsavel || '',
        phone: w.phone || w.Telefone || '',
        city: w.city || w.Cidade_UF || '',
        capacityPiecesPerMonth: Number(w.capacityPiecesPerMonth || w.Capacidade_Mensal || 3000),
        costPerPieceTshirt: Number(w.costPerPieceTshirt || w['Custo_Camiseta_R$'] || 5.5),
        costPerPiecePolo: Number(w.costPerPiecePolo || w['Custo_Polo_R$'] || 9.8),
        costPerPieceHoodie: Number(w.costPerPieceHoodie || w['Custo_Moletom_R$'] || 16.0),
        costPerPiecePants: Number(w.costPerPiecePants || w['Custo_Calca_R$'] || 14.5),
        rating: 5,
        notes: w.notes || w.Notas || '',
      }));
      if (importedWorkshops) saveWorkshopsLocally(importedWorkshops);
    }

    let importedProducts: ProductTemplate[] | undefined;
    if (Array.isArray(json.produtos) && json.produtos.length > 0) {
      importedProducts = json.produtos.map((p: any, idx: number) => ({
        id: p.id || `prod-sheet-${idx}`,
        name: p.name || p.Nome_Produto || `Produto ${idx + 1}`,
        category: p.category || p.Categoria || 'Camisetas',
        description: p.description || p.Descricao || '',
        defaultFabricId: p.defaultFabricId || p.ID_Tecido_Padrao || '',
        defaultSewingCost: Number(p.defaultSewingCost || p['Custo_Costura_R$'] || 5.5),
        defaultComplexity: (p.defaultComplexity || p.Complexidade || 'Simples (Básica)') as any,
        defaultThreadCost: Number(p.defaultThreadCost || p['Custo_Linha_R$'] || 0.4),
        defaultTagCost: Number(p.defaultTagCost || p['Custo_Etiqueta_R$'] || 0.6),
        defaultPackagingCost: Number(p.defaultPackagingCost || p['Custo_Embalagem_R$'] || 0.5),
        defaultZipperCost: Number(p.defaultZipperCost || p['Custo_Ziper_R$'] || 0),
        defaultButtonCost: Number(p.defaultButtonCost || p['Custo_Botao_R$'] || 0),
      }));
      if (importedProducts) saveProductsLocally(importedProducts);
    }

    const now = new Date().toLocaleString('pt-BR');
    saveGoogleSheetsConfig({
      ...loadGoogleSheetsConfig(),
      lastSyncTimestamp: now,
    });

    const counts = [
      importedProducts ? `${importedProducts.length} produtos` : null,
      importedFabrics ? `${importedFabrics.length} tecidos` : null,
      importedSupplies ? `${importedSupplies.length} insumos` : null,
      importedSuppliers ? `${importedSuppliers.length} fornecedores` : null,
      importedWorkshops ? `${importedWorkshops.length} oficinas` : null,
    ]
      .filter(Boolean)
      .join(', ');

    return {
      success: true,
      message: `Dados sincronizados com sucesso da planilha! (${counts || 'Webhook ativo'})`,
      tecidos: importedFabrics,
      insumos: importedSupplies,
      fornecedores: importedSuppliers,
      oficinas: importedWorkshops,
      produtos: importedProducts,
    };
  } catch (error: any) {
    console.warn('Erro ao buscar dados do Google Sheets:', error);
    return {
      success: false,
      message: 'Não foi possível carregar os dados remotos da planilha. O sistema continuará com os dados locais salvos.',
    };
  }
}

export type EntitySyncAction =
  | 'save_product'
  | 'delete_product'
  | 'save_supplier'
  | 'delete_supplier'
  | 'save_workshop'
  | 'delete_workshop'
  | 'save_supply'
  | 'delete_supply'
  | 'save_fabric'
  | 'delete_fabric';

/**
 * Envia operações de gravação, edição ou exclusão diretamente para o Webhook do Google Sheets
 */
export async function sendEntityToGoogleSheets(
  action: EntitySyncAction,
  itemOrPayload: any,
  webhookUrl?: string
): Promise<{ success: boolean; message: string; rawResponse?: any; isVersion1?: boolean }> {
  const url = webhookUrl || loadGoogleSheetsConfig().webhookUrl || PERMANENT_GOOGLE_SHEETS_WEBHOOK_URL;
  if (!url || !url.trim().startsWith('http')) {
    return { success: false, message: 'URL do Webhook não configurada.' };
  }

  const payload = {
    action,
    item: typeof itemOrPayload === 'object' && itemOrPayload !== null ? itemOrPayload : undefined,
    id: typeof itemOrPayload === 'string' ? itemOrPayload : itemOrPayload?.id,
    ...(typeof itemOrPayload === 'object' ? itemOrPayload : {}),
  };

  // 1. Envia através do proxy seguro do servidor (resolve CORS e 302 de forma transparente)
  try {
    const proxyRes = await fetch('/api/sheets-sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        webhookUrl: url,
        payload,
      }),
    });

    if (proxyRes.ok) {
      const resData = await proxyRes.json();
      const rawData = resData.data;

      if (resData.success && rawData?.status !== 'error') {
        return {
          success: true,
          message: rawData?.message || 'Gravado com sucesso no Google Sheets!',
          rawResponse: rawData,
        };
      }

      // Se a planilha respondeu "Ação não reconhecida"
      if (
        rawData?.message?.includes('Ação não reconhecida') ||
        resData.message?.includes('Ação não reconhecida')
      ) {
        return {
          success: false,
          isVersion1: true,
          message:
            'A planilha respondeu ao Webhook, mas seu Apps Script ainda está rodando a versão 1.0 (antiga). É necessário colar o código v2.0 na planilha e publicar uma Nova Versão para gravar produtos, fornecedores e oficinas diretamente nas novas abas.',
          rawResponse: rawData,
        };
      }

      return {
        success: false,
        message: rawData?.message || resData.message || 'Erro retornado pela planilha Google Sheets.',
        rawResponse: rawData,
      };
    }
  } catch (proxyError) {
    console.warn('Proxy local falhou, tentando fallback direto:', proxyError);
  }

  // 2. Fallback direto caso o proxy esteja indisponível
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      try {
        const data = await response.json();
        const ok = data?.status !== 'error';
        return {
          success: ok,
          message: data?.message || (ok ? 'Gravado no Google Sheets!' : 'Erro na planilha Google Sheets'),
          rawResponse: data,
        };
      } catch {
        return {
          success: true,
          message: 'Operação enviada ao Google Apps Script!',
        };
      }
    } else {
      return {
        success: false,
        message: `Servidor retornou código ${response.status}`,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || 'Falha de conexão com a URL do Webhook.',
    };
  }
}

export function extractItemPrintingSummary(item: QuoteItem): {
  tecnicasAtivas: string[];
  tecnicasResumo: string;
  posicoes: string[];
  posicoesResumo: string;
} {
  const tecnicasAtivas: string[] = [];
  const posicoes: string[] = [];
  const p = item.printing;

  if (p.silk?.enabled) {
    tecnicasAtivas.push('Silk Screen');
    const silkPos = p.silk.positions || [];
    if (silkPos.length > 0) {
      silkPos.forEach((pos) => {
        posicoes.push(`Silk: ${pos.position} (${pos.colorsCount} ${pos.colorsCount === 1 ? 'cor' : 'cores'} · ${pos.inkType})`);
      });
    } else {
      posicoes.push('Silk: Posição padrão');
    }
  }

  if (p.dtf?.enabled) {
    tecnicasAtivas.push('DTF');
    const dtfPos = p.dtf.positions || [];
    if (dtfPos.length > 0) {
      dtfPos.forEach((pos) => {
        posicoes.push(`DTF: ${pos.label || 'Estampa'} (${pos.widthCm}x${pos.heightCm}cm)`);
      });
    } else {
      posicoes.push('DTF: Posição padrão');
    }
  }

  if (p.sublimation?.enabled) {
    tecnicasAtivas.push('Sublimação');
    const modeLabel =
      p.sublimation.mode === 'total'
        ? 'Sublimação Total (Frente, Costas e Mangas)'
        : p.sublimation.mode === 'impressao_e_prensagem'
        ? 'Sublimação (Impressão + Prensagem)'
        : p.sublimation.mode === 'apenas_impressao'
        ? 'Sublimação (Somente Impressão)'
        : 'Sublimação (Somente Prensagem)';
    posicoes.push(modeLabel);
  }

  if (p.vinyl?.enabled) {
    tecnicasAtivas.push('Filme de Recorte');
    posicoes.push(`Filme de Recorte (${p.vinyl.widthCm}x${p.vinyl.heightCm}cm)`);
  }

  return {
    tecnicasAtivas,
    tecnicasResumo: tecnicasAtivas.length > 0 ? tecnicasAtivas.join(', ') : 'Peça Lisa (Sem estampa)',
    posicoes,
    posicoesResumo: posicoes.length > 0 ? posicoes.join(' | ') : 'Sem estampa',
  };
}

export function formatItemSizeGridSummary(sizes: SizeGrid): string {
  const parts: string[] = [];
  if (sizes.pp) parts.push(`PP:${sizes.pp}`);
  if (sizes.p) parts.push(`P:${sizes.p}`);
  if (sizes.m) parts.push(`M:${sizes.m}`);
  if (sizes.g) parts.push(`G:${sizes.g}`);
  if (sizes.gg) parts.push(`GG:${sizes.gg}`);
  if (sizes.exg) parts.push(`EXG:${sizes.exg}`);
  if (sizes.g1) parts.push(`G1:${sizes.g1}`);
  if (sizes.g2) parts.push(`G2:${sizes.g2}`);
  if (sizes.tam02) parts.push(`Inf.02:${sizes.tam02}`);
  if (sizes.tam04) parts.push(`Inf.04:${sizes.tam04}`);
  if (sizes.tam06) parts.push(`Inf.06:${sizes.tam06}`);
  if (sizes.tam08) parts.push(`Inf.08:${sizes.tam08}`);
  if (sizes.tam10) parts.push(`Inf.10:${sizes.tam10}`);
  if (sizes.tam12) parts.push(`Inf.12:${sizes.tam12}`);
  if (sizes.tam14) parts.push(`Inf.14:${sizes.tam14}`);
  if (sizes.tam16) parts.push(`Inf.16:${sizes.tam16}`);
  return parts.length > 0 ? parts.join(', ') : 'A definir';
}

export function buildStructuredOrderPayload(
  quote: Quote,
  totals: CalculatedQuoteTotals,
  fabrics?: Fabric[]
): StructuredOrderPayload {
  const fabricList = fabrics && fabrics.length > 0 ? fabrics : loadFabricsLocally();

  const itemsSummary = quote.items
    .map((item) => {
      const calc = totals.itemsCalculated[item.id];
      const qty = calc ? calc.totalQuantity : 0;
      const fit = item.fitType ? ` (${item.fitType})` : '';
      const sleeve = item.sleeveType ? ` [${item.sleeveType}]` : '';
      const color = item.color ? ` - ${item.color}` : '';
      const sizeStr = formatItemSizeGridSummary(item.sizes);
      return `${qty}x ${item.title}${fit}${sleeve}${color} {${sizeStr}}`;
    })
    .join(' | ');

  const sizeGridSummary = quote.items
    .map((item, idx) => `#${idx + 1} ${item.title}: ${formatItemSizeGridSummary(item.sizes)}`)
    .join(' | ');

  const addr = quote.deliveryAddress || {
    cep: quote.shipping?.cepDestino || '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  };

  const cidadeUfEntrega =
    addr.city && addr.state
      ? `${addr.city} / ${addr.state}`
      : addr.city || quote.shipping?.cidadeUf || '';

  const addressParts = [
    addr.street ? `${addr.street}${addr.number ? `, ${addr.number}` : ''}` : '',
    addr.complement || '',
    addr.neighborhood || '',
    cidadeUfEntrega,
    addr.cep ? `CEP ${addr.cep}` : '',
  ].filter(Boolean);

  const pedido: OrderParentPayload = {
    id: quote.id,
    timestamp: new Date().toISOString(),
    quoteNumber: quote.quoteNumber,
    status: 'Aprovado',
    cliente: {
      tipo: quote.clientType || 'PF',
      nome: quote.clientName || '',
      empresa: quote.clientCompany || '',
      cpfCnpj: quote.clientDocument || '',
      telefone: quote.clientPhone || '',
      email: quote.clientEmail || '',
    },
    entrega: {
      cep: addr.cep || quote.shipping?.cepDestino || '',
      logradouro: addr.street || '',
      numero: addr.number || '',
      complemento: addr.complement || '',
      bairro: addr.neighborhood || '',
      cidade: addr.city || '',
      uf: addr.state || '',
      cidadeUf: cidadeUfEntrega,
      enderecoCompleto: addressParts.join(' - '),
    },
    logistica: {
      modalidade: quote.shipping?.name || 'Não especificado',
      tipo: quote.shipping?.type || 'correios_pac',
      transportadora: quote.shipping?.carrierName || '',
      valorFrete: Number(totals.shippingCost || 0),
      cidadeUfDestino: quote.shipping?.cidadeUf || cidadeUfEntrega,
      cepDestino: quote.shipping?.cepDestino || addr.cep || '',
      prazoEntrega: quote.shipping?.deliveryTime || '',
      fretePorConta: quote.shipping?.fretePorConta || 'CIF',
    },
    financeiro: {
      totalPecas: totals.totalQuantity,
      custoTotalProducao: Number(totals.totalProductionCost.toFixed(2)),
      margemLucroPct: Number(totals.averageMarginPct.toFixed(2)),
      taxaArte: Number(totals.artCreationCost.toFixed(2)),
      valorProdutos: Number(totals.totalProductsSellingPrice.toFixed(2)),
      valorTotalVenda: Number(totals.totalSellingPrice.toFixed(2)),
      lucroLiquido: Number(totals.totalProfit.toFixed(2)),
      vendedor: quote.sellerName || 'Nitro Comercial',
      comissaoPct: Number(totals.sellerCommissionPct.toFixed(2)),
      comissaoValor: Number(totals.sellerCommissionFee.toFixed(2)),
      lucroPosComissao: Number(totals.netProfitAfterCommission.toFixed(2)),
    },
    comercial: {
      prazoProducaoDias: quote.deliveryLeadTimeDays,
      prazoProducaoTexto: quote.deliveryLeadTimeCustom || `${quote.deliveryLeadTimeDays} dias úteis`,
      condicoesPagamento: quote.paymentTerms || '',
      observacoes: quote.notes || '',
      resumoItens: itemsSummary,
      gradeTamanhosResumo: sizeGridSummary,
    },
  };

  const itens: OrderItemChildPayload[] = quote.items.map((item, idx) => {
    const calc = totals.itemsCalculated[item.id];
    const fabric = fabricList.find((f) => f.id === item.fabricId);
    const printSummary = extractItemPrintingSummary(item);

    const childSizes = [
      item.sizes.tam02 ? `02:${item.sizes.tam02}` : '',
      item.sizes.tam04 ? `04:${item.sizes.tam04}` : '',
      item.sizes.tam06 ? `06:${item.sizes.tam06}` : '',
      item.sizes.tam08 ? `08:${item.sizes.tam08}` : '',
      item.sizes.tam10 ? `10:${item.sizes.tam10}` : '',
      item.sizes.tam12 ? `12:${item.sizes.tam12}` : '',
      item.sizes.tam14 ? `14:${item.sizes.tam14}` : '',
      item.sizes.tam16 ? `16:${item.sizes.tam16}` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    return {
      id: item.id,
      orderId: quote.id,
      quoteNumber: quote.quoteNumber,
      ordemItem: idx + 1,
      produto: item.title,
      produtoId: item.productTemplateId,
      tecido: fabric?.name || item.fabricId,
      tecidoId: item.fabricId,
      composicaoTecido: fabric?.composition || '',
      corMalha: item.color || 'Não especificada',
      modelagem: item.fitType || 'Unissex',
      tipoManga: item.sleeveType || 'Manga Curta',
      gradeTamanhos: {
        pp: item.sizes.pp || 0,
        p: item.sizes.p || 0,
        m: item.sizes.m || 0,
        g: item.sizes.g || 0,
        gg: item.sizes.gg || 0,
        exg: item.sizes.exg || 0,
        g1: item.sizes.g1 || 0,
        g2: item.sizes.g2 || 0,
        infantil: {
          tam02: item.sizes.tam02 || 0,
          tam04: item.sizes.tam04 || 0,
          tam06: item.sizes.tam06 || 0,
          tam08: item.sizes.tam08 || 0,
          tam10: item.sizes.tam10 || 0,
          tam12: item.sizes.tam12 || 0,
          tam14: item.sizes.tam14 || 0,
          tam16: item.sizes.tam16 || 0,
        },
        infantilResumo: childSizes,
        totalPecas: calc?.totalQuantity || 0,
      },
      estamparia: {
        tecnicasAtivas: printSummary.tecnicasAtivas,
        tecnicasResumo: printSummary.tecnicasResumo,
        posicoes: printSummary.posicoes,
        posicoesResumo: printSummary.posicoesResumo,
        detalhesTecnicos: item.printing,
      },
      arquivosVisuais: {
        linkMockupAprovado: item.approvedMockupUrl || '',
        linkArteFinal: item.finalArtUrl || '',
      },
      valores: {
        custoUnitario: Number((calc?.unitProductionCost || 0).toFixed(2)),
        precoVendaUnitario: Number((calc?.unitSellingPrice || 0).toFixed(2)),
        totalVendaItem: Number((calc?.totalSellingPrice || 0).toFixed(2)),
      },
      observacoesTecnicas: item.notes || '',
    };
  });

  return {
    action: 'save_order',
    pedido,
    itens,
    // Chaves planas explícitas para compatibilidade imediata com scripts v2.0
    id: pedido.id,
    timestamp: pedido.timestamp,
    quoteNumber: pedido.quoteNumber,
    status: pedido.status,
    clientName: pedido.cliente.nome,
    clientCompany: pedido.cliente.empresa,
    clientDocument: pedido.cliente.cpfCnpj,
    clientPhone: pedido.cliente.telefone,
    clientEmail: pedido.cliente.email,
    deliveryAddressFull: pedido.entrega.enderecoCompleto,
    totalQuantity: pedido.financeiro.totalPecas,
    itemsSummary: pedido.comercial.resumoItens,
    sizeGridSummary,
    totalProductionCost: pedido.financeiro.custoTotalProducao,
    marginPct: pedido.financeiro.margemLucroPct,
    shippingMethod: pedido.logistica.modalidade,
    shippingCost: pedido.logistica.valorFrete,
    shippingDestination: pedido.logistica.cidadeUfDestino,
    totalSellingPrice: pedido.financeiro.valorTotalVenda,
    totalProfit: pedido.financeiro.lucroLiquido,
    deliveryLeadTimeDays: pedido.comercial.prazoProducaoDias,
    paymentTerms: pedido.comercial.condicoesPagamento,
    sellerName: pedido.financeiro.vendedor,
    sellerCommissionPct: pedido.financeiro.comissaoPct,
    sellerCommissionFee: pedido.financeiro.comissaoValor,
    netProfitAfterCommission: pedido.financeiro.lucroPosComissao,
  };
}

export async function sendOrderToGoogleSheets(
  quote: Quote,
  totals: CalculatedQuoteTotals,
  fabrics?: Fabric[],
  webhookUrl?: string
): Promise<{ success: boolean; message: string; version?: string }> {
  // 1. Sempre grava primeiro na contingência local
  saveQuoteLocally({ ...quote, status: 'Aprovado', syncedToGoogleSheets: false });

  const url = webhookUrl || loadGoogleSheetsConfig().webhookUrl || PERMANENT_GOOGLE_SHEETS_WEBHOOK_URL;
  const payload = buildStructuredOrderPayload(quote, totals, fabrics);

  if (!url || !url.trim().startsWith('http')) {
    return {
      success: true,
      message:
        'Pedido gravado com sucesso no Histórico Local! (Para enviar ao Google Sheets, informe a URL do Webhook nas Configurações).',
    };
  }

  // 1. Tenta via proxy seguro
  try {
    const proxyRes = await fetch('/api/sheets-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhookUrl: url, payload }),
    });

    if (proxyRes.ok) {
      const resData = await proxyRes.json();
      if (resData.success && resData.data?.status !== 'error') {
        saveQuoteLocally({ ...quote, status: 'Aprovado', syncedToGoogleSheets: true });
        const respVersion = resData.data?.version || '';
        const isLegacyV2 = respVersion === 'v2.0';

        // Se o Webhook ainda estiver na v2.0, tenta gravar os itens + quantidades por tamanho via Google Drive se conectado
        let driveFallbackMsg = '';
        if (isLegacyV2 && typeof window !== 'undefined') {
          try {
            const { appendOrderItemsViaDrive } = await import('./google-drive-oauth');
            const driveRes = await appendOrderItemsViaDrive(payload);
            if (driveRes.saved) {
              driveFallbackMsg = ` ${driveRes.message || ''}`;
            }
          } catch {
            // Silencioso se não houver sessão Google Drive ativa
          }
        }

        return {
          success: true,
          version: respVersion,
          message: isLegacyV2
            ? driveFallbackMsg
              ? `Pedido gravado em Historico_Pedidos (com grade de tamanhos no resumo) e${driveFallbackMsg}`
              : 'Pedido gravado em Historico_Pedidos (com grade de tamanhos no Resumo_Itens)! Para gravar também as colunas individuais por tamanho na aba Itens_Pedido, atualize o Code.gs para v3.1 ou conecte o Google Drive nas Configurações.'
            : resData.data?.message ||
              `Pedido gravado com sucesso nas abas Historico_Pedidos e Itens_Pedido (${payload.itens.length} itens com todas as quantidades por tamanho)!`,
        };
      }
      return {
        success: false,
        message: resData.data?.message || resData.message || 'Erro ao gravar pedido no Google Sheets.',
      };
    }
  } catch (err) {
    console.warn('Erro ao enviar pedido via proxy:', err);
  }

  // 2. Fallback direto
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      saveQuoteLocally({ ...quote, status: 'Aprovado', syncedToGoogleSheets: true });
      return {
        success: true,
        message: 'Pedido enviado para a planilha do Google Sheets!',
      };
    } else {
      return {
        success: false,
        message: `Falha na resposta do Google Sheets (${response.status}). O pedido foi preservado no histórico local.`,
      };
    }
  } catch (error) {
    console.warn('Erro de rede ou CORS com Apps Script:', error);
    return {
      success: true,
      message:
        'Requisição enviada ao Google Apps Script e pedido protegido no banco local de contingência.',
    };
  }
}

export async function rebuildSchemaViaWebhook(
  catalogs?: {
    products?: ProductTemplate[];
    fabrics?: Fabric[];
    supplies?: SupplyItem[];
    suppliers?: Supplier[];
    workshops?: SewingWorkshop[];
  },
  webhookUrl?: string
): Promise<{ success: boolean; message: string; needsScriptUpgrade?: boolean }> {
  const url = webhookUrl || loadGoogleSheetsConfig().webhookUrl || PERMANENT_GOOGLE_SHEETS_WEBHOOK_URL;
  try {
    const res = await fetch('/api/sheets-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        webhookUrl: url,
        payload: {
          action: 'rebuild_schema_v3',
          catalogs,
        },
      }),
    });
    const json = await res.json();
    const raw = json?.data;
    if (json?.success && raw?.status === 'success') {
      return {
        success: true,
        message: raw.message || 'Todas as 8 abas v3.1 recriadas e sincronizadas com sucesso!',
      };
    }
    const errMsg = raw?.message || json?.message || '';
    const needsUpgrade = errMsg.includes('Ação não reconhecida');
    return {
      success: false,
      needsScriptUpgrade: needsUpgrade,
      message: needsUpgrade
        ? 'O Webhook ativo ainda está rodando o script v2.0/v1.0. Cole o script v3.1 em Extensões > Apps Script ou use o botão Google Drive abaixo para recriar as 8 abas imediatamente.'
        : errMsg || 'Erro ao executar reconstrução v3.1 via Webhook.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Falha ao comunicar com o Webhook.',
    };
  }
}

/**
 * Testa o status e a versão ativa do Google Apps Script
 */
export async function testWebhookLiveStatus(webhookUrl?: string): Promise<{
  online: boolean;
  isVersion2: boolean;
  isVersion3: boolean;
  version: string;
  message: string;
  details?: any;
}> {
  const url = webhookUrl || loadGoogleSheetsConfig().webhookUrl || PERMANENT_GOOGLE_SHEETS_WEBHOOK_URL;
  try {
    const res = await fetch('/api/sheets-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        webhookUrl: url,
        payload: { action: 'ping_test' },
      }),
    });

    if (res.ok) {
      const json = await res.json();
      const raw = json.data;
      const detectedVersion = String(raw?.version || '').trim();

      if (detectedVersion === 'v3.1' || detectedVersion === 'v3.0') {
        return {
          online: true,
          isVersion2: true,
          isVersion3: true,
          version: detectedVersion,
          message: `Webhook ${detectedVersion} 100% Ativo: Gravação relacional Pai-Filho (Historico_Pedidos + Itens_Pedido) e mapeamento por cabeçalho habilitados!`,
          details: raw,
        };
      }

      if (detectedVersion === 'v2.0' || raw?.status === 'success' || raw?.system?.includes('v2.0')) {
        return {
          online: true,
          isVersion2: true,
          isVersion3: false,
          version: 'v2.0',
          message:
            'Webhook ativo na versão v2.0 (legado): o envio plano para Historico_Pedidos foi compatibilizado, mas é necessário implantar o Code.gs v3.1 para gravar Itens_Pedido, Punho/Ribana e colunas alinhadas por cabeçalho.',
          details: raw,
        };
      }

      if (raw?.message?.includes('Ação não reconhecida') || json?.message?.includes('Ação não reconhecida')) {
        return {
          online: true,
          isVersion2: false,
          isVersion3: false,
          version: 'v1.0',
          message:
            'Atenção: O Webhook está online, mas ainda roda a versão v1.0. Atualize o Code.gs na planilha para v3.1 criando uma Nova Versão.',
          details: raw,
        };
      }

      return {
        online: true,
        isVersion2: false,
        isVersion3: false,
        version: 'desconhecida',
        message: 'Webhook respondeu, mas requer atualização do script Code.gs v3.1 na planilha.',
        details: raw,
      };
    }
  } catch (err: any) {
    return {
      online: false,
      isVersion2: false,
      isVersion3: false,
      version: 'offline',
      message: 'Não foi possível alcançar a URL do Webhook.',
      details: err?.message,
    };
  }

  return {
    online: false,
    isVersion2: false,
    isVersion3: false,
    version: 'offline',
    message: 'Não foi possível verificar o Webhook.',
  };
}
