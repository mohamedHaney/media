import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import PostCard from '../components/PostCard';
import myVideo from "../media/myVideo.mp4";
import "./styles.css"
export default function Home() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchPosts = async () => {
      const res = await fetch('/api/post/getPosts');
      const data = await res.json();
      setPosts(data.posts);
    };
    fetchPosts();
  }, []);

  return (
    <div>
<div className="hero-section relative h-[calc(100vh-64px)] overflow-hidden flex justify-center">
  <video 
    className="absolute top-0 left-0 w-full h-full object-cover brightness-[100%]" 
    src={myVideo} 
    autoPlay 
    loop 
    muted 
  />
  <div className="relative flex flex-col text-center text-white px-8 w-full">
    <h1 className="lg:text-6xl text-1xl font-bold transform transition-transform duration-300 hover:scale-105 mt-12">
      مرحبًا بكم في رحلة الإعلام عبر الزمان
    </h1>
    <div className="w-full flex justify-between items-start mt-4 text-gray-100">
      <p className="hidden sm:block text-sm leading-relaxed max-width text-right">
        تلعب وسائل الإعلام دورًا حيويًا في تشكيل فهمنا للعالم من حولنا. فمن خلال منصات متعددة مثل التلفزيون، والإذاعة، ووسائل التواصل الاجتماعي، والصحافة المكتوبة، تصلنا وسائل الإعلام بالأحداث العالمية والحركات الثقافية والتغيرات الاجتماعية. إنها مصدر للإعلام والترفيه والتعليم، مما يتيح للأفراد من خلفيات مختلفة تبادل الأفكار ووجهات النظر.
      </p>
      <p className="hidden sm:block text-sm leading-relaxed max-width text-left">
      Media plays a vital role in shaping our understanding of the world. Through various platforms like television, radio, social media, and print, media connects us to global events, cultural movements, and social changes. It informs, entertains, and educates, allowing people from different backgrounds to share ideas and perspectives. In today’s digital age, media evolves rapidly
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
