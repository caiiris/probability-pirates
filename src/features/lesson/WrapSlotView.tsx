import type { WrapSlot } from '@/content/types';

type Props = { slot: WrapSlot };

export function WrapSlotView({ slot }: Props) {
  // Vertically centered for short wrap-ups (`my-auto`); long ones collapse the
  // auto-margins and scroll from the top. Centered horizontally to match the
  // concept slots' visual rhythm.
  return (
    <div className="min-h-full flex flex-col">
      <div className="my-auto flex flex-col gap-6 px-4 py-8 max-w-sm mx-auto w-full text-center">
        <h2 className="text-2xl font-bold leading-tight">{slot.title}</h2>
        <p className="text-base text-muted-foreground leading-relaxed">{slot.body}</p>
      </div>
    </div>
  );
}
