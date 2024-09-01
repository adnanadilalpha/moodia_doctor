import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventInput } from '@fullcalendar/core';

type Appointment = {
  title: string;
  start: Date;
  end?: Date;
  extendedProps: {
    mode: 'Online' | 'In-person';
    time: string;
    paymentStatus: 'Paid' | 'Not Paid';
  };
};

const initialAppointments: EventInput[] = [
  {
    title: 'John Doe - Online',
    start: new Date(2024, 8, 24, 10, 0), // Month is 0-indexed (August is 8)
    extendedProps: {
      mode: 'Online',
      time: '10:00 AM',
      paymentStatus: 'Paid',
    },
  },
  {
    title: 'Jane Smith - In-person',
    start: new Date(2024, 8, 24, 13, 0),
    extendedProps: {
      mode: 'In-person',
      time: '1:00 PM',
      paymentStatus: 'Not Paid',
    },
  },
  {
    title: 'Alice Johnson - Online',
    start: new Date(2024, 8, 25, 11, 30),
    extendedProps: {
      mode: 'Online',
      time: '11:30 AM',
      paymentStatus: 'Paid',
    },
  },
];

const CalendarCard: React.FC = () => {
  const [currentEvents] = useState<EventInput[]>(initialAppointments);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventInput | null>(null);

  const handleEventClick = (clickInfo: any) => {
    setSelectedEvent(clickInfo.event);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedEvent(null);
  };

  const renderEventContent = (eventInfo: any) => {
    return (
      <div className="flex flex-col text-xs md:text-sm">
        <strong>{eventInfo.timeText}</strong>
        <span>{eventInfo.event.title}</span>
      </div>
    );
  };

  const formatDate = (date: any) => {
    if (typeof date === 'number') {
      date = new Date(date);
    } else if (typeof date === 'string') {
      date = new Date(date);
    }
    return date instanceof Date && !isNaN(date.getTime()) ? date.toLocaleDateString() : '';
  };

  return (
    <div className="bg-white p-2 sm:p-4 md:p-6 rounded-lg shadow-md lg:col-span-3">
      <h2 className="text-md sm:text-lg md:text-xl font-semibold text-gray-700 mb-2 sm:mb-4">List of Appointments</h2>
      <div className="bg-gray-50 rounded-lg p-2 sm:p-4">
        <div className="w-full text-xs sm:text-sm">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={currentEvents}
            eventClick={handleEventClick} // Handle clicking on an event
            eventContent={renderEventContent} // Custom rendering for events
            height="auto"
            eventDisplay="block"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth',
            }}
            contentHeight="auto"
            aspectRatio={1.5} // More square aspect ratio for better fit on mobile
          />
        </div>
      </div>

      {/* Modal for displaying appointment details */}
      {modalIsOpen && selectedEvent && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4 sm:p-6 lg:p-8">
          <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-lg shadow-lg max-w-xs sm:max-w-lg lg:max-w-xl mx-auto">
            <h2 className="text-md sm:text-lg md:text-2xl font-bold mb-4">{selectedEvent.title}</h2>
            <p className="text-xs sm:text-sm md:text-base">
              <strong>Date:</strong> {formatDate(selectedEvent.start)}
            </p>
            <p className="text-xs sm:text-sm md:text-base">
              <strong>Time:</strong> {selectedEvent.extendedProps?.time}
            </p>
            <p className="text-xs sm:text-sm md:text-base">
              <strong>Mode:</strong> {selectedEvent.extendedProps?.mode}
            </p>
            <p className="text-xs sm:text-sm md:text-base">
              <strong>Payment Status:</strong> {selectedEvent.extendedProps?.paymentStatus}
            </p>
            <button
              onClick={closeModal}
              className="mt-4 px-4 py-2 bg-black text-white rounded hover:bg-green-500 w-full text-sm sm:text-base"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarCard;