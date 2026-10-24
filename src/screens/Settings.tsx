import { useRef } from 'preact/hooks';
import { useI18n } from '../i18n';
import { clearAll, exportJSON, getData, importJSON, setSettings, todayKey, useData } from '../store';
import { confirmSheet, Segmented, toast } from '../ui';

export function Settings() {
  const { settings } = useData();
  const { t, amt, lang } = useI18n();
  const file = useRef<HTMLInputElement>(null);

  const download = () => {
    const blob = new Blob([exportJSON()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `donndake-${todayKey()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const onFile = async (e: Event) => {
    const input = e.currentTarget as HTMLInputElement;
    const f = input.files?.[0];
    input.value = '';
    if (!f) return;
    let text: string;
    try {
      text = await f.text();
      JSON.parse(text);
    } catch {
      toast(t('set.importFailed'));
      return;
    }
    const hasData = getData().entries.length > 0;
    if (
      hasData &&
      !(await confirmSheet({ title: t('set.importConfirm'), body: t('set.importConfirmBody'), ok: t('common.replace'), danger: true }))
    )
      return;
    try {
      const d = importJSON(text);
      toast(t('set.imported', { n: d.entries.length }));
    } catch {
      toast(t('set.importFailed'));
    }
  };

  const erase = async () => {
    if (await confirmSheet({ title: t('set.clearConfirm'), body: t('set.clearBody'), ok: t('common.erase'), danger: true })) {
      clearAll();
      toast(t('set.cleared'));
    }
  };

  const guideSteps = [10, 20, 40, 60];

  return (
    <div class="screen settings">
      <header class="page-head">
        <h1>{t('tab.settings')}</h1>
      </header>

      <section class="group">
        <div class="row">
          <span class="row-label">{t('set.lang')}</span>
          <Segmented
            label={t('set.lang')}
            value={settings.lang}
            onChange={(lang) => setSettings({ lang })}
            options={[
              { value: 'auto', label: t('set.auto') },
              { value: 'ja', label: '日本語' },
              { value: 'en', label: 'English' },
            ]}
          />
        </div>

        <div class="row col">
          <span class="row-label">{t('set.unit')}</span>
          <Segmented
            label={t('set.unit')}
            value={settings.unit}
            onChange={(unit) => setSettings({ unit })}
            options={[
              { value: 'g', label: `${t('set.unitG')} (g)` },
              { value: 'ml', label: `${t('set.unitMl')} (ml)` },
            ]}
          />
          <p class="row-hint">{t('set.unitHint')}</p>
        </div>

        <div class="row col">
          <span class="row-label">{t('set.guideline')}</span>
          <div class="stepper">
            <button
              aria-label="−"
              onClick={() => setSettings({ guideline: Math.max(5, settings.guideline - 5) })}
            >
              −
            </button>
            <output class="num">{amt(settings.guideline, 0)}</output>
            <button aria-label="+" onClick={() => setSettings({ guideline: Math.min(200, settings.guideline + 5) })}>
              +
            </button>
          </div>
          <div class="chips">
            {guideSteps.map((g) => (
              <button key={g} class={`chip${settings.guideline === g ? ' is-on' : ''}`} onClick={() => setSettings({ guideline: g })}>
                {amt(g, 0)}
              </button>
            ))}
          </div>
          <p class="row-hint">{t('set.guidelineHint')}</p>
        </div>

        <div class="row col">
          <span class="row-label">{t('set.dayStart')}</span>
          <Segmented
            label={t('set.dayStart')}
            value={settings.dayStartHour}
            onChange={(dayStartHour) => setSettings({ dayStartHour })}
            options={[0, 2, 4, 5, 6].map((h) => ({
              value: h,
              label: new Intl.DateTimeFormat(lang, { hour: 'numeric', minute: '2-digit' }).format(new Date(2024, 0, 1, h)),
            }))}
          />
          <p class="row-hint">{t('set.dayStartHint')}</p>
        </div>

        <div class="row">
          <span class="row-label">{t('set.weekStart')}</span>
          <Segmented
            label={t('set.weekStart')}
            value={settings.weekStart}
            onChange={(weekStart) => setSettings({ weekStart })}
            options={([0, 1] as const).map((d) => ({
              value: d,
              label: new Intl.DateTimeFormat(lang, { weekday: 'short' }).format(new Date(2024, 0, 7 + d)),
            }))}
          />
        </div>
      </section>

      <h2 class="group-title">{t('set.data')}</h2>
      <section class="group">
        <p class="row-hint pad">{t('set.storage')}</p>
        <button class="row row-btn" onClick={download}>
          {t('set.export')}
          <Arrow />
        </button>
        <button class="row row-btn" onClick={() => file.current?.click()}>
          {t('set.import')}
          <Arrow />
        </button>
        <input ref={file} type="file" accept="application/json,.json" hidden onChange={onFile} />
        <button class="row row-btn danger" onClick={erase}>
          {t('set.clear')}
        </button>
      </section>

      <h2 class="group-title">{t('set.about')}</h2>
      <section class="group">
        <a class="row row-btn" href="#about">
          {t('set.intro')}
          <Arrow />
        </a>
        <p class="row-hint pad">{t('set.disclaimer')}</p>
        <div class="row">
          <span class="row-label">{t('set.ver')}</span>
          <span class="muted num">{__APP_VERSION__}</span>
        </div>
      </section>

      <p class="colophon">
        アルコールどんだけ？ <span>/</span> Tipsy Tally
      </p>
    </div>
  );
}

const Arrow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M9.5 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
);
