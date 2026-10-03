import { useEffect, useState } from 'preact/hooks';
import { useI18n } from '../i18n';
import { DrinkIcon, MoodFace, TINT } from '../icons';
import type { IconKey } from '../types';

/* ---------- install prompt (Chrome / Android) ---------- */

interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

let deferred: InstallEvent | null = null;
const listeners = new Set<() => void>();
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferred = e as InstallEvent;
  listeners.forEach((f) => f());
});
window.addEventListener('appinstalled', () => {
  deferred = null;
  listeners.forEach((f) => f());
});

function useInstall() {
  const [, force] = useState(0);
  useEffect(() => {
    const f = () => force((n) => n + 1);
    listeners.add(f);
    return () => void listeners.delete(f);
  }, []);
  return deferred;
}

const standalone = () =>
  matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

/* ---------- page ---------- */

const PARADE: IconKey[] = ['wine', 'highball', 'jug', 'sake', 'cocktail'];

export function Landing({ onStart }: { onStart: () => void }) {
  const { t } = useI18n();
  const install = useInstall();
  const installed = standalone();

  return (
    <div class="lp">
      <section class="lp-hero">
        <div class="lp-parade" aria-hidden="true">
          {PARADE.map((k, i) => (
            <span key={k} class="lp-plate" style={{ background: TINT[k], '--i': i } as Record<string, string | number>}>
              <DrinkIcon icon={k} size={i === 2 ? 74 : 54} />
            </span>
          ))}
        </div>
        <p class="lp-kicker">{t('lp.kicker')}</p>
        <h1 class="lp-title">{t('app')}</h1>
        <p class="lp-lead">{t('lp.lead')}</p>
        <button class="btn btn-primary lp-cta" onClick={onStart}>
          {t('lp.start')}
        </button>
        <p class="lp-note">{t('lp.free')}</p>
      </section>

      <section class="lp-feature">
        <div class="lp-mock lp-mock-tiles" aria-hidden="true">
          {(['jug', 'highball', 'sake'] as IconKey[]).map((k, i) => (
            <span key={k} class={`lp-tile${i === 0 ? ' is-hit' : ''}`}>
              <span class="tile-plate" style={{ background: TINT[k] }}>
                <DrinkIcon icon={k} size={40} />
              </span>
              {i === 0 && <span class="lp-bubble num">+14.0g</span>}
            </span>
          ))}
        </div>
        <h2>{t('lp.f1.title')}</h2>
        <p>{t('lp.f1.body')}</p>
      </section>

      <section class="lp-feature">
        <div class="lp-mock lp-mock-cal" aria-hidden="true">
          {[0, 2, 0, 1, 3, 0, 0, 2, 0, 4, 1, 0, 0, 2, 0, 0, 1, 3, 0, 0, 0].map((lv, i) => (
            <i key={i} class={`lv${lv}`} />
          ))}
        </div>
        <h2>{t('lp.f2.title')}</h2>
        <p>{t('lp.f2.body')}</p>
      </section>

      <section class="lp-feature">
        <div class="lp-mock lp-mock-tol" aria-hidden="true">
          {[
            [1, 12, 26, 19],
            [2, 22, 38, 30],
            [3, 34, 52, 44],
          ].map(([lv, min, max, avg]) => (
            <span key={lv} class="lp-tol-row">
              <MoodFace level={lv} size={22} />
              <span class="tol-track">
                <span class="tol-band" style={{ left: `${min}%`, width: `${max - min}%` }} />
                <span class="tol-dot" style={{ left: `${avg}%` }} />
              </span>
            </span>
          ))}
        </div>
        <h2>{t('lp.f3.title')}</h2>
        <p>{t('lp.f3.body')}</p>
      </section>

      <section class="lp-formula">
        <h2>{t('lp.calc.title')}</h2>
        <p class="lp-eq">
          <span>{t('lp.calc.ml')}</span>×<span>{t('lp.calc.abv')}</span>×<span>0.8</span>
        </p>
        <p class="lp-example num">{t('lp.calc.example')}</p>
        <p class="lp-small">{t('lp.calc.body')}</p>
      </section>

      <section class="lp-points">
        <div>
          <h3>{t('lp.p1.title')}</h3>
          <p>{t('lp.p1.body')}</p>
        </div>
        <div>
          <h3>{t('lp.p2.title')}</h3>
          <p>{t('lp.p2.body')}</p>
        </div>
        {!installed && (
          <div>
            <h3>{t('lp.p3.title')}</h3>
            <p>{isIOS() ? t('lp.p3.ios') : t('lp.p3.other')}</p>
            {install && (
              <button
                class="btn btn-ghost lp-install"
                onClick={async () => {
                  await install.prompt();
                  await install.userChoice;
                  deferred = null;
                  listeners.forEach((f) => f());
                }}
              >
                {t('lp.install')}
              </button>
            )}
          </div>
        )}
      </section>

      <section class="lp-end">
        <button class="btn btn-primary lp-cta" onClick={onStart}>
          {t('lp.start')}
        </button>
        <p class="lp-small">{t('lp.age')}</p>
      </section>
    </div>
  );
}
