'use client';

import React, { useState } from 'react';
import {
  Fabric,
  ProductTemplate,
  Quote,
  QuoteItem,
  ShippingOption,
  SizeGrid,
} from '../lib/types';
import { createInitialQuoteItem } from '../lib/default-data';
import { calculateRealShippingRates } from '../lib/correios-calculator';
import {
  Sparkles,
  MessageSquare,
  Bot,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  ChevronDown,
  ChevronUp,
  User,
  Package,
  Layers,
  Truck,
  ArrowRight,
  ClipboardPaste,
} from 'lucide-react';

interface AIConversationParserCardProps {
  quote: Quote;
  onUpdateQuote: (updated: Quote) => void;
  products: ProductTemplate[];
  fabrics: Fabric[];
  isOpen?: boolean;
  onToggleOpen?: () => void;
}

const SAMPLE_CONVERSATION_1 = `[14:22, 04/11/2026] Carlos Eduardo (Iron Crossfit): Boa tarde equipe Nitro! Gostaria de cotar camisetas para nossa academia.
[14:23, 04/11/2026] Carlos Eduardo: Seriam 60 camisetas manga curta tradicionais, na cor Preto, em algodão penteado 30.1.
[14:24, 04/11/2026] Carlos Eduardo: A grade que precisamos é: 10 P, 25 M, 20 G e 5 GG.
[14:25, 04/11/2026] Carlos Eduardo: Sobre a estampa: queremos Silk Screen com o logo no peito esquerdo em 2 cores (branco e amarelo) e nas costas o nome grande em 1 cor branca.
[14:27, 04/11/2026] Carlos Eduardo: Meu telefone é (11) 98765-4321 e a empresa é Iron Crossfit Ltda.
[14:28, 04/11/2026] Carlos Eduardo: O CEP para entrega é 04538-132, São Paulo SP. Forma de pagamento: 50% no pedido e 50% na entrega.`;

const SAMPLE_CONVERSATION_2 = `Olá vendedor! Aqui é a Marina do Colégio Horizonte (marina@colegiohorizonte.com.br, tel 19 99123-4567).
Queremos encomendar uniformes para a equipe de esportes:
Item 1: 40 camisetas Dry Fit Azul Marinho com estampa DTF colorida na frente (15x15cm).
Grade: 5 PP, 15 P, 15 M, 5 G.
Entrega em Campinas / SP no CEP 13010-111.
Prazo que precisamos: até 15 dias úteis.`;

