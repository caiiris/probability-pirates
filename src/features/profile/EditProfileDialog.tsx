import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { updateProfile } from '@/features/auth/userService';

const BIO_MAX = 150;

type Props = {
  uid: string;
  currentBio: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditProfileDialog({ uid, currentBio, open, onOpenChange }: Props) {
  const [bio, setBio] = useState(currentBio);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Sync bio from latest profile when the dialog opens (handles remote updates)
  useEffect(() => {
    if (open) setBio(currentBio);
  }, [open, currentBio]);

  const bioTrimmed = bio.trim();
  const overLimit = bio.length > BIO_MAX;
  const canSave = !overLimit && !saving;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setError('');
    const result = await updateProfile(uid, { bio: bioTrimmed });
    setSaving(false);
    if (result.ok) {
      onOpenChange(false);
    } else {
      setError(result.error.message);
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next) setBio(currentBio); // discard on close
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              rows={3}
              maxLength={BIO_MAX + 10}
              value={bio}
              onChange={(e) => {
                setBio(e.target.value);
                if (error) setError('');
              }}
              placeholder="Tell other learners about yourself."
              className={overLimit ? 'border-destructive' : ''}
              aria-describedby="bio-counter"
            />
            <p
              id="bio-counter"
              className={`text-xs text-right ${overLimit ? 'text-destructive' : 'text-muted-foreground'}`}
            >
              {bio.length} / {BIO_MAX}
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">{error}</p>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
