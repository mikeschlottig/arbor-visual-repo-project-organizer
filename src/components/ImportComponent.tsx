import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, FileJson, FileSpreadsheet, FileQuestion, X, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useStorageStore } from '@/hooks/useStorage';
import type { Repo, FileTree, VFSFile } from '@shared/types';
interface ImportComponentProps {
  repo: Repo | null;
  fileTree: FileTree | null;
  onTreeUpdate: (newTree: FileTree) => void;
  currentDirId: string;
}
type UploadableFile = {
  id: string;
  file: File;
  preview: string | null;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
};
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const SUPPORTED_MIME_TYPES = {
  'text/plain': 'txt',
  'text/markdown': 'md',
  'application/json': 'json',
  'text/csv': 'csv',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/pdf': 'pdf',
};
export function ImportComponent({ repo, fileTree, onTreeUpdate, currentDirId }: ImportComponentProps) {
  const [files, setFiles] = useState<UploadableFile[]>([]);
  const queueSyncItem = useStorageStore(s => s.queueSyncItem);
  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    fileRejections.forEach(rejection => {
      rejection.errors.forEach((err: any) => {
        toast.error(`File "${rejection.file.name}" rejected: ${err.message}`);
      });
    });
    const newFiles: UploadableFile[] = acceptedFiles.map(file => ({
      id: crypto.randomUUID(),
      file,
      preview: null,
      status: 'pending',
    }));
    setFiles(prev => [...prev, ...newFiles]);
    newFiles.forEach(newFile => {
      const reader = new FileReader();
      reader.onabort = () => console.warn('file reading was aborted');
      reader.onerror = () => toast.error('file reading has failed');
      reader.onload = () => {
        const binaryStr = reader.result as string;
        setFiles(prev => prev.map(f => f.id === newFile.id ? { ...f, preview: binaryStr.substring(0, 200) + '...' } : f));
      };
      if (newFile.file.type.startsWith('text/') || newFile.file.type === 'application/json') {
        reader.readAsText(newFile.file);
      }
    });
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: MAX_FILE_SIZE,
    accept: Object.fromEntries(Object.keys(SUPPORTED_MIME_TYPES).map(key => [key, []])),
  });
  const handleRemoveFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
  };
  const handleImportAll = async () => {
    if (!repo || !fileTree) {
      toast.error("Repository data not available.");
      return;
    }
    const pendingFiles = files.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) {
      toast.info("No new files to import.");
      return;
    }
    setFiles(prev => prev.map(f => f.status === 'pending' ? { ...f, status: 'uploading' } : f));
    // This is a mock import process. In a real app, you'd upload to a blob store
    // and then create a new commit with the updated file tree.
    // For now, we'll just add it to the local state and queue a sync.
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newVFSFiles: VFSFile[] = pendingFiles.map(f => ({
      id: crypto.randomUUID(),
      name: f.file.name,
      path: `/${f.file.name}`, // Simplified path
      type: 'file',
      parentId: currentDirId,
      mimeType: f.file.type,
      size: f.file.size,
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      content: f.preview || '',
      contentPreview: (f.preview || '').substring(0, 100),
    }));
    // This is a simplified tree update. A real implementation would be recursive.
    const newTree = { ...fileTree, children: [...fileTree.children, ...newVFSFiles] };
    onTreeUpdate(newTree);
    newVFSFiles.forEach(vfsFile => {
      queueSyncItem({
        entity: 'commit', // This should be a more specific operation
        entityId: repo.id,
        operation: 'update',
        payload: { file: vfsFile, message: `Import file: ${vfsFile.name}` },
      });
    });
    setFiles(prev => prev.map(f => f.status === 'uploading' ? { ...f, status: 'success' } : f));
    toast.success(`${pendingFiles.length} file(s) imported successfully.`);
  };
  const FileIcon = ({ mimeType }: { mimeType: string }) => {
    if (mimeType === 'text/plain' || mimeType === 'text/markdown') return <FileText className="h-6 w-6 text-blue-500" />;
    if (mimeType === 'application/json') return <FileJson className="h-6 w-6 text-yellow-500" />;
    if (mimeType === 'text/csv') return <FileSpreadsheet className="h-6 w-6 text-green-500" />;
    return <FileQuestion className="h-6 w-6 text-muted-foreground" />;
  };
  return (
    <div className="space-y-4">
      <Card
        {...getRootProps()}
        className={`border-2 border-dashed transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'hover:border-primary/50'}`}
      >
        <CardContent className="p-6 text-center cursor-pointer">
          <input {...getInputProps()} />
          <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            {isDragActive ? 'Drop the files here...' : "Drag 'n' drop some files here, or click to select files"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Supported: TXT, MD, JSON, CSV, DOCX, PDF (Max 10MB)
          </p>
        </CardContent>
      </Card>
      {files.length > 0 && (
        <div className="space-y-3">
          <AnimatePresence>
            {files.map(f => (
              <motion.div
                key={f.id}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card className="flex items-center p-3 gap-3 hover:shadow-md transition-shadow">
                  <FileIcon mimeType={f.file.type} />
                  <div className="flex-grow">
                    <p className="text-sm font-medium truncate">{f.file.name}</p>
                    <p className="text-xs text-muted-foreground">{(f.file.size / 1024).toFixed(2)} KB</p>
                    {f.status === 'uploading' && <Progress value={50} className="h-1 mt-1" />}
                  </div>
                  {f.status === 'pending' && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveFile(f.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  {f.status === 'uploading' && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                  {f.status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      <div className="flex justify-end">
        <Button onClick={handleImportAll} disabled={files.every(f => f.status !== 'pending')}>
          Import {files.filter(f => f.status === 'pending').length} File(s)
        </Button>
      </div>
    </div>
  );
}