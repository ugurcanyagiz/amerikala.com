"use client";

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  User,
  MessageSquarePlus,
  CheckCheck,
  Loader2,
  RefreshCw,
  LogOut,
  Check,
  ChevronLeft,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import { Button } from "../components/ui/Button";
import { Avatar } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { useAuth } from "../contexts/AuthContext";
import {
  getMessagePreviews,
  markConversationMessagesAsRead,
  MessagePreview,
} from "@/lib/messages";
import { supabase } from "@/lib/supabase/client";

type InboxFilter = "all" | "unread" | "groups";

type ProfileRow = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

type ParticipantRow = {
  conversation_id: string;
  user_id: string;
  profiles: ProfileRow[] | ProfileRow | null;
};

type ConversationMeta = {
  id: string;
  title?: string | null;
  name?: string | null;
  is_group?: boolean | null;
};

type ConversationItem = {
  id: string;
  type: "direct" | "group";
  title: string;
  avatarUrl: string | null;
  avatarFallback: string;
  participantIds: string[];
  participantNames: string[];
  lastMessage: string;
  timestampLabel: string;
  unread: number;
  updatedAtRaw: string;
  onlineCount: number;
  directUserId?: string;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
};

type MessageItem = {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  text: string;
  timestamp: string;
  createdAtRaw: string;
  isRead: boolean;
};

