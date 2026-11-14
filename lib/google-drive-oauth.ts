'use client';

import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  User,
} from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';
import {
  Fabric,
  ProductTemplate,
  SewingWorkshop,
  StructuredOrderPayload,
  Supplier,
  SupplyItem,
} from './types';
import { GOOGLE_SHEETS_SCHEMA } from './google-sheets-sync';

export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.activity',
  'https://www.googleapis.com/auth/drive.activity.readonly',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.apps.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.install',
  'https://www.googleapis.com/auth/drive.meet.readonly',
  'https://www.googleapis.com/auth/drive.metadata',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive.photos.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.scripts',
] as const;

export const TARGET_SPREADSHEET_NAME = 'Historico_Pedidos_sistema_Nitrocamisetas';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
WORKSPACE_SCOPES.forEach((scope) => provider.addScope(scope));

let isSigningIn = false;
// Token OAuth mantido estritamente em memória (nunca persistido em localStorage/sessionStorage)
let cachedAccessToken: string | null = null;

export const initDriveAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user && cachedAccessToken) {
      onAuthSuccess?.(user, cachedAccessToken);
    } else if (!isSigningIn) {
      cachedAccessToken = null;
      onAuthFailure?.();
    }
  });
};

export const signInWithGoogleDrive = async (): Promise<{
  user: User;
  accessToken: string;
}> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Não foi possível obter o token de acesso do Google Drive.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } finally {
    isSigningIn = false;
  }
};

export const signOutGoogleDrive = async (): Promise<void> => {
  cachedAccessToken = null;
  await auth.signOut();
};

export const getDriveAccessToken = (): string | null => {
  return cachedAccessToken;
};

export interface DriveSpreadsheetFile {
  id: string;
  name: string;
  webViewLink?: string;
  modifiedTime?: string;
}

export async function findNitroSpreadsheet(
  accessToken: string,
  targetName: string = TARGET_SPREADSHEET_NAME
): Promise<{ exactMatch: DriveSpreadsheetFile | null; candidates: DriveSpreadsheetFile[] }> {
  const exactQuery = encodeURIComponent(
    `name = '${targetName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`
  );
  const listQuery = encodeURIComponent(
    `mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`
  );

  const [exactRes, listRes] = await Promise.all([
    fetch(
      `https://www.googleapis.com/drive/v3/files?q=${exactQuery}&fields=files(id,name,webViewLink,modifiedTime)&pageSize=10&includeItemsFromAllDrives=true&supportsAllDrives=true`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    ),
    fetch(
      `https://www.googleapis.com/drive/v3/files?q=${listQuery}&orderBy=modifiedTime desc&fields=files(id,name,webViewLink,modifiedTime)&pageSize=20&includeItemsFromAllDrives=true&supportsAllDrives=true`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    ),
  ]);

  if (!exactRes.ok) {
    const errBody = await exactRes.text();
    throw new Error(`Erro ao consultar Google Drive (${exactRes.status}): ${errBody}`);
  }

  const exactJson = await exactRes.json();
  const listJson = listRes.ok ? await listRes.json() : { files: [] };

  const exactFiles: DriveSpreadsheetFile[] = Array.isArray(exactJson.files) ? exactJson.files : [];
  const allFiles: DriveSpreadsheetFile[] = Array.isArray(listJson.files) ? listJson.files : [];

  const exactMatch =
    exactFiles[0] ||
    allFiles.find((f) => f.name.toLowerCase().includes('historico_pedidos')) ||
    null;

  return {
    exactMatch,
    candidates: allFiles,
  };
}

export interface SheetTabAudit {
  tabName: string;
  exists: boolean;
  sheetId?: number;
  expectedColumns: string[];
  actualColumns: string[];
  missingColumns: string[];
  extraColumns: string[];
  rowCount: number;
  status: 'aligned' | 'needs_update' | 'missing';
}

export interface SpreadsheetAuditResult {
  spreadsheetId: string;
  spreadsheetTitle: string;
  spreadsheetUrl?: string;
  tabs: SheetTabAudit[];
  existingSheetNames: string[];
}

function normalizeHeader(value: string): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const LEGACY_HEADER_ALIASES: Record<string, string[]> = {
  'Custo_Camiseta_R$': ['custo_camiseta'],
  'Custo_Polo_R$': ['custo_polo'],
  'Custo_Moletom_R$': ['custo_moletom'],
  'Custo_Calca_R$': ['custo_calca'],
  'ID_Pedido': ['id'],
  'Cliente_Nome': ['cliente', 'nome_cliente'],
  'Valor_Total_Venda_R$': ['valor_total_r$', 'total_venda'],
};

