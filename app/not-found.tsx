import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-fundo)] text-[var(--texto-primario)] p-4">
      <div className="max-w-md w-full bg-[var(--bg-superficie)] border border-[var(--borda-sutil)] rounded-2xl p-8 text-center space-y-4 shadow-2xl">
        <span className="text-4xl font-black text-[var(--nitro-primaria)]">404</span>
        <h2 className="text-lg font-bold text-[var(--texto-primario)]">Página Não Encontrada</h2>
        <p className="text-xs text-[var(--texto-secundario)]">
          O recurso ou página solicitada não existe ou foi movida.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-4 py-2 bg-[var(--nitro-primaria)] hover:bg-[var(--nitro-primaria-hover)] text-white text-xs font-bold rounded-xl transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shadow-lg"
        >
          Voltar ao Início
        </Link>
      </div>
    </div>
  );
}
