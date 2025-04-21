import { Link } from 'react-router-dom';
import { useRef, useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function PostCard({ post }) {
  const videoRef = useRef(null);
  const [mediaError, setMediaError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Get the first media item
  const getFirstMedia = () => {
    // Check if coverMedia is valid
    if (post?.coverMedia !== undefined && 
        post?.coverMedia !== null && 
        post?.media?.length > post.coverMedia) {
      return post.media[post.coverMedia];
    }
    // Fallback to first media
    if (post?.media?.length > 0) return post.media[0];
    if (post?.images?.length > 0) return { url: post.images[0], type: 'image' };
    if (post?.image) return { url: post.image, type: 'image' };
    if (post?.video) return { url: post.video, type: 'video' };
    return null;
  };

  const firstMedia = getFirstMedia();
  let mediaType = firstMedia?.type;

  // Determine media type if not specified
  if (!mediaType && firstMedia?.url) {
    const url = firstMedia.url.toLowerCase();
    if (url.match(/\.(mp4|webm|mov)$/)) mediaType = 'video';
    else if (url.match(/\.(jpeg|jpg|png|gif|webp)$/)) mediaType = 'image';
  }

  const mediaUrl = firstMedia?.url || 'https://via.placeholder.com/500';

  useEffect(() => {
    if (mediaType === 'image') {
      const img = new Image();
      img.src = mediaUrl;
      img.onload = () => setIsLoading(false);
      img.onerror = () => {
        setMediaError(true);
        setIsLoading(false);
      };
    } else if (mediaType === 'video') {
      const video = document.createElement('video');
      video.src = mediaUrl;
      video.onloadeddata = () => setIsLoading(false);
      video.onerror = () => {
        setMediaError(true);
        setIsLoading(false);
      };
    } else {
      setIsLoading(false);
    }
  }, [mediaUrl, mediaType]);

  const handleMouseEnter = () => {
    if (videoRef.current && mediaType === 'video' && !mediaError) {
      videoRef.current.play().catch(e => console.log("Autoplay prevented:", e));
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current && mediaType === 'video' && !mediaError) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handleMediaError = () => {
    setMediaError(true);
    setIsLoading(false);
  };

  return (
    <Link
      to={`/post/${post.slug}`}
      className="relative w-full h-[420px] overflow-hidden rounded-3xl 
                border border-gray-200 dark:border-gray-700 
                shadow-sm dark:shadow-none
                bg-white dark:bg-gray-800
                transition-colors duration-200"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label={`View post: ${post.title}`}
    >
      {isLoading && (
        <div className="absolute inset-0 z-20 
                      bg-gradient-to-br from-gray-100 to-gray-200 
                      dark:from-gray-700 dark:to-gray-800 
                      animate-pulse">
          <div className="h-[250px] w-full bg-gray-300 dark:bg-gray-600" />
          <div className="p-4 space-y-3">
            <div className="h-5 w-3/4 bg-gray-300 dark:bg-gray-600 rounded" />
            <div className="h-4 w-1/2 bg-gray-300 dark:bg-gray-600 rounded" />
          </div>
        </div>
      )}
      <div className="relative h-[250px] w-full 
                    bg-gradient-to-br from-gray-100 to-gray-200 
                    dark:from-gray-700 dark:to-gray-800 
                    overflow-hidden rounded-t-3xl">
        {mediaType === 'video' && !mediaError ? (
          <div className="relative h-full w-full">
            <video
              ref={videoRef}
              src={mediaUrl}
              muted
              loop
              playsInline
              className="h-full w-full object-cover z-10"
              onError={handleMediaError}
              aria-label="Video content"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 bg-teal-600/70 dark:bg-teal-500/80 rounded-full flex items-center justify-center backdrop-blur-md shadow-xl">
                <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              </div>
            </div>
          </div>
        ) : mediaType === 'image' && !mediaError ? (
          <img
            src={mediaUrl}
            alt={post.title || "Post cover"}
            className="h-full w-full object-cover z-10"
            onError={handleMediaError}
            onLoad={() => setIsLoading(false)}
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center 
                        text-gray-500 dark:text-gray-400 text-sm p-4">
            <svg className="w-12 h-12 mb-2 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {mediaError ? 'Media failed to load' : 'No media available'}
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col gap-2 relative z-10">
        <p className="text-xl font-semibold 
                    text-gray-900 dark:text-gray-100 
                    line-clamp-2 leading-tight">
          {post.title}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-sm 
                         text-teal-700 dark:text-teal-400 
                         font-semibold px-3 py-1 
                         bg-teal-50 dark:bg-gray-700 
                         rounded-full shadow-sm">
            {post.category}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ar })}
          </span>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 px-5">
        <div className="flex items-center justify-center gap-2 
                      bg-teal-600 dark:bg-teal-700 
                      text-white py-3 mb-3 
                      rounded-2xl shadow-xl">
          <span className="text-sm font-medium">معلومات أكثر عن الموضوع</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </div>
      </div>
      <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 
                      bg-teal-500/10 dark:bg-teal-500/20 
                      transform rotate-45 origin-bottom-left -translate-y-1/2" />
      </div>
    </Link>
  );
}
