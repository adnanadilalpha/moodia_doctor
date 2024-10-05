import React, { Suspense } from "react";
import DoctorMeeting from "../components/meeting";

export default function MeetingPage() {
  return (
    <Suspense fallback={<div>Loading meeting page...</div>}>
      <DoctorMeeting />
    </Suspense>
  );
}
