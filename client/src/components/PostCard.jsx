import { Link } from 'react-router-dom';

export default function PostCard({ post }) {
  // Get the first image if available, or use default if none exists
  const displayImage = post.images?.[0] || post.image || 'https://www.hostinger.com/tutorials/wp-content/uploads/sites/2/2021/09/how-to-write-a-blog-post.png';
  
  return (
    <Link
      to={`/post/${post.slug}`}
      className='group relative w-full border border-teal-500 hover:border-2 h-[350px] overflow-hidden rounded-lg sm:w-[270px] transition-all'
    >
      <div>
        {/* Render video if available; otherwise, render image */}
        {post.video ? (
          <video
            src={post.video}
            muted
            onMouseOver={(e) => e.target.play()}
            onMouseOut={(e) => {
              e.target.pause();
              e.target.currentTime = 0;
            }}
            alt='post cover'
            className='h-[230px] w-full object-cover group-hover:h-[200px] transition-all duration-300 z-20'
          />
        ) : (
          <img
            src={displayImage}
            alt='post cover'
            className='h-[230px] w-full object-cover group-hover:h-[200px] transition-all duration-300 z-20'
            onError={(e) => {
              e.target.src = 'https://www.hostinger.com/tutorials/wp-content/uploads/sites/2/2021/09/how-to-write-a-blog-post.png';
            }}
          />
        )}
      </div>
      <div className='p-3 flex flex-col gap-2'>
        <p className='text-lg font-semibold line-clamp-2'>{post.title}</p>
        <span className='italic text-sm'>{post.category}</span>
        <Link
          to={`/post/${post.slug}`}
          className='z-10 group-hover:bottom-0 absolute bottom-[-200px] left-0 right-0 border border-teal-500 text-teal-500 hover:bg-teal-500 hover:text-white transition-all duration-300 text-center py-2 rounded-md !rounded-tl-none m-2'
        >
          معلومات أكثر عن الموضوع
        </Link>
      </div>
    </Link>
  );
}
