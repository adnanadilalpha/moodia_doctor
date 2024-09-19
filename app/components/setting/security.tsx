import React, { useState, useEffect } from 'react';
import { getAuth, sendSignInLinkToEmail, updatePassword, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';

const SecuritySettings = () => {
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState(''); // For email link verification
  const [enable2FA, setEnable2FA] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false); // To track if 2FA is enabled
  const [message, setMessage] = useState(''); // For displaying status messages
  const auth = getAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleToggle2FA = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEnable2FA(e.target.checked);
  };

  const handleUpdateSecurity = async () => {
    const user = auth.currentUser;
    if (user && password) {
      try {
        await updatePassword(user, password);
        setMessage('Password updated successfully');
      } catch (error) {
        console.error('Error updating password:', error);
        setMessage('Error updating password');
      }
    }

    if (enable2FA && email) {
      try {
        // Send email link for 2FA
        const actionCodeSettings = {
          url: 'http://moodiaapp.com/finishSignUp', // Replace with your redirect URL
          handleCodeInApp: true,
        };
        await sendSignInLinkToEmail(auth, email, actionCodeSettings);
        window.localStorage.setItem('emailForSignIn', email);
        setMessage('Verification email sent for 2FA. Please check your inbox.');
      } catch (error) {
        console.error('Error enabling 2FA:', error);
        setMessage('Error enabling 2FA');
      }
    }
  };

  const handleVerifyEmailLink = async () => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      const email = window.localStorage.getItem('emailForSignIn') || ''; // Retrieve the stored email
      try {
        await signInWithEmailLink(auth, email, window.location.href);
        console.log('Email verified for 2FA');
        window.localStorage.removeItem('emailForSignIn');
        setIs2FAEnabled(true); // Set 2FA enabled state to true
        setMessage('2FA has been enabled successfully');
      } catch (error) {
        console.error('Error verifying email link:', error);
        setMessage('Error verifying email link');
      }
    }
  };

  // Check if the email link is present in the URL when the component mounts
  useEffect(() => {
    handleVerifyEmailLink();
  }, []);

  return (
    <div className="p-4">
      <input
        type="password"
        placeholder="New Password"
        value={password}
        onChange={handleInputChange}
        className="block w-full p-3 mb-4 border rounded-lg"
      />

      <div className="flex items-center mb-4">
        <input
          type="checkbox"
          checked={enable2FA}
          onChange={handleToggle2FA}
          className="mr-2"
        />
        <label>Enable Two-Factor Authentication (2FA)</label>
      </div>

      {enable2FA && (
        <div className="mb-4">
          <input
            type="email"
            placeholder="Email for 2FA"
            value={email}
            onChange={handleEmailChange}
            className="block w-full p-3 mb-4 border rounded-lg"
          />
        </div>
      )}

      <button
        onClick={handleUpdateSecurity}
        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        Update Security Settings
      </button>

      {/* Display success/failure messages */}
      {message && <p className="mt-4 text-green-600">{message}</p>}

      {/* Indicate 2FA is enabled */}
      {is2FAEnabled && <p className="mt-4 text-green-600">2FA is enabled</p>}
    </div>
  );
};

export default SecuritySettings;
