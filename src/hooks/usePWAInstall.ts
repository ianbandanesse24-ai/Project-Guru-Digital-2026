import { useState, useEffect, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export type DeviceType = 'android' | 'ios' | 'desktop' | 'tablet';

declare global {
  interface Window {
    __pwaDeferredPrompt?: BeforeInstallPromptEvent | null;
    __pwaIsInstalled?: boolean;
  }
}

export interface InstallResult {
  success: boolean;
  outcome?: 'accepted' | 'dismissed' | 'unsupported';
  error?: string;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    if (typeof window !== 'undefined' && window.__pwaDeferredPrompt) {
      return window.__pwaDeferredPrompt;
    }
    return null;
  });

  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      Boolean(window.__pwaIsInstalled) ||
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://')
    );
  });

  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isAndroid, setIsAndroid] = useState<boolean>(false);
  const [isTablet, setIsTablet] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect standalone mode (already installed as PWA)
    const checkStandalone = () => {
      const isStandalone =
        Boolean(window.__pwaIsInstalled) ||
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');
      setIsInstalled(isStandalone);
    };
    checkStandalone();

    // Detect user agent / device
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDev = /iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroidDev = /android/.test(ua);
    const isTabletDev = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(ua);

    setIsIOS(isIosDev);
    setIsAndroid(isAndroidDev);
    setIsTablet(isTabletDev);

    if (isTabletDev) {
      setDeviceType('tablet');
    } else if (isIosDev) {
      setDeviceType('ios');
    } else if (isAndroidDev) {
      setDeviceType('android');
    } else {
      setDeviceType('desktop');
    }

    if (window.__pwaDeferredPrompt && !deferredPrompt) {
      setDeferredPrompt(window.__pwaDeferredPrompt);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvt = e as BeforeInstallPromptEvent;
      window.__pwaDeferredPrompt = promptEvt;
      setDeferredPrompt(promptEvt);
    };

    const handlePromptReady = (e: Event) => {
      const customEvt = e as CustomEvent<BeforeInstallPromptEvent>;
      const promptObj = customEvt.detail || window.__pwaDeferredPrompt;
      if (promptObj) {
        setDeferredPrompt(promptObj);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      window.__pwaIsInstalled = true;
      window.__pwaDeferredPrompt = null;
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa_prompt_ready', handlePromptReady);
    window.addEventListener('agk_pwa_installable', checkStandalone);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('pwa_app_installed', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa_prompt_ready', handlePromptReady);
      window.removeEventListener('agk_pwa_installable', checkStandalone);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('pwa_app_installed', handleAppInstalled);
    };
  }, [deferredPrompt]);

  const install = useCallback(async (): Promise<InstallResult> => {
    if (typeof window === 'undefined') {
      return { success: false, outcome: 'unsupported' };
    }

    if (isInstalled || window.__pwaIsInstalled) {
      setIsInstalled(true);
      return { success: true, outcome: 'accepted' };
    }

    // 1. Dapatkan event prompt dari state lokal atau global window
    let promptEvent = deferredPrompt || window.__pwaDeferredPrompt;

    // 2. Jika prompt belum siap sesaat setelah klik, tunggu sebentar (maks 800ms)
    if (!promptEvent) {
      promptEvent = await new Promise<BeforeInstallPromptEvent | null>((resolve) => {
        let timer: any = null;
        const onReady = (e: Event) => {
          cleanup();
          const customEvt = e as CustomEvent<BeforeInstallPromptEvent>;
          resolve(customEvt.detail || window.__pwaDeferredPrompt || null);
        };
        const cleanup = () => {
          if (timer) clearTimeout(timer);
          window.removeEventListener('pwa_prompt_ready', onReady);
          window.removeEventListener('beforeinstallprompt', onReady);
        };
        timer = setTimeout(() => {
          cleanup();
          resolve(window.__pwaDeferredPrompt || null);
        }, 800);

        window.addEventListener('pwa_prompt_ready', onReady, { once: true });
        window.addEventListener('beforeinstallprompt', onReady, { once: true });
      });
    }

    // 3. Eksekusi prompt dialog browser secara langsung jika didukung
    if (promptEvent && typeof promptEvent.prompt === 'function') {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice && choice.outcome === 'accepted') {
          setIsInstalled(true);
          window.__pwaIsInstalled = true;
          window.__pwaDeferredPrompt = null;
          setDeferredPrompt(null);
          return { success: true, outcome: 'accepted' };
        } else {
          return { success: false, outcome: 'dismissed' };
        }
      } catch (err: any) {
        console.warn('[PWA] Prompt direct install error:', err);
        return { success: false, outcome: 'unsupported', error: err?.message };
      }
    }

    return { success: false, outcome: 'unsupported' };
  }, [deferredPrompt, isInstalled]);

  return {
    isInstallable: Boolean(deferredPrompt || (typeof window !== 'undefined' && window.__pwaDeferredPrompt)),
    isInstalled,
    deviceType,
    isIOS,
    isAndroid,
    isTablet,
    install,
  };
}

