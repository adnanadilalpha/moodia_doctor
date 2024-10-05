"use client";

import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { FaPhoneSlash } from "react-icons/fa";
import { useRouter } from "next/navigation";

const DoctorMeeting: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);

  // Get the 'url' query parameter and decode it
  const meetingUrl = decodeURIComponent(searchParams.get("url") || "");

  useEffect(() => {
    if (!meetingUrl) {
      alert("Meeting URL is missing");
      router.back(); // Redirect back if there's no meeting URL
    }
  }, [meetingUrl, router]);

  const handleEndMeeting = () => {
    // End meeting and navigate back to the previous page or a specific route
    router.back();
  };

  return (
    <div className="flex flex-col items-center h-screen">
      {/* Embed the decoded Daily.co meeting URL using iframe */}
      {meetingUrl ? (
        <iframe
          src={meetingUrl}
          allow="camera; microphone; fullscreen; speaker; display-capture"
          className="w-full h-full"
          onLoad={() => setLoading(false)}
          title="Daily.co Video Call"
        ></iframe>
      ) : (
        <p>Invalid meeting URL.</p>
      )}

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <p className="text-white">Loading meeting...</p>
        </div>
      )}

      <div className="flex justify-center mt-4 fixed bottom-4">
        <button
          onClick={handleEndMeeting}
          className="p-2 rounded-full bg-red-500 text-white"
        >
          <FaPhoneSlash className="text-xl" />
        </button>
      </div>
    </div>
  );
};

export default DoctorMeeting;
