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

  return (
    <main className='p-5 flex flex-col items-center max-w-6xl mx-auto min-h-screen'>
      <h1 className='text-3xl mt-10 p-4 text-center font-serif max-w-2xl lg:text-4xl'>
        {post && post.title}
      </h1>
      <Link
        to={`/search?category=${post && post.category}`}
        className='self-center mt-5'
      >
        <Button color='gray' pill size='xs'>
          {post && post.category}
        </Button>
      </Link>

      {/* Media Display Section - Updated for multiple images */}
      <div className="w-full max-w-4xl mt-10">
        {post && post.video ? (
          <video
            src={post.video}
            controls
            className='max-h-[600px] w-full object-cover rounded-lg shadow-md hover:shadow-xl transition duration-300'
          />
        ) : post && post.images && post.images.length > 0 ? (
          post.images.length === 1 ? (
            <img
              src={post.images[0]}
              alt={post.title}
              className='max-h-[600px] w-full object-cover rounded-lg shadow-md hover:shadow-xl transition duration-300'
            />
          ) : (
            <Swiper
              modules={[Pagination, Autoplay]}
              pagination={{ clickable: true }}
              autoplay={{ delay: 5000 }}
              className="rounded-lg shadow-md"
            >
              {post.images.map((image, index) => (
                <SwiperSlide key={index}>
                  <img
                    src={image}
                    alt={`${post.title} - Image ${index + 1}`}
                    className='max-h-[600px] w-full object-cover'
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          )
        ) : null}
      </div>

      <div className='flex justify-between w-full max-w-2xl mt-5 p-3 border-b border-slate-500 text-xs'>
        <span>{post && new Date(post.createdAt).toLocaleDateString()}</span>
        <span className='italic'>
          {post && (post.content.length / 1000).toFixed(0)} دقائق للقراءه
        </span>
      </div>
      <div
        className='p-4 max-w-2xl mx-auto w-full mt-5 post-content'
        dangerouslySetInnerHTML={{ __html: post && post.content }}
      ></div>
      
      {post && <CommentSection postId={post._id} />}

      <div className='flex flex-col items-center w-full mt-10 mb-5'>
        <h2 className='text-xl'>Recent Articles</h2>
        <div className='flex flex-wrap gap-5 mt-5 justify-center'>
          {recentPosts &&
            recentPosts.map((post) => <PostCard key={post._id} post={post} />)}
        </div>
      </div>
    </main>
  );
}
