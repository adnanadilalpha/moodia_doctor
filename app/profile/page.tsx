"use client";

import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL, uploadBytes } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import Sidebar from '../components/sidebar';
import Navbar from '../components/navbar';

interface Doctor {
  fullName: string;
  email: string;
  specialization: string;
  bio: string;
  photoURL?: string | undefined; // Allow undefined but not null
}

const Profile: React.FC = () => {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Doctor>({
    fullName: '',
    email: '',
    specialization: '',
    bio: '',
  });
  const [photoURL, setPhotoURL] = useState<string | undefined>(undefined); // Only string or undefined

  const auth = getAuth();
  const firestore = getFirestore();
  const storage = getStorage();

  useEffect(() => {
    const fetchDoctorData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const doctorRef = doc(firestore, 'doctors', user.uid);
          const doctorDoc = await getDoc(doctorRef);

          if (doctorDoc.exists()) {
            const doctorData = doctorDoc.data() as Doctor;
            setDoctor(doctorData);

            setFormData({
              fullName: doctorData.fullName || user.displayName || '',
              email: doctorData.email || user.email!,
              specialization: doctorData.specialization || '',
              bio: doctorData.bio || '',
            });

            // Set photoURL only if it exists
            if (doctorData.photoURL) {
              setPhotoURL(doctorData.photoURL);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching doctor data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorData();
  }, [auth, firestore]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    try {
      const doctorRef = doc(firestore, 'doctors', user.uid);
      await setDoc(doctorRef, formData, { merge: true });
      setDoctor({ ...formData, photoURL });
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 1, 
        maxWidthOrHeight: 800, 
        useWebWorker: true, 
        fileType: 'image/webp' 
      });

      const user = auth.currentUser;
      if (!user) return;

      const storageRef = ref(storage, `doctors/${user.uid}/profile.webp`);
      await uploadBytes(storageRef, compressedFile);
      const downloadURL = await getDownloadURL(storageRef);

      await updateDoc(doc(firestore, 'doctors', user.uid), { photoURL: downloadURL });
      setPhotoURL(downloadURL);
    } catch (error) {
      console.error('Error uploading profile image:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col">
      <Navbar />
      <div className="flex-grow flex">
      <Sidebar />
        <div className="p-8 w-full">
          <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
            <h1 className="text-3xl font-bold mb-6">Profile</h1>
            <div className="flex items-center mb-6">
              <div className="w-32 h-32">
                <img
                  src={photoURL || `https://via.placeholder.com/128?text=${formData.fullName.charAt(0) || 'D'}`}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <div className="ml-4">
                <label htmlFor="profileImage" className="text-blue-500 cursor-pointer">
                  Change Profile Picture
                </label>
                <input
                  id="profileImage"
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageUpload}
                  className="hidden"
                />
              </div>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-md"
                  disabled={!editing}
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-md"
                  disabled
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Specialization</label>
                <input
                  type="text"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-md"
                  disabled={!editing}
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-md"
                  disabled={!editing}
                />
              </div>
              <div className="flex justify-between items-center">
                {!editing && (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md"
                  >
                    Edit Profile
                  </button>
                )}
                {editing && (
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-500 text-white rounded-md"
                  >
                    Save Changes
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;