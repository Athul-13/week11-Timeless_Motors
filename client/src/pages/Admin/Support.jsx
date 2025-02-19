import { useEffect, useState, useCallback, useRef } from "react";
import { ChevronDown, ChevronRight, MessageSquare } from "lucide-react";
import { useSocket } from "../../utils/socketContext";
import { useLocation, useNavigate } from "react-router-dom";

const Messages = () => {
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

  const unselectConversation = useCallback(() => {
    setActiveProduct(null);
    setActiveUser(null);
    navigate('/admin/support');

    if (socket && activeProduct && activeUser) {
      let chatId = null;
      
      // Check both received and sent conversations
      if (conversations.received?.[activeProduct]?.users?.[activeUser]) {
        chatId = conversations.received[activeProduct].users[activeUser].chatId;
      } else if (conversations.sent?.[activeProduct]?.users?.[activeUser]) {
        chatId = conversations.sent[activeProduct].users[activeUser].chatId;
      }

      if (chatId) {
        console.log(`Leaving room: ${chatId}`);
        socket.emit('leaveRoom', { roomId: chatId });
      }
    }
  }, [socket, activeProduct, activeUser, conversations, navigate]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        unselectConversation();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [unselectConversation]); 

  const selectConversation = (productId, userId) => {
    const chatId = activeTab === 'received'
      ? conversations.received[productId].users[userId].chatId
      : conversations.sent[productId].users[userId].chatId;
    
    setActiveProduct(productId);
    setActiveUser(userId);
    
    // Update URL with chatId
    navigate(`/admin/support?chatId=${chatId}`);
    
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
    // <div className="bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-3xl font-bold text-gray-800">Messages</h2>
          </div>
          
          <div className="flex h-[600px]">
            {/* Sidebar */}
            <div className="w-1/3 border-r border-gray-200 bg-white">
              {/* Tabs */}
              <div className="flex p-4 gap-2">
                <button
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 ${
                    activeTab === "received"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => setActiveTab("received")}
                >
                  Received
                </button>
                <button
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 ${
                    activeTab === "sent"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => setActiveTab("sent")}
                >
                  Sent
                </button>
              </div>

              {/* Product and User List */}
              <div className="overflow-y-auto h-[calc(100%-4rem)] p-4 space-y-4">
                {Object.entries(conversations[activeTab]).map(([productId, data]) => (
                  <div key={productId} className="bg-white shadow-lg rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleProductExpansion(productId)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-all duration-300"
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={data.productDetails?.image}
                          alt={data.productDetails?.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="text-left">
                          <span className="font-bold text-gray-900">{data.productDetails?.name || productId}</span>
                          <p className="text-sm text-gray-500 mt-1">
                            {Object.keys(data.users).length} conversation{Object.keys(data.users).length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      {expandedProducts[productId] ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
                    </button>

                    {expandedProducts[productId] && (
                      <div className="border-t border-gray-200">
                        {Object.entries(data.users).map(([userId, userData]) => (
                          <button
                            key={userId}
                            onClick={() => selectConversation(productId, userId)}
                            className={`w-full p-4 transition-all duration-300 ${
                              activeProduct === productId && activeUser === userId
                                ? "bg-blue-50"
                                : "hover:bg-gray-50"
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-gray-900">{userData.name}</span>
                              <span className="text-sm text-gray-500">
                                {userData.messages[userData.messages.length - 1].timestamp}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 text-left truncate mt-1">
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
            <div className="flex flex-col flex-1 bg-gray-50">
              {activeProduct && activeUser ? (
                <>
                  {/* Chat Header */}
                  <div className="p-6 bg-white border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800">
                      {conversations[activeTab][activeProduct]?.productDetails?.name}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Chat with {conversations[activeTab][activeProduct]?.users[activeUser]?.name}
                    </p>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4" ref={messagesContainerRef}>
                    {conversations[activeTab][activeProduct]?.users[activeUser]?.messages.map((message, index) => (
                      <div
                        key={`${message.timestamp}-${index}`}
                        className={`flex flex-col ${
                          message.sender === "me" ? "items-end" : "items-start"
                        }`}
                      >
                        <div
                          className={`p-4 rounded-lg shadow-sm max-w-md ${
                            message.sender === "me"
                              ? "bg-blue-600 text-white"
                              : "bg-white text-gray-900"
                          }`}
                        >
                          <p>{message.text}</p>
                          <span className="text-xs mt-2 block opacity-75">{message.timestamp}</span>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Area */}
                  <form onSubmit={handleSendMessage} className="p-6 bg-white border-t border-gray-200">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                      <button
                        type="submit"
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-300 transform hover:scale-105"
                      >
                        Send
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <MessageSquare className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">No conversation selected</h3>
                  <p className="text-gray-500 mt-2">Choose a conversation from the sidebar to start messaging</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    // </div>
  );
};


const Support = () => {
    return (
        <>
            < Messages />
        </>
    )
}

export default Support;