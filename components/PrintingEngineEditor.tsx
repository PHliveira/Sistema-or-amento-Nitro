'use client';

import React, { useState } from 'react';
import {
  DTFPosition,
  PrintingEngine,
  SilkInkType,
  SilkPosition,
  SublimationMode,
  ViewMode,
  WeedingComplexity,
} from '../lib/types';
import { Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';

interface PrintingEngineEditorProps {
  printing: PrintingEngine;
  onChange: (updated: PrintingEngine) => void;
  viewMode: ViewMode;
  itemQuantity: number;
}

export const PrintingEngineEditor: React.FC<PrintingEngineEditorProps> = ({
  printing,
  onChange,
  viewMode,
  itemQuantity,
}) => {
  const [activeTab, setActiveTab] = useState<'silk' | 'dtf' | 'sublimation' | 'vinyl'>('silk');

  // 1. Silk Handlers
  const toggleSilk = () => {
    onChange({
      ...printing,
      silk: {
        ...printing.silk,
        enabled: !printing.silk.enabled,
      },
    });
  };

  const addSilkPosition = () => {
    const newPos: SilkPosition = {
      id: 'silk-pos-' + Date.now(),
      position: 'Costas (Superior)',
      colorsCount: 1,
      inkType: 'Plastisol',
      inkCostPerPiece: 0.45,
    };
    onChange({
      ...printing,
      silk: {
        ...printing.silk,
        positions: [...printing.silk.positions, newPos],
      },
    });
  };

  const removeSilkPosition = (id: string) => {
    onChange({
      ...printing,
      silk: {
        ...printing.silk,
        positions: printing.silk.positions.filter((p) => p.id !== id),
      },
    });
  };

  const updateSilkPosition = (id: string, updates: Partial<SilkPosition>) => {
    onChange({
      ...printing,
      silk: {
        ...printing.silk,
        positions: printing.silk.positions.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      },
    });
  };

  // 2. DTF Handlers
  const toggleDTF = () => {
    onChange({
      ...printing,
      dtf: {
        ...printing.dtf,
        enabled: !printing.dtf.enabled,
      },
    });
  };

  const addDTFPosition = () => {
    const newPos: DTFPosition = {
      id: 'dtf-pos-' + Date.now(),
      label: 'Estampa Nova',
      widthCm: 15,
      heightCm: 15,
      pressLaborCost: 2.0,
    };
    onChange({
      ...printing,
      dtf: {
        ...printing.dtf,
        positions: [...printing.dtf.positions, newPos],
      },
    });
  };

  const removeDTFPosition = (id: string) => {
    onChange({
      ...printing,
      dtf: {
        ...printing.dtf,
        positions: printing.dtf.positions.filter((p) => p.id !== id),
      },
    });
  };

  const updateDTFPosition = (id: string, updates: Partial<DTFPosition>) => {
    onChange({
      ...printing,
      dtf: {
        ...printing.dtf,
        positions: printing.dtf.positions.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      },
    });
  };

  // 3. Sublimation Handlers
  const toggleSublimation = () => {
    onChange({
      ...printing,
      sublimation: {
        ...printing.sublimation,
        enabled: !printing.sublimation.enabled,
      },
    });
  };

  const updateSublimation = (updates: Partial<typeof printing.sublimation>) => {
    onChange({
      ...printing,
      sublimation: {
        ...printing.sublimation,
        ...updates,
      },
    });
  };

  // 4. Vinyl Handlers
  const toggleVinyl = () => {
    onChange({
      ...printing,
      vinyl: {
        ...printing.vinyl,
        enabled: !printing.vinyl.enabled,
      },
    });
  };

  const updateVinyl = (updates: Partial<typeof printing.vinyl>) => {
    onChange({
      ...printing,
      vinyl: {
        ...printing.vinyl,
        ...updates,
      },
    });
  };

  // Counts of enabled techs
  const enabledCount =
    (printing.silk.enabled ? 1 : 0) +
    (printing.dtf.enabled ? 1 : 0) +
    (printing.sublimation.enabled ? 1 : 0) +
    (printing.vinyl.enabled ? 1 : 0);

  return (
    <div className="space-y-3 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-2xl p-3 sm:p-4 transition-colors duration-200">
      {/* Header do Motor de Estamparia */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--borda-sutil)]">
        <div>
          <span className="text-xs font-bold text-[var(--texto-primario)] uppercase tracking-wider block">
            Motor de Cálculo de Estamparia
          </span>
          <span className="text-[11px] text-[var(--texto-secundario)] block mt-0.5">
            {enabledCount === 0
              ? 'Nenhuma técnica selecionada (peça lisa)'
              : `${enabledCount} técnica(s) configurada(s) para este item`}
          </span>
        </div>

        {/* Segmented Tabs - Grade responsiva de 2 colunas no mobile, barra horizontal em telas maiores */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 p-1 bg-[var(--bg-elevado)] rounded-xl border border-[var(--borda-sutil)] w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('silk')}
            className={`flex items-center justify-center sm:justify-start gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ease-out cursor-pointer ${
              activeTab === 'silk'
                ? 'bg-[var(--nitro-primaria)] text-white shadow-sm'
                : 'text-[var(--texto-secundario)] hover:text-[var(--texto-primario)] hover:bg-[var(--bg-superficie)]'
            }`}
          >
            {printing.silk.enabled ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
            ) : (
              <Circle className="w-3.5 h-3.5 text-[var(--texto-mutado)] shrink-0" />
            )}
            <span className="truncate">Silk Screen</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dtf')}
            className={`flex items-center justify-center sm:justify-start gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ease-out cursor-pointer ${
              activeTab === 'dtf'
                ? 'bg-[var(--nitro-primaria)] text-white shadow-sm'
                : 'text-[var(--texto-secundario)] hover:text-[var(--texto-primario)] hover:bg-[var(--bg-superficie)]'
            }`}
          >
            {printing.dtf.enabled ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
            ) : (
              <Circle className="w-3.5 h-3.5 text-[var(--texto-mutado)] shrink-0" />
            )}
            <span className="truncate">DTF Digital</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sublimation')}
            className={`flex items-center justify-center sm:justify-start gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ease-out cursor-pointer ${
              activeTab === 'sublimation'
                ? 'bg-[var(--nitro-primaria)] text-white shadow-sm'
                : 'text-[var(--texto-secundario)] hover:text-[var(--texto-primario)] hover:bg-[var(--bg-superficie)]'
            }`}
          >
            {printing.sublimation.enabled ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
            ) : (
              <Circle className="w-3.5 h-3.5 text-[var(--texto-mutado)] shrink-0" />
            )}
            <span className="truncate">Sublimação</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vinyl')}
            className={`flex items-center justify-center sm:justify-start gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ease-out cursor-pointer ${
              activeTab === 'vinyl'
                ? 'bg-[var(--nitro-primaria)] text-white shadow-sm'
                : 'text-[var(--texto-secundario)] hover:text-[var(--texto-primario)] hover:bg-[var(--bg-superficie)]'
            }`}
          >
            {printing.vinyl.enabled ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
            ) : (
              <Circle className="w-3.5 h-3.5 text-[var(--texto-mutado)] shrink-0" />
            )}
            <span className="truncate">Filme Recorte</span>
          </button>
        </div>
      </div>

      {/* ─── TAB 1: SILK SCREEN ─── */}
      {activeTab === 'silk' && (
        <div className="space-y-4 pt-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-[var(--bg-superficie)] rounded-xl border border-[var(--borda-sutil)]">
            <div className="min-w-0 flex-1">
              <span className="text-sm font-bold text-[var(--texto-primario)] block">
                Silk Screen (Serigrafia Têxtil)
              </span>
              <p className="text-xs text-[var(--texto-secundario)] mt-0.5">
                Custo de matrizes/telas rateado pelo lote + passadas de cor por peça.
              </p>
            </div>
            <button
              type="button"
              onClick={toggleSilk}
              className={`w-full sm:w-auto px-4 py-2 sm:py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ease-out cursor-pointer text-center shrink-0 ${
                printing.silk.enabled
                  ? 'bg-[var(--sucesso)] text-slate-950 hover:bg-emerald-400'
                  : 'bg-[var(--bg-elevado)] text-[var(--texto-secundario)] hover:bg-[var(--borda-hover)]'
              }`}
            >
              {printing.silk.enabled ? '✓ Ativado neste Item' : '+ Ativar Técnica'}
            </button>
          </div>

          {printing.silk.enabled && (
            <div className="space-y-3">
              {viewMode === 'manager' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-[var(--bg-elevado)] border border-[var(--borda-sutil)] rounded-xl text-xs">
                  <div>
                    <label className="text-[var(--texto-secundario)] font-medium">Custo por Matriz/Tela (R$)</label>
                    <input
                      type="number"
                      step="1"
                      value={printing.silk.costPerScreen}
                      onChange={(e) =>
                        onChange({
                          ...printing,
                          silk: { ...printing.silk, costPerScreen: parseFloat(e.target.value) || 0 },
                        })
                      }
                      className="w-full mt-1 px-3 py-2 sm:py-1.5 bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-lg text-[var(--texto-primario)] font-mono font-bold focus:border-[var(--nitro-primaria)] outline-none"
                    />
                    <span className="text-[10px] text-[var(--texto-mutado)] mt-0.5 block">
                      Fotolito, revelação e gravação
                    </span>
                  </div>
                  <div>
                    <label className="text-[var(--texto-secundario)] font-medium">Mão de Obra por Passada (R$)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={printing.silk.applicationLaborPerPass}
                      onChange={(e) =>
                        onChange({
                          ...printing,
                          silk: {
                            ...printing.silk,
                            applicationLaborPerPass: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full mt-1 px-3 py-2 sm:py-1.5 bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-lg text-[var(--texto-primario)] font-mono font-bold focus:border-[var(--nitro-primaria)] outline-none"
                    />
                    <span className="text-[10px] text-[var(--texto-mutado)] mt-0.5 block">
                      Custo do estampador por cor aplicada
                    </span>
                  </div>
                </div>
              )}

              {/* Lista de Posições do Silk */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[var(--texto-primario)]">
                    Posições de Estampa & Cores:
                  </span>
                  <button
                    type="button"
                    onClick={addSilkPosition}
                    className="flex items-center gap-1 text-xs text-[var(--nitro-primaria)] hover:text-[var(--nitro-primaria-hover)] font-bold transition-colors duration-150 cursor-pointer p-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Posição
                  </button>
                </div>

                {printing.silk.positions.map((pos) => (
                  <div
                    key={pos.id}
                    className="p-3 bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-xl space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-2.5 transition-colors duration-150"
                  >
                    {/* Linha 1 no Mobile: Local da estampa & Botão Excluir */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <select
                        value={pos.position}
                        onChange={(e) =>
                          updateSilkPosition(pos.id, {
                            position: e.target.value as SilkPosition['position'],
                          })
                        }
                        className="w-full px-2.5 py-2 sm:py-1.5 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-lg text-xs text-[var(--texto-primario)] font-medium focus:border-[var(--nitro-primaria)] outline-none"
                      >
                        <option value="Frente (Peito Pequeno)">Frente (Peito Pequeno)</option>
                        <option value="Frente (Estampa Grande)">Frente (Estampa Grande A3/A4)</option>
                        <option value="Costas (Superior)">Costas (Superior Escapulário)</option>
                        <option value="Costas (Total)">Costas (Total A3)</option>
                        <option value="Manga Direita">Manga Direita</option>
                        <option value="Manga Esquerda">Manga Esquerda</option>
                      </select>

                      {printing.silk.positions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSilkPosition(pos.id)}
                          aria-label="Remover posição"
                          className="sm:hidden p-2 text-[var(--texto-secundario)] hover:text-[var(--perigo)] hover:bg-[var(--perigo-bg)] rounded-lg transition-colors shrink-0 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Linha 2 no Mobile: Quantidade de cores & Tipo de tinta */}
                    <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-2.5">
                      <div className="flex items-center bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-lg px-2.5 py-1.5 sm:w-28">
                        <span className="text-[11px] text-[var(--texto-secundario)] mr-1.5 whitespace-nowrap">Cores:</span>
                        <input
                          type="number"
                          min="1"
                          max="8"
                          value={pos.colorsCount}
                          onChange={(e) =>
                            updateSilkPosition(pos.id, {
                              colorsCount: Math.max(1, parseInt(e.target.value) || 1),
                            })
                          }
                          className="w-full bg-transparent text-xs text-[var(--texto-primario)] font-bold text-center font-mono focus:outline-none"
                        />
                      </div>

                      <div className="sm:w-48">
                        <select
                          value={pos.inkType}
                          onChange={(e) => {
                            const ink = e.target.value as SilkInkType;
                            let cost = 0.35;
                            if (ink === 'Plastisol') cost = 0.5;
                            if (ink === 'Corrosão / Discharge') cost = 0.65;
                            if (ink === 'Metálico / Foil') cost = 0.85;
                            updateSilkPosition(pos.id, { inkType: ink, inkCostPerPiece: cost });
                          }}
                          className="w-full px-2.5 py-2 sm:py-1.5 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-lg text-xs text-[var(--texto-primario)] font-medium focus:border-[var(--nitro-primaria)] outline-none"
                        >
                          <option value="Hidrocryl (À Base de Água)">Hidrocryl (Base Água)</option>
                          <option value="Plastisol">Plastisol (Relevo)</option>
                          <option value="Corrosão / Discharge">Corrosão (Toque Zero)</option>
                          <option value="Metálico / Foil">Metálico / Foil</option>
                        </select>
                      </div>

                      {/* Botão Remover visível no Desktop */}
                      {printing.silk.positions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSilkPosition(pos.id)}
                          aria-label="Remover posição"
                          className="hidden sm:flex p-1.5 text-[var(--texto-secundario)] hover:text-[var(--perigo)] hover:bg-[var(--perigo-bg)] rounded-lg transition-colors duration-150 cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: DTF DIGITAL ─── */}
      {activeTab === 'dtf' && (
        <div className="space-y-4 pt-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-[var(--bg-superficie)] rounded-xl border border-[var(--borda-sutil)]">
            <div className="min-w-0 flex-1">
              <span className="text-sm font-bold text-[var(--texto-primario)] block">
                DTF (Direct to Film)
              </span>
              <p className="text-xs text-[var(--texto-secundario)] mt-0.5">
                Impressão digital sem limite de cores calculada por área/metro + prensagem.
              </p>
            </div>
            <button
              type="button"
              onClick={toggleDTF}
              className={`w-full sm:w-auto px-4 py-2 sm:py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ease-out cursor-pointer text-center shrink-0 ${
                printing.dtf.enabled
                  ? 'bg-[var(--sucesso)] text-slate-950 hover:bg-emerald-400'
                  : 'bg-[var(--bg-elevado)] text-[var(--texto-secundario)] hover:bg-[var(--borda-hover)]'
              }`}
            >
              {printing.dtf.enabled ? '✓ Ativado neste Item' : '+ Ativar Técnica'}
            </button>
          </div>

          {printing.dtf.enabled && (
            <div className="space-y-3">
              {viewMode === 'manager' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-[var(--bg-elevado)] border border-[var(--borda-sutil)] rounded-xl text-xs">
                  <div>
                    <label className="text-[var(--texto-secundario)] font-medium">Custo do Filme por m² (R$)</label>
                    <input
                      type="number"
                      step="5"
                      value={printing.dtf.costPerSquareMeter}
                      onChange={(e) =>
                        onChange({
                          ...printing,
                          dtf: {
                            ...printing.dtf,
                            costPerSquareMeter: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full mt-1 px-3 py-2 sm:py-1.5 bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-lg text-[var(--texto-primario)] font-mono font-bold focus:border-[var(--nitro-primaria)] outline-none"
                    />
                    <span className="text-[10px] text-[var(--texto-mutado)] mt-0.5 block">
                      Valor do metro impresso com pó de poliamida
                    </span>
                  </div>
                  <div>
                    <label className="text-[var(--texto-secundario)] font-medium">Margem de Sangria/Borda (%)</label>
                    <input
                      type="number"
                      step="1"
                      value={printing.dtf.wasteBufferPct}
                      onChange={(e) =>
                        onChange({
                          ...printing,
                          dtf: {
                            ...printing.dtf,
                            wasteBufferPct: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full mt-1 px-3 py-2 sm:py-1.5 bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-lg text-[var(--texto-primario)] font-mono font-bold focus:border-[var(--nitro-primaria)] outline-none"
                    />
                    <span className="text-[10px] text-[var(--texto-mutado)] mt-0.5 block">
                      Espaço de corte entre artes no rolo
                    </span>
                  </div>
                </div>
              )}

              {/* Posições DTF */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[var(--texto-primario)]">
                    Artes DTF & Dimensões (Largura × Altura cm):
                  </span>
                  <button
                    type="button"
                    onClick={addDTFPosition}
                    className="flex items-center gap-1 text-xs text-[var(--nitro-primaria)] hover:text-[var(--nitro-primaria-hover)] font-bold transition-colors duration-150 cursor-pointer p-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Estampa DTF
                  </button>
                </div>

                {printing.dtf.positions.map((pos) => {
                  const areaCm2 = pos.widthCm * pos.heightCm;
                  const areaM2 = (areaCm2 / 10000) * (1 + printing.dtf.wasteBufferPct / 100);
                  const filmCost = areaM2 * printing.dtf.costPerSquareMeter;
                  const unitEstCost = filmCost + pos.pressLaborCost;

                  return (
                    <div
                      key={pos.id}
                      className="p-3 bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-xl space-y-2.5 sm:space-y-0 sm:flex sm:items-center sm:gap-2.5 transition-colors duration-150"
                    >
                      {/* Linha 1 no Mobile: Nome da estampa e Excluir */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <input
                          type="text"
                          value={pos.label}
                          placeholder="Ex: Logo Peito"
                          onChange={(e) => updateDTFPosition(pos.id, { label: e.target.value })}
                          className="w-full px-2.5 py-2 sm:py-1.5 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-lg text-xs text-[var(--texto-primario)] font-medium focus:border-[var(--nitro-primaria)] outline-none"
                        />
                        {printing.dtf.positions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeDTFPosition(pos.id)}
                            aria-label="Remover estampa"
                            className="sm:hidden p-2 text-[var(--texto-secundario)] hover:text-[var(--perigo)] hover:bg-[var(--perigo-bg)] rounded-lg transition-colors shrink-0 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Linha 2 no Mobile: Dimensões, Prensa e Custo Unitário */}
                      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-start gap-2 sm:gap-2.5">
                        {/* Dimensões L × A */}
                        <div className="flex items-center bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-lg px-2 py-1.5">
                          <span className="text-[10px] text-[var(--texto-secundario)] mr-1 font-medium">Tam:</span>
                          <input
                            type="number"
                            step="0.5"
                            min="1"
                            value={pos.widthCm}
                            placeholder="L"
                            title="Largura em centímetros"
                            onChange={(e) =>
                              updateDTFPosition(pos.id, {
                                widthCm: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-11 bg-transparent text-xs text-[var(--texto-primario)] text-center font-mono font-bold focus:outline-none"
                          />
                          <span className="text-[var(--texto-secundario)] text-xs mx-0.5">×</span>
                          <input
                            type="number"
                            step="0.5"
                            min="1"
                            value={pos.heightCm}
                            placeholder="A"
                            title="Altura em centímetros"
                            onChange={(e) =>
                              updateDTFPosition(pos.id, {
                                heightCm: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-11 bg-transparent text-xs text-[var(--texto-primario)] text-center font-mono font-bold focus:outline-none"
                          />
                          <span className="text-[10px] text-[var(--texto-secundario)] ml-1">cm</span>
                        </div>

                        {/* Prensa */}
                        <div className="flex items-center bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-lg px-2 py-1.5">
                          <span className="text-[10px] text-[var(--texto-secundario)] mr-1.5 whitespace-nowrap">Prensa:</span>
                          <input
                            type="number"
                            step="0.5"
                            value={pos.pressLaborCost}
                            onChange={(e) =>
                              updateDTFPosition(pos.id, {
                                pressLaborCost: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-12 bg-transparent text-xs text-[var(--texto-primario)] font-bold text-center font-mono focus:outline-none"
                          />
                          <span className="text-[10px] text-[var(--texto-secundario)]">R$</span>
                        </div>

                        {viewMode === 'manager' && (
                          <div className="text-[11px] text-[var(--sucesso)] font-mono font-semibold whitespace-nowrap px-2 py-1 rounded bg-[var(--sucesso)]/10 border border-[var(--sucesso)]/20">
                            ~R$ {unitEstCost.toFixed(2)}/un
                          </div>
                        )}

                        {/* Botão Remover visível no Desktop */}
                        {printing.dtf.positions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeDTFPosition(pos.id)}
                            aria-label="Remover estampa"
                            className="hidden sm:flex p-1.5 text-[var(--texto-secundario)] hover:text-[var(--perigo)] hover:bg-[var(--perigo-bg)] rounded-lg transition-colors shrink-0 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: SUBLIMAÇÃO ─── */}
      {activeTab === 'sublimation' && (
        <div className="space-y-4 pt-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-[var(--bg-superficie)] rounded-xl border border-[var(--borda-sutil)]">
            <div className="min-w-0 flex-1">
              <span className="text-sm font-bold text-[var(--texto-primario)] block">
                Sublimação Têxtil
              </span>
              <p className="text-xs text-[var(--texto-secundario)] mt-0.5">
                Exclusivo para tecidos com base poliéster. Papel transfer + calandra ou prensa plana.
              </p>
            </div>
            <button
              type="button"
              onClick={toggleSublimation}
              className={`w-full sm:w-auto px-4 py-2 sm:py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ease-out cursor-pointer text-center shrink-0 ${
                printing.sublimation.enabled
                  ? 'bg-[var(--sucesso)] text-slate-950 hover:bg-emerald-400'
                  : 'bg-[var(--bg-elevado)] text-[var(--texto-secundario)] hover:bg-[var(--borda-hover)]'
              }`}
            >
              {printing.sublimation.enabled ? '✓ Ativado neste Item' : '+ Ativar Técnica'}
            </button>
          </div>

          {printing.sublimation.enabled && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[var(--texto-primario)] block mb-1.5">
                  Modalidade do Fluxo de Produção:
                </label>
                <select
                  value={printing.sublimation.mode}
                  onChange={(e) =>
                    updateSublimation({ mode: e.target.value as SublimationMode })
                  }
                  className="w-full px-3 py-2 bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-xl text-xs text-[var(--texto-primario)] font-medium focus:border-[var(--nitro-primaria)] outline-none"
                >
                  <option value="total">
                    1. Completo: Tecido + Impressão Papel + Calandra/Prensa + Corte (Sublimação Total)
                  </option>
                  <option value="apenas_impressao">
                    2. Somente Impressão (Cliente traz tecido ou faz a prensa interna)
                  </option>
                  <option value="apenas_prensagem">
                    3. Somente Prensagem Térmica (Papel já fornecido)
                  </option>
                  <option value="impressao_e_prensagem">
                    4. Tecido + Impressão + Prensagem (Sem corte modelado)
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-[var(--texto-secundario)] font-medium">Metragem por Peça (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={printing.sublimation.linearMeters}
                    onChange={(e) =>
                      updateSublimation({ linearMeters: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full mt-1 px-3 py-2 sm:py-1.5 bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-lg text-[var(--texto-primario)] font-mono font-bold text-xs focus:border-[var(--nitro-primaria)] outline-none"
                  />
                  <span className="text-[10px] text-[var(--texto-mutado)] mt-0.5 block">
                    Média 1.1m a 1.3m p/ camiseta
                  </span>
                </div>

                {viewMode === 'manager' && (
                  <>
                    <div>
                      <label className="text-[11px] text-[var(--texto-secundario)] font-medium">Papel + Tinta (R$/m)</label>
                      <input
                        type="number"
                        step="1"
                        value={printing.sublimation.paperAndInkCostPerMeter}
                        onChange={(e) =>
                          updateSublimation({
                            paperAndInkCostPerMeter: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full mt-1 px-3 py-2 sm:py-1.5 bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-lg text-[var(--texto-primario)] font-mono font-bold text-xs focus:border-[var(--nitro-primaria)] outline-none"
                      />
                      <span className="text-[10px] text-[var(--texto-mutado)] mt-0.5 block">
                        Impressão transfer corrida
                      </span>
                    </div>

                    <div>
                      <label className="text-[11px] text-[var(--texto-secundario)] font-medium">Calandra / Prensa (R$/m)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={printing.sublimation.pressOrCalenderCostPerMeter}
                        onChange={(e) =>
                          updateSublimation({
                            pressOrCalenderCostPerMeter: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full mt-1 px-3 py-2 sm:py-1.5 bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-lg text-[var(--texto-primario)] font-mono font-bold text-xs focus:border-[var(--nitro-primaria)] outline-none"
                      />
                      <span className="text-[10px] text-[var(--texto-mutado)] mt-0.5 block">
                        Transferência térmica
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 4: FILME DE RECORTE ─── */}
      {activeTab === 'vinyl' && (
        <div className="space-y-4 pt-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-[var(--bg-superficie)] rounded-xl border border-[var(--borda-sutil)]">
            <div className="min-w-0 flex-1">
              <span className="text-sm font-bold text-[var(--texto-primario)] block">
                Filme de Recorte (Plotter & Depilação)
              </span>
              <p className="text-xs text-[var(--texto-secundario)] mt-0.5">
                Área de vinil térmico + tempo de depilação manual pelo operador + prensa.
              </p>
            </div>
            <button
              type="button"
              onClick={toggleVinyl}
              className={`w-full sm:w-auto px-4 py-2 sm:py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ease-out cursor-pointer text-center shrink-0 ${
                printing.vinyl.enabled
                  ? 'bg-[var(--sucesso)] text-slate-950 hover:bg-emerald-400'
                  : 'bg-[var(--bg-elevado)] text-[var(--texto-secundario)] hover:bg-[var(--borda-hover)]'
              }`}
            >
              {printing.vinyl.enabled ? '✓ Ativado neste Item' : '+ Ativar Técnica'}
            </button>
          </div>

          {printing.vinyl.enabled && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-[var(--texto-secundario)] font-medium">Dimensões (L × A cm)</label>
                  <div className="flex items-center gap-1.5 mt-1 bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-lg px-2.5 py-1.5">
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={printing.vinyl.widthCm}
                      onChange={(e) =>
                        updateVinyl({ widthCm: parseFloat(e.target.value) || 0 })
                      }
                      className="w-14 bg-transparent text-xs text-[var(--texto-primario)] text-center font-mono font-bold focus:outline-none"
                    />
                    <span className="text-[var(--texto-secundario)] text-xs">×</span>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={printing.vinyl.heightCm}
                      onChange={(e) =>
                        updateVinyl({ heightCm: parseFloat(e.target.value) || 0 })
                      }
                      className="w-14 bg-transparent text-xs text-[var(--texto-primario)] text-center font-mono font-bold focus:outline-none"
                    />
                    <span className="text-[11px] text-[var(--texto-secundario)] ml-auto">cm</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-[var(--texto-secundario)] font-medium">
                    Complexidade de Depilação
                  </label>
                  <select
                    value={printing.vinyl.complexity}
                    onChange={(e) => {
                      const comp = e.target.value as WeedingComplexity;
                      let minutes = 1;
                      if (comp === 'media') minutes = 3;
                      if (comp === 'alta') minutes = 7;
                      updateVinyl({ complexity: comp, weedingMinutes: minutes });
                    }}
                    className="w-full mt-1 px-3 py-2 sm:py-1.5 bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-lg text-xs text-[var(--texto-primario)] font-medium focus:border-[var(--nitro-primaria)] outline-none"
                  >
                    <option value="facil">Fácil (Números / Letras - 1 min)</option>
                    <option value="media">Média (Logos normais - 3 min)</option>
                    <option value="alta">Alta (Recortes finos - 7 min)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-[var(--texto-secundario)] font-medium">Tempo Depilação (min)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={printing.vinyl.weedingMinutes}
                    onChange={(e) =>
                      updateVinyl({ weedingMinutes: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full mt-1 px-3 py-2 sm:py-1.5 bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-lg text-[var(--texto-primario)] font-mono font-bold text-xs focus:border-[var(--nitro-primaria)] outline-none"
                  />
                </div>
              </div>

              {viewMode === 'manager' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-[var(--bg-elevado)] border border-[var(--borda-sutil)] rounded-xl text-xs">
                  <div>
                    <label className="text-[var(--texto-secundario)] font-medium">Custo Vinil m² (R$)</label>
                    <input
                      type="number"
                      step="5"
                      value={printing.vinyl.vinylCostPerSqMeter}
                      onChange={(e) =>
                        updateVinyl({ vinylCostPerSqMeter: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full mt-1 px-3 py-2 sm:py-1.5 bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-lg text-[var(--texto-primario)] font-mono font-bold focus:border-[var(--nitro-primaria)] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[var(--texto-secundario)] font-medium">Custo Minuto Operador (R$)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={printing.vinyl.operatorMinuteCost}
                      onChange={(e) =>
                        updateVinyl({ operatorMinuteCost: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full mt-1 px-3 py-2 sm:py-1.5 bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-lg text-[var(--texto-primario)] font-mono font-bold focus:border-[var(--nitro-primaria)] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[var(--texto-secundario)] font-medium">Custo Prensa (R$)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={printing.vinyl.pressCost}
                      onChange={(e) =>
                        updateVinyl({ pressCost: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full mt-1 px-3 py-2 sm:py-1.5 bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-lg text-[var(--texto-primario)] font-mono font-bold focus:border-[var(--nitro-primaria)] outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
