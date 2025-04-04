import { Alert, Button, FileInput, Select, TextInput } from 'flowbite-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { getDownloadURL, getStorage, ref, uploadBytesResumable, deleteObject } from 'firebase/storage';
import { app } from '../firebase';
import { useState, useRef } from 'react';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { HiCheck, HiX } from 'react-icons/hi';
import './styles.css';

export default function CreatePost() {
  const { currentUser } = useSelector((state) => state.user);
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadError, setUploadError] = useState(null);
  const [formData, setFormData] = useState({
    media: [],
    title: '',
    category: 'غير مصنف',
    content: '',
  });
  const [publishError, setPublishError] = useState(null);
  const [publishSuccess, setPublishSuccess] = useState(null);
  const [activeUploads, setActiveUploads] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

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
    } else {
      setUploadError(null);
    }

    setFiles(prev => [...prev, ...validFiles]);
    e.target.value = ''; // Reset file input
  };

  const handleUploadMedia = async () => {
    if (files.length === 0) {
      setUploadError('الرجاء تحديد ملفات للرفع');
      return;
    }

    if (formData.media.length + files.length > 10) {
      setUploadError('لا يمكن إضافة أكثر من 10 وسائط');
      return;
    }

    setUploadError(null);
    setIsUploading(true);
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
                  [file.name]: progress.toFixed(0),
                }));
              },
              (error) => {
                // Delete partially uploaded file on error
                deleteObject(storageRef).catch(console.error);
                reject({ file: file.name, error });
              },
              async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                resolve({
                  url: downloadURL,
                  type: file.type.startsWith('image/') ? 'image' : 'video',
                  fileName: fileName // Store the reference for cleanup
                });
              }
            );
          });
        })
      );

      setFormData(prev => ({
        ...prev,
        media: [...prev.media, ...uploadResults],
      }));

      setFiles([]);
      setUploadProgress({});
    } catch (error) {
      setUploadError(`فشل رفع بعض الملفات: ${error.file || error.message || ''}`);
      console.error('Upload error:', error);
    } finally {
      setActiveUploads([]);
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content) {
      setPublishError('العنوان والمحتوى مطلوبان');
      return;
    }

    if (formData.content.length < 100) {
      setPublishError('المحتوى يجب أن يكون على الأقل 100 حرف');
      return;
    }

    setIsSubmitting(true);
    setPublishError(null);
    setPublishSuccess(null);

    try {
      const res = await fetch('/api/post/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.accessToken}`
        },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) {
        setPublishError(data.message || 'حدث خطأ أثناء محاولة نشر الموضوع');
        
        // Clean up uploaded media if post creation failed
        if (formData.media.length > 0) {
          const storage = getStorage(app);
          await Promise.all(
            formData.media.map(async (media) => {
              try {
                const fileRef = ref(storage, media.fileName);
                await deleteObject(fileRef);
              } catch (error) {
                console.error('Error cleaning up media:', error);
              }
            })
          );
        }
        
        return;
      }

      setPublishSuccess('تم نشر الموضوع بنجاح!');
      setTimeout(() => {
        navigate(`/post/${data.slug}`);
      }, 1500);
    } catch (error) {
      setPublishError('حدث خطأ أثناء محاولة نشر الموضوع');
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeMedia = async (index) => {
    const mediaToRemove = formData.media[index];
    
    try {
      // Delete from Firebase storage
      const storage = getStorage(app);
      const fileRef = ref(storage, mediaToRemove.fileName);
      await deleteObject(fileRef);
      
      // Remove from state
      setFormData(prev => ({
        ...prev,
        media: prev.media.filter((_, i) => i !== index)
      }));
    } catch (error) {
      console.error('Error removing media:', error);
      setUploadError('حدث خطأ أثناء حذف الملف');
    }
  };

  const removePendingFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className='p-4 max-w-3xl mx-auto min-h-screen bg-white rounded-lg shadow-lg'>
      <h1 className='text-center text-3xl my-7 font-semibold'>إنشاء موضوع</h1>
      <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
        <div className='flex flex-col gap-4 sm:flex-row justify-between'>
          <TextInput 
            type='text' 
            placeholder='العنوان' 
            className='w-full' 
            required 
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
          />
          <Select 
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          >
            <option value='غير مصنف'>غير مصنف</option>
            <option value='قصص وتجارب شخصية'>قصص وتجارب شخصية</option>
            <option value='التقارير والدراسات'>التقارير والدراسات</option>
            <option value='أخبار'>أخبار</option>
            <option value='مقالات'>مقالات</option>
          </Select>
        </div>

        <div className='flex flex-col gap-3 border-2 border-gray-300 p-3 rounded-lg'>
          <div className='flex justify-between gap-3'>
            <FileInput 
              ref={fileInputRef}
              type='file' 
              accept='image/*,video/*' 
              multiple 
              onChange={handleFileChange} 
              disabled={isUploading || isSubmitting}
            />
            <Button 
              onClick={handleUploadMedia} 
              disabled={files.length === 0 || isUploading || isSubmitting}
              isProcessing={isUploading}
            >
              {isUploading ? 'جاري الرفع...' : 'رفع الملفات'}
            </Button>
          </div>

          {files.length > 0 && (
            <div className="space-y-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="text-lg font-medium">الملفات في انتظار الرفع:</h3>
              <ul className="space-y-2">
                {files.map((file, index) => (
                  <li key={index} className="flex items-center justify-between p-2 bg-white rounded">
                    <span className="truncate text-sm flex-1">{file.name}</span>
                    <button 
                      type="button"
                      onClick={() => removePendingFile(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                      disabled={isUploading}
                    >
                      <HiX className="w-5 h-5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activeUploads.length > 0 && (
            <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="text-lg font-medium">جاري رفع الملفات...</h3>
              {activeUploads.map((fileName) => (
                <div key={fileName} className="flex items-center gap-4">
                  <div className="w-12 h-12">
                    <CircularProgressbar
                      value={uploadProgress[fileName] || 0}
                      text={`${uploadProgress[fileName] || 0}%`}
                      styles={{
                        path: { stroke: '#3B82F6' },
                        text: { fill: '#3B82F6', fontSize: '24px' },
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="truncate text-sm">{fileName}</p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${uploadProgress[fileName] || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {formData.media.length > 0 && (
          <div className='grid grid-cols-2 gap-3'>
            {formData.media.map((media, index) => (
              <div key={index} className='relative group'>
                {media.type === 'image' ? (
                  <img 
                    src={media.url} 
                    alt={`Uploaded ${index}`} 
                    className='w-full h-40 object-cover rounded-lg'
                  />
                ) : (
                  <video 
                    controls 
                    className='w-full h-40 object-cover rounded-lg'
                  >
                    <source src={media.url} type={`video/${media.url.split('.').pop()}`} />
                    Your browser does not support the video tag.
                  </video>
                )}
                <button 
                  type="button"
                  onClick={() => removeMedia(index)} 
                  className='absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity'
                  disabled={isSubmitting}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="quill-container">
          <ReactQuill
            theme="snow"
            modules={{
              toolbar: [
                [{ header: [1, 2, 3, false] }],
                [{ font: [] }],
                [{ align: [] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ color: [] }, { background: [] }],
                [{ list: 'ordered' }, { list: 'bullet' }],
                ['blockquote', 'code-block'],
                ['link'],
              ],
            }}
            value={formData.content}
            onChange={(value) => setFormData({ ...formData, content: value })}
            placeholder="اكتب شيئًا مميزًا هنا..."
            className="custom-quill rtl-editor"
          />
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">
            عدد الحروف: {formData.content.length}
          </span>
          <Button 
            type='submit' 
            disabled={isSubmitting || isUploading}
            isProcessing={isSubmitting}
          >
            {isSubmitting ? 'جاري النشر...' : 'نشر'}
          </Button>
        </div>

        {uploadError && (
          <Alert color='failure' onDismiss={() => setUploadError(null)}>
            {uploadError}
          </Alert>
        )}

        {publishError && (
          <Alert color='failure' onDismiss={() => setPublishError(null)}>
            {publishError}
          </Alert>
        )}

        {publishSuccess && (
          <Alert color='success' icon={HiCheck}>
            {publishSuccess}
          </Alert>
        )}
      </form>
    </div>
  );
}
