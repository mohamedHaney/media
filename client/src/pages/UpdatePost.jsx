import { Alert, Button, FileInput, Select, TextInput } from 'flowbite-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import { app } from '../firebase';
import { useEffect, useState } from 'react';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function UpdatePost() {
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadError, setUploadError] = useState(null);
  const [formData, setFormData] = useState({ 
    images: [],
    mediaTypes: [],
    video: null
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
          setPublishError(data.message);
          return;
        }

        const post = data.posts[0];
        setFormData({
          ...post,
          images: post.images || (post.image ? [post.image] : []),
          mediaTypes: post.mediaTypes || (post.image ? ['image/jpeg'] : []),
          video: post.video || null
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
    
    // Check for duplicates
    const duplicates = newFiles.filter(newFile => 
      files.some(existingFile => existingFile.name === newFile.name) ||
      formData.images.some(img => img.includes(newFile.name)) ||
      (formData.video && formData.video.includes(newFile.name))
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
                resolve({ 
                  file: file.name, 
                  url: downloadURL, 
                  type: file.type 
                });
              }
            );
          });
        })
      );

      // Process successful uploads
      const successfulUploads = uploadResults.filter(result => result.url);
      const newMedia = successfulUploads.map(result => ({
        url: result.url,
        type: result.type
      }));

      // Separate videos and images
      const newVideos = newMedia.filter(m => m.type.startsWith('video'));
      const newImages = newMedia.filter(m => m.type.startsWith('image'));

      setFormData(prev => {
        const updated = { ...prev };
        
        // Only allow one video
        if (newVideos.length > 0) {
          updated.video = newVideos[0].url;
        }
        
        // Add new images
        if (newImages.length > 0) {
          updated.images = [...prev.images, ...newImages.map(m => m.url)];
          updated.mediaTypes = [...prev.mediaTypes, ...newImages.map(m => m.type)];
        }

        return updated;
      });

      // Remove successfully uploaded files
      setFiles(prev => prev.filter(file => 
        !successfulUploads.some(result => result.file === file.name)
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
      const newProgress = { ...prev };
      delete newProgress[fileName];
      return newProgress;
    });
  };

  const handleRemoveImage = (imageUrl, index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((img, i) => i !== index),
      mediaTypes: prev.mediaTypes.filter((type, i) => i !== index)
    }));
  };

  const handleRemoveVideo = () => {
    setFormData(prev => ({ ...prev, video: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Final duplicate check
      const uniqueImages = [...new Set(formData.images)];
      if (uniqueImages.length !== formData.images.length) {
        setPublishError('يوجد تكرار في ملفات الوسائط');
        return;
      }

      const res = await fetch(`/api/post/updatepost/${formData._id}/${currentUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          images: uniqueImages
        }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        setPublishError(data.message);
        return;
      }
      
      navigate(`/post/${data.slug}`);
    } catch (error) {
      setPublishError('حدث خطأ ما أثناء التحديث');
      console.error('Update error:', error);
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
            value={formData.title || ''}
          />
          <Select
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            value={formData.category || 'غير مصنف'}
          >
            <option value="غير مصنف">أختر فئة</option>
            <option value="المقالات التحليلية">المقالات التحليلية</option>
            <option value="التقارير والدراسات">التقارير والدراسات</option>
          </Select>
        </div>

        <div className="flex gap-4 items-center justify-between border-4 border-teal-500 border-dotted p-3">
          <FileInput
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileChange}
          />
          <Button
            type="button"
            gradientDuoTone="purpleToBlue"
            size="sm"
            outline
            onClick={handleUploadMedia}
            disabled={files.length === 0 || activeUploads.length > 0}
          >
            {activeUploads.length > 0 ? 'جاري الرفع...' : 'رفع الملفات'}
          </Button>
        </div>

        {uploadError && (
          <Alert color="failure">
            {uploadError}
            {uploadError.includes('موجودة مسبقاً') && (
              <Button 
                size="xs" 
                color="light" 
                className="mt-2"
                onClick={() => {
                  const uniqueFiles = files.filter((file, index, self) =>
                    index === self.findIndex(f => f.name === file.name)
                  );
                  setFiles(uniqueFiles);
                  setUploadError(null);
                }}
              >
                إزالة التكرارات
              </Button>
            )}
          </Alert>
        )}

        {/* Selected Files Section */}
        {files.length > 0 && (
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">الملفات المحددة ({files.length}):</h3>
            <ul className="space-y-2">
              {files.map((file) => (
                <li key={file.name} className="flex justify-between items-center">
                  <span className="truncate max-w-xs">{file.name}</span>
                  <div className="flex items-center gap-2">
                    {uploadProgress[file.name] && (
                      <div className="w-8 h-8">
                        <CircularProgressbar
                          value={uploadProgress[file.name]}
                          text={`${uploadProgress[file.name]}%`}
                          styles={{
                            text: { fontSize: '24px', fill: '#fff' },
                            path: { stroke: '#3b82f6' },
                          }}
                        />
                      </div>
                    )}
                    <Button
                      size="xs"
                      color="failure"
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

        {/* Video Preview */}
        {formData.video && (
          <div className="relative group border rounded-lg p-4">
            <h3 className="font-medium mb-2">الفيديو:</h3>
            <video
              src={formData.video}
              controls
              className="w-full h-72 object-contain rounded-lg"
            />
            <button
              type="button"
              onClick={handleRemoveVideo}
              className="absolute top-4 right-4 bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ×
            </button>
          </div>
        )}

        {/* Images Preview */}
        {formData.images.length > 0 && (
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">الصور ({formData.images.length}):</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {formData.images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image}
                    alt={`upload-${index}`}
                    className="w-full h-40 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.src = '/default-post-image.jpg';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(image, index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <ReactQuill
          theme="snow"
          value={formData.content || ''}
          placeholder="أكتب شيئًا..."
          className="h-72 mb-12 text-right rtl-editor"
          required
          onChange={(value) => setFormData({ ...formData, content: value })}
        />

        <Button 
          type="submit" 
          gradientDuoTone="purpleToPink" 
          disabled={isSubmitting}
        >
          {isSubmitting ? 'جاري التحديث...' : 'تحديث الموضوع'}
        </Button>

        {publishError && (
          <Alert className="mt-5" color="failure">
            {publishError}
          </Alert>
        )}
      </form>
    </div>
  );
}
