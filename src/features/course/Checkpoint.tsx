import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';
import { Chest } from '@/components/illustrations/Chest';
import { TreasureChest } from '@/components/illustrations/TreasureChest';
import { Landmass } from '@/components/illustrations/Landmass';
import { Coin } from '@/components/illustrations/Coin';
import { ACCENTS, ACCENT_BASES, type AccentName } from '@/lib/theme';
import { track } from '@/lib/analytics';
import { claimChest } from '@/features/economy/coinService';

type Props = {
  variant: 'chest' | 'treasure';
  /** what clearing this checkpoint represents, e.g. a chapter title */
  title: string;
  accent: AccentName;
  complete: boolean;
  /** Stable id (chapter id) so the chest pays out exactly once. */
  chestId: string;
  /** Coins awarded on first open. */
  reward: number;
  /** Whether this chest's coins have already been claimed. */
  claimed: boolean;
  uid: string;
};

/**
 * A reward marker between chapters. Chests cap each chapter; the final chapter
 * ends in landfall — a big, lavish treasure chest buried on the island, the
 * grand prize of the whole voyage. Locked until cleared; once cleared it bobs,
 * sparkles, bursts confetti, and pays out its coins once.
 */
export function Checkpoint(props: Props) {
  return props.variant === 'treasure' ? <TreasureLand {...props} /> : <ChestStop {...props} />;
}

/**
 * Claim a chest's coins (idempotent) and return a toast suffix like " +100 coins"
 * when freshly awarded, or '' if it was already claimed / not eligible.
 */
async function openChestReward(
  uid: string,
  chestId: string,
  reward: number,
): Promise<string> {
  if (!uid) return '';
  track('chest_opened', { chest_id: chestId, reward });
  const res = await claimChest(uid, chestId, reward);
  return res.ok && res.awarded > 0 ? ` +${res.awarded} coins` : '';
}

// ---------------------------------------------------------------------------
// Chest (per-chapter)
// ---------------------------------------------------------------------------

