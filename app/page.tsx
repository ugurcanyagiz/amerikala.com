"use client";

import Link from "next/link";
import { 
  Calendar,
  Users,
  MapPin,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Building2,
  Briefcase,
  ShoppingBag,
  MessageCircle,
  Star,
  type LucideIcon,
} from "lucide-react";
import Sidebar from "./components/Sidebar";
import { Button } from "./components/ui/Button";
import { Card, CardContent } from "./components/ui/Card";
import { Avatar } from "./components/ui/Avatar";
import { Badge } from "./components/ui/Badge";
import { useLanguage } from "./contexts/LanguageContext";

// Types
interface TrendingEvent {
  id: number;
  title: string;
  day: string;
  month: string;
  location: string;
  category: string;
  attendees: number;
  image: string;
  organizer: {
    name: string;
    avatar: string;
  };
}

interface Testimonial {
  name: string;
  location: string;
  avatar: string;
  text: string;
}

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="min-h-[calc(100vh-65px)] bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <div className="flex">
        <Sidebar />

        <main className="flex-1">
          {/* HERO SECTION */}
          <section className="relative overflow-hidden min-h-[600px] flex items-center">
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: 'url(/background.png)' }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
            <div className="absolute inset-0 gradient-mesh opacity-20" />
            
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 w-full">
              <div className="text-center">
                <Badge variant="primary" size="lg" className="mb-6 animate-fade-in shadow-lg">
                  <Sparkles className="h-4 w-4 mr-2" />
                  {t("home.hero.badge")}
                </Badge>
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 animate-slide-up text-white drop-shadow-2xl">
                  {t("home.hero.title")}
                </h1>
                
                <p className="text-lg sm:text-xl text-white/90 max-w-3xl mx-auto mb-8 animate-slide-up drop-shadow-lg">
                  {t("home.hero.subtitle")}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-4 animate-fade-in">
                  <Link href="/meetups">
                    <Button variant="primary" size="lg" className="gap-2 shadow-xl">
                      {t("home.hero.cta1")}
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/groups">
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="gap-2 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 shadow-xl"
                    >
                      {t("home.hero.cta2")}
                      <Users className="h-5 w-5" />
                    </Button>
                  </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-4xl mx-auto">
                  <StatCard number="2,500+" label={t("home.stats.members")} icon={Users} />
                  <StatCard number="150+" label={t("home.stats.events")} icon={Calendar} />
                  <StatCard number="45" label={t("home.stats.cities")} icon={MapPin} />
                  <StatCard number="80+" label={t("home.stats.groups")} icon={TrendingUp} />
                </div>
              </div>
            </div>
          </section>

          {/* FEATURES SECTION */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                {t("home.features.title")}
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                {t("home.features.subtitle")}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                icon={Calendar}
                title={t("home.features.events.title")}
                description={t("home.features.events.description")}
                href="/meetups"
                gradient="from-blue-400 to-blue-600"
              />
              
              <FeatureCard
                icon={Users}
                title={t("home.features.groups.title")}
                description={t("home.features.groups.description")}
                href="/groups"
                gradient="from-purple-400 to-purple-600"
              />
              
              <FeatureCard
                icon={MessageCircle}
                title={t("home.features.chat.title")}
                description={t("home.features.chat.description")}
                href="/messages"
                gradient="from-green-400 to-green-600"
              />
              
              <FeatureCard
                icon={Building2}
                title={t("home.features.realestate.title")}
                description={t("home.features.realestate.description")}
                href="/emlak"
                gradient="from-orange-400 to-orange-600"
              />
              
              <FeatureCard
                icon={Briefcase}
                title={t("home.features.jobs.title")}
                description={t("home.features.jobs.description")}
                href="/is"
                gradient="from-red-400 to-red-600"
              />
              
              <FeatureCard
                icon={ShoppingBag}
                title={t("home.features.marketplace.title")}
                description={t("home.features.marketplace.description")}
                href="/alisveris"
                gradient="from-pink-400 to-pink-600"
              />
            </div>
          </section>

          {/* TRENDING SECTION */}
          <section className="bg-white/50 dark:bg-neutral-900/50 backdrop-blur-lg py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold flex items-center gap-3">
                    <TrendingUp className="h-8 w-8 text-red-500" />
                    {t("home.trending.title")}
                  </h2>
                  <p className="text-neutral-600 dark:text-neutral-400 mt-2">
                    {t("home.trending.subtitle")}
                  </p>
                </div>
                <Link href="/events">
                  <Button variant="outline">{t("home.trending.viewAll")}</Button>
                </Link>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {TRENDING_EVENTS.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          </section>

          {/* TESTIMONIALS */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                {t("home.testimonials.title")}
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {TESTIMONIALS.map((testimonial, idx) => (
                <TestimonialCard key={idx} testimonial={testimonial} />
              ))}
            </div>
          </section>

          {/* CTA SECTION */}
          <section className="relative overflow-hidden py-20">
            <div className="absolute inset-0 gradient-mesh opacity-40" />
            
            <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                {t("home.cta.title")}
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8">
                {t("home.cta.subtitle")}
              </p>
              <Link href="/login">
                <Button variant="primary" size="lg" className="gap-2">
                  {t("home.cta.button")}
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

// COMPONENTS
function StatCard({ number, label, icon: Icon }: { number: string; label: string; icon: LucideIcon }) {
  return (
    <Card className="glass text-center hover:scale-105 transition-smooth backdrop-blur-xl bg-white/20 border-white/30">
      <CardContent className="p-6">
        <Icon className="h-8 w-8 mx-auto mb-2 text-white drop-shadow-lg" />
        <div className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg mb-1">{number}</div>
        <div className="text-sm text-white/80 drop-shadow-md">{label}</div>
      </CardContent>
    </Card>
  );
}

function FeatureCard({ 
  icon: Icon, 
  title, 
  description, 
  href, 
  gradient 
}: { 
  icon: LucideIcon; 
  title: string; 
  description: string; 
  href: string; 
  gradient: string;
}) {
  return (
    <Link href={href}>
      <Card className="glass h-full hover:shadow-xl hover:scale-105 transition-smooth group cursor-pointer">
        <CardContent className="p-6">
          <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-smooth`}>
            <Icon className="h-7 w-7 text-white" />
          </div>
          <h3 className="text-xl font-bold mb-2">{title}</h3>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function EventCard({ event }: { event: TrendingEvent }) {
  const { t } = useLanguage();
  
  return (
    <Card className="glass hover:shadow-xl transition-smooth group cursor-pointer">
      <div className="relative h-48 overflow-hidden rounded-t-xl">
        <img 
          src={event.image} 
          alt={event.title} 
          className="w-full h-full object-cover group-hover:scale-110 transition-smooth"
        />
        <Badge variant="primary" className="absolute top-4 right-4">
          {event.attendees} {t("events.attendees")}
        </Badge>
      </div>
      <CardContent className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="text-center flex-shrink-0">
            <div className="text-xs font-semibold text-red-500">{event.month}</div>
            <div className="text-2xl font-bold">{event.day}</div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg mb-2 truncate">{event.title}</h3>
            <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 mb-1">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
              <Users className="h-4 w-4 flex-shrink-0" />
              <span>{event.category}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
          <Avatar src={event.organizer.avatar} fallback={event.organizer.name} size="sm" />
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            by {event.organizer.name}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <Card className="glass h-full">
      <CardContent className="p-6">
        <div className="flex gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
          ))}
        </div>
        <p className="text-neutral-700 dark:text-neutral-300 mb-4 italic">
          &quot;{testimonial.text}&quot;
        </p>
        <div className="flex items-center gap-3">
          <Avatar src={testimonial.avatar} fallback={testimonial.name} size="md" />
          <div>
            <p className="font-semibold">{testimonial.name}</p>
            <p className="text-sm text-neutral-500">{testimonial.location}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// MOCK DATA
const TRENDING_EVENTS: TrendingEvent[] = [
  {
    id: 1,
    title: "NYC Turkish Coffee & Networking",
    day: "28",
    month: "JAN",
    location: "Manhattan, New York",
    category: "Sosyal",
    attendees: 24,
    image: "/events/coffee.jpg",
    organizer: {
      name: "Zeynep K.",
      avatar: "/avatars/zeynep.jpg"
    }
  },
  {
    id: 2,
    title: "Bay Area Tech Meetup",
    day: "02",
    month: "FEB",
    location: "San Francisco, CA",
    category: "Kariyer",
    attendees: 45,
    image: "/events/tech.jpg",
    organizer: {
      name: "Ahmet Y.",
      avatar: "/avatars/ahmet.jpg"
    }
  },
  {
    id: 3,
    title: "LA Hiking & Brunch",
    day: "05",
    month: "FEB",
    location: "Griffith Park, LA",
    category: "Spor & Aktivite",
    attendees: 18,
    image: "/events/hiking.jpg",
    organizer: {
      name: "Elif D.",
      avatar: "/avatars/elif.jpg"
    }
  },
];

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Mehmet Şahin",
    location: "Boston, MA",
    avatar: "/avatars/mehmet.jpg",
    text: "AmerikaLa sayesinde Boston'daki Türk topluluğunu buldum. Artık hafta sonları yalnız geçmiyor!"
  },
  {
    name: "Ayşe Kara",
    location: "Chicago, IL",
    avatar: "/avatars/ayse.jpg",
    text: "İş değiştirdikten sonra yeni arkadaşlar edinmem için harika bir platform oldu. Teşekkürler!"
  },
  {
    name: "Can Özdemir",
    location: "Seattle, WA",
    avatar: "/avatars/can.jpg",
    text: "Burada düzenlediğim etkinliklerle 50'den fazla insanla tanıştım. Gerçek bir topluluk!"
  },
];
