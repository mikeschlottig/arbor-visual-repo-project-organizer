import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Toaster, toast } from 'sonner';
import { api } from '@/lib/api-client';
import type { Repo } from '@shared/types';
import { RepoCard } from '@/components/RepoCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { AppLayout } from '@/components/layout/AppLayout';
export function HomePage() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoDesc, setNewRepoDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  useEffect(() => {
    const fetchRepos = async () => {
      try {
        setIsLoading(true);
        const data = await api<Repo[]>('/api/repos');
        setRepos(data);
      } catch (error) {
        toast.error('Failed to fetch repositories.');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRepos();
  }, []);
  const handleCreateRepo = async () => {
    if (!newRepoName.trim()) {
      toast.error('Repository name is required.');
      return;
    }
    setIsCreating(true);
    try {
      const newRepo = await api<Repo>('/api/repos', {
        method: 'POST',
        body: JSON.stringify({ name: newRepoName, description: newRepoDesc })
      });
      setRepos((prev) => [newRepo, ...prev]);
      toast.success(`Repository "${newRepo.name}" created successfully!`);
      setNewRepoName('');
      setNewRepoDesc('');
      setIsSheetOpen(false);
    } catch (error: any) {
      toast.error(`Failed to create repository: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };
  const filteredRepos = useMemo(() =>
    repos.filter((repo) =>
      repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repo.description.toLowerCase().includes(searchTerm.toLowerCase())
    ), [repos, searchTerm]);
  return (
    <AppLayout>
      <div className="min-h-screen bg-background text-foreground">
        <ThemeToggle className="fixed top-4 right-4 z-50" />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-16 md:py-24 lg:py-32 text-center">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}>
              <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-orange-100/50 to-transparent dark:from-indigo-900/20 -z-10" />
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold font-display tracking-tighter">
                Arbor Repositories
              </h1>
              <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground">
                A visual way to organize, version, and collaborate on your projects.
                Built on Cloudflare.
              </p>
            </motion.div>
          </div>
          <div className="space-y-8 pb-24">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search repositories..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button className="w-full md:w-auto btn-gradient shadow-primary hover:shadow-glow transition-all duration-300">
                    <Plus className="mr-2 h-4 w-4" /> New Repository
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Create a new repository</SheetTitle>
                    <SheetDescription>
                      A repository contains all your project's files, including the revision history.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">Name</Label>
                      <Input id="name" value={newRepoName} onChange={(e) => setNewRepoName(e.target.value)} className="col-span-3" placeholder="my-awesome-project" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="description" className="text-right">Description</Label>
                      <Textarea id="description" value={newRepoDesc} onChange={(e) => setNewRepoDesc(e.target.value)} className="col-span-3" placeholder="A short description of your project." />
                    </div>
                  </div>
                  <SheetFooter>
                    <Button onClick={handleCreateRepo} disabled={isCreating}>
                      {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Repository
                    </Button>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            </div>
            {isLoading ?
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) =>
              <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full mt-2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-1/4" />
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-4 w-1/3" />
                    </CardFooter>
                  </Card>
              )}
              </div> :
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={{
                  hidden: { opacity: 0 },
                  show: {
                      opacity: 1,
                      transition: {
                          staggerChildren: 0.1
                      }
                  }
              }}
              initial="hidden"
              animate="show"
            >
                {filteredRepos.map((repo) =>
              <RepoCard key={repo.id} repo={repo} />
              )}
              </motion.div>
            }
          </div>
        </main>
        <footer className="text-center py-6 text-sm text-muted-foreground border-t">
          Built with ��️ at Cloudflare
        </footer>
        <Toaster richColors />
      </div>
    </AppLayout>
  );
}