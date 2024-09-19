import React, { useState, useEffect } from 'react';
import {
  getFirestore,
  doc,
  getDocs,
  collection,
  query,
  where,
  deleteDoc,
  DocumentData,
} from 'firebase/firestore';
import { deleteUser, getAuth, onAuthStateChanged } from 'firebase/auth'; // Firebase Authentication
import jsPDF from 'jspdf'; // Library for PDF generation
import { useRouter } from 'next/navigation'; // Assuming Next.js for routing

const DataPrivacySettings = () => {
  const [userId, setUserId] = useState<string | null>(null); // Store the current user's ID
  const firestore = getFirestore();
  const auth = getAuth();
  const router = useRouter();

  useEffect(() => {
    // Fetch the currently authenticated user
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid); // Set the current user ID when the user is authenticated
      } else {
        setUserId(null); // Handle the case when the user is not logged in
      }
    });

    return () => unsubscribe(); // Cleanup subscription
  }, [auth]);

  // Helper function to fetch all documents from relevant collections
  const fetchAllUserData = async (uid: string) => {
    const userDocs: { collection: string; data: DocumentData; }[] = [];
    const collections = ['chats', 'doctorPaymentMethod', 'doctors', 'sessions']; // Add other collection names here

    for (const collectionName of collections) {
      const userRef = collection(firestore, collectionName);
      const q = query(userRef, where('doctorId', '==', uid));

      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        userDocs.push({
          collection: collectionName,
          data: doc.data(),
        });
      });
    }

    return userDocs;
  };

  // Download user data from Firestore and generate a structured PDF
  const handleDownloadData = async () => {
    if (!userId) {
      console.error('User is not authenticated');
      return;
    }

    try {
      const userData = await fetchAllUserData(userId);

      if (userData.length === 0) {
        console.log('No data found for the user.');
        return;
      }

      // Generate PDF using jsPDF
      const pdfDoc = new jsPDF();
      pdfDoc.setFontSize(16);
      pdfDoc.text('User Data Export', 10, 10);

      let yOffset = 20; // Initialize Y-axis offset

      userData.forEach((entry) => {
        // Add collection name
        pdfDoc.setFontSize(12);
        pdfDoc.setTextColor(0, 0, 255); // Set text color to blue
        pdfDoc.text(`Collection: ${entry.collection}`, 10, yOffset);
        yOffset += 10;

        // Transform JSON data to normal text form
        const dataObject = entry.data;
        let dataText = '';

        for (const [key, value] of Object.entries(dataObject)) {
          dataText += `${key}: ${JSON.stringify(value)}\n`;
        }

        // Split text into lines to fit the page width
        pdfDoc.setFontSize(10);
        pdfDoc.setTextColor(0, 0, 0); // Set text color to black
        const lines = pdfDoc.splitTextToSize(dataText, 180);

        pdfDoc.text(lines, 10, yOffset);
        yOffset += lines.length * 6; // Adjust yOffset for each block of text

        if (yOffset > 280) {
          pdfDoc.addPage(); // Add a new page if content exceeds page height
          yOffset = 20; // Reset Y-axis for new page
        }
      });

      // Download the PDF
      pdfDoc.save('user-data.pdf');
      console.log('Data downloaded');
    } catch (error) {
      console.error('Error downloading data:', error);
    }
  };

  // Delete the user's account and associated data
  const handleDeleteAccount = async () => {
    if (!userId) {
      console.error('User is not authenticated');
      return;
    }

    try {
      // Delete all documents related to the user in all collections
      const collections = ['chats', 'doctorPaymentMethod', 'doctors', 'sessions']; // Add other collection names here

      for (const collectionName of collections) {
        const userRef = collection(firestore, collectionName);
        const q = query(userRef, where('doctorId', '==', userId));

        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(async (docSnap) => {
          await deleteDoc(doc(firestore, collectionName, docSnap.id));
        });
      }

      // Delete user from Firebase Authentication
      const user = auth.currentUser;
      if (user) {
        await deleteUser(user);
        console.log('Account and data deleted successfully');
      }

      // Redirect to the signup page
      router.push('/signup');
    } catch (errorCode) {
      if (errorCode === 'auth/requires-recent-login') {
        console.error('User needs to log in again to delete their account.');
        alert('Please log in again to delete your account.');
      } else {
        console.error('Error deleting account:', errorCode);
      }
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Manage Your Data</h2>

      {/* Buttons to Download Data and Delete Account */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={handleDownloadData}
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
        >
          Download My Data
        </button>
        <button
          onClick={handleDeleteAccount}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
        >
          Delete My Account
        </button>
      </div>
    </div>
  );
};

export default DataPrivacySettings;
