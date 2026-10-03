import { useEffect, useState } from 'preact/hooks';
import { useI18n } from './i18n';
import { getData, todayKey, useData } from './store';
import { Today } from './screens/Today';
import { History } from './screens/History';
import { Drinks } from './screens/Drinks';
import { Settings } from './screens/Settings';
import { Landing } from './screens/Landing';
import { ConfirmHost, ToastHost } from './ui';

const TABS = ['today', 'history', 'drinks', 'settings'] as const;
type Tab = (typeof TABS)[number] | 'about';

const tabFromHash = (): Tab => {
  const h = location.hash.slice(1) as Tab;
  if (h === 'about' || TABS.includes(h as (typeof TABS)[number])) return h;
  return 'today';
};

/** First screen: the intro page until something has been logged. */
const initialTab = (): Tab => (!location.hash && getData().entries.length === 0 ? 'about' : tabFromHash());

/** Re-evaluates the logical day every minute and when the app comes back to the foreground. */
function useToday(): string {
  useData(); // day-start hour lives in settings
  const [, setDay] = useState(todayKey);
  useEffect(() => {
    const tick = () => setDay(todayKey());
    const id = setInterval(tick, 60_000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, []);
  return todayKey();
}

export function App() {
  const { t, lang } = useI18n();
  const [tab, setTab] = useState<Tab>(initialTab);
  const today = useToday();

  useEffect(() => {
    const on = () => {
      setTab(tabFromHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = t('app');
  }, [lang]);

  const go = (next: Tab) => {
    if (next === tab) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    history.replaceState(null, '', next === 'today' ? location.pathname : `#${next}`);
    setTab(next);
    window.scrollTo(0, 0);
  };

  if (tab === 'about') {
    return (
      <>
        <main class="main main-lp">
          <Landing onStart={() => go('today')} />
        </main>
        <ToastHost />
      </>
    );
  }

  return (
    <>
      <div class="topbar">
        <a class="wordmark" href="#about">
          {t('app')}
        </a>
      </div>
      <main class="main">
        {tab === 'today' && <Today day={today} />}
        {tab === 'history' && <History today={today} />}
        {tab === 'drinks' && <Drinks />}
        {tab === 'settings' && <Settings />}
      </main>
      <nav class="tabbar">
        {TABS.map((k) => (
          <button key={k} class={tab === k ? 'is-on' : ''} aria-current={tab === k ? 'page' : undefined} onClick={() => go(k)}>
            <TabIcon tab={k} />
            <span>{t(`tab.${k}`)}</span>
          </button>
        ))}
      </nav>
      <ToastHost />
      <ConfirmHost />
    </>
  );
}

function TabIcon({ tab }: { tab: Tab }) {
  const p = {
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': 1.7,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
  } as const;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      {tab === 'today' && (
        <>
          <path d="M6 4h12l-1.4 15.2a2 2 0 0 1-2 1.8H9.4a2 2 0 0 1-2-1.8z" {...p} />
          <path d="M6.6 10.5c3.6-1.2 7.2 1.2 10.8 0" {...p} />
        </>
      )}
      {tab === 'history' && (
        <>
          <rect x="3.5" y="5" width="17" height="15.5" rx="3" {...p} />
          <path d="M3.5 10h17M8 3v4M16 3v4" {...p} />
          <circle cx="12" cy="15" r="1.2" fill="currentColor" stroke="none" />
        </>
      )}
      {tab === 'drinks' && (
        <>
          <path d="M10 3h4v4.2c0 1.4 3 2.4 3 5.3V19a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-6.5c0-2.9 3-3.9 3-5.3z" {...p} />
          <path d="M7 14h10" {...p} />
        </>
      )}
      {tab === 'settings' && (
        <>
          <path d="M4 7h9M17 7h3M4 17h3M11 17h9" {...p} />
          <circle cx="15" cy="7" r="2" {...p} />
          <circle cx="9" cy="17" r="2" {...p} />
        </>
      )}
    </svg>
  );
}
