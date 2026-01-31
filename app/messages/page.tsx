"use client";

import { useState } from "react";
import { 
  Search,
  MoreVertical,
  Send,
  Paperclip,
  Smile,
  Phone,
  Video,
  Info,
  Image as ImageIcon
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { Avatar } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";
import { Input } from "../components/ui/Input";

type Conversation = {
  id: number;
  user: {
    name: string;
    avatar: string;
    isOnline: boolean;
  };
  lastMessage: string;
  timestamp: string;
  unread: number;
};

type Message = {
  id: number;
  senderId: number;
  text: string;
  timestamp: string;
  isRead: boolean;
};

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(1);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const handleSendMessage = () => {
    if (messageText.trim()) {
      console.log("Sending message:", messageText);
      setMessageText("");
    }
  };

  const currentConversation = CONVERSATIONS.find(c => c.id === selectedConversation);
  const currentMessages = selectedConversation ? MESSAGES[selectedConversation] || [] : [];

  return (
    <div className="h-[calc(100vh-65px)] bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <div className="flex h-full">
        <Sidebar />

        <main className="flex-1 flex">
          {/* CONVERSATIONS LIST */}
          <div className="w-80 border-r border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
              <h2 className="text-xl font-bold mb-3">Mesajlar</h2>
              <Input
                placeholder="Mesajlarda ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search size={18} />}
              />
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {CONVERSATIONS.filter(conv => 
                conv.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation.id)}
                  className={`w-full p-4 flex items-start gap-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-smooth border-b border-neutral-100 dark:border-neutral-800 ${
                    selectedConversation === conversation.id
                      ? "bg-blue-50 dark:bg-blue-950/20 border-l-4 border-l-blue-500"
                      : ""
                  }`}
                >
                  <div className="relative">
                    <Avatar
                      src={conversation.user.avatar}
                      fallback={conversation.user.name}
                      size="md"
                    />
                    {conversation.user.isOnline && (
                      <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white dark:border-neutral-900" />
                    )}
                  </div>

                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-sm truncate">
                        {conversation.user.name}
                      </p>
                      <span className="text-xs text-neutral-500 flex-shrink-0 ml-2">
                        {conversation.timestamp}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
                        {conversation.lastMessage}
                      </p>
                      {conversation.unread > 0 && (
                        <Badge variant="primary" size="sm" className="h-5 w-5 p-0 flex items-center justify-center text-xs ml-2">
                          {conversation.unread}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* CHAT AREA */}
          {selectedConversation && currentConversation ? (
            <div className="flex-1 flex flex-col bg-white dark:bg-neutral-950">
              {/* Chat Header */}
              <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between glass">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={currentConversation.user.avatar}
                    fallback={currentConversation.user.name}
                    size="md"
                    status={currentConversation.user.isOnline ? "online" : "offline"}
                  />
                  <div>
                    <h3 className="font-bold">{currentConversation.user.name}</h3>
                    <p className="text-xs text-neutral-500">
                      {currentConversation.user.isOnline ? "Çevrimiçi" : "Çevrimdışı"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Phone size={20} />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Video size={20} />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Info size={20} />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreVertical size={20} />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {currentMessages.map((message) => {
                  const isSent = message.senderId === 0; // 0 = current user
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isSent ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`flex gap-2 max-w-[70%] ${isSent ? "flex-row-reverse" : "flex-row"}`}>
                        {!isSent && (
                          <Avatar
                            src={currentConversation.user.avatar}
                            fallback={currentConversation.user.name}
                            size="sm"
                          />
                        )}
                        <div>
                          <div
                            className={`rounded-2xl px-4 py-2 ${
                              isSent
                                ? "bg-blue-500 text-white"
                                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                            }`}
                          >
                            <p className="text-sm">{message.text}</p>
                          </div>
                          <div className={`flex items-center gap-2 mt-1 ${isSent ? "justify-end" : "justify-start"}`}>
                            <span className="text-xs text-neutral-500">{message.timestamp}</span>
                            {isSent && message.isRead && (
                              <span className="text-xs text-blue-500">✓✓</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 glass">
                <div className="flex items-end gap-3">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon">
                      <Paperclip size={20} />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <ImageIcon size={20} />
                    </Button>
                  </div>

                  <div className="flex-1">
                    <textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Mesajınızı yazın..."
                      className="w-full resize-none rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-32"
                      rows={1}
                    />
                  </div>

                  <Button variant="ghost" size="icon">
                    <Smile size={20} />
                  </Button>

                  <Button
                    variant="primary"
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()}
                    className="h-12 w-12"
                  >
                    <Send size={20} />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-white dark:bg-neutral-950">
              <div className="text-center">
                <div className="h-24 w-24 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
                  <Send size={40} className="text-neutral-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">Mesajlarınız</h3>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Bir sohbet seçin veya yeni bir konuşma başlatın
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// MOCK DATA
const CONVERSATIONS: Conversation[] = [
  {
    id: 1,
    user: {
      name: "Zeynep Kaya",
      avatar: "/avatars/zeynep.jpg",
      isOnline: true
    },
    lastMessage: "Yarınki etkinlik için hazır mısın?",
    timestamp: "2 dk",
    unread: 2
  },
  {
    id: 2,
    user: {
      name: "Mehmet Şahin",
      avatar: "/avatars/mehmet.jpg",
      isOnline: false
    },
    lastMessage: "Teşekkürler, çok yardımcı oldun!",
    timestamp: "1 saat",
    unread: 0
  },
  {
    id: 3,
    user: {
      name: "Elif Demir",
      avatar: "/avatars/elif.jpg",
      isOnline: true
    },
    lastMessage: "Toplantı iptal oldu mu?",
    timestamp: "3 saat",
    unread: 1
  },
  {
    id: 4,
    user: {
      name: "Can Özdemir",
      avatar: "/avatars/can.jpg",
      isOnline: false
    },
    lastMessage: "Görüşürüz, iyi günler!",
    timestamp: "Dün",
    unread: 0
  }
];

const MESSAGES: Record<number, Message[]> = {
  1: [
    {
      id: 1,
      senderId: 1,
      text: "Merhaba! NYC'deki etkinliğe katılacak mısın?",
      timestamp: "14:30",
      isRead: true
    },
    {
      id: 2,
      senderId: 0,
      text: "Evet kesinlikle! Çok heyecanlıyım 🎉",
      timestamp: "14:32",
      isRead: true
    },
    {
      id: 3,
      senderId: 1,
      text: "Harika! Yanında birini getirmek ister misin?",
      timestamp: "14:35",
      isRead: true
    },
    {
      id: 4,
      senderId: 0,
      text: "Evet, bir arkadaşımı da getireceğim",
      timestamp: "14:40",
      isRead: true
    },
    {
      id: 5,
      senderId: 1,
      text: "Yarınki etkinlik için hazır mısın?",
      timestamp: "Az önce",
      isRead: false
    }
  ],
  2: [
    {
      id: 1,
      senderId: 2,
      text: "İş ilanı paylaşımın için teşekkürler!",
      timestamp: "10:15",
      isRead: true
    },
    {
      id: 2,
      senderId: 0,
      text: "Rica ederim, umarım işe yarar 😊",
      timestamp: "10:20",
      isRead: true
    }
  ]
};
