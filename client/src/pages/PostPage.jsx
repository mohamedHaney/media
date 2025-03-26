import { Button, Spinner } from 'flowbite-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import CommentSection from '../components/CommentSection';
import PostCard from '../components/PostCard';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import { Pagination, Autoplay, EffectFade } from 'swiper/modules';

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

      {/* Enhanced Media Display Section */}
      <div className="w-full max-w-4xl mt-10">
        {post && post.video ? (
          <div className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-xl">
            <video
              src={post.video}
              controls
              className="w-full h-full object-contain"
              poster={post.images?.[0]} // Use first image as video poster
            />
          </div>
        ) : post && post.images && post.images.length > 0 ? (
          post.images.length === 1 ? (
            <div className="relative group">
              <div className="aspect-[16/9] bg-gray-100 rounded-xl overflow-hidden shadow-xl">
                <img
                  src={post.images[0]}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          ) : (
            <div className="relative">
              <Swiper
                modules={[Pagination, Autoplay, EffectFade]}
                pagination={{ 
                  clickable: true,
                  dynamicBullets: true,
                  renderBullet: (index, className) => {
                    return `<span class="${className} bg-white opacity-80 hover:opacity-100 transition-opacity"></span>`;
                  }
                }}
                autoplay={{ 
                  delay: 5000,
                  pauseOnMouseEnter: true,
                  disableOnInteraction: false
                }}
                effect="fade"
                fadeEffect={{ crossFade: true }}
                loop={true}
                className="rounded-xl shadow-xl overflow-hidden"
              >
                {post.images.map((image, index) => (
                  <SwiperSlide key={index}>
                    <div className="aspect-[16/9] bg-gray-100">
                      <img
                        src={image}
                        alt={`${post.title} - Image ${index + 1}`}
                        className="w-full h-full object-cover"
                        loading={index < 3 ? "eager" : "lazy"}
                      />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
              <div className="absolute bottom-4 left-0 right-0 flex justify-center z-10">
                <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {post.images.length} صور
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="aspect-[16/9] bg-gray-100 rounded-xl flex items-center justify-center shadow-xl">
            <span className="text-gray-400">لا توجد وسائط متاحة</span>
          </div>
        )}
      </div>

      <div className='flex justify-between w-full max-w-2xl mt-8 p-3 border-b border-slate-200 text-sm text-gray-600'>
        <span>{post && new Date(post.createdAt).toLocaleDateString('ar-EG')}</span>
        <span className='italic'>
          {post && Math.max(1, (post.content.length / 1500).toFixed(0))} دقائق للقراءة
        </span>
      </div>
      
      <div
        className='p-4 max-w-2xl mx-auto w-full mt-8 post-content prose prose-lg prose-headings:font-serif prose-img:rounded-xl prose-img:shadow-md'
        dangerouslySetInnerHTML={{ __html: post && post.content }}
      />
      
      {post && <CommentSection postId={post._id} />}

      <div className='flex flex-col items-center w-full mt-16 mb-10'>
        <h2 className='text-2xl font-serif mb-6'>مقالات ذات صلة</h2>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full'>
          {recentPosts &&
            recentPosts.map((post) => (
              <PostCard key={post._id} post={post} className="h-full" />
            ))}
        </div>
      </div>
    </main>
  );
}
