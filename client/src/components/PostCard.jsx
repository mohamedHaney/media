import { Link } from 'react-router-dom';
import { useRef, useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function PostCard({ post }) {
  const videoRef = useRef(null);
  const [mediaError, setMediaError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const getFirstMedia = () => {
    if (post?.coverMedia !== undefined && post?.media?.length > post.coverMedia)
      return post.media[post.coverMedia];
    if (post?.media?.length > 0) return post.media[0];
    if (post?.images?.length > 0) return { url: post.images[0], type: 'image' };
    if (post?.image) return { url: post.image, type: 'image' };
    if (post?.video) return { url: post.video, type: 'video' };
    return null;
  };

  const firstMedia = getFirstMedia();
  let mediaType = firstMedia?.type;
  if (!mediaType && firstMedia?.url) {
    const url = firstMedia.url.toLowerCase();
    if (url.match(/\.(mp4|webm|mov)$/)) mediaType = 'video';
    else if (url.match(/\.(jpeg|jpg|png|gif|webp)$/)) mediaType = 'image';
  }

  const mediaUrl = firstMedia?.url || 'https://via.placeholder.com/500';

  useEffect(() => {
    const handleLoad = () => setIsLoading(false);
    const handleError = () => {
      setMediaError(true);
      setIsLoading(false);
    };

    if (mediaType === 'image') {
      const img = new Image();
      img.src = mediaUrl;
      img.onload = handleLoad;
      img.onerror = handleError;
    } else if (mediaType === 'video') {
      const video = document.createElement('video');
      video.src = mediaUrl;
      video.onloadeddata = handleLoad;
      video.onerror = handleError;
    } else {
      setIsLoading(false);
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    };
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
      className="relative w-full h-[400px] rounded-3xl overflow-hidden 
                 border border-gray-200 dark:border-gray-700 
                 bg-white dark:bg-gray-900 
                 shadow-md hover:shadow-lg transition-shadow duration-300 
                 flex flex-col group cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label={`View post: ${post.title}`}
    >
      {/* Skeleton Loading */}
      {isLoading && (
        <div className="absolute inset-0 z-20 animate-pulse bg-gradient-to-br from-gray-100 to-gray-300 dark:from-gray-700 dark:to-gray-800" />
      )}

{/* Media Container */}
<div className="relative w-full aspect-video bg-white dark:bg-gray-900 overflow-hidden rounded-t-3xl flex items-center justify-center">
  {mediaType === 'video' && !mediaError ? (
    <>
      <video
        ref={videoRef}
        src={mediaUrl}
        muted
        loop
        playsInline
        className="w-full h-full object-cover"
        onError={handleMediaError}
        aria-label="Video content"
      />

      {/* Play Button Overlay (visible only before hover/play) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 group-hover:opacity-0 transition-opacity duration-300">
        <div className="flex items-center justify-center w-16 h-16 bg-black/50 backdrop-blur-sm rounded-full shadow-lg">
          <svg
            className="w-8 h-8 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </>
  ) : mediaType === 'image' && !mediaError ? (
    <img
      src={mediaUrl}
      alt={post.title || "Post cover"}
      className="w-full h-full object-cover"
      onError={handleMediaError}
      onLoad={() => setIsLoading(false)}
      loading="lazy"
    />
  ) : (
    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 text-sm p-4">
      <svg className="w-12 h-12 mb-2 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      {mediaError ? 'فشل تحميل المحتوى' : 'لا يوجد محتوى'}
    </div>
  )}
</div>

      {/* Content */}
      <div className="flex flex-col justify-around flex-grow px-5 pt-4 pb-3 space-y-3">
        <p className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors duration-200">
          {post.title}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-teal-800 dark:text-teal-300 bg-teal-100 dark:bg-gray-700 px-3 py-1 rounded-full">
            {post.category}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ar })}
          </span>
        </div>
      </div>

      {/* Footer Action */}
      <div className="px-5 pb-5">
        <div className="flex items-center justify-center gap-2 bg-teal-600 dark:bg-teal-700 text-white py-2.5 rounded-xl shadow-md group-hover:bg-teal-700 dark:group-hover:bg-teal-800 transition-colors">
          <span className="text-sm font-medium">معلومات أكثر عن الموضوع</span>
          <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
