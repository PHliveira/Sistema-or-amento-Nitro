'use client';

import React, { useState } from 'react';
import { CalculatedQuoteTotals, Quote } from '../lib/types';
import { formatBRL, formatDateBR } from '../lib/format';
import {
  getProxiedImageUrl,
  isNonImageVectorExtension,
  normalizeExternalImageUrl,
} from '../lib/image-url';
import { Printer, X, Loader2, FileDown, ImageOff, AlertTriangle } from 'lucide-react';

interface PDFModalProps {
  quote: Quote;
  totals: CalculatedQuoteTotals;
  isOpen: boolean;
  onClose: () => void;
}

const ResilientMockupImage: React.FC<{
  rawUrl: string;
  alt: string;
  hideOnError?: boolean;
  label?: string;
}> = ({ rawUrl, alt, hideOnError = false, label }) => {
  const [stage, setStage] = useState<'proxy' | 'direct' | 'error'>('proxy');

  const src =
    stage === 'proxy' ? getProxiedImageUrl(rawUrl) : normalizeExternalImageUrl(rawUrl);

  if (stage === 'error') {
    if (hideOnError) return null;
    return (
      <div
        style={{
          border: '1px solid #cbd5e1',
          borderRadius: '6px',
          padding: '10px 8px 14px 8px',
          backgroundColor: '#f8fafc',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '150px',
          gap: '6px',
          breakInside: 'avoid',
          pageBreakInside: 'avoid',
        }}
      >
        <ImageOff className="w-5 h-5" style={{ color: '#94a3b8' }} />
        <span style={{ fontSize: '10px', lineHeight: '1.35', color: '#475569', fontWeight: 600 }}>
          Foto indisponível para exibição direta
        </span>
        {label && (
          <span
            style={{
              fontSize: '10px',
              lineHeight: '1.35',
              color: '#334155',
              fontWeight: 700,
              display: 'block',
              paddingTop: '2px',
              paddingBottom: '4px',
              wordBreak: 'break-word',
              maxWidth: '100%',
            }}
          >
            {label}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        padding: '8px 8px 14px 8px',
        backgroundColor: '#ffffff',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        minHeight: '150px',
        breakInside: 'avoid',
        pageBreakInside: 'avoid',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '104px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px',
          marginBottom: '8px',
          backgroundColor: '#f1f5f9',
          overflow: 'hidden',
          padding: '4px',
          flexShrink: 0,
        }}
      >
        <img
          key={src}
          src={src}
          data-raw-url={rawUrl}
          alt={alt}
          referrerPolicy="no-referrer"
          onError={() => setStage((prev) => (prev === 'proxy' ? 'direct' : 'error'))}
          style={{
            maxWidth: '100%',
            maxHeight: '96px',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      </div>
      {label && (
        <span
          style={{
            fontSize: '10px',
            lineHeight: '1.35',
            color: '#334155',
            fontWeight: 600,
            display: 'block',
            paddingTop: '2px',
            paddingBottom: '4px',
            wordBreak: 'break-word',
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
};

export const PDFModal: React.FC<PDFModalProps> = ({ quote, totals, isOpen, onClose }) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [printNotice, setPrintNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const waitForSheetImages = async (container: HTMLElement) => {
    const imgs = Array.from(container.querySelectorAll('img'));
    await Promise.all(
      imgs.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise<void>((resolve) => {
          const timer = setTimeout(resolve, 2500);
          img.addEventListener(
            'load',
            () => {
              clearTimeout(timer);
              resolve();
            },
            { once: true }
          );
          img.addEventListener(
            'error',
            () => {
              clearTimeout(timer);
              resolve();
            },
            { once: true }
          );
        });
      })
    );
  };

  const blobToDataUrl = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string' && reader.result.startsWith('data:image/')) {
          resolve(reader.result);
        } else {
          reject(new Error('Falha ao converter blob em Data URL.'));
        }
      };
      reader.onerror = () => reject(new Error('Erro no FileReader.'));
      reader.readAsDataURL(blob);
    });

  const preloadDataUrl = (dataUrl: string): Promise<void> =>
    new Promise((resolve) => {
      const probe = new Image();
      probe.onload = () => resolve();
      probe.onerror = () => resolve();
      probe.src = dataUrl;
    });

  /**
   * Converte temporariamente todas as imagens da folha (logotipo local + links do Google Drive/externos)
   * em Data URL (Base64) apenas em memória no momento da captura do PDF, eliminando 100% do bloqueio CORS.
   */
  const resolveSheetImagesToDataUrls = async (
    container: HTMLElement
  ): Promise<Array<string | null>> => {
    const imgs = Array.from(container.querySelectorAll('img'));
    let driveToken: string | null = null;
    try {
      const oauthMod = await import('../lib/google-drive-oauth');
      driveToken = oauthMod.getDriveAccessToken();
    } catch {
      driveToken = null;
    }

    const cache = new Map<string, string | null>();

    return Promise.all(
      imgs.map(async (img) => {
        const currentSrc = (img.getAttribute('src') || img.src || '').trim();
        const rawUrl = (img.getAttribute('data-raw-url') || currentSrc).trim();
        const cacheKey = `${rawUrl}::${currentSrc}`;

        if (cache.has(cacheKey)) {
          return cache.get(cacheKey) ?? null;
        }

        if (currentSrc.startsWith('data:image/')) {
          cache.set(cacheKey, currentSrc);
          return currentSrc;
        }

        let resolved: string | null = null;

        // 1. Links externos (ex: drive.google.com, dropbox, etc.) -> proxy server-side retorna Data URL Base64
        if (/^https?:\/\//i.test(rawUrl)) {
          try {
            const res = await fetch('/api/image-proxy', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                url: rawUrl,
                accessToken: driveToken || undefined,
                format: 'dataurl',
              }),
            });
            if (res.ok) {
              const json = (await res.json()) as { dataUrl?: string };
              if (json.dataUrl && json.dataUrl.startsWith('data:image/')) {
                await preloadDataUrl(json.dataUrl);
                resolved = json.dataUrl;
              }
            }
          } catch {
            // tenta fallback via src same-origin abaixo
          }
        }

        // 2. Recursos locais (/assets/...) ou /api/image-proxy?... já em same-origin
        if (!resolved && (currentSrc.startsWith('/') || currentSrc.startsWith(window.location.origin))) {
          try {
            const res = await fetch(currentSrc);
            if (res.ok) {
              const blob = await res.blob();
              if (blob.size > 0) {
                const dataUrl = await blobToDataUrl(blob);
                await preloadDataUrl(dataUrl);
                resolved = dataUrl;
              }
            }
          } catch {
            // ignora e tenta fallback canvas
          }
        }

        // 3. Fallback: se a imagem visível já está carregada sem taint no browser
        if (!resolved && img.complete && img.naturalWidth > 0) {
          try {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = img.naturalWidth;
            tempCanvas.height = img.naturalHeight;
            const ctx = tempCanvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              const dataUrl = tempCanvas.toDataURL('image/png');
              if (dataUrl.startsWith('data:image/')) {
                resolved = dataUrl;
              }
            }
          } catch {
            resolved = null;
          }
        }

        cache.set(cacheKey, resolved);
        return resolved;
      })
    );
  };

  // 1. Download direto do arquivo PDF (.pdf) formatado com alta resolução (html2canvas + jsPDF)
  const handleDownloadPdf = async (autoOpenPrintNotice?: string) => {
    const printElement = document.getElementById('printable-quote-sheet');
    if (!printElement) return;

    setIsGeneratingPdf(true);
    try {
      await waitForSheetImages(printElement);
      const [resolvedDataUrls, { default: html2canvas }, { jsPDF }] = await Promise.all([
        resolveSheetImagesToDataUrls(printElement),
        import('html2canvas'),
        import('jspdf'),
      ]);

      const canvas = await html2canvas(printElement, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 1024,
        onclone: (clonedDoc, clonedElement) => {
          // Injeta as imagens convertidas para Base64 Data URL exclusivamente no clone do PDF
          const clonedImgs = Array.from(clonedElement.querySelectorAll('img'));
          clonedImgs.forEach((clonedImg, idx) => {
            const dataUrl = resolvedDataUrls[idx];
            if (dataUrl) {
              clonedImg.removeAttribute('crossorigin');
              clonedImg.removeAttribute('referrerpolicy');
              clonedImg.src = dataUrl;
            } else {
              const placeholder = clonedDoc.createElement('div');
              placeholder.textContent = 'Imagem externa indisponível no PDF';
              placeholder.style.fontSize = '10px';
              placeholder.style.color = '#64748b';
              placeholder.style.fontWeight = '600';
              placeholder.style.padding = '8px';
              placeholder.style.textAlign = 'center';
              clonedImg.replaceWith(placeholder);
            }
          });

          const backdrop = clonedDoc.querySelector('.pdf-print-backdrop') as HTMLElement | null;
          if (backdrop) {
            backdrop.style.position = 'static';
            backdrop.style.background = '#ffffff';
            backdrop.style.padding = '0';
            backdrop.style.overflow = 'visible';
          }
          const dialog = clonedDoc.querySelector('.pdf-print-dialog') as HTMLElement | null;
          if (dialog) {
            dialog.style.maxWidth = 'none';
            dialog.style.maxHeight = 'none';
            dialog.style.overflow = 'visible';
            dialog.style.border = 'none';
            dialog.style.boxShadow = 'none';
            dialog.style.background = '#ffffff';
          }
          const scrollArea = clonedDoc.querySelector('.pdf-print-scroll') as HTMLElement | null;
          if (scrollArea) {
            scrollArea.style.overflow = 'visible';
            scrollArea.style.padding = '0';
            scrollArea.style.background = '#ffffff';
          }

          clonedElement.style.width = '794px';
          clonedElement.style.maxWidth = '794px';
          clonedElement.style.minWidth = '794px';
          clonedElement.style.margin = '0';
          clonedElement.style.padding = '32px';
          clonedElement.style.backgroundColor = '#ffffff';
          clonedElement.style.color = '#0f172a';
          clonedElement.style.boxShadow = 'none';
          clonedElement.style.border = 'none';
          clonedElement.style.borderRadius = '0';

          const styleTag = clonedDoc.createElement('style');
          styleTag.innerHTML = `
            * { box-sizing: border-box !important; }
            html, body { background: #ffffff !important; margin: 0 !important; padding: 0 !important; }
            #printable-quote-sheet {
              width: 794px !important;
              min-width: 794px !important;
              max-width: 794px !important;
              background-color: #ffffff !important;
              color: #0f172a !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
            }
            #printable-quote-sheet .pdf-header-row {
              display: flex !important;
              flex-direction: row !important;
              flex-wrap: nowrap !important;
              justify-content: space-between !important;
              align-items: flex-start !important;
              gap: 16px !important;
            }
            #printable-quote-sheet .pdf-logo-img {
              max-height: 56px !important;
              max-width: 180px !important;
              width: auto !important;
              height: auto !important;
              object-fit: contain !important;
              display: block !important;
            }
            #printable-quote-sheet .pdf-client-grid {
              display: grid !important;
              grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
              gap: 12px !important;
            }
            #printable-quote-sheet .pdf-col-span-full {
              grid-column: 1 / -1 !important;
            }
            #printable-quote-sheet .pdf-mockups-grid {
              display: grid !important;
              grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
              gap: 10px !important;
            }
            #printable-quote-sheet .pdf-terms-grid {
              display: grid !important;
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
              gap: 8px !important;
            }
            #printable-quote-sheet .pdf-table-wrap {
              overflow: visible !important;
              margin-left: 0 !important;
              margin-right: 0 !important;
              padding-left: 0 !important;
              padding-right: 0 !important;
            }
            #printable-quote-sheet .pdf-table {
              width: 100% !important;
              min-width: 0 !important;
            }
            #printable-quote-sheet .pdf-footer-row {
              display: flex !important;
              flex-direction: row !important;
              flex-wrap: nowrap !important;
              justify-content: space-between !important;
              align-items: center !important;
              gap: 16px !important;
            }
          `;
          clonedDoc.head.appendChild(styleTag);
        },
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 8;
      const printWidth = pageWidth - margin * 2;
      const printHeight = (canvas.height * printWidth) / canvas.width;

      let heightLeft = printHeight;
      let position = margin;

      pdf.addImage(imgData, 'JPEG', margin, position, printWidth, printHeight, undefined, 'FAST');
      heightLeft -= pageHeight - margin * 2;

      while (heightLeft > 1) {
        position = heightLeft - printHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', margin, position, printWidth, printHeight, undefined, 'FAST');
        heightLeft -= pageHeight - margin * 2;
      }

      const safeNumber = (quote.quoteNumber || 'Proposta').replace(/[^a-zA-Z0-9_-]/g, '_');
      pdf.save(`Orcamento_${safeNumber}.pdf`);
      if (autoOpenPrintNotice) {
        setPrintNotice(autoOpenPrintNotice);
      }
    } catch (error) {
      console.error('Erro ao gerar arquivo PDF formatado:', error);
      setPrintNotice('Não foi possível gerar o PDF automaticamente. Tente novamente.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // 2. Impressão nativa síncrona (preserva o gesto do usuário no navegador + fallback automático se iframe bloquear)
  const handlePrint = () => {
    setPrintNotice(null);
    setIsPrinting(true);

    let beforePrintFired = false;
    const onBeforePrint = () => {
      beforePrintFired = true;
    };
    window.addEventListener('beforeprint', onBeforePrint, { once: true });

    try {
      window.print();
    } catch (err) {
      console.error('Erro na impressão nativa:', err);
    }

    setTimeout(() => {
      window.removeEventListener('beforeprint', onBeforePrint);
      setIsPrinting(false);
      if (!beforePrintFired) {
        void handleDownloadPdf(
          'A janela embutida bloqueou a caixa nativa de impressão; geramos o arquivo .PDF automaticamente para você abrir e imprimir!'
        );
      }
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto pdf-print-backdrop">
      {/* Container Principal do Modal */}
      <div className="relative w-full max-w-4xl bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-2xl overflow-hidden shadow-2xl my-auto flex flex-col max-h-[94vh] pdf-print-dialog">
        {/* Barra superior de Ações Responsiva (Oculta na impressão) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 bg-[var(--bg-elevado)] border-b border-[var(--borda-sutil)] no-print shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--nitro-primaria)] shrink-0"></span>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold text-[var(--texto-primario)] uppercase tracking-wider block truncate">
                Proposta Comercial (PDF &amp; Impressão)
              </span>
              <span className="text-[11px] text-[var(--texto-mutado)] hidden sm:block">
                Visualização formatada para papel A4 e envio ao cliente
              </span>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 justify-end">
            {/* Botão Principal: Baixar Arquivo PDF Formatado */}
            <button
              type="button"
              onClick={() => handleDownloadPdf()}
              disabled={isGeneratingPdf}
              title="Gera e faz o download direto do arquivo .PDF formatado para seu computador"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[var(--nitro-primaria)] hover:bg-[var(--nitro-primaria-hover)] text-white font-bold text-xs rounded-xl shadow-md transition-all duration-200 ease-out cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gerando PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>Baixar em PDF</span>
                </>
              )}
            </button>

            {/* Botão Secundário: Imprimir no Navegador */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting || isGeneratingPdf}
              title="Abre a tela de impressão do navegador ou baixa o PDF caso o iframe bloqueie"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[var(--bg-superficie)] hover:bg-[var(--borda-hover)] text-[var(--texto-primario)] border border-[var(--borda-sutil)] font-semibold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-60"
            >
              {isPrinting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--nitro-primaria)]" />
                  <span>Imprimindo...</span>
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4 text-[var(--nitro-primaria)]" />
                  <span>Imprimir</span>
                </>
              )}
            </button>

            {/* Botão Fechar */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-[var(--texto-secundario)] hover:text-[var(--texto-primario)] hover:bg-[var(--borda-hover)] rounded-xl transition-colors duration-150 cursor-pointer ml-1"
              aria-label="Fechar visualização"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {printNotice && (
          <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-300 text-amber-950 text-xs flex items-center justify-between gap-2 no-print shrink-0">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>{printNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setPrintNotice(null)}
              className="p-1 rounded hover:bg-amber-200/60 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Folha A4 Comercial Branca em largura desktop fixa (794px) para idêntica fidelidade entre preview, impressão e PDF */}
        <div className="p-3 sm:p-6 md:p-8 overflow-y-auto overflow-x-auto bg-[var(--bg-fundo)] flex-1 pdf-print-scroll">
          <div
            id="printable-quote-sheet"
            style={{
              width: '794px',
              minWidth: '794px',
              maxWidth: '794px',
              margin: '0 auto',
              padding: '32px',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              lineHeight: 1.45,
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.16)',
            }}
            className="print-card"
          >
            {/* Cabeçalho da Proposta */}
            <div
              className="pdf-header-row"
              style={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'nowrap',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '16px',
                borderBottom: '2px solid #0f172a',
                paddingBottom: '20px',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  flexWrap: 'nowrap',
                  alignItems: 'center',
                  gap: '12px',
                  minWidth: 0,
                  flex: '1 1 auto',
                }}
              >
                <img
                  src="/assets/aistudio/nitro_logo_b66efb2c.png"
                  alt="Nitro Camisetas & Uniformes"
                  referrerPolicy="no-referrer"
                  className="pdf-logo-img"
                  style={{
                    maxHeight: '56px',
                    maxWidth: '180px',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain',
                    display: 'block',
                    flexShrink: 0,
                  }}
                />
                <div style={{ borderLeft: '2px solid #e2e8f0', paddingLeft: '12px', minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#1e293b',
                      textTransform: 'uppercase',
                      margin: 0,
                    }}
                  >
                    Confecção Têxtil Especializada
                  </p>
                  <p
                    style={{
                      fontSize: '11px',
                      color: '#64748b',
                      fontWeight: 500,
                      margin: '2px 0 0 0',
                    }}
                  >
                    Estamparia de Alta Performance & Uniformes Corporativos
                  </p>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  textAlign: 'right',
                  flexShrink: 0,
                  minWidth: '195px',
                }}
              >
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Proposta Comercial
                </div>
                <div
                  style={{
                    fontSize: '17px',
                    fontWeight: 900,
                    color: '#0f172a',
                    fontFamily: 'monospace',
                    margin: '2px 0',
                  }}
                >
                  {quote.quoteNumber}
                </div>
                <div style={{ fontSize: '11px', color: '#475569' }}>
                  Data: {formatDateBR(quote.createdAt)}
                </div>
                <div style={{ fontSize: '11px', color: '#475569' }}>
                  Validade: {quote.validityDays} dias{' '}
                  {quote.validityDate ? `(até ${formatDateBR(quote.validityDate)})` : ''}
                </div>
              </div>
            </div>

            {/* Dados do Cliente */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '14px 16px',
                marginBottom: '20px',
                breakInside: 'avoid',
                pageBreakInside: 'avoid',
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>Dados do Solicitante</span>
                <span
                  style={{
                    backgroundColor: '#e2e8f0',
                    color: '#334155',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '9px',
                    fontWeight: 800,
                  }}
                >
                  {quote.clientType === 'PJ' ? 'PESSOA JURÍDICA (PJ)' : 'PESSOA FÍSICA (PF)'}
                </span>
              </div>
              <div
                className="pdf-client-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                  gap: '12px',
                  fontSize: '12px',
                }}
              >
                {quote.clientType === 'PJ' ? (
                  <>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Razão Social / Empresa:</span>
                      <span style={{ color: '#0f172a', fontWeight: 'bold' }}>{quote.clientCompany || quote.clientName || 'Não informada'}</span>
                    </div>
                    {quote.clientDocument && (
                      <div>
                        <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>CNPJ:</span>
                        <span style={{ color: '#0f172a', fontWeight: 'bold', fontFamily: 'monospace' }}>{quote.clientDocument}</span>
                      </div>
                    )}
                    {quote.clientName && quote.clientCompany && (
                      <div>
                        <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Contato / Responsável:</span>
                        <span style={{ color: '#0f172a', fontWeight: 'bold' }}>{quote.clientName}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Cliente:</span>
                      <span style={{ color: '#0f172a', fontWeight: 'bold' }}>{quote.clientName || 'Cliente'}</span>
                    </div>
                    {quote.clientDocument && (
                      <div>
                        <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>CPF:</span>
                        <span style={{ color: '#0f172a', fontWeight: 'bold', fontFamily: 'monospace' }}>{quote.clientDocument}</span>
                      </div>
                    )}
                  </>
                )}
                <div>
                  <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Telefone / WhatsApp:</span>
                  <span style={{ color: '#0f172a', fontWeight: 'bold' }}>{quote.clientPhone || 'Não informado'}</span>
                </div>
                {quote.clientEmail && (
                  <div>
                    <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>E-mail:</span>
                    <span style={{ color: '#0f172a', fontWeight: 'bold', wordBreak: 'break-word' }}>{quote.clientEmail}</span>
                  </div>
                )}
                <div>
                  <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Vendedor Responsável:</span>
                  <span style={{ color: '#0f172a', fontWeight: 'bold' }}>{quote.sellerName || 'Comercial Nitro'}</span>
                </div>
                {quote.deliveryAddress &&
                  (quote.deliveryAddress.street ||
                    quote.deliveryAddress.city ||
                    quote.deliveryAddress.cep) && (
                    <div
                      className="pdf-col-span-full"
                      style={{
                        gridColumn: '1 / -1',
                        borderTop: '1px solid #e2e8f0',
                        paddingTop: '8px',
                        marginTop: '2px',
                      }}
                    >
                      <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Endereço de Entrega:</span>
                      <span style={{ color: '#0f172a', fontWeight: 600 }}>
                        {[
                          quote.deliveryAddress.street
                            ? `${quote.deliveryAddress.street}${quote.deliveryAddress.number ? `, ${quote.deliveryAddress.number}` : ''}`
                            : '',
                          quote.deliveryAddress.complement || '',
                          quote.deliveryAddress.neighborhood || '',
                          quote.deliveryAddress.city
                            ? `${quote.deliveryAddress.city}${quote.deliveryAddress.state ? ` / ${quote.deliveryAddress.state}` : ''}`
                            : '',
                          quote.deliveryAddress.cep ? `CEP: ${quote.deliveryAddress.cep}` : '',
                        ]
                          .filter(Boolean)
                          .join(' — ')}
                      </span>
                    </div>
                  )}
              </div>
            </div>

            {/* Tabela de Itens Formatada */}
            <div className="pdf-table-wrap" style={{ marginBottom: '20px' }}>
              <table
                className="pdf-table"
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '11px',
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: '2px solid #0f172a',
                      backgroundColor: '#f1f5f9',
                      color: '#1e293b',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    <th style={{ padding: '8px 6px', textAlign: 'left' }}>Item / Descrição</th>
                    <th style={{ padding: '8px 6px', textAlign: 'left' }}>Estamparia / Personalização</th>
                    <th style={{ padding: '8px 6px', textAlign: 'center' }}>Grade de Tamanhos</th>
                    <th style={{ padding: '8px 6px', textAlign: 'center' }}>Qtd</th>
                    <th style={{ padding: '8px 6px', textAlign: 'right' }}>Unitário</th>
                    <th style={{ padding: '8px 6px', textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.items.map((item, index) => {
                    const itemCalc = totals.itemsCalculated[item.id];
                    const qty = itemCalc ? itemCalc.totalQuantity : 0;
                    const unitPrice = itemCalc ? itemCalc.unitSellingPrice : 0;
                    const totalPrice = itemCalc ? itemCalc.totalSellingPrice : 0;

                    // Formatação da estamparia
                    const printLines: string[] = [];
                    if (item.printing.silk.enabled) {
                      const posStr = item.printing.silk.positions
                        .map((p) => `${p.position} (${p.colorsCount} cores)`)
                        .join(', ');
                      printLines.push(`Silk: ${posStr}`);
                    }
                    if (item.printing.dtf.enabled) {
                      const posStr = item.printing.dtf.positions
                        .map((p) => `${p.label} (${p.widthCm}x${p.heightCm}cm)`)
                        .join(', ');
                      printLines.push(`DTF: ${posStr}`);
                    }
                    if (item.printing.sublimation.enabled) {
                      printLines.push(`Sublimação: ${item.printing.sublimation.mode.replace('_', ' ')}`);
                    }
                    if (item.printing.vinyl.enabled) {
                      printLines.push(
                        `Vinil: ${item.printing.vinyl.widthCm}x${item.printing.vinyl.heightCm}cm`
                      );
                    }
                    if (printLines.length === 0) {
                      printLines.push('Peça lisa (Sem estampa)');
                    }

                    // Formatação da grade
                    const sizesList: string[] = [];
                    if (item.sizes.pp) sizesList.push(`PP:${item.sizes.pp}`);
                    if (item.sizes.p) sizesList.push(`P:${item.sizes.p}`);
                    if (item.sizes.m) sizesList.push(`M:${item.sizes.m}`);
                    if (item.sizes.g) sizesList.push(`G:${item.sizes.g}`);
                    if (item.sizes.gg) sizesList.push(`GG:${item.sizes.gg}`);
                    if (item.sizes.exg) sizesList.push(`EXG:${item.sizes.exg}`);
                    if (item.sizes.g1) sizesList.push(`G1:${item.sizes.g1}`);
                    if (item.sizes.g2) sizesList.push(`G2:${item.sizes.g2}`);

                    const childSizes: string[] = [];
                    if (item.sizes.tam02) childSizes.push(`02:${item.sizes.tam02}`);
                    if (item.sizes.tam04) childSizes.push(`04:${item.sizes.tam04}`);
                    if (item.sizes.tam06) childSizes.push(`06:${item.sizes.tam06}`);
                    if (item.sizes.tam08) childSizes.push(`08:${item.sizes.tam08}`);
                    if (item.sizes.tam10) childSizes.push(`10:${item.sizes.tam10}`);
                    if (item.sizes.tam12) childSizes.push(`12:${item.sizes.tam12}`);
                    if (item.sizes.tam14) childSizes.push(`14:${item.sizes.tam14}`);
                    if (item.sizes.tam16) childSizes.push(`16:${item.sizes.tam16}`);

                    return (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: '1px solid #e2e8f0',
                          verticalAlign: 'top',
                        }}
                      >
                        <td style={{ padding: '9px 6px' }}>
                          <span style={{ fontWeight: 700, color: '#0f172a', display: 'block' }}>
                            #{index + 1} - {item.title}
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: '#004da8', display: 'block' }}>
                            Modelagem: {item.fitType || 'Unissex'} · Manga: {item.sleeveType || 'Manga Curta'}
                          </span>
                          {item.color && (
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#334155', display: 'block' }}>
                              Cor: {item.color}
                            </span>
                          )}
                          {item.notes && (
                            <span style={{ fontSize: '10px', color: '#64748b', fontStyle: 'italic', display: 'block', marginTop: '2px' }}>
                              {item.notes}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '9px 6px', color: '#334155' }}>
                          {printLines.map((line, lIdx) => (
                            <span key={lIdx} style={{ display: 'block', fontSize: '11px', marginBottom: '1px' }}>
                              • {line}
                            </span>
                          ))}
                        </td>
                        <td style={{ padding: '9px 6px', textAlign: 'center', color: '#475569', fontFamily: 'monospace' }}>
                          {sizesList.length > 0 && <div>{sizesList.join(' | ')}</div>}
                          {childSizes.length > 0 && (
                            <div style={{ fontSize: '10px', color: '#64748b' }}>
                              Inf: {childSizes.join(' | ')}
                            </div>
                          )}
                          {sizesList.length === 0 && childSizes.length === 0 && 'A definir'}
                        </td>
                        <td style={{ padding: '9px 6px', textAlign: 'center', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                          {qty}
                        </td>
                        <td style={{ padding: '9px 6px', textAlign: 'right', fontWeight: 500, color: '#334155', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                          {formatBRL(unitPrice)}
                        </td>
                        <td style={{ padding: '9px 6px', textAlign: 'right', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                          {formatBRL(totalPrice)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mockups Aprovados, Links de Arte Final e Referências */}
            {quote.items.some(
              (i) =>
                Boolean(i.approvedMockupUrl) ||
                Boolean(i.finalArtUrl) ||
                (i.mockupImages && i.mockupImages.length > 0)
            ) && (
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '14px',
                  marginBottom: '20px',
                }}
              >
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '8px',
                  }}
                >
                  Mockups Aprovados & Links de Produção
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                  {quote.items.map((item, iIdx) => {
                    if (!item.approvedMockupUrl && !item.finalArtUrl) return null;
                    return (
                      <div
                        key={`links-${item.id}`}
                        style={{
                          fontSize: '11px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          padding: '8px 10px',
                          breakInside: 'avoid',
                          pageBreakInside: 'avoid',
                        }}
                      >
                        <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '2px' }}>
                          Item #{iIdx + 1} — {item.title}
                        </div>
                        {item.approvedMockupUrl && (
                          <div style={{ color: '#334155', wordBreak: 'break-all' }}>
                            <strong>Mockup Aprovado:</strong> {item.approvedMockupUrl}
                          </div>
                        )}
                        {item.finalArtUrl && (
                          <div style={{ color: '#334155', wordBreak: 'break-all' }}>
                            <strong>Arte Final:</strong> {item.finalArtUrl}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {quote.items.some(
                  (i) =>
                    Boolean(i.approvedMockupUrl) ||
                    (Boolean(i.finalArtUrl) && !isNonImageVectorExtension(i.finalArtUrl)) ||
                    (i.mockupImages && i.mockupImages.length > 0)
                ) && (
                  <div
                    className="pdf-mockups-grid"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                      gap: '10px',
                    }}
                  >
                    {quote.items.map((item, iIdx) => {
                      const cards: React.ReactNode[] = [];
                      if (item.approvedMockupUrl && item.approvedMockupUrl.trim()) {
                        cards.push(
                          <ResilientMockupImage
                            key={`${iIdx}-approved`}
                            rawUrl={item.approvedMockupUrl.trim()}
                            alt={`Mockup Item ${iIdx + 1}`}
                            label={`Mockup #${iIdx + 1} (${item.title})`}
                          />
                        );
                      }
                      if (
                        item.finalArtUrl &&
                        item.finalArtUrl.trim() &&
                        item.finalArtUrl.trim() !== (item.approvedMockupUrl || '').trim() &&
                        !isNonImageVectorExtension(item.finalArtUrl)
                      ) {
                        cards.push(
                          <ResilientMockupImage
                            key={`${iIdx}-art`}
                            rawUrl={item.finalArtUrl.trim()}
                            alt={`Arte Final Item ${iIdx + 1}`}
                            label={`Arte #${iIdx + 1} (${item.title})`}
                            hideOnError={true}
                          />
                        );
                      }
                      (item.mockupImages || []).forEach((mockupUrl, mIdx) => {
                        cards.push(
                          <ResilientMockupImage
                            key={`${iIdx}-legacy-${mIdx}`}
                            rawUrl={mockupUrl}
                            alt={`Referência Item ${iIdx + 1}`}
                            label={`Item #${iIdx + 1} (${item.title})`}
                          />
                        );
                      });
                      return cards;
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Totalizadores Gerais Formatados com Subtotal e Frete */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginBottom: '20px',
                breakInside: 'avoid',
                pageBreakInside: 'avoid',
              }}
            >
              <div
                style={{
                  width: '320px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '14px 16px',
                  fontSize: '11px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', marginBottom: '6px' }}>
                  <span>Total de Peças:</span>
                  <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#0f172a' }}>
                    {totals.totalQuantity} un.
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', marginBottom: '6px' }}>
                  <span>Subtotal Produtos:</span>
                  <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#0f172a' }}>
                    {formatBRL(totals.totalProductsSellingPrice || totals.totalSellingPrice)}
                  </span>
                </div>
                {totals.artCreationCost > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', marginBottom: '6px' }}>
                    <span>Criação de Arte & Mockup:</span>
                    <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#7c3aed' }}>
                      {formatBRL(totals.artCreationCost)}
                    </span>
                  </div>
                )}
                {quote.shipping && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', marginBottom: '6px' }}>
                    <span>Frete ({quote.shipping.name}):</span>
                    <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#0f172a' }}>
                      {quote.shipping.type === 'frete_gratis' ||
                      quote.shipping.type === 'retirada' ||
                      totals.shippingCost === 0
                        ? 'Grátis'
                        : formatBRL(totals.shippingCost)}
                    </span>
                  </div>
                )}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid #cbd5e1',
                    paddingTop: '8px',
                    marginTop: '8px',
                  }}
                >
                  <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '13px' }}>Valor Total da Proposta:</span>
                  <span style={{ color: '#ff8300', fontFamily: 'monospace', fontSize: '16px', fontWeight: 900 }}>
                    {formatBRL(totals.totalSellingPrice)}
                  </span>
                </div>
              </div>
            </div>

            {/* Condições Comerciais & Envio */}
            <div
              style={{
                borderTop: '1px solid #e2e8f0',
                paddingTop: '16px',
                fontSize: '11px',
                color: '#475569',
                breakInside: 'avoid',
                pageBreakInside: 'avoid',
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#1e293b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '8px',
                }}
              >
                Condições Comerciais & Envio
              </div>
              <div
                className="pdf-terms-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: '8px',
                  fontSize: '12px',
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>Pagamento:</span>{' '}
                  {quote.paymentTerms}
                </div>
                <div>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>Prazo de Produção:</span>{' '}
                  {quote.deliveryLeadTimeCustom || `${quote.deliveryLeadTimeDays} dias úteis após aprovação de layout e sinal.`}
                </div>
                {quote.shipping && (
                  <div>
                    <span style={{ fontWeight: 600, color: '#1e293b' }}>Forma de Envio:</span>{' '}
                    {quote.shipping.name} ({quote.shipping.deliveryTime})
                    {quote.shipping.cidadeUf ? ` · Trajeto: ${quote.shipping.cidadeUfOrigem || 'São Paulo / SP'} ➔ ${quote.shipping.cidadeUf}` : ''}
                  </div>
                )}
                {quote.shipping?.carrierName && (
                  <div>
                    <span style={{ fontWeight: 600, color: '#1e293b' }}>Transportadora/Rastreio:</span>{' '}
                    {quote.shipping.carrierName}
                  </div>
                )}
              </div>
              {quote.notes && (
                <div style={{ fontSize: '11px', paddingTop: '6px' }}>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>Observações:</span> {quote.notes}
                </div>
              )}
            </div>

            {/* Rodapé e Assinatura */}
            <div
              className="pdf-footer-row"
              style={{
                marginTop: '24px',
                paddingTop: '16px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'nowrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
                fontSize: '10px',
                color: '#64748b',
                breakInside: 'avoid',
                pageBreakInside: 'avoid',
              }}
            >
              <div>
                Nitro Camisetas e Uniformes · Sistema de Orçamentos
              </div>
              <div style={{ textAlign: 'right', fontWeight: 500, whiteSpace: 'nowrap' }}>
                Aprovação do Cliente: __________________________________
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
