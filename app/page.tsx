'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  CalculatedQuoteTotals,
  Fabric,
  ProductTemplate,
  Quote,
  QuoteItem,
  SewingWorkshop,
  Supplier,
  SupplyItem,
  ViewMode,
  Seller,
} from '../lib/types';
import {
  DEFAULT_FABRICS,
  DEFAULT_PRODUCT_TEMPLATES,
  DEFAULT_SUPPLIERS,
  DEFAULT_SUPPLIES,
  DEFAULT_WORKSHOPS,
  DEFAULT_SELLERS,
  createInitialQuote,
  createInitialQuoteItem,
  generateNewQuote,
} from '../lib/default-data';
import { calculateQuoteTotals } from '../lib/calculator';
import {
  loadSavedQuotes,
  sendOrderToGoogleSheets,
  loadFabricsLocally,
  loadSuppliersLocally,
  loadSuppliesLocally,
  loadWorkshopsLocally,
  loadProductsLocally,
  loadSellersLocally,
  fetchGoogleSheetsDatabase,
  saveFabricsLocally,
  saveSuppliersLocally,
  saveSuppliesLocally,
  saveWorkshopsLocally,
  saveProductsLocally,
  saveSellersLocally,
} from '../lib/google-sheets-sync';
import { Navbar } from '../components/Navbar';
import { QuoteItemEditor } from '../components/QuoteItemEditor';
import { QuoteSummaryCard } from '../components/QuoteSummaryCard';
import { AIConversationParserCard } from '../components/AIConversationParserCard';
import { useIsMounted } from '../hooks/use-mounted';

const PDFModal = dynamic(() => import('../components/PDFModal').then((m) => m.PDFModal), {
  ssr: false,
});
const WhatsAppModal = dynamic(
  () => import('../components/WhatsAppModal').then((m) => m.WhatsAppModal),
  { ssr: false }
);
const ManagerSettingsModal = dynamic(
  () => import('../components/ManagerSettingsModal').then((m) => m.ManagerSettingsModal),
  { ssr: false }
);
const SavedQuotesModal = dynamic(
  () => import('../components/SavedQuotesModal').then((m) => m.SavedQuotesModal),
  { ssr: false }
);
import {
  Database,
  CheckCircle,
  RefreshCw,
  ChevronsDown,
  ChevronsUp,
  ChevronDown,
  ChevronUp,
  Shirt,
} from 'lucide-react';

