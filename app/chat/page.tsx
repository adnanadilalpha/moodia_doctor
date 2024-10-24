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
import { storage } from '../firebase';
import { useParams } from 'next/navigation';
import Navbar from '../components/navbar';
import Sidebar from '../components/sidebar';
import ChatList from '../components/chatlist';
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
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Helper function to scroll to the bottom of the chat
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Fetch patient profile from the 'users' collection
  const fetchPatientProfile = async (patientId: string) => {
    try {
      const userDoc = await getDoc(doc(firestore, 'users', patientId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setPatientProfile({
          name: userData?.username || 'patient',
          profilePicture: userData?.photoURL || '/user_avatar.png',
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
          name: doctorData?.fullName || 'doctor',
          profilePicture: doctorData?.photoURL || '/user_avatar.png',
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
    <div className="flex flex-col h-screen bg-gradient-to-r from-blue-100 to-blue-300">
      <Navbar />
      <div className="flex flex-grow overflow-hidden">
        {currentUser ? (
          <Sidebar patientId={userType === 'doctor' ? currentUser.uid : selectedChat?.doctorId} />
        ) : (
          <div>No user found</div>
        )}
        <div className="flex-grow flex flex-col md:flex-row mt-8">
          <div className="w-full md:w-1/3 lg:w-1/4 border-r border-gray-200">
            <ChatList currentUser={currentUser} onSelectChat={setSelectedChat} />
          </div>

          <div className="w-full md:w-2/3 lg:w-3/4 flex flex-col">
            <div 
              ref={messagesContainerRef}
              className="flex-grow p-4 bg-white overflow-y-auto"
              style={{ maxHeight: 'calc(100vh - 150px)' }}
            >
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
                          className={`p-3 rounded-lg max-w-xs md:max-w-sm lg:max-w-md break-words ${
                            msg.senderId === currentUser?.uid
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-800'
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
                  </>
                )
              ) : (
                <div className="text-center text-gray-500">Select a conversation to start chatting</div>
              )}
            </div>

            {selectedChat && (
              <form className="p-4 bg-white flex items-center border-t" onSubmit={handleSendMessage}>
                <div className="flex items-center space-x-2 mr-2">
                  <label htmlFor="fileInputDocument" className="cursor-pointer hover:text-blue-500 transition-colors">
                    <FaPaperclip className="text-gray-500" />
                  </label>
                  <input
                    type="file"
                    id="fileInputDocument"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={(e) => setFileToSend(e.target.files?.[0] || null)}
                  />

                  <label htmlFor="fileInputImage" className="cursor-pointer hover:text-blue-500 transition-colors">
                    <FaImage className="text-gray-500" />
                  </label>
                  <input
                    type="file"
                    id="fileInputImage"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => setFileToSend(e.target.files?.[0] || null)}
                  />
                </div>

                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-grow p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Type a message..."
                />

                <div className="flex items-center space-x-2 ml-2">
                  <button
                    type="button"
                    className="text-gray-500 hover:text-blue-500 transition-colors"
                    onClick={handleVoiceRecord}
                  >
                    <FaMicrophone className={`text-2xl ${isRecording ? 'text-red-500' : ''}`} />
                  </button>

                  <button type="submit" className="text-blue-500 hover:text-blue-600 transition-colors">
                    <FaPaperPlane className="text-2xl" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagePage;
