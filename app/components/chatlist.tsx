import React, { useEffect, useState } from "react";
import { getFirestore, collection, query, where, onSnapshot, doc, getDoc, updateDoc } from "firebase/firestore";

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
  const [loadingChats, setLoadingChats] = useState(true);
  const firestore = getFirestore();

  // Function to fetch user profile from 'users' collection using patientId
  const fetchPatientProfile = async (patientId: string): Promise<UserProfile> => {
    try {
      const userDoc = await getDoc(doc(firestore, "users", patientId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Check if 'username', 'displayName', or fallback to "No Name"
        const name = userData?.username || userData?.displayName || "No Name";

        // Use 'photoURL' for profilePicture or fallback to a placeholder
        const profilePicture = userData?.photoURL || "";

        return {
          name,
          profilePicture,
        };
      } else {
        // Return default values if user data does not exist
        return {
          name: "No Name",
          profilePicture: "",
        };
      }
    } catch (error) {
      console.error(`Error fetching patient profile from users collection:`, error);
      return {
        name: "No Name",
        profilePicture: "",
      };
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    // Fetch only the chats where doctorId matches the current user's ID
    const q = query(collection(firestore, "chats"), where("doctorId", "==", currentUser.uid));

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
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-700">Conversations</h2>
      <div className="mt-4 space-y-4">
        {chats.length > 0 ? (
          chats.map((chat) => (
            <div
              key={chat.id}
              className="p-4 border-b cursor-pointer flex justify-between items-center hover:bg-gray-50 rounded-lg transition"
              onClick={() => handleChatSelect(chat)} // Pass the selected chat and handle unread messages
            >
              <div className="flex items-center">
                {chat.patientProfile?.profilePicture ? (
                  <img
                    src={chat.patientProfile.profilePicture}
                    alt="Profile"
                    className="w-10 h-10 rounded-full mr-4 object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full mr-4 bg-gray-300 flex items-center justify-center">
                    <span className="text-lg font-semibold text-white">
                      {chat.patientProfile?.name.charAt(0).toUpperCase() || "N"}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-bold text-gray-800">{chat.patientProfile?.name || "No Name"}</p>
                  <p className="text-sm text-gray-500 truncate w-40">{chat.lastMessage}</p>
                </div>
              </div>
              {chat.unreadMessages > 0 && (
                <span className="text-white bg-red-500 px-2 py-1 rounded-full text-xs font-bold">
                  {chat.unreadMessages} new
                </span>
              )}
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">No conversations found</p>
        )}
      </div>
    </div>
  );
};

export default ChatList;