export const AIConversationParserCard: React.FC<AIConversationParserCardProps> = ({
  quote,
  onUpdateQuote,
  products,
  fabrics,
  isOpen: isOpenProp,
  onToggleOpen,
}) => {
  const [localOpen, setLocalOpen] = useState(true);
  const isOpen = isOpenProp !== undefined ? isOpenProp : localOpen;

  const toggleOpen = () => {
    if (onToggleOpen) {
      onToggleOpen();
    } else {
      setLocalOpen(!localOpen);
    }
  };

  const [conversationText, setConversationText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    summary: string;
    clientName?: string;
    itemsCount: number;
    totalPieces: number;
  } | null>(null);

  const handleProcessConversation = async () => {
    if (!conversationText.trim()) {
      setError('Por favor, cole o texto da conversa de atendimento para análise.');
      return;
    }

    setError(null);
    setIsLoading(true);
    setSuccessResult(null);

    try {
      const response = await fetch('/api/gemini/parse-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationText: conversationText.trim(),
          availableProducts: products,
          availableFabrics: fabrics,
        }),
      });

      const resJson = await response.json();

      if (!response.ok || !resJson.success) {
        throw new Error(resJson.error || 'Não foi possível analisar a conversa.');
      }

      const data = resJson.data;

      // 1. Atualizar dados do Cliente (caso não tenha informação na conversa, deixar em branco '')
      const updatedClientType = data.client?.clientType === 'PJ' ? 'PJ' : (data.client?.company ? 'PJ' : (quote.clientType || 'PF'));
      const updatedClientDocument = data.client?.document !== undefined ? data.client.document : (quote.clientDocument || '');
      const updatedClientName = data.client?.name !== undefined ? data.client.name : quote.clientName;
      const updatedClientCompany = data.client?.company !== undefined ? data.client.company : quote.clientCompany;
      const updatedClientPhone = data.client?.phone !== undefined ? data.client.phone : quote.clientPhone;
      const updatedClientEmail = data.client?.email !== undefined ? data.client.email : quote.clientEmail;
      const updatedSellerName = data.client?.sellerName && data.client.sellerName.trim() ? data.client.sellerName : quote.sellerName;

      // 2. Condições Comerciais
      const updatedPaymentTerms = data.commercial?.paymentTerms !== undefined && data.commercial.paymentTerms.trim()
        ? data.commercial.paymentTerms
        : quote.paymentTerms;

      const updatedLeadDays = data.commercial?.deliveryLeadTimeDays && data.commercial.deliveryLeadTimeDays > 0
        ? data.commercial.deliveryLeadTimeDays
        : quote.deliveryLeadTimeDays;

      const updatedLeadCustom = data.commercial?.deliveryLeadTimeCustom && data.commercial.deliveryLeadTimeCustom.trim()
        ? data.commercial.deliveryLeadTimeCustom
        : (data.commercial?.deliveryLeadTimeDays ? `${data.commercial.deliveryLeadTimeDays} dias úteis` : quote.deliveryLeadTimeCustom);

      const updatedNotes = data.commercial?.notes !== undefined && data.commercial.notes.trim()
        ? data.commercial.notes
        : quote.notes;

      // 3. Logística e Frete
      let updatedShipping: ShippingOption = quote.shipping
        ? { ...quote.shipping }
        : {
            type: 'correios_pac',
            name: 'Correios PAC',
            price: 32.5,
            deliveryTime: '3 a 5 dias úteis',
            carrierName: 'Correios',
            cepOrigem: '01310-100',
            cidadeUfOrigem: 'São Paulo / SP',
            cepDestino: '',
            cidadeUf: '',
            fretePorConta: 'CIF',
          };

      if (data.shipping?.cepDestino) {
        updatedShipping.cepDestino = data.shipping.cepDestino;
      }
      if (data.shipping?.cidadeUf) {
        updatedShipping.cidadeUf = data.shipping.cidadeUf;
      }
      if (data.shipping?.shippingType) {
        updatedShipping.type = data.shipping.shippingType;
      }

      // 4. Itens do Orçamento
      let updatedItems: QuoteItem[] = [];
      let totalPiecesExtracted = 0;

      if (Array.isArray(data.items) && data.items.length > 0) {
        updatedItems = data.items.map((aiItem: any, idx: number) => {
          // Localiza o produto no catálogo
          const matchedProd = products.find((p) => p.id === aiItem.matchedProductId) || products[0];

          // Cria base limpa
          const baseItem = createInitialQuoteItem(
            matchedProd ? matchedProd.id : 'prod-tshirt-basic',
            `item-ai-${Date.now()}-${idx}`
          );

          // Grade de tamanhos
          const aiSizes = aiItem.sizes || {};
          const cleanSizes: SizeGrid = {
            pp: Number(aiSizes.pp) || 0,
            p: Number(aiSizes.p) || 0,
            m: Number(aiSizes.m) || 0,
            g: Number(aiSizes.g) || 0,
            gg: Number(aiSizes.gg) || 0,
            exg: Number(aiSizes.exg) || 0,
            g1: Number(aiSizes.g1) || 0,
            g2: Number(aiSizes.g2) || 0,
            tam02: Number(aiSizes.tam02) || 0,
            tam04: Number(aiSizes.tam04) || 0,
            tam06: Number(aiSizes.tam06) || 0,
            tam08: Number(aiSizes.tam08) || 0,
            tam10: Number(aiSizes.tam10) || 0,
            tam12: Number(aiSizes.tam12) || 0,
            tam14: Number(aiSizes.tam14) || 0,
            tam16: Number(aiSizes.tam16) || 0,
          };

          const itemTotalQty = Object.values(cleanSizes).reduce((acc, q) => acc + q, 0);
          totalPiecesExtracted += itemTotalQty;

          // Estamparia
          const printingConfig = { ...baseItem.printing };
          const technique = (aiItem.printing?.technique || 'none').toLowerCase();

          // Reseta todas
          printingConfig.silk.enabled = false;
          printingConfig.dtf.enabled = false;
          printingConfig.sublimation.enabled = false;
          printingConfig.vinyl.enabled = false;

          if (technique === 'silk') {
            printingConfig.silk.enabled = true;
            if (Array.isArray(aiItem.printing?.silkPositions) && aiItem.printing.silkPositions.length > 0) {
              printingConfig.silk.positions = aiItem.printing.silkPositions.map((pos: any, pIdx: number) => ({
                id: `silk-pos-${pIdx + 1}`,
                position: pos.position || 'Frente (Peito Pequeno)',
                colorsCount: Number(pos.colorsCount) || 1,
                inkType: 'Plastisol',
                inkCostPerPiece: 0.5,
              }));
            }
          } else if (technique === 'dtf') {
            printingConfig.dtf.enabled = true;
            if (Array.isArray(aiItem.printing?.dtfPositions) && aiItem.printing.dtfPositions.length > 0) {
              printingConfig.dtf.positions = aiItem.printing.dtfPositions.map((pos: any, pIdx: number) => ({
                id: `dtf-pos-${pIdx + 1}`,
                label: pos.label || 'Logo / Arte Estampa',
                widthCm: Number(pos.widthCm) || 15,
                heightCm: Number(pos.heightCm) || 15,
                pressLaborCost: 2.0,
              }));
            }
          } else if (technique === 'sublimation') {
            printingConfig.sublimation.enabled = true;
            printingConfig.sublimation.mode =
              aiItem.printing?.sublimationMode === 'total' ? 'total' : 'impressao_e_prensagem';
          } else if (technique === 'vinyl') {
            printingConfig.vinyl.enabled = true;
          }

          // Tecido
          const matchedFabric = fabrics.find((f) => f.id === aiItem.matchedFabricId) || fabrics[0];

          return {
            ...baseItem,
            title: aiItem.title && aiItem.title.trim() ? aiItem.title : matchedProd?.name || 'Camiseta',
            productTemplateId: matchedProd?.id || baseItem.productTemplateId,
            fabricId: matchedFabric ? matchedFabric.id : baseItem.fabricId,
            color: aiItem.color !== undefined ? aiItem.color : '',
            sizes: cleanSizes,
            printing: printingConfig,
            notes: aiItem.notes !== undefined ? aiItem.notes : '',
          };
        });
      } else {
        // Se nenhum item foi detectado, mantém os itens existentes
        updatedItems = quote.items;
      }

      // Se temos destino e peças, recalcula frete automaticamente
      if (updatedShipping.cepDestino && totalPiecesExtracted > 0) {
        const rates = calculateRealShippingRates({
          cepOrigem: updatedShipping.cepOrigem || '01310-100',
          cidadeUfOrigem: updatedShipping.cidadeUfOrigem,
          cepDestino: updatedShipping.cepDestino,
          cidadeUfDestino: updatedShipping.cidadeUf,
          weightKg: Math.max(0.5, totalPiecesExtracted * 0.22),
        });

        if (updatedShipping.type === 'correios_sedex') {
          updatedShipping.price = rates.sedex.price;
          updatedShipping.deliveryTime = rates.sedex.deliveryTime;
        } else if (updatedShipping.type === 'transportadora') {
          updatedShipping.price = rates.transportadora.price;
          updatedShipping.deliveryTime = rates.transportadora.deliveryTime;
        } else if (updatedShipping.type !== 'frete_gratis' && updatedShipping.type !== 'retirada') {
          updatedShipping.price = rates.pac.price;
          updatedShipping.deliveryTime = rates.pac.deliveryTime;
        }
      }

      // 5. Aplicar Orçamento Atualizado
      const finalQuote: Quote = {
        ...quote,
        clientType: updatedClientType,
        clientDocument: updatedClientDocument,
        clientName: updatedClientName,
        clientCompany: updatedClientCompany,
        clientPhone: updatedClientPhone,
        clientEmail: updatedClientEmail,
        sellerName: updatedSellerName,
        paymentTerms: updatedPaymentTerms,
        deliveryLeadTimeDays: updatedLeadDays,
        deliveryLeadTimeCustom: updatedLeadCustom,
        notes: updatedNotes,
        shipping: updatedShipping,
        items: updatedItems,
      };

      onUpdateQuote(finalQuote);

      setSuccessResult({
        summary: data.extractedSummary || 'Dados da conversa extraídos e aplicados com sucesso!',
        clientName: updatedClientName,
        itemsCount: updatedItems.length,
        totalPieces: totalPiecesExtracted,
      });
    } catch (err: any) {
      setError(err?.message || 'Falha ao processar a conversa com o assistente de IA.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[var(--bg-superficie)] border-2 border-[var(--nitro-azul)]/50 hover:border-[var(--nitro-azul)] rounded-2xl overflow-hidden shadow-xl shadow-black/20 transition-all duration-200">
      {/* Header do Card com Gradiente e Botão de Expandir/Recolher */}
      <div
        onClick={toggleOpen}
        className="p-4 sm:p-5 bg-gradient-to-r from-[var(--nitro-azul)]/15 via-[var(--bg-elevado)] to-[var(--bg-superficie)] border-b border-[var(--borda-sutil)] flex items-center justify-between gap-3 cursor-pointer select-none"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--nitro-azul)] to-indigo-600 text-white flex items-center justify-center shadow-md shadow-[var(--nitro-azul)]/30 shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs sm:text-sm font-black text-[var(--texto-primario)] uppercase tracking-wider">
                Assistente IA: Preenchimento Automático por Conversa
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-[var(--nitro-azul)] text-white text-[10px] font-mono font-bold uppercase tracking-wider shadow-sm">
                IA Nitro Inteligente
              </span>
            </div>
            <p className="text-[11px] text-[var(--texto-secundario)] mt-0.5">
              Cole a conversa do WhatsApp, e-mail ou anotações e a IA preencherá cliente, modelo, grade de tamanhos, cor e estampa.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="p-2 text-[var(--texto-secundario)] hover:text-[var(--texto-primario)] hover:bg-[var(--borda-hover)] rounded-xl transition-colors cursor-pointer shrink-0"
        >
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {/* Conteúdo Expansível */}
      {isOpen && (
        <div className="p-4 sm:p-6 space-y-4">
          {/* Caixa de Texto da Conversa */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="conversation-input"
                className="text-xs font-bold text-[var(--texto-primario)] flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[var(--nitro-azul)]" />
                <span>Conversa do Cliente (WhatsApp / E-mail / Anotações):</span>
              </label>

              {/* Botões de Exemplos Prontos */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-[var(--texto-mutado)] hidden sm:inline">Exemplos:</span>
                <button
                  type="button"
                  onClick={() => setConversationText(SAMPLE_CONVERSATION_1)}
                  className="px-2 py-1 rounded bg-[var(--bg-elevado)] hover:bg-[var(--borda-hover)] border border-[var(--borda-sutil)] text-[10px] font-semibold text-[var(--texto-secundario)] hover:text-[var(--texto-primario)] transition-colors cursor-pointer"
                >
                  Academia (WhatsApp)
                </button>
                <button
                  type="button"
                  onClick={() => setConversationText(SAMPLE_CONVERSATION_2)}
                  className="px-2 py-1 rounded bg-[var(--bg-elevado)] hover:bg-[var(--borda-hover)] border border-[var(--borda-sutil)] text-[10px] font-semibold text-[var(--texto-secundario)] hover:text-[var(--texto-primario)] transition-colors cursor-pointer"
                >
                  Colégio / Dry Fit
                </button>
              </div>
            </div>

            <textarea
              id="conversation-input"
              rows={5}
              value={conversationText}
              onChange={(e) => setConversationText(e.target.value)}
              placeholder={`Cole aqui o diálogo com o cliente... Exemplo:
"Olá! Sou a Camila da Drogaria Viva Bem (tel 11 98888-7777). Quero orçar 50 camisas polo piquet brancas com bordado/silk peito esquerdo. Grade: 10 P, 25 M, 15 G. Entrega em Osasco SP CEP 06010-000."`}
              className="w-full p-3.5 bg-[var(--bg-input)] border-2 border-[var(--borda-sutil)] focus:border-[var(--nitro-azul)] rounded-xl text-xs sm:text-sm text-[var(--texto-primario)] font-mono outline-none transition-colors duration-150 resize-y placeholder:text-[var(--texto-mutado)]"
            />

            <div className="flex items-center justify-between text-[11px] text-[var(--texto-mutado)] mt-1">
              <span>
                * Conforme solicitado: caso alguma informação não esteja presente na conversa, o campo correspondente ficará em branco.
              </span>
              {conversationText && (
                <span>{conversationText.length} caracteres</span>
              )}
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleProcessConversation}
                disabled={isLoading || !conversationText.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--nitro-azul)] to-indigo-600 hover:from-[var(--nitro-azul-hover)] hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md shadow-[var(--nitro-azul)]/25 transition-all duration-200 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Lendo conversa e extraindo dados...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Processar Conversa & Preencher Orçamento</span>
                  </>
                )}
              </button>

              {conversationText && !isLoading && (
                <button
                  type="button"
                  onClick={() => {
                    setConversationText('');
                    setError(null);
                    setSuccessResult(null);
                  }}
                  className="px-3 py-2.5 rounded-xl bg-[var(--bg-elevado)] hover:bg-[var(--borda-hover)] text-[var(--texto-secundario)] hover:text-[var(--perigo)] text-xs font-semibold border border-[var(--borda-sutil)] transition-colors cursor-pointer"
                  title="Limpar texto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Feedback de Erro */}
          {error && (
            <div className="p-3 bg-[var(--perigo-bg)] border border-[var(--perigo)]/40 rounded-xl text-xs text-[var(--perigo)] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Feedback de Sucesso com Resumo Visual dos Dados Preenchidos */}
          {successResult && (
            <div className="p-4 bg-[var(--sucesso-bg)] border border-[var(--sucesso)]/40 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-2 text-[var(--sucesso)] font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>Orçamento Preenchido com Sucesso pela IA!</span>
              </div>
              <p className="text-[var(--texto-primario)] font-medium leading-relaxed">
                {successResult.summary}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-[var(--texto-secundario)]">
                {successResult.clientName && (
                  <span className="flex items-center gap-1 font-semibold text-[var(--texto-primario)]">
                    <User className="w-3.5 h-3.5 text-[var(--nitro-azul)]" />
                    Cliente: {successResult.clientName}
                  </span>
                )}
                <span className="flex items-center gap-1 font-semibold text-[var(--texto-primario)]">
                  <Package className="w-3.5 h-3.5 text-[var(--nitro-primaria)]" />
                  {successResult.itemsCount} modelo(s) · {successResult.totalPieces} peças no total
                </span>
                <span className="text-[var(--sucesso)] font-bold">
                  ✓ Verifique abaixo os campos preenchidos e edite se necessário.
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
