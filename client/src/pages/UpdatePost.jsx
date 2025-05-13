import { Alert, Button, FileInput, Select, TextInput } from 'flowbite-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { getDownloadURL, getStorage, ref, uploadBytesResumable, deleteObject } from 'firebase/storage';
import { app } from '../firebase';
import { useEffect, useState } from 'react';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { HiX } from 'react-icons/hi';

export default function UpdatePost() {
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadError, setUploadError] = useState(null);
  const [formData, setFormData] = useState({ 
    title: '',
    content: '',
    category: '',
    media: []
  });
  const [publishError, setPublishError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeUploads, setActiveUploads] = useState([]);
  const { postId } = useParams();

  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.user);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/post/getposts?postId=${postId}`);
        const data = await res.json();
        
        if (!res.ok) {
          setPublishError(data.message || 'Failed to fetch post');
          return;
        }

        const post = data.posts[0];
        
        // Convert to standardized media array structure
        let media = [];
        if (Array.isArray(post.media)) {
          media = post.media;
        } else {
          // Handle old structure
          if (Array.isArray(post.images)) {
            media = post.images.map(url => ({ url, type: 'image' }));
          }
          if (post.video) {
            media.push({ url: post.video, type: 'video' });
          }
        }

        setFormData({
          ...post,
          title: post.title || '',
          content: post.content || '',
          category: post.category || '',
          media
        });

      } catch (error) {
        setPublishError('Failed to load post data');
        console.error('Fetch error:', error);
      }
    };
    
    fetchPost();
  }, [postId]);

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    const validTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/quicktime'
    ];
    
    const validFiles = newFiles.filter(file => validTypes.includes(file.type));
    const invalidFiles = newFiles.filter(file => !validTypes.includes(file.type));

    if (invalidFiles.length > 0) {
      setUploadError(`الملفات التالية غير مدعومة: ${invalidFiles.map(f => f.name).join(', ')}`);
    }

    const duplicates = validFiles.filter(newFile => 
      files.some(f => f.name === newFile.name) ||
      formData.media.some(media => media.url.includes(newFile.name))
    );

    if (duplicates.length > 0) {
      setUploadError(prev => 
        [prev, `الملفات التالية موجودة مسبقاً: ${duplicates.map(f => f.name).join(', ')}`]
          .filter(Boolean).join(' - ')
      );
      return;
    }

    setFiles(prev => [...prev, ...validFiles]);
    e.target.value = '';
  };

  const handleUploadMedia = async () => {
    if (files.length === 0) {
      setUploadError('الرجاء تحديد ملفات للرفع');
      return;
    }

    setUploadError(null);
    setIsSubmitting(true);
    const storage = getStorage(app);
    setActiveUploads(files.map(file => file.name));

    try {
      const uploadResults = await Promise.all(
        files.map(async (file) => {
          const fileName = new Date().getTime() + '-' + file.name.replace(/\s+/g, '-');
          const storageRef = ref(storage, fileName);
          const uploadTask = uploadBytesResumable(storageRef, file);

          return new Promise((resolve, reject) => {
            uploadTask.on(
              'state_changed',
              (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(prev => ({
                  ...prev,
                  [file.name]: progress.toFixed(0)
                }));
              },
              (error) => {
                deleteObject(storageRef).catch(console.error);
                reject({ file: file.name, error });
              },
              async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                resolve({
                  url: downloadURL,
                  type: file.type.startsWith('image/') ? 'image' : 'video'
                });
              }
            );
          });
        })
      );

      setFormData(prev => ({
        ...prev,
        media: [...prev.media, ...uploadResults]
      }));

      setFiles([]);
      setUploadProgress({});
    } catch (error) {
      setUploadError(`فشل رفع بعض الملفات: ${error.file || error.message || ''}`);
      console.error('Upload error:', error);
    } finally {
      setActiveUploads([]);
      setIsSubmitting(false);
    }
  };

  const handleRemoveFile = (fileName) => {
    setFiles(prev => prev.filter(file => file.name !== fileName));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileName];
      return newProgress;
    });
  };

  const handleRemoveMedia = async (index) => {
    const mediaToRemove = formData.media[index];
    
    try {
      if (mediaToRemove.url.includes('firebase')) {
        const storage = getStorage(app);
        const fileName = mediaToRemove.url.split('/').pop().split('?')[0];
        const fileRef = ref(storage, fileName);
        await deleteObject(fileRef);
      }
    } catch (error) {
      console.error('Error deleting media:', error);
    }

    setFormData(prev => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content) {
      setPublishError('العنوان والمحتوى مطلوبان');
      return;
    }

    setIsSubmitting(true);
    setPublishError(null);

    try {
      const res = await fetch(`/api/post/updatepost/${formData._id}/${currentUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.accessToken}`
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          category: formData.category,
          media: formData.media
        }),
        credentials: 'include'
      });

      const data = await res.json();
      
      if (!res.ok) {
        setPublishError(data.message || 'حدث خطأ أثناء التحديث');
        return;
      }
      
      navigate(`/post/${data.slug}`);
    } catch (error) {
      console.error('Update error:', error);
      setPublishError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-3 max-w-3xl mx-auto min-h-screen">
      <h1 className="text-center text-3xl my-7 font-semibold">تحديث الموضوع</h1>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4 sm:flex-row justify-between">
          <TextInput
            type="text"
            placeholder="العنوان"
            required
            id="title"
            className="flex-1"
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            value={formData.title}
          />
          <Select
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            value={formData.category}
          >
            <option value="المقالات التحليلية">المقالات التحليلية</option>
            <option value="التقارير والدراسات">التقارير والدراسات</option>
            <option value="أخبار">أخبار</option>
            <option value="قصص وتجارب">قصص وتجارب</option>
          </Select>
        </div>

        <div className="flex flex-col gap-3 border-2 border-gray-300 p-3 rounded-lg">
          <div className="flex justify-between gap-3">
            <FileInput
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileChange}
              disabled={isSubmitting}
            />
            <Button
              onClick={handleUploadMedia}
              disabled={files.length === 0 || isSubmitting}
              isProcessing={activeUploads.length > 0}
            >
              رفع
            </Button>
          </div>

          {uploadError && <Alert color="failure">{uploadError}</Alert>}
          
          <div className="grid grid-cols-4 gap-2">
            {files.map((file) => (
              <div key={file.name} className="relative">
                <div className="w-full h-24 flex justify-center items-center bg-gray-100">
                  {file.type.startsWith('image/') ? (
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt={file.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video 
                      src={URL.createObjectURL(file)} 
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div
                  className="absolute top-0 left-0 right-0 bottom-0 bg-gray-800 bg-opacity-50 flex justify-center items-center cursor-pointer"
                  onClick={() => handleRemoveFile(file.name)}
                >
                  <HiX className="text-white text-xl" />
                </div>
                {uploadProgress[file.name] && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <CircularProgressbar
                      value={uploadProgress[file.name]}
                      text={`${uploadProgress[file.name]}%`}
                      styles={{
                        root: { width: 40 },
                        path: { stroke: '#3b82f6' },
                        text: { fill: '#fff', fontSize: '24px' }
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex flex-col gap-3 border-2 border-gray-300 p-3 rounded-lg">
          {formData.media.length > 0 ? (
            <div className="grid grid-cols-4 gap-3">
              {formData.media.map((media, index) => (
                <div key={index} className="relative">
                  {media.type === 'image' ? (
                    <img
                      src={media.url}
                      alt={`Post media ${index + 1}`}
                      className="w-full h-24 object-cover"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/150';
                        console.error('Failed to load image:', media.url);
                      }}
                    />
                  ) : (
                    <video
                      src={media.url}
                      className="w-full h-24 object-cover"
                    />
                  )}
                  <button
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                    onClick={() => handleRemoveMedia(index)}
                  >
                    <HiX className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center">لا توجد وسائط متاحة</p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <label htmlFor="content" className="font-semibold">المحتوى</label>
          <ReactQuill
            value={formData.content}
            onChange={(value) => setFormData({ ...formData, content: value })}
            placeholder="أدخل النص هنا"
            theme="snow"
          />
        </div>

        <div className="flex justify-between items-center mt-4">
          <Button
            type="submit"
            isProcessing={isSubmitting}
            disabled={isSubmitting}
          >
            نشر التحديث
          </Button>
        </div>

        {publishError && (
          <Alert color="failure">{publishError}</Alert>
        )}
      </form>
    </div>
  );
}