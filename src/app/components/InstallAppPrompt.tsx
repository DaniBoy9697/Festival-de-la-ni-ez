import { useEffect, useState } from 'react';
import { X, Share } from 'lucide-react';
import { FESTIVAL_LOGO_URL } from '@/constants/event';

const STORAGE_KEY = 'festival-install-prompt-dismissed';

type BeforeInstallPromptEventExtended = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const mq = window.matchMedia?.('(display-mode: standalone)');
  if (mq?.matches) return true;
  return Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
}

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !(window as Window & { MSStream?: unknown }).MSStream;
}

export default function InstallAppPrompt() {
  const [open, setOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEventExtended | null>(null);

  useEffect(() => {
    if (isStandalone()) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEventExtended);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    if (isStandalone()) return;
    try {
      if (localStorage.getItem(STORAGE_KEY) === '1') return;
    } catch {
      /* ignore */
    }
    const t = window.setTimeout(() => setOpen(true), 1400);
    return () => window.clearTimeout(t);
  }, []);

  const dismiss = () => {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  const handleNativeInstall = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } catch {
      /* ignore */
    }
    setDeferredPrompt(null);
    dismiss();
  };

  if (!open) return null;

  const ios = isIos();
  const showChromeInstall = Boolean(deferredPrompt) && !ios;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-5 bg-black/45 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-app-title"
    >
      <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl border border-gray-100 overflow-hidden relative">
        <button
          type="button"
          onClick={dismiss}
          className="absolute top-3 right-3 z-10 p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="px-6 pb-8 pt-14">
          <div className="flex justify-center mb-5">
            <div className="rounded-2xl overflow-hidden shadow-lg ring-2 ring-[#EBB205]/25 bg-white">
              <img
                src={FESTIVAL_LOGO_URL}
                alt="Festival de la Niñez 2026"
                width={88}
                height={88}
                className="w-[88px] h-[88px] object-cover"
                decoding="async"
              />
            </div>
          </div>

          <h2 id="install-app-title" className="text-center text-lg font-bold text-gray-900 tracking-tight">
            Instalar Festival de la Niñez 2026 <span className="inline-block" aria-hidden>🚀</span>
          </h2>

          <p className="text-center text-sm text-gray-600 mt-3 leading-relaxed">
            Agrega esta app a tu pantalla de inicio para tener fácil acceso a la misma y una mejor experiencia.
          </p>

          <hr className="my-6 border-gray-200" />

          {ios ? (
            <p className="text-sm text-gray-800 text-center leading-relaxed flex flex-wrap items-center justify-center gap-2">
              <span>Presiona</span>
              <span className="inline-flex items-center justify-center rounded-lg bg-[#EBB205]/15 p-2 text-[#b8860b] ring-1 ring-[#EBB205]/30">
                <Share className="w-5 h-5" aria-hidden />
              </span>
              <span>
                y luego <strong className="font-semibold">«Agregar a la pantalla de inicio»</strong>.
              </span>
            </p>
          ) : (
            <div className="space-y-4">
              {showChromeInstall && (
                <button
                  type="button"
                  onClick={handleNativeInstall}
                  className="w-full py-3.5 rounded-2xl font-semibold text-white bg-[#EBB205] hover:bg-[#d4a004] shadow-md transition-colors"
                >
                  Instalar app
                </button>
              )}
              <p className="text-sm text-gray-700 text-center leading-relaxed">
                También puedes usar el menú del navegador{' '}
                <span className="inline-block px-1 rounded bg-gray-100 font-medium">⋮</span> y elegir{' '}
                <strong className="font-semibold">Instalar app</strong> o{' '}
                <strong className="font-semibold">Añadir a la pantalla de inicio</strong>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
