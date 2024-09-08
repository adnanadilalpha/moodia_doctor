// types.ts

export interface UserProfile {
    userName: String;
    name: string;
    profilePicture: string;
  }
  
  export interface Chat {
    id: string;
    doctorId: string;
    patientId: string;
    lastMessage: string;
    unreadMessages: number;
    doctorProfile?: UserProfile;
    patientProfile?: UserProfile;
  }