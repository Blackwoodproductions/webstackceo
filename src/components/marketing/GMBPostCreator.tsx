import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, Plus, Loader2, X, ExternalLink, Trash2,
  Calendar, Tag, Link as LinkIcon, Sparkles
} from 'lucide-react';

interface GmbPost {
  name: string;
  summary?: string;
  createTime: string;
  topicType?: string;
  searchUrl?: string;
  state?: string;
  callToAction?: {
    actionType: string;
    url?: string;
  };
  media?: Array<{
    name: string;
    mediaFormat: string;
    googleUrl?: string;
  }>;
}

interface CreatePostData {
  summary?: string;
  callToAction?: {
    actionType: string;
    url?: string;
  };
  topicType?: string;
}

interface GMBPostCreatorProps {
  posts: GmbPost[];
  onCreatePost: (data: CreatePostData) => Promise<unknown>;
  onDeletePost: (postName: string) => Promise<boolean>;
  onRefresh: () => Promise<void>;
  isLoading: boolean;
}

const POST_TYPES = [
  { value: 'STANDARD', label: 'Update', description: 'Share news or updates' },
  { value: 'OFFER', label: 'Offer', description: 'Promote a special deal' },
  { value: 'EVENT', label: 'Event', description: 'Announce an event' },
];

const CTA_TYPES = [
  { value: 'LEARN_MORE', label: 'Learn more' },
  { value: 'BOOK', label: 'Book' },
  { value: 'ORDER', label: 'Order online' },
  { value: 'SHOP', label: 'Shop' },
  { value: 'SIGN_UP', label: 'Sign up' },
  { value: 'CALL', label: 'Call' },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function GMBPostCreator({ posts, onCreatePost, onDeletePost, onRefresh, isLoading }: GMBPostCreatorProps) {
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingPost, setDeletingPost] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    summary: '',
    topicType: 'STANDARD',
    ctaType: '',
    ctaUrl: '',
  });

  const handleSubmit = async () => {
    if (!formData.summary.trim()) return;
    
    setIsSubmitting(true);
    const postData: CreatePostData = {
      summary: formData.summary,
      topicType: formData.topicType,
    };

    if (formData.ctaType && formData.ctaUrl) {
      postData.callToAction = {
        actionType: formData.ctaType,
        url: formData.ctaUrl.startsWith('http') ? formData.ctaUrl : `https://${formData.ctaUrl}`,
      };
    }

    const result = await onCreatePost(postData);
    setIsSubmitting(false);

    if (result) {
      setShowForm(false);
      setFormData({ summary: '', topicType: 'STANDARD', ctaType: '', ctaUrl: '' });
    }
  };

  const handleDelete = async (postName: string) => {
    setDeletingPost(postName);
    await onDeletePost(postName);
    setDeletingPost(null);
  };

  return (
    <Card className="border-pink-500/20 bg-gradient-to-br from-card to-pink-500/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="w-4 h-4 text-pink-500" />
            Google Posts
            {posts.length > 0 && (
              <Badge variant="outline" className="text-xs ml-2">
                {posts.length} posts
              </Badge>
            )}
          </CardTitle>
          <Button 
            size="sm" 
            onClick={() => setShowForm(!showForm)}
            className={showForm ? "bg-muted" : "bg-gradient-to-r from-pink-600 to-rose-600"}
          >
            {showForm ? <X className="w-3 h-3 mr-1" /> : <Plus className="w-3 h-3 mr-1" />}
            {showForm ? 'Cancel' : 'New Post'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-4 rounded-xl bg-background/50 border border-pink-500/20 space-y-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-pink-500" />
                <span className="text-sm font-medium">Create New Post</span>
              </div>

              {/* Post Type Selection */}
              <div className="flex gap-2">
                {POST_TYPES.map(type => (
                  <button
                    key={type.value}
                    onClick={() => setFormData(prev => ({ ...prev, topicType: type.value }))}
                    className={`flex-1 p-2 rounded-lg border transition-all text-xs ${
                      formData.topicType === type.value
                        ? 'border-pink-500 bg-pink-500/10 text-pink-400'
                        : 'border-border hover:border-pink-500/50'
                    }`}
                  >
                    <span className="font-medium block">{type.label}</span>
                    <span className="text-muted-foreground text-[10px]">{type.description}</span>
                  </button>
                ))}
              </div>

              {/* Post Content */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Post Content</label>
                <Textarea
                  value={formData.summary}
                  onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                  placeholder="Share an update with your customers..."
                  className="min-h-[100px] text-sm"
                  maxLength={1500}
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {formData.summary.length}/1500 characters
                </p>
              </div>

              {/* Call to Action */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Call to Action (optional)</label>
                  <select
                    value={formData.ctaType}
                    onChange={(e) => setFormData(prev => ({ ...prev, ctaType: e.target.value }))}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">None</option>
                    {CTA_TYPES.map(cta => (
                      <option key={cta.value} value={cta.value}>{cta.label}</option>
                    ))}
                  </select>
                </div>
                {formData.ctaType && (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Button URL</label>
                    <Input
                      value={formData.ctaUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, ctaUrl: e.target.value }))}
                      placeholder="https://example.com"
                      className="h-9 text-sm"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSubmit}
                  disabled={isSubmitting || !formData.summary.trim()}
                  className="bg-gradient-to-r from-pink-600 to-rose-600"
                >
                  {isSubmitting ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <FileText className="w-3 h-3 mr-1" />}
                  Publish Post
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Posts List */}
        {isLoading && posts.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
          </div>
        ) : posts.length > 0 ? (
          <ScrollArea className="h-[300px]">
            <div className="space-y-3 pr-2">
              {posts.map((post, i) => (
                <motion.div
                  key={post.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-4 rounded-xl bg-background/50 border border-border group hover:border-pink-500/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-[10px] border-pink-500/30 text-pink-400">
                          <Tag className="w-2.5 h-2.5 mr-1" />
                          {post.topicType || 'Update'}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          {formatDate(post.createTime)}
                        </span>
                      </div>
                      <p className="text-sm text-foreground line-clamp-3">{post.summary}</p>
                      
                      {post.callToAction && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-pink-400">
                          <LinkIcon className="w-3 h-3" />
                          <span>{post.callToAction.actionType.replace(/_/g, ' ')}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {post.searchUrl && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100"
                          onClick={() => window.open(post.searchUrl, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100"
                        onClick={() => handleDelete(post.name)}
                        disabled={deletingPost === post.name}
                      >
                        {deletingPost === post.name ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-pink-500/10 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-pink-500/50" />
            </div>
            <p className="text-sm font-medium mb-2">No posts yet</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Google Posts help you share updates, offers, and events directly on your Business Profile.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
