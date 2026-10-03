import { DrinkGrid, EntryList, NoteEditor, sumGrams, useTween } from '../components';
import { keyOf, parseKey } from '../date';
import { useI18n } from '../i18n';
import { useData } from '../store';

export function Today({ day }: { day: string }) {
  const data = useData();
  const { t, amt, amtNum, unit, lang } = useI18n();
  const entries = data.entries.filter((e) => e.day === day);
  const total = sumGrams(entries);
  const shown = useTween(total);
  const g = data.settings.guideline;

  const scale = Math.max(g * 2, total * 1.08);
  const basePct = (Math.min(total, g) / scale) * 100;
  const overPct = (Math.max(0, total - g) / scale) * 100;
  const tickPct = (g / scale) * 100;

  const dateFmt = new Intl.DateTimeFormat(lang, { month: 'long', day: 'numeric', weekday: 'short' });
  const lateNight = day !== keyOf(new Date());

  return (
    <div class="screen today">
      <header class="today-head">
        <p class="eyebrow">{dateFmt.format(parseKey(day))}</p>
        {lateNight && <p class="late">{t('today.lastNight', { h: data.settings.dayStartHour })}</p>}
      </header>

      <section class="hero">
        <div class="hero-figure">
          <span class="hero-num num">{amtNum(shown)}</span>
          <span class="hero-unit">{unit}</span>
        </div>
        <p class="hero-sub">
          {t(unit === 'g' ? 'today.pure' : 'today.alc')}
          {total > 0 && (
            <>
              <span class="dot-sep">·</span>
              {t('today.drinks', { n: (total / 10).toFixed(1) })}
            </>
          )}
        </p>

        <div class="meter" role="img" aria-label={t('today.guideline', { v: amt(g, 0) })}>
          <div class="meter-track">
            <div class="meter-fill" style={{ width: `${basePct}%` }} />
            {overPct > 0 && <div class="meter-over" style={{ left: `${basePct}%`, width: `${overPct}%` }} />}
            <div class="meter-tick" style={{ left: `${tickPct}%` }} />
          </div>
          <div class="meter-labels">
            <span>
              {total === 0
                ? t('today.zero')
                : total > g
                  ? t('today.over', { v: amt(total - g) })
                  : t('today.left', { v: amt(g - total) })}
            </span>
            <span>{t('today.guideline', { v: amt(g, 0) })}</span>
          </div>
        </div>
      </section>

      <section>
        <DrinkGrid day={day} />
        <p class="hint">{t('today.hint')}</p>
      </section>

      {entries.length > 0 && (
        <section class="block">
          <h2 class="block-title">
            {t('today.log')}
            <span class="block-count num">{entries.length}</span>
          </h2>
          <EntryList entries={entries} />
        </section>
      )}

      <section class="block">
        <h2 class="block-title">{t('today.howFeel')}</h2>
        <NoteEditor day={day} note={data.notes[day]} />
      </section>
    </div>
  );
}
