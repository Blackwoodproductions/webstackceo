import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Image as ImageIcon, Plus, Loader2, X, Trash2, ExternalLink,
  Upload, Link as LinkIcon
} from 'lucide-react';

interface GmbMedia {
  name: string;
  mediaFormat: string;
  googleUrl?: string;
  thumbnailUrl?: string;
  createTime?: string;
  locationAssociation?: {
    category?: string;
  };
  description?: string;
}

interface UploadMediaData {
  sourceUrl: string;
  mediaFormat?: string;
  category?: string;
  description?: string;
}

interface GMBPhotoManagerProps {
  media: GmbMedia[];
  onUpload: (data: UploadMediaData) => Promise<unknown>;
  onDelete: (mediaName: string) => Promise<boolean>;
  onRefresh: () => Promise<void>;
  isLoading: boolean;
}

const PHOTO_CATEGORIES = [
  { value: 'COVER', label: 'Cover photo' },
  { value: 'PROFILE', label: 'Profile photo' },
  { value: 'LOGO', label: 'Logo' },
  { value: 'EXTERIOR', label: 'Exterior' },
  { value: 'INTERIOR', label: 'Interior' },
  { value: 'PRODUCT', label: 'Product' },
  { value: 'AT_WORK', label: 'At work' },
  { value: 'FOOD_AND_DRINK', label: 'Food & drink' },
  { value: 'MENU', label: 'Menu' },
  { value: 'COMMON_AREA', label: 'Common area' },
  { value: 'ROOMS', label: 'Rooms' },
  { value: 'TEAMS', label: 'Team' },
  { value: 'ADDITIONAL', label: 'Additional' },
];

export function GMBPhotoManager({ media, onUpload, onDelete, onRefresh, isLoading }: GMBPhotoManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingMedia, setDeletingMedia] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    sourceUrl: '',
    category: 'ADDITIONAL',
    description: '',
  });

  const handleSubmit = async () => {
    if (!formData.sourceUrl.trim()) return;
    
    setIsSubmitting(true);
    const uploadData: UploadMediaData = {
      sourceUrl: formData.sourceUrl.startsWith('http') ? formData.sourceUrl : `https://${formData.sourceUrl}`,
      mediaFormat: 'PHOTO',
      category: formData.category,
      description: formData.description || undefined,
    };

    const result = await onUpload(uploadData);
    setIsSubmitting(false);

    if (result) {
      setShowForm(false);
      setFormData({ sourceUrl: '', category: 'ADDITIONAL', description: '' });
    }
  };

  const handleDelete = async (mediaName: string) => {
    setDeletingMedia(mediaName);
    await onDelete(mediaName);
    setDeletingMedia(null);
  };

  return (
    <Card className="border-cyan-500/20 bg-gradient-to-br from-card to-cyan-500/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-cyan-500" />
            Photos & Media
            {media.length > 0 && (
              <Badge variant="outline" className="text-xs ml-2">
                {media.length} photos
              </Badge>
            )}
          </CardTitle>
          <Button 
            size="sm" 
            onClick={() => setShowForm(!showForm)}
            className={showForm ? "bg-muted" : "bg-gradient-to-r from-cyan-600 to-blue-600"}
          >
            {showForm ? <X className="w-3 h-3 mr-1" /> : <Plus className="w-3 h-3 mr-1" />}
            {showForm ? 'Cancel' : 'Upload'}
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
              className="mb-4 p-4 rounded-xl bg-background/50 border border-cyan-500/20 space-y-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Upload className="w-4 h-4 text-cyan-500" />
                <span className="text-sm font-medium">Upload Photo</span>
              </div>

              {/* Image URL */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
                  <LinkIcon className="w-3 h-3" />
                  Image URL
                </label>
                <Input
                  value={formData.sourceUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, sourceUrl: e.target.value }))}
                  placeholder="https://example.com/photo.jpg"
                  className="text-sm"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Enter a publicly accessible URL to your image (JPG, PNG)
                </p>
              </div>

              {/* Category */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Photo Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {PHOTO_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Description (optional)</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe this photo..."
                  className="text-sm"
                  maxLength={500}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSubmit}
                  disabled={isSubmitting || !formData.sourceUrl.trim()}
                  className="bg-gradient-to-r from-cyan-600 to-blue-600"
                >
                  {isSubmitting ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />}
                  Upload Photo
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Media Grid */}
        {isLoading && media.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
          </div>
        ) : media.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {media.map((item, i) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="relative group aspect-square rounded-xl overflow-hidden bg-muted border border-border hover:border-cyan-500/30 transition-colors"
              >
                {item.googleUrl || item.thumbnailUrl ? (
                  <img
                    src={item.thumbnailUrl || item.googleUrl}
                    alt={item.description || 'Business photo'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                )}
                
                {/* Category Badge */}
                {item.locationAssociation?.category && (
                  <Badge 
                    variant="outline" 
                    className="absolute top-2 left-2 text-[8px] bg-background/80 backdrop-blur-sm"
                  >
                    {item.locationAssociation.category.replace(/_/g, ' ')}
                  </Badge>
                )}

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {item.googleUrl && (
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => window.open(item.googleUrl, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDelete(item.name)}
                    disabled={deletingMedia === item.name}
                  >
                    {deletingMedia === item.name ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="w-8 h-8 text-cyan-500/50" />
            </div>
            <p className="text-sm font-medium mb-2">No photos yet</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Photos help customers understand your business. Add images of your products, services, and location.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
