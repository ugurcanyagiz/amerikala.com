"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  Search,
  MoreVertical,
  Send,
  Paperclip,
  Smile,
  Phone,
  Video,
  Info,
  Image as ImageIcon,

  Users,
  UserPlus,
  MessageSquarePlus,
  CheckCheck,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import { Button } from "../components/ui/Button";
import { Avatar } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";

type Person = {
  id: number;
  name: string;
  avatar: string;
  isOnline: boolean;
};

type ConversationType = "direct" | "group";
type InboxFilter = "all" | "unread" | "groups";

type Conversation = {
  id: number;
  type: ConversationType;
  title: string;
  avatar: string;
  isOnline?: boolean;
  participantIds: number[];
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

const CURRENT_USER_ID = 0;

const PEOPLE: Person[] = [
  { id: 1, name: "Zeynep Kaya", avatar: "/avatars/zeynep.jpg", isOnline: true },
  { id: 2, name: "Mehmet Şahin", avatar: "/avatars/mehmet.jpg", isOnline: false },
  { id: 3, name: "Elif Demir", avatar: "/avatars/elif.jpg", isOnline: true },
  { id: 4, name: "Can Özdemir", avatar: "/avatars/can.jpg", isOnline: false },
  { id: 5, name: "Aylin Er", avatar: "/avatars/aylin.jpg", isOnline: true },
  { id: 6, name: "Burak T", avatar: "/avatars/burak.jpg", isOnline: false },
];

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 1,
    type: "direct",
    title: "Zeynep Kaya",
    avatar: "/avatars/zeynep.jpg",
    isOnline: true,
    participantIds: [1],
    lastMessage: "Yarınki etkinlik için hazır mısın?",
    timestamp: "2 dk",
    unread: 2,
  },
  {
    id: 2,
    type: "direct",
    title: "Mehmet Şahin",
    avatar: "/avatars/mehmet.jpg",
    isOnline: false,
    participantIds: [2],
    lastMessage: "Teşekkürler, çok yardımcı oldun!",
    timestamp: "1 sa",
    unread: 0,
  },
  {
    id: 3,
    type: "group",
    title: "NYC Networking Crew",
    avatar: "N",
    participantIds: [1, 3, 5],
    lastMessage: "Elif: Toplantı linkini gruba attım.",
    timestamp: "15 dk",
    unread: 4,
  },
  {
    id: 4,
    type: "group",
    title: "Ev Arkadaşı Adayları",
    avatar: "E",
    participantIds: [4, 6],
    lastMessage: "Can: Yarın 18:00 uygun mu?",
    timestamp: "Dün",
    unread: 0,
  },
];

const INITIAL_MESSAGES: Record<number, Message[]> = {
  1: [
    { id: 1, senderId: 1, text: "Merhaba! NYC'deki etkinliğe katılacak mısın?", timestamp: "14:30", isRead: true },
    { id: 2, senderId: CURRENT_USER_ID, text: "Evet kesinlikle! Çok heyecanlıyım 🎉", timestamp: "14:32", isRead: true },
    { id: 3, senderId: 1, text: "Harika! Yanında birini getirmek ister misin?", timestamp: "14:35", isRead: true },
    { id: 4, senderId: CURRENT_USER_ID, text: "Evet, bir arkadaşımı da getireceğim", timestamp: "14:40", isRead: true },
    { id: 5, senderId: 1, text: "Yarınki etkinlik için hazır mısın?", timestamp: "Az önce", isRead: false },
  ],
  2: [
    { id: 1, senderId: 2, text: "İş ilanı paylaşımın için teşekkürler!", timestamp: "10:15", isRead: true },
    { id: 2, senderId: CURRENT_USER_ID, text: "Rica ederim, umarım işe yarar 😊", timestamp: "10:20", isRead: true },
  ],
  3: [
    { id: 1, senderId: 3, text: "Herkes yarınki buluşma için hazır mı?", timestamp: "12:10", isRead: true },
    { id: 2, senderId: 1, text: "Ben hazırım 🙌", timestamp: "12:11", isRead: true },
    { id: 3, senderId: CURRENT_USER_ID, text: "Ben de oradayım.", timestamp: "12:14", isRead: true },
    { id: 4, senderId: 3, text: "Toplantı linkini gruba attım.", timestamp: "12:15", isRead: false },
  ],
};

const formatNow = () =>
  new Date().toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });

