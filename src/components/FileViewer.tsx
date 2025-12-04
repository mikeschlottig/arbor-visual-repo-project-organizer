import React, { useState, useEffect } from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/default-highlight';
import vscDarkPlus from 'react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus';
import { format } from 'date-fns';
import { Code, FileText, Image as ImageIcon, Video, FileQuestion, FileSpreadsheet, FileJson, FileType } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { VFSFile } from '@shared/types';
import { cn } from '@/lib/utils';
interface FileViewerProps {
  file: VFSFile | null;
}
const languageMap: { [key: string]: string } = {
    'application/javascript': 'javascript',
    'text/typescript': 'typescript',
    'text/css': 'css',
    'text/html': 'html',
    'application/json': 'json',
    'text/markdown': 'markdown',
};
const CsvPreview: React.FC<{ content: string }> = ({ content }) => {
    const rows = content.split('\n').map(row => row.split(','));
    if (rows.length === 0) return <p className="p-4 text-muted-foreground">Empty CSV file.</p>;
    const header = rows[0];
    const body = rows.slice(1);
    return (
        <div className="overflow-auto p-4">
            <div className="grid gap-px bg-border" style={{ gridTemplateColumns: `repeat(${header.length}, minmax(100px, 1fr))` }}>
                {header.map((cell, i) => (
                    <div key={i} className="bg-muted p-2 text-sm font-semibold truncate">{cell}</div>
                ))}
                {body.map((row, rowIndex) => (
                    <React.Fragment key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                            <div key={cellIndex} className="bg-background p-2 text-sm truncate">{cell}</div>
                        ))}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};
const DocumentPreview: React.FC<{ file: VFSFile }> = ({ file }) => {
    const paragraphs = (file.contentPreview || '').split('\n\n').filter(p => p.trim() !== '');
    const estimatedPages = Math.ceil((file.contentPreview || '').length / 1500);
    return (
        <Card className="m-4">
            <CardHeader>
                <CardTitle>Document Summary</CardTitle>
                <CardDescription>
                    An AI-generated summary from the document content. Estimated pages: {estimatedPages}.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
                {paragraphs.length > 0 ? paragraphs.map((p, i) => (
                    <p key={i} className="leading-relaxed">{p}</p>
                )) : <p className="text-muted-foreground">No text preview could be extracted.</p>}
            </CardContent>
        </Card>
    );
};
const FileViewer: React.FC<FileViewerProps> = ({ file }) => {
  const [isRenderingLargeFile, setIsRenderingLargeFile] = useState(false);
  useEffect(() => {
    if (file && file.size > 1024 * 100) { // 100KB threshold
      setIsRenderingLargeFile(true);
      const timer = setTimeout(() => setIsRenderingLargeFile(false), 500);
      return () => clearTimeout(timer);
    }
    setIsRenderingLargeFile(false);
  }, [file]);
  if (!file) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center">
        <FileQuestion className="h-16 w-16 mb-4" />
        <h3 className="text-xl font-semibold">No file selected</h3>
        <p className="mt-2">Select a file from the tree to view its contents.</p>
      </div>
    );
  }
  const renderContent = () => {
    if (isRenderingLargeFile) {
        return <div className="p-4 space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-5/6" /></div>;
    }
    const mimeType = file.mimeType || '';
    if (mimeType.startsWith('image/')) {
      return <img src={`data:${mimeType};base64,${btoa(file.content || '')}`} alt={file.name} className="max-w-full h-auto rounded-md object-contain p-4" />;
    }
    if (mimeType.startsWith('video/')) {
      return <video src={`data:${mimeType};base64,${btoa(file.content || '')}`} controls className="max-w-full rounded-md" />;
    }
    if (mimeType === 'application/json') {
        try {
            const parsed = JSON.parse(file.content || '{}');
            return (
                <SyntaxHighlighter language="json" style={vscDarkPlus} customStyle={{ margin: 0, borderRadius: '0.5rem', height: '100%' }} PreTag="div">
                    {JSON.stringify(parsed, null, 2)}
                </SyntaxHighlighter>
            );
        } catch (e) {
            return <pre className="p-4 text-sm font-mono bg-muted rounded-md text-destructive-foreground">Error parsing JSON: {(e as Error).message}</pre>;
        }
    }
    if (mimeType === 'text/csv') {
        return <CsvPreview content={file.content || ''} />;
    }
    if (mimeType === 'application/pdf' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return <DocumentPreview file={file} />;
    }
    if (mimeType.startsWith('text/') || languageMap[mimeType]) {
        const language = languageMap[mimeType] || 'plaintext';
        return (
            <SyntaxHighlighter language={language} style={vscDarkPlus} customStyle={{ margin: 0, borderRadius: '0.5rem', height: '100%' }} PreTag="div">
                {file.content || ''}
            </SyntaxHighlighter>
        );
    }
    return (
        <div className="p-4 bg-muted rounded-md m-4">
            <p className="text-muted-foreground font-semibold">Preview not available for this file type.</p>
            <p className="text-xs text-muted-foreground mt-1">File metadata is shown below.</p>
        </div>
    );
  };
  const getIcon = () => {
    const mimeType = file.mimeType || '';
    if (mimeType.startsWith('image/')) return <ImageIcon className="h-5 w-5" />;
    if (mimeType.startsWith('video/')) return <Video className="h-5 w-5" />;
    if (mimeType === 'application/json') return <FileJson className="h-5 w-5" />;
    if (mimeType === 'text/csv') return <FileSpreadsheet className="h-5 w-5" />;
    if (mimeType === 'application/pdf' || mimeType.includes('wordprocessingml')) return <FileType className="h-5 w-5" />;
    if (mimeType.startsWith('text/')) return <FileText className="h-5 w-5" />;
    return <Code className="h-5 w-5" />;
  };
  return (
    <div className="h-full flex flex-col">
      <Card className="flex-grow flex flex-col">
        <CardHeader className="flex-row items-center justify-between space-y-0 border-b">
          <CardTitle className="flex items-center gap-2 text-lg truncate">
            {getIcon()}
            <span className="truncate">{file.name}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-grow overflow-auto max-h-[60vh]">
          {renderContent()}
        </CardContent>
      </Card>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">File Details</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p><strong>Path:</strong> <span className="font-mono bg-muted px-1 py-0.5 rounded">{file.path}</span></p>
          <p><strong>Size:</strong> {(file.size / 1024).toFixed(2)} KB</p>
          <p><strong>Created:</strong> {format(new Date(file.createdAt), "dd-MM-yy 'at' HH:mm")}</p>
          <p><strong>Last Modified:</strong> {format(new Date(file.updatedAt), "dd-MM-yy 'at' HH:mm")}</p>
          {file.tags.length > 0 && (
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <strong>Tags:</strong>
              {file.tags.map(tag => <Badge key={tag} variant="secondary" className="hover:bg-primary/20 transition-colors">{tag}</Badge>)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
export default FileViewer;