'use client';

import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  Settings,
  Database,
  Building2,
  Package,
  Layers,
  Scissors,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Copy,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  Clock,
  DollarSign,
  Tag,
  X,
  FileSpreadsheet,
  Lock,
  Pencil,
  Shirt,
  Users,
  UserCheck,
  UserX,
  Calculator,
  Search,
  ShieldCheck,
  LogOut,
  Check,
  Table,
} from 'lucide-react';
import {
  Fabric,
  ProductTemplate,
  SewingWorkshop,
  Supplier,
  SupplyItem,
  Seller,
} from '../lib/types';
import {
  GOOGLE_APPS_SCRIPT_TEMPLATE,
  GOOGLE_SHEETS_SCHEMA,
  PERMANENT_GOOGLE_SHEETS_WEBHOOK_URL,
  loadGoogleSheetsConfig,
  saveGoogleSheetsConfig,
  saveFabricsLocally,
  saveSuppliersLocally,
  saveSuppliesLocally,
  saveWorkshopsLocally,
  saveProductsLocally,
  saveSellersLocally,
  fetchGoogleSheetsDatabase,
  sendEntityToGoogleSheets,
  testWebhookLiveStatus,
  rebuildSchemaViaWebhook,
} from '../lib/google-sheets-sync';
import {
  initDriveAuth,
  signInWithGoogleDrive,
  signOutGoogleDrive,
  getDriveAccessToken,
  findNitroSpreadsheet,
  inspectSpreadsheetSchema,
  recreateV3TabsInSpreadsheet,
  TARGET_SPREADSHEET_NAME,
  DriveSpreadsheetFile,
  SpreadsheetAuditResult,
} from '../lib/google-drive-oauth';
import { formatBRL } from '../lib/format';

interface ManagerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  fabrics: Fabric[];
  onUpdateFabrics: (fabrics: Fabric[]) => void;
  suppliers: Supplier[];
  onUpdateSuppliers: (suppliers: Supplier[]) => void;
  supplies: SupplyItem[];
  onUpdateSupplies: (supplies: SupplyItem[]) => void;
  workshops: SewingWorkshop[];
  onUpdateWorkshops: (workshops: SewingWorkshop[]) => void;
  products: ProductTemplate[];
  onUpdateProducts: (products: ProductTemplate[]) => void;
  sellers: Seller[];
  onUpdateSellers: (sellers: Seller[]) => void;
  onSyncAll: () => Promise<void>;
  isSyncing: boolean;
  lastSyncMessage?: string | null;
}

const generateSellerId = () => `seller-${Date.now()}`;
const generateSupplyId = () => `sup-item-${Date.now()}`;
const generateFabricId = () => `fab-${Date.now()}`;

