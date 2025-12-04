import React, { useState } from 'react';
import { GitMerge, GitPullRequest, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Repo, PR } from '@shared/types';
interface PRModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  repo: Repo;
  onPRCreated: (newPR: PR) => void;
}
export function PRModal({ isOpen, onOpenChange, repo, onPRCreated }: PRModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sourceBranch, setSourceBranch] = useState('');
  const [targetBranch, setTargetBranch] = useState(repo.defaultBranch);
  const [isCreating, setIsCreating] = useState(false);
  const handleCreatePR = async () => {
    if (!title.trim() || !sourceBranch || !targetBranch) {
      toast.error('Title, source branch, and target branch are required.');
      return;
    }
    if (sourceBranch === targetBranch) {
      toast.error('Source and target branches cannot be the same.');
      return;
    }
    setIsCreating(true);
    try {
      const newPR = await api<PR>(`/api/repos/${repo.id}/prs`, {
        method: 'POST',
        body: JSON.stringify({ title, description, sourceBranch, targetBranch }),
        headers: { 'X-User-Id': 'u1' } // Mock user
      });
      toast.success(`Pull Request #${newPR.number} created!`);
      onPRCreated(newPR);
      onOpenChange(false);
      // Reset form
      setTitle('');
      setDescription('');
      setSourceBranch('');
    } catch (error: any) {
      toast.error(`Failed to create PR: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitPullRequest /> Create a new Pull Request
          </DialogTitle>
          <DialogDescription>
            Propose changes by creating a pull request from one branch to another.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-4">
            <div className="w-1/2">
              <Label htmlFor="source-branch">From</Label>
              <Select value={sourceBranch} onValueChange={setSourceBranch}>
                <SelectTrigger id="source-branch"><SelectValue placeholder="Select branch" /></SelectTrigger>
                <SelectContent>
                  {repo.branches.map(b => <SelectItem key={b.name} value={b.name}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="w-1/2">
              <Label htmlFor="target-branch">To</Label>
              <Select value={targetBranch} onValueChange={setTargetBranch}>
                <SelectTrigger id="target-branch"><SelectValue placeholder="Select branch" /></SelectTrigger>
                <SelectContent>
                  {repo.branches.map(b => <SelectItem key={b.name} value={b.name}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="feat: Add new feature" />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide a detailed description of your changes." />
          </div>
          {sourceBranch && targetBranch && sourceBranch !== targetBranch && (
             <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Able to merge</AlertTitle>
                <AlertDescription>
                    These branches can be automatically merged.
                </AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreatePR} disabled={isCreating}>
            {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GitMerge className="mr-2 h-4 w-4" />}
            Create Pull Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}