export async function inspectSpreadsheetSchema(
  accessToken: string,
  spreadsheetId: string
): Promise<SpreadsheetAuditResult> {
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,spreadsheetUrl,sheets.properties`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!metaRes.ok) {
    const errText = await metaRes.text();
    throw new Error(`Falha ao ler metadados da planilha (${metaRes.status}): ${errText}`);
  }

  const meta = await metaRes.json();
  const sheetsMeta: Array<{ properties: { sheetId: number; title: string; gridProperties?: { rowCount?: number } } }> =
    Array.isArray(meta.sheets) ? meta.sheets : [];

  const titleToMeta = new Map<string, { sheetId: number; title: string }>();
  sheetsMeta.forEach((s) => {
    titleToMeta.set(s.properties.title, {
      sheetId: s.properties.sheetId,
      title: s.properties.title,
    });
  });

  // Lê linha 1 + contagem básica das abas existentes em uma chamada batchGet
  const ranges = sheetsMeta.map((s) => `'${s.properties.title.replace(/'/g, "''")}'!A1:AZ`);
  const rangeParams = ranges.map((r) => `ranges=${encodeURIComponent(r)}`).join('&');
  const batchRes =
    ranges.length > 0
      ? await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${rangeParams}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        )
      : null;

  const valueRanges: Array<{ range: string; values?: string[][] }> =
    batchRes && batchRes.ok ? (await batchRes.json()).valueRanges || [] : [];

  const tabAuditMap = new Map<string, { headers: string[]; rows: number }>();
  sheetsMeta.forEach((s, idx) => {
    const vr = valueRanges[idx];
    const rows = Array.isArray(vr?.values) ? vr.values : [];
    const headers = rows[0] ? rows[0].map((v) => String(v || '').trim()) : [];
    const dataRows = Math.max(0, rows.length - 1);
    tabAuditMap.set(s.properties.title, { headers, rows: dataRows });
  });

  const tabs: SheetTabAudit[] = GOOGLE_SHEETS_SCHEMA.tabs.map((schemaTab) => {
    const foundTitle =
      sheetsMeta.find((s) => s.properties.title === schemaTab.name)?.properties.title ||
      (schemaTab.name === 'Insumos_MaoDeObra'
        ? sheetsMeta.find((s) => s.properties.title === 'Insumos')?.properties.title
        : undefined);

    const existingInfo = foundTitle ? tabAuditMap.get(foundTitle) : undefined;
    const sheetMeta = foundTitle ? titleToMeta.get(foundTitle) : undefined;
    const actualColumns = existingInfo?.headers || [];
    const actualNorm = new Set(actualColumns.map(normalizeHeader));

    const missingColumns = schemaTab.columns.filter((col) => {
      const colNorm = normalizeHeader(col);
      if (actualNorm.has(colNorm)) return false;
      const aliases = LEGACY_HEADER_ALIASES[col] || [];
      return !aliases.some((alias) => actualNorm.has(normalizeHeader(alias)));
    });

    const expectedNorm = new Set(schemaTab.columns.map(normalizeHeader));
    const extraColumns = actualColumns.filter((col) => col && !expectedNorm.has(normalizeHeader(col)));

    const exists = Boolean(foundTitle);
    const exactOrderMatches =
      exists &&
      foundTitle === schemaTab.name &&
      missingColumns.length === 0 &&
      schemaTab.columns.every((col, i) => normalizeHeader(actualColumns[i] || '') === normalizeHeader(col));

    return {
      tabName: schemaTab.name,
      exists,
      sheetId: sheetMeta?.sheetId,
      expectedColumns: schemaTab.columns,
      actualColumns,
      missingColumns,
      extraColumns,
      rowCount: existingInfo?.rows || 0,
      status: !exists ? 'missing' : exactOrderMatches ? 'aligned' : 'needs_update',
    };
  });

  return {
    spreadsheetId,
    spreadsheetTitle: meta.properties?.title || TARGET_SPREADSHEET_NAME,
    spreadsheetUrl: meta.spreadsheetUrl,
    tabs,
    existingSheetNames: sheetsMeta.map((s) => s.properties.title),
  };
}

export interface CatalogSeedBundle {
  products?: ProductTemplate[];
  fabrics?: Fabric[];
  supplies?: SupplyItem[];
  suppliers?: Supplier[];
  workshops?: SewingWorkshop[];
}

