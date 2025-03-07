import { io } from 'socket.io-client';
import Cookies from 'js-cookie';

const initializeSocket = () => {
    const token = Cookies.get('token');

    if (!token) {
        throw new Error('No authentication token found');
    }
    
    const socket = io( "https://timeless-motors.live", {
        withCredentials: true,
        auth: {
            token
        }
    });

    socket.on('connect', () => {
        console.log("Connected to socket server:", socket.id);
        const user = JSON.parse(Cookies.get('user') || '{}');
        if (user._id) {
            socket.emit('join', { userId: user._id });
        }
    });

    socket.on('statusUpdate', (data) => {
        if (data.action === 'LOGOUT') {
            Cookies.remove('token');
            Cookies.remove('refreshToken');
            Cookies.remove('user');
            alert(data.message || 'You have been logged out by admin');
            socket.disconnect();
            window.location.href = '/login';
        }
    });

    return socket;
};

export default initializeSocket;