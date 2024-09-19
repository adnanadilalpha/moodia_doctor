import React, { useState } from 'react';

const ProfileSettings = () => {
  const [profileData, setProfileData] = useState({
    name: '',
    specialization: '',
    clinicName: '',
    email: '',
    bio: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    // Function to handle saving changes (connect to backend)
    console.log('Profile Data:', profileData);
  };

  return (
    <div className="p-4">
      <input 
        type="text" 
        name="name" 
        value={profileData.name} 
        onChange={handleInputChange} 
        placeholder="Name" 
        className="block w-full p-3 mb-4 border rounded-lg" 
      />
      <input 
        type="text" 
        name="specialization" 
        value={profileData.specialization} 
        onChange={handleInputChange} 
        placeholder="Specialization" 
        className="block w-full p-3 mb-4 border rounded-lg" 
      />
      <input 
        type="text" 
        name="clinicName" 
        value={profileData.clinicName} 
        onChange={handleInputChange} 
        placeholder="Clinic/Practice Name" 
        className="block w-full p-3 mb-4 border rounded-lg" 
      />
      <input 
        type="email" 
        name="email" 
        value={profileData.email} 
        onChange={handleInputChange} 
        placeholder="Email" 
        className="block w-full p-3 mb-4 border rounded-lg" 
      />
      <textarea 
        name="bio" 
        value={profileData.bio} 
        onChange={handleInputChange} 
        placeholder="Bio/Professional Description" 
        className="block w-full p-3 mb-4 border rounded-lg" 
      />
      <button onClick={handleSubmit} className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
        Save Changes
      </button>
    </div>
  );
};

export default ProfileSettings;
