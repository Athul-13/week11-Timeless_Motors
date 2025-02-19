import { useEffect, useState, useCallback, useRef } from "react";
import { ChevronDown, ChevronRight, MessageSquare, Smile } from "lucide-react";
import { useSocket } from "../../utils/socketContext";
import { useLocation, useNavigate } from "react-router-dom";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";

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
  const [showPicker, setShowPicker] = useState(false);
  const socket = useSocket();
  // const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();

  // console.log('conversation',conversations);

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth", // Enables smooth scrolling
      });
    }
  }, []);


  useEffect(() => {
    if (activeUser && activeProduct) {
      setTimeout(scrollToBottom, 100);
    }
  }, [activeUser, activeProduct, scrollToBottom]);

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
              if (productId === activeProduct && userId === activeUser) {
                setTimeout(scrollToBottom, 100);
              }
            }
          });
        });
      });
  
      return newConversations;
    });
  }, [socket?.auth?.userId, activeProduct, activeUser, scrollToBottom]);

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

    // Handle emoji selection
    const handleEmojiSelect = (emoji) => {
      setNewMessage((prev) => prev + emoji.native); // Append emoji to message
      // setShowPicker(false); 
      inputRef.current.focus(); // Focus back to input
    };

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
    navigate('/profile/inbox');

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
        if (showPicker) {
          setShowPicker(false); // Close emoji picker if it's open
        } else {
          unselectConversation(); 
        }
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
    navigate(`/profile/inbox?chatId=${chatId}`);
    
    if (chatId) {
      socket.emit('joinRoom', {roomId: chatId});
    }
    setTimeout(scrollToBottom, 100);
  };

    useEffect(() => {
    const messagesContainer = messagesContainerRef.current;
    if (!messagesContainer) return;

    const observer = new MutationObserver(scrollToBottom);
    
    observer.observe(messagesContainer, {
      childList: true,
      subtree: true
    });

    return () => observer.disconnect();
  }, [scrollToBottom]);

  const toggleProductExpansion = (productId) => {
    setExpandedProducts(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-10">
      <div className="bg-gray-200 rounded-xl p-6">
        <h1 className="text-2xl font-medium text-gray-900 mb-6">Your Messages</h1>
        <div className="flex h-[600px] bg-white rounded-xl overflow-hidden shadow-lg">
          {/* Sidebar */}
          <div className="w-1/3 border-r border-gray-200">
            {/* Tabs */}
            <div className="flex p-4 gap-2">
              <button
                className={`flex-1 py-2 px-4 rounded-lg text-center font-medium transition-colors ${
                  activeTab === "received"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => setActiveTab("received")}
              >
                Received
              </button>
              <button
                className={`flex-1 py-2 px-4 rounded-lg text-center font-medium transition-colors ${
                  activeTab === "sent"
                    ? "bg-blue-500 text-white"
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
                <div key={productId} className="bg-white rounded-xl overflow-hidden shadow-sm">
                  <button
                    onClick={() => toggleProductExpansion(productId)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={data.productDetails?.image}
                        alt={data.productDetails?.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="text-left">
                        <span className="font-medium text-gray-900">{data.productDetails?.name || productId}</span>
                        <p className="text-sm text-gray-500 mt-1">
                          {Object.keys(data.users).length} conversation{Object.keys(data.users).length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    {expandedProducts[productId] ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
                  </button>

                  {expandedProducts[productId] && (
                    <div className="border-t border-gray-100">
                      {Object.entries(data.users).map(([userId, userData]) => (
                        <button
                          key={userId}
                          onClick={() => selectConversation(productId, userId)}
                          className={`w-full p-4 transition-colors ${
                            activeProduct === productId && activeUser === userId
                              ? "bg-blue-50"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-900">{userData.name}</span>
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
          <div className="flex flex-col flex-1">
            {activeProduct && activeUser ? (
              <>
                {/* Chat Header */}
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-medium text-gray-900">
                    {conversations[activeTab][activeProduct]?.productDetails?.name}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Chat with {conversations[activeTab][activeProduct]?.users[activeUser]?.name}
                  </p>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4"
                 ref={messagesContainerRef}
                >
                  {conversations[activeTab][activeProduct]?.users[activeUser]?.messages.map((message, index) => (
                    <div
                      key={`${message.timestamp}-${index}`}
                      className={`flex flex-col ${
                        message.sender === "me" ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`p-4 rounded-xl max-w-md ${
                          message.sender === "me"
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <p>{message.text}</p>
                        <span className="text-xs mt-2 block opacity-75">{message.timestamp}</span>
                      </div>
                    </div>
                  ))}
                  {/* <div ref={messagesEndRef} /> */}
                </div>

                {/* Input Area */}
                <form onSubmit={handleSendMessage} className="p-6 border-t border-gray-200">
                  <div className="flex gap-3">
                    {/* Emoji Picker */}
                    
                      <button
                        type="button"
                        className="p-2 text-gray-500 hover:text-gray-700"
                        onClick={() => setShowPicker((prev) => !prev)}
                      >
                        <Smile size={20} />
                      </button>
                      {showPicker && (
                        <div className="absolute bottom-12 left-0 z-10">
                          <Picker data={data} onEmojiSelect={handleEmojiSelect} />
                        </div>
                      )}
                    
                      
                    <input
                      type="text"
                      ref={inputRef}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="submit"
                      className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
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
                <h3 className="text-xl font-medium text-gray-900">No conversation selected</h3>
                <p className="text-gray-500 mt-2">Choose a conversation from the sidebar to start messaging</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inbox;