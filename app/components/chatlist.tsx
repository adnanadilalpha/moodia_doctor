import React, { useEffect, useState } from "react";
import { getFirestore, collection, query, onSnapshot, doc, getDoc, updateDoc } from "firebase/firestore";

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
  patientProfile?: UserProfile; // Profile of the patient
}

interface ChatListProps {
  currentUser: any;
  onSelectChat: (chat: Chat) => void;
}

const ChatList: React.FC<ChatListProps> = ({ currentUser, onSelectChat }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const firestore = getFirestore();
  const [loadingChats, setLoadingChats] = useState(true);

  // Function to fetch user profile from 'users' collection using patientId
  const fetchPatientProfile = async (patientId: string): Promise<UserProfile> => {
    try {
      const userDoc = await getDoc(doc(firestore, "users", patientId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          name: userData?.displayName || "No Name", // Use 'displayName' from Firestore, or default to "No Name"
          profilePicture: userData?.photoURL || "/default-avatar.png", // Use 'photoURL', or a placeholder
        };
      } else {
        // Return default values if user data does not exist
        return {
          name: "No Name",
          profilePicture: "/default-avatar.png",
        };
      }
    } catch (error) {
      console.error(`Error fetching patient profile from users collection:`, error);
      // Return default values in case of an error
      return {
        name: "No Name",
        profilePicture: "/default-avatar.png",
      };
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    const q = query(collection(firestore, "chats"));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chatList: Chat[] = [];

      for (const docSnapshot of snapshot.docs) {
        const chatData = docSnapshot.data() as Chat;

        // Fetch the patient profile from 'users' collection using the patientId
        const patientProfile = await fetchPatientProfile(chatData.patientId);

        chatList.push({
          id: docSnapshot.id,
          doctorId: chatData.doctorId, // Keeping doctorId for potential future use
          patientId: chatData.patientId,
          lastMessage: chatData.lastMessage,
          unreadMessages: chatData.unreadMessages,
          patientProfile, // Only using patient profile
        });
      }

      setChats(chatList);
      setLoadingChats(false);
    });

    return () => unsubscribe();
  }, [currentUser, firestore]);

  const handleChatSelect = async (chat: Chat) => {
    if (currentUser?.email?.includes("doctor") && chat.unreadMessages > 0) {
      // If the user is a doctor and the chat has unread messages, update unread messages to zero
      try {
        const chatDocRef = doc(firestore, "chats", chat.id);
        await updateDoc(chatDocRef, {
          unreadMessages: 0,
        });
      } catch (error) {
        console.error("Error updating unread messages:", error);
      }
    }
    // Call onSelectChat to open the selected chat
    onSelectChat(chat);
  };

  if (loadingChats) {
    return <div>Loading chats...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold">Conversations</h2>
      <div className="mt-4">
        {chats.length > 0 ? (
          chats.map((chat) => (
            <div
              key={chat.id}
              className="p-2 border-b cursor-pointer flex justify-between"
              onClick={() => handleChatSelect(chat)} // Pass the selected chat and handle unread messages
            >
              <div className="flex items-center">
                {chat.patientProfile?.profilePicture ? (
                  <img
                    src={chat.patientProfile.profilePicture}
                    alt="Profile"
                    className="w-8 h-8 rounded-full mr-3"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full mr-3 bg-gray-300 flex items-center justify-center">
                    <span className="text-lg text-white">
                      {chat.patientProfile?.name.charAt(0).toUpperCase() || "N"}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-semibold">{chat.patientProfile?.name || "No Name"}</p>
                  <p className="text-sm text-gray-500">{chat.lastMessage}</p>
                </div>
              </div>
              {chat.unreadMessages > 0 && (
                <span className="text-red-500 text-xs font-bold">{chat.unreadMessages} new</span>
              )}
            </div>
          ))
        ) : (
          <p>No conversations found</p>
        )}
      </div>
    </div>
  );
};

export default ChatList;