import dynamic from 'next/dynamic';

// Dynamic import with SSR disabled
const DoctorMeeting = dynamic(() => import('./doctormeeting'), { ssr: false });

const Agora: React.FC = () => {
  return <DoctorMeeting />;
};

export default Agora;