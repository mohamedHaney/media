import { Alert, Button, FileInput, Select, TextInput } from 'flowbite-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from 'firebase/storage';
import { app } from '../firebase';
import { useState } from 'react';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useNavigate } from 'react-router-dom';

export default function CreatePost() {
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [formData, setFormData] = useState({ images: [] });
  const [publishError, setPublishError] = useState(null);
  const [currentUploadIndex, setCurrentUploadIndex] = useState(0);

  const navigate = useNavigate();

  const handleUploadMedia = async () => {
    try {
      if (!files || files.length === 0) {
        setUploadError('الرجاء تحديد ملفات للرفع');
        return;
      }
      
      setUploadError(null);
      const storage = getStorage(app);
      
      // Process files sequentially
      const uploadNextFile = async (index) => {
        if (index >= files.length) {
          setUploadProgress(null);
          return;
        }

        const file = files[index];
        setCurrentUploadIndex(index);
        const fileName = new Date().getTime() + '-' + file.name;
        const storageRef = ref(storage, fileName);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress.toFixed(0));
          },
          (error) => {
            setUploadError('فشل رفع الملف');
            setUploadProgress(null);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            if (file.type.startsWith('image/')) {
              setFormData(prev => ({
                ...prev,
                images: [...prev.images, downloadURL]
              }));
            } else if (file.type.startsWith('video/')) {
              // Only allow one video per post
              setFormData(prev => ({
                ...prev,
                video: downloadURL,
                images: prev.images // Keep existing images
              }));
            }
            
            // Upload next file
            uploadNextFile(index + 1);
          }
        );
      };

      uploadNextFile(0);
    } catch (error) {
      setUploadError('فشل رفع الملف');
      setUploadProgress(null);
      console.log(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/post/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        setPublishError(data.message);
        return;
      }

      if (res.ok) {
        setPublishError(null);
        navigate(`/post/${data.slug}`);
      }
    } catch (error) {
      setPublishError('حدث خطأ ما');
    }
  };

  const handleRemoveImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className='p-3 max-w-3xl mx-auto min-h-screen'>
      <h1 className='text-center text-3xl my-7 font-semibold'>إنشاء موضوع</h1>
      <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
        <div className='flex flex-col gap-4 sm:flex-row justify-between'>
          <TextInput
            type='text'
            placeholder='العنوان'
            required
            id='title'
            className='flex-1'
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
          />
          <Select
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
          >
            <option value='أختر فئة'>أختر فئة</option>
            <option value='المقالات التحليلية'>المقالات التحليلية</option>
            <option value='التقارير والدراسات'>التقارير والدراسات</option>
          </Select>
        </div>

        <div className='flex gap-4 items-center justify-between border-4 border-teal-500 border-dotted p-3'>
          <FileInput
            type='file'
            accept='image/*,video/*'
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files))}
          />
          <Button
            type='button'
            gradientDuoTone='purpleToBlue'
            size='sm'
            outline
            onClick={handleUploadMedia}
            disabled={uploadProgress}
          >
            {uploadProgress ? (
              <div className='w-16 h-16'>
                <CircularProgressbar
                  value={uploadProgress}
                  text={`${uploadProgress || 0}%`}
                />
                <span className='text-xs mt-1'>
                  {currentUploadIndex + 1}/{files.length}
                </span>
              </div>
            ) : (
              'رفع الوسائط'
            )}
          </Button>
        </div>

        {uploadError && <Alert color='failure'>{uploadError}</Alert>}

        {/* Display uploaded images */}
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'>
          {formData.images?.map((image, index) => (
            <div key={index} className='relative group'>
              <img
                src={image}
                alt={`upload-${index}`}
                className='w-full h-40 object-cover rounded-lg'
              />
              <button
                type='button'
                onClick={() => handleRemoveImage(index)}
                className='absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity'
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Display video if exists */}
        {formData.video && (
          <div className='relative'>
            <video
              src={formData.video}
              controls
              className='w-full h-72 object-cover rounded-lg'
            />
            <button
              type='button'
              onClick={() => setFormData({ ...formData, video: null })}
              className='absolute top-2 right-2 bg-red-500 text-white rounded-full p-1'
            >
              ×
            </button>
          </div>
        )}

        <ReactQuill
          theme='snow'
          placeholder='أكتب شيئًا...'
          className="h-64 text-right rtl-editor mb-7"
          required
          onChange={(value) => {
            setFormData({ ...formData, content: value });
          }}
        />

        <Button type='submit' gradientDuoTone='purpleToPink'>
          نشر
        </Button>

        {publishError && (
          <Alert className='mt-5' color='failure'>
            {publishError}
          </Alert>
        )}
      </form>
    </div>
  );
}
