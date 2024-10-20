import React, { useEffect, useState } from "react"; // Ensure useState is imported
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
  const [activeChatId, setActiveChatId] = useState<string | null>(null); // Declare state variables for activeChatId
  const firestore = getFirestore();

  // Function to fetch user profile from 'users' collection using patientId
  const fetchPatientProfile = async (patientId: string): Promise<UserProfile> => {
    try {
      const userDoc = await getDoc(doc(firestore, "users", patientId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        const name = userData?.username || userData?.displayName || "No Name";
        const profilePicture = userData?.photoURL || "";

        return {
          name,
          profilePicture,
        };
      } else {
        return {
          name: "No Name",
          profilePicture: "",
        };
      }
    } catch (error) {
      console.error(`Error fetching patient profile:`, error);
      return {
        name: "No Name",
        profilePicture: "",
      };
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    const q = query(collection(firestore, "chats"), where("doctorId", "==", currentUser.uid));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chatList: Chat[] = [];

      for (const docSnapshot of snapshot.docs) {
        const chatData = docSnapshot.data() as Chat;

        const patientProfile = await fetchPatientProfile(chatData.patientId);

        chatList.push({
          id: docSnapshot.id,
          doctorId: chatData.doctorId,
          patientId: chatData.patientId,
          lastMessage: chatData.lastMessage,
          unreadMessages: chatData.unreadMessages,
          patientProfile,
        });
      }

      setChats(chatList);
      setLoadingChats(false);
    });

    return () => unsubscribe();
  }, [currentUser, firestore]);

  const handleChatSelect = async (chat: Chat) => {
    setActiveChatId(chat.id); // Track the active chat

    if (currentUser?.uid === chat.doctorId && chat.unreadMessages > 0) {
      try {
        const chatDocRef = doc(firestore, "chats", chat.id);
        await updateDoc(chatDocRef, {
          unreadMessages: 0,
        });
      } catch (error) {
        console.error("Error updating unread messages:", error);
      }
    }
    onSelectChat(chat);
  };

  useEffect(() => {
    if (!currentUser || !currentUser.uid) {
      console.error("currentUser or currentUser.uid is undefined");
      return;
    }
  
    const listenForNewMessages = () => {
      const q = query(collection(firestore, "chats"), where("doctorId", "==", currentUser.uid));
  
      return onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const chatData = change.doc.data() as Chat;
  
          // Check if chatData and chatData.id are valid before proceeding
          if (change.type === "modified" && activeChatId !== chatData.id && chatData.id) {
            const chatDocRef = doc(firestore, "chats", chatData.id);
  
            updateDoc(chatDocRef, {
              unreadMessages: chatData.unreadMessages + 1,
            }).catch((error) => {
              console.error("Error updating unread messages:", error);
            });
          }
        });
      });
    };
  
    const unsubscribe = listenForNewMessages();
  
    return () => unsubscribe();
  }, [currentUser, firestore, activeChatId]);
  
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
              className={`p-4 border-b cursor-pointer flex justify-between items-center hover:bg-gray-50 rounded-lg transition ${
                activeChatId === chat.id ? "bg-gray-100" : ""
              }`}
              onClick={() => handleChatSelect(chat)}
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
