import { api } from './api-client';
import type { Repo, StorageAdapter, StorageAdapterName, Commit, FileTree } from '@shared/types';
import localforage from 'localforage';
// Configure localforage for IndexedDB
localforage.config({
  name: 'ArborDB',
  storeName: 'arbor_store',
  description: 'Local storage for Arbor repositories',
});
/**
 * DoAdapter: Interacts with the Cloudflare Durable Object backend via API.
 */
class DoAdapter implements StorageAdapter {
  name: StorageAdapterName = 'do';
  async getRepos(): Promise<Repo[]> {
    return api<Repo[]>('/api/repos');
  }
  async getRepo(id: string): Promise<Repo | null> {
    try {
      return await api<Repo>(`/api/repos/${id}`);
    } catch (error) {
      console.error(`Failed to fetch repo ${id} from DO`, error);
      return null;
    }
  }
  async createRepo(repoData: { name: string; description: string }): Promise<Repo> {
    return api<Repo>('/api/repos', {
      method: 'POST',
      body: JSON.stringify(repoData),
    });
  }
}
/**
 * LocalAdapter: Interacts with local storage (IndexedDB via localforage).
 * Simulates sql.js behavior for this phase.
 */
class LocalAdapter implements StorageAdapter {
  name: StorageAdapterName = 'local';
  private REPOS_KEY = 'local_repos';
  async getRepos(): Promise<Repo[]> {
    const repos = await localforage.getItem<Repo[]>(this.REPOS_KEY);
    return repos || [];
  }
  async getRepo(id: string): Promise<Repo | null> {
    const repos = await this.getRepos();
    return repos.find(r => r.id === id) || null;
  }
  async createRepo(repoData: { name: string; description: string }): Promise<Repo> {
    const repos = await this.getRepos();
    const now = Date.now();
    const initialTree: FileTree = { id: crypto.randomUUID(), name: 'root', path: '/', type: 'folder', parentId: null, createdAt: now, updatedAt: now, children: [] };
    const initialCommit: Commit = { id: crypto.randomUUID(), message: 'Initial commit', timestamp: now, author: { name: 'Local User', email: 'local@arbor.dev' }, tree: initialTree };
    // Mock AI auto-tagging
    const aiTags: string[] = [];
    if (repoData.name.toLowerCase().includes('ui') || repoData.description.toLowerCase().includes('design')) {
        aiTags.push('design-system');
    }
    if (repoData.name.toLowerCase().includes('api') || repoData.description.toLowerCase().includes('backend')) {
        aiTags.push('backend');
    }
    const newRepo: Repo = {
      id: repoData.name.toLowerCase().replace(/\s+/g, '-'),
      name: repoData.name,
      description: repoData.description,
      tags: aiTags,
      createdAt: now,
      updatedAt: now,
      defaultBranch: 'main',
      branches: [{ name: 'main', commitId: initialCommit.id }],
      commits: [initialCommit],
      issues: [],
      prs: [],
      comments: [],
      roles: {},
    };
    const updatedRepos = [...repos, newRepo];
    await localforage.setItem(this.REPOS_KEY, updatedRepos);
    return newRepo;
  }
}
// Future D1 Adapter
class D1Adapter implements StorageAdapter {
    name: StorageAdapterName = 'd1';
    async getRepos(): Promise<Repo[]> { console.warn("D1 adapter not implemented"); return []; }
    async getRepo(id: string): Promise<Repo | null> { console.warn("D1 adapter not implemented"); return null; }
    async createRepo(repoData: { name: string; description: string; }): Promise<Repo> {
        console.warn("D1 adapter not implemented");
        throw new Error("D1 adapter not implemented");
    }
}
export const adapters = {
  do: new DoAdapter(),
  local: new LocalAdapter(),
  d1: new D1Adapter(),
};
export function getStorageAdapter(name: StorageAdapterName): StorageAdapter {
  return adapters[name];
}