function ChestStop({ title, accent, complete, chestId, reward, claimed, uid }: Props) {
  const c = ACCENTS[accent];
  // Already-claimed chests render open and stay open — you've taken the loot.
  const [opened, setOpened] = useState(claimed);
  const [bursts, setBursts] = useState(0);
  const [claimedState, setClaimedState] = useState(claimed);

  async function celebrate() {
    setOpened(true);
    setBursts((b) => b + 1);
    if (!claimedState) {
      setClaimedState(true); // optimistic; claim is idempotent server-side
      const suffix = await openChestReward(uid, chestId, reward);
      toast(`${title} cleared!${suffix}`, suffix ? { icon: '🪙' } : undefined);
    } else {
      toast(`${title} cleared!`);
    }
  }

  if (!complete) {
    return (
      <div className="flex flex-col items-center text-center">
        <div
          className="relative grid h-20 w-24 place-items-center rounded-2xl border border-dashed"
          style={{ borderColor: 'var(--line-strong)', background: 'rgb(255 255 255 / 0.5)' }}
        >
          <div className="opacity-40 grayscale">
            <Chest className="h-14 w-14" />
          </div>
          <span className="absolute -bottom-2 grid h-7 w-7 place-items-center rounded-full bg-muted ring-2 ring-card">
            <Lock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          </span>
        </div>
        <p className="mt-3 text-xs font-medium text-[color:var(--ink)]/70">
          Clear {title} to unlock
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center">
      <motion.button
        type="button"
        onClick={celebrate}
        aria-label={`${title} cleared — celebrate`}
        className="relative grid h-20 w-24 place-items-center rounded-2xl"
        style={{ background: c.soft, boxShadow: `0 5px 0 ${c.base}33` }}
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.95, y: 3 }}
      >
        <Sparkles color={c.base} />
        <span className="relative z-10">
          <Chest open={opened} className="h-14 w-14" />
        </span>
        {bursts > 0 ? <Burst key={bursts} /> : null}
      </motion.button>
      <p className="mt-3 font-display text-sm font-bold tracking-tight" style={{ color: c.deep }}>
        {title} cleared!
      </p>
      {claimedState ? (
        <p className="text-xs text-[color:var(--ink)]/70">Tap to celebrate</p>
      ) : (
        <p
          className="text-xs font-semibold flex items-center gap-1 justify-center"
          style={{ color: c.deep }}
        >
          <span className="text-amber-base">
            <Coin className="h-3.5 w-3.5" />
          </span>
          +{reward} coins inside — tap to open
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Treasure (final) — the grand prize buried on the island
// ---------------------------------------------------------------------------

function TreasureLand({ accent, complete, chestId, reward, claimed, uid }: Props) {
  const c = ACCENTS[accent];
  // Once claimed the chest stays flung open — the hoard has been found.
  const [opened, setOpened] = useState(claimed);
  const [bursts, setBursts] = useState(0);
  const [claimedState, setClaimedState] = useState(claimed);

  async function celebrate() {
    setOpened(true);
    setBursts((b) => b + 1);
    if (!claimedState) {
      setClaimedState(true); // optimistic; claim is idempotent server-side
      const suffix = await openChestReward(uid, chestId, reward);
      toast(`Treasure unearthed! Course complete 🏴‍☠️${suffix}`, suffix ? { icon: '🪙' } : undefined);
    } else {
      toast('Treasure unearthed! Course complete 🏴‍☠️');
    }
  }

  const Wrapper = complete ? motion.button : 'div';
  const wrapperProps = complete
    ? {
        type: 'button' as const,
        onClick: celebrate,
        'aria-label': 'Course complete — open the treasure',
        whileHover: { scale: 1.02 },
        whileTap: { scale: 0.98 },
      }
    : {};

  return (
    <div className="flex flex-col items-center text-center">
      <Wrapper className="relative block w-full max-w-[280px]" {...wrapperProps}>
        <Landmass className={`w-full ${complete ? '' : 'opacity-60 grayscale'}`} />

        {/* the grand treasure chest, planted big on the grass crown */}
        <motion.div
          className="absolute left-1/2 bottom-[34%] w-[64%] -translate-x-1/2"
          animate={complete ? { y: [0, -5, 0] } : undefined}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          {complete ? <Sparkles color={c.base} /> : null}
          <span className={`block ${complete ? '' : 'opacity-60 grayscale'}`}>
            <TreasureChest open={complete && opened} className="w-full" />
          </span>
        </motion.div>

        {complete ? null : (
          <span className="absolute left-1/2 top-1/2 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-muted ring-2 ring-card">
            <Lock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </span>
        )}

        {bursts > 0 ? <Burst key={bursts} /> : null}
      </Wrapper>

      <p
        className="mt-2 font-display text-base font-bold tracking-tight"
        style={{ color: complete ? c.deep : 'var(--ink)' }}
      >
        {complete ? 'Treasure unearthed! Course complete!' : 'X marks the spot'}
      </p>
      {complete ? (
        claimedState ? (
          <p className="text-xs text-[color:var(--ink)]/70">Tap to celebrate</p>
        ) : (
          <p
            className="text-xs font-semibold flex items-center gap-1 justify-center"
            style={{ color: c.deep }}
          >
            <span className="text-amber-base">
              <Coin className="h-3.5 w-3.5" />
            </span>
            +{reward} coins of treasure — tap to open
          </p>
        )
      ) : (
        <p className="text-xs text-[color:var(--ink)]/70">
          Finish every lesson to claim the buried treasure
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared effects
// ---------------------------------------------------------------------------

/** Three twinkling sparkles arranged around the reward. */
function Sparkles({ color }: { color: string }) {
  const spots = [
    { top: -6, left: -4, size: 12, delay: 0 },
    { top: 6, right: -6, size: 9, delay: 0.5 },
    { bottom: -4, left: 10, size: 8, delay: 1 },
  ];
  return (
    <>
      {spots.map((s, i) => (
        <motion.svg
          key={i}
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="absolute z-20"
          style={{ width: s.size, height: s.size, color, ...s }}
          animate={{ scale: [0.4, 1, 0.4], opacity: [0.3, 1, 0.3], rotate: [0, 25, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: s.delay }}
        >
          <path
            d="M12 2c.6 4.7 1.5 5.6 6 6-4.5.4-5.4 1.3-6 6-.6-4.7-1.5-5.6-6-6 4.5-.4 5.4-1.3 6-6Z"
            fill="currentColor"
          />
        </motion.svg>
      ))}
    </>
  );
}

const BURST_COUNT = 26;

/** One-shot confetti spray from the center; remount (via key) to replay. */
function Burst() {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-visible" aria-hidden="true">
      {Array.from({ length: BURST_COUNT }, (_, i) => {
        const angle = (i / BURST_COUNT) * Math.PI * 2;
        const dist = 50 + Math.random() * 40;
        const x = Math.cos(angle) * dist;
        const y = Math.sin(angle) * dist;
        const size = 5 + Math.random() * 5;
        return (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2 rounded-sm"
            style={{
              width: size,
              height: size,
              backgroundColor: ACCENT_BASES[i % ACCENT_BASES.length],
              marginLeft: -size / 2,
              marginTop: -size / 2,
            }}
            initial={{ x: 0, y: 0, scale: 1, opacity: 1, rotate: 0 }}
            animate={{ x, y, scale: 0.4, opacity: 0, rotate: Math.random() * 540 - 270 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          />
        );
      })}
    </div>
  );
}
