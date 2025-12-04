import React from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/default-highlight';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus';
import { format } from 'date-fns';
import { Code, FileText, Image as ImageIcon, Video, FileQuestion } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { VFSFile } from '@shared/types';
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
const FileViewer: React.FC<FileViewerProps> = ({ file }) => {
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
    const mimeType = file.mimeType || '';
    if (mimeType.startsWith('image/')) {
      return <img src={`data:${mimeType};base64,${btoa(file.content || '')}`} alt={file.name} className="max-w-full h-auto rounded-md object-contain" />;
    }
    if (mimeType.startsWith('video/')) {
      return <video src={`data:${mimeType};base64,${btoa(file.content || '')}`} controls className="max-w-full rounded-md" />;
    }
    if (mimeType.startsWith('text/') || languageMap[mimeType]) {
        const language = languageMap[mimeType] || 'plaintext';
        return (
            <SyntaxHighlighter language={language} style={vscDarkPlus} customStyle={{ margin: 0, borderRadius: '0.5rem' }} PreTag="div">
                {file.content || ''}
            </SyntaxHighlighter>
        );
    }
    return (
        <div className="p-4 bg-muted rounded-md">
            <p className="text-muted-foreground">Cannot preview this file type.</p>
        </div>
    );
  };
  return (
    <div className="h-full flex flex-col">
      <Card className="flex-grow flex flex-col">
        <CardHeader className="flex-row items-center justify-between space-y-0 border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            {file.mimeType?.startsWith('image/') ? <ImageIcon className="h-5 w-5" /> :
             file.mimeType?.startsWith('video/') ? <Video className="h-5 w-5" /> :
             file.mimeType?.startsWith('text/') ? <FileText className="h-5 w-5" /> :
             <Code className="h-5 w-5" />}
            {file.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-grow overflow-auto">
          {renderContent()}
        </CardContent>
      </Card>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">File Details</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p><strong>Path:</strong> {file.path}</p>
          <p><strong>Size:</strong> {(file.size / 1024).toFixed(2)} KB</p>
          <p><strong>Created:</strong> {format(new Date(file.createdAt), "dd-MM-yy 'at' HH:mm")}</p>
          <p><strong>Last Modified:</strong> {format(new Date(file.updatedAt), "dd-MM-yy 'at' HH:mm")}</p>
          {file.tags.length > 0 && (
            <div className="flex items-center gap-2 pt-1">
              <strong>Tags:</strong>
              {file.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
export default FileViewer;