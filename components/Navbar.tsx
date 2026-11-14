'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ViewMode } from '../lib/types';
import {
  ShieldAlert,
  UserCheck,
  Plus,
  FileSpreadsheet,
  History,
  Calculator,
  Menu,
  X,
  Lock,
  LogOut,
  Settings,
} from 'lucide-react';
import { useIsMounted } from '../hooks/use-mounted';
import { ManagerAuthModal, isManagerSessionActive, clearManagerSession } from './ManagerAuthModal';

interface NavbarProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  activeTab: 'calculator' | 'history' | 'settings';
  setActiveTab: (tab: 'calculator' | 'history' | 'settings') => void;
  onNewQuote: () => void;
  onOpenSettings?: () => void;
  savedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  viewMode,
  setViewMode,
  activeTab,
  setActiveTab,
  onNewQuote,
  savedCount,
}) => {
  const mounted = useIsMounted();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleTabSelect = (tab: 'calculator' | 'history' | 'settings') => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const handleNewQuoteClick = () => {
    onNewQuote();
    setMobileMenuOpen(false);
  };

  const handleToggleMode = () => {
    if (viewMode === 'manager') {
      // Alterna suavemente para modo vendedor (sem deslogar a sessão se quiser voltar)
      setViewMode('seller');
    } else {
      // Para entrar no Modo Gerente, exige autenticação com usuário e senha
      if (isManagerSessionActive()) {
        setViewMode('manager');
      } else {
        setIsAuthModalOpen(true);
      }
    }
  };

  const handleManagerLogout = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearManagerSession();
    setViewMode('seller');
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[var(--bg-superficie)]/95 backdrop-blur border-b border-[var(--borda-sutil)] px-3 sm:px-4 md:px-8 py-2.5 sm:py-3.5 no-print transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4 md:gap-8">
        {/* Zone 1: Official Brand Logo with Auto Dark/Light theme switching */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="relative h-9 sm:h-11 w-32 sm:w-44 flex items-center">
            {/* Logotipo Oficial Nitro (Modo Claro com preto e laranja) */}
            <Image
              src="/assets/aistudio/nitro_logo_b66efb2c.png"
              alt="Nitro Camisetas e Uniformes"
              width={220}
              height={84}
              className="object-contain w-full h-full block"
              priority
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="hidden xl:flex flex-col">
            <span className="text-[10px] text-[var(--texto-secundario)] font-semibold tracking-wider uppercase">
              Orçamentos & Custos
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Desktop - md+) */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => handleTabSelect('calculator')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer ${
              activeTab === 'calculator'
                ? 'bg-[var(--nitro-primaria)]/10 text-[var(--nitro-primaria)] border border-[var(--nitro-primaria)]/40 shadow-sm'
                : 'text-[var(--texto-secundario)] hover:text-[var(--texto-primario)] hover:bg-[var(--bg-elevado)]'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Orçador</span>
          </button>

          <button
            onClick={() => handleTabSelect('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer ${
              activeTab === 'history'
                ? 'bg-[var(--nitro-primaria)]/10 text-[var(--nitro-primaria)] border border-[var(--nitro-primaria)]/40 shadow-sm'
                : 'text-[var(--texto-secundario)] hover:text-[var(--texto-primario)] hover:bg-[var(--bg-elevado)]'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Pedidos</span>
            {savedCount > 0 && (
              <span className="text-[10px] bg-[var(--nitro-primaria)]/20 text-[var(--nitro-primaria)] px-1.5 py-0.2 rounded-full font-bold ml-0.5">
                {savedCount}
              </span>
            )}
          </button>

          {/* Botão de Configurações: ESTRITAMENTE OCULTO para vendedores, acessível apenas para gerente autenticado */}
          {viewMode === 'manager' && (
            <button
              onClick={() => handleTabSelect('settings')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-[var(--nitro-primaria)]/15 text-[var(--nitro-primaria)] border border-[var(--nitro-primaria)]/60 shadow-sm'
                  : 'text-[var(--texto-secundario)] hover:text-[var(--texto-primario)] hover:bg-[var(--bg-elevado)]'
              }`}
            >
              <Settings className="w-4 h-4 text-[var(--nitro-primaria)]" />
              <span>Configurações</span>
              <span className="text-[9px] bg-[var(--nitro-primaria)] text-white px-1.5 py-0.2 rounded-full font-bold ml-0.5">
                Admin
              </span>
            </button>
          )}
        </nav>

        {/* Zone 3: Actions & Switches (Desktop - md+) */}
        <div className="hidden md:flex items-center gap-2 md:gap-3 shrink-0">
          {/* Botão de Alternância de Modo (Gerente vs Vendedor) com Proteção por Senha */}
          <div className="flex items-center gap-1 bg-[var(--bg-elevado)] p-1 rounded-xl border border-[var(--borda-sutil)]">
            <button
              onClick={handleToggleMode}
              title={
                viewMode === 'manager'
                  ? 'Modo Gerente Ativo: clique para alternar para Modo Vendedor'
                  : 'Modo Vendedor Ativo: clique para entrar no Modo Gerente (exige senha)'
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shadow-sm ${
                viewMode === 'manager'
                  ? 'bg-[var(--nitro-primaria)]/15 border-[var(--nitro-primaria)]/60 text-[var(--nitro-primaria)] hover:bg-[var(--nitro-primaria)]/25'
                  : 'bg-[var(--sucesso-bg)] border-[var(--sucesso)]/50 text-[var(--sucesso)] hover:bg-[var(--sucesso)]/20'
              }`}
            >
              {viewMode === 'manager' ? (
                <>
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-[var(--nitro-primaria)]" />
                  <span>Modo Gerente</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-3.5 h-3.5 shrink-0 text-[var(--sucesso)]" />
                  <span>Modo Vendedor</span>
                </>
              )}
            </button>

            {/* Botão de Logout / Bloqueio quando no Modo Gerente */}
            {viewMode === 'manager' && (
              <button
                type="button"
                onClick={handleManagerLogout}
                title="Sair do Modo Gerente e Bloquear Acesso"
                className="p-1.5 rounded-lg bg-[var(--perigo-bg)] hover:bg-[var(--perigo)]/20 text-[var(--perigo)] border border-[var(--perigo)]/30 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Botão Novo Orçamento */}
          <button
            onClick={onNewQuote}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--nitro-primaria)] hover:bg-[var(--nitro-primaria-hover)] text-white text-xs md:text-sm font-bold rounded-lg shadow-md shadow-[var(--nitro-primaria)]/25 transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Orçamento</span>
          </button>
        </div>

        {/* Mobile Controls Right (< md) */}
        <div className="flex md:hidden items-center gap-1.5 sm:gap-2">
          {/* Quick Novo button on mobile */}
          <button
            onClick={onNewQuote}
            title="Criar Novo Orçamento"
            className="flex items-center gap-1 px-2.5 py-1.5 bg-[var(--nitro-primaria)] hover:bg-[var(--nitro-primaria-hover)] text-white text-xs font-bold rounded-lg shadow-sm transition-all duration-150 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Novo</span>
          </button>

          {/* Hamburger Menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
            className="p-2 rounded-lg bg-[var(--bg-elevado)] hover:bg-[var(--borda-hover)] border border-[var(--borda-sutil)] text-[var(--texto-primario)] transition-colors duration-150 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-[var(--perigo)]" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-[var(--borda-sutil)] space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Nav Tabs Mobile */}
          <div className={`grid gap-2 ${viewMode === 'manager' ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <button
              onClick={() => handleTabSelect('calculator')}
              className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer border ${
                activeTab === 'calculator'
                  ? 'bg-[var(--nitro-primaria)]/15 border-[var(--nitro-primaria)]/60 text-[var(--nitro-primaria)]'
                  : 'bg-[var(--bg-elevado)] border-[var(--borda-sutil)] text-[var(--texto-secundario)]'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>Orçador</span>
            </button>

            <button
              onClick={() => handleTabSelect('history')}
              className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer border relative ${
                activeTab === 'history'
                  ? 'bg-[var(--nitro-primaria)]/15 border-[var(--nitro-primaria)]/60 text-[var(--nitro-primaria)]'
                  : 'bg-[var(--bg-elevado)] border-[var(--borda-sutil)] text-[var(--texto-secundario)]'
              }`}
            >
              <History className="w-4 h-4" />
              <div className="flex items-center gap-1">
                <span>Pedidos</span>
                {savedCount > 0 && (
                  <span className="text-[10px] bg-[var(--nitro-primaria)] text-white px-1.5 rounded-full font-bold">
                    {savedCount}
                  </span>
                )}
              </div>
            </button>

            {/* Configurações apenas no Modo Gerente */}
            {viewMode === 'manager' && (
              <button
                onClick={() => handleTabSelect('settings')}
                className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer border ${
                  activeTab === 'settings'
                    ? 'bg-[var(--nitro-primaria)]/15 border-[var(--nitro-primaria)]/60 text-[var(--nitro-primaria)]'
                    : 'bg-[var(--bg-elevado)] border-[var(--borda-sutil)] text-[var(--texto-secundario)]'
                }`}
              >
                <Settings className="w-4 h-4 text-[var(--nitro-primaria)]" />
                <span>Config</span>
              </button>
            )}
          </div>

          {/* Mode Switcher Full-width Mobile */}
          <div className="flex items-center gap-1.5 w-full">
            <button
              onClick={() => {
                handleToggleMode();
                setMobileMenuOpen(false);
              }}
              className={`flex-1 flex items-center justify-between p-2.5 rounded-xl text-xs font-bold border transition-all duration-150 cursor-pointer shadow-sm ${
                viewMode === 'manager'
                  ? 'bg-[var(--nitro-primaria)]/15 border-[var(--nitro-primaria)]/50 text-[var(--nitro-primaria)]'
                  : 'bg-[var(--sucesso-bg)] border-[var(--sucesso)]/40 text-[var(--sucesso)]'
              }`}
            >
              <div className="flex items-center gap-2">
                {viewMode === 'manager' ? (
                  <ShieldAlert className="w-4 h-4 text-[var(--nitro-primaria)]" />
                ) : (
                  <UserCheck className="w-4 h-4 text-[var(--sucesso)]" />
                )}
                <span>
                  {viewMode === 'manager' ? 'Modo Gerente (Ativo)' : 'Modo Vendedor (Preços Finais)'}
                </span>
              </div>
              <span className="text-[11px] underline">
                {viewMode === 'manager' ? 'Vendedor' : 'Gerente'}
              </span>
            </button>

            {viewMode === 'manager' && (
              <button
                type="button"
                onClick={handleManagerLogout}
                title="Sair do Modo Gerente (Bloquear)"
                className="p-2.5 rounded-xl bg-[var(--perigo-bg)] hover:bg-[var(--perigo)]/20 text-[var(--perigo)] border border-[var(--perigo)]/30 flex items-center gap-1 text-xs font-bold transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden xs:inline">Sair</span>
              </button>
            )}
          </div>

          {/* New Quote Button Full-width Mobile */}
          <button
            onClick={handleNewQuoteClick}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[var(--nitro-primaria)] hover:bg-[var(--nitro-primaria-hover)] text-white text-xs font-bold rounded-xl shadow-md transition-all duration-150 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Novo Orçamento</span>
          </button>
        </div>
      )}

      {/* Modal de Autenticação com Usuário e Senha para o Modo Gerente */}
      <ManagerAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => setViewMode('manager')}
      />
    </header>
  );
};
