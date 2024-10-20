interface EmailOptions {
  to: string;
  subject: string;
  body: string;
}

export const sendEmailNotification = async ({ to, subject, body }: EmailOptions): Promise<void> => {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, subject, body }),
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }

    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email notification:', error);
    throw new Error('Failed to send email notification');
  }
};
