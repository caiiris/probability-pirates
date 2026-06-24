import { Coin } from '@/components/illustrations/Coin';

type Props = {
  coins: number;
  /** Larger emphasis for the wallet card vs the compact header chip. */
  size?: 'sm' | 'md';
  className?: string;
};

/** Compact coin-balance pill. Gold coin + tabular number. */
export function CoinChip({ coins, size = 'sm', className = '' }: Props) {
  const iconSize = size === 'md' ? 'w-6 h-6' : 'w-5 h-5';
  const textSize = size === 'md' ? 'text-base' : 'text-sm';
  return (
    <span
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card shadow-soft ${className}`}
      aria-label={`${coins} coins`}
    >
      <span className="text-amber-base">
        <Coin className={iconSize} />
      </span>
      <span className={`font-bold text-foreground leading-none ${textSize}`}>
        {coins.toLocaleString()}
      </span>
    </span>
  );
}
