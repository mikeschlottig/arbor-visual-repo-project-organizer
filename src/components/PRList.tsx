import React from 'react';
import { motion } from 'framer-motion';
import { GitPullRequest, GitMerge, AlertTriangle, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { PR, PRStatus } from '@shared/types';
import { cn } from '@/lib/utils';
interface PRListProps {
  prs: PR[];
  onMerge: (prId: string) => void;
}
const statusConfig: Record<PRStatus, { color: string; icon: React.ReactNode }> = {
  open: { color: 'bg-pr-open', icon: <GitPullRequest className="h-4 w-4" /> },
  merged: { color: 'bg-pr-merged', icon: <GitMerge className="h-4 w-4" /> },
  closed: { color: 'bg-pr-closed', icon: <GitPullRequest className="h-4 w-4" /> },
};
function PRCard({ pr, onMerge }: { pr: PR; onMerge: (prId: string) => void }) {
  const config = statusConfig[pr.status];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-base font-semibold pr-4">{pr.title}</CardTitle>
            <Badge variant="outline" className="capitalize flex items-center gap-1.5 whitespace-nowrap">
              <span className={cn("h-2 w-2 rounded-full", config.color)} />
              {pr.status}
            </Badge>
          </div>
          <CardDescription className="text-xs">
            #{pr.number} opened {formatDistanceToNow(new Date(pr.createdAt), { addSuffix: true })}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm">
          <p className="text-muted-foreground">
            <Badge variant="secondary" className="font-mono">{pr.sourceBranch}</Badge> → <Badge variant="secondary" className="font-mono">{pr.targetBranch}</Badge>
          </p>
          {pr.conflicts && (
            <div className="mt-2 flex items-center text-destructive text-xs font-medium">
              <AlertTriangle className="h-4 w-4 mr-1" /> Conflicts detected
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
            <div className="flex items-center text-muted-foreground text-sm">
                <MessageSquare className="h-4 w-4 mr-1.5" /> 1
            </div>
            {pr.status === 'open' && (
                <Button size="sm" onClick={() => onMerge(pr.id)} disabled={pr.conflicts}>
                    <GitMerge className="h-4 w-4 mr-2" /> Merge
                </Button>
            )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}
export function PRList({ prs, onMerge }: PRListProps) {
  const openPRs = prs.filter(p => p.status === 'open');
  const mergedPRs = prs.filter(p => p.status === 'merged');
  const closedPRs = prs.filter(p => p.status === 'closed');
  return (
    <Tabs defaultValue="open">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="open">Open ({openPRs.length})</TabsTrigger>
        <TabsTrigger value="merged">Merged ({mergedPRs.length})</TabsTrigger>
        <TabsTrigger value="closed">Closed ({closedPRs.length})</TabsTrigger>
      </TabsList>
      <div className="mt-4 space-y-4">
        <TabsContent value="open">
          <div className="space-y-3">
            {openPRs.map(pr => <PRCard key={pr.id} pr={pr} onMerge={onMerge} />)}
          </div>
        </TabsContent>
        <TabsContent value="merged">
          <div className="space-y-3">
            {mergedPRs.map(pr => <PRCard key={pr.id} pr={pr} onMerge={onMerge} />)}
          </div>
        </TabsContent>
        <TabsContent value="closed">
          <div className="space-y-3">
            {closedPRs.map(pr => <PRCard key={pr.id} pr={pr} onMerge={onMerge} />)}
          </div>
        </TabsContent>
      </div>
    </Tabs>
  );
}