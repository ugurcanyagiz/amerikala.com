"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Calendar,
  MapPin,
  Clock,
  Users,
  DollarSign,
  Share2,
  Heart,
  Bookmark,
  MessageCircle,
  ArrowLeft,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Mail,
  Phone,
  Globe,
  Facebook,
  Twitter,
  Instagram
} from "lucide-react";
import Sidebar from "../../components/Sidebar";
import { Button } from "../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { Textarea } from "../../components/ui/Textarea";

export default function EventDetailPage() {
  const [isAttending, setIsAttending] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [comment, setComment] = useState("");

  const handleJoin = () => {
    setIsAttending(!isAttending);
  };

  const handleComment = () => {
    if (comment.trim()) {
      console.log("Adding comment:", comment);
      setComment("");
    }
  };

  return (
    <div className="min-h-[calc(100vh-65px)] bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <div className="flex">
        <Sidebar />

        <main className="flex-1">
          {/* BACK BUTTON */}
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Link href="/events">
              <Button variant="ghost" className="gap-2 mb-4">
                <ArrowLeft size={18} />
                Etkinliklere Dön
              </Button>
            </Link>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* MAIN CONTENT */}
              <div className="lg:col-span-2 space-y-6">
                {/* HERO IMAGE */}
                <Card className="glass overflow-hidden">
                  <div className="relative h-[400px]">
                    <img 
                      src={EVENT.image} 
                      alt={EVENT.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    
                    {/* Floating Actions */}
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button
                        onClick={() => setLiked(!liked)}
                        className="h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:scale-110 transition-smooth shadow-lg"
                      >
                        <Heart size={20} className={liked ? "fill-red-500 text-red-500" : "text-neutral-700"} />
                      </button>
                      <button
                        onClick={() => setSaved(!saved)}
                        className="h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:scale-110 transition-smooth shadow-lg"
                      >
                        <Bookmark size={20} className={saved ? "fill-blue-500 text-blue-500" : "text-neutral-700"} />
                      </button>
                      <button className="h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:scale-110 transition-smooth shadow-lg">
                        <Share2 size={20} className="text-neutral-700" />
                      </button>
                    </div>

                    {/* Price Badge */}
                    <div className="absolute bottom-4 left-4">
                      <Badge variant={EVENT.isPaid ? "warning" : "success"} className="text-lg px-4 py-2">
                        {EVENT.isPaid ? `$${EVENT.price}` : "Ücretsiz"}
                      </Badge>
                    </div>
                  </div>
                </Card>

                {/* EVENT INFO */}
                <Card className="glass">
                  <CardContent className="p-6">
                    <Badge variant="outline" className="mb-3">{EVENT.category}</Badge>
                    <h1 className="text-3xl font-bold mb-4">{EVENT.title}</h1>
                    
                    <div className="flex items-center gap-3 mb-6">
                      <Avatar 
                        src={EVENT.organizer.avatar} 
                        fallback={EVENT.organizer.name}
                        size="md"
                      />
                      <div>
                        <p className="font-semibold">Organize eden</p>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          {EVENT.organizer.name}
                        </p>
                      </div>
                      {EVENT.organizer.isVerified && (
                        <CheckCircle2 className="h-5 w-5 text-blue-500 ml-auto" />
                      )}
                    </div>

                    <div className="prose prose-neutral dark:prose-invert max-w-none">
                      <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                        {EVENT.description}
                      </p>
                    </div>

                    {/* WHAT TO EXPECT */}
                    <div className="mt-8">
                      <h3 className="font-bold text-lg mb-4">Neler Yapılacak?</h3>
                      <ul className="space-y-3">
                        {EVENT.agenda.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-neutral-700 dark:text-neutral-300">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* REQUIREMENTS */}
                    {EVENT.requirements && EVENT.requirements.length > 0 && (
                      <div className="mt-8">
                        <h3 className="font-bold text-lg mb-4">Gereksinimler</h3>
                        <ul className="space-y-3">
                          {EVENT.requirements.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                              <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                              <span className="text-neutral-700 dark:text-neutral-300">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* LOCATION MAP */}
                <Card className="glass">
                  <CardHeader>
                    <CardTitle>Konum</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-0">
                    <div className="aspect-video bg-neutral-200 dark:bg-neutral-800 rounded-lg overflow-hidden mb-4">
                      {/* TODO: Google Maps integration */}
                      <div className="w-full h-full flex items-center justify-center text-neutral-500">
                        <MapPin className="h-12 w-12" />
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-red-500 flex-shrink-0 mt-1" />
                      <div>
                        <p className="font-semibold">{EVENT.venue}</p>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          {EVENT.address}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* ATTENDEES */}
                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Katılımcılar ({EVENT.attendees.length})</span>
                      <Link href={`/events/${EVENT.id}/attendees`}>
                        <Button variant="ghost" size="sm">Tümünü Gör</Button>
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-0">
                    <div className="flex flex-wrap gap-3">
                      {EVENT.attendees.slice(0, 12).map((attendee, idx) => (
                        <div key={idx} className="text-center">
                          <Avatar
                            src={attendee.avatar}
                            fallback={attendee.name}
                            size="md"
                            className="mb-1"
                          />
                          <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-[60px] truncate">
                            {attendee.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* COMMENTS */}
                <Card className="glass">
                  <CardHeader>
                    <CardTitle>Yorumlar ({EVENT.comments.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-0 space-y-4">
                    {/* Add Comment */}
                    <div className="flex gap-3">
                      <Avatar src="/avatar-placeholder.jpg" fallback="Sen" size="md" />
                      <div className="flex-1">
                        <Textarea
                          placeholder="Yorum yaz..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          rows={3}
                        />
                        <div className="flex justify-end mt-2">
                          <Button 
                            variant="primary" 
                            size="sm"
                            onClick={handleComment}
                            disabled={!comment.trim()}
                          >
                            Gönder
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Comments List */}
                    <div className="space-y-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                      {EVENT.comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <Avatar src={comment.avatar} fallback={comment.name} size="md" />
                          <div className="flex-1">
                            <div className="bg-neutral-100 dark:bg-neutral-900 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <p className="font-semibold text-sm">{comment.name}</p>
                                <span className="text-xs text-neutral-500">{comment.timestamp}</span>
                              </div>
                              <p className="text-sm text-neutral-700 dark:text-neutral-300">
                                {comment.text}
                              </p>
                            </div>
                            <div className="flex items-center gap-4 mt-2 px-4">
                              <button className="text-xs text-neutral-500 hover:text-red-500">
                                Beğen ({comment.likes})
                              </button>
                              <button className="text-xs text-neutral-500 hover:text-blue-500">
                                Yanıtla
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* SIDEBAR */}
              <div className="space-y-6">
                {/* JOIN CARD */}
                <Card className="glass sticky top-20">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Date & Time */}
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center flex-shrink-0">
                          <Calendar className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold">Tarih & Saat</p>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            {EVENT.date}
                          </p>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            {EVENT.time}
                          </p>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center flex-shrink-0">
                          <MapPin className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <p className="font-semibold">Konum</p>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            {EVENT.location}
                          </p>
                        </div>
                      </div>

                      {/* Attendees */}
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-green-50 dark:bg-green-950/30 flex items-center justify-center flex-shrink-0">
                          <Users className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold">Katılımcılar</p>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            {EVENT.attendees.length} / {EVENT.capacity} kişi
                          </p>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center flex-shrink-0">
                          <DollarSign className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-semibold">Fiyat</p>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            {EVENT.isPaid ? `$${EVENT.price}` : "Ücretsiz"}
                          </p>
                        </div>
                      </div>

                      <Button
                        variant={isAttending ? "outline" : "primary"}
                        className="w-full mt-4"
                        size="lg"
                        onClick={handleJoin}
                      >
                        {isAttending ? (
                          <>
                            <CheckCircle2 size={20} className="mr-2" />
                            Katılıyorsun
                          </>
                        ) : (
                          "Etkinliğe Katıl"
                        )}
                      </Button>

                      {isAttending && (
                        <p className="text-xs text-center text-neutral-500">
                          Takvime ekle veya organizatörle iletişime geç
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* ORGANIZER CARD */}
                <Card className="glass">
                  <CardHeader>
                    <CardTitle>Organizatör</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-0">
                    <div className="text-center mb-4">
                      <Avatar
                        src={EVENT.organizer.avatar}
                        fallback={EVENT.organizer.name}
                        size="xl"
                        className="mx-auto mb-3"
                      />
                      <h3 className="font-bold">{EVENT.organizer.name}</h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {EVENT.organizer.title}
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-4 mb-4 text-sm">
                      <div className="text-center">
                        <div className="font-bold text-blue-600">{EVENT.organizer.events}</div>
                        <div className="text-xs text-neutral-500">Etkinlik</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-green-600">{EVENT.organizer.followers}</div>
                        <div className="text-xs text-neutral-500">Takipçi</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button variant="outline" className="w-full gap-2" size="sm">
                        <MessageCircle size={16} />
                        Mesaj Gönder
                      </Button>
                      <Button variant="outline" className="w-full gap-2" size="sm">
                        <Users size={16} />
                        Takip Et
                      </Button>
                    </div>

                    {/* Social Links */}
                    {EVENT.organizer.socialLinks && (
                      <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                        {EVENT.organizer.socialLinks.website && (
                          <a href={EVENT.organizer.socialLinks.website} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="icon">
                              <Globe size={18} />
                            </Button>
                          </a>
                        )}
                        {EVENT.organizer.socialLinks.email && (
                          <a href={`mailto:${EVENT.organizer.socialLinks.email}`}>
                            <Button variant="ghost" size="icon">
                              <Mail size={18} />
                            </Button>
                          </a>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* SIMILAR EVENTS */}
                <Card className="glass">
                  <CardHeader>
                    <CardTitle>Benzer Etkinlikler</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-0 space-y-4">
                    {SIMILAR_EVENTS.map((event) => (
                      <Link 
                        key={event.id} 
                        href={`/events/${event.id}`}
                        className="block group"
                      >
                        <div className="flex gap-3 p-3 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-smooth">
                          <img 
                            src={event.image} 
                            alt={event.title}
                            className="w-20 h-20 rounded-lg object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm mb-1 truncate group-hover:text-blue-600 transition-smooth">
                              {event.title}
                            </h4>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400">
                              {event.date}
                            </p>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400">
                              {event.attendees} katılımcı
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// MOCK DATA
const EVENT = {
  id: 1,
  title: "NYC Turkish Coffee & Networking",
  category: "Sosyal",
  date: "28 Ocak 2025, Cumartesi",
  day: "28",
  month: "JAN",
  time: "14:00 - 17:00",
  location: "Manhattan, New York",
  venue: "Turkish Cultural Center",
  address: "821 United Nations Plaza, New York, NY 10017",
  attendees: [
    { name: "Ahmet Y.", avatar: "/avatars/1.jpg" },
    { name: "Zeynep K.", avatar: "/avatars/2.jpg" },
    { name: "Mehmet S.", avatar: "/avatars/3.jpg" },
    { name: "Elif D.", avatar: "/avatars/4.jpg" },
    { name: "Can Ö.", avatar: "/avatars/5.jpg" },
    { name: "Ayşe K.", avatar: "/avatars/6.jpg" },
    { name: "Burak T.", avatar: "/avatars/7.jpg" },
    { name: "Selin Y.", avatar: "/avatars/8.jpg" },
  ],
  capacity: 50,
  isPaid: false,
  price: 0,
  image: "/events/coffee.jpg",
  description: "New York'ta yaşayan Türklerle bir araya gelip Türk kahvesi eşliğinde sohbet edeceğimiz, networking yapabileceğimiz keyifli bir etkinlik. Hem yeni insanlarla tanışma hem de mevcut arkadaşlıkları güçlendirme fırsatı!",
  agenda: [
    "Türk kahvesi ikramı ve karşılama",
    "Katılımcılarla tanışma ve networking",
    "Grup aktiviteleri ve oyunlar",
    "Serbest sohbet ve fotoğraf çekimi"
  ],
  requirements: [
    "Etkinlik ücretsizdir ancak yer sınırlıdır",
    "Lütfen zamanında gelin",
    "Rahat kıyafetler önerilir"
  ],
  organizer: {
    name: "Zeynep Kaya",
    avatar: "/avatars/zeynep.jpg",
    title: "Community Manager",
    isVerified: true,
    events: 12,
    followers: 450,
    socialLinks: {
      website: "https://example.com",
      email: "zeynep@example.com"
    }
  },
  comments: [
    {
      id: 1,
      name: "Ahmet Yılmaz",
      avatar: "/avatars/ahmet.jpg",
      text: "Harika bir etkinlik olacak gibi! Kesinlikle katılacağım 🎉",
      timestamp: "2 saat önce",
      likes: 5
    },
    {
      id: 2,
      name: "Elif Demir",
      avatar: "/avatars/elif.jpg",
      text: "Park yeri var mı acaba?",
      timestamp: "1 saat önce",
      likes: 2
    }
  ]
};

const SIMILAR_EVENTS = [
  {
    id: 2,
    title: "Brooklyn Brunch Meetup",
    date: "5 Şubat",
    attendees: 18,
    image: "/events/brunch.jpg"
  },
  {
    id: 3,
    title: "Central Park Yürüyüşü",
    date: "12 Şubat",
    attendees: 25,
    image: "/events/walk.jpg"
  }
];
