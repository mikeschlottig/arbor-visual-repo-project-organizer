import { api } from './api-client';
import type { Repo, StorageAdapter, StorageAdapterName } from '@shared/types';
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
    const newRepo: Repo = {
      id: repoData.name.toLowerCase().replace(/\s+/g, '-'),
      name: repoData.name,
      description: repoData.description,
      tags: [],
      createdAt: now,
      updatedAt: now,
      defaultBranch: 'main',
      branches: [],
      commits: [],
      issues: [],
    };
    // In a real sql.js implementation, this would be an INSERT statement.
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