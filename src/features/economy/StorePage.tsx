import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Check, Snowflake, Lock, Palette, Award, Trophy } from 'lucide-react';
import { Coin } from '@/components/illustrations/Coin';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/AuthProvider';
import { DefaultAvatar } from '@/features/profile/DefaultAvatar';
import { track } from '@/lib/analytics';
import { ERROR_COPY } from '@/lib/errors';
import { STREAK_FREEZE_COST, MAX_STREAK_FREEZES } from '@/lib/coins';
import { AVATAR_STYLES, DEFAULT_AVATAR_STYLE } from './avatarStyles';
import { PROFILE_FLAIR, DEFAULT_FLAIR } from './profileFlair';
import { FlairBadge } from './FlairBadge';
import { OceanScene } from '@/features/course/OceanScene';
import { Chest } from '@/components/illustrations/Chest';
import {
  buyStreakFreeze,
  buyAvatarStyle,
  equipAvatarStyle,
  buyProfileFlair,
  equipProfileFlair,
} from './coinService';
import { CoinChip } from './CoinChip';

/** Price shown on a buy button: a coin + amount, prefixed with a lock when the
 *  learner can't afford it yet (the button is also disabled in that case). */
function PriceLabel({ price, canAfford }: { price: number; canAfford: boolean }) {
  return (
    <span className="inline-flex items-center gap-1">
      {!canAfford && <Lock className="h-3 w-3" aria-hidden="true" />}
      <span className="text-amber-base">
        <Coin className="h-3.5 w-3.5" />
      </span>
      <span>{price}</span>
    </span>
  );
}

