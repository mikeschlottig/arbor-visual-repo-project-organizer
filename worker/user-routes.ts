import { Hono } from "hono";
import type { Env } from './core-utils';
import { UserEntity, ChatBoardEntity, RepoEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import type { Commit, FileTree, Repo, SyncQueueItem } from "@shared/types";
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  app.get('/api/test', (c) => c.json({ success: true, data: { name: 'CF Workers Demo' }}));
  // USERS
  app.get('/api/users', async (c) => {
    await UserEntity.ensureSeed(c.env);
    const cq = c.req.query('cursor');
    const lq = c.req.query('limit');
    const page = await UserEntity.list(c.env, cq ?? null, lq ? Math.max(1, (Number(lq) | 0)) : undefined);
    return ok(c, page);
  });
  app.post('/api/users', async (c) => {
    const { name } = (await c.req.json()) as { name?: string };
    if (!name?.trim()) return bad(c, 'name required');
    return ok(c, await UserEntity.create(c.env, { id: crypto.randomUUID(), name: name.trim() }));
  });
  // CHATS
  app.get('/api/chats', async (c) => {
    await ChatBoardEntity.ensureSeed(c.env);
    const cq = c.req.query('cursor');
    const lq = c.req.query('limit');
    const page = await ChatBoardEntity.list(c.env, cq ?? null, lq ? Math.max(1, (Number(lq) | 0)) : undefined);
    return ok(c, page);
  });
  app.post('/api/chats', async (c) => {
    const { title } = (await c.req.json()) as { title?: string };
    if (!title?.trim()) return bad(c, 'title required');
    const created = await ChatBoardEntity.create(c.env, { id: crypto.randomUUID(), title: title.trim(), messages: [] });
    return ok(c, { id: created.id, title: created.title });
  });
  // MESSAGES
  app.get('/api/chats/:chatId/messages', async (c) => {
    const chat = new ChatBoardEntity(c.env, c.req.param('chatId'));
    if (!await chat.exists()) return notFound(c, 'chat not found');
    return ok(c, await chat.listMessages());
  });
  app.post('/api/chats/:chatId/messages', async (c) => {
    const chatId = c.req.param('chatId');
    const { userId, text } = (await c.req.json()) as { userId?: string; text?: string };
    if (!isStr(userId) || !text?.trim()) return bad(c, 'userId and text required');
    const chat = new ChatBoardEntity(c.env, chatId);
    if (!await chat.exists()) return notFound(c, 'chat not found');
    return ok(c, await chat.sendMessage(userId, text.trim()));
  });
  // --- Arbor Routes ---
  // REPOS
  app.get('/api/repos', async (c) => {
    await RepoEntity.ensureSeed(c.env);
    const page = await RepoEntity.list(c.env, null, 100); // Get up to 100 repos
    return ok(c, page.items);
  });
  app.post('/api/repos', async (c) => {
    const { name, description } = (await c.req.json()) as { name?: string, description?: string };
    if (!isStr(name)) return bad(c, 'Repository name is required');
    const now = Date.now();
    const initialTree: FileTree = { id: crypto.randomUUID(), name: 'root', path: '/', type: 'folder', parentId: null, createdAt: now, updatedAt: now, children: [] };
    const initialCommit: Commit = { id: crypto.randomUUID(), message: 'Initial commit', timestamp: now, author: { name: 'Arbor System', email: 'system@arbor.dev' }, tree: initialTree };
    const newRepo: Repo = {
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      description: description ?? '',
      tags: [],
      createdAt: now,
      updatedAt: now,
      defaultBranch: 'main',
      branches: [{ name: 'main', commitId: initialCommit.id }],
      commits: [initialCommit],
      issues: [],
    };
    const repoEntity = new RepoEntity(c.env, newRepo.id);
    if (await repoEntity.exists()) return bad(c, 'Repository with this name already exists');
    await RepoEntity.create(c.env, newRepo);
    return ok(c, newRepo);
  });
  app.get('/api/repos/:id', async (c) => {
    const { id } = c.req.param();
    const repo = new RepoEntity(c.env, id);
    if (!await repo.exists()) return notFound(c, 'Repository not found');
    return ok(c, await repo.getState());
  });
  // BRANCHES
  app.get('/api/repos/:id/branches', async (c) => {
    const { id } = c.req.param();
    const repo = new RepoEntity(c.env, id);
    if (!await repo.exists()) return notFound(c, 'Repository not found');
    const state = await repo.getState();
    return ok(c, state.branches);
  });
  app.post('/api/repos/:id/branches', async (c) => {
    const { id } = c.req.param();
    const { newBranchName, fromBranchName } = (await c.req.json()) as { newBranchName?: string, fromBranchName?: string };
    if (!isStr(newBranchName) || !isStr(fromBranchName)) return bad(c, 'newBranchName and fromBranchName are required');
    const repo = new RepoEntity(c.env, id);
    if (!await repo.exists()) return notFound(c, 'Repository not found');
    try {
      const newBranch = await repo.createBranch(newBranchName, fromBranchName);
      return ok(c, newBranch);
    } catch (e: any) {
      return bad(c, e.message);
    }
  });
  // COMMITS
  app.get('/api/repos/:id/commits', async (c) => {
    const { id } = c.req.param();
    const repo = new RepoEntity(c.env, id);
    if (!await repo.exists()) return notFound(c, 'Repository not found');
    const state = await repo.getState();
    return ok(c, state.commits);
  });
  app.post('/api/repos/:id/commits', async (c) => {
    const { id } = c.req.param();
    const { branchName, message, tree } = (await c.req.json()) as { branchName?: string, message?: string, tree?: FileTree };
    if (!isStr(branchName) || !isStr(message) || !tree) return bad(c, 'branchName, message, and tree are required');
    const repo = new RepoEntity(c.env, id);
    if (!await repo.exists()) return notFound(c, 'Repository not found');
    try {
      const newCommit = await repo.createCommit(branchName, message, tree);
      return ok(c, newCommit);
    } catch (e: any) {
      return bad(c, e.message);
    }
  });
  // TREE
  app.get('/api/repos/:id/tree', async (c) => {
    const { id } = c.req.param();
    const commitId = c.req.query('commitId');
    if (!isStr(commitId)) return bad(c, 'commitId query parameter is required');
    const repo = new RepoEntity(c.env, id);
    if (!await repo.exists()) return notFound(c, 'Repository not found');
    const tree = await repo.getTree(commitId);
    if (!tree) return notFound(c, 'Tree for that commit not found');
    return ok(c, tree);
  });
  // ISSUES
  app.get('/api/repos/:id/issues', async (c) => {
    const { id } = c.req.param();
    const repo = new RepoEntity(c.env, id);
    if (!await repo.exists()) return notFound(c, 'Repository not found');
    const state = await repo.getState();
    return ok(c, state.issues);
  });
  app.post('/api/repos/:id/issues', async (c) => {
    const { id } = c.req.param();
    const { title, body } = (await c.req.json()) as { title?: string, body?: string };
    if (!isStr(title)) return bad(c, 'Issue title is required');
    const repo = new RepoEntity(c.env, id);
    if (!await repo.exists()) return notFound(c, 'Repository not found');
    const newIssue = await repo.createIssue(title, body ?? '');
    return ok(c, newIssue);
  });
  // --- Sync Routes ---
  app.post('/api/sync', async (c) => {
    const items = (await c.req.json()) as SyncQueueItem[];
    if (!Array.isArray(items)) return bad(c, 'Expected an array of sync items');
    // In a real implementation, this would be a complex reconciliation process.
    // For now, we'll just acknowledge the request.
    console.log(`[SYNC] Received ${items.length} items to sync.`);
    // Here you would iterate through items, use CAS operations with RepoEntity,
    // and return conflicts if any are found.
    return ok(c, { status: 'ok', conflicts: [] });
  });
  app.get('/api/sync/status', (c) => {
    // This would check the status of a sync job, perhaps from a queue.
    return ok(c, { status: 'idle', queueSize: 0 });
  });
  // DELETE: Users
  app.delete('/api/users/:id', async (c) => ok(c, { id: c.req.param('id'), deleted: await UserEntity.delete(c.env, c.req.param('id')) }));
  app.post('/api/users/deleteMany', async (c) => {
    const { ids } = (await c.req.json()) as { ids?: string[] };
    const list = ids?.filter(isStr) ?? [];
    if (list.length === 0) return bad(c, 'ids required');
    return ok(c, { deletedCount: await UserEntity.deleteMany(c.env, list), ids: list });
  });
  // DELETE: Chats
  app.delete('/api/chats/:id', async (c) => ok(c, { id: c.req.param('id'), deleted: await ChatBoardEntity.delete(c.env, c.req.param('id')) }));
  app.post('/api/chats/deleteMany', async (c) => {
    const { ids } = (await c.req.json()) as { ids?: string[] };
    const list = ids?.filter(isStr) ?? [];
    if (list.length === 0) return bad(c, 'ids required');
    return ok(c, { deletedCount: await ChatBoardEntity.deleteMany(c.env, list), ids: list });
  });
}