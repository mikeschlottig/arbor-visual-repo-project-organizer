import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { GitBranch, GitCommit, Home, Loader2, ChevronsUpDown, Plus, Download, BarChart2, Search, BrainCircuit, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { Toaster, toast } from 'sonner';
import { api } from '@/lib/api-client';
import type { Repo, Branch, Commit, FileTree, VFSFile, PR, User } from '@shared/types';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FileTreeComponent from '@/components/FileTree';
import FileViewer from '@/components/FileViewer';
import { NotificationBell } from '@/components/NotificationBell';
import { PRList } from '@/components/PRList';
import { PRModal } from '@/components/PRModal';
import { MOCK_USERS } from '@shared/mock-data';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AIAssistant } from '@/components/AIAssistant';
import { ImportComponent } from '@/components/ImportComponent';
export default function RepoView() {
  const { repoId } = useParams<{ repoId: string }>();
  const navigate = useNavigate();
  const [repo, setRepo] = useState<Repo | null>(null);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [currentCommit, setCurrentCommit] = useState<Commit | null>(null);
  const [fileTree, setFileTree] = useState<FileTree | null>(null);
  const [selectedFile, setSelectedFile] = useState<VFSFile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [branchPopoverOpen, setBranchPopoverOpen] = useState(false);
  const [isPRModalOpen, setIsPRModalOpen] = useState(false);
  const [fileSearchQuery, setFileSearchQuery] = useState('');
  const [users] = useState<User[]>(MOCK_USERS);
  const fetchRepoData = useCallback(async () => {
    if (!repoId) return;
    try {
      const repoData = await api<Repo>(`/api/repos/${repoId}`);
      setRepo(repoData);
      if (!currentBranch || !repoData.branches.find(b => b.name === currentBranch.name)) {
        const defaultBranch = repoData.branches.find((b) => b.name === repoData.defaultBranch) || repoData.branches[0];
        if (defaultBranch) {
          setCurrentBranch(defaultBranch);
          const commit = repoData.commits.find((c) => c.id === defaultBranch.commitId);
          if (commit) {
            setCurrentCommit(commit);
            setFileTree(commit.tree);
          }
        }
      }
    } catch (error) {
      toast.error('Failed to load repository data.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [repoId, currentBranch]);
  useEffect(() => {
    setIsLoading(true);
    fetchRepoData();
  }, [repoId, fetchRepoData]);
  const handleBranchSelect = (branchName: string) => {
    const branch = repo?.branches.find((b) => b.name === branchName);
    if (branch && repo) {
      setCurrentBranch(branch);
      const commit = repo.commits.find((c) => c.id === branch.commitId);
      if (commit) {
        setCurrentCommit(commit);
        setFileTree(commit.tree);
        setSelectedFile(null);
      }
    }
    setBranchPopoverOpen(false);
  };
  const handlePRCreated = (newPR: PR) => {
    setRepo((prev) => prev ? { ...prev, prs: [newPR, ...prev.prs] } : null);
  };
  const handleMergePR = async (prId: string) => {
    if (!repo) return;
    const promise = api(`/api/repos/${repo.id}/prs/${prId}/merge`, {
      method: 'PUT',
      headers: { 'X-User-Id': 'u1' }
    }).then(() => fetchRepoData());
    toast.promise(promise, {
      loading: 'Merging pull request...',
      success: 'Pull request merged successfully!',
      error: 'Failed to merge pull request.'
    });
  };
  const handleExport = async () => {
    if (!repo) return;
    try {
        const data = await api<Repo>(`/api/repos/${repo.id}/export`, { method: 'POST' });
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${repo.name}-export.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Repository data exported successfully!');
    } catch (error) {
        toast.error('Failed to export repository data.');
    }
  };
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12">
        <Skeleton className="h-8 w-1/2 mb-4" />
        <div className="flex h-[calc(100vh-150px)] border rounded-lg">
          <Skeleton className="w-64 h-full" />
          <Skeleton className="flex-1 h-full" />
        </div>
      </div>
    );
  }
  if (!repo) {
    return <div className="p-8 text-center">Repository not found.</div>;
  }
  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="flex items-center justify-between px-4 py-2 border-b shrink-0">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink asChild><Link to="/"><Home className="h-4 w-4" /></Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink asChild><Link to="/">{repo.name}</Link></BreadcrumbLink></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleExport}><Download className="h-4 w-4 mr-2" /> Export</Button>
            <Button variant="ghost" size="sm" onClick={() => navigate(`/analytics/${repo.id}`)}><BarChart2 className="h-4 w-4 mr-2" /> Analytics</Button>
            <NotificationBell repo={repo} />
            <ThemeToggle className="relative top-0 right-0" />
        </div>
      </header>
      <main className="flex-grow overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={25} minSize={15} className="p-2 flex flex-col">
            <div className="p-2 space-y-4">
              <Popover open={branchPopoverOpen} onOpenChange={setBranchPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between">
                    <span className="flex items-center gap-2 truncate"><GitBranch className="h-4 w-4" />{currentBranch?.name ?? 'Select branch'}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0"><Command>
                    <CommandInput placeholder="Search branch..." /><CommandList><CommandEmpty>No branch found.</CommandEmpty><CommandGroup>
                        {repo.branches.map((branch) => <CommandItem key={branch.name} value={branch.name} onSelect={() => handleBranchSelect(branch.name)}>{branch.name}</CommandItem>)}
                    </CommandGroup></CommandList>
                </Command></PopoverContent>
              </Popover>
              <Button variant="outline" className="w-full" onClick={() => setIsPRModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> New Pull Request
              </Button>
            </div>
            <div className="px-2 pb-2">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search files..." className="pl-8" value={fileSearchQuery} onChange={e => setFileSearchQuery(e.target.value)} />
                </div>
            </div>
            <div className="border-t mt-2 pt-2 flex-grow"><ScrollArea className="h-full">
                {fileTree ? <FileTreeComponent tree={fileTree} onSelectFile={setSelectedFile} selectedFileId={selectedFile?.id} searchQuery={fileSearchQuery} /> : <div className="p-4 text-sm text-muted-foreground">No files in this commit.</div>}
            </ScrollArea></div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={75} minSize={25}>
            <Tabs defaultValue="files" className="h-full flex flex-col">
                <div className="px-4 pt-4">
                    <TabsList>
                        <TabsTrigger value="files">Files</TabsTrigger>
                        <TabsTrigger value="prs">Pull Requests <Badge variant="secondary" className="ml-2">{repo.prs.length}</Badge></TabsTrigger>
                        <TabsTrigger value="issues">Issues <Badge variant="secondary" className="ml-2">{repo.issues.length}</Badge></TabsTrigger>
                        <TabsTrigger value="import" className="flex items-center gap-1">
                          <Upload className="h-4 w-4" /> Import
                        </TabsTrigger>
                        <TabsTrigger value="ai" className="flex items-center gap-1">
                          <BrainCircuit className="h-4 w-4" /> AI
                        </TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value="files" className="flex-grow overflow-auto p-4"><FileViewer file={selectedFile} /></TabsContent>
                <TabsContent value="prs" className="flex-grow overflow-auto p-4"><PRList prs={repo.prs} onMerge={handleMergePR} /></TabsContent>
                <TabsContent value="issues" className="flex-grow overflow-auto p-4"><p>Issues view coming soon.</p></TabsContent>
                <TabsContent value="import" className="flex-grow overflow-auto p-4">
                  <ImportComponent repo={repo} fileTree={fileTree} onTreeUpdate={setFileTree} currentDirId={selectedFile?.parentId || fileTree?.id || 'root'} />
                </TabsContent>
                <TabsContent value="ai" className="flex-grow overflow-auto">
                  <AIAssistant repo={repo} fileTree={fileTree} selectedFile={selectedFile} />
                </TabsContent>
            </Tabs>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
      <PRModal isOpen={isPRModalOpen} onOpenChange={setIsPRModalOpen} repo={repo} onPRCreated={handlePRCreated} />
      <Toaster richColors />
    </div>);
}