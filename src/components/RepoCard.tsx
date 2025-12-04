import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GitBranch, Star, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Repo } from '@shared/types';
interface RepoCardProps {
  repo: Repo;
}
export function RepoCard({ repo }: RepoCardProps) {
  const lastCommitTimestamp = repo.commits.length > 0
    ? Math.max(...repo.commits.map(c => c.timestamp))
    : repo.updatedAt;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}
      className="h-full"
    >
      <Card className="flex flex-col h-full transition-all duration-200 ease-in-out border-border/60 hover:border-primary/50">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl font-bold text-foreground">
              <Link to={`/repos/${repo.id}`} className="hover:text-primary transition-colors">
                {repo.name}
              </Link>
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-foreground">
                    <Star className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Star repository</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <CardDescription className="text-muted-foreground pt-1 h-10 overflow-hidden text-ellipsis">
            {repo.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <div className="flex flex-wrap gap-2">
            {repo.tags.map((tag) => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            <span>{repo.branches.length} {repo.branches.length === 1 ? 'branch' : 'branches'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{formatDistanceToNow(new Date(lastCommitTimestamp), { addSuffix: true })}</span>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}