export async function recreateV3TabsInSpreadsheet(
  accessToken: string,
  spreadsheetId: string,
  options: { syncLocalCatalogs: boolean; catalogs?: CatalogSeedBundle }
): Promise<{
  updatedTabs: string[];
  createdTabs: string[];
  preservedRowsTotal: number;
  seededCatalogRows: number;
}> {
  const audit = await inspectSpreadsheetSchema(accessToken, spreadsheetId);

  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!metaRes.ok) {
    throw new Error('Não foi possível ler as abas atuais da planilha.');
  }
  const metaJson = await metaRes.json();
  const sheetsList: Array<{ properties: { sheetId: number; title: string } }> = metaJson.sheets || [];

  const createdTabs: string[] = [];
  const updatedTabs: string[] = [];
  const addSheetRequests: any[] = [];

  for (const schemaTab of GOOGLE_SHEETS_SCHEMA.tabs) {
    const exactExists = sheetsList.some((s) => s.properties.title === schemaTab.name);
    if (!exactExists) {
      addSheetRequests.push({
        addSheet: {
          properties: {
            title: schemaTab.name,
            gridProperties: { frozenRowCount: 1 },
          },
        },
      });
      createdTabs.push(schemaTab.name);
    }
  }

  let latestSheetsList = sheetsList;
  if (addSheetRequests.length > 0) {
    const addRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests: addSheetRequests }),
      }
    );
    if (!addRes.ok) {
      const txt = await addRes.text();
      throw new Error(`Erro ao criar novas abas no Google Sheets: ${txt}`);
    }
    const refreshMeta = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (refreshMeta.ok) {
      latestSheetsList = (await refreshMeta.json()).sheets || latestSheetsList;
    }
  }

  let preservedRowsTotal = 0;
  let seededCatalogRows = 0;
  const valueUpdates: Array<{ range: string; values: any[][] }> = [];
  const formatRequests: any[] = [];

  for (const schemaTab of GOOGLE_SHEETS_SCHEMA.tabs) {
    // Fonte de dados existente (tenta aba exata ou legado Insumos -> Insumos_MaoDeObra)
    const sourceName =
      audit.existingSheetNames.includes(schemaTab.name)
        ? schemaTab.name
        : schemaTab.name === 'Insumos_MaoDeObra' && audit.existingSheetNames.includes('Insumos')
        ? 'Insumos'
        : null;

    let existingValues: any[][] = [];
    if (sourceName) {
      const valRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(`'${sourceName}'!A1:AZ`)}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (valRes.ok) {
        const valJson = await valRes.json();
        existingValues = Array.isArray(valJson.values) ? valJson.values : [];
      }
    }

    const oldHeaders = (existingValues[0] || []).map((h) => String(h || '').trim());
    const oldDataRows = existingValues.slice(1).filter((row) => row.some((c) => String(c || '').trim() !== ''));

    // Mapeia linhas existentes por nome de cabeçalho para o padrão v3.0 exato
    const remappedRows: any[][] = oldDataRows.map((oldRow) => {
      const recordByNorm = new Map<string, any>();
      oldHeaders.forEach((h, colIdx) => {
        const norm = normalizeHeader(h);
        if (norm) recordByNorm.set(norm, oldRow[colIdx]);
      });

      return schemaTab.columns.map((targetCol) => {
        const targetNorm = normalizeHeader(targetCol);
        if (recordByNorm.has(targetNorm)) {
          return recordByNorm.get(targetNorm) ?? '';
        }
        const aliases = LEGACY_HEADER_ALIASES[targetCol] || [];
        for (const alias of aliases) {
          const aliasNorm = normalizeHeader(alias);
          if (recordByNorm.has(aliasNorm)) {
            return recordByNorm.get(aliasNorm) ?? '';
          }
        }
        return '';
      });
    });

    preservedRowsTotal += remappedRows.length;

    // Opcionalmente mescla/atualiza cadastros locais sem duplicar por ID (coluna 0)
    if (options.syncLocalCatalogs && options.catalogs) {
      const nowIso = new Date().toISOString();
      let localRows: any[][] = [];

      if (schemaTab.name === 'Produtos' && options.catalogs.products) {
        localRows = options.catalogs.products.map((p) => [
          p.id,
          p.name,
          p.category,
          p.description || '',
          p.defaultFabricId || '',
          p.defaultSewingCost || 0,
          p.defaultComplexity || 'Simples (Básica)',
          p.defaultThreadCost || 0,
          p.defaultTagCost || 0,
          p.defaultPackagingCost || 0,
          p.defaultZipperCost || 0,
          p.defaultButtonCost || 0,
          nowIso,
        ]);
      } else if (schemaTab.name === 'Tecidos' && options.catalogs.fabrics) {
        localRows = options.catalogs.fabrics.map((f) => [
          f.id,
          f.name,
          f.composition,
          f.pricePerUnit,
          f.unitType,
          f.yieldPerUnit,
          f.wasteMarginPct,
          f.hasPunho ? 'SIM' : 'NÃO',
          f.punhoPricePerUnit || 0,
          f.punhoYieldPerUnit || 0,
          f.punhoWasteMarginPct || 0,
          f.punhoUnitType || 'kg',
          f.punhoNotes || '',
          f.notes || '',
          nowIso,
        ]);
      } else if (schemaTab.name === 'Insumos_MaoDeObra' && options.catalogs.supplies) {
        localRows = options.catalogs.supplies.map((s) => [
          s.id,
          s.name,
          s.category,
          s.unitCost,
          s.supplierId ? `Fornecedor: ${s.supplierId}` : '',
          nowIso,
        ]);
      } else if (schemaTab.name === 'Fornecedores' && options.catalogs.suppliers) {
        localRows = options.catalogs.suppliers.map((s) => [
          s.id,
          s.name,
          s.contactName,
          s.phone,
          s.email,
          s.category,
          s.leadTimeDays,
          s.city,
          s.notes || '',
          nowIso,
        ]);
      } else if (schemaTab.name === 'Oficinas' && options.catalogs.workshops) {
        localRows = options.catalogs.workshops.map((w) => [
          w.id,
          w.name,
          w.responsibleName,
          w.phone,
          w.city,
          w.capacityPiecesPerMonth,
          w.costPerPieceTshirt,
          w.costPerPiecePolo,
          w.costPerPieceHoodie,
          w.costPerPiecePants,
          w.notes || '',
          nowIso,
        ]);
      }

      if (localRows.length > 0) {
        const byId = new Map<string, any[]>();
        remappedRows.forEach((r) => {
          const id = String(r[0] || '').trim();
          if (id) byId.set(id, r);
        });
        localRows.forEach((r) => {
          const id = String(r[0] || '').trim();
          if (id) {
            byId.set(id, r);
            seededCatalogRows++;
          }
        });
        remappedRows.length = 0;
        byId.forEach((r) => remappedRows.push(r));
      }
    }

    // Limpa conteúdo antigo da aba destino para gravar o layout v3.0 perfeitamente alinhado
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(`'${schemaTab.name}'!A1:AZ`)}:clear`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    valueUpdates.push({
      range: `'${schemaTab.name}'!A1`,
      values: [schemaTab.columns, ...remappedRows],
    });
    updatedTabs.push(schemaTab.name);

    const sheetObj = latestSheetsList.find((s) => s.properties.title === schemaTab.name);
    if (sheetObj) {
      formatRequests.push(
        {
          updateSheetProperties: {
            properties: {
              sheetId: sheetObj.properties.sheetId,
              gridProperties: { frozenRowCount: 1 },
            },
            fields: 'gridProperties.frozenRowCount',
          },
        },
        {
          repeatCell: {
            range: {
              sheetId: sheetObj.properties.sheetId,
              startRowIndex: 0,
              endRowIndex: 1,
              startColumnIndex: 0,
              endColumnIndex: schemaTab.columns.length,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 1.0, green: 0.514, blue: 0.0 },
                textFormat: {
                  foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
                  bold: true,
                },
              },
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat)',
          },
        }
      );
    }
  }

  if (valueUpdates.length > 0) {
    const batchWriteRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          valueInputOption: 'USER_ENTERED',
          data: valueUpdates,
        }),
      }
    );
    if (!batchWriteRes.ok) {
      const errTxt = await batchWriteRes.text();
      throw new Error(`Erro ao gravar abas padronizadas v3.0: ${errTxt}`);
    }
  }

  if (formatRequests.length > 0) {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests: formatRequests }),
    });
  }

  return {
    updatedTabs,
    createdTabs,
    preservedRowsTotal,
    seededCatalogRows,
  };
}

export async function appendOrderItemsViaDrive(
  payload: StructuredOrderPayload
): Promise<{ saved: boolean; itemCount: number; message?: string }> {
  const token = cachedAccessToken;
  if (!token || !Array.isArray(payload.itens) || payload.itens.length === 0) {
    return { saved: false, itemCount: 0 };
  }

  try {
    const { exactMatch, candidates } = await findNitroSpreadsheet(token, TARGET_SPREADSHEET_NAME);
    const targetFile = exactMatch || candidates[0];
    if (!targetFile?.id) return { saved: false, itemCount: 0 };

    const spreadsheetId = targetFile.id;
    const itensSchema = GOOGLE_SHEETS_SCHEMA.tabs.find((t) => t.name === 'Itens_Pedido');
    if (!itensSchema) return { saved: false, itemCount: 0 };

    const metaRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!metaRes.ok) return { saved: false, itemCount: 0 };
    const metaJson = await metaRes.json();
    const sheetsList: Array<{ properties: { sheetId: number; title: string } }> = metaJson.sheets || [];
    const hasItensSheet = sheetsList.some((s) => s.properties.title === 'Itens_Pedido');

    if (!hasItensSheet) {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              addSheet: {
                properties: {
                  title: 'Itens_Pedido',
                  gridProperties: { frozenRowCount: 1 },
                },
              },
            },
          ],
        }),
      });
    }

    const headerRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent("'Itens_Pedido'!1:1")}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const headerJson = headerRes.ok ? await headerRes.json() : {};
    let currentHeaders: string[] = Array.isArray(headerJson.values?.[0])
      ? headerJson.values[0].map((v: any) => String(v || '').trim()).filter(Boolean)
      : [];

    const missingHeaders = itensSchema.columns.filter(
      (col) => !currentHeaders.some((h) => normalizeHeader(h) === normalizeHeader(col))
    );

    if (currentHeaders.length === 0) {
      currentHeaders = [...itensSchema.columns];
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent("'Itens_Pedido'!A1")}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: [currentHeaders] }),
        }
      );
    } else if (missingHeaders.length > 0) {
      currentHeaders = [...currentHeaders, ...missingHeaders];
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent("'Itens_Pedido'!A1")}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: [currentHeaders] }),
        }
      );
    }

    const rowsToAppend = payload.itens.map((it, idx) => {
      const g = it.gradeTamanhos;
      const inf = g.infantil;
      const record: Record<string, string | number> = {
        ID_Pedido: payload.pedido.id,
        ID_Item: it.id || `item-${idx + 1}`,
        Numero_Orcamento: it.quoteNumber || payload.pedido.quoteNumber,
        Ordem_Item: it.ordemItem || idx + 1,
        Produto: it.produto || '',
        Tecido: it.tecido || '',
        Composicao_Tecido: it.composicaoTecido || '',
        Cor_Malha: it.corMalha || '',
        Modelagem: it.modelagem || 'Unissex',
        Tipo_Manga: it.tipoManga || 'Manga Curta',
        Tecnicas_Estamparia: it.estamparia.tecnicasResumo || '',
        Posicoes_Estampa: it.estamparia.posicoesResumo || '',
        Link_Mockup_Aprovado: it.arquivosVisuais.linkMockupAprovado || '',
        Link_Arte_Final: it.arquivosVisuais.linkArteFinal || '',
        PP: Number(g.pp) || 0,
        P: Number(g.p) || 0,
        M: Number(g.m) || 0,
        G: Number(g.g) || 0,
        GG: Number(g.gg) || 0,
        EXG: Number(g.exg) || 0,
        G1: Number(g.g1) || 0,
        G2: Number(g.g2) || 0,
        Tam_02: Number(inf.tam02) || 0,
        Tam_04: Number(inf.tam04) || 0,
        Tam_06: Number(inf.tam06) || 0,
        Tam_08: Number(inf.tam08) || 0,
        Tam_10: Number(inf.tam10) || 0,
        Tam_12: Number(inf.tam12) || 0,
        Tam_14: Number(inf.tam14) || 0,
        Tam_16: Number(inf.tam16) || 0,
        Infantil_02_16: g.infantilResumo || '',
        Total_Pecas_Item: Number(g.totalPecas) || 0,
        'Custo_Unitario_R$': Number(it.valores.custoUnitario) || 0,
        'Preco_Venda_Unit_R$': Number(it.valores.precoVendaUnitario) || 0,
        'Total_Venda_Item_R$': Number(it.valores.totalVendaItem) || 0,
        Observacoes_Tecnicas: it.observacoesTecnicas || '',
      };

      const recordByNorm = new Map<string, string | number>();
      Object.entries(record).forEach(([k, v]) => recordByNorm.set(normalizeHeader(k), v));
      return currentHeaders.map((h) => recordByNorm.get(normalizeHeader(h)) ?? '');
    });

    const appendRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent("'Itens_Pedido'!A1")}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: rowsToAppend }),
      }
    );

    if (!appendRes.ok) {
      return { saved: false, itemCount: 0 };
    }

    return {
      saved: true,
      itemCount: rowsToAppend.length,
      message: `${rowsToAppend.length} item(ns) com grade completa de tamanhos gravados na aba Itens_Pedido via Google Drive!`,
    };
  } catch {
    return { saved: false, itemCount: 0 };
  }
}
