export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
// Minimal real-world chat example types (shared by frontend and worker)
export interface User {
  id: string;
  name: string;
}
export interface Chat {
  id: string;
  title: string;
}
export interface ChatMessage {
  id: string;
  chatId: string;
  userId: string;
  text: string;
  ts: number; // epoch millis
}
// --- Arbor Types ---
export type Tag = {
  id: string;
  name: string;
  color: string;
};
export type FileNodeType = 'file' | 'folder';
export interface VFSNode {
  id: string;
  name: string;
  path: string;
  type: FileNodeType;
  parentId: string | null;
  createdAt: number;
  updatedAt: number;
}
export interface VFSFile extends VFSNode {
  type: 'file';
  mimeType?: string;
  size: number;
  tags: string[]; // tag ids
  contentPreview?: string;
  content?: string; // For small files
}
export interface VFSFolder extends VFSNode {
  type: 'folder';
  children: VFSNode[];
}
export type FileNode = VFSFile | VFSFolder;
export type FileTree = VFSFolder;
export interface Commit {
  id: string;
  message: string;
  timestamp: number;
  author: {
    name: string;
    email: string;
  };
  tree: FileTree;
}
export interface Branch {
  name: string;
  commitId: string;
}
export type IssueStatus = 'open' | 'in_progress' | 'closed';
export interface Issue {
  id: string;
  number: number;
  title: string;
  body: string;
  status: IssueStatus;
  authorId: string;
  assigneeIds: string[];
  tags: string[]; // tag ids
  createdAt: number;
  updatedAt: number;
}
// --- Collaboration Types ---
export type PRStatus = 'open' | 'merged' | 'closed';
export interface PR {
  id: string;
  number: number;
  title: string;
  description?: string;
  sourceBranch: string;
  targetBranch: string;
  status: PRStatus;
  createdAt: number;
  updatedAt: number;
  conflicts?: boolean;
  reviewerIds: string[];
}
export interface Comment {
  id: string;
  entityId: string; // Can be an issue ID or PR ID
  text: string;
  authorId: string;
  timestamp: number;
}
export type Role = 'admin' | 'editor' | 'viewer';
export interface Notification {
  id: string;
  type: 'pr' | 'issue' | 'comment';
  message: string;
  read: boolean;
  timestamp: number;
}
export interface Repo {
  id: string;
  name: string;
  description: string;
  tags: string[]; // tag ids
  createdAt: number;
  updatedAt: number;
  defaultBranch: string;
  branches: Branch[];
  commits: Commit[];
  issues: Issue[];
  prs: PR[];
  comments: Comment[];
  roles?: Record<string, Role>; // Maps userId to Role
}
// --- Storage & Sync Types ---
export type StorageAdapterName = 'do' | 'local' | 'd1';
export interface StorageAdapter {
  name: StorageAdapterName;
  getRepos: () => Promise<Repo[]>;
  getRepo: (id: string) => Promise<Repo | null>;
  createRepo: (repoData: { name: string; description: string }) => Promise<Repo>;
  // Add other methods as needed: updateRepo, deleteRepo, etc.
}
export type SyncStatus = 'pending' | 'synced' | 'conflict';
export type SyncOperation = 'create' | 'update' | 'delete';
export interface SyncQueueItem {
  id: string;
  entity: 'repo' | 'commit' | 'branch' | 'issue';
  entityId: string;
  operation: SyncOperation;
  payload: any;
  timestamp: number;
  status: SyncStatus;
}
export interface Conflict {
  queueItemId: string;
  localVersion: any;
  remoteVersion: any;
  resolved?: boolean;
}