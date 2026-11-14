'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ShippingOption, ShippingType } from '../lib/types';
import { formatBRL } from '../lib/format';
import {
  calculateRealShippingRates,
  estimateTextileWeight,
  CorreiosRateQuote,
} from '../lib/correios-calculator';
import {
  Truck,
  Package,
  Zap,
  Gift,
  Building2,
  MapPin,
  Search,
  CheckCircle2,
  Info,
  RefreshCw,
  Scale,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ShippingOptionsSelectorProps {
  shipping?: ShippingOption;
  onUpdateShipping: (updated: ShippingOption) => void;
  totalPieces: number;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const ShippingOptionsSelector: React.FC<ShippingOptionsSelectorProps> = ({
  shipping = {
    type: 'correios_pac',
    name: 'Correios PAC',
    price: 32.5,
    deliveryTime: '3 a 5 dias úteis',
    carrierName: 'Correios',
    cepOrigem: '01310-100',
    cidadeUfOrigem: 'São Paulo / SP',
    cepDestino: '01310-100',
    cidadeUf: 'São Paulo / SP',
    pesoKg: 15.4,
    fretePorConta: 'CIF',
    notes: 'Postagem com seguro postal e código de rastreamento.',
  },
  onUpdateShipping,
  totalPieces,
  isExpanded,
  onToggleExpand,
}) => {
  const [localOpen, setLocalOpen] = useState(true);
  const isOpen = isExpanded !== undefined ? isExpanded : localOpen;

  const toggleOpen = () => {
    if (onToggleExpand) {
      onToggleExpand();
    } else {
      setLocalOpen(!localOpen);
    }
  };
  // Estados para busca de CEPs (Origem e Destino)
  const [isSearchingOrigem, setIsSearchingOrigem] = useState(false);
  const [isSearchingDestino, setIsSearchingDestino] = useState(false);
  const [cepOrigemError, setCepOrigemError] = useState<string | null>(null);
  const [cepDestinoError, setCepDestinoError] = useState<string | null>(null);
  const [feedbackCalc, setFeedbackCalc] = useState<string | null>(null);

  // CEPs normalizados
  const cepOrigem = shipping.cepOrigem || '01310-100';
  const cidadeUfOrigem = shipping.cidadeUfOrigem || 'São Paulo / SP';
  const cepDestino = shipping.cepDestino || '01310-100';
  const cidadeUfDestino = shipping.cidadeUf || 'São Paulo / SP';

  // Peso calculado ou informado
  const currentWeight = useMemo(() => {
    if (shipping.pesoKg && shipping.pesoKg > 0) {
      return shipping.pesoKg;
    }
    return estimateTextileWeight(totalPieces);
  }, [shipping.pesoKg, totalPieces]);

  // Taxas reais calculadas com a Matriz Oficial dos Correios
  const ratesQuote: CorreiosRateQuote = useMemo(() => {
    return calculateRealShippingRates({
      cepOrigem,
      cidadeUfOrigem,
      cepDestino,
      cidadeUfDestino,
      weightKg: currentWeight,
    });
  }, [cepOrigem, cidadeUfOrigem, cepDestino, cidadeUfDestino, currentWeight]);

  // Formatação de CEP (00000-000)
  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  };

  // Busca do CEP do Remetente (Origem) via ViaCEP
  const handleSearchCepOrigem = async () => {
    const rawCep = cepOrigem.replace(/\D/g, '');
    if (rawCep.length !== 8) {
      setCepOrigemError('Informe um CEP de origem válido com 8 dígitos.');
      return;
    }

    setCepOrigemError(null);
    setIsSearchingOrigem(true);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
      const data = await response.json();
      if (data.erro) {
        setCepOrigemError('CEP de origem não encontrado.');
      } else {
        const novaCidadeUf = `${data.localidade} / ${data.uf}`;
        const newRates = calculateRealShippingRates({
          cepOrigem: formatCep(rawCep),
          cidadeUfOrigem: novaCidadeUf,
          cepDestino,
          cidadeUfDestino,
          weightKg: currentWeight,
        });

        // Aplica o preço e prazo correspondente à modalidade atual
        let newPrice = shipping.price;
        let newTime = shipping.deliveryTime;
        let newCarrier = shipping.carrierName;

        if (shipping.type === 'correios_pac') {
          newPrice = newRates.pac.price;
          newTime = newRates.pac.deliveryTime;
          newCarrier = 'Correios';
        } else if (shipping.type === 'correios_sedex') {
          newPrice = newRates.sedex.price;
          newTime = newRates.sedex.deliveryTime;
          newCarrier = 'Correios SEDEX';
        } else if (shipping.type === 'transportadora') {
          newPrice = newRates.transportadora.price;
          newTime = newRates.transportadora.deliveryTime;
          newCarrier = newRates.transportadora.carrierName;
        }

        onUpdateShipping({
          ...shipping,
          cepOrigem: formatCep(rawCep),
          cidadeUfOrigem: novaCidadeUf,
          price: newPrice,
          deliveryTime: newTime,
          carrierName: newCarrier,
        });
        setFeedbackCalc(`Origem atualizada: ${novaCidadeUf}`);
        setTimeout(() => setFeedbackCalc(null), 3500);
      }
    } catch {
      setCepOrigemError('Falha ao consultar CEP de origem.');
    } finally {
      setIsSearchingOrigem(false);
    }
  };

  // Busca do CEP do Destinatário (Destino) via ViaCEP
  const handleSearchCepDestino = async () => {
    const rawCep = cepDestino.replace(/\D/g, '');
    if (rawCep.length !== 8) {
      setCepDestinoError('Informe um CEP de destino válido com 8 dígitos.');
      return;
    }

    setCepDestinoError(null);
    setIsSearchingDestino(true);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
      const data = await response.json();
      if (data.erro) {
        setCepDestinoError('CEP de destino não encontrado.');
      } else {
        const novaCidadeUf = `${data.localidade} / ${data.uf}`;
        const newRates = calculateRealShippingRates({
          cepOrigem,
          cidadeUfOrigem,
          cepDestino: formatCep(rawCep),
          cidadeUfDestino: novaCidadeUf,
          weightKg: currentWeight,
        });

        let newPrice = shipping.price;
        let newTime = shipping.deliveryTime;
        let newCarrier = shipping.carrierName;

        if (shipping.type === 'correios_pac') {
          newPrice = newRates.pac.price;
          newTime = newRates.pac.deliveryTime;
          newCarrier = 'Correios';
        } else if (shipping.type === 'correios_sedex') {
          newPrice = newRates.sedex.price;
          newTime = newRates.sedex.deliveryTime;
          newCarrier = 'Correios SEDEX';
        } else if (shipping.type === 'transportadora') {
          newPrice = newRates.transportadora.price;
          newTime = newRates.transportadora.deliveryTime;
          newCarrier = newRates.transportadora.carrierName;
        }

        onUpdateShipping({
          ...shipping,
          cepDestino: formatCep(rawCep),
          cidadeUf: novaCidadeUf,
          price: newPrice,
          deliveryTime: newTime,
          carrierName: newCarrier,
        });
        setFeedbackCalc(`Destino atualizado: ${novaCidadeUf} · Tarifas recalculadas!`);
        setTimeout(() => setFeedbackCalc(null), 3500);
      }
    } catch {
      setCepDestinoError('Falha ao consultar CEP de destino.');
    } finally {
      setIsSearchingDestino(false);
    }
  };

  // Forçar recálculo geral oficial dos Correios
  const handleRecalculateAll = () => {
    let newPrice = 0;
    let newTime = shipping.deliveryTime;
    let newCarrier = shipping.carrierName;

    if (shipping.type === 'correios_pac') {
      newPrice = ratesQuote.pac.price;
      newTime = ratesQuote.pac.deliveryTime;
      newCarrier = 'Correios';
    } else if (shipping.type === 'correios_sedex') {
      newPrice = ratesQuote.sedex.price;
      newTime = ratesQuote.sedex.deliveryTime;
      newCarrier = 'Correios SEDEX';
    } else if (shipping.type === 'transportadora') {
      newPrice = ratesQuote.transportadora.price;
      newTime = ratesQuote.transportadora.deliveryTime;
      newCarrier = ratesQuote.transportadora.carrierName;
    } else if (shipping.type === 'frete_gratis') {
      newPrice = 0;
      newTime = ratesQuote.pac.deliveryTime;
      newCarrier = 'Cortesia Nitro';
    } else {
      newPrice = 0;
      newTime = 'Imediato após produção';
      newCarrier = 'Retirada Fábrica';
    }

    onUpdateShipping({
      ...shipping,
      pesoKg: currentWeight,
      price: newPrice,
      deliveryTime: newTime,
      carrierName: newCarrier,
    });

    setFeedbackCalc(`Valores recalculados com base na tabela real dos Correios (${ratesQuote.distanceZone})`);
    setTimeout(() => setFeedbackCalc(null), 4000);
  };

  // Manipulador da Seleção via DROPDOWN
  const handleSelectDropdown = (selectedType: ShippingType) => {
    let name = 'Correios PAC';
    let price = ratesQuote.pac.price;
    let deliveryTime = ratesQuote.pac.deliveryTime;
    let carrierName = 'Correios';

    switch (selectedType) {
      case 'correios_pac':
        name = 'Correios PAC';
        price = ratesQuote.pac.price;
        deliveryTime = ratesQuote.pac.deliveryTime;
        carrierName = 'Correios';
        break;
      case 'correios_sedex':
        name = 'Correios SEDEX';
        price = ratesQuote.sedex.price;
        deliveryTime = ratesQuote.sedex.deliveryTime;
        carrierName = 'Correios SEDEX';
        break;
      case 'transportadora':
        name = 'Transportadora';
        price = ratesQuote.transportadora.price;
        deliveryTime = ratesQuote.transportadora.deliveryTime;
        carrierName = ratesQuote.transportadora.carrierName;
        break;
      case 'frete_gratis':
        name = 'Frete Grátis';
        price = 0.0;
        deliveryTime = ratesQuote.pac.deliveryTime;
        carrierName = 'Cortesia Nitro Têxtil';
        break;
      case 'retirada':
        name = 'Retirada no Balcão';
        price = 0.0;
        deliveryTime = 'Imediato após produção';
        carrierName = 'Retirada Direta Fábrica';
        break;
    }

    onUpdateShipping({
      ...shipping,
      type: selectedType,
      name,
      price,
      deliveryTime,
      carrierName,
      pesoKg: currentWeight,
    });
  };

  return (
    <div className="bg-[var(--bg-superficie)] border-2 border-[var(--borda-sutil)] rounded-2xl overflow-hidden transition-colors duration-200 shadow-md">
      {/* Cabeçalho com Ícone, Rota, Valor Total do Frete e Botão de Recolher/Expandir */}
      <div
        onClick={toggleOpen}
        className="flex flex-wrap items-center justify-between gap-3 p-4 md:p-6 border-b border-[var(--borda-sutil)] cursor-pointer hover:bg-[var(--bg-elevado)]/40 transition-colors select-none"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[var(--nitro-primaria)]/15 text-[var(--nitro-primaria)] border border-[var(--nitro-primaria)]/30 shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-extrabold text-[var(--texto-primario)] uppercase tracking-wider">
                Logística & Cotação Real dos Correios
              </h3>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--nitro-primaria)]/15 text-[var(--nitro-primaria)] border border-[var(--nitro-primaria)]/30">
                {shipping.name}
              </span>
            </div>
            <p className="text-[11px] text-[var(--texto-secundario)] flex items-center gap-1.5 flex-wrap">
              <span>Cálculo oficial PAC, SEDEX e Transportadora</span>
              <span>•</span>
              <span className="font-semibold text-[var(--nitro-primaria)]">
                {ratesQuote.distanceZone}
              </span>
              <span>•</span>
              <span className="text-[var(--texto-mutado)]">
                {cidadeUfDestino || 'Destino a definir'}
              </span>
            </p>
          </div>
        </div>

        {/* Indicador de Status, Valor do Frete e Chevron de Expansão */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[var(--texto-secundario)] hidden sm:inline">
              Valor do Envio:
            </span>
            <span
              className={`text-sm sm:text-base font-black font-mono px-3 py-1 rounded-xl border ${
                shipping.type === 'frete_gratis' || shipping.type === 'retirada' || shipping.price === 0
                  ? 'bg-[var(--sucesso-bg)] border-[var(--sucesso)]/40 text-[var(--sucesso)]'
                  : 'bg-[var(--bg-elevado)] border-[var(--nitro-primaria)]/50 text-[var(--nitro-primaria)] shadow-sm'
              }`}
            >
              {shipping.type === 'frete_gratis' || shipping.type === 'retirada' || shipping.price === 0
                ? 'GRÁTIS (R$ 0,00)'
                : formatBRL(shipping.price)}
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleOpen();
            }}
            className="p-1.5 rounded-lg text-[var(--texto-secundario)] hover:text-[var(--texto-primario)] hover:bg-[var(--borda-hover)] transition-colors cursor-pointer"
            title={isOpen ? 'Recolher este card' : 'Expandir este card'}
          >
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Conteúdo Expansível */}
      {isOpen && (
        <div className="p-4 md:p-6 space-y-5">
          {/* ROTA REMETENTE (ORIGEM) E DESTINATÁRIO (DESTINO) + PESO ESTIMADO */}
          <div className="p-4 bg-[var(--bg-elevado)] rounded-xl border border-[var(--borda-sutil)] space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-[var(--borda-sutil)]/60 pb-2">
              <span className="text-xs font-bold text-[var(--texto-primario)] uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[var(--nitro-primaria)]" />
                Origem (Remetente) e Destino (Destinatário)
              </span>

              {/* Badge informativa de peso da carga têxtil */}
              <div className="flex items-center gap-1.5 bg-[var(--bg-superficie)] px-2.5 py-1 rounded-lg border border-[var(--borda-sutil)] text-[11px]">
                <Scale className="w-3.5 h-3.5 text-[var(--nitro-azul)]" />
                <span className="text-[var(--texto-secundario)]">Carga:</span>
                <span className="font-bold font-mono text-[var(--texto-primario)]">
                  {totalPieces} peças (~{currentWeight.toFixed(2)} kg)
                </span>
              </div>
            </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* BLOCO DO REMETENTE / ORIGEM */}
          <div className="p-3 bg-[var(--bg-superficie)] rounded-xl border border-[var(--borda-sutil)] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-[var(--nitro-azul)] uppercase flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                Remetente (Origem da Postagem)
              </span>
              <span className="text-[10px] text-[var(--texto-mutado)] font-mono">Fábrica / CD</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-[var(--texto-secundario)] mb-1">
                  CEP de Origem
                </label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    maxLength={9}
                    value={shipping.cepOrigem || '01310-100'}
                    onChange={(e) =>
                      onUpdateShipping({
                        ...shipping,
                        cepOrigem: formatCep(e.target.value),
                      })
                    }
                    placeholder="00000-000"
                    className="w-full px-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-lg text-xs font-mono font-bold text-[var(--texto-primario)] focus:border-[var(--nitro-azul)] outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSearchCepOrigem}
                    disabled={isSearchingOrigem}
                    title="Buscar cidade pelo CEP de origem"
                    className="px-2 py-1.5 bg-[var(--nitro-azul)] hover:bg-[var(--nitro-azul-hover)] disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
                  >
                    {isSearchingOrigem ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Search className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                {cepOrigemError && (
                  <span className="text-[10px] text-[var(--perigo)] block mt-0.5">
                    {cepOrigemError}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[var(--texto-secundario)] mb-1">
                  Cidade / UF Origem
                </label>
                <input
                  type="text"
                  value={shipping.cidadeUfOrigem || 'São Paulo / SP'}
                  onChange={(e) =>
                    onUpdateShipping({
                      ...shipping,
                      cidadeUfOrigem: e.target.value,
                    })
                  }
                  placeholder="Ex: São Paulo / SP"
                  className="w-full px-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-lg text-xs font-semibold text-[var(--texto-primario)] focus:border-[var(--nitro-azul)] outline-none"
                />
              </div>
            </div>
          </div>

          {/* BLOCO DO DESTINATÁRIO / DESTINO */}
          <div className="p-3 bg-[var(--bg-superficie)] rounded-xl border border-[var(--borda-sutil)] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-[var(--nitro-primaria)] uppercase flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                Destinatário (Local de Entrega)
              </span>
              <span className="text-[10px] text-[var(--texto-mutado)] font-mono">Cliente Final</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-[var(--texto-secundario)] mb-1">
                  CEP de Destino
                </label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    maxLength={9}
                    value={shipping.cepDestino || ''}
                    onChange={(e) =>
                      onUpdateShipping({
                        ...shipping,
                        cepDestino: formatCep(e.target.value),
                      })
                    }
                    placeholder="00000-000"
                    className="w-full px-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-lg text-xs font-mono font-bold text-[var(--texto-primario)] focus:border-[var(--nitro-primaria)] outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSearchCepDestino}
                    disabled={isSearchingDestino}
                    title="Buscar cidade pelo CEP de destino"
                    className="px-2 py-1.5 bg-[var(--nitro-primaria)] hover:bg-[var(--nitro-primaria-hover)] disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
                  >
                    {isSearchingDestino ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Search className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                {cepDestinoError && (
                  <span className="text-[10px] text-[var(--perigo)] block mt-0.5">
                    {cepDestinoError}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[var(--texto-secundario)] mb-1">
                  Cidade / UF Destino
                </label>
                <input
                  type="text"
                  value={shipping.cidadeUf || ''}
                  onChange={(e) =>
                    onUpdateShipping({
                      ...shipping,
                      cidadeUf: e.target.value,
                    })
                  }
                  placeholder="Ex: Rio de Janeiro / RJ"
                  className="w-full px-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-lg text-xs font-semibold text-[var(--texto-primario)] focus:border-[var(--nitro-primaria)] outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* AJUSTE DE PESO REAL & BOTAO RECALCULAR CORREIOS */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[var(--texto-secundario)]">
              Peso Total da Encomenda (kg):
            </span>
            <input
              type="number"
              min="0.3"
              step="0.1"
              value={shipping.pesoKg || currentWeight}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0.5;
                onUpdateShipping({
                  ...shipping,
                  pesoKg: val,
                });
              }}
              className="w-24 px-2.5 py-1 bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-lg text-xs font-bold font-mono text-[var(--texto-primario)] focus:border-[var(--nitro-primaria)] outline-none"
            />
            <span className="text-[10px] text-[var(--texto-mutado)] hidden sm:inline">
              (Automático: ~220g/peça + caixa master)
            </span>
          </div>

          <button
            type="button"
            onClick={handleRecalculateAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-superficie)] hover:bg-[var(--borda-hover)] border border-[var(--borda-sutil)] text-xs font-bold text-[var(--texto-primario)] transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[var(--nitro-primaria)]" />
            <span>Recalcular Tarifas Oficiais</span>
          </button>
        </div>

        {feedbackCalc && (
          <div className="p-2 rounded-lg bg-[var(--nitro-azul)]/10 border border-[var(--nitro-azul)]/30 text-xs font-medium text-[var(--nitro-azul)] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedbackCalc}</span>
          </div>
        )}
      </div>

      {/* SELEÇÃO VIA DROPDOWN COM ESCOLHAS COMPLETAS E VALORES REAIS */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="shipping-method-dropdown"
            className="text-xs font-extrabold text-[var(--texto-primario)] uppercase tracking-wide flex items-center gap-1.5"
          >
            <span>Escolha a Modalidade de Envio (Menu Suspenso / Drop Down):</span>
          </label>
          <span className="text-[11px] font-bold text-[var(--nitro-primaria)]">
            Tabela Oficial dos Correios Atualizada
          </span>
        </div>

        <div className="relative">
          <select
            id="shipping-method-dropdown"
            value={shipping.type}
            onChange={(e) => handleSelectDropdown(e.target.value as ShippingType)}
            className="w-full appearance-none px-4 py-3 bg-[var(--bg-superficie)] hover:bg-[var(--bg-elevado)] text-[var(--texto-primario)] border-2 border-[var(--nitro-primaria)]/70 hover:border-[var(--nitro-primaria)] rounded-xl text-xs sm:text-sm font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--nitro-primaria)] transition-all cursor-pointer pr-10"
          >
            <option value="correios_pac">
              📦 Correios PAC — {formatBRL(ratesQuote.pac.price)} (Prazo: {ratesQuote.pac.deliveryTime})
            </option>
            <option value="correios_sedex">
              ⚡ Correios SEDEX — {formatBRL(ratesQuote.sedex.price)} (Prazo: {ratesQuote.sedex.deliveryTime})
            </option>
            <option value="transportadora">
              🚚 Transportadora {ratesQuote.transportadora.carrierName} — {formatBRL(ratesQuote.transportadora.price)} (Prazo: {ratesQuote.transportadora.deliveryTime})
            </option>
            <option value="frete_gratis">
              🎁 Frete Grátis (Cortesia Nitro Têxtil) — R$ 0,00 (Prazo: {ratesQuote.pac.deliveryTime})
            </option>
            <option value="retirada">
              🏬 Retirada no Balcão Fábrica — R$ 0,00 (Imediato após produção)
            </option>
          </select>

          <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-[var(--nitro-primaria)]">
            <ChevronDown className="w-5 h-5 font-black" />
          </div>
        </div>
      </div>

      {/* CARD DE DETALHES DA OPÇÃO SELECIONADA + AJUSTES MANUAIS */}
      <div className="p-4 bg-[var(--bg-input)] rounded-xl border border-[var(--borda-sutil)] space-y-3.5 text-xs">
        {/* Resumo da Modalidade Ativa */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[var(--borda-sutil)]/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[var(--nitro-primaria)] text-white flex items-center justify-center font-bold">
              {shipping.type === 'correios_pac' && <Package className="w-4 h-4" />}
              {shipping.type === 'correios_sedex' && <Zap className="w-4 h-4" />}
              {shipping.type === 'transportadora' && <Truck className="w-4 h-4" />}
              {shipping.type === 'frete_gratis' && <Gift className="w-4 h-4" />}
              {shipping.type === 'retirada' && <Building2 className="w-4 h-4" />}
            </div>
            <div>
              <span className="font-extrabold text-[var(--texto-primario)] block">
                {shipping.name}
              </span>
              <span className="text-[10px] text-[var(--texto-secundario)]">
                {shipping.type === 'correios_pac' && ratesQuote.pac.description}
                {shipping.type === 'correios_sedex' && ratesQuote.sedex.description}
                {shipping.type === 'transportadora' && ratesQuote.transportadora.description}
                {shipping.type === 'frete_gratis' && ratesQuote.freteGratis.description}
                {shipping.type === 'retirada' && ratesQuote.retirada.description}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[var(--texto-secundario)]">Rota:</span>
            <span className="font-mono font-bold px-2 py-0.5 rounded bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] text-[var(--texto-primario)]">
              {cidadeUfOrigem.split('/')[1]?.trim() || 'SP'} → {cidadeUfDestino.split('/')[1]?.trim() || 'SP'}
            </span>
          </div>
        </div>

        {/* Campos Editáveis de Valor do Frete, Prazo e Responsabilidade */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Valor do Frete em R$ (Calculado automaticamente, mas editável se houver desconto) */}
          <div>
            <label className="block text-[11px] font-bold text-[var(--texto-secundario)] mb-1">
              Valor Final do Frete (R$)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[var(--texto-mutado)] font-mono text-xs font-bold pointer-events-none">
                R$
              </span>
              <input
                type="number"
                min="0"
                step="0.5"
                disabled={shipping.type === 'frete_gratis' || shipping.type === 'retirada'}
                value={
                  shipping.type === 'frete_gratis' || shipping.type === 'retirada'
                    ? 0
                    : shipping.price
                }
                onChange={(e) =>
                  onUpdateShipping({
                    ...shipping,
                    price: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full pl-9 pr-3 py-2 bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-xl text-xs font-mono font-black text-[var(--nitro-primaria)] focus:border-[var(--nitro-primaria)] outline-none disabled:opacity-60"
              />
            </div>
          </div>

          {/* Prazo Estimado de Transporte */}
          <div>
            <label className="block text-[11px] font-bold text-[var(--texto-secundario)] mb-1">
              Prazo Estimado de Entrega
            </label>
            <input
              type="text"
              value={shipping.deliveryTime}
              onChange={(e) =>
                onUpdateShipping({
                  ...shipping,
                  deliveryTime: e.target.value,
                })
              }
              placeholder="Ex: 3 a 5 dias úteis"
              className="w-full px-3 py-2 bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-xl text-xs font-semibold text-[var(--texto-primario)] focus:border-[var(--nitro-primaria)] outline-none"
            />
          </div>

          {/* Nome da Empresa / Transportadora */}
          <div>
            <label className="block text-[11px] font-bold text-[var(--texto-secundario)] mb-1">
              Transportadora / Operador
            </label>
            <input
              type="text"
              value={shipping.carrierName || ''}
              onChange={(e) =>
                onUpdateShipping({
                  ...shipping,
                  carrierName: e.target.value,
                })
              }
              placeholder="Ex: Correios, Jadlog, Braspress..."
              className="w-full px-3 py-2 bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-xl text-xs text-[var(--texto-primario)] focus:border-[var(--nitro-primaria)] outline-none"
            />
          </div>

          {/* Responsabilidade: CIF vs FOB */}
          <div>
            <label className="block text-[11px] font-bold text-[var(--texto-secundario)] mb-1">
              Faturamento do Frete
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => onUpdateShipping({ ...shipping, fretePorConta: 'CIF' })}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  shipping.fretePorConta === 'CIF'
                    ? 'bg-[var(--nitro-primaria)] text-white border-[var(--nitro-primaria)]'
                    : 'bg-[var(--bg-superficie)] text-[var(--texto-secundario)] border-[var(--borda-sutil)] hover:text-[var(--texto-primario)]'
                }`}
              >
                CIF (Incluso)
              </button>
              <button
                type="button"
                onClick={() => onUpdateShipping({ ...shipping, fretePorConta: 'FOB' })}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  shipping.fretePorConta === 'FOB'
                    ? 'bg-[var(--nitro-azul)] text-white border-[var(--nitro-azul)]'
                    : 'bg-[var(--bg-superficie)] text-[var(--texto-secundario)] border-[var(--borda-sutil)] hover:text-[var(--texto-primario)]'
                }`}
              >
                FOB (Destino)
              </button>
            </div>
          </div>
        </div>

        {/* Instruções de Rastreio e Embalagem */}
        <div>
          <label className="block text-[11px] font-bold text-[var(--texto-secundario)] mb-1">
            Instruções de Postagem, Seguro & Rastreio
          </label>
          <input
            type="text"
            value={shipping.notes || ''}
            onChange={(e) =>
              onUpdateShipping({
                ...shipping,
                notes: e.target.value,
              })
            }
            placeholder="Ex: Postagem com código de rastreio e seguro postal de carga..."
            className="w-full px-3 py-2 bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-xl text-xs text-[var(--texto-primario)] focus:border-[var(--nitro-primaria)] outline-none"
          />
        </div>

        {/* Resumo Dinâmico em Linha */}
        <div className="flex items-center gap-2 pt-1 text-[11px] text-[var(--texto-secundario)] border-t border-[var(--borda-sutil)]/40">
          <Info className="w-3.5 h-3.5 text-[var(--nitro-primaria)] shrink-0" />
          <span>
            <strong>Origem:</strong> {cidadeUfOrigem} (CEP {cepOrigem}) <ArrowRight className="inline w-3 h-3 mx-0.5" />{' '}
            <strong>Destino:</strong> {cidadeUfDestino} (CEP {cepDestino}) · Peso: {currentWeight.toFixed(2)} kg ·{' '}
            {shipping.fretePorConta === 'CIF'
              ? 'Frete CIF somado ao total da proposta'
              : 'Frete FOB pago diretamente pelo destinatário'}
          </span>
        </div>
      </div>
    </div>
  )}
</div>
  );
};
