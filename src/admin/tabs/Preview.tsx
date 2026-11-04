import React, { useState, useRef, useEffect } from 'react';
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  RotateCw, 
  ExternalLink, 
  ShieldCheck, 
  Wifi, 
  Battery, 
  Signal, 
  Lock,
  Sparkles,
  Maximize2
} from 'lucide-react';
import { Button, Card, Badge, cn } from '../ui';

type DeviceMode = 'desktop' | 'mobile' | 'tablet';

export function PreviewTab() {
  const [device, setDevice] = useState<DeviceMode>('mobile');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Determina a URL da loja baseada no host atual (porta 3000)
  const storeUrl = typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:3000`
    : 'http://localhost:3000';

  const handleRefresh = () => {
    setIsRefreshing(true);
    setIframeKey((prev) => prev + 1);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Escuta eventos de atualização da loja (quando o admin altera algo)
  useEffect(() => {
    const handleStoreChange = () => {
      setIframeKey((prev) => prev + 1);
    };
    window.addEventListener('aura:store:change', handleStoreChange);
    return () => window.removeEventListener('aura:store:change', handleStoreChange);
  }, []);

  return (
    <div className="space-y-4">
      {/* Barra de Controle Superior */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card-bg)] p-3 sm:p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 text-rose-400 border border-rose-500/30">
            <Monitor className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-[var(--admin-text-main)]">
                Preview ao Vivo da Loja
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                100% Sincronizado
              </span>
            </div>
            <p className="text-xs text-[var(--admin-text-muted)]">
              Visualização idêntica à do lead em tempo real com todas as alterações do catálogo e estoque
            </p>
          </div>
        </div>

        {/* Controles de Dispositivo & Ações */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Seletor de Dispositivo */}
          <div className="flex items-center rounded-xl border border-[var(--admin-border)] bg-[var(--admin-input-bg)] p-1">
            <button
              type="button"
              onClick={() => setDevice('mobile')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                device === 'mobile'
                  ? 'bg-rose-500 text-white shadow-xs font-semibold'
                  : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)]'
              )}
              title="Visão Mobile (Smartphones 390px)"
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>Celular</span>
            </button>
            <button
              type="button"
              onClick={() => setDevice('tablet')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                device === 'tablet'
                  ? 'bg-rose-500 text-white shadow-xs font-semibold'
                  : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)]'
              )}
              title="Visão Tablet (768px)"
            >
              <Tablet className="h-3.5 w-3.5" />
              <span>Tablet</span>
            </button>
            <button
              type="button"
              onClick={() => setDevice('desktop')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                device === 'desktop'
                  ? 'bg-rose-500 text-white shadow-xs font-semibold'
                  : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)]'
              )}
              title="Visão Computador (100% Desktop)"
            >
              <Monitor className="h-3.5 w-3.5" />
              <span>Computador</span>
            </button>
          </div>

          {/* Botão de Atualizar */}
          <Button
            size="sm"
            variant="outline"
            icon={<RotateCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin text-rose-400')} />}
            onClick={handleRefresh}
            title="Recarregar tela do preview"
          >
            Atualizar
          </Button>

          {/* Abrir em Nova Aba */}
          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-input-bg)] px-3 py-1.5 text-xs font-medium text-[var(--admin-text-main)] hover:bg-[var(--admin-item-hover)] transition-colors shadow-2xs"
            title="Abrir a loja diretamente em uma nova aba do navegador"
          >
            <ExternalLink className="h-3.5 w-3.5 text-rose-400" />
            <span className="hidden sm:inline">Abrir Loja</span>
          </a>
        </div>
      </div>

      {/* Área Central de Visualização */}
      <div className="flex justify-center items-start min-h-[750px] p-2 sm:p-6 rounded-2xl bg-gradient-to-b from-[#0a0a0e] to-[#121218] border border-[var(--admin-border)] overflow-x-auto shadow-inner">
        {device === 'mobile' && (
          /* MOCKUP DE CELULAR REALISTA (iPhone Style 390x844) */
          <div className="flex flex-col items-center">
            <div className="relative w-[390px] h-[820px] rounded-[48px] bg-[#1a1a24] p-3 shadow-2xl border-4 border-stone-800 ring-1 ring-white/10 flex flex-col">
              {/* Ilha Dinâmica / Alto Falante */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-30 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-stone-900 ring-1 ring-stone-800 ml-auto mr-3" />
              </div>

              {/* Barra de Status do Celular */}
              <div className="h-9 px-6 pt-1 flex items-center justify-between text-stone-300 text-[11px] font-semibold select-none z-20">
                <span>9:41</span>
                <div className="flex items-center gap-1.5">
                  <Signal className="h-3 w-3" />
                  <Wifi className="h-3 w-3" />
                  <Battery className="h-3.5 w-3.5" />
                </div>
              </div>

              {/* Tela do Celular (Iframe) */}
              <div className="relative flex-1 w-full rounded-[36px] overflow-hidden bg-white shadow-inner">
                <iframe
                  key={iframeKey}
                  ref={iframeRef}
                  src={storeUrl}
                  title="Preview da Loja Mobile"
                  className="w-full h-full border-0 select-auto"
                />
              </div>

              {/* Barra de Home Inferior */}
              <div className="h-4 flex items-center justify-center pt-1">
                <div className="w-32 h-1 bg-stone-600 rounded-full" />
              </div>
            </div>
            <p className="mt-3 text-[11px] text-stone-500 font-mono">
              Simulação Mobile Realista · 390 × 820 px · Touch & Gestos ativos
            </p>
          </div>
        )}

        {device === 'tablet' && (
          /* MOCKUP DE TABLET (768px) */
          <div className="flex flex-col items-center w-full max-w-[768px]">
            <div className="w-full h-[850px] rounded-[36px] bg-[#1a1a24] p-3.5 shadow-2xl border-4 border-stone-800 ring-1 ring-white/10 flex flex-col">
              <div className="h-5 flex items-center justify-center mb-1">
                <div className="w-2 h-2 rounded-full bg-stone-700" />
              </div>
              <div className="relative flex-1 w-full rounded-[24px] overflow-hidden bg-white shadow-inner">
                <iframe
                  key={iframeKey}
                  ref={iframeRef}
                  src={storeUrl}
                  title="Preview da Loja Tablet"
                  className="w-full h-full border-0"
                />
              </div>
            </div>
            <p className="mt-3 text-[11px] text-stone-500 font-mono">
              Simulação Tablet · 768 × 850 px
            </p>
          </div>
        )}

        {device === 'desktop' && (
          /* MOCKUP DE COMPUTADOR / BROWSER WINDOW (100% Largura) */
          <div className="flex flex-col w-full">
            <div className="w-full h-[850px] rounded-2xl bg-[#1c1c24] border border-[var(--admin-border)] shadow-2xl flex flex-col overflow-hidden">
              {/* Barra de Janela do Navegador */}
              <div className="h-10 px-4 bg-[#14141c] border-b border-white/5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>

                {/* Barra de URL com SSL Lock */}
                <div className="flex-1 max-w-lg h-7 rounded-lg bg-black/40 border border-white/10 px-3 flex items-center gap-2 text-xs text-stone-300 font-mono">
                  <Lock className="h-3 w-3 text-emerald-400" />
                  <span className="truncate">{storeUrl}</span>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-stone-400 font-medium">
                  <span className="hidden sm:inline">Desktop View</span>
                  <Maximize2 className="h-3.5 w-3.5" />
                </div>
              </div>

              {/* Conteúdo Desktop (Iframe) */}
              <div className="relative flex-1 w-full bg-white">
                <iframe
                  key={iframeKey}
                  ref={iframeRef}
                  src={storeUrl}
                  title="Preview da Loja Computador"
                  className="w-full h-full border-0"
                />
              </div>
            </div>
            <p className="mt-3 text-[11px] text-stone-500 text-center font-mono">
              Simulação Desktop Computador · Resolução Dinâmica 100% Real
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
