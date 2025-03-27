import { Button, Spinner } from 'flowbite-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import CommentSection from '../components/CommentSection';
import PostCard from '../components/PostCard';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import { Pagination, Autoplay } from 'swiper/modules';

export default function PostPage() {
  const { postSlug } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [post, setPost] = useState(null);
  const [recentPosts, setRecentPosts] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/post/getposts?slug=${postSlug}`);
        const data = await res.json();
        if (!res.ok) {
          setError(true);
          setLoading(false);
          return;
        }
        if (res.ok) {
          setPost(data.posts[0]);
          setLoading(false);
          setError(false);
        }
      } catch (error) {
        setError(true);
        setLoading(false);
      }
    };
    fetchPost();
  }, [postSlug]);

  useEffect(() => {
    try {
      const fetchRecentPosts = async () => {
        const res = await fetch(`/api/post/getposts?limit=3`);
        const data = await res.json();
        if (res.ok) {
          setRecentPosts(data.posts);
        }
      };
      fetchRecentPosts();
    } catch (error) {
      console.log(error.message);
    }
  }, []);

  if (loading)
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <Spinner size='xl' />
      </div>
    );

  // Get the first image for display (supports both old and new schema)
  const displayImage = post?.images?.[0] || post?.image;

  return (
    <main className='p-5 flex flex-col items-center max-w-6xl mx-auto min-h-screen'>
      <h1 className='text-3xl mt-10 p-4 text-center font-serif max-w-2xl lg:text-4xl'>
        {post?.title}
      </h1>
      <Link
        to={`/search?category=${post?.category}`}
        className='self-center mt-5'
      >
        <Button color='gray' pill size='xs'>
          {post?.category}
        </Button>
      </Link>

      {/* Media display section - updated to support both schemas */}
      {post?.video ? (
        <video
          src={post.video}
          controls
          className='mt-10 max-h-[600px] w-full object-cover rounded-lg shadow-md hover:shadow-xl transition duration-300'
        />
      ) : displayImage ? (
        <img
          src={displayImage}
          alt={post.title}
          className='mt-10 max-h-[600px] w-full object-cover rounded-lg shadow-md hover:shadow-xl transition duration-300'
          onError={(e) => {
            e.target.src = 'https://www.hostinger.com/tutorials/wp-content/uploads/sites/2/2021/09/how-to-write-a-blog-post.png';
          }}
        />
      ) : null}

      <div className='flex justify-between w-full max-w-2xl mt-5 p-3 border-b border-slate-500 text-xs'>
        <span>{post && new Date(post.createdAt).toLocaleDateString()}</span>
        <span className='italic'>
          {post && Math.max(1, (post.content.length / 1000).toFixed(0))} دقائق للقراءه
        </span>
      </div>
      
      <div
        className='p-4 max-w-2xl mx-auto w-full mt-5 post-content'
        dangerouslySetInnerHTML={{ __html: post?.content }}
      ></div>
      
      {post && <CommentSection postId={post._id} />}

      <div className='flex flex-col items-center w-full mt-10 mb-5'>
        <h2 className='text-xl'>مقالات حديثة</h2>
        <div className='flex flex-wrap gap-5 mt-5 justify-center'>
          {recentPosts?.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      </div>
    </main>
  );
}
