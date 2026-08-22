import { useState } from 'react';
import { MoreHorizontal, Pencil, Trash2, Flag } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from './ui/alert-dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { renameChannel, deleteChannel, reportChannel } from '@/lib/channelOverrides';
import { sendChannelReportEmail, isReportEmailConfigured } from '@/lib/reportEmail';
import { cn } from '@/lib/utils';

interface ChannelMenuProps {
  id: string;
  name: string;
  className?: string;
}

const REPORT_REASONS = [
  'Broken stream',
  'Inappropriate content',
  'Copyright issue',
  'Misleading information',
  'Other',
];

/**
 * Functional three-dot menu on every channel card. All actions actually do
 * something, persisted to localStorage: Rename edits and saves the channel
 * name, Delete removes the channel after confirmation, Report stores a
 * submitted report for the channel.
 */
const ChannelMenu = ({ id, name, className }: ChannelMenuProps) => {
  const { toast } = useToast();
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [newName, setNewName] = useState(name);
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');

  const openRename = () => {
    setNewName(name);
    setRenameOpen(true);
  };

  const handleSaveRename = () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      toast({ title: 'Name required', description: 'Channel name cannot be empty.', variant: 'destructive' });
      return;
    }
    renameChannel(id, trimmed);
    setRenameOpen(false);
    toast({ title: 'Channel renamed', description: `Now shown as "${trimmed}".` });
  };

  const handleDelete = () => {
    deleteChannel(id);
    setDeleteOpen(false);
    toast({ title: 'Channel deleted', description: `${name} was removed.` });
  };

  const handleReport = async () => {
    // Keep the existing local record regardless of email delivery.
    reportChannel(id, reason, details || undefined);
    setReportOpen(false);
    setDetails('');

    if (!isReportEmailConfigured()) {
      toast({ title: 'Report saved', description: `We recorded your report about ${name}.` });
      return;
    }

    const sent = await sendChannelReportEmail({ channelId: id, channelName: name, reason, details });
    if (sent) {
      toast({ title: 'Report submitted', description: `Thanks — your report about ${name} was emailed to our team.` });
    } else {
      toast({
        title: 'Report saved locally',
        description: `We could not email it right now, but your report about ${name} was recorded.`,
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            aria-label={`Options for ${name}`}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              className
            )}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onSelect={openRename}>
            <Pencil className="mr-2 h-4 w-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setDeleteOpen(true)} className="text-destructive focus:text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setReportOpen(true)}>
            <Flag className="mr-2 h-4 w-4" />
            Report
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Rename dialog — edit and save the channel name */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename channel</DialogTitle>
            <DialogDescription>Change the display name for {name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={`rename-${id}`}>Channel name</Label>
            <Input
              id={`rename-${id}`}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveRename();
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRename}>Save name</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the channel from the app. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
              Delete channel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Report dialog — choose a reason, submit the report */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report {name}</DialogTitle>
            <DialogDescription>Tell us what's wrong with this channel.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <RadioGroup value={reason} onValueChange={setReason}>
              {REPORT_REASONS.map((r) => (
                <div key={r} className="flex items-center gap-2">
                  <RadioGroupItem value={r} id={`report-${id}-${r}`} />
                  <Label htmlFor={`report-${id}-${r}`} className="cursor-pointer text-sm">
                    {r}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <div className="space-y-2">
              <Label htmlFor={`details-${id}`}>Details (optional)</Label>
              <Textarea
                id={`details-${id}`}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Add any extra information…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReport}>Submit report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChannelMenu;
