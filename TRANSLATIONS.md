// LanguageContext'e ek çeviriler - Bu dosyayı LanguageContext.tsx'e ekleyin

// Eklenecek çeviriler:

const additionalTranslations = {
  tr: {
    // Meetups/Feed
    meetups: {
      title: "Topluluk Akışı",
      subtitle: "Etkinlikler, gruplar ve sohbetleri keşfet",
      createPost: "Paylaşım Oluştur",
      filters: {
        all: "Tümü",
        events: "Etkinlikler",
        groups: "Gruplar",
        chat: "Sohbet",
      },
    },
    
    // Event Detail
    eventDetail: {
      backToEvents: "Etkinliklere Dön",
      organizer: "Organize eden",
      dateTime: "Tarih & Saat",
      location: "Konum",
      attendees: "Katılımcılar",
      price: "Fiyat",
      free: "Ücretsiz",
      attending: "Katılıyorsun",
      joinEvent: "Etkinliğe Katıl",
      whatToExpect: "Neler Yapılacak?",
      requirements: "Gereksinimler",
      comments: "Yorumlar",
      addComment: "Yorum yaz...",
      similarEvents: "Benzer Etkinlikler",
      capacity: "kişi",
    },
    
    // Group Detail
    groupDetail: {
      backToGroups: "Gruplara Dön",
      publicGroup: "Açık Grup",
      privateGroup: "Özel Grup",
      members: "üye",
      posts: "gönderi",
      joined: "Üyesin",
      join: "Katıl",
      tabs: {
        feed: "Akış",
        members: "Üyeler",
        events: "Etkinlikler",
        about: "Hakkında",
      },
      shareToGroup: "Gruba bir şeyler paylaş...",
      admins: "Yöneticiler",
      stats: "İstatistikler",
      rules: "Kurallar",
      created: "Oluşturulma",
    },
    
    // Create Event
    createEvent: {
      title: "Yeni Etkinlik Oluştur",
      subtitle: "Toplulukla bir araya gelmek için etkinlik düzenle",
      backButton: "Geri Dön",
      sections: {
        basicInfo: "Temel Bilgiler",
        dateTime: "Tarih & Saat",
        location: "Konum",
        capacity: "Kapasite & Fiyatlandırma",
        image: "Etkinlik Görseli",
      },
      fields: {
        title: "Etkinlik Başlığı",
        titlePlaceholder: "örn: NYC Turkish Coffee Meetup",
        category: "Kategori",
        description: "Açıklama",
        descriptionPlaceholder: "Etkinlik hakkında detaylı bilgi verin...",
        date: "Tarih",
        time: "Saat",
        city: "Şehir, Eyalet",
        cityPlaceholder: "örn: New York, NY",
        venue: "Mekan Adı",
        venuePlaceholder: "örn: Turkish Cultural Center",
        address: "Adres",
        addressPlaceholder: "Tam adres (opsiyonel)",
        capacity: "Maksimum Katılımcı",
        capacityPlaceholder: "örn: 50",
        isPaid: "Bu ücretli bir etkinlik",
        price: "Fiyat (USD)",
        pricePlaceholder: "örn: 25",
        imageUpload: "Görsel yüklemek için tıkla",
        imageUploaded: "Değiştirmek için tıkla",
      },
      checkBefore: "Oluşturmadan önce kontrol edin:",
      checks: {
        fields: "Tüm gerekli alanlar dolduruldu mu?",
        dateTime: "Tarih ve saat bilgileri doğru mu?",
        location: "Konum bilgisi net mi?",
      },
      createButton: "Etkinliği Oluştur",
    },
    
    // Create Group
    createGroup: {
      title: "Yeni Grup Oluştur",
      subtitle: "İlgi alanına göre bir topluluk oluştur ve yönet",
      backButton: "Geri Dön",
      sections: {
        basicInfo: "Temel Bilgiler",
        privacy: "Gizlilik Ayarları",
        rules: "Grup Kuralları",
        images: "Görseller",
      },
      fields: {
        name: "Grup Adı",
        namePlaceholder: "örn: NYC Tech Professionals",
        category: "Kategori",
        description: "Açıklama",
        descriptionPlaceholder: "Grubun amacını ve hangi konuları kapsadığını açıklayın...",
        publicGroup: "Açık Grup",
        publicDescription: "Herkes gruba katılabilir ve içeriği görebilir",
        privateGroup: "Özel Grup",
        privateDescription: "Sadece onaylanan kişiler katılabilir",
        addRule: "Kural Ekle",
        rulePlaceholder: "Kural",
        icon: "Grup İkonu",
        iconSize: "256x256px önerilir",
        cover: "Kapak Görseli",
        coverSize: "1200x400px önerilir",
      },
      afterCreate: "Grup oluşturduktan sonra:",
      afterCreatePoints: {
        admin: "Otomatik olarak grup yöneticisi olacaksınız",
        moderator: "Moderatör atayabilir ve ayarları değiştirebilirsiniz",
        manage: "Üyeleri yönetebilir ve içerik denetleyebilirsiniz",
      },
      createButton: "Grubu Oluştur",
    },
    
    // Profile
    profilePage: {
      editProfile: "Profili Düzenle",
      follow: "Takip Et",
      following: "Takip Ediliyor",
      message: "Mesaj",
      joined: "Katıldı",
      tabs: {
        posts: "Gönderiler",
        events: "Etkinlikler",
        groups: "Gruplar",
        about: "Hakkında",
      },
      badges: "Rozetler",
      stats: "İstatistikler",
      profileViews: "Profil Görüntüleme",
      totalLikes: "Toplam Beğeni",
      eventParticipation: "Etkinlik Katılımı",
      suggested: "Tanıyabilirsin",
      mutualFriends: "ortak arkadaş",
      bio: "Bio",
      contact: "İletişim",
      interests: "İlgi Alanları",
    },
    
    // Messages
    messagesPage: {
      title: "Mesajlar",
      searchPlaceholder: "Mesajlarda ara...",
      online: "Çevrimiçi",
      offline: "Çevrimdışı",
      typePlaceholder: "Mesajınızı yazın...",
      send: "Gönder",
      emptyState: {
        title: "Mesajlarınız",
        subtitle: "Bir sohbet seçin veya yeni bir konuşma başlatın",
      },
    },
    
    // Footer
    footer: {
      discover: "Keşfet",
      classifieds: "İlanlar",
      about: "Hakkımızda",
      privacy: "Gizlilik",
      contact: "İletişim",
      allRightsReserved: "Tüm hakları saklıdır",
      platformDescription: "Amerika'daki Türkler için sosyal platform",
    },
  },
  
  en: {
    // Meetups/Feed
    meetups: {
      title: "Community Feed",
      subtitle: "Discover events, groups and conversations",
      createPost: "Create Post",
      filters: {
        all: "All",
        events: "Events",
        groups: "Groups",
        chat: "Chat",
      },
    },
    
    // Event Detail
    eventDetail: {
      backToEvents: "Back to Events",
      organizer: "Organized by",
      dateTime: "Date & Time",
      location: "Location",
      attendees: "Attendees",
      price: "Price",
      free: "Free",
      attending: "You're Attending",
      joinEvent: "Join Event",
      whatToExpect: "What to Expect",
      requirements: "Requirements",
      comments: "Comments",
      addComment: "Add comment...",
      similarEvents: "Similar Events",
      capacity: "people",
    },
    
    // Group Detail
    groupDetail: {
      backToGroups: "Back to Groups",
      publicGroup: "Public Group",
      privateGroup: "Private Group",
      members: "members",
      posts: "posts",
      joined: "Joined",
      join: "Join",
      tabs: {
        feed: "Feed",
        members: "Members",
        events: "Events",
        about: "About",
      },
      shareToGroup: "Share something to the group...",
      admins: "Admins",
      stats: "Statistics",
      rules: "Rules",
      created: "Created",
    },
    
    // Create Event
    createEvent: {
      title: "Create New Event",
      subtitle: "Organize an event to bring the community together",
      backButton: "Back",
      sections: {
        basicInfo: "Basic Information",
        dateTime: "Date & Time",
        location: "Location",
        capacity: "Capacity & Pricing",
        image: "Event Image",
      },
      fields: {
        title: "Event Title",
        titlePlaceholder: "e.g., NYC Turkish Coffee Meetup",
        category: "Category",
        description: "Description",
        descriptionPlaceholder: "Provide detailed information about the event...",
        date: "Date",
        time: "Time",
        city: "City, State",
        cityPlaceholder: "e.g., New York, NY",
        venue: "Venue Name",
        venuePlaceholder: "e.g., Turkish Cultural Center",
        address: "Address",
        addressPlaceholder: "Full address (optional)",
        capacity: "Maximum Attendees",
        capacityPlaceholder: "e.g., 50",
        isPaid: "This is a paid event",
        price: "Price (USD)",
        pricePlaceholder: "e.g., 25",
        imageUpload: "Click to upload image",
        imageUploaded: "Click to change",
      },
      checkBefore: "Check before creating:",
      checks: {
        fields: "All required fields filled?",
        dateTime: "Date and time correct?",
        location: "Location clear?",
      },
      createButton: "Create Event",
    },
    
    // Create Group
    createGroup: {
      title: "Create New Group",
      subtitle: "Create and manage a community based on your interests",
      backButton: "Back",
      sections: {
        basicInfo: "Basic Information",
        privacy: "Privacy Settings",
        rules: "Group Rules",
        images: "Images",
      },
      fields: {
        name: "Group Name",
        namePlaceholder: "e.g., NYC Tech Professionals",
        category: "Category",
        description: "Description",
        descriptionPlaceholder: "Describe the purpose and topics of the group...",
        publicGroup: "Public Group",
        publicDescription: "Anyone can join and view content",
        privateGroup: "Private Group",
        privateDescription: "Only approved members can join",
        addRule: "Add Rule",
        rulePlaceholder: "Rule",
        icon: "Group Icon",
        iconSize: "256x256px recommended",
        cover: "Cover Image",
        coverSize: "1200x400px recommended",
      },
      afterCreate: "After creating the group:",
      afterCreatePoints: {
        admin: "You'll automatically become the group admin",
        moderator: "You can assign moderators and change settings",
        manage: "You can manage members and moderate content",
      },
      createButton: "Create Group",
    },
    
    // Profile
    profilePage: {
      editProfile: "Edit Profile",
      follow: "Follow",
      following: "Following",
      message: "Message",
      joined: "Joined",
      tabs: {
        posts: "Posts",
        events: "Events",
        groups: "Groups",
        about: "About",
      },
      badges: "Badges",
      stats: "Statistics",
      profileViews: "Profile Views",
      totalLikes: "Total Likes",
      eventParticipation: "Event Participation",
      suggested: "You May Know",
      mutualFriends: "mutual friends",
      bio: "Bio",
      contact: "Contact",
      interests: "Interests",
    },
    
    // Messages
    messagesPage: {
      title: "Messages",
      searchPlaceholder: "Search messages...",
      online: "Online",
      offline: "Offline",
      typePlaceholder: "Type your message...",
      send: "Send",
      emptyState: {
        title: "Your Messages",
        subtitle: "Select a chat or start a new conversation",
      },
    },
    
    // Footer
    footer: {
      discover: "Discover",
      classifieds: "Classifieds",
      about: "About",
      privacy: "Privacy",
      contact: "Contact",
      allRightsReserved: "All rights reserved",
      platformDescription: "Social platform for Turks in America",
    },
  },
};

// Bu çevirileri LanguageContext.tsx'deki translations objesine ekleyin
