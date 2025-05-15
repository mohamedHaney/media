import { Button, Spinner, Dropdown, Tooltip } from 'flowbite-react';
import { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import { BsShareFill, BsFacebook, BsWhatsapp, BsTwitterX, BsLink45Deg, BsCheck } from 'react-icons/bs';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Keyboard, Zoom } from 'swiper/modules';
import CommentSection from '../components/CommentSection';
import PostCard from '../components/PostCard';
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
  const [isCopied, setIsCopied] = useState(false);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
        setPost(data.posts[0]);
        setLoading(false);
        setError(false);
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
    if (post.images?.length > 0) {
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

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      alert('حدث خطأ أثناء النسخ');
    }
  };

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(post?.title + ' - ' + window.location.href)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(post?.title)}&url=${encodeURIComponent(window.location.href)}`
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
      {/* Breadcrumb */}
      <div className="self-start mb-5 text-sm">
        <Link 
          to="/" 
          className="hover:text-blue-600 dark:hover:text-blue-400 text-gray-600 dark:text-gray-300"
        >
          الرئيسية
        </Link>
        <span className="text-gray-400 dark:text-gray-500"> / </span>
        <Link 
          to={`/search?category=${post?.category}`} 
          className="hover:text-blue-600 dark:hover:text-blue-400 text-gray-600 dark:text-gray-300"
        >
          {post?.category}
        </Link>
        <span className="text-gray-400 dark:text-gray-500"> / </span>
        <span className="text-gray-800 dark:text-gray-100 font-medium">
          {post?.title}
        </span>
      </div>

      <h1 className='text-3xl mt-10 p-4 text-center font-serif max-w-2xl lg:text-4xl'>
        {post?.title}
      </h1>

      <div className="flex items-center gap-3 mt-3">
        <Link to={`/search?category=${post?.category}`}>
          <Button color='gray' pill size='xs'>
            {post?.category}
          </Button>
        </Link>

        <Dropdown 
          label={
            <div className="flex items-center gap-1">
              <BsShareFill className="mr-1" />
              <span>مشاركة</span>
            </div>
          } 
          color='blue' 
          size='sm' 
          pill
          arrowIcon={false}
          className="z-50"
          placement="bottom-end"
        >
          <Dropdown.Item 
            icon={BsFacebook} 
            onClick={() => window.open(shareLinks.facebook, '_blank', 'noopener,noreferrer')}
            className="flex items-center justify-between"
          >
            <span>فيسبوك</span>
            <span className="text-blue-600"><BsFacebook /></span>
          </Dropdown.Item>
          <Dropdown.Item 
            icon={BsWhatsapp} 
            onClick={() => window.open(shareLinks.whatsapp, '_blank', 'noopener,noreferrer')}
            className="flex items-center justify-between"
          >
            <span>واتساب</span>
            <span className="text-green-500"><BsWhatsapp /></span>
          </Dropdown.Item>
          <Dropdown.Item 
            icon={BsTwitterX} 
            onClick={() => window.open(shareLinks.twitter, '_blank', 'noopener,noreferrer')}
            className="flex items-center justify-between"
          >
            <span>تويتر</span>
            <span className="text-black dark:text-white"><BsTwitterX /></span>
          </Dropdown.Item>
          <Dropdown.Item 
            icon={isCopied ? BsCheck : BsLink45Deg} 
            onClick={handleCopyLink}
            className="flex items-center justify-between"
          >
            {isCopied ? 'تم النسخ!' : 'نسخ الرابط'}
            <span className={isCopied ? "text-green-500" : "text-gray-500"}>
              {isCopied ? <BsCheck /> : <BsLink45Deg />}
            </span>
          </Dropdown.Item>
        </Dropdown>
      </div>

      {mediaItems.length > 0 && (
        <div className="w-full max-w-4xl mt-10" dir="ltr">
          <div className="flex items-center gap-4">
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
              pagination={{ clickable: true, dynamicBullets: true }}
              keyboard={{ enabled: true }}
              zoom={true}
              spaceBetween={20}
              slidesPerView={1}
              dir="ltr"
              speed={500}
              onSwiper={(swiper) => setTotalSlides(swiper.slides.length)}
              onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
              className="flex-1 rounded-lg"
            >
              {mediaItems.map((media, index) => (
                <SwiperSlide key={index} className="flex justify-center items-center">
                  <div className="relative w-full h-[500px] overflow-hidden rounded-lg flex justify-center items-center bg-white dark:bg-gray-900">
                    {media.type === 'image' ? (
                      <img
                        src={media.url}
                        alt={`${post.title} - Media ${index + 1}`}
                        className="max-w-full max-h-full object-contain media-item"
                        onError={(e) => {
                          e.target.src =
                            'https://www.hostinger.com/tutorials/wp-content/uploads/sites/2/2021/09/how-to-write-a-blog-post.png';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex justify-center items-center">
                        <video
                          src={media.url}
                          controls
                          className="max-w-full max-h-full object-contain media-item"
                        />
                      </div>
                    )}
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

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