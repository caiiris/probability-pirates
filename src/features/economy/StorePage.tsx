import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Check, Snowflake, Lock } from 'lucide-react';
import { Coin } from '@/components/illustrations/Coin';
import { Button, buttonVariants } from '@/components/ui/button';
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
    if (res.ok) toast('Streak Freeze added — your streak is protected for one missed day.', { icon: '❄️' });
    else if (res.reason === 'at-max') toast(`You can hold at most ${MAX_STREAK_FREEZES} Streak Freezes.`);
    else if (res.reason === 'insufficient') toast('Not enough coins yet — clear a chapter or unlock an achievement.');
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
      <Link to="/profile" className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'gap-1.5 -ml-2' })}>
        <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back
      </Link>

      {/* Treasure-shop banner */}
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

      {/* Avatar styles */}
      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold tracking-tight">Avatar styles</h2>
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
                  <Button size="sm" variant="outline" className="w-full" disabled={busy} onClick={() => onEquipStyle(style.id)}>
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

      {/* Streak Freeze — purchasable. Single-item section: name it plainly
          rather than wrapping the one item in a metaphor ("Forgiveness"). */}
      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold tracking-tight">Streak Freeze</h2>
        <div className="rounded-2xl border border-border/70 bg-card p-4 space-y-3">
          <div className="flex items-center gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[color:var(--blue-soft)] text-[color:var(--blue-deep)]">
              <Snowflake className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">
                Automatically protects your streak on a day you miss. Everyone has off days.
              </p>
            </div>
            <CoinChip coins={STREAK_FREEZE_COST} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Owned: {owned} / {MAX_STREAK_FREEZES}
            </span>
            <Button size="sm" onClick={onBuyFreeze} disabled={freezeBusy || atMax || !canAffordFreeze}>
              {atMax ? 'Maxed out' : !canAffordFreeze ? 'Need more coins' : freezeBusy ? 'Buying…' : 'Buy'}
            </Button>
          </div>
        </div>
      </section>

      {/* Profile flair */}
      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold tracking-tight">Flair</h2>
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
                  <Button size="sm" variant="outline" className="shrink-0" disabled={busy} onClick={() => onEquipFlair(flair.id)}>
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
