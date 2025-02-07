import { useEffect, useState, useCallback, useRef } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useSocket } from "../../utils/socketContext";
import { useLocation, useNavigate } from "react-router-dom";

const Inbox = () => {
  const [activeTab, setActiveTab] = useState("received");
  const [activeProduct, setActiveProduct] = useState(null);
  const [activeUser, setActiveUser] = useState(null);
  const [conversations, setConversations] = useState({
    received: {},
    sent: {}
  });
  const [newMessage, setNewMessage] = useState("");
  const [expandedProducts, setExpandedProducts] = useState({});
  const [error, setError] = useState(null);
  const socket = useSocket();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();

  // console.log('conversation',conversations);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, []);

  const fetchConversations = useCallback(() => {
    if (!socket) return;
  
    socket.emit('fetchConversations', (response) => {
      if (response.error) {
        setError(response.error);
        return;
      }
      setConversations(response);
      setError(null);
    });
  }, [socket]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const chatId = params.get('chatId');
    
    if (chatId && conversations) {
      ['received', 'sent'].forEach(tab => {
        Object.entries(conversations[tab]).forEach(([productId, data]) => {
          Object.entries(data.users).forEach(([userId, userData]) => {
            if (userData.chatId === chatId) {
              setActiveTab(tab);
              setActiveProduct(productId);
              setActiveUser(userId);
              setExpandedProducts(prev => ({
                ...prev,
                [productId]: true
              }));
            }
          });
        });
      });
    }
  }, [location.search, conversations]);

  useEffect(() => {
    fetchConversations();

    socket?.on('connect', () => {
      fetchConversations();
      if (activeProduct && activeUser) {
        const chatId = conversations[activeTab]?.[activeProduct]?.users?.[activeUser]?.chatId;
        if (chatId) {
          socket.emit('joinRoom', { roomId: chatId });
        }
      }
    });

    socket?.on('connect_error', (error) => {
      setError('Connection error: ' + error.message);
    });

    return () => {
      socket?.off('connect');
      socket?.off('connect_error');
    };
  }, [socket, fetchConversations, activeProduct, activeUser, activeTab, conversations]);

  const updateConversationsWithNewMessage = useCallback((data) => {
    const { chatId, message } = data;
    
    setConversations(prevConversations => {
      const newConversations = JSON.parse(JSON.stringify(prevConversations));
      
      ['received', 'sent'].forEach(tab => {
        Object.entries(newConversations[tab]).forEach(([productId, productData]) => {
          Object.entries(productData.users).forEach(([userId, userData]) => {
            if (userData.chatId === chatId) {
              userData.messages = [
                ...userData.messages,
                {
                  text: message.content,
                  sender: socket?.auth?.userId && message.sender._id === socket.auth.userId ? 'me' : userId,
                  timestamp: new Date(message.createdAt).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })
                }
              ];
            }
          });
        });
      });
  
      return newConversations;
    });
  }, [socket?.auth?.userId]);

  useEffect(() => {
    if (!socket) return;
    
    const handleNewMessage = (data) => {
      updateConversationsWithNewMessage(data);
      scrollToBottom();
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('messageError', (error) => {
      setError(error.message);
    });

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('messageError');
    };
  }, [socket, updateConversationsWithNewMessage, scrollToBottom]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!newMessage.trim() || !activeProduct || !activeUser) return;

    try {
      const chatData = conversations[activeTab]?.[activeProduct]?.users?.[activeUser];
      if (!chatData) throw new Error('Chat data not found');

      const chatId = chatData.chatId;
      
      if (chatId) {
        socket.emit('sendMessage', {
          chatId: chatId,
          message: newMessage
        });
      } else {
        socket.emit('sendInitialMessage', {
          sellerId: activeUser,
          listingId: activeProduct,
          message: newMessage,
          initiator: socket.auth.userId
        });
      }

      setNewMessage("");
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      setError(err.message);
    }
  };

  const selectConversation = (productId, userId) => {
    const chatId = activeTab === 'received'
      ? conversations.received[productId].users[userId].chatId
      : conversations.sent[productId].users[userId].chatId;
    
    setActiveProduct(productId);
    setActiveUser(userId);
    
    // Update URL with chatId
    navigate(`/profile/inbox?chatId=${chatId}`);
    
    if (chatId) {
      socket.emit('joinRoom', {roomId: chatId});
    }
  };

  const toggleProductExpansion = (productId) => {
    setExpandedProducts(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  return (
    <div className="flex h-[600px] bg-gray-100">
      {/* Sidebar */}
      <div className="w-1/3 bg-white shadow-lg p-4">
        {/* Tabs */}
        <div className="flex mb-4">
          <button
            className={`flex-1 py-2 text-center font-semibold transition-colors ${
              activeTab === "received"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            onClick={() => setActiveTab("received")}
          >
            Received
          </button>
          <button
            className={`flex-1 py-2 text-center font-semibold transition-colors ${
              activeTab === "sent"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            onClick={() => setActiveTab("sent")}
          >
            Sent
          </button>
        </div>

        {/* Product and User List */}
        <div className="overflow-y-auto h-[calc(100%-4rem)]">
          {Object.entries(conversations[activeTab]).map(([productId, data]) => (
            <div key={productId} className="mb-4">
              <button
                onClick={() => toggleProductExpansion(productId)}
                className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg mb-2"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={data.productDetails?.image}
                    alt={data.productDetails?.name}
                    className="w-12 h-12 rounded object-cover"
                  />
                  <span className="font-medium">{data.productDetails?.name || productId}</span>
                </div>
                {expandedProducts[productId] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              </button>

              {expandedProducts[productId] && (
                <div className="ml-4 space-y-2">
                  {Object.entries(data.users).map(([userId, userData]) => (
                    <button
                      key={userId}
                      onClick={() => selectConversation(productId, userId)}
                      className={`w-full p-3 rounded-lg transition-colors ${
                        activeProduct === productId && activeUser === userId
                          ? "bg-blue-100"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{userData.name}</span>
                        <span className="text-sm text-gray-500">
                          {userData.messages[userData.messages.length - 1].timestamp}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 text-left truncate">
                        {userData.messages[userData.messages.length - 1].text}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat Content */}
      <div className="flex flex-col flex-1 bg-white shadow-lg">
        {activeProduct && activeUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b">
              <h2 className="font-semibold">
                {conversations[activeTab][activeProduct]?.productDetails?.name} - Chat with{" "}
                {conversations[activeTab][activeProduct]?.users[activeUser]?.name}
              </h2>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3" ref={messagesContainerRef}>
              {conversations[activeTab][activeProduct]?.users[activeUser]?.messages.map((message, index) => (
                <div
                  key={`${message.timestamp}-${index}`}
                  className={`flex flex-col ${
                    message.sender === "me" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`p-3 rounded-lg max-w-xs ${
                      message.sender === "me"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100"
                    }`}
                  >
                    <p>{message.text}</p>
                    <span className="text-xs opacity-75">{message.timestamp}</span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Send
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
};

export default Inbox;