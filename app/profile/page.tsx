"use client";

import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, updateDoc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import Sidebar from '../components/sidebar';
import Navbar from '../components/navbar';
import Select from 'react-select';
import { getNames } from 'country-list';
import ISO6391 from 'iso-639-1';
import { FaCamera, FaTrash } from 'react-icons/fa';

import LicenseUploadModal from './LicenseUploadModal';
import { db } from '../firebase';
import { sendEmailNotification } from '../utils/emailService';

interface Doctor {
  fullName: string;
  email: string;
  specialization: string;
  LicenseNumber: string;
  bio: string;
  location: string;
  languagesSpoken: string[];
  photoURL?: string | undefined;
  licenseStatus?: string;
  IssuingAuthority?: string;
  ExpirationDate?: string;
  licenseFileURL?: string;
  notificationSent?: boolean; // New field to track if the notification has been sent
}

const createNotification = async (doctorId: string, message: string) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      doctorId,
      message,
      createdAt: serverTimestamp(),
      read: false,
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

const Profile: React.FC = () => {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Doctor>({
    fullName: '',
    email: '',
    specialization: '',
    LicenseNumber: '',
    bio: '',
    location: '',
    languagesSpoken: [],
  });
  const [photoURL, setPhotoURL] = useState<string | undefined>(undefined);
  const [licenseStatus, setLicenseStatus] = useState<string>('');
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  const countryOptions = getNames().map((name: string) => ({ value: name, label: name }));
  const languageOptions = ISO6391.getAllCodes().map(code => ({ value: code, label: ISO6391.getName(code) }));

  const auth = getAuth();
  const firestore = getFirestore();
  const storage = getStorage();

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const doctorRef = doc(firestore, 'doctors', user.uid);

      // Listen for real-time updates
      const unsubscribe = onSnapshot(doctorRef, async (docSnapshot) => {
        if (docSnapshot.exists()) {
          const doctorData = docSnapshot.data() as Doctor;
          setDoctor(doctorData);

          // Check if license status has changed to "approved" and notification has not been sent
          if (doctorData.licenseStatus === 'approved' && !doctorData.notificationSent) {
            // Send in-app notification
            await createNotification(user.uid, 'Your license has been approved. Your availability is now active. You can make customizations to your availability.');
            
            // Send email notification
            try {
              await sendEmailNotification({
                to: doctorData.email,
                subject: 'License Approved - Calendar Activated',
                body: `
                  <h1>License Approved</h1>
                  <p>Your license has been approved. Your availability is now active.</p>
                  <p>You can now customize your availability and start accepting appointments.
                  Click here to customize your availability: <a href="https://doctorapp.moodiaapp.com//setting">Moodia</a></p>
                `,
              });
              console.log('License approval email sent successfully');
            } catch (error) {
              console.error('Failed to send license approval email:', error);
            }

            // Update Firestore to mark the notification as sent
            await updateDoc(doctorRef, {
              notificationSent: true, // Add this field to track notification sent status
            });
          }

          setFormData({
            fullName: doctorData.fullName || user.displayName || '',
            email: doctorData.email || user.email!,
            specialization: doctorData.specialization || '',
            LicenseNumber: doctorData.LicenseNumber || '',
            bio: doctorData.bio || '',
            location: doctorData.location || '',
            languagesSpoken: doctorData.languagesSpoken || [],
          });
          setPhotoURL(doctorData.photoURL || undefined);
          setLicenseStatus(doctorData.licenseStatus || '');
        } else {
          // Document does not exist
          setDoctor(null);
          setFormData({
            fullName: user.displayName || '',
            email: user.email!,
            specialization: '',
            LicenseNumber: '',
            bio: '',
            location: '',
            languagesSpoken: [],
          });
          setPhotoURL(undefined);
          setLicenseStatus('');
        }
        setLoading(false);
      }, (error) => {
        console.error('Error listening to doctor data:', error);
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, [auth, firestore, licenseStatus]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    try {
      const doctorRef = doc(firestore, 'doctors', user.uid);
      await setDoc(doctorRef, { ...formData }, { merge: true });
      setDoctor({ ...formData, photoURL, licenseStatus });
      setEditing(false); // Disable editing mode after saving
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (!editing) setEditing(true); // Enable editing mode when input changes
  };

  const handleSelectChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const user = auth.currentUser;
    if (!user) return;

    try {
      setUploadingPhoto(true);
      
      // Delete old photo if exists
      if (photoURL && photoURL.includes('firebasestorage')) {
        const oldPhotoRef = ref(storage, photoURL);
        await deleteObject(oldPhotoRef).catch(err => console.log('No old photo to delete'));
      }

      const storageRef = ref(storage, `profile-pictures/${user.uid}/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // Update Firestore
      const doctorRef = doc(firestore, 'doctors', user.uid);
      await updateDoc(doctorRef, {
        photoURL: downloadURL
      });

      setPhotoURL(downloadURL);
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      setErrorMessage(true);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeleteProfilePicture = async () => {
    const user = auth.currentUser;
    if (!user || !photoURL) return;

    try {
      setUploadingPhoto(true);

      if (photoURL.includes('firebasestorage')) {
        const photoRef = ref(storage, photoURL);
        await deleteObject(photoRef);
      }

      // Update Firestore
      const doctorRef = doc(firestore, 'doctors', user.uid);
      await updateDoc(doctorRef, {
        photoURL: null
      });

      setPhotoURL(undefined);
    } catch (error) {
      console.error('Error deleting profile picture:', error);
      setErrorMessage(true);
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-r from-blue-100 to-blue-300">
      <Navbar />
      <div className="flex-grow flex">
        <Sidebar />
        <div className="p-8 w-full">
          <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/3 bg-blue-600 p-8 text-white">
                <div className="text-center">
                  <div className="text-center relative">
                    <div className="w-40 h-40 mx-auto mb-4 relative group">
                      <img
                        src={photoURL || `https://via.placeholder.com/160?text=${formData.fullName.charAt(0) || 'D'}`}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover border-4 border-white"
                      />
                      <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                        <label className="cursor-pointer p-2 hover:text-blue-300">
                          <FaCamera size={24} />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleProfilePictureUpload}
                            className="hidden"
                          />
                        </label>
                        {photoURL && (
                          <button
                            onClick={handleDeleteProfilePicture}
                            className="p-2 hover:text-red-300"
                          >
                            <FaTrash size={24} />
                          </button>
                        )}
                      </div>
                      {uploadingPhoto && (
                        <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                        </div>
                      )}
                    </div>
                    <h2 className="text-2xl font-bold mb-2">{formData.fullName}</h2>
                    <p className="text-blue-200 mb-4">{formData.specialization}</p>
                  </div>
                  <div className="mt-8">
                    <h3 className="text-xl font-semibold mb-2">License Status</h3>
                    <p className={`text-lg ${licenseStatus === 'approved' ? 'text-green-300' : 'text-yellow-300'}`}>
                      {licenseStatus || 'Pending'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="md:w-2/3 p-8">
                <h1 className="text-3xl font-bold mb-6 text-gray-800">Doctor Profile</h1>
                <form onSubmit={handleFormSubmit} className="space-y-6">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">Full Name</label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 transition duration-300"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 transition duration-300"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">Specialization</label>
                      <input
                        type="text"
                        name="specialization"
                        value={formData.specialization}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 transition duration-300"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">License Number</label>
                      <input
                        type="text"
                        name="LicenseNumber"
                        value={formData.LicenseNumber}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 transition duration-300"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">Bio</label>
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 transition duration-300"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">Location</label>
                      <Select
                        name="location"
                        value={countryOptions.find(option => option.value === formData.location)}
                        onChange={(option: any) => handleSelectChange('location', option?.value || '')}
                        options={countryOptions}
                        className="w-full"
                        styles={{
                          control: (base) => ({
                            ...base,
                            borderColor: '#e2e8f0',
                            '&:hover': {
                              borderColor: '#cbd5e0',
                            },
                          }),
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">Languages Spoken</label>
                      <Select
                        name="languagesSpoken"
                        value={formData.languagesSpoken.map(lang => ({ value: lang, label: lang }))}
                        onChange={(options) => {
                          handleSelectChange('languagesSpoken', options.map((option: any) => option.value));
                          if (!editing) setEditing(true);
                        }}
                        options={languageOptions}
                        isMulti
                        className="w-full"
                        styles={{
                          control: (base) => ({
                            ...base,
                            borderColor: '#e2e8f0',
                            '&:hover': {
                              borderColor: '#cbd5e0',
                            },
                          }),
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-8">
                    <button
                      type="submit"
                      className={`px-6 py-3 text-white rounded-md transition duration-300 ${
                        editing
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}
                    >
                      {editing ? "Save Changes" : "Edit Profile"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsLicenseModalOpen(true)}
                      className="px-6 py-3 bg-yellow-500 text-black rounded-md hover:bg-yellow-600 transition duration-300"
                    >
                      Submit License
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Conditionally render the LicenseUploadModal */}
      {isLicenseModalOpen && (
        <LicenseUploadModal
          onClose={() => setIsLicenseModalOpen(false)}
          onSuccess={() => setSuccessMessage(true)}
        />
      )}
      {/* Display success message */}
      {successMessage && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-8 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">License Submitted</h2>
            <p>Your professional license has been submitted and is now under review.</p>
            <button
              onClick={() => setSuccessMessage(false)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
      {errorMessage && <p className="text-red-500">An error occurred. Please try again.</p>}
    </div>
  );
};

export default Profile;
