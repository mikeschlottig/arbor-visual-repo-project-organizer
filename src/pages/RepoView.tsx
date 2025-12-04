import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { GitBranch, GitCommit, Tag, Home, Loader2, ChevronsUpDown, Plus, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { Toaster, toast } from 'sonner';
import { api } from '@/lib/api-client';
import type { Repo, Branch, Commit, FileTree, VFSFile } from '@shared/types';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import FileTreeComponent from '@/components/FileTree';
import FileViewer from '@/components/FileViewer';
import { cn } from '@/lib/utils';
export default function RepoView() {
  const { repoId } = useParams<{ repoId: string }>();
  const [repo, setRepo] = useState<Repo | null>(null);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [currentCommit, setCurrentCommit] = useState<Commit | null>(null);
  const [fileTree, setFileTree] = useState<FileTree | null>(null);
  const [selectedFile, setSelectedFile] = useState<VFSFile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [branchPopoverOpen, setBranchPopoverOpen] = useState(false);
  useEffect(() => {
    if (!repoId) return;
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const repoData = await api<Repo>(`/api/repos/${repoId}`);
        setRepo(repoData);
        const mainBranch = repoData.branches.find(b => b.name === repoData.defaultBranch);
        if (mainBranch) {
          setCurrentBranch(mainBranch);
          const mainCommit = repoData.commits.find(c => c.id === mainBranch.commitId);
          if (mainCommit) {
            setCurrentCommit(mainCommit);
            setFileTree(mainCommit.tree);
          }
        }
      } catch (error) {
        toast.error('Failed to load repository data.');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [repoId]);
  const sortedCommits = useMemo(() => {
    return repo?.commits.sort((a, b) => b.timestamp - a.timestamp) ?? [];
  }, [repo]);
  const handleBranchSelect = (branchName: string) => {
    const branch = repo?.branches.find(b => b.name === branchName);
    if (branch) {
      setCurrentBranch(branch);
      const commit = repo.commits.find(c => c.id === branch.commitId);
      if (commit) {
        setCurrentCommit(commit);
        setFileTree(commit.tree);
        setSelectedFile(null);
      }
    }
    setBranchPopoverOpen(false);
  };
  if (isLoading) {
    return (
      <div className="p-4 max-w-7xl mx-auto">
        <Skeleton className="h-8 w-1/2 mb-4" />
        <div className="flex h-[calc(100vh-100px)] border rounded-lg">
          <Skeleton className="w-64 h-full" />
          <Skeleton className="flex-1 h-full" />
          <Skeleton className="w-96 h-full" />
        </div>
      </div>
    );
  }
  if (!repo) {
    return <div className="p-8 text-center">Repository not found.</div>;
  }
  return (
    <div className="h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 py-2 border-b shrink-0">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/"><Home className="h-4 w-4" /></Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">{repo.name}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <ThemeToggle className="relative top-0 right-0" />
      </header>
      <main className="flex-grow overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={20} minSize={15} className="p-2 flex flex-col">
            <div className="p-2 space-y-4">
              <Popover open={branchPopoverOpen} onOpenChange={setBranchPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={branchPopoverOpen} className="w-full justify-between">
                    <span className="flex items-center gap-2 truncate">
                      <GitBranch className="h-4 w-4" />
                      {currentBranch?.name ?? 'Select branch'}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Search branch..." />
                    <CommandList>
                      <CommandEmpty>No branch found.</CommandEmpty>
                      <CommandGroup>
                        {repo.branches.map((branch) => (
                          <CommandItem key={branch.name} value={branch.name} onSelect={() => handleBranchSelect(branch.name)}>
                            {branch.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <div className="flex gap-2">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="w-full text-sm"><GitCommit className="mr-2 h-4 w-4" /> Commits</Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <SheetHeader><SheetTitle>Commit History</SheetTitle></SheetHeader>
                    <ScrollArea className="h-[calc(100%-4rem)] mt-4">
                      {sortedCommits.map(commit => (
                        <div key={commit.id} className="p-2 border-b">
                          <p className="font-medium">{commit.message}</p>
                          <p className="text-sm text-muted-foreground">{commit.author.name}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(commit.timestamp), 'MMM d, yyyy')}</p>
                        </div>
                      ))}
                    </ScrollArea>
                  </SheetContent>
                </Sheet>
                <Button variant="outline" className="w-full text-sm"><Tag className="mr-2 h-4 w-4" /> Tags</Button>
                <Button variant="outline" className="w-full text-sm"><MessageSquare className="mr-2 h-4 w-4" /> Issues</Button>
              </div>
            </div>
            <div className="border-t mt-2 pt-2 flex-grow">
              <ScrollArea className="h-full">
                {fileTree ? (
                  <FileTreeComponent tree={fileTree} onSelectFile={setSelectedFile} selectedFileId={selectedFile?.id} />
                ) : (
                  <div className="p-4 text-sm text-muted-foreground">No files in this commit.</div>
                )}
              </ScrollArea>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={55} minSize={30}>
            <div className="h-full p-4 overflow-auto">
              <FileViewer file={selectedFile} />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
      <Toaster />
    </div>
  );
}