export default function MessagesPage() {
  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);
  const [messages, setMessages] = useState<Record<number, Message[]>>(INITIAL_MESSAGES);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(INITIAL_CONVERSATIONS[0].id);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [inboxFilter, setInboxFilter] = useState<InboxFilter>("all");
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);

  const selectedConversation = conversations.find((item) => item.id === selectedConversationId) ?? null;
  const selectedMessages = selectedConversationId ? messages[selectedConversationId] || [] : [];

  const filteredConversations = useMemo(() => {
    return conversations.filter((conversation) => {
      const matchesSearch =
        conversation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conversation.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) {
        return false;
      }

      if (inboxFilter === "unread") {
        return conversation.unread > 0;
      }

      if (inboxFilter === "groups") {
        return conversation.type === "group";
      }

      return true;
    });
  }, [conversations, searchQuery, inboxFilter]);

  const onlineCount = conversations.filter((item) => item.isOnline).length;

  const markAsRead = (conversationId: number) => {
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              unread: 0,
            }
          : conversation
      )
    );
  };

  const handleSelectConversation = (conversationId: number) => {
    setSelectedConversationId(conversationId);
    markAsRead(conversationId);
  };

  const handleSendMessage = (event?: FormEvent) => {
    event?.preventDefault();
    if (!messageText.trim() || !selectedConversationId) {
      return;
    }

    const currentId = selectedConversationId;
    const newMessage: Message = {
      id: Date.now(),
      senderId: CURRENT_USER_ID,
      text: messageText.trim(),
      timestamp: formatNow(),
      isRead: true,
    };

    setMessages((prev) => ({
      ...prev,
      [currentId]: [...(prev[currentId] || []), newMessage],
    }));

    setConversations((prev) =>
      prev
        .map((conversation) =>
          conversation.id === currentId
            ? {
                ...conversation,
                lastMessage: newMessage.text,
                timestamp: "Şimdi",
                unread: 0,
              }
            : conversation
        )
        .sort((a, b) => (a.id === currentId ? -1 : b.id === currentId ? 1 : 0))
    );

    setMessageText("");
  };

  const toggleMember = (memberId: number) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId) ? prev.filter((item) => item !== memberId) : [...prev, memberId]
    );
  };

  const handleCreateGroup = () => {
    if (!groupName.trim() || selectedMembers.length < 2) {
      return;
    }

    const conversationId = Date.now();
    const groupConversation: Conversation = {
      id: conversationId,
      type: "group",
      title: groupName.trim(),
      avatar: groupName.trim().charAt(0).toUpperCase(),
      participantIds: selectedMembers,
      lastMessage: "Sohbet oluşturuldu.",
      timestamp: "Şimdi",
      unread: 0,
    };

    setConversations((prev) => [groupConversation, ...prev]);
    setMessages((prev) => ({
      ...prev,
      [conversationId]: [
        {
          id: Date.now() + 1,
          senderId: CURRENT_USER_ID,
          text: `"${groupConversation.title}" grubu oluşturuldu.`,
          timestamp: formatNow(),
          isRead: true,
        },
      ],
    }));

    setGroupName("");
    setSelectedMembers([]);
    setSelectedConversationId(conversationId);
    setIsGroupModalOpen(false);
  };

  return (
    <div className="h-[calc(100vh-65px)] bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <div className="flex h-full">
        <Sidebar />

        <main className="flex-1 flex min-w-0">
          <aside className="w-96 border-r border-neutral-200 dark:border-neutral-800 bg-white/60 dark:bg-neutral-900/50 backdrop-blur-sm flex flex-col">
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Mesajlar</h2>
                  <p className="text-xs text-neutral-500">{onlineCount} kişi çevrimiçi</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsGroupModalOpen(true)}>
                  <MessageSquarePlus size={18} />
                </Button>
              </div>

              <Input
                placeholder="Sohbetlerde ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search size={18} />}
              />

              <div className="flex gap-2">
                {[
                  { label: "Tümü", value: "all" as const },
                  { label: "Okunmamış", value: "unread" as const },
                  { label: "Gruplar", value: "groups" as const },
                ].map((filter) => (
                  <Button
                    key={filter.value}
                    variant={inboxFilter === filter.value ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setInboxFilter(filter.value)}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => handleSelectConversation(conversation.id)}
                  className={`w-full p-4 flex items-start gap-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-smooth border-b border-neutral-100 dark:border-neutral-800 ${
                    selectedConversationId === conversation.id
                      ? "bg-blue-50 dark:bg-blue-950/20 border-l-4 border-l-blue-500"
                      : ""
                  }`}
                >
                  <div className="relative">
                    <Avatar src={conversation.type === "direct" ? conversation.avatar : undefined} fallback={conversation.avatar} size="md" />
                    {conversation.type === "direct" && conversation.isOnline && (
                      <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white dark:border-neutral-900" />
                    )}
                  </div>

                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="font-semibold text-sm truncate">{conversation.title}</p>
                        {conversation.type === "group" && (
                          <Badge variant="outline" size="sm" className="text-[10px]">
                            <Users size={10} className="mr-1" /> Grup
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-neutral-500 flex-shrink-0 ml-2">{conversation.timestamp}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate">{conversation.lastMessage}</p>
                      {conversation.unread > 0 && (
                        <Badge variant="primary" size="sm" className="h-5 min-w-5 px-1 flex items-center justify-center text-xs">
                          {conversation.unread}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              ))}

              {filteredConversations.length === 0 && (
                <div className="p-6 text-center text-sm text-neutral-500">
                  Aradığınız kriterlerde sohbet bulunamadı.
                </div>
              )}
            </div>
          </aside>

          {selectedConversation ? (
            <section className="flex-1 flex flex-col bg-white dark:bg-neutral-950 min-w-0">
              <header className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between glass">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    src={selectedConversation.type === "direct" ? selectedConversation.avatar : undefined}
                    fallback={selectedConversation.avatar}
                    size="md"
                    status={selectedConversation.type === "direct" && selectedConversation.isOnline ? "online" : "offline"}
                  />
                  <div className="min-w-0">
                    <h3 className="font-bold truncate">{selectedConversation.title}</h3>
                    <p className="text-xs text-neutral-500 truncate">
                      {selectedConversation.type === "group"
                        ? `${selectedConversation.participantIds.length + 1} üyeli grup`
                        : selectedConversation.isOnline
                        ? "Çevrimiçi"
                        : "Çevrimdışı"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon">
                    <Phone size={18} />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Video size={18} />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Info size={18} />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreVertical size={18} />
                  </Button>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedMessages.map((message) => {
                  const isSent = message.senderId === CURRENT_USER_ID;
                  const sender = PEOPLE.find((person) => person.id === message.senderId);
                  return (
                    <div key={message.id} className={`flex ${isSent ? "justify-end" : "justify-start"}`}>
                      <div className={`flex gap-2 max-w-[75%] ${isSent ? "flex-row-reverse" : "flex-row"}`}>
                        {!isSent && (
                          <Avatar
                            src={sender?.avatar || (selectedConversation.type === "direct" ? selectedConversation.avatar : undefined)}
                            fallback={sender?.name || selectedConversation.title}
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
                            {selectedConversation.type === "group" && !isSent && (
                              <p className="text-[11px] font-semibold mb-1 opacity-80">{sender?.name || "Üye"}</p>
                            )}
                            <p className="text-sm leading-relaxed">{message.text}</p>
                          </div>
                          <div className={`flex items-center gap-1 mt-1 ${isSent ? "justify-end" : "justify-start"}`}>
                            <span className="text-xs text-neutral-500">{message.timestamp}</span>
                            {isSent && (
                              <span className="text-xs text-blue-500 inline-flex items-center gap-1">
                                <CheckCheck size={12} />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleSendMessage} className="p-4 border-t border-neutral-200 dark:border-neutral-800 glass">
                <div className="flex items-end gap-2">
                  <Button type="button" variant="ghost" size="icon">
                    <Paperclip size={18} />
                  </Button>
                  <Button type="button" variant="ghost" size="icon">
                    <ImageIcon size={18} />
                  </Button>

                  <div className="flex-1">
                    <textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => {
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

                  <Button type="button" variant="ghost" size="icon">
                    <Smile size={18} />
                  </Button>

                  <Button variant="primary" size="icon" type="submit" disabled={!messageText.trim()} className="h-11 w-11">
                    <Send size={18} />
                  </Button>
                </div>
              </form>
            </section>
          ) : (
            <section className="flex-1 flex items-center justify-center bg-white dark:bg-neutral-950">
              <div className="text-center">
                <div className="h-24 w-24 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
                  <Send size={40} className="text-neutral-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">Mesajlarınız</h3>
                <p className="text-neutral-600 dark:text-neutral-400">Bir sohbet seçin veya yeni bir konuşma başlatın</p>
              </div>
            </section>
          )}
        </main>
      </div>

      <Modal open={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} title="Yeni Grup Oluştur" size="md">
        <div className="space-y-4">
          <Input
            label="Grup adı"
            placeholder="Örn: Startup Türkiye"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            icon={<Users size={16} />}
          />

          <div>
            <p className="text-sm font-medium mb-2">Üyeleri seçin (en az 2)</p>
            <div className="max-h-56 overflow-y-auto border rounded-xl border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-800">
              {PEOPLE.map((person) => {
                const checked = selectedMembers.includes(person.id);
                return (
                  <button
                    type="button"
                    key={person.id}
                    onClick={() => toggleMember(person.id)}
                    className="w-full flex items-center justify-between p-3 hover:bg-neutral-50 dark:hover:bg-neutral-900"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar src={person.avatar} fallback={person.name} size="sm" />
                      <div className="text-left">
                        <p className="text-sm font-medium">{person.name}</p>
                        <p className="text-xs text-neutral-500">{person.isOnline ? "Çevrimiçi" : "Çevrimdışı"}</p>
                      </div>
                    </div>
                    <div className={`h-5 w-5 rounded-full border ${checked ? "bg-blue-500 border-blue-500" : "border-neutral-300"}`} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsGroupModalOpen(false)}>
              Vazgeç
            </Button>
            <Button variant="primary" onClick={handleCreateGroup} disabled={!groupName.trim() || selectedMembers.length < 2}>
              <UserPlus size={16} className="mr-2" />
              Grup Oluştur
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
