import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import PostCard from '../components/PostCard';
import "./styles.css";
import heroImage from "../media/my-img.jpg";
import { useSelector } from 'react-redux';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [expectedCount, setExpectedCount] = useState(6);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useSelector((state) => state.user);
  const { theme } = useSelector((state) => state.theme);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch(`/api/post/getPosts`);
        const data = await res.json();
        setExpectedCount(data.posts.length || 0);
        setPosts(data.posts);
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
  }, []);

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Hero Section */}
      <section className="relative hero-section">
        <img
          src={heroImage}
          alt="Hero"
          className="w-full h-[400px] object-cover"
          loading="eager"
        />
      </section>

      {/* Recent Posts Section */}
      <section className="py-8 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className='flex items-center text-center flex-col leading-10'>
            <h2 className="text-2xl font-bold dark:text-white">المواضيع الأخيرة</h2>
            <p className="text-gray-600 dark:text-gray-300">أحدث المقالات والمواضيع حول عالم المحاجر والصناعات المرتبطة بها</p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 justify-between items-center mt-4 mb-8">
            <Link 
              to="/search" 
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-800 text-white font-medium rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 flex items-center"
            >
              استكشف المواضيع
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
              </svg>
            </Link>
            {currentUser?.isAdmin && (
              <Link 
                to="/create-post"
                className="flex items-center px-6 py-3 bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-800 text-white font-medium rounded-lg shadow-md transition-all duration-300 transform hover:scale-105"
              >
                إنشاء موضوع جديد
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
              </Link>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(expectedCount || 6)].map((_, index) => (
                <div key={index} className="skeleton-card dark:bg-gray-800">
                  <div className="skeleton skeleton-image dark:bg-gray-700"></div>
                  <div className="skeleton-content">
                    <div className="skeleton-line short dark:bg-gray-700"></div>
                    <div className="skeleton-line medium dark:bg-gray-700"></div>
                    <div className="skeleton-line medium dark:bg-gray-700"></div>
                    <div className="skeleton-button dark:bg-gray-700"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : posts && posts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {posts.slice(0, 6).map((post) => (
                <PostCard key={post._id} post={post} currentUser={currentUser} />
              ))}
            </div>
          ) : (
            <div className="empty-state dark:bg-gray-800 flex flex-col items-center justify-center py-12">
              <svg className="w-16 h-16 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p className="text-lg text-gray-600 dark:text-gray-300 mt-4">لا توجد مواضيع متاحة حالياً</p>
              {currentUser?.isAdmin && (
                <Link 
                  to="/create-post" 
                  className="mt-4 px-6 py-3 bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-800 text-white font-medium rounded-lg shadow-md transition-all duration-300 transform hover:scale-105"
                >
                  كن أول من ينشر
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-teal-500 via-teal-600 to-teal-700 dark:from-teal-700 dark:via-teal-800 dark:to-teal-900 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-20 left-10 w-16 h-16 rounded-full bg-white animate-float"></div>
          <div className="absolute top-1/2 right-1/4 w-24 h-24 rounded-full bg-white animate-float animation-delay-2000"></div>
          <div className="absolute bottom-10 right-20 w-20 h-20 rounded-full bg-white animate-float animation-delay-4000"></div>
        </div>

        <div className="container mx-auto px-4 text-center text-white relative z-10">
          <h2 className="text-4xl md:text-2xl font-bold mb-6 animate-fade-in-up">
            كن جزءاً من رحلتنا المعرفية
          </h2>

          <p className="text-xl md:text-xl mb-4 max-w-3xl mx-auto leading-relaxed animate-fade-in-up animation-delay-200">
            احصل على أحدث المقالات الحصرية، النصائح العملية، والعروض الخاصة مباشرة إلى صندوق بريدك
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 max-w-2xl mx-auto animate-fade-in-up animation-delay-400">
            <button className="w-[30%] px-8 py-4 bg-amber-400 text-gray-900 hover:bg-amber-500 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
              <span className='text-sm'>سجل الآن</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>

            <div className="relative w-full">
              <input 
                type="email" 
                placeholder="أدخل بريدك الإلكتروني" 
                className="w-full px-6 py-4 bg-white/90 dark:bg-gray-800/90 border-0 rounded-xl text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-300 dark:focus:ring-teal-500 shadow-lg placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-300 hover:bg-white dark:hover:bg-gray-700"
              />
              <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
            </div>
          </div>

          <p className="mt-6 text-teal-100 dark:text-teal-200 text-sm animate-fade-in-up animation-delay-600">
            نعدك بعدم مشاركة بريدك مع أي طرف آخر. يمكنك إلغاء الاشتراك في أي وقت.
          </p>
        </div>
      </section>
    </div>
  );
}