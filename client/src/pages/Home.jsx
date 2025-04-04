import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import PostCard from '../components/PostCard';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import { Pagination, Autoplay, EffectFade } from 'swiper/modules';
import "./styles.css";

const images = [
  "https://lucienmigne.fr/wp-content/uploads/2022/09/Al-Minya-2-sur-16-min-768x512.jpg",
  "https://lucienmigne.fr/wp-content/uploads/2022/09/Al-Minya-1-sur-16-min-768x512.jpg",
  "https://lucienmigne.fr/wp-content/uploads/2022/09/Al-Minya-8-sur-16-min-768x512.jpg",
  "https://lucienmigne.fr/wp-content/uploads/2022/09/Al-Minya-3-sur-16-min-scaled.jpg",
  "https://lucienmigne.fr/wp-content/uploads/2022/09/Al-Minya-4-sur-16-min-scaled.jpg",
  "https://lucienmigne.fr/wp-content/uploads/2022/09/Al-Minya-5-sur-16-min-768x512.jpg",
  "https://lucienmigne.fr/wp-content/uploads/2022/09/Al-Minya-6-sur-16-min-768x512.jpg",
];

export default function Home() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchPosts = async () => {
      const res = await fetch(`/api/post/getPosts`);
      const data = await res.json();
      setPosts(data.posts);
    };
    fetchPosts();
  }, []);

  return (
    <div>
      {/* Hero Section with Swiper */}
      <div className="hero-section relative h-[calc(100vh-64px)] overflow-hidden flex justify-center">
        <Swiper
          modules={[Pagination, Autoplay, EffectFade]}
          pagination={{ clickable: true }}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          effect="fade"
          loop={true}
          speed={1200}
          className="absolute top-0 left-0 w-full h-full"
        >
          {images.map((img, index) => (
            <SwiperSlide key={index} className="relative">
              <img
                src={img}
                alt={`Slide ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-700 scale-100 hover:scale-105"
              />
            </SwiperSlide>
          ))}
        </Swiper>
        <div className="relative flex flex-col text-center text-white px-8 w-full">
          <h1 className="lg:text-6xl text-2xl font-bold transform transition-transform duration-300 hover:scale-105 mt-12">
            مرحبًا بكم في صقور المحاجر 
          </h1>
          <div className="w-full flex justify-between items-start mt-4 text-gray-100">
            <p className="hidden sm:block text-sm leading-relaxed max-width text-right">
              تلعب وسائل الإعلام دورًا حيويًا في تشكيل فهمنا للعالم من حولنا. 
            </p>
            <p className="hidden sm:block text-sm leading-relaxed max-width text-left">
              Media plays a vital role in shaping our understanding of the world.
            </p>
          </div>
          <Link 
            to="/search" 
            className="text-xs sm:text-sm font-bold text-white hover:underline transition-colors duration-300 mt-4"
          >
            عرض كل المواضيع
          </Link>
        </div>
      </div>

      {/* Recent Posts Section */}
      <div className="max-w-6xl mx-auto px-3 py-7 flex flex-col gap-8">
        {posts && posts.length > 0 && (
          <div className="flex flex-col gap-6">
            <h2 className="text-2xl font-semibold text-center text-gray-500">
              المواضيع الأخيرة
            </h2>
            <div className="flex flex-wrap gap-4">
              {posts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
            <Link 
              to="/search" 
              className="text-lg text-teal-500 hover:text-teal-700 hover:underline text-center transition-colors duration-300"
            >
              عرض جميع الموضوعات
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
