import React, { useState } from 'react';

const HelpSupport = () => {
  const [loading, setLoading] = useState(false); // To handle loading state
  const [message, setMessage] = useState('');   // To handle response message

  const handleOpenTicket = async () => {
    setLoading(true);
    setMessage('');
  
    try {
      const response = await fetch('/api/ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: 'Support Ticket',
          description: 'Need assistance with an issue',
        }),
      });
  
      if (response.ok) {
        setMessage('Support ticket submitted successfully!');
      } else {
        throw new Error('Error submitting ticket');
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('Failed to submit the support ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="p-4">
      <p>If you need assistance, you can:</p>
      <ul className="list-disc pl-4 mb-4">
        <li>
          Visit our <a href="/help-center" className="text-blue-500 underline">Help Center</a>
        </li>
        <li>Use our Live Chat</li>
        <li>Submit a Support Ticket</li>
      </ul>
      <button 
        onClick={handleOpenTicket} 
        className={`px-6 py-2 text-white rounded-lg ${loading ? 'bg-gray-500' : 'bg-blue-500 hover:bg-blue-600'}`}
        disabled={loading} // Disable the button when loading
      >
        {loading ? 'Submitting...' : 'Submit a Ticket'}
      </button>
      {message && <p className="mt-4 text-green-600">{message}</p>}
    </div>
  );
};

export default HelpSupport;
