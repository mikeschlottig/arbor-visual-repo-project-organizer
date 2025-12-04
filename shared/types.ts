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
}