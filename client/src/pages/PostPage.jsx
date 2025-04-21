import { Button, Spinner } from 'flowbite-react';
import { useEffect, useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import CommentSection from '../components/CommentSection';
import PostCard from '../components/PostCard';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Keyboard, Zoom } from 'swiper/modules';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/zoom';

export default function PostPage() {
  const { postSlug } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [post, setPost] = useState(null);
  const [recentPosts, setRecentPosts] = useState(null);
  const swiperRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [totalSlides, setTotalSlides] = useState(0);

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

  const getMediaItems = () => {
    if (!post) return [];
    if (post.media && Array.isArray(post.media)) {
      return [...post.media].sort((a, b) => {
        if (a.type === 'video' && b.type !== 'video') return -1;
        if (a.type !== 'video' && b.type === 'video') return 1;
        return 0;
      });
    }
    const media = [];
    if (post.video) {
      media.push({
        url: post.video,
        type: 'video',
        fileName: post.video.split('/').pop()
      });
    }
    if (post.images && post.images.length > 0) {
      post.images.forEach(img =>
        media.push({
          url: img,
          type: 'image',
          fileName: img.split('/').pop()
        })
      );
    } else if (post.image) {
      media.push({
        url: post.image,
        type: 'image',
        fileName: post.image.split('/').pop()
      });
    }
    return media;
  };

  const mediaItems = getMediaItems();

  if (loading)
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <Spinner size='xl' />
      </div>
    );

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
      {mediaItems.length > 0 && (
        <div className="w-full max-w-4xl mt-10" dir="ltr">
          <div className="flex items-center gap-4">
            {/* Left Button (previous) */}
            <button
              onClick={() => swiperRef.current?.swiper.slidePrev()}
              className={`p-2 rounded-full transition duration-300 focus:outline-none focus:ring-2 ${
                activeIndex === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-300 hover:bg-blue-600 text-gray-700 hover:text-white focus:ring-blue-500'
              }`}
              disabled={activeIndex === 0}
              aria-label="Previous slide"
            >
              <HiChevronLeft className="w-6 h-6" />
            </button>
            <Swiper
              ref={swiperRef}
              modules={[Navigation, Pagination, Keyboard, Zoom]}
              pagination={{
                clickable: true,
                dynamicBullets: true
              }}
              keyboard={{ enabled: true }}
              zoom={true}
              spaceBetween={20}
              slidesPerView={1}
              dir="ltr"
              speed={500}
              onSwiper={(swiper) => {
                setTotalSlides(swiper.slides.length);
              }}
              onSlideChange={(swiper) => {
                setActiveIndex(swiper.activeIndex);
              }}
              className="flex-1 rounded-lg shadow-lg"
            >
              {mediaItems.map((media, index) => (
                <SwiperSlide key={index} className="bg-black flex justify-center items-center">
                  <div className="relative rounded-lg w-full">
                    {media.type === 'image' ? (
                      <div className="swiper-zoom-container">
                        <img
                          src={media.url}
                          alt={`${post.title} - Media ${index + 1}`}
                          className="max-w-full max-h-[80vh] object-contain mx-auto"
                          onError={(e) => {
                            e.target.src = 'https://www.hostinger.com/tutorials/wp-content/uploads/sites/2/2021/09/how-to-write-a-blog-post.png';
                          }}
                        />
                      </div>
                    ) : (
                      <video
                        src={media.url}
                        controls
                        className="max-w-full max-h-[80vh] object-contain mx-auto"
                      />
                    )}
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
            {/* Right Button (next) */}
            <button
              onClick={() => swiperRef.current?.swiper.slideNext()}
              className={`p-2 rounded-full transition duration-300 focus:outline-none focus:ring-2 ${
                activeIndex === mediaItems.length - 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-300 hover:bg-blue-600 text-gray-700 hover:text-white focus:ring-blue-500'
              }`}
              disabled={activeIndex === mediaItems.length - 1}
              aria-label="Next slide"
            >
              <HiChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
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
