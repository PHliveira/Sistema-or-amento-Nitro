'use client';

import React from 'react';
import { CalculatedQuoteTotals, DeliveryAddress, Fabric, Quote, Seller, ViewMode } from '../lib/types';
import { formatBRL } from '../lib/format';
import { buildStructuredOrderPayload } from '../lib/google-sheets-sync';
import { copyToClipboard } from '../lib/whatsapp-formatter';
import {
  FileText,
  Share2,
  Save,
  Plus,
  TrendingUp,
  Clock,
  Calendar,
  CreditCard,
  User,
  CheckCircle,
  Palette,
  Building2,
  ChevronDown,
  ChevronUp,
  MapPin,
  Search,
  RefreshCw,
  Code2,
  Copy,
  Check,
  X,
  Link as LinkIcon,
} from 'lucide-react';
import { ShippingOptionsSelector } from './ShippingOptionsSelector';

interface QuoteSummaryCardProps {
  quote: Quote;
  totals: CalculatedQuoteTotals;
  viewMode: ViewMode;
  onUpdateQuote: (updated: Quote) => void;
  onAddItem: () => void;
  onOpenPDF: () => void;
  onOpenWhatsApp: () => void;
  onSaveOrder: () => void;
  isSaving: boolean;
  saveMessage?: string | null;
  sellers?: Seller[];
  fabrics?: Fabric[];
  isClientCardExpanded?: boolean;
  onToggleClientCard?: () => void;
  isArtCardExpanded?: boolean;
  onToggleArtCard?: () => void;
  isShippingCardExpanded?: boolean;
  onToggleShippingCard?: () => void;
}

