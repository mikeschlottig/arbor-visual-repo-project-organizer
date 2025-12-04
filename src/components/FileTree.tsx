import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { File, Folder, ChevronRight, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FileNode, VFSFolder, VFSFile } from '@shared/types';
interface FileTreeProps {
  tree: VFSFolder;
  onSelectFile: (file: VFSFile) => void;
  selectedFileId?: string;
}
const FileTree: React.FC<FileTreeProps> = ({ tree, onSelectFile, selectedFileId }) => {
  return (
    <div className="text-sm">
      <ul>
        {tree.children.sort((a, b) => {
          if (a.type === 'folder' && b.type === 'file') return -1;
          if (a.type === 'file' && b.type === 'folder') return 1;
          return a.name.localeCompare(b.name);
        }).map(node => (
          <Node key={node.id} node={node} onSelectFile={onSelectFile} selectedFileId={selectedFileId} depth={0} />
        ))}
      </ul>
    </div>
  );
};
interface NodeProps {
  node: FileNode;
  onSelectFile: (file: VFSFile) => void;
  selectedFileId?: string;
  depth: number;
}
const Node: React.FC<NodeProps> = ({ node, onSelectFile, selectedFileId, depth }) => {
  const [isOpen, setIsOpen] = useState(depth < 2);
  const isFolder = node.type === 'folder';
  const isSelected = !isFolder && selectedFileId === node.id;
  const handleToggle = () => {
    if (isFolder) {
      setIsOpen(!isOpen);
    } else {
      onSelectFile(node as VFSFile);
    }
  };
  const Icon = isFolder ? (isOpen ? FolderOpen : Folder) : File;
  return (
    <li>
      <div
        onClick={handleToggle}
        style={{ paddingLeft: `${depth * 1.25}rem` }}
        className={cn(
          "flex items-center py-1.5 px-2 rounded-md cursor-pointer transition-colors duration-150",
          "hover:bg-accent hover:text-accent-foreground",
          isSelected && "bg-primary/10 text-primary font-medium"
        )}
      >
        {isFolder && (
          <ChevronRight
            className={cn("h-4 w-4 mr-2 transition-transform duration-200", isOpen && "rotate-90")}
          />
        )}
        <Icon className={cn("h-4 w-4 mr-2 flex-shrink-0", isFolder ? "text-yellow-500" : "text-muted-foreground")} />
        <span className="truncate">{node.name}</span>
      </div>
      <AnimatePresence initial={false}>
        {isFolder && isOpen && 'children' in node && Array.isArray((node as VFSFolder).children) && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {(node as VFSFolder).children.sort((a, b) => {
                if (a.type === 'folder' && b.type === 'file') return -1;
                if (a.type === 'file' && b.type === 'folder') return 1;
                return a.name.localeCompare(b.name);
            }).map(child => (
              <Node key={child.id} node={child} onSelectFile={onSelectFile} selectedFileId={selectedFileId} depth={depth + 1} />
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </li>
  );
};
export default FileTree;