export function StorePage() {
  const auth = useAuth();
  const profile = auth.status === 'authenticated' ? auth.profile : null;
  const uid = auth.status === 'authenticated' ? auth.user.uid : '';
  const coins = profile?.coins ?? 0;
  const owned = profile?.streakFreezes ?? 0;
  const displayUsername = profile?.displayUsername || 'Pirate';
  const ownedStyles = profile?.ownedAvatarStyles ?? [DEFAULT_AVATAR_STYLE];
  const equippedStyle = profile?.avatarStyle ?? DEFAULT_AVATAR_STYLE;
  const ownedFlair = profile?.ownedFlair ?? [DEFAULT_FLAIR];
  const equippedFlair = profile?.profileFlair ?? DEFAULT_FLAIR;

  const [freezeBusy, setFreezeBusy] = useState(false);
  const [styleBusy, setStyleBusy] = useState<string | null>(null);
  const [flairBusy, setFlairBusy] = useState<string | null>(null);

  useEffect(() => {
    track('store_view', {});
  }, []);

  const atMax = owned >= MAX_STREAK_FREEZES;
  const canAffordFreeze = coins >= STREAK_FREEZE_COST;

  async function onBuyFreeze() {
    setFreezeBusy(true);
    const res = await buyStreakFreeze(uid);
    setFreezeBusy(false);
    if (res.ok)
      toast('Streak Freeze added — your streak is protected for one missed day.', { icon: '❄️' });
    else if (res.reason === 'at-max')
      toast(`You can hold at most ${MAX_STREAK_FREEZES} Streak Freezes.`);
    else if (res.reason === 'insufficient')
      toast('Not enough coins yet — clear a chapter or unlock an achievement.');
    else toast(ERROR_COPY.economy.purchase);
  }

  function ownsStyle(id: string) {
    return id === DEFAULT_AVATAR_STYLE || ownedStyles.includes(id);
  }

  async function onBuyStyle(id: string, price: number) {
    setStyleBusy(id);
    const res = await buyAvatarStyle(uid, id, price);
    setStyleBusy(null);
    if (res.ok) toast('Style unlocked! Tap Equip to wear it.', { icon: '🎨' });
    else if (res.reason === 'owned') toast('You already own this style.');
    else if (res.reason === 'insufficient') toast('Not enough coins for this style yet.');
    else toast(ERROR_COPY.economy.purchase);
  }

  async function onEquipStyle(id: string) {
    setStyleBusy(id);
    const res = await equipAvatarStyle(uid, id);
    setStyleBusy(null);
    if (res.ok) toast('Style equipped.');
    else toast(ERROR_COPY.economy.equip);
  }

  function ownsFlair(id: string) {
    return id === DEFAULT_FLAIR || ownedFlair.includes(id);
  }

  async function onBuyFlair(id: string, price: number) {
    setFlairBusy(id);
    const res = await buyProfileFlair(uid, id, price);
    setFlairBusy(null);
    if (res.ok) toast('Flair unlocked! Tap Equip to wear it.', { icon: '🎖️' });
    else if (res.reason === 'owned') toast('You already own this flair.');
    else if (res.reason === 'insufficient') toast('Not enough coins for this flair yet.');
    else toast(ERROR_COPY.economy.purchase);
  }

  async function onEquipFlair(id: string) {
    setFlairBusy(id);
    const res = await equipProfileFlair(uid, id);
    setFlairBusy(null);
    if (res.ok) toast(id === DEFAULT_FLAIR ? 'Flair removed.' : 'Flair equipped.');
    else toast(ERROR_COPY.economy.equip);
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-8">
      {/* Treasure-shop banner — kept as the page header (no separate back
          button row; the sidebar / bottom-nav owns navigation, matching the
          pattern used by every other top-level page). */}
      <OceanScene calm>
        <div className="flex flex-col items-center gap-2 py-3 text-center">
          <Chest open className="w-16 drop-shadow-sm" />
          <h1 className="font-display text-2xl font-bold tracking-tight">Trading Post</h1>
          <p className="max-w-xs text-sm text-[color:var(--ink)]/75">
            Spend the coins you earn from chests and achievements.
          </p>
          <div className="mt-1">
            <CoinChip coins={coins} size="md" />
          </div>
        </div>
      </OceanScene>

      {/* Coin-earning hint — answers "where do I get more coins?" inline
          instead of leaving the question hanging. Quiet by default; sits
          right under the wallet so it reads as a hint, not an upsell. */}
      <EarnCoinsHint />

      {/* Avatar styles */}
      <section className="space-y-3">
        <SectionHeader icon={<Palette className="h-4 w-4" />} title="Avatar styles" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {AVATAR_STYLES.map((style) => {
            const equipped = equippedStyle === style.id;
            const ownedStyle = ownsStyle(style.id);
            const busy = styleBusy === style.id;
            const canAfford = coins >= style.price;
            return (
              <div
                key={style.id}
                className={`relative flex flex-col items-center gap-2 rounded-2xl border p-3 text-center shadow-soft transition-all ${
                  equipped
                    ? 'border-primary/40 ring-2 ring-primary/25'
                    : 'border-[color:var(--amber-base)]/15 hover:-translate-y-0.5'
                }`}
                style={{
                  background: equipped
                    ? 'var(--card)'
                    : 'color-mix(in srgb, var(--amber-soft) 35%, var(--card))',
                }}
              >
                {equipped && (
                  <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
                  </span>
                )}
                <DefaultAvatar
                  username={displayUsername}
                  size={56}
                  styleId={style.id}
                  className={!ownedStyle && !canAfford ? 'opacity-50' : undefined}
                />
                <p className="text-sm font-semibold leading-tight">{style.name}</p>
                {equipped ? (
                  <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                    Equipped
                  </span>
                ) : ownedStyle ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    disabled={busy}
                    onClick={() => onEquipStyle(style.id)}
                  >
                    {busy ? '…' : 'Equip'}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="w-full gap-1.5"
                    disabled={busy || !canAfford}
                    onClick={() => onBuyStyle(style.id, style.price)}
                  >
                    {busy ? '…' : <PriceLabel price={style.price} canAfford={canAfford} />}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Streak Freeze — single-item utility. Upgraded from a plain bordered
          card to an icy gradient "magical item" treatment so it reads as the
          only consumable in the shop, distinct from the cosmetic sections
          above and below. */}
      <section className="space-y-3">
        <SectionHeader icon={<Snowflake className="h-4 w-4" />} title="Streak Freeze" />
        <div className="relative overflow-hidden rounded-2xl border border-[color:var(--blue-base)]/30 bg-gradient-to-br from-[color:var(--blue-soft)]/80 via-card to-card p-4 shadow-soft">
          {/* Decorative frost glints — purely cosmetic */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-4 -right-4 h-24 w-24 rounded-full bg-[color:var(--blue-base)]/10 blur-2xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-white/40 blur-2xl"
          />

          <div className="relative flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white text-[color:var(--blue-deep)] shadow-sm">
              <Snowflake className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground leading-tight">
                Protect your streak on a missed day.
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Auto-consumed when you forget. Everyone has off days.
              </p>
            </div>
            <CoinChip coins={STREAK_FREEZE_COST} />
          </div>

          <div className="relative mt-3 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Owned: <span className="font-bold text-foreground">{owned}</span> / {MAX_STREAK_FREEZES}
            </span>
            <Button
              size="sm"
              onClick={onBuyFreeze}
              disabled={freezeBusy || atMax || !canAffordFreeze}
            >
              {atMax
                ? 'Maxed out'
                : !canAffordFreeze
                  ? 'Need more coins'
                  : freezeBusy
                    ? 'Buying…'
                    : 'Buy'}
            </Button>
          </div>
        </div>
      </section>

      {/* Profile flair */}
      <section className="space-y-3">
        <SectionHeader icon={<Award className="h-4 w-4" />} title="Flair" />
        <p className="text-xs text-muted-foreground">A title badge shown under your name.</p>
        <div className="space-y-2">
          {PROFILE_FLAIR.map((flair) => {
            const equipped = equippedFlair === flair.id;
            const owned = ownsFlair(flair.id);
            const busy = flairBusy === flair.id;
            const canAfford = coins >= flair.price;
            return (
              <div
                key={flair.id}
                className={`flex items-center gap-3 rounded-2xl border p-3 shadow-soft transition-all ${
                  equipped
                    ? 'border-primary/40 ring-2 ring-primary/25'
                    : 'border-[color:var(--amber-base)]/15 hover:-translate-y-0.5'
                }`}
                style={{
                  background: equipped
                    ? 'var(--card)'
                    : 'color-mix(in srgb, var(--amber-soft) 35%, var(--card))',
                }}
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  {flair.background ? (
                    <FlairBadge flairId={flair.id} />
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-dashed border-border px-3 py-1 text-xs font-medium text-muted-foreground">
                      No flair
                    </span>
                  )}
                </div>
                {equipped ? (
                  <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-primary">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" /> Equipped
                  </span>
                ) : owned ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    disabled={busy}
                    onClick={() => onEquipFlair(flair.id)}
                  >
                    {busy ? '…' : flair.id === DEFAULT_FLAIR ? 'Remove' : 'Equip'}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="shrink-0 gap-1.5"
                    disabled={busy || !canAfford}
                    onClick={() => onBuyFlair(flair.id, flair.price)}
                  >
                    {busy ? '…' : <PriceLabel price={flair.price} canAfford={canAfford} />}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small helpers — kept inline since they're store-specific presentational bits.
// ---------------------------------------------------------------------------

/** Iconified section title: tiny icon disc + label. Distinguishes the three
 *  shop sections (Avatar / Streak Freeze / Flair) without each h2 reading the
 *  same as the others. */
function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-[color:var(--amber-soft)] text-[color:var(--amber-deep)]">
        {icon}
      </span>
      <h2 className="font-display text-lg font-bold tracking-tight">{title}</h2>
    </div>
  );
}

/** Inline answer to "where do coins come from?" so the question doesn't hang
 *  on a learner with a 0 balance. Quiet card; doesn't push for a purchase. */
function EarnCoinsHint() {
  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
        How to earn coins
      </p>
      <ul className="space-y-1.5 text-sm">
        <li className="flex items-center gap-2.5">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[color:var(--amber-soft)] text-[color:var(--amber-deep)]">
            <Coin className="h-3.5 w-3.5" />
          </span>
          <span className="text-foreground/85">Open chapter chests on your course path.</span>
        </li>
        <li className="flex items-center gap-2.5">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[color:var(--violet-soft)] text-[color:var(--violet-deep)]">
            <Trophy className="h-3.5 w-3.5" />
          </span>
          <span className="text-foreground/85">Unlock achievements as you learn.</span>
        </li>
      </ul>
    </div>
  );
}
