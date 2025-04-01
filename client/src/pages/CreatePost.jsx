import { Alert, Button, FileInput, Select, TextInput } from 'flowbite-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import { app } from '../firebase';
import { useState } from 'react';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useNavigate } from 'react-router-dom';
import './styles.css';

export default function CreatePost() {
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadError, setUploadError] = useState(null);
  const [formData, setFormData] = useState({
    media: [], // Array of {url: string, type: 'image'|'video'}
    title: '',
    category: '',
    content: '',
  });
  const [publishError, setPublishError] = useState(null);
  const [activeUploads, setActiveUploads] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
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
  };

  const handleUploadMedia = async () => {
    if (files.length === 0) {
      setUploadError('الرجاء تحديد ملفات للرفع');
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    const storage = getStorage(app);
    setActiveUploads(files.map(file => file.name));

    try {
      const uploadResults = await Promise.all(
        files.map(async (file) => {
          const fileName = new Date().getTime() + '-' + file.name;
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
              (error) => reject({ file: file.name, error }),
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
        media: [...prev.media, ...uploadResults],
      }));

      setFiles([]);
    } catch (error) {
      setUploadError(`فشل رفع بعض الملفات: ${error.file || error.message || ''}`);
    } finally {
      setActiveUploads([]);
      setUploadProgress({});
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/post/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) {
        setPublishError(data.message);
        return;
      }

      navigate(`/post/${data.slug}`);
    } catch (error) {
      setPublishError('حدث خطأ أثناء محاولة نشر الموضوع');
    }
  };

  const removeMedia = (index) => {
    setFormData(prev => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== index)
    }));
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
            onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
          />
          <Select onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
            <option value=''>أختر فئة</option>
            <option value='قصص وتجارب شخصية'>قصص وتجارب شخصية</option>
            <option value='التقارير والدراسات'>التقارير والدراسات</option>
          </Select>
        </div>

        <div className='flex justify-between border-2 border-gray-300 p-3 rounded-lg'>
          <FileInput 
            type='file' 
            accept='image/*,video/*' 
            multiple 
            onChange={handleFileChange} 
          />
          <Button 
            onClick={handleUploadMedia} 
            disabled={files.length === 0 || isUploading}
          >
            {isUploading ? 'جاري الرفع...' : 'رفع الملفات'}
          </Button>
        </div>

        {activeUploads.length > 0 && (
          <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
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

        {files.length > 0 && (
          <div className="space-y-2 p-4 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-medium">الملفات في انتظار الرفع:</h3>
            <ul className="list-disc pl-5 space-y-1">
              {files.map((file, index) => (
                <li key={index} className="truncate text-sm">{file.name}</li>
              ))}
            </ul>
          </div>
        )}

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
                  onClick={() => removeMedia(index)} 
                  className='absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity'
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

        <Button type='submit'>نشر</Button>

        {uploadError && <Alert color='failure'>{uploadError}</Alert>}
        {publishError && <Alert color='failure'>{publishError}</Alert>}
      </form>
    </div>
  );
}
