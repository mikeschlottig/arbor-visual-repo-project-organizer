/**
 * Minimal real-world demo: One Durable Object instance per entity (User, ChatBoard), with Indexes for listing.
 */
import { IndexedEntity } from "./core-utils";
import type { User, Chat, ChatMessage, Repo, Branch, Commit, FileTree, Issue } from "@shared/types";
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
  };
  static seedData = MOCK_ARBOR_REPOS;
  async getBranch(name: string): Promise<Branch | undefined> {
    const repo = await this.getState();
    return repo.branches.find(b => b.name === name);
  }
  async getCommit(id: string): Promise<Commit | undefined> {
    const repo = await this.getState();
    return repo.commits.find(c => c.id === id);
  }
  async getTree(commitId: string): Promise<FileTree | null> {
    const commit = await this.getCommit(commitId);
    return commit?.tree ?? null;
  }
  async createBranch(newBranchName: string, fromBranchName: string): Promise<Branch> {
    const fromBranch = await this.getBranch(fromBranchName);
    if (!fromBranch) throw new Error(`Branch '${fromBranchName}' not found`);
    const newBranch: Branch = { name: newBranchName, commitId: fromBranch.commitId };
    await this.mutate(repo => ({
      ...repo,
      branches: [...repo.branches, newBranch],
      updatedAt: Date.now(),
    }));
    return newBranch;
  }
  async createCommit(branchName: string, message: string, tree: FileTree): Promise<Commit> {
    const branch = await this.getBranch(branchName);
    if (!branch) throw new Error(`Branch '${branchName}' not found`);
    const newCommit: Commit = {
      id: crypto.randomUUID(),
      message,
      timestamp: Date.now(),
      author: { name: "Demo User", email: "user@demo.com" }, // Hardcoded for now
      tree,
    };
    await this.mutate(repo => {
      const otherBranches = repo.branches.filter(b => b.name !== branchName);
      const updatedBranch = { ...branch, commitId: newCommit.id };
      return {
        ...repo,
        commits: [...repo.commits, newCommit],
        branches: [...otherBranches, updatedBranch],
        updatedAt: Date.now(),
      };
    });
    return newCommit;
  }
  async createIssue(title: string, body: string): Promise<Issue> {
    const newIssue: Issue = {
        id: crypto.randomUUID(),
        number: 0, // will be set below
        title,
        body,
        status: 'open',
        authorId: 'u1', // Hardcoded for now
        assigneeIds: [],
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };
    await this.mutate(repo => {
        const nextIssueNumber = (repo.issues.length > 0 ? Math.max(...repo.issues.map(i => i.number)) : 0) + 1;
        newIssue.number = nextIssueNumber;
        return {
            ...repo,
            issues: [...repo.issues, newIssue],
        };
    });
    return newIssue;
  }
}