const formatDisplayName = (profile: ProfileRow | null | undefined) => {
  if (!profile) return "Kullanıcı";
  const full = [profile.first_name, profile.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return full || profile.username || "Kullanıcı";
};

const resolveProfile = (profile: ParticipantRow["profiles"]) => {
  if (!profile) return null;
  return Array.isArray(profile) ? profile[0] || null : profile;
};

const parseDate = (value: string | null | undefined) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatRelativeLabel = (iso: string | null | undefined) => {
  const created = parseDate(iso);
  if (!created) return "Bilinmiyor";
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "Şimdi";
  if (diffMinutes < 60) return `${diffMinutes} dk`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} sa`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Dün";

  return created.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
  });
};

const formatClock = (iso: string | null | undefined) => {
  const created = parseDate(iso);
  if (!created) return "--:--";

  return created.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const withTimeout = async <T,>(
  promise: PromiseLike<T>,
  ms: number,
  label: string,
): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} zaman aşımına uğradı (${ms}ms).`));
    }, ms);
  });

  try {
    return await Promise.race<T>([Promise.resolve(promise), timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [inboxFilter, setInboxFilter] = useState<InboxFilter>("all");
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const [memberOptions, setMemberOptions] = useState<ProfileRow[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileCardData, setProfileCardData] = useState<ProfileRow | null>(
    null,
  );
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const isConversationsLoadingRef = useRef(false);
  const selectedConversationRef = useRef<ConversationItem | null>(null);
  const conversationIdSetRef = useRef<Set<string>>(new Set());

  const selectedConversation =
    conversations.find((item) => item.id === selectedConversationId) ?? null;

  useEffect(() => {
    const requestedConversation = searchParams.get("conversation");
    if (!requestedConversation || conversations.length === 0) return;
    const exists = conversations.some(
      (conversation) => conversation.id === requestedConversation,
    );
    if (exists) {
      setSelectedConversationId(requestedConversation);
    }
  }, [conversations, searchParams]);

  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  useEffect(() => {
    conversationIdSetRef.current = new Set(
      conversations.map((conversation) => conversation.id),
    );
  }, [conversations]);

  const filteredConversations = useMemo(() => {
    return conversations.filter((conversation) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q.length === 0 ||
        conversation.title.toLowerCase().includes(q) ||
        (conversation.lastMessage || "").toLowerCase().includes(q) ||
        conversation.participantNames.some((name) =>
          name.toLowerCase().includes(q),
        );

      if (!matchesSearch) return false;
      if (inboxFilter === "unread") return conversation.unread > 0;
      if (inboxFilter === "groups") return conversation.type === "group";
      return true;
    });
  }, [conversations, inboxFilter, searchQuery]);

  const onlineCount = conversations.reduce(
    (acc, item) => acc + item.onlineCount,
    0,
  );

  const loadMemberOptions = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, first_name, last_name, avatar_url")
      .neq("id", user.id)
      .order("updated_at", { ascending: false })
      .limit(60);

    if (!error) {
      setMemberOptions((data as ProfileRow[] | null) || []);
    }
  }, [user]);

  const loadConversations = useCallback(async () => {
    if (!user) {
      setConversations([]);
      setSelectedConversationId(null);
      setIsLoadingConversations(false);
      return;
    }

    if (isConversationsLoadingRef.current) return;

    isConversationsLoadingRef.current = true;
    setIsLoadingConversations(true);

    try {
      const previews = await withTimeout(
        getMessagePreviews(user.id),
        10000,
        "Konuşma listesi",
      );
      const ids = previews.map((item) => item.conversationId);

      if (ids.length === 0) {
        setConversations([]);
        setSelectedConversationId(null);
        return;
      }

      const [
        { data: participantsData, error: participantsError },
        { data: metaData, error: metaError },
      ] = await withTimeout(
        Promise.all([
          supabase
            .from("conversation_participants")
            .select(
              "conversation_id, user_id, profiles!conversation_participants_user_id_fkey(id, username, first_name, last_name, avatar_url)",
            )
            .in("conversation_id", ids),
          supabase
            .from("conversations")
            .select("id, title, name, is_group")
            .in("id", ids),
        ]),
        10000,
        "Konuşma detayları",
      );

      if (participantsError) throw participantsError;
      if (metaError) throw metaError;

      const participants = (participantsData as ParticipantRow[] | null) || [];
      const metaById = new Map<string, ConversationMeta>();
      ((metaData as ConversationMeta[] | null) || []).forEach((meta) => {
        metaById.set(meta.id, meta);
      });

      const participantsByConversation = new Map<string, ParticipantRow[]>();
      participants.forEach((participant) => {
        const arr =
          participantsByConversation.get(participant.conversation_id) || [];
        arr.push(participant);
        participantsByConversation.set(participant.conversation_id, arr);
      });

      const nextConversations: ConversationItem[] = previews.map(
        (preview: MessagePreview) => {
          const conversationParticipants =
            participantsByConversation.get(preview.conversationId) || [];
          const otherParticipants = conversationParticipants.filter(
            (item) => item.user_id !== user.id,
          );
          const otherProfiles = otherParticipants
            .map((item) => resolveProfile(item.profiles))
            .filter((item): item is ProfileRow => !!item);
          const meta = metaById.get(preview.conversationId);

          const inferredGroup =
            (meta?.is_group ?? false) || otherParticipants.length > 1;
          const participantNames = otherProfiles.map((item) =>
            formatDisplayName(item),
          );
          const onlineHints = conversationParticipants.filter(
            (item) => item.user_id !== user.id,
          ).length;

          const title = inferredGroup
            ? meta?.title ||
              meta?.name ||
              participantNames.slice(0, 3).join(", ") ||
              "Grup Sohbeti"
            : preview.otherUserName;

          const avatarFallback = inferredGroup
            ? title.charAt(0).toUpperCase() || "G"
            : preview.otherUserName;

          const avatarUrl = inferredGroup ? null : preview.otherUserAvatar;

          return {
            id: preview.conversationId,
            type: inferredGroup ? "group" : "direct",
            title,
            avatarUrl,
            avatarFallback,
            participantIds: otherParticipants.map((item) => item.user_id),
            participantNames,
            lastMessage: preview.lastMessageText,
            timestampLabel: formatRelativeLabel(preview.lastMessageCreatedAt),
            unread: preview.unreadCount,
            updatedAtRaw: preview.lastMessageCreatedAt,
            onlineCount: onlineHints > 0 ? 1 : 0,
            directUserId: inferredGroup
              ? undefined
              : otherParticipants[0]?.user_id,
          };
        },
      );

      nextConversations.sort(
        (a, b) =>
          new Date(b.updatedAtRaw).getTime() -
          new Date(a.updatedAtRaw).getTime(),
      );
      setConversations(nextConversations);

      setSelectedConversationId((prev) => {
        if (prev && nextConversations.some((item) => item.id === prev))
          return prev;
        return nextConversations[0]?.id || null;
      });
    } catch (error) {
      console.error("Konuşmalar alınamadı:", error);
      setStatusNote("Konuşmalar yüklenirken hata oluştu.");
    } finally {
      isConversationsLoadingRef.current = false;
      setIsLoadingConversations(false);
    }
  }, [user]);

  const markConversationAsRead = useCallback(
    async (conversationId: string) => {
      if (!user) return;

      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                unread: 0,
              }
            : conversation,
        ),
      );

      try {
        await markConversationMessagesAsRead(conversationId, user.id);
      } catch (error) {
        console.error("Mesajlar okundu işaretlenemedi:", error);
      }
    },
    [user],
  );

  const loadMessages = useCallback(
    async (conversationId: string) => {
      if (!user) return;

      setIsLoadingMessages(true);
      try {
        const { data, error } = await withTimeout(
          supabase
            .from("messages")
            .select(
              "id, conversation_id, sender_id, content, created_at, read_at",
            )
            .eq("conversation_id", conversationId)
            .order("created_at", { ascending: true }),
          10000,
          "Mesaj listesi",
        );

        if (error) throw error;

        const rows = ((data as MessageRow[] | null) || []).filter(
          (item) => item.content,
        );
        const senderIds = [...new Set(rows.map((item) => item.sender_id))];

        let senderProfiles: ProfileRow[] | null = [];
        if (senderIds.length > 0) {
          const { data: profileRows, error: profileError } = await withTimeout(
            supabase
              .from("profiles")
              .select("id, username, first_name, last_name, avatar_url")
              .in("id", senderIds),
            10000,
            "Gönderen profilleri",
          );

          if (profileError) throw profileError;
          senderProfiles = (profileRows as ProfileRow[] | null) || [];
        }

        const profileMap = new Map<string, ProfileRow>();
        (senderProfiles || []).forEach((profile) => {
          profileMap.set(profile.id, profile);
        });

        const nextMessages = rows.map((item) => {
          const profile = profileMap.get(item.sender_id);
          return {
            id: item.id,
            senderId: item.sender_id,
            senderName: formatDisplayName(profile),
            senderAvatar: profile?.avatar_url || null,
            text: item.content,
            timestamp: formatClock(item.created_at),
            createdAtRaw: item.created_at,
            isRead: !!item.read_at,
          };
        });

        setMessages(nextMessages);
        void markConversationAsRead(conversationId);
      } catch (error) {
        console.error("Mesajlar alınamadı:", error);
        setStatusNote(
          "Mesajlar yüklenirken hata oluştu. Lütfen tekrar deneyin.",
        );
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [markConversationAsRead, user],
  );

  useEffect(() => {
    loadConversations();
    loadMemberOptions();
  }, [loadConversations, loadMemberOptions]);

  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }

    loadMessages(selectedConversationId);
  }, [selectedConversationId, loadMessages]);

  const isConversationRelevant = useCallback(
    async (conversationId: string) => {
      if (!user) return false;
      if (conversationIdSetRef.current.has(conversationId)) return true;

      const { data, error } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("conversation_id", conversationId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Konuşma üyeliği doğrulanamadı:", error);
        return false;
      }

      return !!data;
    },
    [user],
  );

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`messages-feed-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const row = payload.new as MessageRow;
          if (!row?.conversation_id) return;

          void (async () => {
            const relevant = await isConversationRelevant(row.conversation_id);
            if (!relevant) return;

            if (row.conversation_id === selectedConversationId) {
              setMessages((prev) => {
                if (prev.some((item) => item.id === row.id)) return prev;
                const isMine = row.sender_id === user.id;
                return [
                  ...prev,
                  {
                    id: row.id,
                    senderId: row.sender_id,
                    senderName: isMine
                      ? "Siz"
                      : selectedConversationRef.current?.title || "Kullanıcı",
                    senderAvatar: isMine
                      ? null
                      : selectedConversationRef.current?.avatarUrl || null,
                    text: row.content,
                    timestamp: formatClock(row.created_at),
                    createdAtRaw: row.created_at,
                    isRead: !!row.read_at,
                  },
                ];
              });

              if (row.sender_id !== user.id) {
                await markConversationAsRead(row.conversation_id);
              }
            }

            await loadConversations();
          })();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    user,
    selectedConversationId,
    loadConversations,
    markConversationAsRead,
    isConversationRelevant,
  ]);

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setIsActionsOpen(false);
    void markConversationAsRead(conversationId);
  };

  const renderMessageBody = (text: string) => {
    const imageMatch = text.match(/^!\[(.*?)\]\((https?:\/\/[^\s)]+)\)$/);
    if (imageMatch) {
      const [, alt, url] = imageMatch;
      return (
        <a href={url} target="_blank" rel="noreferrer" className="block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={alt || "Görsel"}
            className="max-h-64 w-auto rounded-xl object-cover"
          />
        </a>
      );
    }

    const fileMatch = text.match(/^\[(.*?)\]\((https?:\/\/[^\s)]+)\)$/);
    if (fileMatch) {
      const [, name, url] = fileMatch;
      return (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-sm underline break-all"
        >
          📎 {name || "Dosya"}
        </a>
      );
    }

    return (
      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
        {text}
      </p>
    );
  };

  const uploadMessageAttachment = useCallback(
    async (file: File) => {
      if (!user || !selectedConversationId) {
        throw new Error("Dosya yüklemek için bir sohbet seçin.");
      }

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const filePath = `${user.id}/${selectedConversationId}/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("message-attachments")
        .upload(filePath, file, {
          upsert: false,
          cacheControl: "3600",
          contentType: file.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from("message-attachments")
        .getPublicUrl(filePath);
      if (!data?.publicUrl) {
        throw new Error("Yüklenen dosya için URL alınamadı.");
      }

      return data.publicUrl;
    },
    [selectedConversationId, user],
  );

  const handleAttachmentSelected = useCallback(
    async (event: ChangeEvent<HTMLInputElement>, kind: "image" | "file") => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;

      setIsUploadingAttachment(true);
      try {
        const url = await uploadMessageAttachment(file);
        const token =
          kind === "image"
            ? `![${file.name}](${url})`
            : `[${file.name}](${url})`;
        setMessageText((prev) =>
          prev.trim().length > 0
            ? `${prev}
${token}`
            : token,
        );
        setStatusNote(
          `${kind === "image" ? "Görsel" : "Dosya"} yüklendi. Mesajı göndererek paylaşabilirsiniz.`,
        );
      } catch (error) {
        console.error("Dosya yükleme hatası:", error);
        setStatusNote(
          "Dosya yüklenemedi. Storage bucket/policy ayarlarını kontrol edin.",
        );
      } finally {
        setIsUploadingAttachment(false);
      }
    },
    [uploadMessageAttachment],
  );

  const handleOpenProfileCard = useCallback(async () => {
    if (!selectedConversation?.directUserId) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, first_name, last_name, avatar_url")
        .eq("id", selectedConversation.directUserId)
        .maybeSingle();

      if (error) throw error;

      setProfileCardData((data as ProfileRow | null) || null);
      setIsProfileModalOpen(true);
    } catch (error) {
      console.error("Profil kartı açılamadı:", error);
      setStatusNote("Profil bilgisi alınamadı.");
    }
  }, [selectedConversation]);

  const handleSendMessage = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!user || !selectedConversationId || !messageText.trim() || isSending) {
      return;
    }

    setIsSending(true);
    try {
      const content = messageText.trim();
      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: selectedConversationId,
          sender_id: user.id,
          content,
        })
        .select("id, sender_id, content, created_at, read_at")
        .single();

      if (error) throw error;

      if (data) {
        setMessages((prev) => [
          ...prev,
          {
            id: data.id,
            senderId: data.sender_id,
            senderName: "Siz",
            senderAvatar: null,
            text: data.content,
            timestamp: formatClock(data.created_at),
            createdAtRaw: data.created_at,
            isRead: !!data.read_at,
          },
        ]);
      }

      setMessageText("");
      await loadConversations();
    } catch (error) {
      console.error("Mesaj gönderilemedi:", error);
      setStatusNote("Mesaj gönderilemedi. Lütfen tekrar deneyin.");
    } finally {
      setIsSending(false);
    }
  };

  const toggleMember = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((item) => item !== memberId)
        : [...prev, memberId],
    );
  };

  const createConversationRecord = async (name: string) => {
    const payloads = [
      { title: name, name, is_group: true, created_by: user?.id },
      { title: name, is_group: true, created_by: user?.id },
      { name, is_group: true, created_by: user?.id },
      { title: name, name },
      { title: name },
      { name },
      {},
    ];

    for (const payload of payloads) {
      const { data, error } = await supabase
        .from("conversations")
        .insert(payload)
        .select("id")
        .single();
      if (!error && data?.id) {
        return data.id as string;
      }
    }

    throw new Error("Konuşma kaydı oluşturulamadı.");
  };

  const handleCreateGroup = async () => {
    if (
      !user ||
      !groupName.trim() ||
      selectedMembers.length < 2 ||
      isCreatingGroup
    )
      return;

    setIsCreatingGroup(true);
    try {
      const conversationId = await createConversationRecord(groupName.trim());
      const participantIds = [...new Set([user.id, ...selectedMembers])];

      const { error: participantError } = await supabase
        .from("conversation_participants")
        .insert(
          participantIds.map((memberId) => ({
            conversation_id: conversationId,
            user_id: memberId,
          })),
        );

      if (participantError) throw participantError;

      const { error: messageError } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: `"${groupName.trim()}" grubu oluşturuldu.`,
      });

      if (messageError) throw messageError;

      setGroupName("");
      setSelectedMembers([]);
      setIsGroupModalOpen(false);
      setStatusNote("Grup başarıyla oluşturuldu.");

      await loadConversations();
      setSelectedConversationId(conversationId);
    } catch (error) {
      console.error("Grup oluşturulamadı:", error);
      setStatusNote(
        "Grup oluşturulamadı. Yetki veya tablo yapılarını kontrol edin.",
      );
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleLeaveConversation = async () => {
    if (!user || !selectedConversationId) return;

    const { error } = await supabase
      .from("conversation_participants")
      .delete()
      .eq("conversation_id", selectedConversationId)
      .eq("user_id", user.id);

    if (error) {
      setStatusNote("Sohbetten ayrılamadınız.");
      return;
    }

    setStatusNote("Sohbetten ayrıldınız.");
    await loadConversations();
    setIsActionsOpen(false);
  };

  if (authLoading) {
    return (
      <div className="h-[calc(100vh-65px)] flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-[calc(100vh-65px)] flex items-center justify-center">
        <p>Mesajlarınızı görmek için giriş yapmalısınız.</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-65px)] bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <div className="flex h-full">
        <Sidebar />

        <main className="flex-1 flex min-w-0">
          <aside
            className={`w-full lg:w-96 border-r border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/80 lg:bg-white/60 lg:dark:bg-neutral-900/50 backdrop-blur-sm flex-col ${
              selectedConversation ? "hidden lg:flex" : "flex"
            }`}
          >
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Mesajlar</h2>
                  <p className="text-xs text-neutral-500">
                    {onlineCount} kişi çevrimiçi
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsGroupModalOpen(true)}
                >
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
              {isLoadingConversations ? (
                <div className="p-6 flex items-center justify-center text-neutral-500">
                  <Loader2 size={16} className="animate-spin mr-2" /> Sohbetler
                  yükleniyor...
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-6 text-center text-sm text-neutral-500">
                  Henüz konuşmanız bulunmuyor.
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation.id)}
                    className={`w-full px-4 py-3 lg:p-4 flex items-start gap-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-smooth border-b border-neutral-100 dark:border-neutral-800 ${
                      selectedConversationId === conversation.id
                        ? "bg-blue-50 dark:bg-blue-950/20 lg:border-l-4 lg:border-l-blue-500"
                        : ""
                    }`}
                  >
                    <Avatar
                      src={conversation.avatarUrl || undefined}
                      fallback={conversation.avatarFallback}
                      size="md"
                    />

                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="font-semibold text-sm truncate">
                            {conversation.title}
                          </p>
                          {conversation.type === "group" && (
                            <Badge
                              variant="outline"
                              size="sm"
                              className="text-[10px]"
                            >
                              <Users size={10} className="mr-1" /> Grup
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-neutral-500 flex-shrink-0 ml-2">
                          {conversation.timestampLabel}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
                          {conversation.lastMessage}
                        </p>
                        {conversation.unread > 0 && (
                          <Badge
                            variant="primary"
                            size="sm"
                            className="h-5 min-w-5 px-1 flex items-center justify-center text-xs"
                          >
                            {conversation.unread}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </aside>

          {selectedConversation ? (
            <section className="flex-1 flex bg-white dark:bg-neutral-950 min-w-0">
              <div className="flex-1 flex flex-col min-w-0">
                <header className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between glass relative">
                  <div className="flex items-center gap-3 min-w-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="lg:hidden"
                      onClick={() => setSelectedConversationId(null)}
                      title="Sohbet listesine dön"
                    >
                      <ChevronLeft size={18} />
                    </Button>
                    <Avatar
                      src={selectedConversation.avatarUrl || undefined}
                      fallback={selectedConversation.avatarFallback}
                      size="md"
                    />
                    <div className="min-w-0">
                      <h3 className="font-bold truncate">
                        {selectedConversation.title}
                      </h3>
                      <p className="text-xs text-neutral-500 truncate">
                        {selectedConversation.type === "group"
                          ? `${selectedConversation.participantIds.length + 1} üyeli grup`
                          : "Birebir sohbet"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {selectedConversation.type === "group" && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setStatusNote(
                              "Sesli arama özelliği yakında aktif edilecek.",
                            )
                          }
                        >
                          <Phone size={18} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setStatusNote(
                              "Görüntülü arama özelliği yakında aktif edilecek.",
                            )
                          }
                        >
                          <Video size={18} />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsInfoPanelOpen((prev) => !prev)}
                    >
                      <Info size={18} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsActionsOpen((prev) => !prev)}
                    >
                      <MoreVertical size={18} />
                    </Button>

                    {isActionsOpen && (
                      <div className="absolute right-4 top-14 w-56 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-xl p-1 z-20">
                        {selectedConversation.type === "direct" && (
                          <button
                            className="w-full px-3 py-2 text-left text-sm rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                            onClick={() => {
                              void handleOpenProfileCard();
                              setIsActionsOpen(false);
                            }}
                          >
                            <User size={14} /> Profili görüntüle
                          </button>
                        )}
                        <button
                          className="w-full px-3 py-2 text-left text-sm rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                          onClick={() => {
                            if (selectedConversationId) {
                              void markConversationAsRead(
                                selectedConversationId,
                              );
                            }
                            setIsActionsOpen(false);
                          }}
                        >
                          <Check size={14} /> Okundu işaretle
                        </button>
                        <button
                          className="w-full px-3 py-2 text-left text-sm rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                          onClick={() => {
                            void loadConversations();
                            if (selectedConversationId) {
                              void loadMessages(selectedConversationId);
                            }
                            setIsActionsOpen(false);
                          }}
                        >
                          <RefreshCw size={14} /> Yenile
                        </button>
                        {selectedConversation.type === "group" && (
                          <button
                            className="w-full px-3 py-2 text-left text-sm rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 flex items-center gap-2"
                            onClick={handleLeaveConversation}
                          >
                            <LogOut size={14} /> Sohbetten ayrıl
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </header>

                {statusNote && (
                  <div className="px-4 py-2 text-xs bg-blue-50 text-blue-700 border-b border-blue-100 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-900/50">
                    {statusNote}
                  </div>
                )}

                <div className="flex-1 overflow-y-auto px-3 lg:px-4 py-4 space-y-4 bg-white dark:bg-neutral-950">
                  {isLoadingMessages ? (
                    <div className="text-sm text-neutral-500 flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" /> Mesajlar
                      yükleniyor...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-sm text-neutral-500">
                      Bu sohbette henüz mesaj yok. İlk mesajı gönderin.
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isSent = message.senderId === user.id;

                      return (
                        <div
                          key={message.id}
                          className={`flex ${isSent ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`flex gap-2 max-w-[86%] lg:max-w-[75%] ${isSent ? "flex-row-reverse" : "flex-row"}`}
                          >
                            {!isSent && (
                              <Avatar
                                src={message.senderAvatar || undefined}
                                fallback={message.senderName}
                                size="sm"
                              />
                            )}
                            <div>
                              <div
                                className={`rounded-3xl px-4 py-2.5 ${
                                  isSent
                                    ? "bg-blue-500 text-white"
                                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                                }`}
                              >
                                {selectedConversation.type === "group" &&
                                  !isSent && (
                                    <p className="text-[11px] font-semibold mb-1 opacity-80">
                                      {message.senderName}
                                    </p>
                                  )}
                                {renderMessageBody(message.text)}
                              </div>
                              <div
                                className={`flex items-center gap-1 mt-1 ${isSent ? "justify-end" : "justify-start"}`}
                              >
                                <span className="text-xs text-neutral-500">
                                  {message.timestamp}
                                </span>
                                {isSent && message.isRead && (
                                  <span className="text-xs text-blue-500 inline-flex items-center gap-1">
                                    <CheckCheck size={12} />
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <form
                  onSubmit={handleSendMessage}
                  className="p-3 lg:p-4 border-t border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-sm"
                >
                  <div className="flex items-end gap-1.5 lg:gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={(event) =>
                        void handleAttachmentSelected(event, "file")
                      }
                    />
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) =>
                        void handleAttachmentSelected(event, "image")
                      }
                    />

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingAttachment}
                      title="Dosya ekle"
                    >
                      <Paperclip size={18} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={isUploadingAttachment}
                      title="Fotoğraf ekle"
                    >
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
                        className="w-full resize-none rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-32"
                        rows={1}
                      />
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setStatusNote("Emoji paneli yakında eklenecek.")
                      }
                    >
                      <Smile size={18} />
                    </Button>

                    <Button
                      variant="primary"
                      size="icon"
                      type="submit"
                      disabled={
                        !messageText.trim() ||
                        isSending ||
                        isUploadingAttachment
                      }
                      className="h-11 w-11"
                    >
                      {isSending ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Send size={18} />
                      )}
                    </Button>
                  </div>
                </form>
              </div>

              {isInfoPanelOpen && (
                <aside className="hidden lg:block w-72 border-l border-neutral-200 dark:border-neutral-800 p-4 bg-neutral-50/70 dark:bg-neutral-900/40">
                  <h4 className="font-semibold mb-2">Sohbet Bilgisi</h4>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                    {selectedConversation.title}
                  </p>
                  <p className="text-xs text-neutral-500 mb-2">Katılımcılar</p>
                  <ul className="space-y-2">
                    {selectedConversation.participantNames.length > 0 ? (
                      selectedConversation.participantNames.map((name) => (
                        <li
                          key={name}
                          className="text-sm rounded-lg px-2 py-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
                        >
                          {name}
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-neutral-500">
                        Katılımcı bilgisi bulunamadı.
                      </li>
                    )}
                  </ul>
                </aside>
              )}
            </section>
          ) : (
            <section className="hidden lg:flex flex-1 items-center justify-center bg-white dark:bg-neutral-950">
              <div className="text-center">
                <div className="h-24 w-24 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
                  <Send size={40} className="text-neutral-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">Mesajlarınız</h3>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Yeni konuşma başlatın veya mevcut bir sohbet seçin.
                </p>
              </div>
            </section>
          )}
        </main>
      </div>

      <Modal
        open={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        title="Kullanıcı Profili"
        size="sm"
      >
        {profileCardData ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar
                src={profileCardData.avatar_url || undefined}
                fallback={formatDisplayName(profileCardData)}
                size="lg"
              />
              <div>
                <p className="font-semibold">
                  {formatDisplayName(profileCardData)}
                </p>
                <p className="text-sm text-neutral-500">
                  {profileCardData.username
                    ? `@${profileCardData.username}`
                    : "Kullanıcı"}
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              className="w-full"
              onClick={() => {
                setIsProfileModalOpen(false);
                if (profileCardData.id) {
                  router.push(`/profile/${profileCardData.id}`);
                }
              }}
            >
              Profili aç
            </Button>
          </div>
        ) : (
          <p className="text-sm text-neutral-500">Profil bilgisi bulunamadı.</p>
        )}
      </Modal>

      <Modal
        open={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        title="Yeni Grup Oluştur"
        size="md"
      >
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
              {memberOptions.map((person) => {
                const checked = selectedMembers.includes(person.id);
                const name = formatDisplayName(person);

                return (
                  <button
                    type="button"
                    key={person.id}
                    onClick={() => toggleMember(person.id)}
                    className="w-full flex items-center justify-between p-3 hover:bg-neutral-50 dark:hover:bg-neutral-900"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={person.avatar_url || undefined}
                        fallback={name}
                        size="sm"
                      />
                      <div className="text-left">
                        <p className="text-sm font-medium">{name}</p>
                        <p className="text-xs text-neutral-500">
                          {person.username
                            ? `@${person.username}`
                            : "Kullanıcı"}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`h-5 w-5 rounded-full border ${checked ? "bg-blue-500 border-blue-500" : "border-neutral-300"}`}
                    />
                  </button>
                );
              })}

              {memberOptions.length === 0 && (
                <div className="p-3 text-sm text-neutral-500">
                  Kullanıcı listesi alınamadı veya boş.
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsGroupModalOpen(false)}>
              Vazgeç
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateGroup}
              disabled={
                !groupName.trim() ||
                selectedMembers.length < 2 ||
                isCreatingGroup
              }
            >
              {isCreatingGroup ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : (
                <UserPlus size={16} className="mr-2" />
              )}
              Grup Oluştur
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
