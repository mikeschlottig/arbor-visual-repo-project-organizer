import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { Comment, User } from '@shared/types';
interface CommentSectionProps {
  comments: Comment[];
  users: User[];
  entityId: string;
  onAddComment: (entityId: string, text: string) => Promise<void>;
}
export function CommentSection({ comments, users, entityId, onAddComment }: CommentSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const usersById = new Map(users.map(u => [u.id, u]));
  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddComment(entityId, newComment);
      setNewComment('');
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {comments.map((comment) => {
          const author = usersById.get(comment.authorId);
          return (
            <div key={comment.id} className="flex items-start gap-3">
              <Avatar>
                <AvatarImage src={`https://avatar.vercel.sh/${author?.name}.png`} />
                <AvatarFallback>{author?.name.charAt(0) ?? '?'}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold">{author?.name ?? 'Unknown User'}</span>
                  <span className="text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm mt-1">{comment.text}</p>
              </div>
            </div>
          );
        })}
      </div>
      <Card>
        <CardContent className="p-4">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="mb-2"
          />
          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={isSubmitting || !newComment.trim()}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Comment
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}