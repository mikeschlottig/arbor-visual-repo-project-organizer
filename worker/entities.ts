/**
 * Minimal real-world demo: One Durable Object instance per entity (User, ChatBoard), with Indexes for listing.
 */
import { IndexedEntity } from "./core-utils";
import type { User, Chat, ChatMessage, Repo, Branch, Commit, FileTree, Issue, PR, Comment, Role } from "@shared/types";
import { MOCK_CHAT_MESSAGES, MOCK_CHATS, MOCK_USERS, MOCK_ARBOR_REPOS } from "@shared/mock-data";
// USER ENTITY: one DO instance per user
export class UserEntity extends IndexedEntity<User> {
  static readonly entityName = "user";
  static readonly indexName = "users";
  static readonly initialState: User = { id: "", name: "" };
  static seedData = MOCK_USERS;
}
// CHAT BOARD ENTITY: one DO instance per chat board, stores its own messages
export type ChatBoardState = Chat & { messages: ChatMessage[] };
const SEED_CHAT_BOARDS: ChatBoardState[] = MOCK_CHATS.map(c => ({
  ...c,
  messages: MOCK_CHAT_MESSAGES.filter(m => m.chatId === c.id),
}));
export class ChatBoardEntity extends IndexedEntity<ChatBoardState> {
  static readonly entityName = "chat";
  static readonly indexName = "chats";
  static readonly initialState: ChatBoardState = { id: "", title: "", messages: [] };
  static seedData = SEED_CHAT_BOARDS;
  async listMessages(): Promise<ChatMessage[]> {
    const { messages } = await this.getState();
    return messages;
  }
  async sendMessage(userId: string, text: string): Promise<ChatMessage> {
    const msg: ChatMessage = { id: crypto.randomUUID(), chatId: this.id, userId, text, ts: Date.now() };
    await this.mutate(s => ({ ...s, messages: [...s.messages, msg] }));
    return msg;
  }
}
// --- Arbor Repo Entity ---
export class RepoEntity extends IndexedEntity<Repo> {
  static readonly entityName = "repo";
  static readonly indexName = "repos";
  static readonly initialState: Repo = {
    id: "",
    name: "",
    description: "",
    tags: [],
    createdAt: 0,
    updatedAt: 0,
    defaultBranch: "main",
    branches: [],
    commits: [],
    issues: [],
    prs: [],
    comments: [],
    roles: {},
  };
  static seedData = MOCK_ARBOR_REPOS;
  async hasPermission(userId: string, requiredRole: Role): Promise<boolean> {
    const repo = await this.getState();
    const userRole = repo.roles?.[userId];
    if (!userRole) return false;
    if (requiredRole === 'admin') return userRole === 'admin';
    if (requiredRole === 'editor') return userRole === 'admin' || userRole === 'editor';
    if (requiredRole === 'viewer') return true;
    return false;
  }
  async createPR(sourceBranch: string, targetBranch: string, title: string, description: string, authorId: string): Promise<PR> {
    const newPR: PR = {
      id: crypto.randomUUID(),
      number: 0, // will be set below
      title,
      description,
      sourceBranch,
      targetBranch,
      status: 'open',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      reviewerIds: [],
      // Basic conflict detection: check if target branch has new commits since source branched off.
      // A real implementation would be much more complex.
      conflicts: Math.random() > 0.5,
    };
    await this.mutate(repo => {
      const nextPRNumber = (repo.prs.length > 0 ? Math.max(...repo.prs.map(p => p.number)) : 0) + 1;
      newPR.number = nextPRNumber;
      return {
        ...repo,
        prs: [...repo.prs, newPR],
      };
    });
    return newPR;
  }
  async mergePR(prId: string): Promise<boolean> {
    const repo = await this.getState();
    const pr = repo.prs.find(p => p.id === prId);
    if (!pr || pr.status !== 'open') return false;
    const source = repo.branches.find(b => b.name === pr.sourceBranch);
    const target = repo.branches.find(b => b.name === pr.targetBranch);
    if (!source || !target) return false;
    // Simple merge: create a new commit on target branch with source branch's tree
    const sourceCommit = repo.commits.find(c => c.id === source.commitId);
    if (!sourceCommit) return false;
    const mergeCommit: Commit = {
      id: crypto.randomUUID(),
      message: `Merge PR #${pr.number}: ${pr.title}`,
      timestamp: Date.now(),
      author: { name: "Arbor System", email: "system@arbor.dev" },
      tree: sourceCommit.tree,
    };
    await this.mutate(s => {
      const updatedPR = { ...pr, status: 'merged' as const, updatedAt: Date.now() };
      const updatedTargetBranch = { ...target, commitId: mergeCommit.id };
      return {
        ...s,
        commits: [...s.commits, mergeCommit],
        prs: s.prs.map(p => p.id === prId ? updatedPR : p),
        branches: s.branches.map(b => b.name === target.name ? updatedTargetBranch : b),
      };
    });
    return true;
  }
  async addComment(entityId: string, text: string, authorId: string): Promise<Comment> {
    const newComment: Comment = {
      id: crypto.randomUUID(),
      entityId,
      text,
      authorId,
      timestamp: Date.now(),
    };
    await this.mutate(repo => ({
      ...repo,
      comments: [...repo.comments, newComment],
    }));
    return newComment;
  }
}