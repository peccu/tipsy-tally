import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import { useI18n } from './i18n';

/* ---------- bottom sheet ---------- */

let openSheets = 0;

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: ComponentChildren;
  children: ComponentChildren;
}) {
  // Keep content mounted during the closing animation.
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const r = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
      return () => cancelAnimationFrame(r);
    }
    setShown(false);
    const id = setTimeout(() => setMounted(false), 260);
    return () => clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.classList.toggle('locked', ++openSheets > 0);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.toggle('locked', --openSheets > 0);
    };
  }, [open]);

  if (!mounted) return null;
  return createPortal(
    <div class={`sheet-layer${shown ? ' is-shown' : ''}`}>
      <div class="sheet-backdrop" onClick={onClose} />
      <div class="sheet" role="dialog" aria-modal="true">
        <div class="sheet-grip" />
        {title && <h2 class="sheet-title">{title}</h2>}
        <div class="sheet-body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

/* ---------- toast ---------- */

interface ToastMsg {
  id: number;
  text: string;
  action?: { label: string; run: () => void };
}
let pushToast: (m: ToastMsg) => void = () => {};
let toastSeq = 0;

export function toast(text: string, action?: ToastMsg['action']) {
  pushToast({ id: ++toastSeq, text, action });
}

export function ToastHost() {
  const [msg, setMsg] = useState<ToastMsg | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => {
    pushToast = (m) => {
      setMsg(m);
      clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setMsg(null), 3600);
    };
  }, []);
  return (
    <div class="toast-wrap" aria-live="polite">
      {msg && (
        <div class="toast" key={msg.id}>
          <span>{msg.text}</span>
          {msg.action && (
            <button
              class="toast-action"
              onClick={() => {
                msg.action!.run();
                setMsg(null);
              }}
            >
              {msg.action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- confirm ---------- */

interface Ask {
  title: string;
  body?: string;
  ok: string;
  danger?: boolean;
  resolve: (v: boolean) => void;
}
let pushAsk: (a: Ask) => void = () => {};

export const confirmSheet = (o: Omit<Ask, 'resolve'>) =>
  new Promise<boolean>((resolve) => pushAsk({ ...o, resolve }));

export function ConfirmHost() {
  const { t } = useI18n();
  const [ask, setAsk] = useState<Ask | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    pushAsk = (a) => {
      setAsk(a);
      setOpen(true);
    };
  }, []);
  const done = (v: boolean) => {
    ask?.resolve(v);
    setOpen(false);
  };
  return (
    <Sheet open={open} onClose={() => done(false)} title={ask?.title}>
      {ask?.body && <p class="confirm-body">{ask.body}</p>}
      <div class="btn-row">
        <button class="btn" onClick={() => done(false)}>
          {t('common.cancel')}
        </button>
        <button class={`btn ${ask?.danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => done(true)}>
          {ask?.ok}
        </button>
      </div>
    </Sheet>
  );
}

/* ---------- small pieces ---------- */

export function Segmented<V extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: V;
  options: { value: V; label: ComponentChildren }[];
  onChange: (v: V) => void;
  label?: string;
}) {
  return (
    <div class="segmented" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          role="radio"
          aria-checked={o.value === value}
          class={o.value === value ? 'is-on' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const haptic = () => navigator.vibrate?.(8);

/** Select a field's contents on focus. Deferred so iOS Safari's tap doesn't clear it. */
export const selectAll = (e: FocusEvent) => {
  const el = e.currentTarget as HTMLInputElement;
  setTimeout(() => el.select());
};
