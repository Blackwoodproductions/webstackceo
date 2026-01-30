import { memo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Shield, Upload, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useWhiteLabel } from '@/hooks/use-white-label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface WhiteLabelLogoProps {
  className?: string;
}

export const WhiteLabelLogo = memo(function WhiteLabelLogo({ className }: WhiteLabelLogoProps) {
  const { settings, isWhiteLabelAdmin, updateLogo } = useWhiteLabel();
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoUrlInput, setLogoUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setUploading(true);
    try {
      const fileName = `logos/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('website-screenshots')
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('website-screenshots')
        .getPublicUrl(data.path);

      const { error: updateError } = await updateLogo(publicUrl);
      if (updateError) throw new Error(updateError);

      toast.success('Logo updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleUrlSubmit = async () => {
    if (!logoUrlInput.trim()) {
      toast.error('Please enter a logo URL');
      return;
    }

    setUploading(true);
    try {
      const { error } = await updateLogo(logoUrlInput.trim());
      if (error) throw new Error(error);

      toast.success('Logo updated successfully!');
      setIsEditing(false);
      setLogoUrlInput('');
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update logo');
    } finally {
      setUploading(false);
    }
  };

  // Default logo content
  const defaultLogo = (
    <Link to="/" className={`flex items-center gap-3 group ${className}`}>
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-primary to-violet-500 rounded-xl blur-md opacity-40 group-hover:opacity-70 transition-opacity duration-300" />
        <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 via-primary to-violet-500 flex items-center justify-center shadow-lg">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className="hidden sm:block">
        <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 via-primary to-violet-400 bg-clip-text text-transparent">
          Webstack
        </span>
        <span className="text-[10px] text-muted-foreground block -mt-0.5">.ceo</span>
      </div>
    </Link>
  );

  // If user is white label admin with custom logo
  if (isWhiteLabelAdmin && settings?.logo_url) {
    return (
      <Popover open={isEditing} onOpenChange={setIsEditing}>
        <PopoverTrigger asChild>
          <button className={`flex items-center gap-3 group cursor-pointer ${className}`}>
            <img
              src={settings.logo_url}
              alt={settings.company_name || 'Logo'}
              className="h-9 w-auto max-w-[120px] object-contain"
            />
            {settings.company_name && (
              <span className="hidden sm:block text-lg font-bold text-foreground">
                {settings.company_name}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-4">
            <h4 className="font-medium">Update Your Logo</h4>
            
            {/* File upload */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload Image'}
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-popover px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            {/* URL input */}
            <div className="flex gap-2">
              <Input
                placeholder="Enter logo URL..."
                value={logoUrlInput}
                onChange={(e) => setLogoUrlInput(e.target.value)}
              />
              <Button size="icon" onClick={handleUrlSubmit} disabled={uploading}>
                <Check className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // If user is white label admin but no logo set yet
  if (isWhiteLabelAdmin) {
    return (
      <Popover open={isEditing} onOpenChange={setIsEditing}>
        <PopoverTrigger asChild>
          <div className="relative cursor-pointer group">
            {defaultLogo}
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
              <Upload className="w-2.5 h-2.5 text-white" />
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-4">
            <h4 className="font-medium">Customize Your Logo</h4>
            <p className="text-sm text-muted-foreground">
              Upload your company logo to personalize the dashboard.
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload Logo'}
            </Button>

            <div className="flex gap-2">
              <Input
                placeholder="Or enter logo URL..."
                value={logoUrlInput}
                onChange={(e) => setLogoUrlInput(e.target.value)}
              />
              <Button size="icon" onClick={handleUrlSubmit} disabled={uploading}>
                <Check className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Default logo for regular users
  return defaultLogo;
});

export default WhiteLabelLogo;
