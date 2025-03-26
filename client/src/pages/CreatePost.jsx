Copy
import { Alert, Button, FileInput, Select, TextInput } from 'flowbite-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import { app } from '../firebase';
import { useState } from 'react';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useNavigate } from 'react-router-dom';

export default function CreatePost() {
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadError, setUploadError] = useState(null);
  const [formData, setFormData] = useState({ images: [] });
  const [publishError, setPublishError] = useState(null);
  const [activeUploads, setActiveUploads] = useState([]);

  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    
    // Check for duplicates in new selection
    const duplicates = newFiles.filter(newFile => 
      files.some(existingFile => existingFile.name === newFile.name)
    );
    
    if (duplicates.length > 0) {
      setUploadError(`الملفات التالية موجودة مسبقاً: ${duplicates.map(f => f.name).join(', ')}`);
      return;
    }
    
    setFiles(prev => [...prev, ...newFiles]);
    setUploadError(null);
  };

  const handleUploadMedia = async () => {
    try {
      if (files.length === 0) {
        setUploadError('الرجاء تحديد ملفات للرفع');
        return;
      }

      setUploadError(null);
      const storage = getStorage(app);
      setActiveUploads(files.map(file => file.name));

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
                  [file.name]: progress.toFixed(0)
                }));
              },
              (error) => {
                reject({ file: file.name, error });
              },
              async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                resolve({ file: file.name, url: downloadURL });
              }
            );
          });
        })
      );

      // Process successful uploads
      const newImages = uploadResults
        .filter(result => result.url)
        .map(result => result.url);

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newImages]
      }));

      // Remove successfully uploaded files
      setFiles(prev => prev.filter(file => 
        !uploadResults.some(result => result.file === file.name)
      ));
      setActiveUploads([]);
      setUploadProgress({});

    } catch (error) {
      setUploadError(`فشل رفع بعض الملفات: ${error.file || ''}`);
      console.error('Upload error:', error);
    }
  };

  const handleRemoveFile = (fileName) => {
    setFiles(prev => prev.filter(file => file.name !== fileName));
    setUploadProgress(prev => {
      const newProgress = {...prev};
      delete newProgress[fileName];
      return newProgress;
    });
  };

  const handleRemoveImage = (imageUrl) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img !== imageUrl)
    }));
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
        navigate(`/post/${data.slug}`);
      }
    } catch (error) {
      setPublishError('حدث خطأ ما');
    }
  };

  return (
    <div className='p-3 max-w-3xl mx-auto min-h-screen'>
      <h1 className='text-center text-3xl my-7 font-semibold'>إنشاء موضوع</h1>
      <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
        {/* ... (title and category inputs remain the same) ... */}

        <div className='flex gap-4 items-center justify-between border-4 border-teal-500 border-dotted p-3'>
          <FileInput
            type='file'
            accept='image/*,video/*'
            multiple
            onChange={handleFileChange}
          />
          <Button
            type='button'
            gradientDuoTone='purpleToBlue'
            size='sm'
            outline
            onClick={handleUploadMedia}
            disabled={files.length === 0 || activeUploads.length > 0}
          >
            رفع الملفات
          </Button>
        </div>

        {uploadError && <Alert color='failure'>{uploadError}</Alert>}

        {/* Selected Files Section */}
        {files.length > 0 && (
          <div className='border rounded-lg p-4'>
            <h3 className='font-medium mb-2'>الملفات المحددة:</h3>
            <ul className='space-y-2'>
              {files.map((file) => (
                <li key={file.name} className='flex justify-between items-center'>
                  <span className='truncate max-w-xs'>{file.name}</span>
                  <div className='flex items-center gap-2'>
                    {uploadProgress[file.name] ? (
                      <div className='w-8 h-8'>
                        <CircularProgressbar
                          value={uploadProgress[file.name]}
                          text={`${uploadProgress[file.name]}%`}
                          styles={{
                            text: {
                              fontSize: '24px',
                              fill: '#fff',
                            },
                            path: {
                              stroke: '#3b82f6',
                            },
                          }}
                        />
                      </div>
                    ) : null}
                    <Button
                      size='xs'
                      color='failure'
                      onClick={() => handleRemoveFile(file.name)}
                      disabled={activeUploads.includes(file.name)}
                    >
                      إزالة
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Uploaded Images Section */}
        {formData.images.length > 0 && (
          <div className='border rounded-lg p-4'>
            <h3 className='font-medium mb-2'>الملفات المرفوعة:</h3>
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'>
              {formData.images.map((image, index) => (
                <div key={index} className='relative group'>
                  {image.includes('image') ? (
                    <img
                      src={image}
                      alt={`uploaded-${index}`}
                      className='w-full h-40 object-cover rounded-lg'
                    />
                  ) : (
                    <video
                      src={image}
                      className='w-full h-40 object-cover rounded-lg'
                    />
                  )}
                  <button
                    type='button'
                    onClick={() => handleRemoveImage(image)}
                    className='absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity'
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
