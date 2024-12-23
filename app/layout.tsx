import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ["latin"] });


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
