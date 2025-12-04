import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Bot, User as UserIcon, Send, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useStorageStore } from '@/hooks/useStorage';
import { toast } from 'sonner';
import type { Repo, FileTree, VFSFile } from '@shared/types';
interface AIAssistantProps {
  repo: Repo | null;
  fileTree: FileTree | null;
  selectedFile: VFSFile | null;
}
type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestion?: {
    entity: 'file';
    entityId: string;
    operation: 'edit' | 'tag';
    payload: any;
  };
};
export function AIAssistant({ repo, selectedFile }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const queueAIChange = useStorageStore(s => s.queueAIChange);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);
  const handlePrompt = (promptText: string) => {
    setInput(promptText);
    handleSubmit(promptText);
  };
  const handleSubmit = (promptOverride?: string) => {
    const userMessage = promptOverride || input;
    if (!userMessage.trim()) return;
    const newMessage: Message = { id: crypto.randomUUID(), role: 'user', content: userMessage };
    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setIsLoading(true);
    // Mock AI Response Generation
    setTimeout(() => {
      let responseContent = "I'm not sure how to help with that. Try asking me to 'summarize this file' or 'suggest tags'.";
      let suggestion;
      if (userMessage.toLowerCase().includes('summarize') && selectedFile) {
        responseContent = `Here's a summary of **${selectedFile.name}**:\n\nThis file appears to be a ${selectedFile.mimeType} of about ${Math.round(selectedFile.size / 1024)} KB. The content starts with: \`\`\`\n${(selectedFile.content || '').substring(0, 100)}...\n\`\`\``;
      } else if (userMessage.toLowerCase().includes('tag') && selectedFile) {
        responseContent = `Based on the content of **${selectedFile.name}**, I suggest adding the tags 'refactor' and 'ui-component'. Would you like to apply this change?`;
        suggestion = {
          entity: 'file',
          entityId: selectedFile.id,
          operation: 'tag',
          payload: { tags: ['refactor', 'ui-component'] },
        };
      } else if (!selectedFile) {
        responseContent = "Please select a file first so I can assist you with it.";
      }
      const aiResponse: Message = { id: crypto.randomUUID(), role: 'assistant', content: responseContent, suggestion };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1200);
  };
  const handleSuggestion = (suggestion: Message['suggestion'], approve: boolean) => {
    if (!suggestion) return;
    if (approve) {
      queueAIChange(suggestion);
      toast.success('Change has been queued for your approval in settings.');
    } else {
      toast.info('Suggestion dismissed.');
    }
    // Here you might want to disable the suggestion buttons after one is clicked.
  };
  return (
    <div className="h-full flex flex-col p-4 bg-background rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-6 w-6 text-primary" />
        <h3 className="text-lg font-semibold">AI Assistant</h3>
      </div>
      <div className="flex gap-2 mb-4 flex-wrap">
        <Button size="sm" variant="outline" onClick={() => handlePrompt('Summarize this file')} disabled={!selectedFile || isLoading}>Summarize File</Button>
        <Button size="sm" variant="outline" onClick={() => handlePrompt('Suggest tags for this file')} disabled={!selectedFile || isLoading}>Suggest Tags</Button>
      </div>
      <ScrollArea className="flex-grow mb-4 pr-4 -mr-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
              >
                {msg.role === 'assistant' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 center"><Bot className="h-5 w-5 text-primary" /></div>}
                <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  {msg.suggestion && (
                    <Card className="mt-2 bg-background/50">
                      <CardContent className="p-2 text-xs">
                        <p className="font-semibold mb-2">AI Suggestion:</p>
                        <pre className="bg-muted p-2 rounded-md"><code>{JSON.stringify(msg.suggestion.payload, null, 2)}</code></pre>
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" onClick={() => handleSuggestion(msg.suggestion, true)}><Check className="h-3 w-3 mr-1" /> Approve</Button>
                          <Button size="sm" variant="ghost" onClick={() => handleSuggestion(msg.suggestion, false)}><X className="h-3 w-3 mr-1" /> Reject</Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
                {msg.role === 'user' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted center"><UserIcon className="h-5 w-5 text-muted-foreground" /></div>}
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 center"><Bot className="h-5 w-5 text-primary" /></div>
              <div className="max-w-[80%] p-3 rounded-lg bg-muted">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse" />
                  <div className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse delay-150" />
                  <div className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse delay-300" />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>
      <div className="relative">
        <Textarea
          placeholder="Ask the assistant..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
          className="pr-12"
          disabled={isLoading}
        />
        <Button size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => handleSubmit()} disabled={isLoading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}