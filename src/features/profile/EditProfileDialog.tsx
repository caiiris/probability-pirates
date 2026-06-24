import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { changeUsername, updateProfile } from '@/features/auth/userService';

const BIO_MAX = 150;
const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

type Props = {
  uid: string;
  /** Lowercased lookup key (the `/usernames` sentinel id). */
  currentUsername: string;
  /** Cased label shown to others. */
  currentDisplayUsername: string;
  currentBio: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditProfileDialog({
  uid,
  currentUsername,
  currentDisplayUsername,
  currentBio,
  open,
  onOpenChange,
}: Props) {
  const [displayUsername, setDisplayUsername] = useState(currentDisplayUsername);
  const [bio, setBio] = useState(currentBio);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Sync fields from the latest profile when the dialog opens (handles remote updates)
  useEffect(() => {
    if (open) {
      setDisplayUsername(currentDisplayUsername);
      setBio(currentBio);
      setError('');
    }
  }, [open, currentDisplayUsername, currentBio]);

  const usernameTrimmed = displayUsername.trim();
  const bioTrimmed = bio.trim();
  const overLimit = bio.length > BIO_MAX;
  const usernameChanged = usernameTrimmed !== currentDisplayUsername;
  const usernameValid = USERNAME_RE.test(usernameTrimmed);
  const canSave = !overLimit && !saving && (!usernameChanged || usernameValid);

  async function handleSave() {
    if (overLimit || saving) return;
    setSaving(true);
    setError('');

    if (usernameChanged) {
      if (!usernameValid) {
        setError('Usernames are 3 to 20 characters: letters, numbers, and underscores only.');
        setSaving(false);
        return;
      }
      const result = await changeUsername({
        newUsername: usernameTrimmed,
        currentUsername,
      });
      if (!result.ok) {
        setError(result.error.message);
        setSaving(false);
        return;
      }
    }

    if (bioTrimmed !== currentBio) {
      const result = await updateProfile(uid, { bio: bioTrimmed });
      if (!result.ok) {
        setError(result.error.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    onOpenChange(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      // discard on close
      setDisplayUsername(currentDisplayUsername);
      setBio(currentBio);
      setError('');
    }
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
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              autoComplete="username"
              value={displayUsername}
              onChange={(e) => {
                setDisplayUsername(e.target.value);
                if (error) setError('');
              }}
              placeholder="yourname"
              className={usernameChanged && !usernameValid ? 'border-destructive' : ''}
              aria-describedby="username-hint"
            />
            <p id="username-hint" className="text-xs text-muted-foreground">
              3 to 20 characters: letters, numbers, and underscores.
            </p>
          </div>

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