export const ManagerSettingsModal: React.FC<ManagerSettingsModalProps> = ({
  isOpen,
  onClose,
  fabrics,
  onUpdateFabrics,
  suppliers,
  onUpdateSuppliers,
  supplies,
  onUpdateSupplies,
  workshops,
  onUpdateWorkshops,
  products,
  onUpdateProducts,
  sellers,
  onUpdateSellers,
  onSyncAll,
  isSyncing,
  lastSyncMessage,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'sheets' | 'sellers' | 'suppliers' | 'products' | 'supplies' | 'workshops' | 'fabrics'
  >('sheets');

  // Webhook Config State
  const [webhookUrl, setWebhookUrl] = useState(() => loadGoogleSheetsConfig().webhookUrl);
  const [saveWebhookMsg, setSaveWebhookMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Form States
  // 0. Vendedor Form
  const [newSellerName, setNewSellerName] = useState('');
  const [newSellerPhone, setNewSellerPhone] = useState('');
  const [newSellerEmail, setNewSellerEmail] = useState('');
  const [newSellerNotes, setNewSellerNotes] = useState('');
  const [newSellerCommission, setNewSellerCommission] = useState<number>(5.0);
  const [newSellerActive, setNewSellerActive] = useState(true);
  const [editingSellerId, setEditingSellerId] = useState<string | null>(null);

  // 1. Fornecedor Form
  const [newSupName, setNewSupName] = useState('');
  const [newSupContact, setNewSupContact] = useState('');
  const [newSupPhone, setNewSupPhone] = useState('');
  const [newSupEmail, setNewSupEmail] = useState('');
  const [newSupCategory, setNewSupCategory] = useState<Supplier['category']>('Tecidos');
  const [newSupCity, setNewSupCity] = useState('');
  const [newSupDays, setNewSupDays] = useState(7);
  const [newSupNotes, setNewSupNotes] = useState('');

  // 2. Oficina Form
  const [newWsName, setNewWsName] = useState('');
  const [newWsResp, setNewWsResp] = useState('');
  const [newWsPhone, setNewWsPhone] = useState('');
  const [newWsCity, setNewWsCity] = useState('');
  const [newWsCap, setNewWsCap] = useState(3000);
  const [newWsTshirt, setNewWsTshirt] = useState(5.5);
  const [newWsPolo, setNewWsPolo] = useState(9.8);
  const [newWsHoodie, setNewWsHoodie] = useState(16.0);
  const [newWsPants, setNewWsPants] = useState(14.5);
  const [newWsNotes, setNewWsNotes] = useState('');

  // 3. Aviamento Form
  const [editingSupplyId, setEditingSupplyId] = useState<string | null>(null);
  const [newSupplyName, setNewSupplyName] = useState('');
  const [newSupplyCat, setNewSupplyCat] = useState<SupplyItem['category']>('linha');
  const [newSupplyCost, setNewSupplyCost] = useState(0.5);

  // 4. Tecido Form
  const [editingFabricId, setEditingFabricId] = useState<string | null>(null);
  const [newFabName, setNewFabName] = useState('');
  const [newFabComp, setNewFabComp] = useState('100% Algodão');
  const [newFabPrice, setNewFabPrice] = useState(45.0);
  const [newFabUnit, setNewFabUnit] = useState<'kg' | 'metro'>('kg');
  const [newFabYield, setNewFabYield] = useState(3.2);
  const [newFabWaste, setNewFabWaste] = useState(6.0);
  const [newFabNotes, setNewFabNotes] = useState('');
  // Parâmetros de Cálculo e Compra de Punho / Ribana
  const [newFabHasPunho, setNewFabHasPunho] = useState(false);
  const [newFabPunhoPrice, setNewFabPunhoPrice] = useState(48.0);
  const [newFabPunhoYield, setNewFabPunhoYield] = useState(15.0);
  const [newFabPunhoWaste, setNewFabPunhoWaste] = useState(6.0);
  const [newFabPunhoUnit, setNewFabPunhoUnit] = useState<'kg' | 'metro'>('kg');
  const [newFabPunhoNotes, setNewFabPunhoNotes] = useState('');
  const [punhoSimulPieces, setPunhoSimulPieces] = useState(100);

  // 5. Produto Real Form (Cadastrar e Editar com Imagem)
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('Camisetas');
  const [prodDescription, setProdDescription] = useState('');
  const [prodFabricId, setProdFabricId] = useState(fabrics[0]?.id || 'fab-meia-malha-30-1');
  const [prodSewingCost, setProdSewingCost] = useState(5.5);
  const [prodComplexity, setProdComplexity] = useState<ProductTemplate['defaultComplexity']>('Simples (Básica)');
  const [prodThreadCost, setProdThreadCost] = useState(0.4);
  const [prodTagCost, setProdTagCost] = useState(0.6);
  const [prodPackagingCost, setProdPackagingCost] = useState(0.5);
  const [prodZipperCost, setProdZipperCost] = useState(0);
  const [prodButtonCost, setProdButtonCost] = useState(0);

  // Status de gravação direta no Google Sheets
  const [syncNotice, setSyncNotice] = useState<{
    status: 'idle' | 'saving' | 'saved' | 'error';
    msg: string;
  }>({ status: 'idle', msg: '' });

  // Diagnóstico de versão do Webhook
  const [testResult, setTestResult] = useState<{
    running: boolean;
    online?: boolean;
    isVersion2?: boolean;
    isVersion3?: boolean;
    version?: string;
    message?: string;
  } | null>(null);

  // Recriação via Webhook v3.1
  const [isRebuildingWebhook, setIsRebuildingWebhook] = useState(false);
  const [webhookRebuildResult, setWebhookRebuildResult] = useState<{
    success: boolean;
    message: string;
    needsScriptUpgrade?: boolean;
  } | null>(null);

  // Integração Direta Google Drive (OAuth em memória apenas para manutenção Admin)
  const [driveUser, setDriveUser] = useState<User | null>(null);
  const [driveToken, setDriveToken] = useState<string | null>(() => getDriveAccessToken());
  const [driveAuthLoading, setDriveAuthLoading] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [driveCandidates, setDriveCandidates] = useState<DriveSpreadsheetFile[]>([]);
  const [selectedSpreadsheetId, setSelectedSpreadsheetId] = useState<string>('');
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditResult, setAuditResult] = useState<SpreadsheetAuditResult | null>(null);
  const [auditFilter, setAuditFilter] = useState('');
  const [confirmRecreateOpen, setConfirmRecreateOpen] = useState(false);
  const [syncCatalogsOnRecreate, setSyncCatalogsOnRecreate] = useState(true);
  const [isRecreatingTabs, setIsRecreatingTabs] = useState(false);
  const [recreateSummary, setRecreateSummary] = useState<{
    updatedTabs: string[];
    createdTabs: string[];
    preservedRowsTotal: number;
    seededCatalogRows: number;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const unsubscribe = initDriveAuth(
      (user, token) => {
        setDriveUser(user);
        setDriveToken(token);
      },
      () => {
        setDriveUser(null);
        setDriveToken(null);
      }
    );
    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  const loadDriveSpreadsheetsAndAudit = async (token: string, preferredId?: string) => {
    setAuditLoading(true);
    setDriveError(null);
    try {
      const { exactMatch, candidates } = await findNitroSpreadsheet(token, TARGET_SPREADSHEET_NAME);
      setDriveCandidates(candidates);
      const targetId = preferredId || exactMatch?.id || candidates[0]?.id || '';
      setSelectedSpreadsheetId(targetId);
      if (targetId) {
        const audit = await inspectSpreadsheetSchema(token, targetId);
        setAuditResult(audit);
      } else {
        setAuditResult(null);
      }
    } catch (err: any) {
      setDriveError(err?.message || 'Não foi possível consultar as planilhas no Google Drive.');
    } finally {
      setAuditLoading(false);
    }
  };

  const handleGoogleDriveSignIn = async () => {
    setDriveAuthLoading(true);
    setDriveError(null);
    setRecreateSummary(null);
    try {
      const { user, accessToken } = await signInWithGoogleDrive();
      setDriveUser(user);
      setDriveToken(accessToken);
      await loadDriveSpreadsheetsAndAudit(accessToken);
    } catch (err: any) {
      setDriveError(err?.message || 'Autenticação com Google Drive cancelada ou bloqueada.');
    } finally {
      setDriveAuthLoading(false);
    }
  };

  const handleGoogleDriveSignOut = async () => {
    await signOutGoogleDrive();
    setDriveUser(null);
    setDriveToken(null);
    setDriveCandidates([]);
    setSelectedSpreadsheetId('');
    setAuditResult(null);
    setRecreateSummary(null);
    setDriveError(null);
  };

  const handleSelectSpreadsheet = async (newId: string) => {
    setSelectedSpreadsheetId(newId);
    setRecreateSummary(null);
    if (!driveToken || !newId) return;
    setAuditLoading(true);
    setDriveError(null);
    try {
      const audit = await inspectSpreadsheetSchema(driveToken, newId);
      setAuditResult(audit);
    } catch (err: any) {
      setDriveError(err?.message || 'Erro ao inspecionar abas da planilha selecionada.');
    } finally {
      setAuditLoading(false);
    }
  };

  const handleExecuteRecreateTabs = async () => {
    if (!driveToken || !selectedSpreadsheetId) return;
    setIsRecreatingTabs(true);
    setDriveError(null);
    try {
      const summary = await recreateV3TabsInSpreadsheet(driveToken, selectedSpreadsheetId, {
        syncLocalCatalogs: syncCatalogsOnRecreate,
        catalogs: {
          products,
          fabrics,
          supplies,
          suppliers,
          workshops,
        },
      });
      setRecreateSummary(summary);
      setConfirmRecreateOpen(false);
      const refreshedAudit = await inspectSpreadsheetSchema(driveToken, selectedSpreadsheetId);
      setAuditResult(refreshedAudit);
    } catch (err: any) {
      setDriveError(err?.message || 'Erro ao recriar abas v3.0 na planilha.');
      setConfirmRecreateOpen(false);
    } finally {
      setIsRecreatingTabs(false);
    }
  };

  const handleTestWebhook = async () => {
    setTestResult({ running: true });
    try {
      const res = await testWebhookLiveStatus(webhookUrl);
      setTestResult({
        running: false,
        online: res.online,
        isVersion2: res.isVersion2,
        isVersion3: res.isVersion3,
        version: res.version,
        message: res.message,
      });
    } catch {
      setTestResult({
        running: false,
        online: false,
        isVersion2: false,
        isVersion3: false,
        version: 'offline',
        message: 'Erro ao contatar o Webhook.',
      });
    }
  };

  const handleRebuildSchemaViaWebhook = async () => {
    setIsRebuildingWebhook(true);
    setWebhookRebuildResult(null);
    try {
      const res = await rebuildSchemaViaWebhook(
        {
          products,
          fabrics,
          supplies,
          suppliers,
          workshops,
        },
        webhookUrl
      );
      setWebhookRebuildResult(res);
    } finally {
      setIsRebuildingWebhook(false);
    }
  };

  const handleSaveWebhook = () => {
    const finalUrl = webhookUrl.trim() || PERMANENT_GOOGLE_SHEETS_WEBHOOK_URL;
    saveGoogleSheetsConfig({
      webhookUrl: finalUrl,
      autoSyncOnApprove: true,
    });
    setSaveWebhookMsg('URL do Webhook gravada com sucesso!');
    setTimeout(() => setSaveWebhookMsg(null), 4000);
  };

  const handleCopyScriptCode = () => {
    navigator.clipboard?.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const syncEntityToSheets = async (action: any, payload: any, entityName: string) => {
    setSyncNotice({ status: 'saving', msg: `Gravando ${entityName} diretamente na planilha Google Sheets...` });
    try {
      const res = await sendEntityToGoogleSheets(action, payload, webhookUrl);
      if (res.success) {
        setSyncNotice({ status: 'saved', msg: `${entityName} gravado na planilha com sucesso!` });
      } else {
        if (res.isVersion1 || res.message?.includes('Ação não reconhecida')) {
          setSyncNotice({
            status: 'error',
            msg: `Atenção: A planilha respondeu, mas ainda está com o script v1.0. É necessário atualizar o Code.gs na planilha criando uma Nova Versão para gravar nas novas abas!`,
          });
        } else {
          setSyncNotice({ status: 'error', msg: `Aviso: ${res.message}. Protegido localmente para contingência.` });
        }
      }
    } catch {
      setSyncNotice({ status: 'saved', msg: `${entityName} atualizado com segurança!` });
    } finally {
      setTimeout(() => {
        setSyncNotice((prev) => (prev.status === 'saving' ? prev : { status: 'idle', msg: '' }));
      }, 7000);
    }
  };

  // Add Fornecedor
  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupName.trim()) return;
    const item: Supplier = {
      id: `sup-${Date.now()}`,
      name: newSupName.trim(),
      contactName: newSupContact.trim(),
      phone: newSupPhone.trim(),
      email: newSupEmail.trim(),
      category: newSupCategory,
      city: newSupCity.trim(),
      leadTimeDays: newSupDays,
      notes: newSupNotes.trim(),
    };
    const updated = [item, ...suppliers];
    onUpdateSuppliers(updated);
    saveSuppliersLocally(updated);
    syncEntityToSheets('save_supplier', item, `Fornecedor "${item.name}"`);

    setNewSupName('');
    setNewSupContact('');
    setNewSupPhone('');
    setNewSupEmail('');
    setNewSupCity('');
    setNewSupNotes('');
  };

  const handleDeleteSupplier = (id: string) => {
    const item = suppliers.find((s) => s.id === id);
    const updated = suppliers.filter((s) => s.id !== id);
    onUpdateSuppliers(updated);
    saveSuppliersLocally(updated);
    syncEntityToSheets('delete_supplier', { id }, `Fornecedor "${item?.name || id}" excluído`);
  };

  // Vendedor Handlers
  const handleSaveSeller = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSellerName.trim()) return;

    if (editingSellerId) {
      let savedTarget: Seller | null = null;
      const updated = sellers.map((s) => {
        if (s.id === editingSellerId) {
          savedTarget = {
            ...s,
            name: newSellerName.trim(),
            phone: newSellerPhone.trim(),
            email: newSellerEmail.trim(),
            notes: newSellerNotes.trim(),
            defaultCommissionPct: newSellerCommission,
            active: newSellerActive,
          };
          return savedTarget;
        }
        return s;
      });
      onUpdateSellers(updated);
      saveSellersLocally(updated);
      if (savedTarget) {
        syncEntityToSheets('save_seller', savedTarget, `Vendedor "${(savedTarget as Seller).name}" atualizado`);
      }
      handleCancelEditSeller();
    } else {
      const newSeller: Seller = {
        id: generateSellerId(),
        name: newSellerName.trim(),
        phone: newSellerPhone.trim(),
        email: newSellerEmail.trim(),
        notes: newSellerNotes.trim(),
        defaultCommissionPct: newSellerCommission,
        active: newSellerActive,
      };
      const updated = [newSeller, ...sellers];
      onUpdateSellers(updated);
      saveSellersLocally(updated);
      syncEntityToSheets('save_seller', newSeller, `Vendedor "${newSeller.name}" cadastrado`);
      handleCancelEditSeller();
    }
  };

  const handleStartEditSeller = (seller: Seller) => {
    setEditingSellerId(seller.id);
    setNewSellerName(seller.name);
    setNewSellerPhone(seller.phone || '');
    setNewSellerEmail(seller.email || '');
    setNewSellerNotes(seller.notes || '');
    setNewSellerCommission(seller.defaultCommissionPct !== undefined ? seller.defaultCommissionPct : 5.0);
    setNewSellerActive(seller.active !== false);
  };

  const handleCancelEditSeller = () => {
    setEditingSellerId(null);
    setNewSellerName('');
    setNewSellerPhone('');
    setNewSellerEmail('');
    setNewSellerNotes('');
    setNewSellerCommission(5.0);
    setNewSellerActive(true);
  };

  const handleDeleteSeller = (id: string) => {
    const item = sellers.find((s) => s.id === id);
    const updated = sellers.filter((s) => s.id !== id);
    onUpdateSellers(updated);
    saveSellersLocally(updated);
    syncEntityToSheets('delete_seller', { id }, `Vendedor "${item?.name || id}" excluído`);
  };

  const handleToggleSellerStatus = (id: string) => {
    const seller = sellers.find((s) => s.id === id);
    if (!seller) return;
    const nextActive = !seller.active;
    const updated = sellers.map((s) =>
      s.id === id ? { ...s, active: nextActive } : s
    );
    onUpdateSellers(updated);
    saveSellersLocally(updated);
    syncEntityToSheets('save_seller', { ...seller, active: nextActive }, `Status do vendedor "${seller.name}" alterado`);
  };

  // Add Oficina
  const handleAddWorkshop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    const item: SewingWorkshop = {
      id: `ws-${Date.now()}`,
      name: newWsName.trim(),
      responsibleName: newWsResp.trim(),
      phone: newWsPhone.trim(),
      city: newWsCity.trim(),
      capacityPiecesPerMonth: newWsCap,
      costPerPieceTshirt: newWsTshirt,
      costPerPiecePolo: newWsPolo,
      costPerPieceHoodie: newWsHoodie,
      costPerPiecePants: newWsPants,
      notes: newWsNotes.trim(),
    };
    const updated = [item, ...workshops];
    onUpdateWorkshops(updated);
    saveWorkshopsLocally(updated);
    syncEntityToSheets('save_workshop', item, `Oficina "${item.name}"`);

    setNewWsName('');
    setNewWsResp('');
    setNewWsPhone('');
    setNewWsCity('');
    setNewWsNotes('');
  };

  const handleDeleteWorkshop = (id: string) => {
    const item = workshops.find((w) => w.id === id);
    const updated = workshops.filter((w) => w.id !== id);
    onUpdateWorkshops(updated);
    saveWorkshopsLocally(updated);
    syncEntityToSheets('delete_workshop', { id }, `Oficina "${item?.name || id}" excluída`);
  };

  // Aviamento / Insumo Handlers (Cadastrar e Editar)
  const handleSaveSupply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplyName.trim()) return;

    if (editingSupplyId) {
      let savedTarget: SupplyItem | null = null;
      const updated = supplies.map((s) => {
        if (s.id === editingSupplyId) {
          savedTarget = {
            ...s,
            name: newSupplyName.trim(),
            category: newSupplyCat,
            unitCost: newSupplyCost,
          };
          return savedTarget;
        }
        return s;
      });
      onUpdateSupplies(updated);
      saveSuppliesLocally(updated);
      if (savedTarget) {
        syncEntityToSheets('save_supply', savedTarget, `Insumo "${(savedTarget as SupplyItem).name}" atualizado`);
      }
      handleCancelEditSupply();
    } else {
      const item: SupplyItem = {
        id: generateSupplyId(),
        name: newSupplyName.trim(),
        category: newSupplyCat,
        unitCost: newSupplyCost,
      };
      const updated = [item, ...supplies];
      onUpdateSupplies(updated);
      saveSuppliesLocally(updated);
      syncEntityToSheets('save_supply', item, `Novo insumo "${item.name}"`);
      handleCancelEditSupply();
    }
  };

  const handleStartEditSupply = (item: SupplyItem) => {
    setEditingSupplyId(item.id);
    setNewSupplyName(item.name);
    setNewSupplyCat(item.category);
    setNewSupplyCost(item.unitCost);
  };

  const handleCancelEditSupply = () => {
    setEditingSupplyId(null);
    setNewSupplyName('');
    setNewSupplyCat('linha');
    setNewSupplyCost(0.5);
  };

  const handleDeleteSupply = (id: string) => {
    const item = supplies.find((s) => s.id === id);
    const updated = supplies.filter((s) => s.id !== id);
    onUpdateSupplies(updated);
    saveSuppliesLocally(updated);
    syncEntityToSheets('delete_supply', { id }, `Insumo "${item?.name || id}" excluído`);
    if (editingSupplyId === id) {
      handleCancelEditSupply();
    }
  };

  // Tecido Handlers (Cadastrar e Editar com Punho)
  const handleSaveFabric = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFabName.trim()) return;

    if (editingFabricId) {
      let savedTarget: Fabric | null = null;
      const updated = fabrics.map((f) => {
        if (f.id === editingFabricId) {
          savedTarget = {
            ...f,
            name: newFabName.trim(),
            composition: newFabComp.trim(),
            pricePerUnit: newFabPrice,
            unitType: newFabUnit,
            yieldPerUnit: newFabYield,
            wasteMarginPct: newFabWaste,
            notes: newFabNotes.trim(),
            hasPunho: newFabHasPunho,
            punhoPricePerUnit: newFabHasPunho ? newFabPunhoPrice : 0,
            punhoYieldPerUnit: newFabHasPunho ? newFabPunhoYield : 0,
            punhoWasteMarginPct: newFabHasPunho ? newFabPunhoWaste : 0,
            punhoUnitType: newFabPunhoUnit,
            punhoNotes: newFabHasPunho ? newFabPunhoNotes.trim() : '',
          };
          return savedTarget;
        }
        return f;
      });
      onUpdateFabrics(updated);
      saveFabricsLocally(updated);
      if (savedTarget) {
        syncEntityToSheets('save_fabric', savedTarget, `Tecido "${(savedTarget as Fabric).name}" atualizado`);
      }
      handleCancelEditFabric();
    } else {
      const item: Fabric = {
        id: generateFabricId(),
        name: newFabName.trim(),
        composition: newFabComp.trim(),
        pricePerUnit: newFabPrice,
        unitType: newFabUnit,
        yieldPerUnit: newFabYield,
        wasteMarginPct: newFabWaste,
        notes: newFabNotes.trim(),
        hasPunho: newFabHasPunho,
        punhoPricePerUnit: newFabHasPunho ? newFabPunhoPrice : 0,
        punhoYieldPerUnit: newFabHasPunho ? newFabPunhoYield : 0,
        punhoWasteMarginPct: newFabHasPunho ? newFabPunhoWaste : 0,
        punhoUnitType: newFabPunhoUnit,
        punhoNotes: newFabHasPunho ? newFabPunhoNotes.trim() : '',
      };
      const updated = [item, ...fabrics];
      onUpdateFabrics(updated);
      saveFabricsLocally(updated);
      syncEntityToSheets('save_fabric', item, `Novo tecido "${item.name}"`);
      handleCancelEditFabric();
    }
  };

  const handleStartEditFabric = (fab: Fabric) => {
    setEditingFabricId(fab.id);
    setNewFabName(fab.name);
    setNewFabComp(fab.composition || '');
    setNewFabPrice(fab.pricePerUnit);
    setNewFabUnit(fab.unitType);
    setNewFabYield(fab.yieldPerUnit);
    setNewFabWaste(fab.wasteMarginPct);
    setNewFabNotes(fab.notes || '');
    setNewFabHasPunho(Boolean(fab.hasPunho));
    setNewFabPunhoPrice(fab.punhoPricePerUnit !== undefined && fab.punhoPricePerUnit > 0 ? fab.punhoPricePerUnit : 48.0);
    setNewFabPunhoYield(fab.punhoYieldPerUnit !== undefined && fab.punhoYieldPerUnit > 0 ? fab.punhoYieldPerUnit : 15.0);
    setNewFabPunhoWaste(fab.punhoWasteMarginPct !== undefined ? fab.punhoWasteMarginPct : 6.0);
    setNewFabPunhoUnit(fab.punhoUnitType || 'kg');
    setNewFabPunhoNotes(fab.punhoNotes || '');
  };

  const handleCancelEditFabric = () => {
    setEditingFabricId(null);
    setNewFabName('');
    setNewFabComp('100% Algodão');
    setNewFabPrice(45.0);
    setNewFabUnit('kg');
    setNewFabYield(3.2);
    setNewFabWaste(6.0);
    setNewFabNotes('');
    setNewFabHasPunho(false);
    setNewFabPunhoPrice(48.0);
    setNewFabPunhoYield(15.0);
    setNewFabPunhoWaste(6.0);
    setNewFabPunhoUnit('kg');
    setNewFabPunhoNotes('');
  };

  const handleDeleteFabric = (id: string) => {
    if (fabrics.length <= 1) return;
    const item = fabrics.find((f) => f.id === id);
    const updated = fabrics.filter((f) => f.id !== id);
    onUpdateFabrics(updated);
    saveFabricsLocally(updated);
    syncEntityToSheets('delete_fabric', { id }, `Tecido "${item?.name || id}" excluído`);
    if (editingFabricId === id) {
      handleCancelEditFabric();
    }
  };

  // Iniciar Edição de Produto Existente
  const handleStartEditProduct = (prod: ProductTemplate) => {
    setEditingProductId(prod.id);
    setProdName(prod.name);
    setProdCategory(prod.category);
    setProdDescription(prod.description);
    setProdFabricId(prod.defaultFabricId || (fabrics[0]?.id || ''));
    setProdSewingCost(prod.defaultSewingCost);
    setProdComplexity(prod.defaultComplexity);
    setProdThreadCost(prod.defaultThreadCost ?? 0.4);
    setProdTagCost(prod.defaultTagCost ?? 0.6);
    setProdPackagingCost(prod.defaultPackagingCost ?? 0.5);
    setProdZipperCost(prod.defaultZipperCost ?? 0);
    setProdButtonCost(prod.defaultButtonCost ?? 0);
  };

  const handleCancelEditProduct = () => {
    setEditingProductId(null);
    setProdName('');
    setProdCategory('Camisetas');
    setProdDescription('');
    setProdFabricId(fabrics[0]?.id || '');
    setProdSewingCost(5.5);
    setProdComplexity('Simples (Básica)');
    setProdThreadCost(0.4);
    setProdTagCost(0.6);
    setProdPackagingCost(0.5);
    setProdZipperCost(0);
    setProdButtonCost(0);
  };

  // Salvar Produto (Novo ou Editado)
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) return;

    if (editingProductId) {
      let savedTarget: ProductTemplate | null = null;
      const updated = products.map((p) => {
        if (p.id === editingProductId) {
          savedTarget = {
            ...p,
            name: prodName.trim(),
            category: prodCategory.trim() || 'Camisetas',
            description: prodDescription.trim(),
            defaultFabricId: prodFabricId,
            defaultSewingCost: prodSewingCost,
            defaultComplexity: prodComplexity,
            defaultThreadCost: prodThreadCost,
            defaultTagCost: prodTagCost,
            defaultPackagingCost: prodPackagingCost,
            defaultZipperCost: prodZipperCost,
            defaultButtonCost: prodButtonCost,
          };
          return savedTarget;
        }
        return p;
      });
      onUpdateProducts(updated);
      saveProductsLocally(updated);
      if (savedTarget) {
        syncEntityToSheets('save_product', savedTarget, `Produto "${(savedTarget as ProductTemplate).name}"`);
      }
      handleCancelEditProduct();
    } else {
      const newProd: ProductTemplate = {
        id: `prod-${Date.now()}`,
        name: prodName.trim(),
        category: prodCategory.trim() || 'Camisetas',
        description: prodDescription.trim() || `${prodName.trim()} confecção personalizada`,
        defaultFabricId: prodFabricId,
        defaultSewingCost: prodSewingCost,
        defaultComplexity: prodComplexity,
        defaultThreadCost: prodThreadCost,
        defaultTagCost: prodTagCost,
        defaultPackagingCost: prodPackagingCost,
        defaultZipperCost: prodZipperCost,
        defaultButtonCost: prodButtonCost,
      };
      const updated = [newProd, ...products];
      onUpdateProducts(updated);
      saveProductsLocally(updated);
      syncEntityToSheets('save_product', newProd, `Novo Produto "${newProd.name}"`);
      handleCancelEditProduct();
    }
  };

  const handleDeleteProduct = (id: string) => {
    if (products.length <= 1) {
      alert('É necessário manter pelo menos um produto cadastrado.');
      return;
    }
    const item = products.find((p) => p.id === id);
    const updated = products.filter((p) => p.id !== id);
    onUpdateProducts(updated);
    saveProductsLocally(updated);
    syncEntityToSheets('delete_product', { id }, `Produto "${item?.name || id}" excluído`);
    if (editingProductId === id) {
      handleCancelEditProduct();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header do Painel */}
        <div className="flex items-center justify-between px-5 sm:px-8 py-4 bg-[var(--bg-elevado)] border-b border-[var(--borda-sutil)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[var(--nitro-primaria)]/20 text-[var(--nitro-primaria)] border border-[var(--nitro-primaria)]/40 shadow-sm">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-[var(--texto-primario)]">
                  Painel de Configurações do Gerente
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[var(--nitro-primaria)] text-white flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Admin
                </span>
              </div>
              <p className="text-xs text-[var(--texto-secundario)]">
                Conexão permanente com Google Sheets, fornecedores, produtos reais, insumos e oficinas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSyncAll}
              disabled={isSyncing}
              title="Sincronizar banco de dados com a planilha"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--nitro-azul)] hover:bg-[var(--nitro-azul-hover)] disabled:bg-[var(--nitro-azul)]/50 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {isSyncing ? 'Sincronizando...' : 'Puxar Dados da Planilha'}
              </span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-[var(--texto-secundario)] hover:text-[var(--texto-primario)] hover:bg-[var(--borda-hover)] rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback de Sincronização */}
        {lastSyncMessage && (
          <div className="px-6 py-2 bg-[var(--sucesso-bg)] border-b border-[var(--sucesso)]/30 text-[var(--sucesso)] text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{lastSyncMessage}</span>
            </div>
          </div>
        )}

        {/* Feedback de Operação Direta no Google Sheets (Criar/Editar/Excluir) */}
        {syncNotice.status !== 'idle' && (
          <div
            className={`px-6 py-2.5 border-b text-xs flex items-center justify-between transition-all ${
              syncNotice.status === 'saving'
                ? 'bg-[var(--nitro-azul)]/10 border-[var(--nitro-azul)]/30 text-[var(--nitro-azul)] animate-pulse'
                : syncNotice.status === 'error'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-[var(--sucesso-bg)] border-[var(--sucesso)]/30 text-[var(--sucesso)]'
            }`}
          >
            <div className="flex items-center gap-2 font-semibold">
              {syncNotice.status === 'saving' ? (
                <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
              ) : syncNotice.status === 'error' ? (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              ) : (
                <CheckCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{syncNotice.msg}</span>
            </div>
          </div>
        )}

        {/* Abas de Navegação Interna */}
        <div className="flex items-center gap-1 px-4 sm:px-6 pt-3 border-b border-[var(--borda-sutil)] bg-[var(--bg-superficie)] overflow-x-auto shrink-0 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveSubTab('sheets')}
            className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'sheets'
                ? 'border-[var(--nitro-primaria)] text-[var(--nitro-primaria)] bg-[var(--nitro-primaria)]/10 rounded-t-lg'
                : 'border-transparent text-[var(--texto-secundario)] hover:text-[var(--texto-primario)] hover:bg-[var(--bg-elevado)]'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Google Sheets (Webhook)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('sellers')}
            className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'sellers'
                ? 'border-[var(--nitro-primaria)] text-[var(--nitro-primaria)] bg-[var(--nitro-primaria)]/10 rounded-t-lg'
                : 'border-transparent text-[var(--texto-secundario)] hover:text-[var(--texto-primario)] hover:bg-[var(--bg-elevado)]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Vendedores ({sellers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('suppliers')}
            className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'suppliers'
                ? 'border-[var(--nitro-primaria)] text-[var(--nitro-primaria)] bg-[var(--nitro-primaria)]/10 rounded-t-lg'
                : 'border-transparent text-[var(--texto-secundario)] hover:text-[var(--texto-primario)] hover:bg-[var(--bg-elevado)]'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Fornecedores ({suppliers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('products')}
            className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'products'
                ? 'border-[var(--nitro-primaria)] text-[var(--nitro-primaria)] bg-[var(--nitro-primaria)]/10 rounded-t-lg'
                : 'border-transparent text-[var(--texto-secundario)] hover:text-[var(--texto-primario)] hover:bg-[var(--bg-elevado)]'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Produtos Reais ({products.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('supplies')}
            className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'supplies'
                ? 'border-[var(--nitro-primaria)] text-[var(--nitro-primaria)] bg-[var(--nitro-primaria)]/10 rounded-t-lg'
                : 'border-transparent text-[var(--texto-secundario)] hover:text-[var(--texto-primario)] hover:bg-[var(--bg-elevado)]'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Aviamentos ({supplies.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('workshops')}
            className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'workshops'
                ? 'border-[var(--nitro-primaria)] text-[var(--nitro-primaria)] bg-[var(--nitro-primaria)]/10 rounded-t-lg'
                : 'border-transparent text-[var(--texto-secundario)] hover:text-[var(--texto-primario)] hover:bg-[var(--bg-elevado)]'
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span>Oficinas de Costura ({workshops.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('fabrics')}
            className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'fabrics'
                ? 'border-[var(--nitro-primaria)] text-[var(--nitro-primaria)] bg-[var(--nitro-primaria)]/10 rounded-t-lg'
                : 'border-transparent text-[var(--texto-secundario)] hover:text-[var(--texto-primario)] hover:bg-[var(--bg-elevado)]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Tecidos & Preços ({fabrics.length})</span>
          </button>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-6">
          {/* ABA 1: GOOGLE SHEETS, GOOGLE DRIVE & WEBHOOK PERMANENTE */}
          {activeSubTab === 'sheets' && (
            <div className="space-y-5">
              {/* Card de Conexão Ativa via Webhook */}
              <div className="p-4 sm:p-5 bg-[var(--bg-elevado)] border border-[var(--borda-sutil)] rounded-2xl space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-[var(--texto-primario)] uppercase tracking-wider">
                    <Database className="w-4 h-4 text-[var(--nitro-azul)]" />
                    <span>Conexão Permanente com Banco de Dados Google Sheets (Webhook)</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 border border-emerald-300 text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                    Webhook Ativo
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[var(--texto-secundario)]">
                    URL Oficial do Webhook (Google Apps Script):
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="flex-1 px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-xs font-mono font-bold text-[var(--texto-primario)] focus:border-[var(--nitro-primaria)] outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSaveWebhook}
                      className="px-4 py-2 bg-[var(--nitro-primaria)] hover:bg-[var(--nitro-primaria-hover)] text-white text-xs font-bold rounded-xl shadow transition-colors cursor-pointer shrink-0"
                    >
                      Salvar URL
                    </button>
                  </div>
                  <span className="text-[11px] text-[var(--texto-mutado)] block">
                    Usada automaticamente pelos vendedores ao aprovar orçamentos (sem exigir login individual).
                  </span>
                </div>

                {saveWebhookMsg && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs rounded-xl flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>{saveWebhookMsg}</span>
                  </div>
                )}

                {/* Card de Diagnóstico e Teste em Tempo Real */}
                <div className="p-3.5 bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-xl space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-xs text-[var(--texto-primario)] flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 text-[var(--nitro-primaria)]" />
                      Diagnóstico de Versão do Webhook (v1.0 vs v2.0 Legado vs v3.1 Relacional)
                    </span>
                    <button
                      type="button"
                      onClick={handleTestWebhook}
                      disabled={testResult?.running}
                      className="px-3 py-1.5 bg-[var(--nitro-azul)] hover:bg-[var(--nitro-azul-hover)] disabled:bg-[var(--nitro-azul)]/50 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${testResult?.running ? 'animate-spin' : ''}`} />
                      <span>{testResult?.running ? 'Verificando...' : 'Testar Conexão com a Planilha'}</span>
                    </button>
                  </div>

                  {testResult && !testResult.running && (
                    <div
                      className={`p-3 rounded-xl border text-xs leading-relaxed space-y-1.5 ${
                        testResult.isVersion3
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                          : 'bg-amber-50 border-amber-300 text-amber-950'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs">
                        {testResult.isVersion3 ? (
                          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-700" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-700" />
                        )}
                        <span>
                          {testResult.isVersion3
                            ? `Webhook ${testResult.version || 'v3.1'} Ativo (Relacional Pai-Filho Completo)`
                            : testResult.isVersion2
                            ? 'Webhook v2.0 (Legado) — Itens_Pedido e Punho pendentes'
                            : `Planilha Rodando Versão ${testResult.version || 'Antiga'}`}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--texto-secundario)]">
                        {testResult.message}
                      </p>
                      {!testResult.isVersion3 && (
                        <div className="pt-1.5 text-[11px] text-amber-900 border-t border-amber-300 font-medium space-y-1">
                          <p className="font-bold">Como ativar o mapeamento relacional v3.1 em 3 passos:</p>
                          <ol className="list-decimal pl-4 space-y-0.5 text-[11px]">
                            <li>
                              Clique em <strong>&quot;Copiar Código v3.1&quot;</strong> logo abaixo.
                            </li>
                            <li>
                              Na sua planilha no Google Drive, abra <strong>Extensões &gt; Apps Script</strong> e cole o novo código.
                            </li>
                            <li>
                              Clique em <strong>Implantar &gt; Gerenciar implantações &gt; Editar (lápis) &gt; Versão: &quot;Nova versão&quot; &gt; Implantar</strong>.
                            </li>
                          </ol>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Botões de Ação Imediata via Webhook */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={onSyncAll}
                  disabled={isSyncing}
                  className="p-4 bg-[var(--bg-elevado)] hover:bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] hover:border-[var(--nitro-azul)] rounded-2xl flex items-center gap-3 text-left transition-all cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-[var(--nitro-azul)]/15 text-[var(--nitro-azul)] flex items-center justify-center shrink-0">
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-[var(--texto-primario)] block">
                      Puxar Dados (GET)
                    </span>
                    <span className="text-[11px] text-[var(--texto-secundario)] block truncate">
                      Tecidos, Insumos, Produtos e Oficinas
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleRebuildSchemaViaWebhook}
                  disabled={isRebuildingWebhook}
                  className="p-4 bg-[var(--bg-elevado)] hover:bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] hover:border-[var(--nitro-primaria)] rounded-2xl flex items-center gap-3 text-left transition-all cursor-pointer disabled:opacity-60"
                >
                  <div className="w-9 h-9 rounded-xl bg-[var(--nitro-primaria)]/15 text-[var(--nitro-primaria)] flex items-center justify-center shrink-0">
                    <Table className={`w-4 h-4 ${isRebuildingWebhook ? 'animate-spin' : ''}`} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-[var(--texto-primario)] block">
                      {isRebuildingWebhook ? 'Recriando via Webhook...' : 'Recriar Abas v3.1 (Webhook)'}
                    </span>
                    <span className="text-[11px] text-[var(--texto-secundario)] block truncate">
                      Padroniza 8 abas &amp; envia cadastros locais
                    </span>
                  </div>
                </button>

                <div className="p-4 bg-[var(--bg-elevado)] border border-[var(--borda-sutil)] rounded-2xl flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-[var(--texto-primario)] block">
                      Última Sincronização
                    </span>
                    <span className="text-[11px] text-[var(--texto-secundario)] block truncate">
                      {loadGoogleSheetsConfig().lastSyncTimestamp || 'Automática ao abrir o app'}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-[var(--nitro-primaria)] shrink-0">
                    Auto-Sync
                  </span>
                </div>
              </div>

              {webhookRebuildResult && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                    webhookRebuildResult.success
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : 'bg-amber-50 border-amber-300 text-amber-950'
                  }`}
                >
                  {webhookRebuildResult.success ? (
                    <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-relaxed">{webhookRebuildResult.message}</span>
                </div>
              )}

              {/* FERRAMENTA ADMIN GOOGLE DRIVE: AUDITORIA & RECRIAÇÃO v3.0 */}
              <div className="p-4 sm:p-5 bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-2xl space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--borda-sutil)] pb-3.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-bold text-xs text-[var(--texto-primario)] uppercase tracking-wider">
                      <ShieldCheck className="w-4 h-4 text-[var(--nitro-primaria)]" />
                      <span>
                        Google Drive — Auditoria e Padronização v3.0 ({TARGET_SPREADSHEET_NAME})
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--texto-secundario)]">
                      Audite diretamente a estrutura da planilha no Google Drive e recrie todas as {GOOGLE_SHEETS_SCHEMA.tabs.length} abas no padrão v3.0 preservando os pedidos existentes por cabeçalho.
                    </p>
                  </div>

                  {!driveToken ? (
                    <button
                      type="button"
                      onClick={handleGoogleDriveSignIn}
                      disabled={driveAuthLoading}
                      className="inline-flex items-center gap-2.5 h-10 px-4 bg-white hover:bg-slate-50 border border-slate-400 rounded-md text-[13px] font-medium text-slate-800 shadow-xs transition-colors cursor-pointer disabled:opacity-60 shrink-0"
                    >
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48" aria-hidden="true">
                        <path
                          fill="#EA4335"
                          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                        />
                        <path
                          fill="#4285F4"
                          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                        />
                        <path
                          fill="#34A853"
                          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                        />
                      </svg>
                      <span>{driveAuthLoading ? 'Conectando...' : 'Sign in with Google'}</span>
                    </button>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-medium text-[var(--texto-secundario)] bg-[var(--bg-elevado)] px-2.5 py-1.5 rounded-lg border border-[var(--borda-sutil)]">
                        {driveUser?.email || 'Conta Google conectada'}
                      </span>
                      <button
                        type="button"
                        onClick={() => loadDriveSpreadsheetsAndAudit(driveToken, selectedSpreadsheetId)}
                        disabled={auditLoading}
                        className="px-3 py-1.5 bg-[var(--bg-elevado)] hover:bg-[var(--borda-sutil)]/40 border border-[var(--borda-sutil)] text-[var(--texto-primario)] rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${auditLoading ? 'animate-spin' : ''}`} />
                        <span>Reauditar</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleGoogleDriveSignOut}
                        className="px-2.5 py-1.5 bg-[var(--bg-elevado)] hover:bg-rose-50 border border-[var(--borda-sutil)] hover:border-rose-300 text-[var(--texto-secundario)] hover:text-rose-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                        title="Encerrar sessão do Google Drive"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sair</span>
                      </button>
                    </div>
                  )}
                </div>

                {driveError && (
                  <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-900 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                    <span>{driveError}</span>
                  </div>
                )}

                {driveToken && (
                  <div className="space-y-4">
                    {/* Seletor de Planilha no Drive */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                      <div className="md:col-span-2 space-y-1">
                        <label className="block text-[11px] font-bold text-[var(--texto-secundario)] uppercase tracking-wide">
                          Planilha Selecionada no Google Drive
                        </label>
                        <select
                          value={selectedSpreadsheetId}
                          onChange={(e) => handleSelectSpreadsheet(e.target.value)}
                          disabled={auditLoading || driveCandidates.length === 0}
                          className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-xs font-semibold text-[var(--texto-primario)] focus:border-[var(--nitro-primaria)] outline-none"
                        >
                          {driveCandidates.length === 0 ? (
                            <option value="">Nenhuma planilha encontrada neste Google Drive</option>
                          ) : (
                            driveCandidates.map((file) => (
                              <option key={file.id} value={file.id}>
                                {file.name} {file.name === TARGET_SPREADSHEET_NAME ? '(Alvo Oficial)' : ''}
                              </option>
                            ))
                          )}
                        </select>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {auditResult?.spreadsheetUrl && (
                          <a
                            href={auditResult.spreadsheetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 bg-[var(--bg-elevado)] hover:bg-[var(--borda-sutil)]/40 border border-[var(--borda-sutil)] text-[var(--texto-primario)] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Abrir Planilha</span>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => setConfirmRecreateOpen(true)}
                          disabled={!selectedSpreadsheetId || auditLoading || isRecreatingTabs}
                          className="flex-1 sm:flex-none px-4 py-2 bg-[var(--nitro-primaria)] hover:bg-[var(--nitro-primaria-hover)] disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Table className="w-3.5 h-3.5" />
                          <span>Recriar Abas v3.0</span>
                        </button>
                      </div>
                    </div>

                    {recreateSummary && (
                      <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-950 space-y-1">
                        <div className="flex items-center gap-2 font-bold">
                          <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span>Padronização v3.0 concluída com sucesso!</span>
                        </div>
                        <p className="text-[11px] text-emerald-900 font-mono tabular-nums">
                          Abas atualizadas: {recreateSummary.updatedTabs.length} · Abas criadas: {recreateSummary.createdTabs.length} · Linhas preservadas: {recreateSummary.preservedRowsTotal} · Cadastros sincronizados: {recreateSummary.seededCatalogRows}
                        </p>
                      </div>
                    )}

                    {/* Filtro da Auditoria + Tabela Compacta */}
                    {auditLoading ? (
                      <div className="p-6 bg-[var(--bg-elevado)] border border-[var(--borda-sutil)] rounded-xl text-center text-xs text-[var(--texto-secundario)] flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-[var(--nitro-primaria)]" />
                        <span>Lendo cabeçalhos e contagem de registros de todas as abas...</span>
                      </div>
                    ) : auditResult ? (
                      <div className="space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-[11px] font-semibold text-[var(--texto-secundario)] tabular-nums">
                            Abas alinhadas:{' '}
                            <strong className="text-[var(--texto-primario)]">
                              {auditResult.tabs.filter((t) => t.status === 'aligned').length}/{auditResult.tabs.length}
                            </strong>
                          </div>
                          <div className="relative w-full sm:w-64">
                            <Search className="w-3.5 h-3.5 text-[var(--texto-mutado)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type="text"
                              value={auditFilter}
                              onChange={(e) => setAuditFilter(e.target.value)}
                              placeholder="Filtrar aba ou coluna faltante..."
                              className="w-full pl-8 pr-3 py-1.5 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-lg text-xs text-[var(--texto-primario)] focus:border-[var(--nitro-primaria)] outline-none"
                            />
                          </div>
                        </div>

                        <div className="border border-[var(--borda-sutil)] rounded-xl overflow-x-auto bg-[var(--bg-input)]">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-[var(--bg-elevado)] border-b border-[var(--borda-sutil)] text-[11px] uppercase tracking-wider text-[var(--texto-secundario)]">
                                <th className="py-2.5 px-3 font-bold">Aba Padrão v3.0</th>
                                <th className="py-2.5 px-3 font-bold">Estado</th>
                                <th className="py-2.5 px-3 font-bold text-right">Linhas</th>
                                <th className="py-2.5 px-3 font-bold text-right">Colunas</th>
                                <th className="py-2.5 px-3 font-bold">Colunas Faltantes / Divergências</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--borda-sutil)]">
                              {auditResult.tabs
                                .filter((tab) => {
                                  const q = auditFilter.trim().toLowerCase();
                                  if (!q) return true;
                                  return (
                                    tab.tabName.toLowerCase().includes(q) ||
                                    tab.missingColumns.some((c) => c.toLowerCase().includes(q))
                                  );
                                })
                                .map((tab) => (
                                  <tr key={tab.tabName} className="hover:bg-[var(--bg-elevado)]/60">
                                    <td className="py-2.5 px-3 font-mono font-bold text-[var(--texto-primario)] whitespace-nowrap">
                                      {tab.tabName}
                                    </td>
                                    <td className="py-2.5 px-3 whitespace-nowrap">
                                      {tab.status === 'aligned' ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-300 text-emerald-800 text-[11px] font-bold">
                                          <Check className="w-3 h-3" />
                                          Alinhada
                                        </span>
                                      ) : tab.status === 'needs_update' ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 border border-amber-300 text-amber-900 text-[11px] font-bold">
                                          Requer Ajuste
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 border border-rose-300 text-rose-800 text-[11px] font-bold">
                                          Faltando
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-2.5 px-3 font-mono tabular-nums text-right text-[var(--texto-primario)]">
                                      {tab.rowCount}
                                    </td>
                                    <td className="py-2.5 px-3 font-mono tabular-nums text-right text-[var(--texto-secundario)]">
                                      {tab.actualColumns.length}/{tab.expectedColumns.length}
                                    </td>
                                    <td className="py-2.5 px-3 text-[11px] text-[var(--texto-secundario)]">
                                      {tab.status === 'aligned' ? (
                                        <span className="text-emerald-700 font-medium">Cabeçalhos 100% compatíveis</span>
                                      ) : tab.missingColumns.length > 0 ? (
                                        <span className="font-mono text-amber-900">
                                          Faltam: {tab.missingColumns.slice(0, 5).join(', ')}
                                          {tab.missingColumns.length > 5
                                            ? ` (+${tab.missingColumns.length - 5})`
                                            : ''}
                                        </span>
                                      ) : (
                                        <span>Ordem das colunas diferente do padrão v3.0</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-[var(--bg-elevado)] border border-[var(--borda-sutil)] rounded-xl text-xs text-[var(--texto-secundario)]">
                        Selecione uma planilha acima para auditar suas abas e colunas.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Código Apps Script para a Planilha */}
              <div className="p-4 bg-[var(--bg-elevado)] border border-[var(--borda-sutil)] rounded-2xl space-y-2 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-[var(--texto-primario)] flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-[var(--sucesso)]" />
                    Código Completo do Google Apps Script (Code.gs v3.1)
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyScriptCode}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-superficie)] hover:bg-[var(--borda-sutil)]/40 border border-[var(--borda-sutil)] text-[var(--texto-primario)] rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    {copiedCode ? <CheckCircle className="w-3.5 h-3.5 text-[var(--sucesso)]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Código v3.1 Copiado!' : 'Copiar Código v3.1'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-[var(--texto-secundario)]">
                  Script v3.1: gravação relacional Pai e Filho por nome de cabeçalho (abas Historico_Pedidos + Itens_Pedido via POST), sincronização completa de Punho/Ribana e recriação automática das 8 abas.
                </p>
                <pre className="p-3 bg-[var(--bg-input)] rounded-xl border border-[var(--borda-sutil)] font-mono text-[10px] text-[var(--texto-secundario)] max-h-36 overflow-y-auto">
                  {GOOGLE_APPS_SCRIPT_TEMPLATE}
                </pre>
              </div>
            </div>
          )}

          {/* ABA: VENDEDORES */}
          {activeSubTab === 'sellers' && (
            <div className="space-y-6">
              {/* Formulário de Novo/Edição de Vendedor */}
              <form onSubmit={handleSaveSeller} className="p-4 sm:p-5 bg-[var(--bg-elevado)] border border-[var(--borda-sutil)] rounded-2xl space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[var(--texto-primario)] uppercase text-xs flex items-center gap-2">
                    {editingSellerId ? (
                      <>
                        <Pencil className="w-4 h-4 text-[var(--nitro-azul)]" />
                        Editar Cadastro de Vendedor
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 text-[var(--nitro-primaria)]" />
                        Cadastrar Novo Vendedor Comercial
                      </>
                    )}
                  </span>
                  {editingSellerId && (
                    <button
                      type="button"
                      onClick={handleCancelEditSeller}
                      className="text-xs text-[var(--texto-mutado)] hover:text-[var(--texto-primario)] underline cursor-pointer"
                    >
                      Cancelar Edição
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <div>
                    <label className="text-[11px] text-[var(--texto-secundario)] font-semibold block mb-1">
                      Nome do Vendedor *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Carlos Oliveira"
                      value={newSellerName}
                      onChange={(e) => setNewSellerName(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] font-bold focus:border-[var(--nitro-primaria)] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-[var(--texto-secundario)] font-semibold block mb-1">
                      WhatsApp / Telefone
                    </label>
                    <input
                      type="text"
                      placeholder="(11) 98765-4321"
                      value={newSellerPhone}
                      onChange={(e) => setNewSellerPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] font-mono focus:border-[var(--nitro-primaria)] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-[var(--texto-secundario)] font-semibold block mb-1">
                      E-mail Corporativo
                    </label>
                    <input
                      type="email"
                      placeholder="vendedor@nitrocamisetas.com.br"
                      value={newSellerEmail}
                      onChange={(e) => setNewSellerEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] focus:border-[var(--nitro-primaria)] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-[var(--texto-secundario)] font-semibold block mb-1">
                      Comissão Padrão (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="50"
                        placeholder="5.0"
                        value={newSellerCommission}
                        onChange={(e) => setNewSellerCommission(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] font-mono font-bold focus:border-[var(--nitro-primaria)] outline-none"
                      />
                      <span className="absolute right-3 top-2 text-[var(--texto-secundario)] font-bold text-xs pointer-events-none">
                        %
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-[var(--texto-secundario)] font-semibold block mb-1">
                      Observação / Equipe
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Comercial Atacado / SP"
                      value={newSellerNotes}
                      onChange={(e) => setNewSellerNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] focus:border-[var(--nitro-primaria)] outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[var(--texto-primario)]">
                    <input
                      type="checkbox"
                      checked={newSellerActive}
                      onChange={(e) => setNewSellerActive(e.target.checked)}
                      className="w-4 h-4 accent-[var(--nitro-primaria)] rounded"
                    />
                    <span>Vendedor Ativo para Seleção em Novos Orçamentos</span>
                  </label>

                  <div className="flex items-center gap-2">
                    {editingSellerId && (
                      <button
                        type="button"
                        onClick={handleCancelEditSeller}
                        className="px-4 py-2 bg-[var(--bg-superficie)] hover:bg-[var(--borda-hover)] text-[var(--texto-secundario)] font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[var(--nitro-primaria)] hover:bg-[var(--nitro-primaria-hover)] text-white font-bold rounded-xl shadow transition-colors cursor-pointer"
                    >
                      {editingSellerId ? 'Atualizar Vendedor' : 'Salvar Vendedor'}
                    </button>
                  </div>
                </div>
              </form>

              {/* Lista de Vendedores Cadastrados */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--texto-secundario)] uppercase tracking-wider">
                    Equipe Comercial Cadastrada ({sellers.length})
                  </span>
                  <span className="text-[11px] text-[var(--texto-mutado)]">
                    Os vendedores ativos aparecem na lista suspensa do orçamento
                  </span>
                </div>

                {sellers.length === 0 ? (
                  <div className="p-8 text-center bg-[var(--bg-elevado)] rounded-2xl border border-[var(--borda-sutil)] text-xs text-[var(--texto-mutado)]">
                    Nenhum vendedor cadastrado ainda. Preencha o formulário acima para cadastrar os consultores da equipe.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {sellers.map((seller) => (
                      <div
                        key={seller.id}
                        className={`p-4 bg-[var(--bg-elevado)] border rounded-2xl flex flex-col justify-between gap-3 transition-all ${
                          seller.active !== false
                            ? 'border-[var(--borda-sutil)] hover:border-[var(--nitro-primaria)]/50'
                            : 'border-[var(--borda-sutil)] opacity-60 bg-[var(--bg-superficie)]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-[var(--nitro-primaria)]/10 text-[var(--nitro-primaria)] flex items-center justify-center font-bold text-sm shrink-0">
                              {seller.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-[var(--texto-primario)] truncate block">
                                  {seller.name}
                                </span>
                                {seller.active !== false ? (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[var(--sucesso-bg)] text-[var(--sucesso)]">
                                    Ativo
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[var(--bg-superficie)] text-[var(--texto-mutado)]">
                                    Inativo
                                  </span>
                                )}
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--nitro-primaria)]/15 text-[var(--nitro-primaria)] border border-[var(--nitro-primaria)]/30">
                                  {seller.defaultCommissionPct !== undefined ? `${seller.defaultCommissionPct}%` : '5%'} comissão
                                </span>
                              </div>
                              {seller.notes && (
                                <span className="text-[11px] text-[var(--texto-mutado)] block truncate">
                                  {seller.notes}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleToggleSellerStatus(seller.id)}
                              title={seller.active !== false ? 'Desativar vendedor' : 'Ativar vendedor'}
                              className="p-1.5 text-[var(--texto-secundario)] hover:text-[var(--texto-primario)] hover:bg-[var(--borda-hover)] rounded-lg transition-colors cursor-pointer"
                            >
                              {seller.active !== false ? (
                                <UserCheck className="w-4 h-4 text-[var(--sucesso)]" />
                              ) : (
                                <UserX className="w-4 h-4 text-[var(--texto-mutado)]" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStartEditSeller(seller)}
                              title="Editar vendedor"
                              className="p-1.5 text-[var(--texto-secundario)] hover:text-[var(--nitro-azul)] hover:bg-[var(--borda-hover)] rounded-lg transition-colors cursor-pointer"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSeller(seller.id)}
                              title="Excluir vendedor"
                              className="p-1.5 text-[var(--texto-secundario)] hover:text-[var(--perigo)] hover:bg-[var(--borda-hover)] rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-[var(--borda-sutil)] text-xs text-[var(--texto-secundario)]">
                          <div className="flex items-center gap-1.5 truncate">
                            <Phone className="w-3.5 h-3.5 shrink-0 text-[var(--texto-mutado)]" />
                            <span className="font-mono text-[11px]">{seller.phone || 'Sem telefone'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 truncate">
                            <Mail className="w-3.5 h-3.5 shrink-0 text-[var(--texto-mutado)]" />
                            <span className="text-[11px] truncate">{seller.email || 'Sem e-mail'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ABA 2: FORNECEDORES */}
          {activeSubTab === 'suppliers' && (
            <div className="space-y-6">
              {/* Formulário de Novo Fornecedor */}
              <form onSubmit={handleAddSupplier} className="p-4 bg-[var(--bg-elevado)] border border-[var(--borda-sutil)] rounded-2xl space-y-3 text-xs">
                <span className="font-bold text-[var(--texto-primario)] uppercase text-xs flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[var(--nitro-primaria)]" />
                  Cadastrar Novo Fornecedor
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  <div>
                    <label className="text-[11px] text-[var(--texto-secundario)] font-semibold block mb-1">
                      Razão Social / Nome da Empresa *
                    </label>
                    <input
                      type="text"
                      required
                      value={newSupName}
                      onChange={(e) => setNewSupName(e.target.value)}
                      placeholder="Ex: Malharia Pettenati"
                      className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] font-medium outline-none focus:border-[var(--nitro-primaria)]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-[var(--texto-secundario)] font-semibold block mb-1">
                      Categoria de Fornecimento
                    </label>
                    <select
                      value={newSupCategory}
                      onChange={(e) => setNewSupCategory(e.target.value as any)}
                      className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] font-medium outline-none"
                    >
                      <option value="Tecidos">Tecidos & Malhas</option>
                      <option value="Aviamentos">Aviamentos & Fios</option>
                      <option value="Estamparia">Tintas & Filmes Estamparia</option>
                      <option value="Oficina">Oficinas / Facções</option>
                      <option value="Outros">Outros Insumos</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-[var(--texto-secundario)] font-semibold block mb-1">
                      Contato / Vendedor
                    </label>
                    <input
                      type="text"
                      value={newSupContact}
                      onChange={(e) => setNewSupContact(e.target.value)}
                      placeholder="Ex: João da Silva"
                      className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-[var(--texto-secundario)] font-semibold block mb-1">
                      Telefone / WhatsApp
                    </label>
                    <input
                      type="text"
                      value={newSupPhone}
                      onChange={(e) => setNewSupPhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] font-mono outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[11px] text-[var(--texto-secundario)] font-semibold block mb-1">
                      Cidade / UF
                    </label>
                    <input
                      type="text"
                      value={newSupCity}
                      onChange={(e) => setNewSupCity(e.target.value)}
                      placeholder="Ex: São Paulo / SP"
                      className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[var(--texto-secundario)] font-semibold block mb-1">
                      Prazo Médio de Entrega (Dias)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newSupDays}
                      onChange={(e) => setNewSupDays(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[var(--texto-secundario)] font-semibold block mb-1">
                      Observações / Itens Fornecidos
                    </label>
                    <input
                      type="text"
                      value={newSupNotes}
                      onChange={(e) => setNewSupNotes(e.target.value)}
                      placeholder="Ex: Algodão penteado 30.1 e Moletom"
                      className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[var(--nitro-primaria)] hover:bg-[var(--nitro-primaria-hover)] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Salvar Fornecedor
                  </button>
                </div>
              </form>

              {/* Lista de Fornecedores */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-[var(--texto-secundario)] uppercase tracking-wider block">
                  Fornecedores Homologados ({suppliers.length})
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {suppliers.map((sup) => (
                    <div key={sup.id} className="p-3.5 bg-[var(--bg-elevado)] border border-[var(--borda-sutil)] rounded-xl flex items-start justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[var(--texto-primario)] text-sm">{sup.name}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--nitro-azul)]/15 text-[var(--nitro-azul)] border border-[var(--nitro-azul)]/30">
                            {sup.category}
                          </span>
                        </div>
                        {sup.contactName && (
                          <div className="text-[11px] text-[var(--texto-secundario)]">
                            Contato: <strong className="text-[var(--texto-primario)]">{sup.contactName}</strong>
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-[var(--texto-mutado)] font-mono">
                          {sup.phone && <span>📞 {sup.phone}</span>}
                          {sup.city && <span>📍 {sup.city}</span>}
                          {sup.leadTimeDays && <span>⏱ {sup.leadTimeDays}d prazo</span>}
                        </div>
                        {sup.notes && (
                          <div className="text-[11px] text-[var(--texto-secundario)] italic pt-0.5">
                            {sup.notes}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteSupplier(sup.id)}
                        className="p-1.5 text-[var(--texto-mutado)] hover:text-[var(--perigo)] rounded-lg transition-colors cursor-pointer shrink-0"
                        title="Remover fornecedor"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ABA 3: PRODUTOS REAIS & MODELOS COM FOTOS */}
          {activeSubTab === 'products' && (
            <div className="space-y-6 text-xs">
              {/* Formulário de Cadastro e Edição de Produto */}
              <form
                onSubmit={handleSaveProduct}
                className={`p-5 rounded-2xl border transition-all ${
                  editingProductId
                    ? 'bg-[var(--nitro-primaria)]/5 border-[var(--nitro-primaria)] shadow-lg shadow-[var(--nitro-primaria)]/10'
                    : 'bg-[var(--bg-elevado)] border-[var(--borda-sutil)]'
                }`}
              >
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--borda-sutil)]">
                  <div className="flex items-center gap-2">
                    {editingProductId ? (
                      <>
                        <div className="w-7 h-7 rounded-lg bg-[var(--nitro-primaria)] text-white flex items-center justify-center">
                          <Pencil className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-sm text-[var(--texto-primario)] block">
                            Editando Produto: <span className="text-[var(--nitro-primaria)]">{prodName || 'Sem nome'}</span>
                          </span>
                          <span className="text-[11px] text-[var(--texto-secundario)]">
                            Modifique as especificações, custos de confecção ou foto da peça
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-7 h-7 rounded-lg bg-[var(--nitro-primaria)]/20 text-[var(--nitro-primaria)] flex items-center justify-center">
                          <Plus className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-sm text-[var(--texto-primario)] block">
                            Cadastrar Novo Produto Real
                          </span>
                          <span className="text-[11px] text-[var(--texto-secundario)]">
                            Adicione novos modelos com foto para ficarem disponíveis no orçador
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {editingProductId && (
                    <button
                      type="button"
                      onClick={handleCancelEditProduct}
                      className="px-3 py-1 bg-[var(--bg-superficie)] hover:bg-[var(--borda-hover)] border border-[var(--borda-sutil)] text-[var(--texto-secundario)] hover:text-[var(--texto-primario)] rounded-xl font-bold transition-colors cursor-pointer text-xs"
                    >
                      Cancelar Edição
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Linha 1: Dados Principais */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] text-[var(--texto-secundario)] font-semibold block mb-1">
                        Nome do Produto / Modelo *
                      </label>
                      <input
                        type="text"
                        required
                        value={prodName}
                        onChange={(e) => setProdName(e.target.value)}
                        placeholder="Ex: Camiseta Streetwear Boxy Heavyweight"
                        className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] font-semibold outline-none focus:border-[var(--nitro-primaria)]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-[var(--texto-secundario)] font-semibold block mb-1">
                        Categoria
                      </label>
                      <input
                        type="text"
                        required
                        value={prodCategory}
                        onChange={(e) => setProdCategory(e.target.value)}
                        placeholder="Ex: Camisetas, Polos, Moletom"
                        list="categories-list"
                        className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] outline-none"
                      />
                      <datalist id="categories-list">
                        <option value="Camisetas" />
                        <option value="Polos" />
                        <option value="Inverno" />
                        <option value="Esportivo" />
                        <option value="Uniformes Operacionais" />
                        <option value="Bermudas / Calças" />
                      </datalist>
                    </div>
                  </div>

                  {/* Linha 2: Malha Padrão, Costura e Complexidade */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-[var(--texto-secundario)] font-semibold block mb-1">
                        Tecido / Malha Base
                      </label>
                      <select
                        value={prodFabricId}
                        onChange={(e) => setProdFabricId(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] outline-none"
                      >
                        {fabrics.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name} ({formatBRL(f.pricePerUnit)}/{f.unitType})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-[var(--texto-secundario)] font-semibold block mb-1">
                        Custo Base de Costura (R$)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        required
                        value={prodSewingCost}
                        onChange={(e) => setProdSewingCost(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] font-mono font-bold outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-[var(--texto-secundario)] font-semibold block mb-1">
                        Complexidade de Confecção
                      </label>
                      <select
                        value={prodComplexity}
                        onChange={(e) => setProdComplexity(e.target.value as any)}
                        className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] outline-none"
                      >
                        <option value="Simples (Básica)">Simples (Básica - Camisetas)</option>
                        <option value="Média (Polo / Recortes)">Média (Polo / Recortes)</option>
                        <option value="Alta (Jaqueta / Moletom / Calça)">Alta (Jaqueta / Moletom / Calça)</option>
                      </select>
                    </div>
                  </div>

                  {/* Linha 3: Insumos Complementares Padrão */}
                  <div className="p-3 bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-xl space-y-2">
                    <span className="text-[11px] font-bold text-[var(--texto-primario)] block">
                      Insumos e Aviamentos Padrão (R$ por peça)
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono">
                      <div>
                        <label className="text-[10px] text-[var(--texto-mutado)] block">Linha/Fio</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={prodThreadCost}
                          onChange={(e) => setProdThreadCost(parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-lg text-[var(--texto-primario)] text-xs font-bold outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[var(--texto-mutado)] block">Etiqueta</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={prodTagCost}
                          onChange={(e) => setProdTagCost(parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-lg text-[var(--texto-primario)] text-xs font-bold outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[var(--texto-mutado)] block">Embalagem</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={prodPackagingCost}
                          onChange={(e) => setProdPackagingCost(parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-lg text-[var(--texto-primario)] text-xs font-bold outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[var(--texto-mutado)] block">Zíper</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={prodZipperCost}
                          onChange={(e) => setProdZipperCost(parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-lg text-[var(--texto-primario)] text-xs font-bold outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[var(--texto-mutado)] block">Botões</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={prodButtonCost}
                          onChange={(e) => setProdButtonCost(parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-lg text-[var(--texto-primario)] text-xs font-bold outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Linha 4: Descrição Técnica */}
                  <div>
                    <label className="text-[11px] text-[var(--texto-secundario)] font-semibold block mb-1">
                      Descrição / Especificação Técnica
                    </label>
                    <textarea
                      rows={2}
                      value={prodDescription}
                      onChange={(e) => setProdDescription(e.target.value)}
                      placeholder="Ex: Gola em ribana 2x1 pespontada, reforço ombro a ombro, barra com agulha dupla..."
                      className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] outline-none resize-none"
                    />
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex items-center justify-end gap-2 pt-2">
                    {editingProductId && (
                      <button
                        type="button"
                        onClick={handleCancelEditProduct}
                        className="px-4 py-2 bg-[var(--bg-superficie)] hover:bg-[var(--borda-hover)] border border-[var(--borda-sutil)] text-[var(--texto-primario)] font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[var(--nitro-primaria)] hover:bg-[var(--nitro-primaria-hover)] text-white font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                    >
                      {editingProductId ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>Atualizar Dados do Produto</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>Cadastrar Produto Real</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>

              {/* Lista de Produtos Cadastrados com Edição e Exclusão */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--borda-sutil)]">
                  <div>
                    <span className="font-bold text-[var(--texto-primario)] uppercase tracking-wider block">
                      Produtos & Modelos Reais Cadastrados ({products.length})
                    </span>
                    <span className="text-[11px] text-[var(--texto-secundario)]">
                      Clique em &quot;Editar&quot; para atualizar custos de costura, insumos ou especificações do modelo
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {products.map((prod) => {
                    const isBeingEdited = editingProductId === prod.id;
                    return (
                      <div
                        key={prod.id}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                          isBeingEdited
                            ? 'bg-[var(--nitro-primaria)]/10 border-[var(--nitro-primaria)] ring-2 ring-[var(--nitro-primaria)]/30'
                            : 'bg-[var(--bg-elevado)] border-[var(--borda-sutil)] hover:border-[var(--borda-hover)]'
                        }`}
                      >
                        <div className="space-y-2.5">
                          {/* Nome + Categoria */}
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[var(--nitro-primaria)]/15 text-[var(--nitro-primaria)] flex items-center justify-center shrink-0 border border-[var(--nitro-primaria)]/30">
                              <Shirt className="w-5 h-5" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[var(--nitro-primaria)]/15 text-[var(--nitro-primaria)]">
                                  {prod.category}
                                </span>
                                {isBeingEdited && (
                                  <span className="text-[9px] px-1.5 py-0.5 bg-[var(--nitro-primaria)] text-white font-bold rounded">
                                    Em Edição
                                  </span>
                                )}
                              </div>
                              <h4 className="font-bold text-sm text-[var(--texto-primario)] leading-tight truncate" title={prod.name}>
                                {prod.name}
                              </h4>
                            </div>
                          </div>

                          <p className="text-[11px] text-[var(--texto-secundario)] line-clamp-2">
                            {prod.description}
                          </p>

                          <div className="pt-2 border-t border-[var(--borda-sutil)] grid grid-cols-2 gap-2 text-[11px]">
                            <div>
                              <span className="text-[var(--texto-mutado)] block text-[10px]">Custo Costura:</span>
                              <strong className="text-[var(--texto-primario)] font-mono font-bold">
                                {formatBRL(prod.defaultSewingCost)}
                              </strong>
                            </div>
                            <div>
                              <span className="text-[var(--texto-mutado)] block text-[10px]">Complexidade:</span>
                              <strong className="text-[var(--texto-primario)]">
                                {prod.defaultComplexity.split(' ')[0]}
                              </strong>
                            </div>
                          </div>
                        </div>

                        {/* Botões de Ação do Card */}
                        <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-[var(--borda-sutil)]">
                          <button
                            type="button"
                            onClick={() => handleStartEditProduct(prod)}
                            className="flex-1 py-1.5 px-3 bg-[var(--bg-superficie)] hover:bg-[var(--borda-hover)] text-[var(--texto-primario)] font-bold rounded-xl border border-[var(--borda-sutil)] text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Pencil className="w-3.5 h-3.5 text-[var(--nitro-primaria)]" />
                            <span>Editar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(prod.id)}
                            className="p-2 text-[var(--texto-mutado)] hover:text-[var(--perigo)] hover:bg-[var(--perigo)]/10 rounded-xl transition-colors cursor-pointer"
                            title="Excluir produto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ABA 4: AVIAMENTOS & INSUMOS */}
          {activeSubTab === 'supplies' && (
            <div className="space-y-6 text-xs">
              {/* Formulário de Aviamento (Cadastro e Edição) */}
              <form
                onSubmit={handleSaveSupply}
                className={`p-4 bg-[var(--bg-elevado)] border rounded-2xl space-y-3 transition-colors ${
                  editingSupplyId
                    ? 'border-[var(--nitro-primaria)]/60 ring-1 ring-[var(--nitro-primaria)]/30'
                    : 'border-[var(--borda-sutil)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[var(--texto-primario)] uppercase flex items-center gap-2">
                    {editingSupplyId ? (
                      <>
                        <Pencil className="w-4 h-4 text-[var(--nitro-primaria)]" />
                        <span>Editar Aviamento / Insumo</span>
                        <span className="text-[10px] bg-[var(--nitro-primaria)]/15 text-[var(--nitro-primaria)] px-2 py-0.5 rounded-full font-semibold normal-case">
                          Modo Edição
                        </span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 text-[var(--nitro-primaria)]" />
                        <span>Adicionar Aviamento / Insumo</span>
                      </>
                    )}
                  </span>
                  {editingSupplyId && (
                    <button
                      type="button"
                      onClick={handleCancelEditSupply}
                      className="text-[11px] text-[var(--texto-mutado)] hover:text-[var(--texto-primario)] flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] cursor-pointer transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancelar Edição</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-[var(--texto-secundario)] font-semibold block mb-1">
                      Descrição do Aviamento *
                    </label>
                    <input
                      type="text"
                      required
                      value={newSupplyName}
                      onChange={(e) => setNewSupplyName(e.target.value)}
                      placeholder="Ex: Fita de Reforço Ombro a Ombro"
                      className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] outline-none focus:border-[var(--nitro-primaria)]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[var(--texto-secundario)] font-semibold block mb-1">
                      Categoria
                    </label>
                    <select
                      value={newSupplyCat}
                      onChange={(e) => setNewSupplyCat(e.target.value as any)}
                      className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] outline-none focus:border-[var(--nitro-primaria)]"
                    >
                      <option value="linha">Linha / Fio</option>
                      <option value="etiqueta">Etiqueta / Tag</option>
                      <option value="embalagem">Embalagem Plástica</option>
                      <option value="ziper">Zíper</option>
                      <option value="botao">Botão</option>
                      <option value="reforco">Reforço / Fita</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-[var(--texto-secundario)] font-semibold block mb-1">
                      Custo Unitário por Peça (R$)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        value={newSupplyCost}
                        onChange={(e) => setNewSupplyCost(parseFloat(e.target.value) || 0)}
                        className="flex-1 px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] font-mono font-bold outline-none focus:border-[var(--nitro-primaria)]"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[var(--nitro-primaria)] hover:bg-[var(--nitro-primaria-hover)] text-white font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shadow-sm"
                      >
                        {editingSupplyId ? (
                          <>
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Atualizar</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Salvar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>

              {/* Lista de Aviamentos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {supplies.map((item) => {
                  const isEditing = editingSupplyId === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`p-3 bg-[var(--bg-elevado)] border rounded-xl flex items-center justify-between transition-all ${
                        isEditing
                          ? 'border-[var(--nitro-primaria)] ring-2 ring-[var(--nitro-primaria)]/30 bg-[var(--nitro-primaria)]/5'
                          : 'border-[var(--borda-sutil)]'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-bold text-[var(--texto-primario)] block truncate">{item.name}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] uppercase font-bold text-[var(--texto-mutado)] bg-[var(--bg-superficie)] px-1.5 py-0.5 rounded border border-[var(--borda-sutil)]">
                            {item.category}
                          </span>
                          {isEditing && (
                            <span className="text-[9px] font-bold text-[var(--nitro-primaria)] uppercase">
                              Editando...
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono font-black text-sm text-[var(--nitro-primaria)]">
                          {formatBRL(item.unitCost)}
                        </span>
                        <div className="flex items-center gap-1 border-l border-[var(--borda-sutil)] pl-2">
                          <button
                            type="button"
                            onClick={() => handleStartEditSupply(item)}
                            className="text-[var(--texto-mutado)] hover:text-[var(--nitro-primaria)] hover:bg-[var(--bg-superficie)] p-1.5 rounded-lg cursor-pointer transition-colors"
                            title="Editar aviamento"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSupply(item.id)}
                            className="text-[var(--texto-mutado)] hover:text-[var(--perigo)] hover:bg-[var(--perigo)]/10 p-1.5 rounded-lg cursor-pointer transition-colors"
                            title="Remover aviamento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ABA 5: OFICINAS DE COSTURA & FACÇÕES */}
          {activeSubTab === 'workshops' && (
            <div className="space-y-6 text-xs">
              {/* Formulário de Nova Oficina */}
              <form onSubmit={handleAddWorkshop} className="p-4 bg-[var(--bg-elevado)] border border-[var(--borda-sutil)] rounded-2xl space-y-3">
                <span className="font-bold text-[var(--texto-primario)] uppercase flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[var(--nitro-primaria)]" />
                  Cadastrar Oficina / Facção de Costura
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  <div>
                    <label className="text-[11px] text-[var(--texto-secundario)] font-semibold block mb-1">
                      Nome da Oficina / Facção *
                    </label>
                    <input
                      type="text"
                      required
                      value={newWsName}
                      onChange={(e) => setNewWsName(e.target.value)}
                      placeholder="Ex: Oficina Estrela"
                      className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[var(--texto-secundario)] font-semibold block mb-1">
                      Responsável / Contato
                    </label>
                    <input
                      type="text"
                      value={newWsResp}
                      onChange={(e) => setNewWsResp(e.target.value)}
                      placeholder="Ex: Dona Maria"
                      className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[var(--texto-secundario)] font-semibold block mb-1">
                      Telefone / WhatsApp
                    </label>
                    <input
                      type="text"
                      value={newWsPhone}
                      onChange={(e) => setNewWsPhone(e.target.value)}
                      placeholder="(11) 98765-4321"
                      className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[var(--texto-secundario)] font-semibold block mb-1">
                      Capacidade Mensal (Peças)
                    </label>
                    <input
                      type="number"
                      value={newWsCap}
                      onChange={(e) => setNewWsCap(parseInt(e.target.value) || 1000)}
                      className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] font-mono outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  <div>
                    <label className="text-[10px] text-[var(--texto-secundario)] font-semibold block mb-1">
                      Custo Camiseta (R$)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={newWsTshirt}
                      onChange={(e) => setNewWsTshirt(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-lg text-[var(--texto-primario)] font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[var(--texto-secundario)] font-semibold block mb-1">
                      Custo Polo (R$)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={newWsPolo}
                      onChange={(e) => setNewWsPolo(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-lg text-[var(--texto-primario)] font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[var(--texto-secundario)] font-semibold block mb-1">
                      Custo Moletom (R$)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={newWsHoodie}
                      onChange={(e) => setNewWsHoodie(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-lg text-[var(--texto-primario)] font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[var(--texto-secundario)] font-semibold block mb-1">
                      Custo Calça (R$)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={newWsPants}
                      onChange={(e) => setNewWsPants(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-lg text-[var(--texto-primario)] font-mono outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[var(--nitro-primaria)] hover:bg-[var(--nitro-primaria-hover)] text-white font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Salvar Oficina
                  </button>
                </div>
              </form>

              {/* Lista de Oficinas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {workshops.map((ws) => (
                  <div key={ws.id} className="p-4 bg-[var(--bg-elevado)] border border-[var(--borda-sutil)] rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-sm text-[var(--texto-primario)] block">{ws.name}</span>
                        <span className="text-[11px] text-[var(--texto-secundario)]">
                          Resp: {ws.responsibleName} · {ws.phone}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteWorkshop(ws.id)}
                        className="text-[var(--texto-mutado)] hover:text-[var(--perigo)] p-1 cursor-pointer"
                        title="Remover oficina"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-[var(--borda-sutil)] text-[10px] font-mono text-center">
                      <div className="bg-[var(--bg-input)] p-1.5 rounded-lg">
                        <span className="text-[var(--texto-mutado)] block">Camiseta</span>
                        <strong className="text-[var(--texto-primario)]">{formatBRL(ws.costPerPieceTshirt)}</strong>
                      </div>
                      <div className="bg-[var(--bg-input)] p-1.5 rounded-lg">
                        <span className="text-[var(--texto-mutado)] block">Polo</span>
                        <strong className="text-[var(--texto-primario)]">{formatBRL(ws.costPerPiecePolo)}</strong>
                      </div>
                      <div className="bg-[var(--bg-input)] p-1.5 rounded-lg">
                        <span className="text-[var(--texto-mutado)] block">Moletom</span>
                        <strong className="text-[var(--texto-primario)]">{formatBRL(ws.costPerPieceHoodie)}</strong>
                      </div>
                      <div className="bg-[var(--bg-input)] p-1.5 rounded-lg">
                        <span className="text-[var(--texto-mutado)] block">Calça</span>
                        <strong className="text-[var(--texto-primario)]">{formatBRL(ws.costPerPiecePants)}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABA 6: TECIDOS & PREÇOS DE MALHAS */}
          {activeSubTab === 'fabrics' && (
            <div className="space-y-6 text-xs">
              {/* Formulário Tecido (Cadastro e Edição) */}
              <form
                onSubmit={handleSaveFabric}
                className={`p-4 bg-[var(--bg-elevado)] border rounded-2xl space-y-3.5 transition-colors ${
                  editingFabricId
                    ? 'border-[var(--nitro-primaria)]/60 ring-1 ring-[var(--nitro-primaria)]/30'
                    : 'border-[var(--borda-sutil)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[var(--texto-primario)] uppercase flex items-center gap-2">
                    {editingFabricId ? (
                      <>
                        <Pencil className="w-4 h-4 text-[var(--nitro-primaria)]" />
                        <span>Editar Cadastro de Tecido & Preço</span>
                        <span className="text-[10px] bg-[var(--nitro-primaria)]/15 text-[var(--nitro-primaria)] px-2 py-0.5 rounded-full font-semibold normal-case">
                          Modo Edição
                        </span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 text-[var(--nitro-primaria)]" />
                        <span>Cadastrar Tecido / Malha</span>
                      </>
                    )}
                  </span>
                  {editingFabricId && (
                    <button
                      type="button"
                      onClick={handleCancelEditFabric}
                      className="text-[11px] text-[var(--texto-mutado)] hover:text-[var(--texto-primario)] flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] cursor-pointer transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancelar Edição</span>
                    </button>
                  )}
                </div>

                {/* Linha 1: Nome, Composição, Preço e Tipo de Medida */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[11px] text-[var(--texto-secundario)] font-semibold block mb-1">
                      Nome da Malha / Tecido *
                    </label>
                    <input
                      type="text"
                      required
                      value={newFabName}
                      onChange={(e) => setNewFabName(e.target.value)}
                      placeholder="Ex: Meia Malha 30.1 Penteada"
                      className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] outline-none focus:border-[var(--nitro-primaria)]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[var(--texto-secundario)] font-semibold block mb-1">
                      Composição Têxtil
                    </label>
                    <input
                      type="text"
                      value={newFabComp}
                      onChange={(e) => setNewFabComp(e.target.value)}
                      placeholder="Ex: 100% Algodão, 50/50..."
                      className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] outline-none focus:border-[var(--nitro-primaria)]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[var(--texto-secundario)] font-semibold block mb-1">
                      Preço de Compra (R$/unidade) & Medida
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={newFabPrice}
                        onChange={(e) => setNewFabPrice(parseFloat(e.target.value) || 0)}
                        className="flex-1 px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] font-mono font-bold outline-none focus:border-[var(--nitro-primaria)]"
                      />
                      <select
                        value={newFabUnit}
                        onChange={(e) => setNewFabUnit(e.target.value as any)}
                        className="px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] font-semibold outline-none focus:border-[var(--nitro-primaria)]"
                      >
                        <option value="kg">kg</option>
                        <option value="metro">metro</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Linha 2: Rendimento Peças, Perda Corte % e Observações */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[11px] text-[var(--texto-secundario)] font-semibold block mb-1">
                      Rendimento (Peças por {newFabUnit})
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={newFabYield}
                      onChange={(e) => setNewFabYield(parseFloat(e.target.value) || 1)}
                      className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] font-mono outline-none focus:border-[var(--nitro-primaria)]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[var(--texto-secundario)] font-semibold block mb-1">
                      Perda de Corte (%)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={newFabWaste}
                      onChange={(e) => setNewFabWaste(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] font-mono outline-none focus:border-[var(--nitro-primaria)]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[var(--texto-secundario)] font-semibold block mb-1">
                      Observações / Detalhes do Tecido
                    </label>
                    <input
                      type="text"
                      value={newFabNotes}
                      onChange={(e) => setNewFabNotes(e.target.value)}
                      placeholder="Ex: Gramatura 180g, largura 1.20m..."
                      className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] outline-none focus:border-[var(--nitro-primaria)]"
                    />
                  </div>
                </div>

                {/* SEÇÃO: CÁLCULO PARA COMPRA DE PUNHO / RIBANA */}
                <div className="p-3.5 bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-xl space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={newFabHasPunho}
                        onChange={(e) => setNewFabHasPunho(e.target.checked)}
                        className="w-4 h-4 rounded text-[var(--nitro-primaria)] accent-[var(--nitro-primaria)] cursor-pointer"
                      />
                      <span className="font-bold text-[var(--texto-primario)] text-xs flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[var(--nitro-primaria)]" />
                        Incluir Cálculo de Compra de Punho / Ribana / Gola
                      </span>
                    </label>
                    {newFabHasPunho && (
                      <span className="text-[10px] bg-[var(--nitro-primaria)]/15 text-[var(--nitro-primaria)] px-2 py-0.5 rounded-full font-bold">
                        Cálculo de Matéria-Prima Ativo
                      </span>
                    )}
                  </div>

                  {newFabHasPunho ? (
                    <div className="space-y-3 pt-2 border-t border-[var(--borda-sutil)]">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="min-w-0">
                          <label className="text-[11px] text-[var(--texto-secundario)] font-semibold block mb-1 truncate">
                            Preço do Punho (R$/unidade) *
                          </label>
                          <div className="flex rounded-xl border border-[var(--borda-sutil)] bg-[var(--bg-input)] focus-within:border-[var(--nitro-primaria)] overflow-hidden">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              value={newFabPunhoPrice}
                              onChange={(e) => setNewFabPunhoPrice(parseFloat(e.target.value) || 0)}
                              className="w-full min-w-0 px-3 py-2 bg-transparent text-[var(--texto-primario)] font-mono font-bold outline-none"
                            />
                            <select
                              value={newFabPunhoUnit}
                              onChange={(e) => setNewFabPunhoUnit(e.target.value as any)}
                              className="shrink-0 bg-transparent border-l border-[var(--borda-sutil)] px-2 py-2 text-xs text-[var(--texto-primario)] font-semibold outline-none cursor-pointer"
                            >
                              <option value="kg">kg</option>
                              <option value="metro">metro</option>
                            </select>
                          </div>
                        </div>

                        <div className="min-w-0">
                          <label className="text-[11px] text-[var(--texto-secundario)] font-semibold block mb-1 truncate">
                            Rendimento Punho (Peças por {newFabPunhoUnit}) *
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={newFabPunhoYield}
                            onChange={(e) => setNewFabPunhoYield(parseFloat(e.target.value) || 1)}
                            className="w-full min-w-0 px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] font-mono font-bold outline-none focus:border-[var(--nitro-primaria)]"
                          />
                          <span className="text-[10px] text-[var(--texto-mutado)] mt-0.5 block truncate">
                            Ex: Moletom ~6 pçs/kg, Camiseta ~20 pçs/kg
                          </span>
                        </div>

                        <div className="min-w-0">
                          <label className="text-[11px] text-[var(--texto-secundario)] font-semibold block mb-1 truncate">
                            Perda no Corte do Punho (%)
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={newFabPunhoWaste}
                            onChange={(e) => setNewFabPunhoWaste(parseFloat(e.target.value) || 0)}
                            className="w-full min-w-0 px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] font-mono outline-none focus:border-[var(--nitro-primaria)]"
                          />
                          <span className="text-[10px] text-[var(--texto-mutado)] mt-0.5 block truncate">
                            Margem de pontas e corte
                          </span>
                        </div>

                        <div className="min-w-0">
                          <label className="text-[11px] text-[var(--texto-secundario)] font-semibold block mb-1 truncate">
                            Especificação do Punho / Ribana
                          </label>
                          <input
                            type="text"
                            value={newFabPunhoNotes}
                            onChange={(e) => setNewFabPunhoNotes(e.target.value)}
                            placeholder="Ex: Ribana 2x1 pesada c/ elastano"
                            className="w-full min-w-0 px-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-[var(--texto-primario)] outline-none focus:border-[var(--nitro-primaria)]"
                          />
                        </div>
                      </div>

                      {/* Painel Matemático de Simulação de Compra de Punho */}
                      {(() => {
                        const punhoUnitCostCalc =
                          newFabPunhoYield > 0
                            ? (newFabPunhoPrice / newFabPunhoYield) * (1 + newFabPunhoWaste / 100)
                            : 0;
                        const consumoUnitKg =
                          newFabPunhoYield > 0 ? (1 / newFabPunhoYield) * (1 + newFabPunhoWaste / 100) : 0;
                        const totalToBuy =
                          newFabPunhoYield > 0
                            ? (punhoSimulPieces / newFabPunhoYield) * (1 + newFabPunhoWaste / 100)
                            : 0;
                        const totalCostToBuy = totalToBuy * newFabPunhoPrice;
                        const mainFabricUnitCost =
                          newFabYield > 0 ? (newFabPrice / newFabYield) * (1 + newFabWaste / 100) : 0;
                        const totalFabricAndPunhoCost = mainFabricUnitCost + punhoUnitCostCalc;

                        return (
                          <div className="p-3 bg-[var(--bg-elevado)] rounded-xl border border-[var(--borda-sutil)] space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--borda-sutil)] pb-2">
                              <div className="flex items-center gap-2">
                                <Calculator className="w-3.5 h-3.5 text-[var(--nitro-primaria)]" />
                                <span className="font-bold text-[var(--texto-primario)] text-[11px] uppercase tracking-wide">
                                  Cálculo de Matéria-Prima & Custo de Punho
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] text-[var(--texto-secundario)]">
                                <span>Simulação para lote de:</span>
                                <input
                                  type="number"
                                  min="1"
                                  value={punhoSimulPieces}
                                  onChange={(e) => setPunhoSimulPieces(parseInt(e.target.value) || 1)}
                                  className="w-16 px-1.5 py-0.5 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded text-center font-mono font-bold text-[var(--texto-primario)] outline-none"
                                />
                                <span>peças</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[10px]">
                              <div className="bg-[var(--bg-superficie)] p-2 rounded-lg border border-[var(--borda-sutil)]">
                                <span className="text-[var(--texto-mutado)] block">Custo Punho / Peça</span>
                                <strong className="text-sm font-mono font-black text-[var(--nitro-primaria)]">
                                  {formatBRL(punhoUnitCostCalc)}
                                </strong>
                              </div>

                              <div className="bg-[var(--bg-superficie)] p-2 rounded-lg border border-[var(--borda-sutil)]">
                                <span className="text-[var(--texto-mutado)] block">Consumo por Peça</span>
                                <strong className="text-xs font-mono font-bold text-[var(--texto-primario)]">
                                  {newFabPunhoUnit === 'kg'
                                    ? `${(consumoUnitKg * 1000).toFixed(1)} g / pç`
                                    : `${(consumoUnitKg * 100).toFixed(1)} cm / pç`}
                                </strong>
                              </div>

                              <div className="bg-[var(--bg-superficie)] p-2 rounded-lg border border-[var(--borda-sutil)]">
                                <span className="text-[var(--texto-mutado)] block">
                                  Comprar Punho ({punhoSimulPieces} pçs)
                                </span>
                                <strong className="text-sm font-mono font-black text-amber-400">
                                  {totalToBuy.toFixed(2)} {newFabPunhoUnit}
                                </strong>
                              </div>

                              <div className="bg-[var(--bg-superficie)] p-2 rounded-lg border border-[var(--borda-sutil)]">
                                <span className="text-[var(--texto-mutado)] block">Custo Total Compra Punho</span>
                                <strong className="text-sm font-mono font-black text-[var(--sucesso)]">
                                  {formatBRL(totalCostToBuy)}
                                </strong>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] pt-1 text-[var(--texto-secundario)]">
                              <span>
                                Tecido Corpo ({formatBRL(mainFabricUnitCost)}) + Punho ({formatBRL(punhoUnitCostCalc)}):
                              </span>
                              <span className="font-mono font-black text-xs text-[var(--nitro-primaria)]">
                                Custo Têxtil Total: {formatBRL(totalFabricAndPunhoCost)} / peça
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <p className="text-[11px] text-[var(--texto-mutado)] italic pl-1">
                      Marque a opção acima se este tecido exigir compra separada de punho, gola retilínea ou ribana (ex: moletom, polo, jaquetas).
                    </p>
                  )}
                </div>

                {/* Linha de Ações do Formulário */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  {editingFabricId && (
                    <button
                      type="button"
                      onClick={handleCancelEditFabric}
                      className="px-4 py-2 bg-[var(--bg-superficie)] hover:bg-[var(--borda-hover)] text-[var(--texto-primario)] font-semibold rounded-xl border border-[var(--borda-sutil)] transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[var(--nitro-primaria)] hover:bg-[var(--nitro-primaria-hover)] text-white font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    {editingFabricId ? (
                      <>
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Atualizar Dados do Tecido</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Salvar Tecido</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Lista de Tecidos */}
              <div className="space-y-3">
                {fabrics.map((fab) => {
                  const isEditing = editingFabricId === fab.id;
                  const estimatedBodyCost =
                    fab.yieldPerUnit > 0
                      ? (fab.pricePerUnit / fab.yieldPerUnit) * (1 + (fab.wasteMarginPct || 0) / 100)
                      : 0;

                  const punhoUnitCost =
                    fab.hasPunho && fab.punhoYieldPerUnit && fab.punhoYieldPerUnit > 0 && fab.punhoPricePerUnit
                      ? (fab.punhoPricePerUnit / fab.punhoYieldPerUnit) * (1 + (fab.punhoWasteMarginPct || 0) / 100)
                      : 0;

                  const totalTextileCost = estimatedBodyCost + punhoUnitCost;

                  const punho100Pieces =
                    fab.hasPunho && fab.punhoYieldPerUnit && fab.punhoYieldPerUnit > 0
                      ? (100 / fab.punhoYieldPerUnit) * (1 + (fab.punhoWasteMarginPct || 0) / 100)
                      : 0;

                  return (
                    <div
                      key={fab.id}
                      className={`p-3.5 bg-[var(--bg-elevado)] border rounded-xl transition-all space-y-2.5 ${
                        isEditing
                          ? 'border-[var(--nitro-primaria)] ring-2 ring-[var(--nitro-primaria)]/30 bg-[var(--nitro-primaria)]/5'
                          : 'border-[var(--borda-sutil)]'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-[var(--texto-primario)] text-sm">{fab.name}</span>
                            {fab.composition && (
                              <span className="text-[10px] bg-[var(--bg-superficie)] text-[var(--texto-secundario)] font-semibold px-2 py-0.5 rounded-full border border-[var(--borda-sutil)]">
                                {fab.composition}
                              </span>
                            )}
                            {fab.hasPunho ? (
                              <span className="text-[10px] bg-amber-500/15 text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                                <Layers className="w-2.5 h-2.5" />
                                <span>Punho / Ribana (+{formatBRL(punhoUnitCost)}/pç)</span>
                              </span>
                            ) : (
                              <span className="text-[10px] bg-[var(--bg-superficie)] text-[var(--texto-mutado)] font-semibold px-2 py-0.5 rounded-full border border-[var(--borda-sutil)]">
                                Sem Punho
                              </span>
                            )}
                            {isEditing && (
                              <span className="text-[9px] font-bold text-[var(--nitro-primaria)] uppercase bg-[var(--nitro-primaria)]/15 px-2 py-0.5 rounded">
                                Editando
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-[var(--texto-secundario)] flex-wrap">
                            <span>
                              Rendimento Corpo: <strong className="text-[var(--texto-primario)] font-mono">{fab.yieldPerUnit}</strong> pçs/{fab.unitType}
                            </span>
                            <span>•</span>
                            <span>
                              Perda corte: <strong className="text-[var(--texto-primario)] font-mono">+{fab.wasteMarginPct}%</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Custo corpo: <strong className="text-[var(--texto-primario)] font-mono">{formatBRL(estimatedBodyCost)}</strong>
                            </span>
                            {fab.hasPunho && (
                              <>
                                <span>•</span>
                                <span>
                                  Custo Total Malha + Punho:{' '}
                                  <strong className="text-[var(--nitro-primaria)] font-mono font-bold">
                                    {formatBRL(totalTextileCost)}
                                  </strong>
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                          <div className="text-right">
                            <span className="font-mono font-black text-sm text-[var(--nitro-primaria)] block">
                              {formatBRL(fab.pricePerUnit)}
                            </span>
                            <span className="text-[10px] text-[var(--texto-mutado)] font-semibold">
                              por {fab.unitType}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 border-l border-[var(--borda-sutil)] pl-2">
                            <button
                              type="button"
                              onClick={() => handleStartEditFabric(fab)}
                              className="text-[var(--texto-mutado)] hover:text-[var(--nitro-primaria)] hover:bg-[var(--bg-superficie)] p-2 rounded-xl cursor-pointer transition-colors flex items-center gap-1"
                              title="Editar tecido"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline text-[11px] font-bold">Editar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteFabric(fab.id)}
                              disabled={fabrics.length <= 1}
                              className={`p-2 rounded-xl transition-colors ${
                                fabrics.length <= 1
                                  ? 'opacity-30 cursor-not-allowed text-[var(--texto-mutado)]'
                                  : 'text-[var(--texto-mutado)] hover:text-[var(--perigo)] hover:bg-[var(--perigo)]/10 cursor-pointer'
                              }`}
                              title={fabrics.length <= 1 ? 'Mínimo de 1 tecido obrigatório' : 'Remover tecido'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Caixa de Detalhes da Compra de Punho / Ribana */}
                      {fab.hasPunho && (
                        <div className="p-2.5 bg-[var(--bg-superficie)] rounded-xl border border-amber-500/20 text-[11px] text-[var(--texto-secundario)] space-y-1">
                          <div className="flex flex-wrap items-center justify-between gap-1.5">
                            <span className="font-bold text-[var(--texto-primario)] flex items-center gap-1">
                              <Layers className="w-3 h-3 text-amber-400" />
                              Compra de Punho / Ribana:
                            </span>
                            <span className="font-mono font-bold text-amber-400">
                              {formatBRL(fab.punhoPricePerUnit || 0)} / {fab.punhoUnitType || 'kg'} · Rend: {fab.punhoYieldPerUnit} pçs/{fab.punhoUnitType || 'kg'} (+{fab.punhoWasteMarginPct}% perda)
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-1.5 text-[10px] text-[var(--texto-mutado)]">
                            <span>
                              {fab.punhoNotes || 'Ribana combinada padrão'}
                            </span>
                            <span className="font-mono text-[var(--texto-primario)]">
                              Cálculo p/ 100 peças = <strong className="text-amber-400">{punho100Pieces.toFixed(2)} {fab.punhoUnitType || 'kg'}</strong> ({formatBRL(punho100Pieces * (fab.punhoPricePerUnit || 0))})
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Observações do Tecido se existirem */}
                      {fab.notes && (
                        <div className="pt-2 border-t border-[var(--borda-sutil)] text-[11px] text-[var(--texto-secundario)] flex items-start gap-1.5">
                          <span className="font-bold text-[var(--texto-mutado)] uppercase text-[10px] shrink-0">
                            Obs:
                          </span>
                          <span className="italic">{fab.notes}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Confirmação Obrigatória para Escrita no Google Drive */}
      {confirmRecreateOpen && (
        <div className="fixed inset-0 z-[120] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-[var(--borda-sutil)] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[var(--nitro-primaria)]/15 text-[var(--nitro-primaria)] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[var(--texto-primario)]">
                    Confirmar Padronização v3.0 no Google Drive
                  </h3>
                  <p className="text-[11px] text-[var(--texto-secundario)]">
                    Ação administrativa direta via API do Google Sheets
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isRecreatingTabs && setConfirmRecreateOpen(false)}
                className="p-1.5 rounded-lg text-[var(--texto-mutado)] hover:text-[var(--texto-primario)] hover:bg-[var(--bg-elevado)] cursor-pointer"
                aria-label="Fechar confirmação"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[var(--texto-secundario)] leading-relaxed">
              <div className="p-3 bg-[var(--bg-elevado)] border border-[var(--borda-sutil)] rounded-xl space-y-1">
                <div className="text-[11px] text-[var(--texto-mutado)] uppercase font-bold">
                  Planilha de Destino
                </div>
                <div className="font-bold text-[var(--texto-primario)]">
                  {auditResult?.spreadsheetTitle || TARGET_SPREADSHEET_NAME}
                </div>
                <div className="font-mono text-[10px] text-[var(--texto-mutado)] break-all">
                  ID: {selectedSpreadsheetId}
                </div>
              </div>

              <p>
                Todas as <strong>{GOOGLE_SHEETS_SCHEMA.tabs.length} abas oficiais v3.0</strong> serão criadas ou realinhadas com os cabeçalhos padrão na Linha 1 ({GOOGLE_SHEETS_SCHEMA.tabs.map((t) => t.name).join(', ')}).
              </p>

              <p className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-[11px]">
                <strong>Preservação garantida:</strong> todos os pedidos e registros já presentes serão remapeados por nome de cabeçalho antes da gravação para não perder histórico.
              </p>

              <label className="flex items-start gap-2.5 p-3 bg-[var(--bg-elevado)] border border-[var(--borda-sutil)] rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncCatalogsOnRecreate}
                  onChange={(e) => setSyncCatalogsOnRecreate(e.target.checked)}
                  className="mt-0.5 rounded border-[var(--borda-sutil)] accent-[var(--nitro-primaria)]"
                />
                <span className="text-[11px] text-[var(--texto-primario)]">
                  <strong>Sincronizar também os cadastros atuais do sistema</strong> (Produtos, Tecidos com Punho/Ribana, Insumos, Fornecedores e Oficinas) sem duplicar por ID.
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--borda-sutil)]">
              <button
                type="button"
                onClick={() => setConfirmRecreateOpen(false)}
                disabled={isRecreatingTabs}
                className="px-4 py-2 bg-[var(--bg-elevado)] hover:bg-[var(--borda-sutil)]/40 border border-[var(--borda-sutil)] text-[var(--texto-primario)] rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteRecreateTabs}
                disabled={isRecreatingTabs}
                className="px-4 py-2 bg-[var(--nitro-primaria)] hover:bg-[var(--nitro-primaria-hover)] text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
              >
                {isRecreatingTabs && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{isRecreatingTabs ? 'Recriando abas v3.0...' : 'Confirmar e Recriar Abas v3.0'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
