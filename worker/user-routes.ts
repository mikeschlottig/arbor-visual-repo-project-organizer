import { Hono } from "hono";
import type { Env } from './core-utils';
import { UserEntity, ChatBoardEntity, RepoEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import type { Commit, FileTree, Repo, SyncQueueItem, PR, Comment, VFSFile, VFSFolder, FileNode } from "@shared/types";
const flattenTree = (node: FileNode, allFiles: VFSFile[] = []): VFSFile[] => {
    if (node.type === 'file') {
        allFiles.push(node as VFSFile);
    } else if (node.type === 'folder' && 'children' in node && Array.isArray(node.children)) {
        (node as VFSFolder).children.forEach(child => flattenTree(child as FileNode, allFiles));
    }
    return allFiles;
};
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
      prs: [],
      comments: [],
      roles: {},
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
  // PULL REQUESTS
  app.get('/api/repos/:id/prs', async (c) => {
    const repo = new RepoEntity(c.env, c.req.param('id'));
    if (!await repo.exists()) return notFound(c, 'Repository not found');
    const state = await repo.getState();
    return ok(c, state.prs);
  });
  app.post('/api/repos/:id/prs', async (c) => {
    const { id } = c.req.param();
    const { sourceBranch, targetBranch, title, description } = (await c.req.json()) as Partial<PR>;
    if (!isStr(sourceBranch) || !isStr(targetBranch) || !isStr(title)) return bad(c, 'sourceBranch, targetBranch, and title are required');
    const repo = new RepoEntity(c.env, id);
    if (!await repo.exists()) return notFound(c, 'Repository not found');
    const userId = c.req.header('X-User-Id') || 'u1'; // Mock user
    if (!await repo.hasPermission(userId, 'editor')) return bad(c, 'Permission denied');
    const pr = await repo.createPR(sourceBranch, targetBranch, title, description ?? '', userId);
    return ok(c, pr);
  });
  app.put('/api/repos/:id/prs/:prId/merge', async (c) => {
    const { id, prId } = c.req.param();
    const repo = new RepoEntity(c.env, id);
    if (!await repo.exists()) return notFound(c, 'Repository not found');
    const userId = c.req.header('X-User-Id') || 'u1'; // Mock user
    if (!await repo.hasPermission(userId, 'editor')) return bad(c, 'Permission denied');
    const merged = await repo.mergePR(prId);
    if (!merged) return bad(c, 'Merge failed. The PR may not be open or branches may not exist.');
    return ok(c, { success: true });
  });
  // COMMENTS
  app.post('/api/repos/:id/comments', async (c) => {
    const { id } = c.req.param();
    const { entityId, text } = (await c.req.json()) as Partial<Comment>;
    if (!isStr(entityId) || !isStr(text)) return bad(c, 'entityId and text are required');
    const repo = new RepoEntity(c.env, id);
    if (!await repo.exists()) return notFound(c, 'Repository not found');
    const userId = c.req.header('X-User-Id') || 'u1'; // Mock user
    if (!await repo.hasPermission(userId, 'editor')) return bad(c, 'Permission denied');
    const comment = await repo.addComment(entityId, text, userId);
    return ok(c, comment);
  });
  // --- AI & Search Routes ---
  app.get('/api/repos/search', async (c) => {
    const q = c.req.query('q')?.toLowerCase();
    if (!q) return bad(c, 'Query parameter "q" is required');
    await RepoEntity.ensureSeed(c.env);
    const allRepos = await RepoEntity.list(c.env, null, 1000); // Fetch all for local filtering
    const results = allRepos.items.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.tags.some(t => t.toLowerCase().includes(q))
    );
    return ok(c, results.slice(0, 20));
  });
  app.post('/api/repos/:id/export', async (c) => {
    const repo = new RepoEntity(c.env, c.req.param('id'));
    if (!await repo.exists()) return notFound(c);
    const state = await repo.getState();
    return ok(c, state);
  });
  app.get('/api/repos/:id/files/search', async (c) => {
    const q = c.req.query('q')?.toLowerCase();
    if (!q) return ok(c, []);
    const repo = new RepoEntity(c.env, c.req.param('id'));
    if (!await repo.exists()) return notFound(c);
    const state = await repo.getState();
    const latestCommit = state.commits.sort((a,b) => b.timestamp - a.timestamp)[0];
    if (!latestCommit) return ok(c, []);
    const allFiles = flattenTree(latestCommit.tree);
    const matches = allFiles.filter(f =>
        f.name.toLowerCase().includes(q) ||
        (f.contentPreview || '').toLowerCase().includes(q)
    );
    return ok(c, matches.slice(0, 50));
  });
  // --- Sync Routes ---
  app.post('/api/sync', async (c) => {
    const items = (await c.req.json()) as SyncQueueItem[];
    if (!Array.isArray(items)) return bad(c, 'Expected an array of sync items');
    console.log(`[SYNC] Received ${items.length} items to sync.`);
    return ok(c, { status: 'ok', conflicts: [] });
  });
  app.get('/api/sync/status', (c) => {
    return ok(c, { status: 'idle', queueSize: 0 });
  });
}