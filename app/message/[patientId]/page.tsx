'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  getDoc,
  doc,
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '@/app/firebase';
import { useParams } from 'next/navigation';
import Navbar from '@/app/components/navbar';
import Sidebar from '@/app/components/sidebar';
import ChatList from '@/app/components/chatlist';
import { FaPaperPlane, FaImage, FaMicrophone, FaPaperclip } from 'react-icons/fa';

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderType: string;
  type: string;
  sentAt: Date;
}

interface UserProfile {
  name: string;
  profilePicture: string;
}

interface Chat {
  id: string;
  doctorId: string;
  patientId: string;
  lastMessage: string;
  unreadMessages: number;
}

const MessagePage: React.FC = () => {
  const { patientId } = useParams();
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [fileToSend, setFileToSend] = useState<File | null>(null);
  const [voiceMessage, setVoiceMessage] = useState<File | null>(null);
  const [patientProfile, setPatientProfile] = useState<UserProfile | null>(null);
  const [doctorProfile, setDoctorProfile] = useState<UserProfile | null>(null);
  const firestore = getFirestore();
  const auth = getAuth();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<"doctor" | "patient" | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  // Helper function to scroll to the bottom of the chat
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch patient profile from the 'users' collection
  const fetchPatientProfile = async (patientId: string) => {
    try {
      const userDoc = await getDoc(doc(firestore, 'users', patientId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setPatientProfile({
          name: userData?.displayName || 'No Name',
          profilePicture: userData?.photoURL || '/default-avatar.png',
        });
      }
    } catch (error) {
      console.error('Error fetching patient profile:', error);
    }
  };

  // Fetch doctor profile from the 'doctors' collection
  const fetchDoctorProfile = async (doctorId: string) => {
    try {
      const doctorDoc = await getDoc(doc(firestore, 'doctors', doctorId));
      if (doctorDoc.exists()) {
        const doctorData = doctorDoc.data();
        setDoctorProfile({
          name: doctorData?.fullName || 'No Name',
          profilePicture: doctorData?.photoURL || '/default-avatar.png',
        });
      }
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
    }
  };

  // Load the current user and set user type
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setUserType(user.email?.includes('doctor') ? 'doctor' : 'patient');
      }
    });

    return () => unsubscribe();
  }, [auth]);

  // Load the chat messages once a chat is selected
  useEffect(() => {
    if (selectedChat) {
      setLoadingMessages(true);
      const q = query(
        collection(firestore, `chats/${selectedChat.id}/messages`),
        orderBy('sentAt', 'asc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const messagesData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            content: data.message,
            senderId: data.senderId,
            senderType: data.senderType,
            type: data.type,
            sentAt: data.sentAt ? data.sentAt.toDate() : new Date(),
          } as Message;
        });

        setMessages(messagesData);
        setLoadingMessages(false);
        scrollToBottom();
      });

      return () => unsubscribe();
    }
  }, [firestore, selectedChat]);

  // Fetch profiles when a chat is selected
  useEffect(() => {
    if (selectedChat) {
      fetchPatientProfile(selectedChat.patientId);
      fetchDoctorProfile(selectedChat.doctorId);
    }
  }, [selectedChat]);

  // Function to handle file uploads to Firebase Storage
  const handleFileUpload = async (file: File, chatId: string) => {
    const fileRef = ref(storage, `chats/${chatId}/${file.name}`);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  };

  // Handle sending messages
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !fileToSend && !voiceMessage) return;

    try {
      let content = newMessage;
      let messageType: string = 'text';

      if (fileToSend && selectedChat) {
        content = await handleFileUpload(fileToSend, selectedChat.id);
        messageType = 'file';
        setFileToSend(null);
      }

      if (voiceMessage && selectedChat) {
        const audioURL = await handleFileUpload(voiceMessage, selectedChat.id);
        content = audioURL;
        messageType = 'voice';
        setVoiceMessage(null); // Reset the voice message after it's sent
      }

      setIsRecording(false);
      setAudioChunks([]); // Clear audio chunks

      await addDoc(collection(firestore, `chats/${selectedChat?.id}/messages`), {
        message: content,
        senderId: currentUser?.uid,
        senderType: userType || 'unknown',
        type: messageType,
        sentAt: serverTimestamp(),
      });

      setNewMessage('');
      scrollToBottom();
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // Handle voice recording logic
  const handleVoiceRecord = async () => {
    if (!isRecording) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      setIsRecording(true);

      mediaRecorderRef.current.ondataavailable = (e) => {
        setAudioChunks((prev) => [...prev, e.data]);
      };

      mediaRecorderRef.current.start();
    } else {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);

      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const audioFile = new File([audioBlob], 'voiceMessage.webm', { type: 'audio/webm' });
      setVoiceMessage(audioFile);
      setAudioChunks([]); // Reset audio chunks
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {currentUser ? (
        <Sidebar patientId={userType === 'doctor' ? currentUser.uid : selectedChat?.doctorId} />
      ) : (
        <div>No user found</div>
      )}
      <div className="flex flex-col flex-grow">
        <Navbar />
        <div className="flex-grow flex">
          <div className="w-1/4 border-r bg-white">
            <ChatList currentUser={currentUser} onSelectChat={setSelectedChat} />
          </div>

          <div className="w-3/4 flex flex-col">
            <div className="flex-grow p-4 bg-gray-100 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 150px)' }}>
              {selectedChat ? (
                loadingMessages ? (
                  <p>Loading messages...</p>
                ) : (
                  <>
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex mb-4 ${msg.senderId === currentUser?.uid ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`p-3 rounded-lg max-w-xs break-words ${
                            msg.senderId === currentUser?.uid ? 'bg-primary text-white' : 'bg-gray-200 text-black'
                          }`}
                        >
                          <div className="flex items-center mb-2">
                            <img
                              src={
                                msg.senderId === selectedChat?.doctorId
                                  ? doctorProfile?.profilePicture || '/default-avatar.png'
                                  : patientProfile?.profilePicture || '/default-avatar.png'
                              }
                              alt="Profile"
                              className="w-6 h-6 rounded-full mr-2"
                            />
                            <p className="font-semibold text-sm">
                              {msg.senderId === selectedChat?.doctorId
                                ? doctorProfile?.name || 'Doctor'
                                : patientProfile?.name || 'Patient'}
                            </p>
                          </div>
                          {msg.type === 'text' && msg.content}
                          {msg.type === 'image' && <img src={msg.content} alt="Sent Image" className="max-w-xs" />}
                          {msg.type === 'document' && (
                            <a href={msg.content} target="_blank" rel="noopener noreferrer" className="underline">
                              View Document
                            </a>
                          )}
                          {msg.type === 'voice' && (
                            <audio controls>
                              <source src={msg.content} type="audio/webm" />
                              Your browser does not support the audio element.
                            </audio>
                          )}
                          {msg.type === 'file' && (
                            <a href={msg.content} target="_blank" rel="noopener noreferrer" className="underline">
                              Download File
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </>
                )
              ) : (
                <div className="text-center">Select a conversation to start chatting</div>
              )}
            </div>

            {selectedChat && (
              <form className="p-4 bg-white flex items-center border-t" onSubmit={handleSendMessage}>
                <label htmlFor="fileInputDocument" className="cursor-pointer">
                  <FaPaperclip className="text-gray-500 mr-4" />
                </label>
                <input
                  type="file"
                  id="fileInputDocument"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={(e) => setFileToSend(e.target.files?.[0] || null)}
                />

                <label htmlFor="fileInputImage" className="cursor-pointer">
                  <FaImage className="text-gray-500 mr-4" />
                </label>
                <input
                  type="file"
                  id="fileInputImage"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => setFileToSend(e.target.files?.[0] || null)}
                />

                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-grow p-2 border border-gray-300 rounded-lg"
                  placeholder="Type a message..."
                />

                <button type="button" className="ml-4 text-blue-500" onClick={handleVoiceRecord}>
                  <FaMicrophone className={`text-2xl ${isRecording ? 'text-red-500' : 'text-gray-500'}`} />
                </button>

                <button type="submit" className="ml-4 text-blue-500">
                  <FaPaperPlane className="text-2xl" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagePage;
