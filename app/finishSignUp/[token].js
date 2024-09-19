// pages/finishSignUp.js
import { useEffect } from 'react';
import { getAuth, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { useRouter } from 'next/router';

const FinishSignUp = () => {
  const router = useRouter();
  const auth = getAuth();

  useEffect(() => {
    const emailForSignIn = window.localStorage.getItem('emailForSignIn');
    if (isSignInWithEmailLink(auth, window.location.href) && emailForSignIn) {
      // Complete the sign-in
      signInWithEmailLink(auth, emailForSignIn, window.location.href)
        .then(() => {
          window.localStorage.removeItem('emailForSignIn');
          router.push('/success'); // Redirect to success page after 2FA is enabled
        })
        .catch((error) => {
          console.error('Error verifying email link:', error);
        });
    }
  }, [auth, router]);

  return (
    <div>
      <h1>Finishing Sign-Up Process...</h1>
    </div>
  );
};

export default FinishSignUp;
