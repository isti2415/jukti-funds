import { useState } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { push, set, ref as dbRef, getDatabase } from 'firebase/database';
import app from './api/firebaseConfig';
import Layout from '@/components/layout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const EventUpload = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pictures, setPictures] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const storage = getStorage(app);
  const database = getDatabase(app);

  const createEventUpload = async () => {
    try {
      const uploadPromises = pictures.map(async (picture) => {
        const storageRef = ref(storage, `expenses/${title}`);
        const uploadTask = uploadBytes(storageRef, picture);

        return new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const uploadPercentage = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
              setUploadProgress(uploadPercentage);
            },
            (error) => {
              console.error('Error uploading picture:', error);
              reject(error);
            },
            () => {
              // Upload completed successfully
              uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                resolve(downloadURL);
              });
            }
          );
        });
      });

      const pictureUrls = await Promise.all(uploadPromises);

      const eventUploadRef = push(dbRef(database, 'eventUploads'));
      const eventUploadId = eventUploadRef.key;

      await set(eventUploadRef, {
        title,
        description,
        pictures: pictureUrls,
      });

      toast.success('Event uploaded successfully!');
      return eventUploadId;
    } catch (error) {
      console.error('Error creating event upload:', error);
      toast.error('Error uploading event!');
      return null;
    }
  };

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
  };

  const handlePicturesChange = (e) => {
    const files = Array.from(e.target.files);
    setPictures(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Create event upload
    const eventUploadId = await createEventUpload();

    // Reset form fields
    setTitle('');
    setDescription('');
    setPictures([]);
    setUploadProgress(0);
  };

  return (
    <Layout>
      <div className="flex justify-center items-center bg-gray-900">
        <div className="w-full max-w-md">
          <h1 className="text-2xl text-center text-white mb-6">Event Upload</h1>
          <form className="bg-gray-800 shadow-md rounded p-8" onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="title">
                Title
              </label>
              <input
                className="appearance-none bg-gray-700 border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline"
                type="text"
                id="title"
                value={title}
                onChange={handleTitleChange}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="description">
                Description
              </label>
              <textarea
                className="appearance-none bg-gray-700 border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline"
                id="description"
                value={description}
                onChange={handleDescriptionChange}
                required
              ></textarea>
            </div>
            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="pictures">
                Pictures
              </label>
              <input
                className="appearance-none bg-gray-700 border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline"
                type="file"
                id="pictures"
                onChange={handlePicturesChange}
                multiple
                required
              />
            </div>
            <button
              className="bg-jukti-orange hover:bg-jukti-orange-dark text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
              type="submit"
            >
              Submit
            </button>
          </form>
          {uploadProgress > 0 && (
            <div className="mt-4">
              <div className="text-center text-white font-bold mb-2">Upload Progress: {uploadProgress}%</div>
              <div className="bg-gray-700 h-2 rounded">
                <div className="bg-jukti-orange h-full rounded" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            </div>
          )}
        </div>
      </div>
      <ToastContainer />
    </Layout>
  );
};

export default EventUpload;