export default function HomePage() {
  const [quote, setQuote] = useState<Quote>(() => createInitialQuote());
  const [viewMode, setViewMode] = useState<ViewMode>('seller');
  const [activeTab, setActiveTab] = useState<'calculator' | 'history' | 'settings'>('calculator');
  
  // Estado de Expansão / Recolhimento dos cards principais
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [isAICardExpanded, setIsAICardExpanded] = useState(true);
  const [isClientCardExpanded, setIsClientCardExpanded] = useState(true);
  const [isArtCardExpanded, setIsArtCardExpanded] = useState(true);
  const [isShippingCardExpanded, setIsShippingCardExpanded] = useState(true);

  // Banco de Dados Dinâmico gerenciado pelo Google Sheets & Local
  // IMPORTANTE: Para evitar Hydration Mismatch no SSR do Next.js, os estados iniciais
  // são estritamente determinísticos entre servidor e cliente.
  const [fabrics, setFabrics] = useState<Fabric[]>(DEFAULT_FABRICS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(DEFAULT_SUPPLIERS);
  const [supplies, setSupplies] = useState<SupplyItem[]>(DEFAULT_SUPPLIES);
  const [workshops, setWorkshops] = useState<SewingWorkshop[]>(DEFAULT_WORKSHOPS);
  const [products, setProducts] = useState<ProductTemplate[]>(DEFAULT_PRODUCT_TEMPLATES);
  const [sellers, setSellers] = useState<Seller[]>(DEFAULT_SELLERS);
  const [savedQuotes, setSavedQuotes] = useState<Quote[]>([]);

  const mounted = useIsMounted();
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Status da sincronização automática com o Google Sheets
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Ao carregar a página: carrega contingência local com segurança pós-hidratação
  // e faz requisição GET para puxar dados atualizados diretamente das abas da planilha
  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      // 1. Hidratação dos dados locais no cliente
      try {
        const localFabrics = loadFabricsLocally();
        if (localFabrics && localFabrics.length > 0 && isMounted) setFabrics(localFabrics);

        const localSuppliers = loadSuppliersLocally();
        if (localSuppliers && localSuppliers.length > 0 && isMounted) setSuppliers(localSuppliers);

        const localSupplies = loadSuppliesLocally();
        if (localSupplies && localSupplies.length > 0 && isMounted) setSupplies(localSupplies);

        const localWorkshops = loadWorkshopsLocally();
        if (localWorkshops && localWorkshops.length > 0 && isMounted) setWorkshops(localWorkshops);

        const localProducts = loadProductsLocally();
        if (localProducts && localProducts.length > 0 && isMounted) setProducts(localProducts);

        const localSellers = loadSellersLocally();
        if (localSellers && localSellers.length > 0 && isMounted) setSellers(localSellers);

        const localQuotes = loadSavedQuotes();
        if (localQuotes && isMounted) setSavedQuotes(localQuotes);
      } catch (e) {
        console.warn('Erro ao restaurar cache local pós-hidratação:', e);
      }

      // 2. Sincronização direta com a planilha do Google Sheets via Webhook
      setIsSyncingSheets(true);
      try {
        const result = await fetchGoogleSheetsDatabase();
        if (!isMounted) return;

        if (result.success) {
          if (result.produtos && result.produtos.length > 0) {
            setProducts(result.produtos);
            saveProductsLocally(result.produtos);
          }
          if (result.tecidos && result.tecidos.length > 0) {
            setFabrics(result.tecidos);
            saveFabricsLocally(result.tecidos);
          }
          if (result.insumos && result.insumos.length > 0) {
            setSupplies(result.insumos);
            saveSuppliesLocally(result.insumos);
          }
          if (result.fornecedores && result.fornecedores.length > 0) {
            setSuppliers(result.fornecedores);
            saveSuppliersLocally(result.fornecedores);
          }
          if (result.oficinas && result.oficinas.length > 0) {
            setWorkshops(result.oficinas);
            saveWorkshopsLocally(result.oficinas);
          }
          setSyncFeedback(result.message);
        } else {
          setSyncFeedback(result.message);
        }
      } catch (err) {
        console.warn('Erro ao sincronizar com Google Sheets no carregamento inicial:', err);
      } finally {
        if (isMounted) setIsSyncingSheets(false);
        setTimeout(() => {
          if (isMounted) setSyncFeedback(null);
        }, 8000);
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Proteção: se vendedor estiver no modo vendedor, configurações ficam restritas
  const effectiveTab = activeTab === 'settings' && viewMode !== 'manager' ? 'calculator' : activeTab;

  // Sincronização manual acionada pelo gerente
  const handleManualSyncDatabase = async () => {
    setIsSyncingSheets(true);
    setSyncFeedback(null);
    try {
      const result = await fetchGoogleSheetsDatabase();
      if (result.success) {
        if (result.produtos && result.produtos.length > 0) {
          setProducts(result.produtos);
          saveProductsLocally(result.produtos);
        }
        if (result.tecidos && result.tecidos.length > 0) {
          setFabrics(result.tecidos);
          saveFabricsLocally(result.tecidos);
        }
        if (result.insumos && result.insumos.length > 0) {
          setSupplies(result.insumos);
          saveSuppliesLocally(result.insumos);
        }
        if (result.fornecedores && result.fornecedores.length > 0) {
          setSuppliers(result.fornecedores);
          saveSuppliersLocally(result.fornecedores);
        }
        if (result.oficinas && result.oficinas.length > 0) {
          setWorkshops(result.oficinas);
          saveWorkshopsLocally(result.oficinas);
        }
        setSyncFeedback(result.message);
      } else {
        setSyncFeedback(result.message);
      }
    } catch {
      setSyncFeedback('Erro ao conectar com a planilha Google Sheets.');
    } finally {
      setIsSyncingSheets(false);
    }
  };

  // Cálculo matemático reativo e instantâneo
  const totals: CalculatedQuoteTotals = useMemo(() => {
    return calculateQuoteTotals(quote, fabrics);
  }, [quote, fabrics]);

  // Handlers de Itens
  const handleAddItem = () => {
    const newItem = createInitialQuoteItem('prod-tshirt-basic', `item-${Date.now()}`);
    setQuote((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const handleUpdateItem = (index: number, updatedItem: QuoteItem) => {
    setQuote((prev) => {
      const newItems = [...prev.items];
      newItems[index] = updatedItem;
      return { ...prev, items: newItems };
    });
  };

  const handleDuplicateItem = (index: number) => {
    setQuote((prev) => {
      const target = prev.items[index];
      const duplicated: QuoteItem = {
        ...target,
        id: `item-${target.id.replace('item-', '')}-copy-${Date.now()}`,
        title: `${target.title} (Cópia)`,
      };
      const newItems = [...prev.items];
      newItems.splice(index + 1, 0, duplicated);
      return { ...prev, items: newItems };
    });
  };

  const handleDeleteItem = (index: number) => {
    if (quote.items.length <= 1) return;
    setQuote((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  // Controles de Expansão e Recolhimento dos cards
  const isItemExpanded = (itemId: string) => {
    return expandedItems[itemId] !== undefined ? expandedItems[itemId] : true;
  };

  const handleToggleItem = (itemId: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !(prev[itemId] !== undefined ? prev[itemId] : true),
    }));
  };

  const areAllItemsExpanded = quote.items.every((it) => isItemExpanded(it.id));
  const areAllCardsExpanded =
    areAllItemsExpanded &&
    isAICardExpanded &&
    isClientCardExpanded &&
    isArtCardExpanded &&
    isShippingCardExpanded;

  const handleToggleAllCards = () => {
    const nextState = !areAllCardsExpanded;
    handleSetAllCards(nextState);
  };

  const handleSetAllCards = (expanded: boolean) => {
    const nextItems: Record<string, boolean> = {};
    quote.items.forEach((it) => {
      nextItems[it.id] = expanded;
    });
    setExpandedItems(nextItems);
    setIsAICardExpanded(expanded);
    setIsClientCardExpanded(expanded);
    setIsArtCardExpanded(expanded);
    setIsShippingCardExpanded(expanded);
  };

  const handleToggleAllItems = () => {
    const nextState = !areAllItemsExpanded;
    const nextItems: Record<string, boolean> = {};
    quote.items.forEach((it) => {
      nextItems[it.id] = nextState;
    });
    setExpandedItems(nextItems);
  };

  const handleNewQuote = () => {
    setQuote(generateNewQuote());
    setActiveTab('calculator');
    setSaveMessage(null);
  };

  const handleSaveOrder = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const result = await sendOrderToGoogleSheets(quote, totals, fabrics);
      const updatedList = loadSavedQuotes();
      setSavedQuotes(updatedList);
      setSaveMessage(result.message);

      // Efeito de celebração
      try {
        const confetti = (await import('canvas-confetti')).default;
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.7 },
          colors: ['#ff8300', '#004da8', '#ffffff', '#22c55e'],
        });
      } catch {
        // Silencioso se bloqueado
      }
    } catch {
      setSaveMessage('Erro ao salvar pedido.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 6000);
    }
  };

  const handleLoadSavedQuote = (loadedQuote: Quote) => {
    setQuote(loadedQuote);
    setActiveTab('calculator');
  };

  const handleDeleteSavedQuote = (id: string) => {
    const updated = savedQuotes.filter((q) => q.id !== id);
    setSavedQuotes(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nitro_saved_quotes_v1', JSON.stringify(updated));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-fundo)] text-[var(--texto-primario)] transition-colors duration-200">
      {/* Top Bar Navigation */}
      <div className="no-print">
        <Navbar
          viewMode={viewMode}
          setViewMode={setViewMode}
          activeTab={effectiveTab}
          setActiveTab={setActiveTab}
          onNewQuote={handleNewQuote}
          onOpenSettings={() => setActiveTab('settings')}
          savedCount={mounted ? savedQuotes.length : 0}
        />
      </div>

      {/* Status Bar Compacta */}
      <section className="bg-[var(--bg-elevado)]/30 border-b border-[var(--borda-sutil)] px-4 md:px-8 py-2.5 no-print transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex items-center justify-end">
          {/* Status de Conexão com Google Sheets */}
          <div className="flex items-center gap-2 text-xs">
            {isSyncingSheets ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--nitro-azul)]/10 text-[var(--nitro-azul)] border border-[var(--nitro-azul)]/30 font-semibold animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Sincronizando com Planilha...</span>
              </span>
            ) : syncFeedback ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--sucesso-bg)] text-[var(--sucesso)] border border-[var(--sucesso)]/40 font-semibold">
                <CheckCircle className="w-3.5 h-3.5" />
                <span className="truncate max-w-[280px] sm:max-w-xs">{syncFeedback}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bg-elevado)] text-[var(--texto-secundario)] border border-[var(--borda-sutil)] font-mono text-[11px]">
                <Database className="w-3.5 h-3.5 text-[var(--sucesso)]" />
                <span>Google Sheets Conectado</span>
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Conteúdo Principal */}
      <main className={`flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6 ${isPDFModalOpen ? 'no-print' : ''}`}>
        {effectiveTab === 'calculator' && (
          <div className="space-y-6">
            {/* Barra de Ações: Opção 'Expandir / Recolher todos' nos cards principais */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:px-4 bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-2xl shadow-sm transition-colors duration-200">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--nitro-primaria)]"></span>
                <span className="text-xs font-bold text-[var(--texto-primario)]">
                  Painel de Orçamento & Modelos
                </span>
                <span className="text-[11px] text-[var(--texto-secundario)] hidden sm:inline">
                  • {quote.items.length} {quote.items.length === 1 ? 'modelo cadastrado' : 'modelos cadastrados'} ({totals.totalQuantity} peças)
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Botão Principal com o rótulo exato: 'Expandir / Recolher todos' */}
                <button
                  type="button"
                  onClick={handleToggleAllCards}
                  title="Alternar entre expandir e recolher todos os cards principais"
                  className="flex items-center gap-2 px-3.5 py-1.5 bg-[var(--bg-elevado)] hover:bg-[var(--borda-hover)] border border-[var(--borda-sutil)] hover:border-[var(--nitro-primaria)]/50 text-[var(--texto-primario)] rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-sm active:scale-95"
                >
                  {areAllCardsExpanded ? (
                    <>
                      <ChevronsUp className="w-3.5 h-3.5 text-[var(--nitro-primaria)]" />
                      <span>Recolher todos os cards</span>
                    </>
                  ) : (
                    <>
                      <ChevronsDown className="w-3.5 h-3.5 text-[var(--nitro-primaria)]" />
                      <span>Expandir todos os cards</span>
                    </>
                  )}
                </button>

                {/* Opções rápidas separadas */}
                <div className="inline-flex rounded-xl bg-[var(--bg-input)] border border-[var(--borda-sutil)] p-0.5">
                  <button
                    type="button"
                    onClick={() => handleSetAllCards(true)}
                    title="Expandir todos os cards"
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                      areAllCardsExpanded
                        ? 'bg-[var(--nitro-primaria)] text-white font-bold'
                        : 'text-[var(--texto-secundario)] hover:text-[var(--texto-primario)]'
                    }`}
                  >
                    <ChevronDown className="w-3 h-3" />
                    <span>Expandir todos</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetAllCards(false)}
                    title="Recolher todos os cards"
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                      !areAllCardsExpanded
                        ? 'bg-[var(--nitro-primaria)] text-white font-bold'
                        : 'text-[var(--texto-secundario)] hover:text-[var(--texto-primario)]'
                    }`}
                  >
                    <ChevronUp className="w-3 h-3" />
                    <span>Recolher todos</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Card de IA para Leitura e Preenchimento Automático por Conversa */}
            <AIConversationParserCard
              quote={quote}
              onUpdateQuote={setQuote}
              products={products}
              fabrics={fabrics}
              isOpen={isAICardExpanded}
              onToggleOpen={() => setIsAICardExpanded(!isAICardExpanded)}
            />

            {/* Cabeçalho da Lista de Modelos de Produto */}
            <div className="flex items-center justify-between px-1 pt-1">
              <div className="flex items-center gap-2">
                <Shirt className="w-4 h-4 text-[var(--nitro-primaria)]" />
                <h2 className="text-xs font-bold text-[var(--texto-primario)] uppercase tracking-wider">
                  Modelos de Produto & Grade ({quote.items.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={handleToggleAllItems}
                className="text-xs font-bold text-[var(--texto-secundario)] hover:text-[var(--nitro-primaria)] flex items-center gap-1 cursor-pointer transition-colors"
                title="Expandir ou recolher todos os modelos"
              >
                {areAllItemsExpanded ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>Recolher todos os modelos</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>Expandir todos os modelos</span>
                  </>
                )}
              </button>
            </div>

            {/* Lista de Itens do Orçamento */}
            <div className="space-y-5">
              {quote.items.map((item, index) => {
                const itemCalc = totals.itemsCalculated[item.id] || {
                  totalQuantity: 0,
                  standardQuantity: 0,
                  specialQuantity: 0,
                  fabricUnitCost: 0,
                  sewingUnitCost: 0,
                  suppliesUnitCost: 0,
                  logisticsUnitCost: 0,
                  silkTotalCost: 0,
                  silkUnitCost: 0,
                  dtfTotalCost: 0,
                  dtfUnitCost: 0,
                  sublimationTotalCost: 0,
                  sublimationUnitCost: 0,
                  vinylTotalCost: 0,
                  vinylUnitCost: 0,
                  printingTotalCost: 0,
                  printingUnitCost: 0,
                  totalProductionCost: 0,
                  unitProductionCost: 0,
                  specialUnitProductionCost: 0,
                  totalSellingPrice: 0,
                  unitSellingPrice: 0,
                  specialUnitSellingPrice: 0,
                  totalProfit: 0,
                  effectiveMarginPct: 35,
                };

                return (
                  <QuoteItemEditor
                    key={item.id}
                    item={item}
                    itemIndex={index}
                    totalItems={quote.items.length}
                    calculatedCost={itemCalc}
                    viewMode={viewMode}
                    fabrics={fabrics}
                    products={products}
                    isExpanded={isItemExpanded(item.id)}
                    onToggleExpand={() => handleToggleItem(item.id)}
                    onUpdateItem={(updated) => handleUpdateItem(index, updated)}
                    onDuplicateItem={() => handleDuplicateItem(index)}
                    onDeleteItem={() => handleDeleteItem(index)}
                  />
                );
              })}
            </div>

            {/* Resumo do Orçamento & Ações Comerciais */}
            <QuoteSummaryCard
              quote={quote}
              totals={totals}
              viewMode={viewMode}
              onUpdateQuote={setQuote}
              onAddItem={handleAddItem}
              onOpenPDF={() => setIsPDFModalOpen(true)}
              onOpenWhatsApp={() => setIsWhatsAppModalOpen(true)}
              onSaveOrder={handleSaveOrder}
              isSaving={isSaving}
              saveMessage={saveMessage}
              sellers={sellers}
              fabrics={fabrics}
              isClientCardExpanded={isClientCardExpanded}
              onToggleClientCard={() => setIsClientCardExpanded(!isClientCardExpanded)}
              isArtCardExpanded={isArtCardExpanded}
              onToggleArtCard={() => setIsArtCardExpanded(!isArtCardExpanded)}
              isShippingCardExpanded={isShippingCardExpanded}
              onToggleShippingCard={() => setIsShippingCardExpanded(!isShippingCardExpanded)}
            />
          </div>
        )}

        {effectiveTab === 'history' && (
          <SavedQuotesModal
            quotes={savedQuotes}
            onLoadQuote={handleLoadSavedQuote}
            onDeleteQuote={handleDeleteSavedQuote}
          />
        )}

        {/* Configurações do Gerente (Oculto para vendedores, acessível apenas para gerente) */}
        {effectiveTab === 'settings' && viewMode === 'manager' && (
          <ManagerSettingsModal
            isOpen={true}
            onClose={() => setActiveTab('calculator')}
            fabrics={fabrics}
            onUpdateFabrics={(updated) => {
              setFabrics(updated);
              saveFabricsLocally(updated);
            }}
            suppliers={suppliers}
            onUpdateSuppliers={(updated) => {
              setSuppliers(updated);
              saveSuppliersLocally(updated);
            }}
            supplies={supplies}
            onUpdateSupplies={(updated) => {
              setSupplies(updated);
              saveSuppliesLocally(updated);
            }}
            workshops={workshops}
            onUpdateWorkshops={(updated) => {
              setWorkshops(updated);
              saveWorkshopsLocally(updated);
            }}
            products={products}
            onUpdateProducts={(updated) => {
              setProducts(updated);
              saveProductsLocally(updated);
            }}
            sellers={sellers}
            onUpdateSellers={(updated) => {
              setSellers(updated);
              saveSellersLocally(updated);
            }}
            onSyncAll={handleManualSyncDatabase}
            isSyncing={isSyncingSheets}
            lastSyncMessage={syncFeedback}
          />
        )}
      </main>

      {/* Modais de Saída Externa */}
      <PDFModal
        quote={quote}
        totals={totals}
        isOpen={isPDFModalOpen}
        onClose={() => setIsPDFModalOpen(false)}
      />

      <WhatsAppModal
        quote={quote}
        totals={totals}
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
      />

      {/* Rodapé institucional limpo */}
      <footer className="mt-auto border-t border-[var(--borda-sutil)] py-6 px-4 text-center text-xs text-[var(--texto-mutado)] no-print">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[var(--texto-secundario)]">Nitro Camisetas & Uniformes</span>
            <span>·</span>
            <span>Sistema Próprio de Orçamentos & Engenharia de Custos</span>
          </div>
          <div>
            Desenvolvido para alta performance fabril e comercial
          </div>
        </div>
      </footer>
    </div>
  );
}
