import React, { useState } from 'react';
import { SizeGrid } from '../lib/types';
import { Sparkles, Trash2, Plus, ChevronDown, ChevronUp, Baby, Shirt } from 'lucide-react';

interface SizeGridSelectorProps {
  sizes: SizeGrid;
  onChange: (updatedSizes: SizeGrid) => void;
  specialSizeSurchargePct?: number;
  sleeveType?: string;
  onSleeveTypeChange?: (updatedSleeveType: string) => void;
}

export const SizeGridSelector: React.FC<SizeGridSelectorProps> = ({
  sizes,
  onChange,
  specialSizeSurchargePct = 15,
  sleeveType = 'Manga Curta',
  onSleeveTypeChange,
}) => {
  const adultKeys: { key: keyof SizeGrid; label: string; isSpecial?: boolean }[] = [
    { key: 'pp', label: 'PP' },
    { key: 'p', label: 'P' },
    { key: 'm', label: 'M' },
    { key: 'g', label: 'G' },
    { key: 'gg', label: 'GG' },
    { key: 'exg', label: 'EXG' },
    { key: 'g1', label: 'G1', isSpecial: true },
    { key: 'g2', label: 'G2', isSpecial: true },
  ];

  const childKeys: { key: keyof SizeGrid; label: string }[] = [
    { key: 'tam02', label: '02' },
    { key: 'tam04', label: '04' },
    { key: 'tam06', label: '06' },
    { key: 'tam08', label: '08' },
    { key: 'tam10', label: '10' },
    { key: 'tam12', label: '12' },
    { key: 'tam14', label: '14' },
    { key: 'tam16', label: '16' },
  ];

  const totalAdult = adultKeys.reduce((acc, curr) => acc + (sizes[curr.key] || 0), 0);
  const totalChild = childKeys.reduce((acc, curr) => acc + (sizes[curr.key] || 0), 0);
  const totalAll = totalAdult + totalChild;

  // Grade infantil é opcional e começa fechada, exceto se já houver peças infantis preenchidas
  const [showChildSizes, setShowChildSizes] = useState<boolean>(totalChild > 0);

  const updateSize = (key: keyof SizeGrid, val: number) => {
    const safeVal = Math.max(0, isNaN(val) ? 0 : Math.floor(val));
    onChange({
      ...sizes,
      [key]: safeVal,
    });
  };

  const clearChildSizes = () => {
    onChange({
      ...sizes,
      tam02: 0,
      tam04: 0,
      tam06: 0,
      tam08: 0,
      tam10: 0,
      tam12: 0,
      tam14: 0,
      tam16: 0,
    });
    setShowChildSizes(false);
  };

  const applyPreset = (type: 'clear' | 'balanced-50' | 'add-5-pmg') => {
    if (type === 'clear') {
      onChange({
        pp: 0,
        p: 0,
        m: 0,
        g: 0,
        gg: 0,
        exg: 0,
        g1: 0,
        g2: 0,
        tam02: 0,
        tam04: 0,
        tam06: 0,
        tam08: 0,
        tam10: 0,
        tam12: 0,
        tam14: 0,
        tam16: 0,
      });
    } else if (type === 'balanced-50') {
      onChange({
        ...sizes,
        p: 10,
        m: 20,
        g: 15,
        gg: 5,
      });
    } else if (type === 'add-5-pmg') {
      onChange({
        ...sizes,
        p: (sizes.p || 0) + 5,
        m: (sizes.m || 0) + 5,
        g: (sizes.g || 0) + 5,
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header com totalizadores e ações rápidas */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--borda-sutil)]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[var(--texto-primario)] uppercase tracking-wider">
            Grade de Quantidades por Tamanho
          </span>
          <span className="text-xs bg-[var(--bg-elevado)] text-[var(--texto-secundario)] px-2 py-0.5 rounded-full font-mono font-semibold border border-[var(--borda-sutil)]">
            Total: {totalAll} peças
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => applyPreset('balanced-50')}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-[var(--bg-elevado)] hover:bg-[var(--borda-hover)] text-[var(--texto-secundario)] hover:text-[var(--texto-primario)] rounded-md text-[11px] font-medium transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-[var(--nitro-primaria)]" />
            Grade 50p P/M/G/GG
          </button>
          <button
            type="button"
            onClick={() => applyPreset('clear')}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-[var(--bg-elevado)] hover:bg-[var(--perigo-bg)] text-[var(--texto-secundario)] hover:text-[var(--perigo)] rounded-md text-[11px] font-medium transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            Zerar
          </button>
        </div>
      </div>

      {/* Opção de Tipo de Manga (Manga Curta, Manga Longa ou personalizada/editável) */}
      {onSleeveTypeChange && (
        <div className="p-3 bg-[var(--bg-elevado)] rounded-xl border border-[var(--borda-sutil)] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[var(--nitro-primaria)]/15 text-[var(--nitro-primaria)] border border-[var(--nitro-primaria)]/30 flex items-center justify-center">
              <Shirt className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[var(--texto-primario)] uppercase tracking-wide block">
                Tipo de Manga da Grade
              </span>
              <span className="text-[11px] text-[var(--texto-secundario)]">
                Escolha uma opção rápida ou edite o modelo de manga
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Presets Rápidos: Manga Curta, Manga Longa, Regata */}
            <div className="inline-flex rounded-xl bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] p-0.5 shadow-2xs">
              {[
                { label: 'Manga Curta', value: 'Manga Curta' },
                { label: 'Manga Longa', value: 'Manga Longa' },
                { label: 'Regata', value: 'Regata' },
              ].map((preset) => {
                const isSelected = (sleeveType || 'Manga Curta').toLowerCase() === preset.value.toLowerCase();
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => onSleeveTypeChange(preset.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--nitro-primaria)] text-white font-bold shadow-xs'
                        : 'text-[var(--texto-secundario)] hover:text-[var(--texto-primario)] hover:bg-[var(--bg-elevado)]'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Campo Editável para personalização manual */}
            <div className="relative">
              <input
                type="text"
                list="sleeve-type-datalist"
                value={sleeveType || 'Manga Curta'}
                placeholder="Personalizar manga..."
                onChange={(e) => onSleeveTypeChange(e.target.value)}
                className="w-36 sm:w-44 px-3 py-1.5 bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-xl text-xs font-bold text-[var(--texto-primario)] focus:border-[var(--nitro-primaria)] focus:ring-1 focus:ring-[var(--nitro-primaria)] outline-none transition-colors shadow-2xs"
              />
              <datalist id="sleeve-type-datalist">
                <option value="Manga Curta" />
                <option value="Manga Longa" />
                <option value="Manga Longa c/ Punho Ribana" />
                <option value="Manga 3/4" />
                <option value="Regata Tradicional" />
                <option value="Regata Machão" />
                <option value="Manga Japonesa" />
              </datalist>
            </div>
          </div>
        </div>
      )}

      {/* Grade Adulto (Sempre visível como padrão) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[var(--texto-primario)] flex items-center gap-1.5">
            Grade Adulto <span className="text-[11px] text-[var(--texto-secundario)]">({totalAdult} peças)</span>
          </span>
          <span className="text-[11px] text-[var(--alerta)] font-medium">
            *G1 e G2 possuem sobrepreço de +{specialSizeSurchargePct}%
          </span>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {adultKeys.map(({ key, label, isSpecial }) => {
            const count = sizes[key] || 0;
            return (
              <div
                key={key}
                className={`flex flex-col items-center p-2 rounded-xl border-2 transition-all duration-150 ${
                  isSpecial
                    ? 'bg-[var(--alerta-bg)] border-[var(--alerta)]/60 hover:border-[var(--alerta)]'
                    : count > 0
                    ? 'bg-[var(--nitro-primaria)]/15 border-[var(--nitro-primaria)] shadow-md shadow-[var(--nitro-primaria)]/20'
                    : 'bg-[var(--bg-superficie)] border-[var(--borda-sutil)] hover:border-[var(--borda-hover)]'
                }`}
              >
                <div className="flex items-center gap-1 mb-1">
                  <span
                    className={`text-xs font-black ${
                      isSpecial ? 'text-[var(--alerta)]' : count > 0 ? 'text-[var(--nitro-primaria)]' : 'text-[var(--texto-primario)]'
                    }`}
                  >
                    {label}
                  </span>
                  {isSpecial && (
                    <span className="text-[9px] bg-[var(--alerta)]/20 text-[var(--alerta)] px-1 rounded font-bold">
                      Esp
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  min="0"
                  value={count === 0 ? '' : count}
                  placeholder="0"
                  onChange={(e) => updateSize(key, parseInt(e.target.value) || 0)}
                  className="w-full text-center py-1.5 bg-[var(--bg-input)] border-2 border-[var(--borda-sutil)] focus:border-[var(--nitro-primaria)] rounded-lg text-sm font-black text-[var(--texto-primario)] focus:outline-none font-mono transition-colors duration-150"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Grade Infantil: Opcional e Fechada por Padrão */}
      {!showChildSizes ? (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowChildSizes(true)}
            className="w-full py-2.5 px-3.5 bg-[var(--bg-superficie)] hover:bg-[var(--bg-elevado)] border border-dashed border-[var(--borda-sutil)] hover:border-[var(--nitro-primaria)]/60 rounded-xl flex items-center justify-between text-xs font-semibold text-[var(--texto-secundario)] hover:text-[var(--texto-primario)] transition-all duration-200 cursor-pointer group shadow-sm"
          >
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-[var(--bg-elevado)] group-hover:bg-[var(--nitro-primaria)]/20 text-[var(--nitro-primaria)] transition-colors">
                <Plus className="w-3.5 h-3.5" />
              </span>
              <span>Incluir Grade de Tamanhos Infantis (02 ao 16)</span>
              <span className="text-[10px] bg-[var(--bg-elevado)] text-[var(--texto-mutado)] px-2 py-0.5 rounded-full font-medium">
                Opcional
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--texto-mutado)] group-hover:text-[var(--nitro-primaria)]">
              <span>Expandir</span>
              <ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
            </div>
          </button>
        </div>
      ) : (
        <div className="pt-2 p-3.5 rounded-2xl bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--borda-sutil)]">
            <div className="flex items-center gap-2">
              <Baby className="w-4 h-4 text-[var(--nitro-azul)]" />
              <span className="text-xs font-bold text-[var(--texto-primario)] flex items-center gap-1.5">
                Grade Infantil <span className="text-[11px] text-[var(--texto-secundario)]">({totalChild} peças)</span>
              </span>
              <span className="text-[10px] bg-[var(--nitro-azul)]/10 text-[var(--nitro-azul)] px-2 py-0.5 rounded-full font-semibold border border-[var(--nitro-azul)]/20">
                Tamanhos 02 ao 16
              </span>
            </div>

            <div className="flex items-center gap-2">
              {totalChild > 0 && (
                <button
                  type="button"
                  onClick={clearChildSizes}
                  title="Zerar e recolher grade infantil"
                  className="text-[11px] text-[var(--perigo)] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                >
                  <Trash2 className="w-3 h-3" />
                  Zerar e Ocultar
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowChildSizes(false)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--bg-elevado)] hover:bg-[var(--borda-hover)] text-xs text-[var(--texto-secundario)] hover:text-[var(--texto-primario)] transition-colors cursor-pointer"
              >
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Ocultar</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {childKeys.map(({ key, label }) => {
              const count = sizes[key] || 0;
              return (
                <div
                  key={key}
                  className={`flex flex-col items-center p-2 rounded-xl border-2 transition-all duration-150 ${
                    count > 0
                      ? 'bg-[var(--nitro-azul)]/15 border-[var(--nitro-azul)] shadow-md shadow-[var(--nitro-azul)]/20'
                      : 'bg-[var(--bg-superficie)] border-[var(--borda-sutil)] hover:border-[var(--borda-hover)]'
                  }`}
                >
                  <span className={`text-xs font-black mb-1 ${count > 0 ? 'text-[var(--nitro-azul)]' : 'text-[var(--texto-primario)]'}`}>{label}</span>
                  <input
                    type="number"
                    min="0"
                    value={count === 0 ? '' : count}
                    placeholder="0"
                    onChange={(e) => updateSize(key, parseInt(e.target.value) || 0)}
                    className="w-full text-center py-1.5 bg-[var(--bg-input)] border-2 border-[var(--borda-sutil)] focus:border-[var(--nitro-azul)] rounded-lg text-sm font-black text-[var(--texto-primario)] focus:outline-none font-mono transition-colors duration-150"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

