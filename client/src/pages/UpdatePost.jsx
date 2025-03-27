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
    const determineMediaType = (url) => {
      const extension = url.split('.').pop().toLowerCase();
      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) return 'image/jpeg';
      if (['mp4', 'mov', 'avi', 'wmv'].includes(extension)) return 'video/mp4';
      return 'unknown';
    };

    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/post/getposts?postId=${postId}`);
        const data = await res.json();
        if (!res.ok) {
          setPublishError(data.message);
          return;
        }

        const post = data.posts[0];
        const images = post.images || (post.image ? [post.image] : []);
        const mediaTypes = images.map(img => determineMediaType(img));

        setFormData({
          ...post,
          images,
          mediaTypes,
          video: post.video || null
        });

      } catch (error) {
        setPublishError('Failed to load post data');
        console.error('Fetch error:', error);
      }
    };
    fetchPost();
  }, [postId]);

  const isImageFile = (url, index) => {
    if (formData.mediaTypes && formData.mediaTypes[index]) {
      return formData.mediaTypes[index].startsWith('image');
    }
    const extension = url.split('.').pop().toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension);
  };

  return (
    <div className="p-3 max-w-3xl mx-auto min-h-screen">
      <h1 className="text-center text-3xl my-7 font-semibold">تحديث الموضوع</h1>

      {formData.video && (
        <div className="relative group border rounded-lg p-4">
          <h3 className="font-medium mb-2">الفيديو:</h3>
          <video src={formData.video} controls className="w-full h-72 object-contain rounded-lg" />
        </div>
      )}

      {formData.images.length > 0 && (
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-2">الصور ({formData.images.length}):</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {formData.images.map((image, index) => (
              <div key={index} className="relative group">
                {isImageFile(image, index) ? (
                  <img src={image} alt={`upload-${index}`} className="w-full h-40 object-cover rounded-lg" />
                ) : (
                  <video src={image} className="w-full h-40 object-cover rounded-lg" controls />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
