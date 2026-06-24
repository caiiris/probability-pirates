import { Brandmark } from '@/components/Brandmark';
import { OceanScene } from '@/features/course/OceanScene';

/**
 * The sign-in / sign-up banner: the same treasure-map sea the rest of the app
 * sails across, so the very first screen sets the adventure tone instead of a
 * generic auth form. Decorative motion is reduced-motion-safe via MotionConfig.
 */
export function AuthHero() {
  return (
    <OceanScene>
      <div className="flex flex-col items-center gap-1.5 py-3 text-center">
        <Brandmark size={48} />
        <h1 className="font-display text-2xl font-bold tracking-tight text-[color:var(--ink)]">
          Probability Pirates
        </h1>
        <p className="text-sm text-[color:var(--ink)]/75">Probability, one voyage at a time.</p>
      </div>
    </OceanScene>
  );
}
