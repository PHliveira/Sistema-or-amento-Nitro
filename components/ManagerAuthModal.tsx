'use client';

import React, { useState } from 'react';
import { ShieldCheck, Lock, User, Eye, EyeOff, AlertTriangle, KeyRound, Check, X } from 'lucide-react';

interface ManagerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const STORAGE_KEY_AUTH = 'nitro_manager_auth_session_v1';
const STORAGE_KEY_CUSTOM_PASS = 'nitro_manager_custom_password_v1';

export function isManagerSessionActive(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const session = localStorage.getItem(STORAGE_KEY_AUTH);
    return session === 'authenticated';
  } catch {
    return false;
  }
}

export function clearManagerSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY_AUTH);
  } catch {}
}

export const ManagerAuthModal: React.FC<ManagerAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successAnimation, setSuccessAnimation] = useState(false);

  // Modo de alteração de senha
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePassFeedback, setChangePassFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const getSavedCustomPassword = (): string | null => {
    try {
      return localStorage.getItem(STORAGE_KEY_CUSTOM_PASS);
    } catch {
      return null;
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    const customPass = getSavedCustomPassword();

    // Validação de Usuário
    const validUsers = ['admin', 'gerente', 'nitro', 'gestor'];
    const isUserValid = validUsers.includes(cleanUser);

    // Validação de Senha: aceita senha customizada OU senhas padrão de fábrica
    const validDefaultPasswords = ['gerente2026', 'nitro', 'admin123', 'admin', 'nitro2026'];
    const isPassValid = customPass
      ? cleanPass === customPass || validDefaultPasswords.includes(cleanPass)
      : validDefaultPasswords.includes(cleanPass);

    if (isUserValid && isPassValid) {
      if (rememberSession) {
        try {
          localStorage.setItem(STORAGE_KEY_AUTH, 'authenticated');
          localStorage.setItem('nitro_manager_username', cleanUser);
        } catch {}
      }
      setSuccessAnimation(true);
      setTimeout(() => {
        setSuccessAnimation(false);
        setPassword('');
        setErrorMessage(null);
        onSuccess();
        onClose();
      }, 500);
    } else {
      setErrorMessage('Usuário ou senha incorretos. Utilize as credenciais de fábrica ou sua senha customizada.');
    }
  };

  const handleSaveNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setChangePassFeedback(null);

    if (newPassword.length < 4) {
      setChangePassFeedback('A nova senha deve ter no mínimo 4 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangePassFeedback('A confirmação de senha não confere.');
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY_CUSTOM_PASS, newPassword);
      setChangePassFeedback('Senha alterada com sucesso! Use a nova senha no login.');
      setIsChangingPassword(false);
      setPassword(newPassword);
    } catch {
      setChangePassFeedback('Erro ao gravar senha no armazenamento local.');
    }
  };

  const handleFillDemoCredentials = () => {
    setUsername('admin');
    setPassword('gerente2026');
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-2xl shadow-2xl overflow-hidden transition-all duration-200">
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between px-5 py-4 bg-[var(--bg-elevado)] border-b border-[var(--borda-sutil)]">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-[var(--nitro-primaria)]/20 text-[var(--nitro-primaria)] border border-[var(--nitro-primaria)]/40">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-[var(--texto-primario)]">
                Acesso ao Modo Gerente
              </h2>
              <p className="text-[11px] text-[var(--texto-secundario)]">
                Controle de Custos Brutos, Margens e Precificação
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[var(--texto-secundario)] hover:text-[var(--texto-primario)] hover:bg-[var(--borda-hover)] rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Formulário */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Card informativo de segurança */}
          <div className="p-3 bg-[var(--nitro-azul)]/10 border border-[var(--nitro-azul)]/30 rounded-xl text-xs text-[var(--texto-secundario)] space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[var(--nitro-azul)]">
              <Lock className="w-3.5 h-3.5" />
              <span>Área Restrita da Gerência</span>
            </div>
            <p className="text-[11px] text-[var(--texto-primario)] leading-relaxed">
              O Modo Gerente exibe custos de fiação, margem de perda no corte, custo das matrizes de silk e lucro líquido da empresa. Insira suas credenciais para prosseguir.
            </p>
          </div>

          {/* Dica / Credenciais de Acesso de Fábrica */}
          <div className="p-2.5 bg-[var(--bg-elevado)] border border-[var(--borda-sutil)] rounded-xl flex items-center justify-between gap-2 text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-[var(--texto-mutado)] block">
                Credenciais Padrão Nitro:
              </span>
              <span className="font-mono font-bold text-[var(--nitro-primaria)] text-[11px]">
                Usuário: <span className="underline">admin</span> · Senha: <span className="underline">gerente2026</span>
              </span>
            </div>
            <button
              type="button"
              onClick={handleFillDemoCredentials}
              className="px-2 py-1 bg-[var(--nitro-primaria)]/15 hover:bg-[var(--nitro-primaria)]/25 text-[var(--nitro-primaria)] text-[10px] font-bold rounded-lg border border-[var(--nitro-primaria)]/30 transition-colors cursor-pointer"
            >
              Preencher
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 bg-[var(--perigo-bg)] border border-[var(--perigo)]/40 rounded-xl text-xs text-[var(--perigo)] flex items-start gap-2 animate-in fade-in duration-150">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!isChangingPassword ? (
            <form onSubmit={handleLogin} className="space-y-3.5">
              {/* Usuário */}
              <div>
                <label className="block text-xs font-semibold text-[var(--texto-secundario)] mb-1">
                  Usuário de Acesso
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--texto-mutado)]">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ex: admin ou gerente"
                    className="w-full pl-9 pr-3 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-xs font-semibold text-[var(--texto-primario)] focus:border-[var(--nitro-primaria)] focus:ring-1 focus:ring-[var(--nitro-primaria)] outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Senha */}
              <div>
                <label className="block text-xs font-semibold text-[var(--texto-secundario)] mb-1">
                  Senha do Gerente
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--texto-mutado)]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha..."
                    className="w-full pl-9 pr-10 py-2 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-xs font-semibold text-[var(--texto-primario)] focus:border-[var(--nitro-primaria)] focus:ring-1 focus:ring-[var(--nitro-primaria)] outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--texto-mutado)] hover:text-[var(--texto-primario)] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Lembrar Sessão */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-[var(--texto-secundario)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberSession}
                    onChange={(e) => setRememberSession(e.target.checked)}
                    className="rounded border-[var(--borda-sutil)] text-[var(--nitro-primaria)] focus:ring-[var(--nitro-primaria)]"
                  />
                  <span>Lembrar sessão neste navegador</span>
                </label>

                <button
                  type="button"
                  onClick={() => setIsChangingPassword(true)}
                  className="text-[11px] text-[var(--nitro-azul)] hover:underline cursor-pointer"
                >
                  Alterar senha
                </button>
              </div>

              {/* Ações */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-[var(--bg-elevado)] hover:bg-[var(--borda-hover)] text-xs font-semibold text-[var(--texto-secundario)] hover:text-[var(--texto-primario)] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={successAnimation}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[var(--nitro-primaria)] hover:bg-[var(--nitro-primaria-hover)] text-white text-xs font-bold shadow-md shadow-[var(--nitro-primaria)]/20 transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:opacity-50"
                >
                  {successAnimation ? (
                    <>
                      <Check className="w-4 h-4 animate-bounce" />
                      <span>Acesso Concedido!</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Entrar no Modo Gerente</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Formulário para Alterar Senha */
            <form onSubmit={handleSaveNewPassword} className="space-y-3 pt-1 border-t border-[var(--borda-sutil)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--texto-primario)] flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[var(--nitro-primaria)]" />
                  Definir Nova Senha do Gerente
                </span>
                <button
                  type="button"
                  onClick={() => setIsChangingPassword(false)}
                  className="text-[11px] text-[var(--texto-mutado)] hover:underline"
                >
                  Voltar ao login
                </button>
              </div>

              {changePassFeedback && (
                <div className="p-2.5 bg-[var(--bg-input)] rounded-lg text-[11px] text-[var(--texto-primario)] border border-[var(--borda-sutil)]">
                  {changePassFeedback}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-[var(--texto-secundario)] mb-1">
                  Nova Senha (Mínimo 4 caracteres)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nova senha..."
                  className="w-full px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-xs text-[var(--texto-primario)] focus:border-[var(--nitro-primaria)] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--texto-secundario)] mb-1">
                  Confirmar Nova Senha
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha..."
                  className="w-full px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--borda-sutil)] rounded-xl text-xs text-[var(--texto-primario)] focus:border-[var(--nitro-primaria)] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsChangingPassword(false)}
                  className="px-3 py-1.5 rounded-lg bg-[var(--bg-elevado)] text-xs text-[var(--texto-secundario)]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[var(--nitro-azul)] hover:bg-[var(--nitro-azul-hover)] text-white text-xs font-bold shadow transition-colors"
                >
                  Salvar Nova Senha
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
