'use client';

import React from 'react';
import { CalculatedItemCost, Fabric, ProductTemplate, QuoteItem, ViewMode } from '../lib/types';
import { DEFAULT_FABRICS, DEFAULT_PRODUCT_TEMPLATES } from '../lib/default-data';
import { formatBRL } from '../lib/format';
import { ProductDropdown } from './ProductDropdown';
import { SizeGridSelector } from './SizeGridSelector';
import { PrintingEngineEditor } from './PrintingEngineEditor';
import { CostBreakdownDrawer } from './CostBreakdownDrawer';
import { extractItemPrintingSummary } from '../lib/google-sheets-sync';
import {
  getProxiedImageUrl,
  isNonImageVectorExtension,
  normalizeExternalImageUrl,
} from '../lib/image-url';
import {
  Copy,
  Trash2,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Link as LinkIcon,
  X,
  Maximize2,
  Layers,
  ExternalLink,
  FileCheck2,
  Tag,
  AlertTriangle,
} from 'lucide-react';

interface QuoteItemEditorProps {
  item: QuoteItem;
  itemIndex: number;
  totalItems: number;
  calculatedCost: CalculatedItemCost;
  viewMode: ViewMode;
  fabrics?: Fabric[];
  products?: ProductTemplate[];
  onUpdateItem: (updated: QuoteItem) => void;
  onDuplicateItem: () => void;
  onDeleteItem: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

const COLOR_PRESETS = [
  { name: 'Preto', hex: '#111111' },
  { name: 'Branco', hex: '#FFFFFF', border: true },
  { name: 'Cinza Mescla', hex: '#A8A8A8' },
  { name: 'Grafite / Chumbo', hex: '#374151' },
  { name: 'Azul Marinho', hex: '#0F1E3D' },
  { name: 'Azul Royal', hex: '#004DA8' },
  { name: 'Vermelho', hex: '#E82125' },
  { name: 'Laranja Nitro', hex: '#FF8300' },
  { name: 'Verde Militar', hex: '#4B5320' },
  { name: 'Verde Bandeira', hex: '#008037' },
  { name: 'Vinho / Bordô', hex: '#58111A' },
  { name: 'Amarelo Canário', hex: '#FACC15' },
  { name: 'Off-White / Bege', hex: '#E7E1D8' },
];

function getColorHex(colorName?: string): string {
  if (!colorName) return '#999999';
  const match = COLOR_PRESETS.find(
    (c) => c.name.toLowerCase() === colorName.toLowerCase() || colorName.toLowerCase().includes(c.name.toLowerCase())
  );
  if (match) return match.hex;
  if (colorName.startsWith('#')) return colorName;
  return '#999999';
}

export const QuoteItemEditor: React.FC<QuoteItemEditorProps> = ({
  item,
  itemIndex,
  totalItems,
  calculatedCost,
  viewMode,
  fabrics = DEFAULT_FABRICS,
  products,
  onUpdateItem,
  onDuplicateItem,
  onDeleteItem,
  isExpanded: isExpandedProp,
  onToggleExpand,
}) => {
  const [localExpanded, setLocalExpanded] = React.useState(true);
  const isExpanded = isExpandedProp !== undefined ? isExpandedProp : localExpanded;

  const toggleExpand = () => {
    if (onToggleExpand) {
      onToggleExpand();
    } else {
      setLocalExpanded(!localExpanded);
    }
  };

  const [zoomImage, setZoomImage] = React.useState<string | null>(null);
  const [mockupPreviewStage, setMockupPreviewStage] = React.useState<'proxy' | 'direct' | 'error'>('proxy');
  const [finalArtPreviewStage, setFinalArtPreviewStage] = React.useState<'proxy' | 'direct' | 'hidden'>('proxy');

  const printSummary = React.useMemo(() => extractItemPrintingSummary(item), [item]);

  const currentProduct = React.useMemo(() => {
    const list = products && products.length > 0 ? products : DEFAULT_PRODUCT_TEMPLATES;
    return (
      list.find((p) => p.id === item.productTemplateId) ||
      list.find((p) => p.name.toLowerCase() === item.title.toLowerCase()) ||
      list[0]
    );
  }, [products, item.productTemplateId, item.title]);

  const handleRemoveMockup = (idxToRemove: number) => {
    const currentMockups = item.mockupImages || [];
    onUpdateItem({
      ...item,
      mockupImages: currentMockups.filter((_, i) => i !== idxToRemove),
    });
  };

  const handleSelectProductTemplate = (template: ProductTemplate) => {
    onUpdateItem({
      ...item,
      productTemplateId: template.id,
      title: template.name,
      fabricId: template.defaultFabricId,
      sewingCost: template.defaultSewingCost,
      sewingComplexity: template.defaultComplexity,
      threadCost: template.defaultThreadCost,
      tagCost: template.defaultTagCost,
      packagingCost: template.defaultPackagingCost,
      zipperCost: template.defaultZipperCost || 0,
      buttonCost: template.defaultButtonCost || 0,
    });
  };

  return (
    <div className="bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-2xl overflow-hidden shadow-lg shadow-black/20 transition-all duration-200">
      {/* Top Bar do Item */}
      <div
        onClick={toggleExpand}
        className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[var(--bg-elevado)] border-b border-[var(--borda-sutil)] cursor-pointer select-none transition-colors hover:bg-[var(--borda-hover)]/40"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
          <span className="flex items-center justify-center px-2.5 h-7 rounded-lg bg-[var(--nitro-primaria)]/20 text-[var(--nitro-primaria)] font-mono font-black text-xs border border-[var(--nitro-primaria)]/40 shrink-0">
            #{itemIndex + 1}
          </span>
          <h3 className="text-sm md:text-base font-bold text-[var(--texto-primario)] tracking-tight truncate">
            Modelo de Produto: <span className="text-[var(--nitro-primaria)] font-extrabold">{currentProduct?.name || item.title}</span>
          </h3>

          {/* Badges de resumo rápido visíveis tanto expandido quanto recolhido */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded-full bg-[var(--nitro-azul)]/15 border border-[var(--nitro-azul)]/30 text-[11px] text-[var(--nitro-azul)] font-bold">
              {item.fitType || 'Unissex'}
            </span>

            <span className="px-2 py-0.5 rounded-full bg-[var(--nitro-primaria)]/15 border border-[var(--nitro-primaria)]/30 text-[11px] text-[var(--nitro-primaria)] font-bold">
              {item.sleeveType || 'Manga Curta'}
            </span>

            {item.color && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] text-[11px] text-[var(--texto-secundario)] font-medium">
                <span
                  className="w-2.5 h-2.5 rounded-full border border-black/30 shrink-0"
                  style={{ backgroundColor: getColorHex(item.color) }}
                />
                <span>{item.color}</span>
              </span>
            )}

            <span className="px-2 py-0.5 rounded-full bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] text-[11px] text-[var(--texto-secundario)] font-mono font-bold">
              {calculatedCost.totalQuantity} {calculatedCost.totalQuantity === 1 ? 'peça' : 'peças'}
            </span>

            {calculatedCost.totalQuantity > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[var(--nitro-primaria)]/15 border border-[var(--nitro-primaria)]/30 text-[var(--nitro-primaria)] font-mono font-bold text-[11px]">
                {formatBRL(calculatedCost.totalSellingPrice)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={onDuplicateItem}
            title="Duplicar Item com todas as configurações"
            className="flex items-center gap-1 px-2.5 py-1.5 bg-[var(--bg-superficie)] hover:bg-[var(--borda-hover)] text-[var(--texto-secundario)] hover:text-[var(--texto-primario)] rounded-lg text-xs font-semibold transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Duplicar</span>
          </button>

          {totalItems > 1 && (
            <button
              type="button"
              onClick={onDeleteItem}
              title="Remover Item"
              className="p-1.5 bg-[var(--bg-superficie)] hover:bg-[var(--perigo-bg)] text-[var(--texto-secundario)] hover:text-[var(--perigo)] rounded-lg text-xs transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={toggleExpand}
            title={isExpanded ? 'Recolher este modelo' : 'Expandir este modelo'}
            className="p-1.5 bg-[var(--bg-superficie)] hover:bg-[var(--borda-hover)] text-[var(--texto-secundario)] hover:text-[var(--texto-primario)] rounded-lg transition-all duration-200 ml-1 cursor-pointer"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 md:p-6 space-y-6">
          {/* Seção 1: Seleção de Produto, Tecido e Cor do Modelo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Menu Suspenso de Produto Base */}
            <ProductDropdown
              selectedTemplateId={item.productTemplateId}
              onSelectProduct={handleSelectProductTemplate}
              templates={products}
            />

            {/* Menu Suspenso de Tecido */}
            <div>
              <label className="block text-xs font-semibold text-[var(--texto-secundario)] uppercase tracking-wider mb-1.5">
                Tipo de Tecido & Composição
              </label>
              <select
                value={item.fabricId}
                onChange={(e) => onUpdateItem({ ...item, fabricId: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[var(--bg-input)] hover:border-[var(--borda-hover)] text-[var(--texto-primario)] text-sm font-semibold rounded-xl border-2 border-[var(--borda-sutil)] focus:border-[var(--nitro-primaria)] focus:ring-2 focus:ring-[var(--nitro-primaria)]/20 outline-none transition-all duration-150 cursor-pointer shadow-xs"
              >
                {fabrics.map((fab) => (
                  <option key={fab.id} value={fab.id} className="bg-[var(--bg-superficie)] text-[var(--texto-primario)]">
                    {fab.name} ({fab.composition} - R$ {fab.pricePerUnit.toFixed(2)}/{fab.unitType})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-[var(--texto-mutado)] mt-1 pl-1 font-medium">
                {fabrics.find((f) => f.id === item.fabricId)?.notes || ''}
              </p>

              {(() => {
                const currentFab = fabrics.find((f) => f.id === item.fabricId) || fabrics[0];
                if (!currentFab?.hasPunho) return null;
                const punhoCost =
                  currentFab.punhoYieldPerUnit && currentFab.punhoYieldPerUnit > 0
                    ? ((currentFab.punhoPricePerUnit || 0) / currentFab.punhoYieldPerUnit) *
                      (1 + (currentFab.punhoWasteMarginPct || 0) / 100)
                    : 0;
                const totalPieces = calculatedCost.totalQuantity;
                const punhoBuyTotal =
                  totalPieces > 0 && currentFab.punhoYieldPerUnit
                    ? (totalPieces / currentFab.punhoYieldPerUnit) *
                      (1 + (currentFab.punhoWasteMarginPct || 0) / 100)
                    : 0;
                return (
                  <div className="mt-2 p-2.5 bg-[var(--bg-superficie)] border border-amber-500/30 rounded-xl text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-amber-400 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" />
                        Punho / Ribana: {currentFab.punhoNotes || 'Combinada'}
                      </span>
                      <span className="font-mono">+{formatBRL(punhoCost)}/pç</span>
                    </div>
                    {totalPieces > 0 && (
                      <div className="text-[10px] text-[var(--texto-secundario)] flex items-center justify-between border-t border-[var(--borda-sutil)] pt-1">
                        <span>Compra de Punho p/ {totalPieces} pçs:</span>
                        <strong className="text-amber-400 font-mono font-bold">
                          {punhoBuyTotal.toFixed(2)} {currentFab.punhoUnitType || 'kg'} ({formatBRL(punhoBuyTotal * (currentFab.punhoPricePerUnit || 0))})
                        </strong>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Seleção / Escrita da Cor do Modelo */}
            <div className="md:col-span-2 lg:col-span-1">
              <label className="block text-xs font-bold text-[var(--texto-secundario)] uppercase tracking-wider mb-1.5">
                Cor do Modelo / Peça
              </label>
              <div className="relative flex items-center">
                <span
                  className="absolute left-3 w-4 h-4 rounded-full border-2 border-black/30 shrink-0 shadow-xs z-10"
                  style={{ backgroundColor: getColorHex(item.color) }}
                />
                <input
                  type="text"
                  list={`color-list-${item.id}`}
                  value={item.color || ''}
                  placeholder="Selecione ou digite a cor (ex: Preto, Azul Bic)..."
                  onChange={(e) => onUpdateItem({ ...item, color: e.target.value })}
                  className="w-full pl-10 pr-3 py-2.5 bg-[var(--bg-input)] hover:border-[var(--borda-hover)] text-[var(--texto-primario)] text-xs sm:text-sm font-bold rounded-xl border-2 border-[var(--borda-sutil)] focus:border-[var(--nitro-primaria)] focus:ring-2 focus:ring-[var(--nitro-primaria)]/20 outline-none transition-colors duration-150 shadow-xs"
                />
                <datalist id={`color-list-${item.id}`}>
                  {COLOR_PRESETS.map((c) => (
                    <option key={c.name} value={c.name} />
                  ))}
                </datalist>
              </div>

              {/* Botões Rápidos de Cores Mais Pedidas */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {COLOR_PRESETS.map((c) => {
                  const isSelected = item.color?.toLowerCase() === c.name.toLowerCase();
                  return (
                    <button
                      key={c.name}
                      type="button"
                      title={c.name}
                      onClick={() => onUpdateItem({ ...item, color: c.name })}
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg transition-all duration-150 flex items-center justify-center shrink-0 border cursor-pointer hover:scale-110 active:scale-95 ${
                        isSelected
                          ? 'ring-2 ring-[var(--nitro-primaria)] scale-110 border-transparent shadow-sm'
                          : 'border-black/20 hover:border-[var(--texto-primario)]'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    >
                      {isSelected && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${c.hex === '#FFFFFF' ? 'bg-black' : 'bg-white'}`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Seleção / Edição do Tipo de Modelagem (Unissex, Feminina, Babylook, Personalizada) */}
            <div className="md:col-span-2 lg:col-span-1">
              <label className="block text-xs font-bold text-[var(--texto-secundario)] uppercase tracking-wider mb-1.5">
                Tipo de Modelagem
              </label>
              <div className="relative">
                <input
                  type="text"
                  list={`fit-list-${item.id}`}
                  value={item.fitType || 'Unissex'}
                  placeholder="Ex: Unissex, Feminina, Babylook..."
                  onChange={(e) => onUpdateItem({ ...item, fitType: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[var(--bg-input)] hover:border-[var(--borda-hover)] text-[var(--texto-primario)] text-xs sm:text-sm font-bold rounded-xl border-2 border-[var(--borda-sutil)] focus:border-[var(--nitro-primaria)] focus:ring-2 focus:ring-[var(--nitro-primaria)]/20 outline-none transition-colors duration-150 shadow-xs"
                />
                <datalist id={`fit-list-${item.id}`}>
                  {['Unissex', 'Feminina', 'Babylook', 'Infantil', 'Oversized', 'Slim Fit', 'Raglan'].map((fit) => (
                    <option key={fit} value={fit} />
                  ))}
                </datalist>
              </div>

              {/* Botões de Seleção Rápida de Modelagem */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {[
                  { label: 'Unissex (Padrão)', value: 'Unissex' },
                  { label: 'Feminina', value: 'Feminina' },
                  { label: 'Babylook', value: 'Babylook' },
                  { label: 'Oversized', value: 'Oversized' },
                  { label: 'Infantil', value: 'Infantil' },
                ].map((fitOption) => {
                  const isSelected = (item.fitType || 'Unissex').toLowerCase() === fitOption.value.toLowerCase();
                  return (
                    <button
                      key={fitOption.value}
                      type="button"
                      onClick={() => onUpdateItem({ ...item, fitType: fitOption.value })}
                      className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--nitro-primaria)] text-white shadow-xs font-bold'
                          : 'bg-[var(--bg-superficie)] hover:bg-[var(--borda-hover)] text-[var(--texto-secundario)] hover:text-[var(--texto-primario)] border border-[var(--borda-sutil)]'
                      }`}
                    >
                      {fitOption.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Seção 2: Grade de Tamanhos */}
          <div className="bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-2xl p-4">
            <SizeGridSelector
              sizes={item.sizes}
              onChange={(sizes) => onUpdateItem({ ...item, sizes })}
              specialSizeSurchargePct={item.specialSizeSurchargePct}
              sleeveType={item.sleeveType || 'Manga Curta'}
              onSleeveTypeChange={(sleeveType) => onUpdateItem({ ...item, sleeveType })}
            />
          </div>

          {/* Seção 3: Motor de Estamparia */}
          <PrintingEngineEditor
            printing={item.printing}
            onChange={(printing) => onUpdateItem({ ...item, printing })}
            viewMode={viewMode}
            itemQuantity={calculatedCost.totalQuantity}
          />

          {/* Resumo Técnico Consolidado para Produção */}
          <div className="p-3.5 bg-[var(--bg-elevado)] border border-[var(--borda-sutil)] rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-[var(--nitro-azul)] shrink-0" />
              <span className="font-bold text-[var(--texto-primario)] uppercase tracking-wider text-[11px]">
                Especificação Técnica do Item:
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[var(--texto-secundario)]">
              <span>
                Cor: <strong className="text-[var(--texto-primario)]">{item.color || 'Não especificada'}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Técnica: <strong className="text-[var(--texto-primario)]">{printSummary.tecnicasResumo}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Posições: <strong className="text-[var(--texto-primario)]">{printSummary.posicoesResumo}</strong>
              </span>
            </div>
          </div>

          {/* Seção: Arquivos Visuais de Produção (Links URL para Mockup Aprovado e Arte Final) */}
          <div className="p-4 bg-[var(--bg-elevado)] border border-[var(--borda-sutil)] rounded-2xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[var(--nitro-azul)]/15 text-[var(--nitro-azul)] flex items-center justify-center border border-[var(--nitro-azul)]/30">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[var(--texto-primario)] uppercase tracking-wider block">
                    Arquivos Visuais para Produção (Links URL)
                  </span>
                  <span className="text-[11px] text-[var(--texto-secundario)]">
                    Informe os links do Mockup Aprovado e do Arquivo de Arte Final (Google Drive, Dropbox ou URL direta)
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Campo 1: Link do Mockup Aprovado */}
              <div className="p-3 bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-xl space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-bold text-[var(--texto-primario)] flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[var(--nitro-primaria)]" />
                    <span>Link do Mockup Aprovado (URL)</span>
                  </label>
                  {item.approvedMockupUrl && item.approvedMockupUrl.trim().startsWith('http') && (
                    <a
                      href={item.approvedMockupUrl.trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--nitro-azul)] hover:underline whitespace-nowrap shrink-0"
                    >
                      <span>Abrir Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="flex gap-1.5">
                  <div className="relative flex-1 min-w-0">
                    <LinkIcon className="w-3.5 h-3.5 text-[var(--texto-mutado)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="url"
                      value={item.approvedMockupUrl || ''}
                      onChange={(e) => {
                        setMockupPreviewStage('proxy');
                        onUpdateItem({ ...item, approvedMockupUrl: e.target.value });
                      }}
                      placeholder="https://drive.google.com/... ou link direto da imagem"
                      className="w-full pl-8 pr-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-xs text-[var(--texto-primario)] font-mono placeholder-[var(--texto-mutado)] focus:border-[var(--nitro-primaria)] focus:ring-1 focus:ring-[var(--nitro-primaria)] outline-none"
                    />
                  </div>
                  {item.approvedMockupUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setMockupPreviewStage('proxy');
                        onUpdateItem({ ...item, approvedMockupUrl: '' });
                      }}
                      title="Limpar link do mockup"
                      className="px-2.5 py-2 bg-[var(--bg-elevado)] hover:bg-[var(--perigo-bg)] text-[var(--texto-secundario)] hover:text-[var(--perigo)] border border-[var(--borda-sutil)] rounded-xl transition-colors cursor-pointer shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {(() => {
                  const rawMockup = (item.approvedMockupUrl || '').trim();
                  if (!rawMockup) return null;
                  const canAttemptPreview =
                    /^https?:\/\//i.test(rawMockup) ||
                    rawMockup.startsWith('data:image/') ||
                    rawMockup.startsWith('/');
                  if (!canAttemptPreview) return null;

                  const resolvedSrc =
                    mockupPreviewStage === 'proxy'
                      ? getProxiedImageUrl(rawMockup)
                      : normalizeExternalImageUrl(rawMockup);

                  if (mockupPreviewStage === 'error') {
                    return (
                      <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-[11px] text-amber-950 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1 space-y-1">
                          <span className="font-semibold block">
                            Não foi possível carregar a foto deste link.
                          </span>
                          <span className="text-[10px] text-amber-900 block">
                            Se for link do Google Drive, verifique se está compartilhado como &quot;Qualquer pessoa com o link&quot; ou cole a URL direta da imagem.
                          </span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="flex items-center gap-3 pt-1">
                      <div className="relative w-16 h-16 rounded-lg border border-[var(--borda-sutil)] overflow-hidden bg-[var(--bg-elevado)] shrink-0">
                        <img
                          key={resolvedSrc}
                          src={resolvedSrc}
                          alt={`Mockup aprovado - ${item.title}`}
                          referrerPolicy="no-referrer"
                          onError={() =>
                            setMockupPreviewStage((prev) => (prev === 'proxy' ? 'direct' : 'error'))
                          }
                          onClick={() => setZoomImage(resolvedSrc)}
                          className="w-full h-full object-cover cursor-pointer"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[11px] font-semibold text-[var(--texto-primario)] block">
                          Prévia do Mockup Aprovado
                        </span>
                        <button
                          type="button"
                          onClick={() => setZoomImage(resolvedSrc)}
                          className="text-[11px] text-[var(--nitro-primaria)] font-semibold hover:underline cursor-pointer inline-flex items-center gap-1 mt-0.5"
                        >
                          <Maximize2 className="w-3 h-3" />
                          <span>Ampliar imagem</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Campo 2: Link do Arquivo de Arte Final */}
              <div className="p-3 bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-xl space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-bold text-[var(--texto-primario)] flex items-center gap-1.5">
                    <FileCheck2 className="w-3.5 h-3.5 text-[var(--nitro-azul)]" />
                    <span>Link do Arquivo de Arte Final (URL)</span>
                  </label>
                  {item.finalArtUrl && item.finalArtUrl.trim().startsWith('http') && (
                    <a
                      href={item.finalArtUrl.trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--nitro-azul)] hover:underline whitespace-nowrap shrink-0"
                    >
                      <span>Abrir Arquivo</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="flex gap-1.5">
                  <div className="relative flex-1 min-w-0">
                    <LinkIcon className="w-3.5 h-3.5 text-[var(--texto-mutado)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="url"
                      value={item.finalArtUrl || ''}
                      onChange={(e) => {
                        setFinalArtPreviewStage('proxy');
                        onUpdateItem({ ...item, finalArtUrl: e.target.value });
                      }}
                      placeholder="https://drive.google.com/... (CDR, AI, PDF vetor, PNG)"
                      className="w-full pl-8 pr-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-xs text-[var(--texto-primario)] font-mono placeholder-[var(--texto-mutado)] focus:border-[var(--nitro-azul)] focus:ring-1 focus:ring-[var(--nitro-azul)] outline-none"
                    />
                  </div>
                  {item.finalArtUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setFinalArtPreviewStage('proxy');
                        onUpdateItem({ ...item, finalArtUrl: '' });
                      }}
                      title="Limpar link da arte final"
                      className="px-2.5 py-2 bg-[var(--bg-elevado)] hover:bg-[var(--perigo-bg)] text-[var(--texto-secundario)] hover:text-[var(--perigo)] border border-[var(--borda-sutil)] rounded-xl transition-colors cursor-pointer shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {(() => {
                  const rawArt = (item.finalArtUrl || '').trim();
                  if (
                    !rawArt ||
                    finalArtPreviewStage === 'hidden' ||
                    isNonImageVectorExtension(rawArt)
                  ) {
                    return (
                      <p className="text-[11px] text-[var(--texto-mutado)]">
                        Link direto para o arquivo matriz de estamparia, silk ou sublimação utilizado pelo chão de fábrica.
                      </p>
                    );
                  }
                  const canTry =
                    /^https?:\/\//i.test(rawArt) ||
                    rawArt.startsWith('data:image/') ||
                    rawArt.startsWith('/');
                  if (!canTry) {
                    return (
                      <p className="text-[11px] text-[var(--texto-mutado)]">
                        Link direto para o arquivo matriz de estamparia, silk ou sublimação utilizado pelo chão de fábrica.
                      </p>
                    );
                  }
                  const artSrc =
                    finalArtPreviewStage === 'proxy'
                      ? getProxiedImageUrl(rawArt)
                      : normalizeExternalImageUrl(rawArt);
                  return (
                    <div className="flex items-center gap-3 pt-1">
                      <div className="relative w-14 h-14 rounded-lg border border-[var(--borda-sutil)] overflow-hidden bg-[var(--bg-elevado)] shrink-0">
                        <img
                          key={artSrc}
                          src={artSrc}
                          alt={`Prévia Arte Final - ${item.title}`}
                          referrerPolicy="no-referrer"
                          onError={() =>
                            setFinalArtPreviewStage((prev) => (prev === 'proxy' ? 'direct' : 'hidden'))
                          }
                          onClick={() => setZoomImage(artSrc)}
                          className="w-full h-full object-cover cursor-pointer"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[11px] font-semibold text-[var(--texto-primario)] block">
                          Prévia da Arte Final
                        </span>
                        <button
                          type="button"
                          onClick={() => setZoomImage(artSrc)}
                          className="text-[11px] text-[var(--nitro-azul)] font-semibold hover:underline cursor-pointer inline-flex items-center gap-1 mt-0.5"
                        >
                          <Maximize2 className="w-3 h-3" />
                          <span>Ampliar arquivo</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Galeria legada se o pedido salvo possuir imagens locais anteriores */}
            {item.mockupImages && item.mockupImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-1">
                {item.mockupImages.map((imgUrl, mIdx) => (
                  <div
                    key={mIdx}
                    className="group relative aspect-square bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-xl overflow-hidden shadow-sm hover:border-[var(--nitro-primaria)] transition-all"
                  >
                    <img
                      src={imgUrl}
                      alt={`Mockup do cliente ${mIdx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-200"
                      onClick={() => setZoomImage(imgUrl)}
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setZoomImage(imgUrl)}
                        className="p-1.5 bg-white/20 hover:bg-white/40 text-white rounded-lg backdrop-blur-sm cursor-pointer transition-colors"
                        title="Ampliar visualização"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveMockup(mIdx)}
                        className="p-1.5 bg-[var(--perigo)] text-white rounded-lg cursor-pointer hover:scale-110 transition-transform"
                        title="Remover este mockup"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Seção 4: Custos Base Extras (apenas Visão Gerente) */}
          {viewMode === 'manager' && (
            <div className="p-4 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-2xl space-y-3">
              <span className="text-xs font-bold text-[var(--texto-primario)] uppercase tracking-wider block">
                Ajustes Finos de Custos Base (Mão de Obra, Insumos e Frete)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
                <div>
                  <label className="text-[11px] text-[var(--texto-secundario)]">Costura (R$/pç)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={item.sewingCost}
                    onChange={(e) =>
                      onUpdateItem({ ...item, sewingCost: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full mt-1 px-2.5 py-1.5 bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-lg text-[var(--texto-primario)] font-mono font-bold focus:border-[var(--nitro-primaria)] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[var(--texto-secundario)]">Linhas/Fios (R$/pç)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={item.threadCost}
                    onChange={(e) =>
                      onUpdateItem({ ...item, threadCost: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full mt-1 px-2.5 py-1.5 bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-lg text-[var(--texto-primario)] font-mono font-bold focus:border-[var(--nitro-primaria)] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[var(--texto-secundario)]">Etiquetas/Tag (R$)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={item.tagCost}
                    onChange={(e) =>
                      onUpdateItem({ ...item, tagCost: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full mt-1 px-2.5 py-1.5 bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-lg text-[var(--texto-primario)] font-mono font-bold focus:border-[var(--nitro-primaria)] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[var(--texto-secundario)]">Embalagem (R$)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={item.packagingCost}
                    onChange={(e) =>
                      onUpdateItem({ ...item, packagingCost: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full mt-1 px-2.5 py-1.5 bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-lg text-[var(--texto-primario)] font-mono font-bold focus:border-[var(--nitro-primaria)] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[var(--texto-secundario)]">Oficinas Logística (R$)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={item.workshopLogisticsCost}
                    onChange={(e) =>
                      onUpdateItem({
                        ...item,
                        workshopLogisticsCost: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full mt-1 px-2.5 py-1.5 bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-lg text-[var(--texto-primario)] font-mono font-bold focus:border-[var(--nitro-primaria)] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[var(--texto-secundario)]">Envio Cliente (R$)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={item.clientShippingCost}
                    onChange={(e) =>
                      onUpdateItem({
                        ...item,
                        clientShippingCost: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full mt-1 px-2.5 py-1.5 bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-lg text-[var(--texto-primario)] font-mono font-bold focus:border-[var(--nitro-primaria)] outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Seção 5: Observações do Item */}
          <div>
            <label className="block text-xs font-semibold text-[var(--texto-secundario)] uppercase tracking-wider mb-1">
              Observações Técnicas do Item (Posicionamento, Pantone, Detalhes)
            </label>
            <input
              type="text"
              value={item.notes || ''}
              placeholder="Ex: Silk peito esquerdo alinhado a 7cm da gola, etiqueta clips na barra."
              onChange={(e) => onUpdateItem({ ...item, notes: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-xs text-[var(--texto-primario)] placeholder-[var(--texto-mutado)] focus:border-[var(--nitro-primaria)] focus:ring-1 focus:ring-[var(--nitro-primaria)] outline-none transition-colors duration-150"
            />
          </div>

          {/* Seção 6: Decomposição de Custos & Margem */}
          <CostBreakdownDrawer
            item={item}
            calculatedCost={calculatedCost}
            viewMode={viewMode}
            fabrics={fabrics}
            onUpdateMargin={(newMargin) =>
              onUpdateItem({ ...item, itemProfitMarginPct: newMargin })
            }
          />
        </div>
      )}

      {/* Lightbox / Zoom do Mockup */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-pointer"
          onClick={() => setZoomImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-[var(--bg-superficie)] p-3 rounded-2xl border border-[var(--borda-sutil)] shadow-2xl overflow-hidden cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--borda-sutil)]">
              <span className="text-xs font-bold text-[var(--texto-primario)] flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[var(--nitro-primaria)]" />
                Mockup / Foto do Cliente (Visualização Ampliada)
              </span>
              <button
                type="button"
                onClick={() => setZoomImage(null)}
                className="p-1 text-[var(--texto-secundario)] hover:text-[var(--texto-primario)] rounded-lg hover:bg-[var(--borda-hover)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center justify-center max-h-[78vh] overflow-auto">
              <img
                src={zoomImage}
                alt="Mockup Ampliado"
                referrerPolicy="no-referrer"
                className="max-h-[75vh] w-auto object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
