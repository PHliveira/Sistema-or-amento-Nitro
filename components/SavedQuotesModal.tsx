'use client';

import React, { useState } from 'react';
import { Quote } from '../lib/types';
import { formatDateBR } from '../lib/format';
import {
  Download,
  ExternalLink,
  History,
  Search,
  Trash2,
  Clock,
  Layers,
} from 'lucide-react';

interface SavedQuotesModalProps {
  quotes: Quote[];
  onLoadQuote: (quote: Quote) => void;
  onDeleteQuote: (id: string) => void;
}

export const SavedQuotesModal: React.FC<SavedQuotesModalProps> = ({
  quotes,
  onLoadQuote,
  onDeleteQuote,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredQuotes = quotes.filter(
    (q) =>
      q.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.clientCompany && q.clientCompany.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleExportCSV = () => {
    if (quotes.length === 0) return;

    const headers = [
      'Data',
      'Numero_Orcamento',
      'Cliente',
      'Empresa',
      'Telefone',
      'Itens_Qtd',
      'Status',
    ];
    const rows = quotes.map((q) => [
      new Date(q.createdAt).toLocaleDateString('pt-BR'),
      q.quoteNumber,
      `"${q.clientName.replace(/"/g, '""')}"`,
      `"${(q.clientCompany || '').replace(/"/g, '""')}"`,
      q.clientPhone,
      q.items.length,
      q.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pedidos_nitro_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-2xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--borda-sutil)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--nitro-primaria)]/15 text-[var(--nitro-primaria)] flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[var(--texto-primario)]">
                Histórico de Pedidos & Orçamentos Salvos
              </h2>
              <p className="text-xs text-[var(--texto-secundario)]">
                {quotes.length} pedido(s) registrado(s) no banco local com sincronização para Google Sheets
              </p>
            </div>
          </div>

          {quotes.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--nitro-azul)] hover:bg-[var(--nitro-azul-hover)] text-white text-xs font-semibold rounded-lg shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Planilha CSV</span>
            </button>
          )}
        </div>

        {/* Barra de Pesquisa */}
        <div className="mt-4 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--texto-mutado)]">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Buscar por cliente, empresa ou número do orçamento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-xs sm:text-sm text-[var(--texto-primario)] placeholder-[var(--texto-mutado)] focus:border-[var(--nitro-primaria)] focus:ring-1 focus:ring-[var(--nitro-primaria)] outline-none transition-colors"
          />
        </div>
      </div>

      {/* Lista de Pedidos */}
      {filteredQuotes.length === 0 ? (
        <div className="bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-2xl p-12 text-center space-y-3 shadow-xl">
          <Layers className="w-10 h-10 text-[var(--texto-mutado)] mx-auto opacity-40" />
          <h3 className="text-sm font-bold text-[var(--texto-primario)]">Nenhum pedido encontrado</h3>
          <p className="text-xs text-[var(--texto-secundario)] max-w-sm mx-auto">
            {searchTerm
              ? 'Nenhum resultado corresponde à sua pesquisa.'
              : 'Clique em "Salvar Pedido (Sheets)" no orçador para registrar os pedidos aprovados.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredQuotes.map((q) => {
            const totalItemsCount = q.items.length;
            const formattedDate = formatDateBR(q.createdAt);

            return (
              <div
                key={q.id}
                className="bg-[var(--bg-superficie)] hover:bg-[var(--bg-elevado)] border border-[var(--borda-sutil)] hover:border-[var(--borda-hover)] rounded-2xl p-4 sm:p-5 transition-all duration-200 ease-out flex flex-wrap items-center justify-between gap-4 shadow-md"
              >
                <div className="flex-1 min-w-[240px] space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[var(--nitro-primaria)] bg-[var(--nitro-primaria)]/10 px-2 py-0.5 rounded border border-[var(--nitro-primaria)]/20">
                      {q.quoteNumber}
                    </span>
                    <span className="text-xs text-[var(--texto-secundario)] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formattedDate}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        q.status === 'Aprovado'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-[var(--bg-input)] text-[var(--texto-secundario)] border border-[var(--borda-sutil)]'
                      }`}
                    >
                      {q.status}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-[var(--texto-primario)] pt-1">
                    {q.clientName}
                    {q.clientCompany && (
                      <span className="text-[var(--texto-secundario)] font-normal"> · {q.clientCompany}</span>
                    )}
                  </h4>

                  <p className="text-xs text-[var(--texto-secundario)]">
                    {totalItemsCount} {totalItemsCount === 1 ? 'produto' : 'produtos'}:{' '}
                    {q.items.map((i) => i.title).join(', ')}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onLoadQuote(q)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[var(--nitro-primaria)] hover:bg-[var(--nitro-primaria-hover)] text-white text-xs font-bold rounded-xl shadow-md transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir no Orçador</span>
                  </button>

                  <button
                    onClick={() => onDeleteQuote(q.id)}
                    className="p-2 text-[var(--texto-mutado)] hover:text-[var(--nitro-vermelho)] hover:bg-[var(--nitro-vermelho-bg)] rounded-xl transition-colors cursor-pointer"
                    title="Excluir do histórico"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
