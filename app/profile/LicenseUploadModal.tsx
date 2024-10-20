// use client
import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface LicenseUploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const LicenseUploadModal: React.FC<LicenseUploadModalProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    LicenseNumber: '',
    IssuingAuthority: '',
    ExpirationDate: '',
    licenseFile: null as File | null,
  });

  const [errors, setErrors] = useState({
    LicenseNumber: '',
    IssuingAuthority: '',
    ExpirationDate: '',
    licenseFile: '',
  });

  const auth = getAuth();
  const firestore = getFirestore();
  const storage = getStorage();

  // Fetch existing license data when the component mounts
  useEffect(() => {
    const fetchLicenseData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const doctorRef = doc(firestore, 'doctors', user.uid);
        const doctorDoc = await getDoc(doctorRef);

        if (doctorDoc.exists()) {
          const doctorData = doctorDoc.data();
          setFormData((prev) => ({
            ...prev,
            LicenseNumber: doctorData.LicenseNumber || '',
            IssuingAuthority: doctorData.IssuingAuthority || '',
            ExpirationDate: doctorData.ExpirationDate || '',
          }));
        }
      } catch (error) {
        console.error('Error fetching license data:', error);
      }
    };

    fetchLicenseData();
  }, []);

  const validateForm = () => {
    let valid = true;
    let newErrors = {
      LicenseNumber: '',
      IssuingAuthority: '',
      ExpirationDate: '',
      licenseFile: '',
    };

    if (!formData.LicenseNumber) {
      valid = false;
      newErrors.LicenseNumber = 'License number is required';
    }

    if (!formData.IssuingAuthority) {
      valid = false;
      newErrors.IssuingAuthority = 'Issuing authority is required';
    }

    if (!formData.ExpirationDate) {
      valid = false;
      newErrors.ExpirationDate = 'Expiration date is required';
    }

    // Only require licenseFile if it hasn't been uploaded before
    if (!formData.licenseFile) {
      valid = false;
      newErrors.licenseFile = 'License file is required';
    }

    setErrors(newErrors);
    return valid;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;

    if (name === 'licenseFile') {
      const file = files ? files[0] : null;
      setFormData((prev) => ({ ...prev, licenseFile: file }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) return;

      let fileURL = null;

      if (formData.licenseFile) {
        // Upload the license file to Firebase Storage
        const storageRef = ref(storage, `doctors/${user.uid}/license/${formData.licenseFile.name}`);
        await uploadBytes(storageRef, formData.licenseFile);
        fileURL = await getDownloadURL(storageRef);
      }

      // Update Firestore with license details
      const doctorRef = doc(firestore, 'doctors', user.uid);
      await updateDoc(doctorRef, {
        LicenseNumber: formData.LicenseNumber,
        IssuingAuthority: formData.IssuingAuthority,
        ExpirationDate: formData.ExpirationDate,
        licenseFileURL: fileURL,
        licenseStatus: 'Under Review',
      });

      // Close the modal and show confirmation message
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error submitting license data:', error);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-8 rounded-lg w-96">
        <h2 className="text-xl font-semibold mb-4">Submit Professional License</h2>
        <form onSubmit={handleFormSubmit}>
          {/* License Number */}
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold">License Number</label>
            <input
              type="text"
              name="LicenseNumber"
              value={formData.LicenseNumber}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none ${
                errors.LicenseNumber ? 'border-red-500' : ''
              }`}
            />
            {errors.LicenseNumber && <p className="text-red-500 text-sm">{errors.LicenseNumber}</p>}
          </div>
          {/* Issuing Authority */}
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold">Issuing Authority</label>
            <input
              type="text"
              name="IssuingAuthority"
              value={formData.IssuingAuthority}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none ${
                errors.IssuingAuthority ? 'border-red-500' : ''
              }`}
            />
            {errors.IssuingAuthority && (
              <p className="text-red-500 text-sm">{errors.IssuingAuthority}</p>
            )}
          </div>
          {/* Expiration Date */}
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold">Expiration Date</label>
            <input
              type="date"
              name="ExpirationDate"
              value={formData.ExpirationDate}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none ${
                errors.ExpirationDate ? 'border-red-500' : ''
              }`}
            />
            {errors.ExpirationDate && (
              <p className="text-red-500 text-sm">{errors.ExpirationDate}</p>
            )}
          </div>
          {/* License File */}
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold">License File</label>
            <input
              type="file"
              name="licenseFile"
              accept=".jpeg,.jpg,.png,.pdf"
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none ${
                errors.licenseFile ? 'border-red-500' : ''
              }`}
            />
            {errors.licenseFile && <p className="text-red-500 text-sm">{errors.licenseFile}</p>}
          </div>
          {/* Buttons */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 mr-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LicenseUploadModal;
