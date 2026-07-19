"use client";
import { cn } from "@/lib/utils";
import { CheckCircle, MessageCircle, Minimize2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// Custom SVG Icons with improved accessibility
const WhatsAppIcon = ({ size = 24, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
    fill="currentColor"
    role="img"
    aria-label="WhatsApp"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488" />
  </svg>
);

const MessengerIcon = ({ size = 24, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
    fill="currentColor"
    role="img"
    aria-label="Facebook Messenger"
  >
    <path d="M12 0C5.374 0 0 4.975 0 11.111c0 3.498 1.744 6.705 4.473 8.758V24l4.086-2.24c1.09.301 2.246.464 3.441.464 6.626 0 12-4.974 12-11.111C24 4.975 18.626 0 12 0zm1.193 14.963l-3.056-3.259-5.963 3.259 6.559-6.963 3.13 3.259 5.889-3.259-6.559 6.963z" />
  </svg>
);

type Platform = "whatsapp" | "messenger" | null;

interface Message {
  id: number | Date;
  text: string;
  sender: "user" | "bot";
  timestamp: string;
}

interface UserInfo {
  name: string;
  message: string;
  submitted: boolean;
}

interface BusinessInfo {
  whatsapp: {
    number: string;
    name: string;
    status: string;
  };
  messenger: {
    pageId: string;
    name: string;
    status: string;
  };
}

interface WhatsAppMessengerWidgetProps {
  threshold?: number;
  className?: string;
}

const WhatsAppMessengerWidget = ({
  threshold = 300,
  className,
}: WhatsAppMessengerWidgetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: "",
    message: "",
    submitted: false,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const businessInfo: BusinessInfo = {
    whatsapp: {
      number: "+8801911080825",
      name: "Customer Support",
      status: "Usually replies within minutes",
    },
    messenger: {
      pageId: "https://www.facebook.com/germanbutcherbd",
      name: "Live Chat Support",
      status: "Active now",
    },
  };

  // Scroll visibility logic
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > threshold) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, [threshold]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize welcome message when platform is selected
  useEffect(() => {
    if (selectedPlatform) {
      const welcomeMessage: Message = {
        id: 1,
        text: `Hi! You've selected ${selectedPlatform === "whatsapp" ? "WhatsApp" : "Messenger"}. Please fill out the form below and we'll connect you instantly.`,
        sender: "bot",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages([welcomeMessage]);
    }
  }, [selectedPlatform]);

  const handlePlatformSelect = (platform: Platform) => {
    setSelectedPlatform(platform);
    setIsOpen(true);
    setUnreadCount(0);
  };

  const handleSendToWhatsApp = () => {
    if (!userInfo.name || !userInfo.message) return;

    const message = `Hi, I'm ${userInfo.name}. ${userInfo.message}`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${businessInfo.whatsapp.number.replace("+", "")}?text=${encodedMessage}`;

    window.open(whatsappUrl, "_blank");
    setUserInfo((prev) => ({ ...prev, submitted: true }));

    const confirmMessage: Message = {
      id: Date.now(),
      text: "Redirecting you to WhatsApp... You can continue the conversation there!",
      sender: "bot",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, confirmMessage]);
  };

  const handleSendToMessenger = () => {
    if (!userInfo.name || !userInfo.message) return;

    const messengerUrl = `https://m.me/${businessInfo.messenger.pageId}?text=${encodeURIComponent(`Hi, I'm ${userInfo.name}. ${userInfo.message}`)}`;

    window.open(messengerUrl, "_blank");
    setUserInfo((prev) => ({ ...prev, submitted: true }));

    const confirmMessage: Message = {
      id: Date.now(),
      text: "Redirecting you to Messenger... You can continue the conversation there!",
      sender: "bot",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, confirmMessage]);
  };

  const handleSubmit = () => {
    if (selectedPlatform === "whatsapp") {
      handleSendToWhatsApp();
    } else if (selectedPlatform === "messenger") {
      handleSendToMessenger();
    }
  };

  const handleBack = () => {
    setSelectedPlatform(null);
    setUserInfo({ name: "", message: "", submitted: false });
    setMessages([]);
    setIsOpen(false);
  };

  const quickMessages = [
    "I need help with my order",
    "I have a question about your products",
    "I want to know about pricing",
    "I need technical support",
    "I want to speak to sales team",
  ];

  // Render floating action buttons when chat is not open
  if (!isOpen) {
    return (
      <div
        className={cn("fixed bottom-15 right-4 z-50 md:mb-10 mb-6", className)}
      >
        {/* Container for both buttons */}
        <div
          className={cn(
            "flex flex-col gap-3 transition-all duration-300",
            isVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8 pointer-events-none"
          )}
        >
          {/* WhatsApp Button */}
          <button
            onClick={() => handlePlatformSelect("whatsapp")}
            className="group relative p-3 rounded-full text-white shadow-lg transition-all duration-300 bg-green-500 hover:bg-green-600 hover:scale-110"
            aria-label="Open WhatsApp chat"
          >
            <WhatsAppIcon className="w-6 h-6" />
            {/* Tooltip */}
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
              Chat on WhatsApp
              <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-800"></div>
            </div>
          </button>

          {/* Messenger Button */}
          <button
            onClick={() => handlePlatformSelect("messenger")}
            className="group relative p-3 rounded-full text-white shadow-lg transition-all duration-300 bg-blue-500 hover:bg-blue-600 hover:scale-110"
            aria-label="Open Messenger chat"
          >
            <MessengerIcon className="w-6 h-6" />
            {/* Tooltip */}
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
              Chat on Messenger
              <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-800"></div>
            </div>
          </button>
        </div>

        {/* Unread count badge (shows on WhatsApp button) */}
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
            aria-label={`${unreadCount} unread messages`}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="fixed bottom-2 right-2 z-50 md:mb-0 mb-16">
      <div
        className={`bg-white rounded-lg shadow-xl transition-all duration-300 ${
          isMinimized ? "w-80 h-16" : "w-80 min-h-96"
        }`}
        role="dialog"
        aria-labelledby="chat-widget-title"
        aria-modal="false"
      >
        {/* Header */}
        <div
          className={`text-white p-6 rounded-t-lg flex items-center justify-between ${
            selectedPlatform === "whatsapp"
              ? "bg-green-500"
              : selectedPlatform === "messenger"
                ? "bg-blue-500"
                : "bg-gray-600"
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              {selectedPlatform === "whatsapp" ? (
                <WhatsAppIcon size={20} className="text-white" />
              ) : selectedPlatform === "messenger" ? (
                <MessengerIcon size={20} className="text-white" />
              ) : (
                <MessageCircle className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h3 id="chat-widget-title" className="font-semibold text-base">
                {selectedPlatform === "whatsapp"
                  ? "WhatsApp Chat"
                  : selectedPlatform === "messenger"
                    ? "Messenger Chat"
                    : "Live Chat"}
              </h3>
              {selectedPlatform && (
                <p className="text-xs text-white/80">
                  {selectedPlatform === "whatsapp"
                    ? businessInfo.whatsapp.status
                    : businessInfo.messenger.status}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-white/20 rounded text-white focus:outline-none focus:ring-1 focus:ring-white"
              aria-label={
                isMinimized ? "Expand chat widget" : "Minimize chat widget"
              }
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleBack}
              className="p-1 hover:bg-white/20 rounded text-white focus:outline-none focus:ring-1 focus:ring-white"
              aria-label="Close chat widget"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Chat Form - Direct to selected platform */}
            {selectedPlatform && !userInfo.submitted && (
              <div className="p-6 h-80 overflow-y-auto">
                {/* Messages */}
                <div
                  className="space-y-3 mb-4"
                  role="log"
                  aria-label="Chat messages"
                >
                  {messages.map((message) => (
                    <div
                      key={message.id.toString()}
                      className="flex justify-start"
                    >
                      <div className="bg-gray-100 text-gray-800 px-3 py-2 rounded-sm">
                        <p className="text-sm">{message.text}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {message.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                  }}
                  className="space-y-3"
                >
                  <div>
                    <label htmlFor="user-name" className="sr-only">
                      Your name
                    </label>
                    <input
                      id="user-name"
                      type="text"
                      placeholder="Your name"
                      value={userInfo.name}
                      onChange={(e) =>
                        setUserInfo((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 text-sm border rounded-sm focus:outline-none focus:ring-2 focus:ring-current"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="user-message" className="sr-only">
                      Your message
                    </label>
                    <textarea
                      id="user-message"
                      placeholder="Your message"
                      value={userInfo.message}
                      onChange={(e) =>
                        setUserInfo((prev) => ({
                          ...prev,
                          message: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 text-sm border rounded-sm focus:outline-none focus:ring-2 focus:ring-current h-20 resize-none"
                      required
                    />
                  </div>

                  {/* Quick Messages */}
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-2">
                      Quick messages:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {quickMessages.map((msg, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() =>
                            setUserInfo((prev) => ({ ...prev, message: msg }))
                          }
                          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded focus:outline-none focus:ring-1 focus:ring-gray-500"
                        >
                          {msg}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!userInfo.name || !userInfo.message}
                    className={`w-full py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 my-4 text-sm font-medium focus:outline-none focus:ring-2 ${
                      userInfo.name && userInfo.message
                        ? selectedPlatform === "whatsapp"
                          ? "bg-green-500 hover:bg-green-600 text-white focus:ring-green-500"
                          : "bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed focus:ring-gray-300"
                    }`}
                  >
                    {selectedPlatform === "whatsapp" ? (
                      <WhatsAppIcon size={16} className="text-white" />
                    ) : (
                      <MessengerIcon size={16} className="text-white" />
                    )}
                    <span>
                      Send to{" "}
                      {selectedPlatform === "whatsapp"
                        ? "WhatsApp"
                        : "Messenger"}
                    </span>
                  </button>
                </form>
              </div>
            )}

            {/* Success Message */}
            {userInfo.submitted && (
              <div className="p-6 h-80 flex flex-col justify-center items-center text-center">
                <CheckCircle
                  className="w-12 h-12 text-green-500 mb-4"
                  aria-hidden="true"
                />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Message Sent!
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Continue in{" "}
                  {selectedPlatform === "whatsapp" ? "WhatsApp" : "Messenger"}
                </p>
                <button
                  onClick={handleBack}
                  className="text-green-500 hover:text-green-600 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 rounded px-3 py-1"
                  aria-label="Start a new conversation"
                >
                  New conversation
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default WhatsAppMessengerWidget;
