import type { User, Chat, ChatMessage, Repo, FileTree, Commit, Branch, Issue, VFSFile, VFSFolder, PR, Comment, Role } from './types';
export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Ada Lovelace' },
  { id: 'u2', name: 'Grace Hopper' }
];
export const MOCK_CHATS: Chat[] = [
  { id: 'c1', title: 'General' },
];
export const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  { id: 'm1', chatId: 'c1', userId: 'u1', text: 'Hello', ts: Date.now() },
];
// --- Arbor Mock Data ---
const now = Date.now();
const MOCK_TREE_1: FileTree = {
  id: 'root-1',
  name: 'root',
  path: '/',
  type: 'folder',
  parentId: null,
  createdAt: now,
  updatedAt: now,
  children: [
    {
      id: 'file-1-1',
      name: 'README.md',
      path: '/README.md',
      type: 'file',
      parentId: 'root-1',
      mimeType: 'text/markdown',
      size: 128,
      tags: [],
      createdAt: now,
      updatedAt: now,
      content: '# Project Phoenix\nThis is the main readme for the project.',
      contentPreview: '# Project Phoenix'
    } as VFSFile,
    {
      id: 'folder-1-1',
      name: 'src',
      path: '/src',
      type: 'folder',
      parentId: 'root-1',
      createdAt: now,
      updatedAt: now,
      children: [
        {
          id: 'file-1-2',
          name: 'index.js',
          path: '/src/index.js',
          type: 'file',
          parentId: 'folder-1-1',
          mimeType: 'application/javascript',
          size: 1024,
          tags: [],
          createdAt: now,
          updatedAt: now,
          content: 'console.log("hello world");',
          contentPreview: 'console.log(...)'
        } as VFSFile
      ]
    } as VFSFolder
  ]
};
const MOCK_COMMIT_1: Commit = {
  id: 'commit-1',
  message: 'Initial commit',
  timestamp: now - 1000 * 60 * 60 * 24,
  author: { name: 'Ada Lovelace', email: 'ada@example.com' },
  tree: MOCK_TREE_1,
};
const MOCK_BRANCH_1: Branch = {
  name: 'main',
  commitId: 'commit-1',
};
const MOCK_ISSUE_1: Issue = {
    id: 'issue-1',
    number: 1,
    title: 'Setup initial project structure',
    body: 'We need to create the basic folders and files.',
    status: 'closed',
    authorId: 'u1',
    assigneeIds: ['u1'],
    tags: [],
    createdAt: now - 1000 * 60 * 60 * 2,
    updatedAt: now - 1000 * 60 * 30,
};
const MOCK_PRS: PR[] = [
    {
        id: 'pr-1',
        number: 1,
        title: 'feat: Implement search functionality',
        description: 'This PR adds a new search bar to the main page.',
        sourceBranch: 'feature/search',
        targetBranch: 'main',
        status: 'open',
        createdAt: now - 86400000 * 2,
        updatedAt: now - 3600000,
        conflicts: true,
        reviewerIds: ['u2'],
    },
    {
        id: 'pr-2',
        number: 2,
        title: 'fix: Correct typo in README',
        description: 'A small but important fix.',
        sourceBranch: 'fix/readme-typo',
        targetBranch: 'main',
        status: 'merged',
        createdAt: now - 86400000 * 3,
        updatedAt: now - 86400000,
        reviewerIds: ['u1'],
    }
];
const MOCK_COMMENTS: Comment[] = [
    {
        id: 'comment-1',
        entityId: 'issue-1',
        text: 'This has been completed.',
        authorId: 'u1',
        timestamp: now - 1000 * 60 * 29,
    },
    {
        id: 'comment-2',
        entityId: 'pr-1',
        text: 'Could you add some tests for this?',
        authorId: 'u2',
        timestamp: now - 1800000,
    }
];
const MOCK_ROLES: Record<string, Role> = {
    'u1': 'admin',
    'u2': 'editor',
};
const MOCK_REPOS: Repo[] = [
  {
    id: 'phoenix-project',
    name: 'Phoenix Project',
    description: 'A revolutionary new framework for edge computing.',
    tags: ['framework', 'edge', 'beta'],
    createdAt: now,
    updatedAt: now,
    defaultBranch: 'main',
    branches: [MOCK_BRANCH_1, { name: 'feature/search', commitId: 'commit-1' }],
    commits: [MOCK_COMMIT_1],
    issues: [MOCK_ISSUE_1],
    prs: MOCK_PRS,
    comments: MOCK_COMMENTS,
    roles: MOCK_ROLES,
  },
  {
    id: 'arbor-ui-kit',
    name: 'Arbor UI Kit',
    description: 'The official component library for the Arbor ecosystem.',
    tags: ['ui', 'react', 'design-system'],
    createdAt: now - 1000 * 60 * 60 * 48,
    updatedAt: now - 1000 * 60 * 60 * 2,
    defaultBranch: 'main',
    branches: [{ name: 'main', commitId: 'commit-2' }],
    commits: [{
      id: 'commit-2',
      message: 'feat: Add Button component',
      timestamp: now - 1000 * 60 * 60 * 3,
      author: { name: 'Grace Hopper', email: 'grace@example.com' },
      tree: {
        id: 'root-2',
        name: 'root',
        path: '/',
        type: 'folder',
        parentId: null,
        createdAt: now,
        updatedAt: now,
        children: [
            {
                id: 'file-2-1',
                name: 'Button.tsx',
                path: '/Button.tsx',
                type: 'file',
                parentId: 'root-2',
                mimeType: 'text/typescript',
                size: 2048,
                tags: [],
                createdAt: now,
                updatedAt: now,
                content: 'export const Button = () => <button>Click me</button>;',
                contentPreview: 'export const Button...'
            } as VFSFile
        ]
      }
    }],
    issues: [],
    prs: [],
    comments: [],
    roles: { 'u1': 'admin' },
  }
];
export const MOCK_ARBOR_REPOS = MOCK_REPOS;