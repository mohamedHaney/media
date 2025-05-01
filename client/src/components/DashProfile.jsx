import { Alert, Button, Modal, ModalBody, TextInput } from 'flowbite-react';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import { app } from '../firebase';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { updateStart, updateSuccess, updateFailure, deleteUserStart, deleteUserSuccess, deleteUserFailure, signoutSuccess } from '../redux/user/userSlice';
import { useDispatch } from 'react-redux';
import { HiOutlineExclamationCircle } from 'react-icons/hi';
import { Link } from 'react-router-dom';

export default function DashProfile() {
  const { currentUser, error, loading } = useSelector((state) => state.user);
  const { theme } = useSelector((state) => state.theme);
  const [imageFile, setImageFile] = useState(null);
  const [imageFileUrl, setImageFileUrl] = useState(null);
  const [imageFileUploadProgress, setImageFileUploadProgress] = useState(null);
  const [imageFileUploadError, setImageFileUploadError] = useState(null);
  const [imageFileUploading, setImageFileUploading] = useState(false);
  const [updateUserSuccess, setUpdateUserSuccess] = useState(null);
  const [updateUserError, setUpdateUserError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({});
  const filePickerRef = useRef();
  const dispatch = useDispatch();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImageFileUrl(URL.createObjectURL(file));
    }
  };

  useEffect(() => {
    if (imageFile) {
      uploadImage();
    }
  }, [imageFile]);

  const uploadImage = async () => {
    setImageFileUploading(true);
    setImageFileUploadError(null);
    const storage = getStorage(app);
    const fileName = new Date().getTime() + imageFile.name;
    const storageRef = ref(storage, fileName);
    const uploadTask = uploadBytesResumable(storageRef, imageFile);
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setImageFileUploadProgress(progress.toFixed(0));
      },
      (error) => {
        setImageFileUploadError('Could not upload image (File must be less than 2MB)');
        setImageFileUploadProgress(null);
        setImageFile(null);
        setImageFileUrl(null);
        setImageFileUploading(false);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setImageFileUrl(downloadURL);
          setFormData({ ...formData, profilePicture: downloadURL });
          setImageFileUploading(false);
        });
      }
    );
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdateUserError(null);
    setUpdateUserSuccess(null);
    if (Object.keys(formData).length === 0) {
      setUpdateUserError('No changes made');
      return;
    }
    if (imageFileUploading) {
      setUpdateUserError('Please wait for image to upload');
      return;
    }
    try {
      dispatch(updateStart());
      const res = await fetch(`/api/user/update/${currentUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        dispatch(updateFailure(data.message));
        setUpdateUserError(data.message);
      } else {
        dispatch(updateSuccess(data));
        setUpdateUserSuccess("User's profile updated successfully");
      }
    } catch (error) {
      dispatch(updateFailure(error.message));
      setUpdateUserError(error.message);
    }
  };

  const handleDeleteUser = async () => {
    setShowModal(false);
    try {
      dispatch(deleteUserStart());
      const res = await fetch(`/api/user/delete/${currentUser._id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        dispatch(deleteUserFailure(data.message));
      } else {
        dispatch(deleteUserSuccess(data));
      }
    } catch (error) {
      dispatch(deleteUserFailure(error.message));
    }
  };

  const handleSignout = async () => {
    try {
      const res = await fetch(`/api/user/signout`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        console.log(data.message);
      } else {
        dispatch(signoutSuccess());
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  useEffect(() => {
    if (updateUserSuccess) {
      const timer = setTimeout(() => {
        setUpdateUserSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [updateUserSuccess]);

  return (
    <div className={`max-w-lg mx-auto p-3 w-full ${theme === 'dark' ? 'dark:bg-gray-900' : 'bg-white'} rounded-xl shadow-lg`}>
      <h1 className='my-7 text-center font-bold text-3xl text-gray-800 dark:text-white'>
        Profile
      </h1>
      
      {updateUserSuccess && (
        <Alert color='success' className='mb-6 animate-fade-in' withBorderAccent>
          {updateUserSuccess}
        </Alert>
      )}
      {(updateUserError || error) && (
        <Alert color='failure' className='mb-6 animate-fade-in' withBorderAccent>
          {updateUserError || error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className='flex flex-col gap-6'>
        <div className='flex flex-col items-center gap-4'>
          <input
            type='file'
            accept='image/*'
            onChange={handleImageChange}
            ref={filePickerRef}
            hidden
          />
          <div
            className='relative w-32 h-32 self-center cursor-pointer shadow-lg overflow-hidden rounded-full border-4 border-gray-200 dark:border-gray-600 hover:border-teal-500 dark:hover:border-teal-400 transition-all duration-300'
            onClick={() => filePickerRef.current.click()}
          >
            {imageFileUploadProgress && (
              <CircularProgressbar
                value={imageFileUploadProgress || 0}
                text={`${imageFileUploadProgress}%`}
                strokeWidth={5}
                styles={{
                  root: {
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    zIndex: 10,
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    borderRadius: '50%',
                  },
                  path: {
                    stroke: `rgba(16, 185, 129, ${imageFileUploadProgress / 100})`,
                  },
                  text: {
                    fill: '#fff',
                    fontSize: '24px',
                    fontWeight: 'bold',
                  },
                }}
              />
            )}
            {imageFileUrl || currentUser?.profilePicture ? (
              <img
                src={imageFileUrl || currentUser.profilePicture}
                alt='user'
                className={`rounded-full w-full h-full object-cover transition-opacity duration-300 ${
                  imageFileUploadProgress && imageFileUploadProgress < 100 ? 'opacity-70' : 'opacity-100'
                }`}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/150';
                }}
              />
            ) : (
              <div className='w-full h-full bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-4xl font-bold text-gray-500 dark:text-gray-300'>
                {currentUser?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </div>
          {imageFileUploadError && (
            <Alert color='failure' className='w-full mb-4' withBorderAccent>
              {imageFileUploadError}
            </Alert>
          )}
        </div>

        <div className='space-y-4'>
          <TextInput
            type='text'
            id='username'
            placeholder='Username'
            defaultValue={currentUser?.username}
            onChange={handleChange}
            className='dark:bg-gray-700 dark:border-gray-600 dark:text-white'
          />
          <TextInput
            type='email'
            id='email'
            placeholder='Email'
            defaultValue={currentUser?.email}
            onChange={handleChange}
            className='dark:bg-gray-700 dark:border-gray-600 dark:text-white'
          />
          <TextInput
            type='password'
            id='password'
            placeholder='Password'
            onChange={handleChange}
            className='dark:bg-gray-700 dark:border-gray-600 dark:text-white'
          />
        </div>

        <div className='space-y-4'>
          <Button
            type='submit'
            className={`bg-gradient-to-r from-slate-600 to-indigo-800 w-full font-bold transition-all hover:scale-[1.02] ${
              theme === 'dark' 
                ? 'bg-teal-700 hover:bg-teal-800 text-white'
                : 'bg-teal-600 hover:bg-teal-700 text-white'
            }`}
            disabled={loading || imageFileUploading}
          >
            {loading ? 'Loading...' : 'Update Profile'}
          </Button>
          
          {currentUser?.isAdmin && (
            <Link to={'/create-post'} className='block'>
              <Button
                type='button'
                className={`w-full font-bold transition-all hover:scale-[1.02] ${
                  theme === 'dark' 
                    ? 'bg-gray-200 hover:bg-gray-300'
                    : 'bg-teal-600 hover:bg-gray-100'
                }`}
              >
                Create New Post
              </Button>
            </Link>
          )}
        </div>
      </form>

      <div className='flex justify-between border-t border-gray-200 dark:border-gray-700 pt-6'>
        <button
          onClick={() => setShowModal(true)}
          className='text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors'
        >
          Delete Account
        </button>
        <button
          onClick={handleSignout}
          className='text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 font-medium transition-colors'
        >
          Sign Out
        </button>
      </div>

      <Modal
        show={showModal}
        onClose={() => setShowModal(false)}
        popup
        size='md'
        className='dark:bg-gray-900/80 backdrop-blur-sm'
      >
        <Modal.Header className='border-b border-gray-200 dark:border-gray-700' />
        <Modal.Body className='p-6'>
          <div className='text-center'>
            <HiOutlineExclamationCircle className='h-16 w-16 text-red-500 dark:text-red-400 mx-auto mb-4 animate-pulse' />
            <h3 className='mb-5 text-lg font-medium text-gray-800 dark:text-gray-200'>
              Are you sure you want to delete your account?
            </h3>
            <p className='text-gray-500 dark:text-gray-400 mb-6'>
              All your data will be permanently deleted and cannot be recovered.
            </p>
            <div className='flex justify-center gap-4'>
              <Button 
                className={`px-6 py-2.5 font-bold ${
                  theme === 'dark' 
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-red-500 hover:bg-red-600'
                } text-white transition-colors`}
                onClick={handleDeleteUser}
              >
                Yes, Delete Account
              </Button>
              <Button 
                className={`px-6 py-2.5 font-bold ${
                  theme === 'dark' 
                    ? 'bg-gray-600 hover:bg-gray-700'
                    : 'bg-gray-500 hover:bg-gray-600'
                } text-white transition-colors`}
                onClick={() => setShowModal(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}