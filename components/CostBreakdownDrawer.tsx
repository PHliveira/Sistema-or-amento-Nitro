'use client';

import React, { useState } from 'react';
import { CalculatedItemCost, Fabric, QuoteItem, ViewMode } from '../lib/types';
import { DEFAULT_FABRICS } from '../lib/default-data';
import { formatBRL } from '../lib/format';
import {
  TrendingUp,
  Layers,
  Scissors,
  Truck,
  Palette,
  Package,
  Percent,
  Calculator,
} from 'lucide-react';

interface CostBreakdownDrawerProps {
  item: QuoteItem;
  calculatedCost: CalculatedItemCost;
  viewMode: ViewMode;
  fabrics?: Fabric[];
  onUpdateMargin: (newMargin: number) => void;
}

export const CostBreakdownDrawer: React.FC<CostBreakdownDrawerProps> = ({
  item,
  calculatedCost,
  viewMode,
  fabrics = DEFAULT_FABRICS,
  onUpdateMargin,
}) => {
  const currentFabric = fabrics.find((f) => f.id === item.fabricId) || fabrics[0];

  // Rascunhos locais temporários enquanto o usuário digita nos campos
  const [unitDraft, setUnitDraft] = useState<string | null>(null);
  const [totalDraft, setTotalDraft] = useState<string | null>(null);
  const [marginDraft, setMarginDraft] = useState<string | null>(null);

  // Edição do Preço Unitário de Venda -> Ajusta a margem sem arredondamento
  const handleUnitPriceChange = (valStr: string) => {
    setUnitDraft(valStr);
    const newUnit = parseFloat(valStr);
    if (isNaN(newUnit) || newUnit <= 0) return;

    const qty = calculatedCost.totalQuantity || 1;
    const newTotal = newUnit * qty;
    const totalCost = calculatedCost.totalProductionCost;
    const mockupFee = item.mockupDesignFee || 0;
    const baseRequired = newTotal - mockupFee;

    if (totalCost > 0) {
      const exactMargin = ((baseRequired - totalCost) / totalCost) * 100;
      onUpdateMargin(Number(exactMargin.toFixed(4)));
    }
  };

  // Edição do Preço Total do Lote -> Ajusta a margem sem arredondamento
  const handleTotalPriceChange = (valStr: string) => {
    setTotalDraft(valStr);
    const newTotal = parseFloat(valStr);
    if (isNaN(newTotal) || newTotal <= 0) return;

    const totalCost = calculatedCost.totalProductionCost;
    const mockupFee = item.mockupDesignFee || 0;
    const baseRequired = newTotal - mockupFee;

    if (totalCost > 0) {
      const exactMargin = ((baseRequired - totalCost) / totalCost) * 100;
      onUpdateMargin(Number(exactMargin.toFixed(4)));
    }
  };

  // Edição direta da Margem com qualquer casa decimal (sem arredondamento forçado)
  const handleMarginChange = (valStr: string) => {
    setMarginDraft(valStr);
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed)) {
      onUpdateMargin(parsed);
    }
  };

  return (
    <div className="bg-[var(--bg-superficie)] border-2 border-[var(--borda-sutil)] rounded-2xl p-4 md:p-5 space-y-4 transition-colors duration-200 shadow-md">
      {/* ========================================================
          VISÃO GERENTE: CAMADAS COMPLETAS DA ENGENHARIA DE CUSTOS
         ======================================================== */}
      {viewMode === 'manager' && (
        <div className="space-y-3.5 pb-4 border-b border-[var(--borda-sutil)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded bg-[var(--nitro-primaria)]/20 text-[var(--nitro-primaria)] text-xs font-bold">
                <Layers className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs font-bold text-[var(--texto-primario)] uppercase tracking-wider">
                Engenharia de Custos Interna (Visão Gerente)
              </span>
            </div>
            <span className="text-[11px] text-[var(--alerta)] font-semibold bg-[var(--alerta-bg)] border border-[var(--alerta)]/30 px-2 py-0.5 rounded-full">
              Confidencial Fabril
            </span>
          </div>

          {/* Grid de Camadas de Custo */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
            {/* 1. Tecido & Punho */}
            <div className="bg-[var(--bg-elevado)] p-2.5 rounded-xl border border-[var(--borda-sutil)]">
              <div className="flex items-center justify-between gap-1 text-[var(--texto-secundario)] mb-1">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-sky-400" />
                  <span className="text-[11px] font-semibold">Tecido</span>
                </div>
                {currentFabric?.hasPunho && (
                  <span className="text-[9px] bg-amber-500/20 text-amber-400 font-bold px-1 rounded">
                    +Punho
                  </span>
                )}
              </div>
              <div className="text-sm font-bold text-[var(--texto-primario)] font-mono">
                {formatBRL(calculatedCost.fabricUnitCost)}
              </div>
              <div className="text-[10px] text-[var(--texto-mutado)] truncate" title={currentFabric?.name}>
                {currentFabric?.hasPunho ? (
                  <span>
                    Corpo: {formatBRL(calculatedCost.fabricBodyUnitCost || 0)} · Punho: {formatBRL(calculatedCost.punhoUnitCost || 0)}
                  </span>
                ) : (
                  <span>
                    {currentFabric?.yieldPerUnit} pç/{currentFabric?.unitType} (+{currentFabric?.wasteMarginPct}%)
                  </span>
                )}
              </div>
            </div>

            {/* 2. Mão de Obra Costura */}
            <div className="bg-[var(--bg-elevado)] p-2.5 rounded-xl border border-[var(--borda-sutil)]">
              <div className="flex items-center gap-1.5 text-[var(--texto-secundario)] mb-1">
                <Scissors className="w-3 h-3 text-[var(--alerta)]" />
                <span className="text-[11px] font-semibold">Costura</span>
              </div>
              <div className="text-sm font-bold text-[var(--texto-primario)] font-mono">
                {formatBRL(calculatedCost.sewingUnitCost)}
              </div>
              <div className="text-[10px] text-[var(--texto-mutado)] truncate">
                {item.sewingComplexity.split(' ')[0]}
              </div>
            </div>

            {/* 3. Insumos & Aviamentos */}
            <div className="bg-[var(--bg-elevado)] p-2.5 rounded-xl border border-[var(--borda-sutil)]">
              <div className="flex items-center gap-1.5 text-[var(--texto-secundario)] mb-1">
                <Package className="w-3 h-3 text-[var(--sucesso)]" />
                <span className="text-[11px] font-semibold">Insumos</span>
              </div>
              <div className="text-sm font-bold text-[var(--texto-primario)] font-mono">
                {formatBRL(calculatedCost.suppliesUnitCost)}
              </div>
              <div className="text-[10px] text-[var(--texto-mutado)]">
                Linha, tag, embalagem
              </div>
            </div>

            {/* 4. Estamparia */}
            <div className="bg-[var(--bg-elevado)] p-2.5 rounded-xl border border-[var(--borda-sutil)]">
              <div className="flex items-center gap-1.5 text-[var(--texto-secundario)] mb-1">
                <Palette className="w-3 h-3 text-purple-400" />
                <span className="text-[11px] font-semibold">Estamparia</span>
              </div>
              <div className="text-sm font-bold text-[var(--texto-primario)] font-mono">
                {formatBRL(calculatedCost.printingUnitCost)}
              </div>
              <div className="text-[10px] text-[var(--texto-mutado)]">
                Lote: {formatBRL(calculatedCost.printingTotalCost)}
              </div>
            </div>

            {/* 5. Logística */}
            <div className="bg-[var(--bg-elevado)] p-2.5 rounded-xl border border-[var(--borda-sutil)]">
              <div className="flex items-center gap-1.5 text-[var(--texto-secundario)] mb-1">
                <Truck className="w-3 h-3 text-orange-400" />
                <span className="text-[11px] font-semibold">Logística</span>
              </div>
              <div className="text-sm font-bold text-[var(--texto-primario)] font-mono">
                {formatBRL(calculatedCost.logisticsUnitCost)}
              </div>
              <div className="text-[10px] text-[var(--texto-mutado)]">
                Oficinas rateadas
              </div>
            </div>

            {/* 6. Custo Total de Produção */}
            <div className="bg-[var(--bg-input)] p-2.5 rounded-xl border border-[var(--borda-sutil)]">
              <div className="flex items-center gap-1.5 text-[var(--texto-secundario)] mb-1">
                <span className="text-[11px] font-bold">Custo Unit. Total</span>
              </div>
              <div className="text-sm font-black text-[var(--perigo)] font-mono">
                {formatBRL(calculatedCost.unitProductionCost)}
              </div>
              <div className="text-[10px] text-[var(--texto-mutado)]">
                Lote: {formatBRL(calculatedCost.totalProductionCost)}
              </div>
            </div>
          </div>

          {/* Detalhamento de Compra de Matéria-Prima: Tecido e Punho */}
          {(calculatedCost.fabricTotalPurchaseKg || calculatedCost.punhoTotalPurchaseKg) && calculatedCost.totalQuantity > 0 && (
            <div className="p-3 bg-[var(--bg-superficie)] rounded-xl border border-[var(--borda-sutil)] text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-[var(--borda-sutil)] pb-1.5">
                <span className="font-bold text-[var(--texto-primario)] flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                  <Layers className="w-3.5 h-3.5 text-sky-400" />
                  Necessidade de Compra de Matéria-Prima ({calculatedCost.totalQuantity} peças)
                </span>
                <span className="text-[10px] text-[var(--texto-mutado)]">
                  Cálculo fabril com perda de corte inclusa
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="bg-[var(--bg-elevado)] p-2 rounded-lg border border-[var(--borda-sutil)] flex items-center justify-between">
                  <div>
                    <span className="text-[var(--texto-mutado)] block text-[10px]">Tecido Principal ({currentFabric?.name}):</span>
                    <strong className="text-[var(--texto-primario)] font-mono text-xs">
                      {calculatedCost.fabricTotalPurchaseKg?.toFixed(2)} {currentFabric?.unitType || 'kg'}
                    </strong>
                  </div>
                  <span className="font-mono font-bold text-sky-400">
                    {formatBRL(calculatedCost.fabricTotalPurchaseCost || 0)}
                  </span>
                </div>

                {currentFabric?.hasPunho && (
                  <div className="bg-[var(--bg-elevado)] p-2 rounded-lg border border-amber-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-amber-400 block text-[10px] font-bold">Punho / Ribana ({currentFabric?.punhoNotes || 'Combinada'}):</span>
                      <strong className="text-[var(--texto-primario)] font-mono text-xs">
                        {calculatedCost.punhoTotalPurchaseKg?.toFixed(2)} {currentFabric?.punhoUnitType || 'kg'}
                      </strong>
                    </div>
                    <span className="font-mono font-bold text-amber-400">
                      {formatBRL(calculatedCost.punhoTotalPurchaseCost || 0)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          FORMAÇÃO DE PREÇO COM EDIÇÃO DO VALOR FINAL & MARGEM REAL
         ======================================================== */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[var(--nitro-primaria)]" />
            <span className="text-xs font-extrabold text-[var(--texto-primario)] uppercase tracking-wider">
              Formação de Preço Comercial (Edição Direta do Preço ou da Margem)
            </span>
          </div>

          {/* Badge de precisão da margem sem arredondamento */}
          <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg bg-[var(--nitro-primaria)]/15 border border-[var(--nitro-primaria)]/30 text-[var(--nitro-primaria)]">
            <Percent className="w-3 h-3" />
            <span>Margem Real: {Number(item.itemProfitMarginPct.toFixed(2))}%</span>
            <span className="text-[10px] text-[var(--texto-secundario)] font-normal hidden sm:inline">
              (sem arredondamento)
            </span>
          </div>
        </div>

        {/* Bloco Interativo: Edição do Preço Unitário, Subtotal e Margem */}
        <div className="p-3.5 bg-[var(--bg-elevado)] rounded-xl border border-[var(--borda-sutil)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. PREÇO UNITÁRIO FINAL (EDITÁVEL) */}
          <div>
            <label className="block text-[11px] font-bold text-[var(--texto-secundario)] mb-1">
              Preço Unitário de Venda (R$/pç)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[var(--texto-mutado)] font-mono text-xs font-bold pointer-events-none">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={unitDraft !== null ? unitDraft : calculatedCost.unitSellingPrice.toFixed(2)}
                onFocus={() => setUnitDraft(calculatedCost.unitSellingPrice.toFixed(2))}
                onChange={(e) => handleUnitPriceChange(e.target.value)}
                onBlur={() => setUnitDraft(null)}
                title="Digite o preço unitário desejado. A margem de lucro se ajusta automaticamente sem arredondar a porcentagem."
                className="w-full pl-9 pr-3 py-2 bg-[var(--bg-superficie)] border-2 border-[var(--nitro-primaria)]/60 focus:border-[var(--nitro-primaria)] rounded-xl text-sm font-black font-mono text-[var(--nitro-primaria)] outline-none shadow-inner"
              />
            </div>
            <span className="text-[10px] text-[var(--texto-mutado)] block mt-1">
              Altere para ajustar a margem automaticamente
            </span>
          </div>

          {/* 2. SUBTOTAL FINAL DO LOTE (EDITÁVEL) */}
          <div>
            <label className="block text-[11px] font-bold text-[var(--texto-secundario)] mb-1">
              Subtotal do Item ({calculatedCost.totalQuantity} peças)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[var(--texto-mutado)] font-mono text-xs font-bold pointer-events-none">
                R$
              </span>
              <input
                type="number"
                step="0.5"
                min="0"
                value={totalDraft !== null ? totalDraft : calculatedCost.totalSellingPrice.toFixed(2)}
                onFocus={() => setTotalDraft(calculatedCost.totalSellingPrice.toFixed(2))}
                onChange={(e) => handleTotalPriceChange(e.target.value)}
                onBlur={() => setTotalDraft(null)}
                title="Digite o subtotal fechado para este item. A margem se ajusta automaticamente."
                className="w-full pl-9 pr-3 py-2 bg-[var(--bg-superficie)] border-2 border-[var(--nitro-azul)]/60 focus:border-[var(--nitro-azul)] rounded-xl text-sm font-black font-mono text-[var(--nitro-azul)] outline-none shadow-inner"
              />
            </div>
            <span className="text-[10px] text-[var(--texto-mutado)] block mt-1">
              Valor fechado do lote deste produto
            </span>
          </div>

          {/* 3. MARGEM DE LUCRO % (EDITÁVEL SEM ARREDONDAMENTO) */}
          <div>
            <label className="block text-[11px] font-bold text-[var(--texto-secundario)] mb-1">
              Margem de Lucro (% sobre custo)
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  step="any"
                  min="-50"
                  max="1000"
                  value={
                    marginDraft !== null
                      ? marginDraft
                      : Number(item.itemProfitMarginPct.toFixed(2)).toString()
                  }
                  onFocus={() => setMarginDraft(item.itemProfitMarginPct.toString())}
                  onChange={(e) => handleMarginChange(e.target.value)}
                  onBlur={() => setMarginDraft(null)}
                  className="w-full px-3 py-2 bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] focus:border-[var(--sucesso)] rounded-xl text-xs font-black font-mono text-[var(--sucesso)] outline-none"
                />
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-bold text-[var(--texto-mutado)] pointer-events-none">
                  %
                </span>
              </div>

              {/* Botões rápidos de margem padrão */}
              <div className="flex gap-1 shrink-0">
                {[30, 35, 40, 50].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => {
                      onUpdateMargin(pct);
                      setMarginDraft(pct.toString());
                    }}
                    className={`px-1.5 py-1 rounded text-[10px] font-bold font-mono transition-colors cursor-pointer ${
                      Math.abs(item.itemProfitMarginPct - pct) < 0.05
                        ? 'bg-[var(--sucesso)] text-white'
                        : 'bg-[var(--bg-superficie)] hover:bg-[var(--borda-hover)] text-[var(--texto-secundario)] border border-[var(--borda-sutil)]'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
            <span className="text-[10px] text-[var(--sucesso)] font-semibold block mt-1">
              Lucro Bruto do Item: +{formatBRL(calculatedCost.totalProfit)}
            </span>
          </div>
        </div>

        {/* Informativo de taxa de arte se houver */}
        {calculatedCost.mockupDesignFee > 0 && (
          <div className="p-2 rounded-lg bg-[var(--nitro-azul)]/10 border border-[var(--nitro-azul)]/30 text-xs flex items-center justify-between">
            <span className="text-[var(--texto-secundario)] font-medium">
              Taxa de criação de arte/mockup aplicada a este item:
            </span>
            <span className="font-mono font-bold text-[var(--nitro-azul)]">
              +{formatBRL(calculatedCost.mockupDesignFee)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