export const QuoteSummaryCard: React.FC<QuoteSummaryCardProps> = ({
  quote,
  totals,
  viewMode,
  onUpdateQuote,
  onAddItem,
  onOpenPDF,
  onOpenWhatsApp,
  onSaveOrder,
  isSaving,
  saveMessage,
  sellers = [],
  fabrics,
  isClientCardExpanded,
  onToggleClientCard,
  isArtCardExpanded,
  onToggleArtCard,
  isShippingCardExpanded,
  onToggleShippingCard,
}) => {
  const isPJ = quote.clientType === 'PJ';
  const [localClientOpen, setLocalClientOpen] = React.useState(true);
  const isClientOpen = isClientCardExpanded !== undefined ? isClientCardExpanded : localClientOpen;

  const toggleClientOpen = () => {
    if (onToggleClientCard) {
      onToggleClientCard();
    } else {
      setLocalClientOpen(!localClientOpen);
    }
  };

  const [localArtOpen, setLocalArtOpen] = React.useState(true);
  const isArtOpen = isArtCardExpanded !== undefined ? isArtCardExpanded : localArtOpen;

  const toggleArtOpen = () => {
    if (onToggleArtCard) {
      onToggleArtCard();
    } else {
      setLocalArtOpen(!localArtOpen);
    }
  };

  const [isLookingUpCep, setIsLookingUpCep] = React.useState(false);
  const [cepLookupError, setCepLookupError] = React.useState<string | null>(null);
  const [isPayloadModalOpen, setIsPayloadModalOpen] = React.useState(false);
  const [copiedJson, setCopiedJson] = React.useState(false);

  const addr: DeliveryAddress = quote.deliveryAddress || {
    cep: quote.shipping?.cepDestino || '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  };

  const formatCepInput = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  };

  const updateAddressField = (patch: Partial<DeliveryAddress>) => {
    const nextAddr: DeliveryAddress = { ...addr, ...patch };
    const nextCityUf =
      nextAddr.city && nextAddr.state
        ? `${nextAddr.city} / ${nextAddr.state}`
        : nextAddr.city || quote.shipping?.cidadeUf || '';

    onUpdateQuote({
      ...quote,
      deliveryAddress: nextAddr,
      shipping: quote.shipping
        ? {
            ...quote.shipping,
            cepDestino: nextAddr.cep || quote.shipping.cepDestino,
            cidadeUf: nextCityUf || quote.shipping.cidadeUf,
          }
        : undefined,
    });
  };

  const handleLookupAddressCep = async () => {
    const rawCep = (addr.cep || '').replace(/\D/g, '');
    if (rawCep.length !== 8) {
      setCepLookupError('Informe um CEP válido com 8 dígitos.');
      return;
    }
    setCepLookupError(null);
    setIsLookingUpCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
      const data = await res.json();
      if (data.erro) {
        setCepLookupError('CEP não encontrado.');
      } else {
        const formattedCep = formatCepInput(rawCep);
        const city = data.localidade || addr.city;
        const state = (data.uf || addr.state || '').toUpperCase();
        const nextAddr: DeliveryAddress = {
          ...addr,
          cep: formattedCep,
          street: data.logradouro || addr.street,
          neighborhood: data.bairro || addr.neighborhood,
          city,
          state,
        };
        onUpdateQuote({
          ...quote,
          deliveryAddress: nextAddr,
          shipping: quote.shipping
            ? {
                ...quote.shipping,
                cepDestino: formattedCep,
                cidadeUf: city && state ? `${city} / ${state}` : quote.shipping.cidadeUf,
              }
            : undefined,
        });
      }
    } catch {
      setCepLookupError('Falha ao consultar ViaCEP.');
    } finally {
      setIsLookingUpCep(false);
    }
  };

  const structuredPayload = React.useMemo(() => {
    if (!isPayloadModalOpen) return null;
    return buildStructuredOrderPayload(quote, totals, fabrics);
  }, [isPayloadModalOpen, quote, totals, fabrics]);

  const handleApplyMarginToAll = (marginPct: number) => {
    const updatedItems = quote.items.map((item) => ({
      ...item,
      itemProfitMarginPct: marginPct,
    }));
    onUpdateQuote({
      ...quote,
      overallProfitMarginPct: marginPct,
      items: updatedItems,
    });
  };

  return (
    <div className="space-y-6">
      {/* Botão Adicionar Mais Itens ao Orçamento */}
      <button
        type="button"
        onClick={onAddItem}
        className="w-full py-3.5 px-4 bg-[var(--bg-superficie)] hover:bg-[var(--bg-elevado)] border-2 border-dashed border-[var(--borda-sutil)] hover:border-[var(--nitro-primaria)]/60 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-[var(--texto-secundario)] hover:text-[var(--texto-primario)] transition-all duration-200 ease-out shadow-sm group cursor-pointer"
      >
        <span className="w-6 h-6 rounded-lg bg-[var(--bg-elevado)] group-hover:bg-[var(--nitro-primaria)] text-[var(--texto-secundario)] group-hover:text-[var(--texto-primario)] flex items-center justify-center transition-colors duration-200">
          <Plus className="w-4 h-4" />
        </span>
        <span>Adicionar Outro Produto neste Orçamento (Ex: Calça, Polo, Moletom)</span>
      </button>

      {/* Card de Dados do Cliente e Condições */}
      <div className="bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-2xl overflow-hidden shadow-sm transition-colors duration-200">
        <div
          onClick={toggleClientOpen}
          className="flex flex-wrap items-center justify-between gap-2 p-4 md:px-6 bg-[var(--bg-elevado)]/70 hover:bg-[var(--bg-elevado)] cursor-pointer select-none transition-colors border-b border-[var(--borda-sutil)]"
        >
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-bold text-[var(--texto-primario)] uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-[var(--nitro-primaria)]" />
              Dados do Cliente & Proposta Comercial
            </span>

            {/* Resumo compacto quando recolhido */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded-full bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] text-[11px] text-[var(--texto-secundario)] font-semibold">
                {isPJ ? 'PJ' : 'PF'}
              </span>
              {(quote.clientName || quote.clientCompany) && (
                <span className="px-2 py-0.5 rounded-full bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] text-[11px] text-[var(--texto-primario)] font-bold truncate max-w-[200px]">
                  {quote.clientCompany || quote.clientName}
                </span>
              )}
              {quote.clientPhone && (
                <span className="px-2 py-0.5 rounded-full bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] text-[11px] text-[var(--texto-secundario)] font-mono">
                  {quote.clientPhone}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[var(--texto-secundario)]">
              Nº {quote.quoteNumber}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleClientOpen();
              }}
              title={isClientOpen ? 'Recolher dados do cliente' : 'Expandir dados do cliente'}
              className="p-1.5 bg-[var(--bg-superficie)] hover:bg-[var(--borda-hover)] text-[var(--texto-secundario)] hover:text-[var(--texto-primario)] rounded-lg transition-colors cursor-pointer"
            >
              {isClientOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {isClientOpen && (
          <div className="p-4 md:p-6 space-y-4">

        {/* Escolha Exclusiva de Tipo de Cliente: Pessoa Física (PF) vs Pessoa Jurídica (PJ) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-[var(--bg-elevado)] border border-[var(--borda-sutil)] rounded-xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--texto-primario)]">Tipo de Cliente:</span>
            <span className="text-[11px] text-[var(--texto-secundario)]">
              {isPJ ? 'Cadastro empresarial com CNPJ e Razão Social' : 'Cadastro individual com CPF'}
            </span>
          </div>

          <div className="inline-flex p-1 bg-[var(--bg-input)] rounded-xl border border-[var(--borda-sutil)] shrink-0">
            <button
              type="button"
              onClick={() => onUpdateQuote({ ...quote, clientType: 'PF' })}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                !isPJ
                  ? 'bg-[var(--nitro-primaria)] text-white shadow-sm'
                  : 'text-[var(--texto-secundario)] hover:text-[var(--texto-primario)]'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Pessoa Física (PF)</span>
            </button>
            <button
              type="button"
              onClick={() => onUpdateQuote({ ...quote, clientType: 'PJ' })}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isPJ
                  ? 'bg-[var(--nitro-primaria)] text-white shadow-sm'
                  : 'text-[var(--texto-secundario)] hover:text-[var(--texto-primario)]'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Pessoa Jurídica (PJ)</span>
            </button>
          </div>
        </div>

        {/* Campos Dinâmicos de Acordo com PF ou PJ */}
        {!isPJ ? (
          /* MODO PESSOA FÍSICA (PF) */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            <div className="lg:col-span-2">
              <label className="text-[var(--texto-secundario)] font-medium block mb-1">Nome Completo do Cliente *</label>
              <input
                type="text"
                value={quote.clientName}
                placeholder="Ex: João da Silva Santos"
                onChange={(e) => onUpdateQuote({ ...quote, clientName: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] font-medium focus:border-[var(--nitro-primaria)] focus:ring-1 focus:ring-[var(--nitro-primaria)] outline-none transition-colors duration-150"
              />
            </div>

            <div>
              <label className="text-[var(--texto-secundario)] font-medium block mb-1">CPF</label>
              <input
                type="text"
                value={quote.clientDocument || ''}
                placeholder="000.000.000-00"
                onChange={(e) => onUpdateQuote({ ...quote, clientDocument: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] font-mono focus:border-[var(--nitro-primaria)] focus:ring-1 focus:ring-[var(--nitro-primaria)] outline-none transition-colors duration-150"
              />
            </div>

            <div>
              <label className="text-[var(--texto-secundario)] font-medium block mb-1">WhatsApp / Telefone</label>
              <input
                type="text"
                value={quote.clientPhone}
                placeholder="(11) 99999-9999"
                onChange={(e) => onUpdateQuote({ ...quote, clientPhone: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] font-mono focus:border-[var(--nitro-primaria)] focus:ring-1 focus:ring-[var(--nitro-primaria)] outline-none transition-colors duration-150"
              />
            </div>

            <div>
              <label className="text-[var(--texto-secundario)] font-medium block mb-1">E-mail</label>
              <input
                type="email"
                value={quote.clientEmail || ''}
                placeholder="cliente@email.com"
                onChange={(e) => onUpdateQuote({ ...quote, clientEmail: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] focus:border-[var(--nitro-primaria)] focus:ring-1 focus:ring-[var(--nitro-primaria)] outline-none transition-colors duration-150"
              />
            </div>

            <div>
              <label className="text-[var(--texto-secundario)] font-medium block mb-1">Vendedor Responsável</label>
              <select
                value={quote.sellerName}
                onChange={(e) => {
                  const selName = e.target.value;
                  const matched = sellers.find((s) => s.name === selName);
                  const newCommPct = matched?.defaultCommissionPct !== undefined ? matched.defaultCommissionPct : (quote.sellerCommissionPct ?? 5);
                  onUpdateQuote({
                    ...quote,
                    sellerName: selName,
                    sellerCommissionPct: newCommPct,
                  });
                }}
                className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] font-semibold focus:border-[var(--nitro-primaria)] outline-none transition-colors duration-150"
              >
                <option value="">Selecione o vendedor...</option>
                {sellers
                  .filter((s) => s.active !== false)
                  .map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} {s.defaultCommissionPct !== undefined ? `(${s.defaultCommissionPct}%)` : ''}
                    </option>
                  ))}
                {quote.sellerName && !sellers.some((s) => s.name === quote.sellerName) && (
                  <option value={quote.sellerName}>{quote.sellerName}</option>
                )}
              </select>
            </div>

            {/* Campo de Comissão do Vendedor na Proposta */}
            <div className="sm:col-span-2 lg:col-span-4 p-3 bg-[var(--bg-elevado)] rounded-xl border border-[var(--borda-sutil)]">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-bold text-[var(--texto-primario)] flex items-center gap-1.5 uppercase">
                  Comissão do Vendedor no Pedido
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[var(--texto-secundario)]">Valor da Comissão:</span>
                  <span className="font-mono font-bold text-xs text-[var(--nitro-primaria)] px-2 py-0.5 rounded bg-[var(--bg-superficie)] border border-[var(--nitro-primaria)]/30">
                    {formatBRL(totals.sellerCommissionFee)}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-[var(--texto-secundario)] font-medium">Percentual:</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="50"
                      value={quote.sellerCommissionPct !== undefined ? quote.sellerCommissionPct : 5}
                      onChange={(e) => {
                        const pct = parseFloat(e.target.value) || 0;
                        onUpdateQuote({
                          ...quote,
                          sellerCommissionPct: pct,
                        });
                      }}
                      className="w-20 px-2.5 py-1.5 bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-lg text-xs font-mono font-bold text-[var(--texto-primario)] text-center focus:border-[var(--nitro-primaria)] outline-none"
                    />
                    <span className="text-xs font-bold text-[var(--texto-secundario)]">%</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  {[0, 2, 3, 5, 7, 10].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => onUpdateQuote({ ...quote, sellerCommissionPct: pct })}
                      className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                        (quote.sellerCommissionPct ?? 5) === pct
                          ? 'bg-[var(--nitro-primaria)] text-white shadow-sm'
                          : 'bg-[var(--bg-superficie)] hover:bg-[var(--borda-hover)] text-[var(--texto-secundario)] border border-[var(--borda-sutil)]'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>

                <span className="text-[10px] text-[var(--texto-mutado)] hidden md:inline ml-auto">
                  * Calculada sobre o valor dos produtos ({formatBRL(totals.totalProductsSellingPrice)})
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* MODO PESSOA JURÍDICA (PJ) */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="text-[var(--texto-secundario)] font-medium block mb-1">Razão Social / Nome da Empresa *</label>
              <input
                type="text"
                value={quote.clientCompany || ''}
                placeholder="Ex: Nitro Uniformes e Confecções Ltda"
                onChange={(e) => onUpdateQuote({ ...quote, clientCompany: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] font-medium focus:border-[var(--nitro-primaria)] focus:ring-1 focus:ring-[var(--nitro-primaria)] outline-none transition-colors duration-150"
              />
            </div>

            <div>
              <label className="text-[var(--texto-secundario)] font-medium block mb-1">CNPJ</label>
              <input
                type="text"
                value={quote.clientDocument || ''}
                placeholder="00.000.000/0001-00"
                onChange={(e) => onUpdateQuote({ ...quote, clientDocument: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] font-mono focus:border-[var(--nitro-primaria)] focus:ring-1 focus:ring-[var(--nitro-primaria)] outline-none transition-colors duration-150"
              />
            </div>

            <div>
              <label className="text-[var(--texto-secundario)] font-medium block mb-1">Nome do Contato / Responsável</label>
              <input
                type="text"
                value={quote.clientName}
                placeholder="Ex: Roberto Alves (Diretor de Compras)"
                onChange={(e) => onUpdateQuote({ ...quote, clientName: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] font-medium focus:border-[var(--nitro-primaria)] focus:ring-1 focus:ring-[var(--nitro-primaria)] outline-none transition-colors duration-150"
              />
            </div>

            <div>
              <label className="text-[var(--texto-secundario)] font-medium block mb-1">WhatsApp / Telefone Comercial</label>
              <input
                type="text"
                value={quote.clientPhone}
                placeholder="(11) 99999-9999"
                onChange={(e) => onUpdateQuote({ ...quote, clientPhone: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] font-mono focus:border-[var(--nitro-primaria)] focus:ring-1 focus:ring-[var(--nitro-primaria)] outline-none transition-colors duration-150"
              />
            </div>

            <div>
              <label className="text-[var(--texto-secundario)] font-medium block mb-1">E-mail Comercial</label>
              <input
                type="email"
                value={quote.clientEmail || ''}
                placeholder="compras@empresa.com.br"
                onChange={(e) => onUpdateQuote({ ...quote, clientEmail: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] focus:border-[var(--nitro-primaria)] focus:ring-1 focus:ring-[var(--nitro-primaria)] outline-none transition-colors duration-150"
              />
            </div>

            <div>
              <label className="text-[var(--texto-secundario)] font-medium block mb-1">Vendedor Responsável</label>
              <select
                value={quote.sellerName}
                onChange={(e) => {
                  const selName = e.target.value;
                  const matched = sellers.find((s) => s.name === selName);
                  const newCommPct = matched?.defaultCommissionPct !== undefined ? matched.defaultCommissionPct : (quote.sellerCommissionPct ?? 5);
                  onUpdateQuote({
                    ...quote,
                    sellerName: selName,
                    sellerCommissionPct: newCommPct,
                  });
                }}
                className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] font-semibold focus:border-[var(--nitro-primaria)] outline-none transition-colors duration-150"
              >
                <option value="">Selecione o vendedor...</option>
                {sellers
                  .filter((s) => s.active !== false)
                  .map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} {s.defaultCommissionPct !== undefined ? `(${s.defaultCommissionPct}%)` : ''}
                    </option>
                  ))}
                {quote.sellerName && !sellers.some((s) => s.name === quote.sellerName) && (
                  <option value={quote.sellerName}>{quote.sellerName}</option>
                )}
              </select>
            </div>

            {/* Campo de Comissão do Vendedor na Proposta PJ */}
            <div className="sm:col-span-2 lg:col-span-3 p-3 bg-[var(--bg-elevado)] rounded-xl border border-[var(--borda-sutil)]">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-bold text-[var(--texto-primario)] flex items-center gap-1.5 uppercase">
                  Comissão do Vendedor no Pedido
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[var(--texto-secundario)]">Valor da Comissão:</span>
                  <span className="font-mono font-bold text-xs text-[var(--nitro-primaria)] px-2 py-0.5 rounded bg-[var(--bg-superficie)] border border-[var(--nitro-primaria)]/30">
                    {formatBRL(totals.sellerCommissionFee)}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-[var(--texto-secundario)] font-medium">Percentual:</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="50"
                      value={quote.sellerCommissionPct !== undefined ? quote.sellerCommissionPct : 5}
                      onChange={(e) => {
                        const pct = parseFloat(e.target.value) || 0;
                        onUpdateQuote({
                          ...quote,
                          sellerCommissionPct: pct,
                        });
                      }}
                      className="w-20 px-2.5 py-1.5 bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-lg text-xs font-mono font-bold text-[var(--texto-primario)] text-center focus:border-[var(--nitro-primaria)] outline-none"
                    />
                    <span className="text-xs font-bold text-[var(--texto-secundario)]">%</span>
                  </div>
                </div>

                {/* Presets de Comissão */}
                <div className="flex flex-wrap items-center gap-1">
                  {[0, 2, 3, 5, 7, 10].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => onUpdateQuote({ ...quote, sellerCommissionPct: pct })}
                      className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                        (quote.sellerCommissionPct ?? 5) === pct
                          ? 'bg-[var(--nitro-primaria)] text-white shadow-sm'
                          : 'bg-[var(--bg-superficie)] hover:bg-[var(--borda-hover)] text-[var(--texto-secundario)] border border-[var(--borda-sutil)]'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>

                <span className="text-[10px] text-[var(--texto-mutado)] hidden md:inline ml-auto">
                  * Calculada sobre o valor dos produtos ({formatBRL(totals.totalProductsSellingPrice)})
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Dados de Entrega: Endereço Completo Separado */}
        <div className="p-3.5 bg-[var(--bg-elevado)] border border-[var(--borda-sutil)] rounded-xl space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--borda-sutil)]/70 pb-2">
            <span className="text-xs font-bold text-[var(--texto-primario)] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[var(--nitro-primaria)]" />
              <span>Endereço Completo de Entrega</span>
            </span>
            <span className="text-[11px] text-[var(--texto-mutado)]">
              Sincronizado automaticamente com o cálculo de frete e o banco de pedidos
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 text-xs">
            <div className="lg:col-span-1">
              <label className="text-[var(--texto-secundario)] font-medium block mb-1">CEP</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  maxLength={9}
                  value={addr.cep}
                  placeholder="00000-000"
                  onChange={(e) => updateAddressField({ cep: formatCepInput(e.target.value) })}
                  className="w-full min-w-0 px-2.5 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] font-mono font-semibold focus:border-[var(--nitro-primaria)] outline-none"
                />
                <button
                  type="button"
                  onClick={handleLookupAddressCep}
                  disabled={isLookingUpCep}
                  title="Buscar endereço pelo CEP"
                  className="px-2.5 py-2 bg-[var(--nitro-primaria)] hover:bg-[var(--nitro-primaria-hover)] disabled:opacity-50 text-white rounded-xl transition-colors cursor-pointer shrink-0"
                >
                  {isLookingUpCep ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                </button>
              </div>
              {cepLookupError && (
                <span className="text-[10px] text-[var(--perigo)] mt-0.5 block">{cepLookupError}</span>
              )}
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-[var(--texto-secundario)] font-medium block mb-1">Rua / Logradouro</label>
              <input
                type="text"
                value={addr.street}
                placeholder="Ex: Av. Paulista, Rua das Malhas"
                onChange={(e) => updateAddressField({ street: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] font-medium focus:border-[var(--nitro-primaria)] outline-none"
              />
            </div>

            <div className="lg:col-span-1">
              <label className="text-[var(--texto-secundario)] font-medium block mb-1">Número</label>
              <input
                type="text"
                value={addr.number}
                placeholder="Ex: 1200"
                onChange={(e) => updateAddressField({ number: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] font-mono focus:border-[var(--nitro-primaria)] outline-none"
              />
            </div>

            <div className="lg:col-span-1">
              <label className="text-[var(--texto-secundario)] font-medium block mb-1">Complemento</label>
              <input
                type="text"
                value={addr.complement || ''}
                placeholder="Sala, Bloco, Galpão"
                onChange={(e) => updateAddressField({ complement: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] focus:border-[var(--nitro-primaria)] outline-none"
              />
            </div>

            <div className="sm:col-span-1 lg:col-span-2">
              <label className="text-[var(--texto-secundario)] font-medium block mb-1">Bairro</label>
              <input
                type="text"
                value={addr.neighborhood}
                placeholder="Ex: Centro, Brás"
                onChange={(e) => updateAddressField({ neighborhood: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] focus:border-[var(--nitro-primaria)] outline-none"
              />
            </div>

            <div className="sm:col-span-1 lg:col-span-3">
              <label className="text-[var(--texto-secundario)] font-medium block mb-1">Cidade</label>
              <input
                type="text"
                value={addr.city}
                placeholder="Ex: São Paulo"
                onChange={(e) => updateAddressField({ city: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] font-medium focus:border-[var(--nitro-primaria)] outline-none"
              />
            </div>

            <div className="lg:col-span-1">
              <label className="text-[var(--texto-secundario)] font-medium block mb-1">UF</label>
              <input
                type="text"
                maxLength={2}
                value={addr.state}
                placeholder="SP"
                onChange={(e) => updateAddressField({ state: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] font-mono font-bold uppercase text-center focus:border-[var(--nitro-primaria)] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Condições de Pagamento, Prazo de Produção e Validade Editáveis */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
          {/* Condições de Pagamento */}
          <div>
            <label className="text-[var(--texto-secundario)] font-semibold flex items-center gap-1.5 mb-1">
              <CreditCard className="w-3.5 h-3.5 text-[var(--texto-secundario)]" />
              Condições de Pagamento
            </label>
            <input
              type="text"
              value={quote.paymentTerms}
              placeholder="Ex: 50% no pedido + 50% na entrega"
              onChange={(e) => onUpdateQuote({ ...quote, paymentTerms: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] font-medium focus:border-[var(--nitro-primaria)] focus:ring-1 focus:ring-[var(--nitro-primaria)] outline-none transition-colors duration-150"
            />
            <div className="flex flex-wrap gap-1 mt-1.5">
              {['50% + 50%', 'À vista 5% desc.', 'Boleto 28 dias', 'Cartão 3x'].map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => onUpdateQuote({ ...quote, paymentTerms: term })}
                  className="px-1.5 py-0.5 rounded bg-[var(--bg-elevado)] hover:bg-[var(--borda-hover)] text-[10px] text-[var(--texto-secundario)] hover:text-[var(--texto-primario)] transition-colors cursor-pointer"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          {/* Prazo de Produção (Editável em Dias Úteis + Texto Personalizado) */}
          <div>
            <label className="text-[var(--texto-secundario)] font-semibold flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-[var(--nitro-primaria)]" />
              Prazo de Produção (Dias Úteis)
            </label>
            <div className="flex gap-1.5">
              <input
                type="number"
                min="1"
                value={quote.deliveryLeadTimeDays}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  onUpdateQuote({
                    ...quote,
                    deliveryLeadTimeDays: val,
                  });
                }}
                className="w-20 px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] font-bold font-mono focus:border-[var(--nitro-primaria)] focus:ring-1 focus:ring-[var(--nitro-primaria)] outline-none transition-colors duration-150"
              />
              <input
                type="text"
                value={quote.deliveryLeadTimeCustom || ''}
                placeholder="Ex: 10 a 15 dias úteis..."
                onChange={(e) =>
                  onUpdateQuote({
                    ...quote,
                    deliveryLeadTimeCustom: e.target.value,
                  })
                }
                className="flex-1 px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] text-xs font-medium focus:border-[var(--nitro-primaria)] focus:ring-1 focus:ring-[var(--nitro-primaria)] outline-none transition-colors duration-150"
              />
            </div>
            {/* Presets Rápidos de Prazo */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {[5, 7, 10, 15, 20, 25].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() =>
                    onUpdateQuote({
                      ...quote,
                      deliveryLeadTimeDays: days,
                      deliveryLeadTimeCustom: `${days} dias úteis`,
                    })
                  }
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                    quote.deliveryLeadTimeDays === days
                      ? 'bg-[var(--nitro-primaria)] text-white font-bold'
                      : 'bg-[var(--bg-elevado)] hover:bg-[var(--borda-hover)] text-[var(--texto-secundario)]'
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>
          </div>

          {/* Validade do Orçamento (Editável em Dias + Data Específica de Expiração) */}
          <div>
            <label className="text-[var(--texto-secundario)] font-semibold flex items-center gap-1.5 mb-1">
              <Calendar className="w-3.5 h-3.5 text-[var(--nitro-azul)]" />
              Validade do Orçamento (Dias / Até)
            </label>
            <div className="flex gap-1.5">
              <input
                type="number"
                min="1"
                value={quote.validityDays}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  const base = quote.createdAt ? new Date(quote.createdAt) : new Date();
                  const target = new Date(base.getTime());
                  target.setDate(target.getDate() + val);
                  onUpdateQuote({
                    ...quote,
                    validityDays: val,
                    validityDate: target.toISOString().split('T')[0],
                  });
                }}
                className="w-18 px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] font-bold font-mono focus:border-[var(--nitro-primaria)] focus:ring-1 focus:ring-[var(--nitro-primaria)] outline-none transition-colors duration-150"
              />
              <input
                type="date"
                value={
                  quote.validityDate ||
                  (() => {
                    const base = quote.createdAt ? new Date(quote.createdAt) : new Date();
                    const target = new Date(base.getTime());
                    target.setDate(target.getDate() + (quote.validityDays || 10));
                    return target.toISOString().split('T')[0];
                  })()
                }
                onChange={(e) => {
                  const dateStr = e.target.value;
                  if (!dateStr) return;
                  const target = new Date(dateStr + 'T12:00:00');
                  const base = new Date(quote.createdAt || new Date());
                  const diffDays = Math.max(
                    1,
                    Math.round((target.getTime() - base.getTime()) / (1000 * 60 * 60 * 24))
                  );
                  onUpdateQuote({
                    ...quote,
                    validityDays: diffDays,
                    validityDate: dateStr,
                  });
                }}
                className="flex-1 px-2.5 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] text-xs font-mono font-medium focus:border-[var(--nitro-primaria)] focus:ring-1 focus:ring-[var(--nitro-primaria)] outline-none transition-colors duration-150"
              />
            </div>
            {/* Presets Rápidos de Validade */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {[5, 7, 10, 15, 30].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => {
                    const base = quote.createdAt ? new Date(quote.createdAt) : new Date();
                    const target = new Date(base.getTime());
                    target.setDate(target.getDate() + days);
                    onUpdateQuote({
                      ...quote,
                      validityDays: days,
                      validityDate: target.toISOString().split('T')[0],
                    });
                  }}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                    quote.validityDays === days
                      ? 'bg-[var(--nitro-azul)] text-white font-bold'
                      : 'bg-[var(--bg-elevado)] hover:bg-[var(--borda-hover)] text-[var(--texto-secundario)]'
                  }`}
                >
                  {days} dias
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Observações Gerais */}
        <div>
          <label className="text-[var(--texto-secundario)] font-medium block mb-1 text-xs">
            Observações Comerciais da Proposta
          </label>
          <input
            type="text"
            value={quote.notes || ''}
            placeholder="Ex: Amostra virtual inclusa para aprovação de arte. Frete FOB São Paulo."
            onChange={(e) => onUpdateQuote({ ...quote, notes: e.target.value })}
            className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-xs text-[var(--texto-primario)] placeholder-[var(--texto-mutado)] focus:border-[var(--nitro-primaria)] focus:ring-1 focus:ring-[var(--nitro-primaria)] outline-none transition-colors duration-150"
          />
        </div>
      </div>
    )}
  </div>

      {/* Card de Cobrança de Criação de Arte / Mockup Geral do Pedido (com opção de recolher) */}
      <div className="bg-[var(--bg-superficie)] border-2 border-[var(--borda-sutil)] rounded-2xl overflow-hidden transition-colors duration-200 shadow-md">
        <div
          onClick={toggleArtOpen}
          className="flex flex-wrap items-center justify-between gap-3 p-4 md:p-6 border-b border-[var(--borda-sutil)] cursor-pointer hover:bg-[var(--bg-elevado)]/40 transition-colors select-none"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30 shrink-0">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-extrabold text-[var(--texto-primario)] uppercase tracking-wider">
                  Serviço de Criação de Arte & Mockup
                </h3>
                {(quote.artCreationFee || 0) > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                    {formatBRL(quote.artCreationFee || 0)}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[var(--texto-secundario)]">
                Cobrança de design gráfico, vetorização e montagem de mockups para aprovação
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[var(--texto-secundario)] hidden sm:inline">
                Taxa de Arte do Pedido:
              </span>
              <span
                className={`text-sm sm:text-base font-black font-mono px-3 py-1 rounded-xl border ${
                  (quote.artCreationFee || 0) === 0
                    ? 'bg-[var(--sucesso-bg)] border-[var(--sucesso)]/40 text-[var(--sucesso)]'
                    : 'bg-[var(--bg-elevado)] border-purple-500/50 text-purple-400 shadow-sm'
                }`}
              >
                {(quote.artCreationFee || 0) === 0 ? 'CORTESIA (R$ 0,00)' : formatBRL(quote.artCreationFee || 0)}
              </span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleArtOpen();
              }}
              className="p-1.5 rounded-lg text-[var(--texto-secundario)] hover:text-[var(--texto-primario)] hover:bg-[var(--borda-hover)] transition-colors cursor-pointer"
              title={isArtOpen ? 'Recolher este card' : 'Expandir este card'}
            >
              {isArtOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {isArtOpen && (
          <div className="p-4 md:p-6 space-y-3">
            <div className="p-3.5 bg-[var(--bg-elevado)] rounded-xl border border-[var(--borda-sutil)] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[var(--texto-secundario)] mb-1">
                    Valor Cobrado pelo Serviço de Arte (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[var(--texto-mutado)] font-mono text-xs font-bold pointer-events-none">
                      R$
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={quote.artCreationFee || 0}
                      onChange={(e) =>
                        onUpdateQuote({
                          ...quote,
                          artCreationFee: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0.00"
                      className="w-36 pl-9 pr-3 py-2 bg-[var(--bg-superficie)] border-2 border-purple-500/50 focus:border-purple-400 rounded-xl text-sm font-mono font-black text-purple-400 outline-none shadow-inner"
                    />
                  </div>
                </div>

                {/* Presets Rápidos de Valor de Arte */}
                <div className="flex flex-wrap items-center gap-1.5 pt-4">
                  {[0, 50, 80, 100, 150, 200].map((fee) => (
                    <button
                      key={fee}
                      type="button"
                      onClick={() => onUpdateQuote({ ...quote, artCreationFee: fee })}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        (quote.artCreationFee || 0) === fee
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-[var(--bg-superficie)] hover:bg-[var(--borda-hover)] text-[var(--texto-secundario)] border border-[var(--borda-sutil)]'
                      }`}
                    >
                      {fee === 0 ? 'Isento / Grátis' : `R$ ${fee}`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-right text-[11px] text-[var(--texto-secundario)]">
                <span>Total Cobrado em Arte/Mockup na Proposta: </span>
                <strong className="text-[var(--texto-primario)] font-mono text-xs block">
                  {formatBRL(totals.artCreationCost)}
                </strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Seletor de Opções de Envio (Correios, Transportadora, Frete Grátis, Retirada) */}
      <ShippingOptionsSelector
        shipping={quote.shipping}
        onUpdateShipping={(updatedShipping) =>
          onUpdateQuote({
            ...quote,
            shipping: updatedShipping,
          })
        }
        totalPieces={totals.totalQuantity}
        isExpanded={isShippingCardExpanded}
        onToggleExpand={onToggleShippingCard}
      />

      {/* Resumo Financeiro & Ações de Fechamento */}
      <div className="bg-gradient-to-br from-[var(--bg-superficie)] to-[var(--bg-input)] border-2 border-[var(--nitro-primaria)]/40 rounded-2xl p-5 md:p-6 shadow-xl shadow-black/40 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--borda-sutil)]">
          <div>
            <span className="text-xs font-bold text-[var(--texto-secundario)] uppercase tracking-wider block">
              Resumo Geral do Orçamento
            </span>
            <span className="text-2xl md:text-3xl font-black text-[var(--texto-primario)] font-mono">
              {totals.totalQuantity} <span className="text-base font-medium text-[var(--texto-secundario)]">peças no total</span>
            </span>
            {(quote.items.some((i) => i.approvedMockupUrl || i.finalArtUrl) ||
              quote.items.some((i) => i.mockupImages && i.mockupImages.length > 0)) && (
              <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-[var(--nitro-azul)]">
                <LinkIcon className="w-3.5 h-3.5" />
                <span>
                  {quote.items.filter((i) => i.approvedMockupUrl || i.finalArtUrl).length} itens com links de produção (mockup/arte)
                </span>
              </div>
            )}
          </div>

          {/* Ajuste de Margem Global no Modo Gerente com casas decimais completas sem arredondamento */}
          {viewMode === 'manager' && (
            <div className="flex items-center gap-3 bg-[var(--bg-input)] px-3.5 py-2 rounded-xl border border-[var(--borda-sutil)]">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--texto-secundario)]">
                <TrendingUp className="w-4 h-4 text-[var(--sucesso)]" />
                <span>Margem Geral:</span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="any"
                  min="0"
                  max="500"
                  value={quote.overallProfitMarginPct}
                  onChange={(e) => handleApplyMarginToAll(parseFloat(e.target.value) || 0)}
                  className="w-16 text-center py-1 bg-[var(--bg-elevado)] border border-[var(--borda-sutil)] rounded-lg text-xs font-bold text-[var(--texto-primario)] font-mono focus:border-[var(--nitro-primaria)] outline-none"
                />
                <span className="text-xs text-[var(--texto-secundario)] font-bold">%</span>
              </div>
            </div>
          )}

          {/* Detalhamento de Produtos + Arte + Frete = Total */}
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4 text-right">
            <div className="text-right border-r sm:pr-4 border-[var(--borda-sutil)]/50 hidden sm:block space-y-0.5">
              <div className="text-[11px] text-[var(--texto-secundario)] font-medium">
                Produtos ({totals.totalQuantity} pçs):{' '}
                <span className="font-mono font-bold text-[var(--texto-primario)]">
                  {formatBRL(totals.totalProductsSellingPrice)}
                </span>
              </div>
              {totals.artCreationCost > 0 && (
                <div className="text-[11px] text-[var(--texto-secundario)] font-medium">
                  Criação Arte/Mockup:{' '}
                  <span className="font-mono font-bold text-purple-400">
                    +{formatBRL(totals.artCreationCost)}
                  </span>
                </div>
              )}
              <div className="text-[11px] text-[var(--texto-secundario)] font-medium">
                Envio ({quote.shipping?.name || 'Frete'}):{' '}
                <span
                  className={`font-mono font-bold ${
                    totals.shippingCost === 0
                      ? 'text-[var(--sucesso)]'
                      : 'text-[var(--nitro-primaria)]'
                  }`}
                >
                  {totals.shippingCost === 0 ? 'Grátis (R$ 0,00)' : formatBRL(totals.shippingCost)}
                </span>
              </div>
              {/* Linha de comissão do vendedor na proposta */}
              <div className="text-[11px] text-[var(--texto-secundario)] font-medium pt-0.5 border-t border-[var(--borda-sutil)]/30">
                Comissão {quote.sellerName ? `(${quote.sellerName})` : 'Vendedor'}:{' '}
                <span className="font-mono font-bold text-[var(--nitro-primaria)]">
                  {formatBRL(totals.sellerCommissionFee)} ({totals.sellerCommissionPct}%)
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-[var(--texto-secundario)] uppercase tracking-wider block">
                Valor Total do Orçamento
              </span>
              <span className="text-2xl md:text-3xl font-black text-[var(--nitro-primaria)] font-mono">
                {formatBRL(totals.totalSellingPrice)}
              </span>
              {quote.shipping?.fretePorConta === 'FOB' && (
                <span className="text-[10px] text-[var(--nitro-azul)] font-semibold block">
                  * Frete FOB a pagar pelo cliente no destino
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Notificação / Destaque para o Vendedor sobre sua Comissão */}
        {viewMode === 'seller' && (
          <div className="p-3 bg-[var(--bg-elevado)] rounded-xl border border-[var(--nitro-primaria)]/30 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--sucesso)] animate-pulse"></span>
              <span className="text-[var(--texto-secundario)]">
                Sua comissão neste pedido ({totals.sellerCommissionPct}%):
              </span>
            </div>
            <span className="font-mono font-extrabold text-sm text-[var(--sucesso)]">
              +{formatBRL(totals.sellerCommissionFee)}
            </span>
          </div>
        )}

        {/* Se visão gerente, exibe custo, comissão comercial e lucro líquido real pós-comissão */}
        {viewMode === 'manager' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3 bg-[var(--bg-input)] rounded-xl border border-[var(--borda-sutil)] text-xs">
            <div>
              <span className="text-[var(--texto-secundario)] block">Custo de Produção:</span>
              <span className="text-sm sm:text-base font-bold text-[var(--perigo)] font-mono">
                {formatBRL(totals.totalProductionCost)}
              </span>
            </div>
            <div>
              <span className="text-[var(--texto-secundario)] block">Comissão Vendedor ({totals.sellerCommissionPct}%):</span>
              <span className="text-sm sm:text-base font-bold text-[var(--nitro-primaria)] font-mono">
                -{formatBRL(totals.sellerCommissionFee)}
              </span>
            </div>
            <div>
              <span className="text-[var(--texto-secundario)] block">Lucro Líquido Real (Pós-Comissão):</span>
              <span className="text-sm sm:text-base font-black text-[var(--sucesso)] font-mono">
                +{formatBRL(totals.netProfitAfterCommission)}
              </span>
            </div>
            <div>
              <span className="text-[var(--texto-secundario)] block">Margem Líquida Real:</span>
              <span className="text-sm sm:text-base font-bold text-[var(--texto-primario)] font-mono">
                {Number(totals.effectiveMarginAfterCommissionPct.toFixed(2))}% sobre custo
              </span>
            </div>
          </div>
        )}

        {/* Mensagem de Feedback de salvamento */}
        {saveMessage && (
          <div className="p-3 bg-[var(--sucesso-bg)] border border-[var(--sucesso)]/40 text-[var(--sucesso)] rounded-xl text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-[var(--sucesso)]" />
            <span>{saveMessage}</span>
          </div>
        )}

        {/* Botões de Ação Principal com Variáveis e Transições Suaves */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Botão 1: Copiar Orçamento para WhatsApp */}
          <button
            type="button"
            onClick={onOpenWhatsApp}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-[#25d366] hover:bg-[#20ba5a] text-slate-950 font-black text-xs md:text-sm rounded-xl shadow-lg shadow-[#25d366]/20 transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Copiar WhatsApp</span>
          </button>

          {/* Botão 2: Gerar PDF Comercial com Azul Nitro (#004da8) */}
          <button
            type="button"
            onClick={onOpenPDF}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-[var(--nitro-azul)] hover:bg-[var(--nitro-azul-hover)] text-white font-bold text-xs md:text-sm rounded-xl shadow-md shadow-[var(--nitro-azul)]/25 transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-white" />
            <span>Gerar PDF Comercial</span>
          </button>

          {/* Botão 3: Salvar Pedido no Google Sheets com Laranja Nitro (#ff8300) */}
          <button
            type="button"
            disabled={isSaving}
            onClick={onSaveOrder}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-[var(--nitro-primaria)] hover:bg-[var(--nitro-primaria-hover)] disabled:bg-[var(--nitro-primaria)]/50 text-white font-black text-xs md:text-sm rounded-xl shadow-lg shadow-[var(--nitro-primaria)]/25 transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Gravando Pedido...' : 'Salvar Pedido (Sheets)'}</span>
          </button>
        </div>

        {/* Barra Discreta de Auditoria do Payload Relacional Pai-Filho */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--borda-sutil)]/60 text-[11px]">
          <span className="text-[var(--texto-mutado)]">
            Envio estruturado em 2 abas relacionais (<strong>Historico_Pedidos</strong> + <strong>Itens_Pedido</strong>) com mapeamento por cabeçalho.
          </span>
          <button
            type="button"
            onClick={() => setIsPayloadModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-elevado)] hover:bg-[var(--borda-hover)] border border-[var(--borda-sutil)] text-[var(--texto-primario)] font-semibold transition-colors cursor-pointer"
          >
            <Code2 className="w-3.5 h-3.5 text-[var(--nitro-azul)]" />
            <span>Ver Payload JSON (Pai e Filho)</span>
          </button>
        </div>
      </div>

      {/* Modal de Inspeção do Payload JSON Relacional */}
      {isPayloadModalOpen && structuredPayload && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setIsPayloadModalOpen(false)}
        >
          <div
            className="w-full max-w-3xl max-h-[85vh] flex flex-col bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 bg-[var(--bg-elevado)] border-b border-[var(--borda-sutil)]">
              <div className="flex items-center gap-2.5">
                <Code2 className="w-5 h-5 text-[var(--nitro-azul)]" />
                <div>
                  <h3 className="text-sm font-bold text-[var(--texto-primario)]">
                    Payload Relacional do Pedido (Pai &amp; Filho)
                  </h3>
                  <p className="text-[11px] text-[var(--texto-secundario)]">
                    JSON enviado para Historico_Pedidos (pedido) e Itens_Pedido ({structuredPayload.itens.length} itens)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await copyToClipboard(JSON.stringify(structuredPayload, null, 2));
                    if (ok) {
                      setCopiedJson(true);
                      setTimeout(() => setCopiedJson(false), 2500);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--nitro-azul)] hover:bg-[var(--nitro-azul-hover)] text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  {copiedJson ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedJson ? 'Copiado!' : 'Copiar JSON'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPayloadModalOpen(false)}
                  className="p-1.5 rounded-lg text-[var(--texto-secundario)] hover:text-[var(--texto-primario)] hover:bg-[var(--borda-hover)] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto bg-[var(--bg-elevado)]/50">
              <pre className="p-4 bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-xl text-[11px] font-mono text-[var(--texto-primario)] overflow-x-auto leading-relaxed">
                {JSON.stringify(structuredPayload, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
