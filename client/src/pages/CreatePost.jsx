import {
  Alert,
  Button,
  FileInput,
  Select,
  TextInput,
  Spinner,
  Tooltip,
  Badge,
} from 'flowbite-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
  deleteObject,
} from 'firebase/storage';
import { app } from '../firebase';
import { useState, useRef, useEffect } from 'react';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { HiCheck, HiOutlineTrash, HiOutlineCloudUpload, HiOutlineExclamation } from 'react-icons/hi';
import './styles.css';
export default function CreatePost() {
  const { currentUser } = useSelector((state) => state.user);
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadError, setUploadError] = useState(null);
  const [formData, setFormData] = useState({
    media: [],
    title: '',
    category: '',
    content: '',
    coverMedia: null, // Add this field
  });
  const [publishError, setPublishError] = useState(null);
  const [publishSuccess, setPublishSuccess] = useState(null);
  const [activeUploads, setActiveUploads] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  useEffect(() => {
    const plainText = formData.content.replace(/<[^>]*>/g, '');
    setCharacterCount(plainText.length);
  }, [formData.content]);
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    const validTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'video/quicktime',
    ];
    const validFiles = newFiles.filter((file) => validTypes.includes(file.type));
    const invalidFiles = newFiles.filter((file) => !validTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      setUploadError(
        <span>
          الملفات التالية غير مدعومة:
          <strong> {invalidFiles.map((f) => f.name).join(', ')}</strong>
          <br />
          يرجى تحميل ملفات من الأنواع التالية: JPEG, PNG, GIF, WebP, MP4, WebM, QuickTime
        </span>
      );
    } else {
      setUploadError(null);
    }
    setFiles((prev) => [...prev, ...validFiles]);
    e.target.value = '';
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
    const fileNames = files.map((file) => `${Date.now()}-${file.name.replace(/\s+/g, '-')}`);
    setActiveUploads(fileNames);
    try {
      const uploadResults = await Promise.all(
        files.map(async (file, idx) => {
          const fileName = fileNames[idx];
          const storageRef = ref(storage, fileName);
          const uploadTask = uploadBytesResumable(storageRef, file);
          const downloadURL = await new Promise((resolve, reject) => {
            uploadTask.on(
              'state_changed',
              (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress((prev) => ({ ...prev, [fileName]: progress.toFixed(0) }));
              },
              (error) => {
                deleteObject(storageRef).catch(console.error);
                reject({ file: fileName, error });
              },
              async () => {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(url);
              }
            );
          });
          return {
            url: downloadURL,
            type: file.type.startsWith('image/') ? 'image' : 'video',
            file: {
              type: file.type,
              name: file.name,
              size: file.size,
            },
            fileName,
            originalName: file.name,
          };
        })
      );
      setFormData((prev) => ({
        ...prev,
        media: [...prev.media, ...uploadResults],
      }));
      setFiles([]);
      setUploadProgress({});
    } catch (error) {
      setUploadError(
        <span>
          فشل رفع بعض الملفات: {error.file || ''}
          <br />
          {error.error?.message || 'حدث خطأ غير متوقع'}
        </span>
      );
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
    if (characterCount < 100) {
      setPublishError('المحتوى يجب أن يكون على الأقل 100 حرف (بدون تنسيق)');
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
          Authorization: `Bearer ${currentUser.accessToken}`,
        },
        body: JSON.stringify(formData),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        setPublishError(data.message || 'حدث خطأ أثناء محاولة نشر الموضوع');
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
        return;
      }
      setPublishSuccess('تم نشر الموضوع بنجاح! سيتم توجيهك إلى الصفحة قريباً...');
      setTimeout(() => navigate(`/post/${data.slug}`), 2000);
    } catch (error) {
      setPublishError('حدث خطأ أثناء محاولة نشر الموضوع');
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  const removeMedia = async (index) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الملف؟ سيتم حذفه نهائياً.')) return;
    const mediaToRemove = formData.media[index];
    try {
      const storage = getStorage(app);
      const fileRef = ref(storage, mediaToRemove.fileName);
      await deleteObject(fileRef);
      setFormData((prev) => ({
        ...prev,
        media: prev.media.filter((_, i) => i !== index),
      }));
    } catch (error) {
      console.error('Error removing media:', error);
      setUploadError('حدث خطأ أثناء حذف الملف');
    }
  };
  const removePendingFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} بايت`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} كيلوبايت`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} ميجابايت`;
  };
  return (
    <div className="p-4 max-w-4xl mx-auto min-h-screen bg-white dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-gray-900 p-6">
        <h1 className="text-center text-3xl mb-8 font-bold text-gray-800 dark:text-gray-200">
          إنشاء موضوع جديد
        </h1>
        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          {/* Title and Category */}
          <div className="flex flex-col gap-4 sm:flex-row justify-between">
            <TextInput
              name="title"
              type="text"
              placeholder="عنوان الموضوع"
              className="w-full sm:flex-1"
              required
              value={formData.title}
              onChange={handleInputChange}
              sizing="lg"
              shadow
            />
            <Select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full sm:w-64"
              sizing="lg"
            >
              <option value="قصص وتجارب">قصص وتجارب</option>
              <option value="التقارير والدراسات">التقارير والدراسات</option>
              <option value="أخبار">أخبار</option>
              <option value="مقالات">مقالات</option>
            </Select>
          </div>
          {/* Media Upload Section */}
          <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-500 transition-colors">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
                <div className="flex-1 w-full">
                  <FileInput
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFileChange}
                    disabled={isUploading || isSubmitting}
                    className="w-full"
                    icon={HiOutlineCloudUpload}
                  />
                </div>
                <Button
                  onClick={handleUploadMedia}
                  disabled={files.length === 0 || isUploading || isSubmitting}
                  isProcessing={isUploading}
                  color="blue"
                  pill
                  className="w-full sm:w-auto"
                >
                  {isUploading ? (
                    <span className="flex items-center gap-2">
                      <Spinner size="sm" />
                      جاري الرفع...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <HiOutlineCloudUpload className="h-5 w-5" />
                      رفع الملفات
                    </span>
                  )}
                </Button>
              </div>
              {/* File upload status */}
              <div className="space-y-4">
                {/* Pending files */}
                {files.length > 0 && (
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-3">
                      الملفات في انتظار الرفع <Badge color="gray">{files.length}</Badge>
                    </h3>
                    <ul className="space-y-3">
                      {files.map((file, index) => (
                        <li key={index} className="flex items-center gap-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                          <div className="flex-shrink-0">
                            {file.type.startsWith('image/') ? (
                              <img
                                src={URL.createObjectURL(file)}
                                className="w-12 h-12 object-cover rounded-md border border-gray-200 dark:border-gray-600"
                                alt="Preview"
                              />
                            ) : (
                              <video
                                className="w-12 h-12 object-cover rounded-md border border-gray-200 dark:border-gray-600"
                                muted
                              >
                                <source src={URL.createObjectURL(file)} type={file.type} />
                              </video>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">{file.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removePendingFile(index)}
                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500 p-1 transition-colors"
                            disabled={isUploading}
                          >
                            <HiOutlineTrash className="w-5 h-5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {/* Active uploads */}
                {activeUploads.length > 0 && (
                  <div className="p-4 border border-blue-100 dark:border-blue-900 rounded-lg bg-blue-50 dark:bg-blue-900">
                    <h3 className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-3 flex items-center gap-2">
                      <Spinner size="sm" color="blue" />
                      جاري رفع الملفات...
                    </h3>
                    <div className="space-y-4">
                      {activeUploads.map((fileName) => (
                        <div key={fileName} className="flex items-center gap-4 bg-white dark:bg-gray-800 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                          <div className="w-12 h-12 flex-shrink-0">
                            <CircularProgressbar
                              value={uploadProgress[fileName] || 0}
                              text={`${uploadProgress[fileName] || 0}%`}
                              styles={{
                                path: { stroke: '#3B82F6' },
                                text: { fill: '#3B82F6', fontSize: '24px' },
                                trail: { stroke: '#EFF6FF' },
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">{fileName}</p>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${uploadProgress[fileName] || 0}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Uploaded media preview - Modified to show videos first */}
          {formData.media.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200">
                الوسائط المرفوعة <Badge color="blue">{formData.media.length}</Badge>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {formData.media.map((media, index) => (
                  <div key={index} className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                    {media.type === 'image' ? (
                      <img
                        src={media.url}
                        alt={`Uploaded ${index}`}
                        className="w-full h-40 object-cover"
                      />
                    ) : (
                      <div className="relative w-full h-40 bg-black">
                        <svg className="w-12 h-12 text-white opacity-70 absolute inset-0 m-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                      <Tooltip content={media.originalName}>
                        <span className="text-white text-xs truncate w-full">{media.originalName}</span>
                      </Tooltip>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMedia(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      disabled={isSubmitting}
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                    {/* Add a radio button to select cover media */}
<div className="absolute bottom-2 left-2">
  <label className="flex items-center gap-2 text-white">
    <input
      type="radio"
      name="coverMedia"
      checked={formData.coverMedia === index}
      onChange={() => setFormData({ ...formData, coverMedia: index })}
      className="form-radio text-teal-500"
    />
    <span className="text-xs">غلاف</span>
  </label>
</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Rich Text Editor */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">محتوى الموضوع</label>
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
                  ['clean'],
                ],
              }}
              value={formData.content}
              onChange={(value) => setFormData({ ...formData, content: value })}
              placeholder="اكتب محتوى موضوعك هنا..."
              className="rtl-quill-editor bg-white dark:bg-gray-800 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden"
              style={{ minHeight: '300px' }}
            />
            <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
              <span>
                عدد الحروف: {characterCount}
                {characterCount < 100 && (
                  <span className="text-red-500 ml-2">
                    <HiOutlineExclamation className="inline mr-1" />
                    يجب أن يكون المحتوى 100 حرف على الأقل
                  </span>
                )}
              </span>
              <span>الحد الأقصى: 50,000 حرف</span>
            </div>
          </div>
          {/* Form actions */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              color="gray"
              onClick={() => window.history.back()}
              disabled={isSubmitting || isUploading}
            >
              رجوع
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isUploading || characterCount < 100}
              isProcessing={isSubmitting}
              color="blue"
              className="px-6"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Spinner size="sm" />
                  جاري النشر...
                </span>
              ) : 'نشر الموضوع'}
            </Button>
          </div>
          {/* Status messages */}
          <div className="space-y-3">
            {uploadError && (
              <Alert color="failure" onDismiss={() => setUploadError(null)}>
                <div className="flex items-center gap-2">
                  <HiOutlineExclamation className="h-5 w-5" />
                  <span>{uploadError}</span>
                </div>
              </Alert>
            )}
            {publishError && (
              <Alert color="failure" onDismiss={() => setPublishError(null)}>
                <div className="flex items-center gap-2">
                  <HiOutlineExclamation className="h-5 w-5" />
                  <span>{publishError}</span>
                </div>
              </Alert>
            )}
            {publishSuccess && (
              <Alert color="success" icon={HiCheck}>
                <span className="font-medium">{publishSuccess}</span>
              </Alert>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}