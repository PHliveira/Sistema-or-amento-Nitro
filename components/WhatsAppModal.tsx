'use client';

import React, { useState } from 'react';
import { CalculatedQuoteTotals, Quote } from '../lib/types';
import { copyToClipboard, formatQuoteForWhatsApp } from '../lib/whatsapp-formatter';
import { Check, Copy, ExternalLink, MessageSquare, X } from 'lucide-react';

interface WhatsAppModalProps {
  quote: Quote;
  totals: CalculatedQuoteTotals;
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  quote,
  totals,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const formattedText = formatQuoteForWhatsApp(quote, totals);

  const cleanPhone = (quote.clientPhone || '').replace(/\D/g, '');
  const whatsAppUrl = `https://wa.me/${cleanPhone.length >= 10 ? (cleanPhone.startsWith('55') ? cleanPhone : '55' + cleanPhone) : ''}?text=${encodeURIComponent(formattedText)}`;

  const handleCopy = async () => {
    const success = await copyToClipboard(formattedText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-2xl overflow-hidden shadow-2xl transition-colors duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[var(--bg-elevado)] border-b border-[var(--borda-sutil)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#25d366]/20 text-[#25d366] flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--texto-primario)]">
                Copiar Orçamento Formatado para WhatsApp
              </h2>
              <p className="text-xs text-[var(--texto-secundario)]">
                Texto com negritos, quebras e emojis pronto para envio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--texto-secundario)] hover:text-[var(--texto-primario)] hover:bg-[var(--borda-hover)] rounded-lg transition-colors duration-150 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pré-visualização do texto */}
        <div className="p-6 space-y-4">
          <div className="relative">
            <textarea
              readOnly
              rows={12}
              value={formattedText}
              className="w-full p-4 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-xs sm:text-sm text-[var(--texto-primario)] font-mono leading-relaxed resize-none focus:outline-none"
            />
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            {cleanPhone.length >= 10 && (
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[var(--bg-elevado)] hover:bg-[var(--borda-hover)] text-[var(--texto-primario)] text-xs font-semibold rounded-xl border border-[var(--borda-sutil)] transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shadow-sm"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Abrir direto no WhatsApp</span>
              </a>
            )}

            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 px-5 py-2.5 font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 cursor-pointer ${
                copied
                  ? 'bg-[var(--sucesso)] text-slate-950'
                  : 'bg-[#25d366] hover:bg-[#20ba5a] text-slate-950 shadow-[#25d366]/25'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copiado com Sucesso!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar para Área de Transferência</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
