import { createContext, useContext, useEffect, useState } from 'react';
import initializeSocket from '../../socketConfig';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initSocket = async () => {
      try {
        const newSocket = initializeSocket();
        
        // Wait for the socket to connect
        newSocket.on('connect', () => {
          console.log('Socket connected successfully');
          setSocket(newSocket);
          setIsInitialized(true);
        });

        newSocket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          setIsInitialized(true); // Still mark as initialized even if there's an error
        });

        // Cleanup on unmount
        return () => {
          if (newSocket) {
            newSocket.disconnect();
            setSocket(null);
            setIsInitialized(false);
          }
        };
      } catch (error) {
        console.error('Error initializing socket:', error);
        setIsInitialized(true); // Mark as initialized even if there's an error
      }
    };

    initSocket();
  }, []);

  // Provide both socket and initialization state
  const value = {
    socket,
    isInitialized
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

// Enhanced custom hook to use socket in any component
export const useSocket = () => {
  const context = useContext(SocketContext);
  
  if (context === null) {
    throw new Error('useSocket must be used within a SocketProvider');
  }

  const { socket, isInitialized } = context;

  if (!isInitialized) {
    return null;
  }

  return socket;
};