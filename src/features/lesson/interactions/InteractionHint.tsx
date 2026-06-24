import { X } from 'lucide-react';

type Props = {
  text: string;
  onDismiss: () => void;
};

export function InteractionHint({ text, onDismiss }: Props) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-muted-foreground text-sm">
      <span className="flex-1">{text}</span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss hint"
        className="shrink-0 p-0.5 rounded hover:bg-muted-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
