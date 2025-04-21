import { Modal, Table, Button } from 'flowbite-react';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { HiOutlineExclamationCircle } from 'react-icons/hi';

export default function DashPosts() {
  const { currentUser } = useSelector((state) => state.user);
  const [userPosts, setUserPosts] = useState([]);
  const [showMore, setShowMore] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [postIdToDelete, setPostIdToDelete] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/post/getposts?userId=${currentUser._id}`);
        const data = await res.json();
        if (res.ok) {
          setUserPosts(data.posts);
          setShowMore(data.posts.length >= 9);
        }
      } catch (error) {
        console.error('Error fetching posts:', error.message);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.isAdmin) {
      fetchPosts();
    }
  }, [currentUser?._id]);

  const handleShowMore = async () => {
    const startIndex = userPosts.length;
    try {
      setLoading(true);
      const res = await fetch(
        `/api/post/getposts?userId=${currentUser._id}&startIndex=${startIndex}`
      );
      const data = await res.json();
      if (res.ok) {
        setUserPosts((prev) => [...prev, ...data.posts]);
        setShowMore(data.posts.length >= 9);
      }
    } catch (error) {
      console.error('Error loading more posts:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/post/deletepost/${postIdToDelete}/${currentUser._id}`,
        {
          method: 'DELETE',
        }
      );
      const data = await res.json();
      if (!res.ok) {
        console.error('Error deleting post:', data.message);
      } else {
        setUserPosts((prev) =>
          prev.filter((post) => post._id !== postIdToDelete)
        );
        setShowModal(false);
      }
    } catch (error) {
      console.error('Error deleting post:', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && userPosts.length === 0) {
    return <div className='text-center py-8'>جاري التحميل...</div>;
  }

  return (
    <div className='table-auto overflow-x-scroll md:mx-auto p-3 scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300 dark:scrollbar-track-slate-700 dark:scrollbar-thumb-slate-500'>
      {currentUser?.isAdmin ? (
        <>
          {userPosts.length > 0 ? (
            <>
              <Table hoverable className='shadow-md'>
                <Table.Head>
                  <Table.HeadCell>تاريخ التحديث</Table.HeadCell>
                  <Table.HeadCell>صورة الموضوع</Table.HeadCell>
                  <Table.HeadCell>عنوان الموضوع</Table.HeadCell>
                  <Table.HeadCell>التصنيف</Table.HeadCell>
                  <Table.HeadCell>حذف الموضوع</Table.HeadCell>
                  <Table.HeadCell>تعديل الموضوع</Table.HeadCell>
                </Table.Head>
                <Table.Body className='divide-y'>
                  {userPosts.map((post) => (
                    <Table.Row key={post._id} className='bg-white dark:border-gray-700 dark:bg-gray-800'>
                      <Table.Cell>
                        {new Date(post.updatedAt).toLocaleDateString('ar-EG')}
                      </Table.Cell>
                      <Table.Cell>
                        <Link to={`/post/${post.slug}`}>
                        {post.media && post.media.length > 0 ? (
  post.media[0].type === 'video' ? (
    <video
      src={post.media[0].url}
      className='w-20 h-10 object-cover bg-gray-500'
      onMouseOver={(e) => e.target.play()}
      onMouseOut={(e) => {
        e.target.pause();
        e.target.currentTime = 0;
      }}
      muted
      loop
      preload='metadata'
    />
  ) : (
    <img
      src={post.media[0].url}
      alt={post.title}
      className='w-20 h-10 object-cover bg-gray-500'
      onError={(e) => {
        e.target.src = 'https://via.placeholder.com/80x40?text=No+Image';
      }}
    />
  )
) : (
  <div className='w-20 h-10 bg-gray-200 flex items-center justify-center text-xs text-gray-500'>
    لا توجد صورة
  </div>
)}
                        </Link>
                      </Table.Cell>
                      <Table.Cell>
                        <Link
                          className='font-medium text-gray-900 dark:text-white'
                          to={`/post/${post.slug}`}
                        >
                          {post.title}
                        </Link>
                      </Table.Cell>
                      <Table.Cell>{post.category}</Table.Cell>
                      <Table.Cell>
                        <button
                          onClick={() => {
                            setShowModal(true);
                            setPostIdToDelete(post._id);
                          }}
                          className='font-medium text-red-500 hover:underline cursor-pointer'
                          disabled={loading}
                        >
                          حذف
                        </button>
                      </Table.Cell>
                      <Table.Cell>
                        <Link
                          className='text-teal-500 hover:underline'
                          to={`/update-post/${post._id}`}
                        >
                          تعديل
                        </Link>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
              {showMore && (
                <button
                  onClick={handleShowMore}
                  className='w-full text-teal-500 self-center text-sm py-7'
                  disabled={loading}
                >
                  {loading ? 'جاري التحميل...' : 'عرض المزيد'}
                </button>
              )}
            </>
          ) : (
            <p className='text-center py-8'>ليس لديك أي مواضيع بعد</p>
          )}
        </>
      ) : (
        <p className='text-center py-8'>غير مسموح لك بالوصول إلى هذه الصفحة</p>
      )}
      <Modal
        show={showModal}
        onClose={() => !loading && setShowModal(false)}
        popup
        size='md'
      >
        <Modal.Header />
        <Modal.Body>
          <div className='text-center'>
            <HiOutlineExclamationCircle className='h-14 w-14 text-gray-400 dark:text-gray-200 mb-4 mx-auto' />
            <h3 className='mb-5 text-lg text-gray-500 dark:text-gray-400'>
              هل أنت متأكد من أنك تريد حذف هذا الموضوع؟
            </h3>
            <div className='flex justify-center gap-4'>
              <Button 
                color='failure' 
                onClick={handleDeletePost}
                disabled={loading}
              >
                {loading ? 'جاري الحذف...' : 'نعم أنا متأكد'}
              </Button>
              <Button 
                color='gray' 
                onClick={() => setShowModal(false)}
                disabled={loading}
              >
                إلغاء
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}