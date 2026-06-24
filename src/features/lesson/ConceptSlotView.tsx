import { Die } from '@/components/illustrations/Die';
import { Coin } from '@/components/illustrations/Coin';
import { Door } from '@/components/illustrations/Door';
import { Calendar } from '@/components/illustrations/Calendar';
import { renderInlineMath } from '@/components/Fraction';
import type { ConceptSlot, IllustrationRef } from '@/content/types';
import { DerivationCard } from './DerivationCard';

type Props = { slot: ConceptSlot };

export function ConceptSlotView({ slot }: Props) {
  const hasTeach = !!(
    slot.title ||
    (slot.body && slot.body.length > 0) ||
    slot.example ||
    slot.theorem ||
    slot.derivation
  );

  // Thin one-liner concept (legacy shape): centered, large lede, no body.
  // Used by lessons we have not redesigned yet so they stay visually intact.
  // `my-auto` inside a `min-h-full flex flex-col` parent vertically centers
  // short content but collapses to 0 when the content overflows, so scrolling
  // still starts at the top.
  if (!hasTeach) {
    return (
      <div className="min-h-full flex flex-col">
        <div className="my-auto flex flex-col items-center gap-8 px-4 py-8">
          <IllustrationBlock kind={slot.illustration.kind} />
          <p className="text-xl font-medium text-center leading-relaxed max-w-sm">
            {slot.prompt}
          </p>
        </div>
      </div>
    );
  }

  // Enriched "teach" concept: the illustration, title, and one-line lede are
  // centered for visual rhythm, but multi-sentence prose (theorem, body,
  // examples) is left-aligned — centered running text is hard to read because
  // every line starts at a different x. Vertically centered via `my-auto` for
  // short slots; long slots scroll from the top (the auto-margins collapse).
  return (
    <div className="min-h-full flex flex-col">
      <div className="my-auto px-4 py-8 space-y-6 max-w-prose mx-auto w-full">
      <div className="flex justify-center">
        <IllustrationBlock kind={slot.illustration.kind} />
      </div>

      {slot.title && (
        <h2 className="font-display text-2xl tracking-tight leading-tight text-foreground text-center">
          {slot.title}
        </h2>
      )}

      <p className="text-lg font-medium leading-relaxed text-foreground text-center text-balance">
        {slot.prompt}
      </p>

      {slot.theorem && (
        <aside
          aria-label={slot.theorem.name ? `Theorem: ${slot.theorem.name}` : 'Theorem'}
          className="rounded-xl border border-t-4 border-t-primary bg-primary-soft/50 px-4 py-3.5 space-y-1.5"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-deep">
            {slot.theorem.name ? (
              <>
                Theorem <span aria-hidden="true" className="opacity-60">·</span>{' '}
                {slot.theorem.name}
              </>
            ) : (
              'Theorem'
            )}
          </p>
          <p className="text-[0.95rem] leading-relaxed text-foreground">
            {renderInlineMath(slot.theorem.statement)}
          </p>
        </aside>
      )}

      {slot.body && slot.body.length > 0 && (
        <div className="space-y-3 text-[0.95rem] leading-relaxed text-muted-foreground">
          {slot.body.map((para, i) => (
            <p key={i}>{renderInlineMath(para)}</p>
          ))}
        </div>
      )}

      {slot.example && (
        <div className="rounded-xl border bg-muted/30 px-4 py-4 space-y-2 text-left">
          {slot.example.title && (
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {slot.example.title}
            </p>
          )}
          <ol className="space-y-1.5 text-[0.95rem] font-mono leading-relaxed text-foreground">
            {slot.example.steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-muted-foreground/60 select-none w-5 shrink-0">
                  {i + 1}.
                </span>
                <span className="flex-1">{renderInlineMath(step)}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {slot.derivation && <DerivationCard derivation={slot.derivation} />}
      </div>
    </div>
  );
}

function IllustrationBlock({ kind }: { kind: IllustrationRef['kind'] }) {
  if (kind === 'die') {
    return (
      <div className="flex gap-3">
        {[1, 2, 3, 4, 5, 6].map((v) => (
          <Die key={v} value={v} className="w-8 h-8 text-primary" />
        ))}
      </div>
    );
  }
  if (kind === 'coin') {
    return (
      <div className="flex gap-4">
        <Coin side="H" className="w-16 h-16 text-primary" />
        <Coin side="T" className="w-16 h-16 text-primary" />
      </div>
    );
  }
  if (kind === 'doors') {
    return (
      <div className="flex gap-3">
        {['1', '2', '3'].map((n) => (
          <Door key={n} state="closed" label={n} className="w-14 h-auto" />
        ))}
      </div>
    );
  }
  if (kind === 'calendar') {
    return <Calendar className="w-24 h-24 text-primary" />;
  }
  return (
    <div className="flex gap-2 text-3xl">
      {['♥', '♦', '♣', '♠'].map((s) => (
        <span key={s} className={s === '♥' || s === '♦' ? 'text-destructive' : 'text-foreground'}>
          {s}
        </span>
      ))}
    </div>
  );
}
