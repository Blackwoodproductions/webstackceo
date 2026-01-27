import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GmbPost {
  name: string;
  languageCode: string;
  summary?: string;
  createTime: string;
  updateTime?: string;
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

interface GmbCategory {
  name: string;
  displayName: string;
}

interface UpdateLocationData {
  title?: string;
  websiteUri?: string;
  phoneNumber?: string;
  description?: string;
  regularHours?: Array<{
    day: string;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
  }>;
}

interface CreatePostData {
  summary?: string;
  callToAction?: {
    actionType: string;
    url?: string;
  };
  topicType?: string;
  mediaItems?: Array<{
    sourceUrl: string;
    mediaFormat: string;
  }>;
}

interface UploadMediaData {
  sourceUrl: string;
  mediaFormat?: string;
  category?: string;
  description?: string;
}

export function useGmbApi(accessToken: string | null) {
  const [isLoading, setIsLoading] = useState(false);
  const [posts, setPosts] = useState<GmbPost[]>([]);
  const [media, setMedia] = useState<GmbMedia[]>([]);

  const callApi = useCallback(async (
    action: string, 
    params: Record<string, unknown> = {}
  ): Promise<{ success: boolean; data?: unknown; error?: string }> => {
    if (!accessToken) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const { data, error } = await supabase.functions.invoke('gmb-api', {
        body: { accessToken, action, ...params },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.error) {
        // Handle auth errors
        if (data.isAuthError) {
          // Clear tokens
          localStorage.removeItem('gmb_access_token');
          localStorage.removeItem('gmb_token_expiry');
          toast.error('Session expired. Please reconnect your Google account.');
        }
        return { success: false, error: data.error };
      }

      return { success: true, data: data?.data };
    } catch (err) {
      console.error(`[useGmbApi] ${action} error:`, err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [accessToken]);

  // ===== READ OPERATIONS =====

  const fetchPosts = useCallback(async (locationName: string) => {
    setIsLoading(true);
    const result = await callApi('getPosts', { locationName });
    setIsLoading(false);

    if (result.success && result.data) {
      const postsData = (result.data as { localPosts?: GmbPost[] }).localPosts || [];
      setPosts(postsData);
      return postsData;
    }
    return [];
  }, [callApi]);

  const fetchMedia = useCallback(async (locationName: string) => {
    setIsLoading(true);
    const result = await callApi('getMedia', { locationName });
    setIsLoading(false);

    if (result.success && result.data) {
      const mediaData = (result.data as { mediaItems?: GmbMedia[] }).mediaItems || [];
      setMedia(mediaData);
      return mediaData;
    }
    return [];
  }, [callApi]);

  const searchCategories = useCallback(async (query: string, regionCode = 'US'): Promise<GmbCategory[]> => {
    const result = await callApi('searchCategories', { categoryQuery: query, regionCode });
    
    if (result.success && result.data) {
      return (result.data as { categories?: GmbCategory[] }).categories || [];
    }
    return [];
  }, [callApi]);

  // ===== WRITE OPERATIONS =====

  const updateLocation = useCallback(async (
    locationName: string, 
    updateData: UpdateLocationData
  ): Promise<boolean> => {
    setIsLoading(true);
    const result = await callApi('updateLocation', { locationName, updateData });
    setIsLoading(false);

    if (result.success) {
      toast.success('Business information updated successfully');
      return true;
    } else {
      toast.error(result.error || 'Failed to update business information');
      return false;
    }
  }, [callApi]);

  const replyToReview = useCallback(async (
    reviewName: string, 
    replyComment: string
  ): Promise<boolean> => {
    setIsLoading(true);
    const result = await callApi('replyToReview', { reviewName, replyComment });
    setIsLoading(false);

    if (result.success) {
      toast.success('Reply posted successfully');
      return true;
    } else {
      toast.error(result.error || 'Failed to post reply');
      return false;
    }
  }, [callApi]);

  const deleteReviewReply = useCallback(async (reviewName: string): Promise<boolean> => {
    setIsLoading(true);
    const result = await callApi('deleteReviewReply', { reviewName });
    setIsLoading(false);

    if (result.success) {
      toast.success('Reply deleted');
      return true;
    } else {
      toast.error(result.error || 'Failed to delete reply');
      return false;
    }
  }, [callApi]);

  const createPost = useCallback(async (
    locationName: string, 
    postData: CreatePostData
  ): Promise<GmbPost | null> => {
    setIsLoading(true);
    const result = await callApi('createPost', { locationName, postData });
    setIsLoading(false);

    if (result.success) {
      toast.success('Post created successfully');
      // Refresh posts
      await fetchPosts(locationName);
      return result.data as GmbPost;
    } else {
      toast.error(result.error || 'Failed to create post');
      return null;
    }
  }, [callApi, fetchPosts]);

  const deletePost = useCallback(async (
    postName: string, 
    locationName: string
  ): Promise<boolean> => {
    setIsLoading(true);
    const result = await callApi('deletePost', { locationName: postName });
    setIsLoading(false);

    if (result.success) {
      toast.success('Post deleted');
      // Refresh posts
      await fetchPosts(locationName);
      return true;
    } else {
      toast.error(result.error || 'Failed to delete post');
      return false;
    }
  }, [callApi, fetchPosts]);

  const uploadMedia = useCallback(async (
    locationName: string, 
    mediaData: UploadMediaData
  ): Promise<GmbMedia | null> => {
    setIsLoading(true);
    const result = await callApi('uploadMedia', { locationName, mediaData });
    setIsLoading(false);

    if (result.success) {
      toast.success('Photo uploaded successfully');
      // Refresh media
      await fetchMedia(locationName);
      return result.data as GmbMedia;
    } else {
      toast.error(result.error || 'Failed to upload photo');
      return null;
    }
  }, [callApi, fetchMedia]);

  const deleteMedia = useCallback(async (
    mediaName: string, 
    locationName: string
  ): Promise<boolean> => {
    setIsLoading(true);
    const result = await callApi('deleteMedia', { mediaName });
    setIsLoading(false);

    if (result.success) {
      toast.success('Photo deleted');
      // Refresh media
      await fetchMedia(locationName);
      return true;
    } else {
      toast.error(result.error || 'Failed to delete photo');
      return false;
    }
  }, [callApi, fetchMedia]);

  return {
    isLoading,
    posts,
    media,
    // Read operations
    fetchPosts,
    fetchMedia,
    searchCategories,
    // Write operations
    updateLocation,
    replyToReview,
    deleteReviewReply,
    createPost,
    deletePost,
    uploadMedia,
    deleteMedia,
  };
}
