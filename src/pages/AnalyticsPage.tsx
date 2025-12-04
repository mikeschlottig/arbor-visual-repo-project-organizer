import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '@/lib/api-client';
import type { Repo, Commit, VFSFile } from '@shared/types';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Home, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const flattenTree = (node: any, files: VFSFile[] = []): VFSFile[] => {
  if (node.type === 'file') {
    files.push(node as VFSFile);
  } else if (node.type === 'folder' && node.children) {
    for (const child of node.children) {
      flattenTree(child, files);
    }
  }
  return files;
};
export default function AnalyticsPage() {
  const { repoId } = useParams<{ repoId: string }>();
  const [repo, setRepo] = useState<Repo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const fetchRepo = async () => {
      if (!repoId) return;
      try {
        setIsLoading(true);
        const data = await api<Repo>(`/api/repos/${repoId}`);
        setRepo(data);
      } catch (error) {
        toast.error('Failed to fetch repository data.');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRepo();
  }, [repoId]);
  const commitActivity = useMemo(() => {
    if (!repo) return [];
    const activity: { [key: string]: number } = {};
    repo.commits.forEach((commit: Commit) => {
      const date = format(new Date(commit.timestamp), 'yyyy-MM-dd');
      if (!activity[date]) {
        activity[date] = 0;
      }
      activity[date]++;
    });
    return Object.entries(activity)
      .map(([date, commits]) => ({ date, commits }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [repo]);
  const fileTypesData = useMemo(() => {
    if (!repo?.commits.length) return [];
    const latestCommit = repo.commits.sort((a, b) => b.timestamp - a.timestamp)[0];
    const allFiles = flattenTree(latestCommit.tree);
    const types: { [key: string]: number } = {};
    allFiles.forEach(file => {
      const extension = file.name.split('.').pop() || 'unknown';
      if (!types[extension]) {
        types[extension] = 0;
      }
      types[extension]++;
    });
    return Object.entries(types).map(([name, value]) => ({ name, value }));
  }, [repo]);
  const issuePRData = useMemo(() => {
    if (!repo) return [];
    return [
      { name: 'Issues', open: repo.issues.filter(i => i.status === 'open').length, closed: repo.issues.filter(i => i.status === 'closed').length },
      { name: 'PRs', open: repo.prs.filter(p => p.status === 'open').length, closed: repo.prs.filter(p => p.status !== 'open').length },
    ];
  }, [repo]);
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
      <AppLayout container>
        <div className="space-y-4">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-8 w-1/3" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </AppLayout>
    );
  }
  if (!repo) {
    return (
      <AppLayout container>
        <div className="text-center">
          <h2 className="text-2xl font-bold">Repository not found</h2>
        </div>
      </AppLayout>
    );
  }
  return (
    <AppLayout container>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem><BreadcrumbLink asChild><Link to="/"><Home className="h-4 w-4" /></Link></BreadcrumbLink></BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem><BreadcrumbLink asChild><Link to={`/repos/${repo.id}`}>{repo.name}</Link></BreadcrumbLink></BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>Analytics</BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <h1 className="text-4xl font-bold font-display mt-2">Analytics Dashboard</h1>
            </div>
            <Button onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" /> Export for AI
            </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Commit Activity</CardTitle>
              <CardDescription>Number of commits over time.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={commitActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="commits" stroke="#8884d8" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>File Types</CardTitle>
              <CardDescription>Distribution of file types in the latest commit.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={fileTypesData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                    {fileTypesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Issues & Pull Requests</CardTitle>
              <CardDescription>Overview of open and closed items.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={issuePRData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="open" fill="#10b981" />
                  <Bar dataKey="closed" fill="#6b7280" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}