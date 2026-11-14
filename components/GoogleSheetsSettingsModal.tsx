'use client';

import React, { useState } from 'react';
import {
  GOOGLE_APPS_SCRIPT_TEMPLATE,
  GOOGLE_SHEETS_SCHEMA,
  loadGoogleSheetsConfig,
  saveGoogleSheetsConfig,
  testWebhookLiveStatus,
} from '../lib/google-sheets-sync';
import { GoogleSheetsConfig } from '../lib/types';
import { copyToClipboard } from '../lib/whatsapp-formatter';
import {
  Check,
  Copy,
  ExternalLink,
  FileSpreadsheet,
  Link as LinkIcon,
  RefreshCw,
  Server,
  Table,
} from 'lucide-react';

export const GoogleSheetsSettingsModal: React.FC = () => {
  const [config, setConfig] = useState<GoogleSheetsConfig>(() => loadGoogleSheetsConfig());
  const [copiedScript, setCopiedScript] = useState(false);
  const [testingPing, setTestingPing] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    isWarning?: boolean;
    message: string;
  } | null>(null);

  const handleSaveConfig = () => {
    saveGoogleSheetsConfig(config);
    setTestResult({
      success: true,
      message: 'Configurações do Google Sheets salvas com sucesso neste navegador!',
    });
    setTimeout(() => setTestResult(null), 4000);
  };

  const handleCopyScript = async () => {
    const success = await copyToClipboard(GOOGLE_APPS_SCRIPT_TEMPLATE);
    if (success) {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 3000);
    }
  };

  const handleTestWebhook = async () => {
    if (!config.webhookUrl || !config.webhookUrl.startsWith('http')) {
      setTestResult({
        success: false,
        message: 'Por favor, insira uma URL válida do Google Apps Script (iniciando com https://script.google.com/macros/s/...)',
      });
      return;
    }

    setTestingPing(true);
    setTestResult(null);

    try {
      const res = await testWebhookLiveStatus(config.webhookUrl);
      setTestResult({
        success: res.online,
        isWarning: res.online && !res.isVersion3,
        message: res.message,
      });
    } catch {
      setTestResult({
        success: false,
        message: 'Não foi possível testar a conexão com o Google Apps Script.',
      });
    } finally {
      setTestingPing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Banner de Instruções */}
      <div className="bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-2xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--borda-sutil)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--sucesso)]/15 text-[var(--sucesso)] flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[var(--texto-primario)]">
                Integração &amp; Estrutura de Banco de Dados — Google Sheets
              </h2>
              <p className="text-xs text-[var(--texto-secundario)]">
                Sincronização relacional em tempo real de pedidos aprovados e tabelas base de custos
              </p>
            </div>
          </div>

          <a
            href="https://sheets.new"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-elevado)] hover:bg-[var(--bg-superficie)] text-[var(--texto-primario)] text-xs font-semibold rounded-lg border border-[var(--borda-sutil)] hover:border-[var(--borda-hover)] transition-all duration-200 ease-out"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Abrir Nova Planilha no Google</span>
          </a>
        </div>

        {/* Configuração da URL do Webhook */}
        <div className="mt-6 p-4 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl space-y-3">
          <label className="block text-xs font-bold text-[var(--texto-secundario)] uppercase tracking-wider">
            URL do Webhook do Google Apps Script (App da Web)
          </label>
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--texto-mutado)]">
                <LinkIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={config.webhookUrl}
                onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                className="w-full pl-9 pr-3 py-2 bg-[var(--bg-fundo)] border border-[var(--borda-sutil)] rounded-xl text-xs text-[var(--texto-primario)] font-mono placeholder-[var(--texto-mutado)] focus:border-[var(--nitro-primaria)] focus:ring-1 focus:ring-[var(--nitro-primaria)] outline-none transition-colors"
              />
            </div>
            <button
              onClick={handleTestWebhook}
              disabled={testingPing}
              className="flex items-center gap-1.5 px-4 py-2 bg-[var(--bg-elevado)] hover:bg-[var(--bg-superficie)] text-[var(--texto-primario)] font-semibold text-xs rounded-xl border border-[var(--borda-sutil)] hover:border-[var(--borda-hover)] transition-all duration-200 ease-out cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingPing ? 'animate-spin' : ''}`} />
              <span>Testar Conexão</span>
            </button>
            <button
              onClick={handleSaveConfig}
              className="px-4 py-2 bg-[var(--nitro-primaria)] hover:bg-[var(--nitro-primaria-hover)] text-white font-bold text-xs rounded-xl shadow-md transition-all duration-200 ease-out cursor-pointer whitespace-nowrap"
            >
              Salvar URL
            </button>
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
                !testResult.success
                  ? 'bg-rose-50 border-rose-300 text-rose-900'
                  : testResult.isWarning
                  ? 'bg-amber-50 border-amber-300 text-amber-950'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-950'
              }`}
            >
              <Server className="w-4 h-4 shrink-0" />
              <span>{testResult.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* Estrutura das Abas Exigidas (Pai e Filho + Cadastros) */}
      <div className="bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center gap-2">
          <Table className="w-5 h-5 text-[var(--nitro-primaria)]" />
          <h3 className="text-sm font-bold text-[var(--texto-primario)] uppercase tracking-wider">
            Abas e Cabeçalhos de Colunas Padrão v3.0/v3.1
          </h3>
        </div>
        <p className="text-xs text-[var(--texto-secundario)]">
          A planilha {GOOGLE_SHEETS_SCHEMA.spreadsheetTitle} utiliza as seguintes {GOOGLE_SHEETS_SCHEMA.tabs.length} abas. Tanto o painel Google Drive quanto o Apps Script v3.1 criam e realinham essas colunas automaticamente por nome de cabeçalho:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {GOOGLE_SHEETS_SCHEMA.tabs.map((tab, idx) => (
            <div
              key={idx}
              className="bg-[var(--bg-elevado)] border border-[var(--borda-sutil)] hover:border-[var(--borda-hover)] rounded-xl p-4 space-y-2.5 transition-colors"
            >
              <div className="flex items-center justify-between border-b border-[var(--borda-sutil)] pb-2">
                <span className="text-xs font-bold text-[var(--nitro-primaria)] font-mono">
                  Aba: {tab.name}
                </span>
                <span className="text-[10px] bg-[var(--bg-input)] text-[var(--texto-secundario)] px-2 py-0.5 rounded-md border border-[var(--borda-sutil)] font-mono tabular-nums">
                  {tab.columns.length} colunas
                </span>
              </div>
              <p className="text-[11px] text-[var(--texto-secundario)]">{tab.description}</p>
              <div className="p-2.5 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-lg">
                <span className="text-[10px] text-[var(--texto-mutado)] block mb-1 uppercase font-semibold">
                  Cabeçalhos (Linha 1):
                </span>
                <div className="flex flex-wrap gap-1">
                  {tab.columns.map((col, cIdx) => (
                    <span
                      key={cIdx}
                      className="text-[10px] bg-[var(--bg-elevado)] text-[var(--texto-primario)] px-1.5 py-0.5 rounded border border-[var(--borda-sutil)] font-mono"
                    >
                      {col}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Código Pronto do Google Apps Script */}
      <div className="bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--borda-sutil)] pb-3">
          <div>
            <h3 className="text-sm font-bold text-[var(--texto-primario)] uppercase tracking-wider">
              Código Pronto do Google Apps Script (Code.gs v3.1)
            </h3>
            <p className="text-xs text-[var(--texto-secundario)]">
              Cole este código em Extensões &gt; Apps Script da sua planilha e implante como Nova Versão no App da Web.
            </p>
          </div>
          <button
            onClick={handleCopyScript}
            className={`flex items-center gap-1.5 px-4 py-2 font-bold text-xs rounded-xl shadow-md transition-all duration-200 ease-out cursor-pointer ${
              copiedScript
                ? 'bg-emerald-600 text-white'
                : 'bg-[var(--nitro-primaria)] hover:bg-[var(--nitro-primaria-hover)] text-white'
            }`}
          >
            {copiedScript ? (
              <>
                <Check className="w-4 h-4" />
                <span>Código v3.1 Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar Código Apps Script v3.1</span>
              </>
            )}
          </button>
        </div>

        <div className="relative">
          <pre className="p-4 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-xs text-slate-800 font-mono overflow-x-auto max-h-72 leading-relaxed">
            {GOOGLE_APPS_SCRIPT_TEMPLATE}
          </pre>
        </div>
      </div>
    </div>
  );
};
