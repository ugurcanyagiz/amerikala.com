// User roles
export type UserRole = 'user' | 'moderator' | 'admin';

// Profile type - role is optional since it might not exist in DB yet
export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  show_full_name: boolean;
  city: string | null;
  state: string | null;
  profession: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_image_url: string | null;
  website: string | null;
  role?: UserRole;
  is_verified: boolean;
  follower_count: number;
  following_count: number;
  created_at: string;
  updated_at: string;
}

// Post type
export interface Post {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: Profile;
  likes?: Like[];
  post_hashtags?: PostHashtag[];
}

// Like type
export interface Like {
  post_id: string;
  user_id: string;
  created_at: string;
}

// PostHashtag type
export interface PostHashtag {
  post_id: string;
  tag: string;
}

// Auth User with Profile
export interface AuthUser {
  id: string;
  email: string;
  profile: Profile | null;
}

// =============================================
// EVENT TYPES
// =============================================

export type EventStatus = 'pending' | 'approved' | 'rejected';

export type EventCategory = 
  | 'social'
  | 'business'
  | 'cultural'
  | 'sports'
  | 'education'
  | 'food'
  | 'travel'
  | 'other';

export type AttendanceStatus = 'pending' | 'going' | 'interested' | 'not_going' | 'rejected';

export interface Event {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  event_date: string;
  start_time: string;
  end_time: string | null;
  location_name: string;
  address: string | null;
  city: string;
  state: string;
  zip_code: string | null;
  is_online: boolean;
  online_url: string | null;
  max_attendees: number | null;
  current_attendees: number;
  is_free: boolean;
  price: number | null;
  cover_image_url: string | null;
  status: EventStatus;
  rejection_reason: string | null;
  organizer_id: string;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  organizer?: Profile;
  attendees?: EventAttendee[];
}

export interface EventAttendee {
  event_id: string;
  user_id: string;
  status: AttendanceStatus;
  created_at: string;
  // Joined data
  profile?: Profile;
}

// Event category labels
export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  social: 'Sosyal Buluşma',
  business: 'İş & Networking',
  cultural: 'Kültürel',
  sports: 'Spor',
  education: 'Eğitim & Workshop',
  food: 'Yemek & Kahve',
  travel: 'Gezi & Seyahat',
  other: 'Diğer',
};

// Event category icons (emoji)
export const EVENT_CATEGORY_ICONS: Record<EventCategory, string> = {
  social: '🎉',
  business: '💼',
  cultural: '🎭',
  sports: '⚽',
  education: '📚',
  food: '🍽️',
  travel: '✈️',
  other: '📌',
};

// Event category colors
export const EVENT_CATEGORY_COLORS: Record<EventCategory, string> = {
  social: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  business: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  cultural: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  sports: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  education: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  food: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  travel: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  other: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
};

// Event status labels
export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  pending: 'Onay Bekliyor',
  approved: 'Onaylandı',
  rejected: 'Reddedildi',
};

// Event status colors
export const EVENT_STATUS_COLORS: Record<EventStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

// =============================================
// GROUP TYPES
// =============================================

export type GroupStatus = 'pending' | 'approved' | 'rejected';

export type GroupCategory = 
  | 'social'
  | 'professional'
  | 'hobby'
  | 'sports'
  | 'education'
  | 'culture'
  | 'family'
  | 'travel'
  | 'food'
  | 'tech'
  | 'other';

export type MemberRole = 'member' | 'moderator' | 'admin';

export interface Group {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: GroupCategory;
  city: string | null;
  state: string | null;
  is_nationwide: boolean;
  avatar_url: string | null;
  cover_image_url: string | null;
  is_private: boolean;
  requires_approval: boolean;
  application_question: string | null;
  member_count: number;
  status: GroupStatus;
  rejection_reason: string | null;
  created_by: string;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  creator?: Profile;
  members?: GroupMember[];
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  role: MemberRole;
  status: string;
  joined_at: string;
  // Joined data
  profile?: Profile;
}

export interface GroupJoinRequest {
  id: string;
  group_id: string;
  user_id: string;
  answer: string | null;
  status: "pending" | "approved" | "rejected";
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  user?: Profile;
}

export interface GroupPost extends Post {
  group_id: string;
  profiles?: Profile;
  likes?: Like[];
}

// Group category labels
export const GROUP_CATEGORY_LABELS: Record<GroupCategory, string> = {
  social: 'Sosyal',
  professional: 'Profesyonel & İş',
  hobby: 'Hobi',
  sports: 'Spor & Fitness',
  education: 'Eğitim & Öğrenme',
  culture: 'Kültür & Sanat',
  family: 'Aile & Çocuk',
  travel: 'Gezi & Seyahat',
  food: 'Yemek & Mutfak',
  tech: 'Teknoloji',
  other: 'Diğer',
};

// Group category icons (emoji)
export const GROUP_CATEGORY_ICONS: Record<GroupCategory, string> = {
  social: '👋',
  professional: '💼',
  hobby: '🎨',
  sports: '🏃',
  education: '📖',
  culture: '🎭',
  family: '👨‍👩‍👧‍👦',
  travel: '🌍',
  food: '🍳',
  tech: '💻',
  other: '📌',
};

// Group category colors
export const GROUP_CATEGORY_COLORS: Record<GroupCategory, string> = {
  social: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  professional: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  hobby: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  sports: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  education: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  culture: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  family: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  travel: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  food: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  tech: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
  other: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
};

// Group status labels (same as event)
export const GROUP_STATUS_LABELS: Record<GroupStatus, string> = {
  pending: 'Onay Bekliyor',
  approved: 'Onaylandı',
  rejected: 'Reddedildi',
};

// Group status colors (same as event)
export const GROUP_STATUS_COLORS: Record<GroupStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

// Member role labels
export const MEMBER_ROLE_LABELS: Record<MemberRole, string> = {
  member: 'Üye',
  moderator: 'Moderatör',
  admin: 'Yönetici',
};

// =============================================
// LISTING (EMLAK) TYPES
// =============================================

export type ListingType = 'rent' | 'sale' | 'roommate';

export type RoommateType = 'looking_for_room' | 'looking_for_roommate';

export type PropertyType = 
  | 'apartment'
  | 'house'
  | 'condo'
  | 'townhouse'
  | 'studio'
  | 'room'
  | 'basement'
  | 'shared';

export type ListingStatus = 'pending' | 'approved' | 'rejected' | 'rented' | 'sold' | 'closed';

export interface Listing {
  id: string;
  listing_type: ListingType;
  roommate_type: RoommateType | null;
  title: string;
  description: string;
  property_type: PropertyType;
  bedrooms: number;
  bathrooms: number;
  sqft: number | null;
  price: number;
  deposit: number | null;
  utilities_included: boolean;
  address: string;
  city: string;
  state: string;
  zip_code: string | null;
  neighborhood: string | null;
  latitude: number | null;
  longitude: number | null;
  available_date: string | null;
  lease_term: string | null;
  pet_policy: string | null;
  parking: string | null;
  laundry: string | null;
  current_occupants: number;
  preferred_gender: string | null;
  preferred_age_min: number | null;
  preferred_age_max: number | null;
  move_in_date: string | null;
  amenities: string[];
  images: string[];
  status: ListingStatus;
  rejection_reason: string | null;
  user_id: string;
  approved_by: string | null;
  approved_at: string | null;
  show_phone: boolean;
  show_email: boolean;
  contact_phone: string | null;
  contact_email: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string;
  view_count: number;
  // Joined data
  user?: Profile;
}

export interface ListingFavorite {
  listing_id: string;
  user_id: string;
  created_at: string;
}

export interface ListingMessage {
  id: string;
  listing_id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  // Joined data
  sender?: Profile;
  receiver?: Profile;
}

// Listing type labels
export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  rent: 'Kiralık',
  sale: 'Satılık',
  roommate: 'Ev Arkadaşı',
};

// Listing type icons
export const LISTING_TYPE_ICONS: Record<ListingType, string> = {
  rent: '🏠',
  sale: '🏡',
  roommate: '👥',
};

// Listing type colors
export const LISTING_TYPE_COLORS: Record<ListingType, string> = {
  rent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  sale: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  roommate: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

// Roommate type labels
export const ROOMMATE_TYPE_LABELS: Record<RoommateType, string> = {
  looking_for_room: 'Ev Arıyorum',
  looking_for_roommate: 'Ev Arkadaşı Arıyorum',
};

// Roommate type icons
export const ROOMMATE_TYPE_ICONS: Record<RoommateType, string> = {
  looking_for_room: '🔍',
  looking_for_roommate: '🙋',
};

// Property type labels
export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  apartment: 'Daire',
  house: 'Müstakil Ev',
  condo: 'Konut',
  townhouse: 'Sıra Ev',
  studio: 'Stüdyo',
  room: 'Oda',
  basement: 'Bodrum Kat',
  shared: 'Paylaşımlı',
};

// Property type icons
export const PROPERTY_TYPE_ICONS: Record<PropertyType, string> = {
  apartment: '🏢',
  house: '🏠',
  condo: '🏬',
  townhouse: '🏘️',
  studio: '🛏️',
  room: '🚪',
  basement: '🪜',
  shared: '👫',
};

// Listing status labels
export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  pending: 'Onay Bekliyor',
  approved: 'Aktif',
  rejected: 'Reddedildi',
  rented: 'Kiralandı',
  sold: 'Satıldı',
  closed: 'Kapatıldı',
};

// Listing status colors
export const LISTING_STATUS_COLORS: Record<ListingStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  rented: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  sold: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  closed: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400',
};

// Amenities list
export const AMENITIES_LIST = [
  { value: 'ac', label: 'Klima', icon: '❄️' },
  { value: 'heating', label: 'Isıtma', icon: '🔥' },
  { value: 'washer', label: 'Çamaşır Makinesi', icon: '🧺' },
  { value: 'dryer', label: 'Kurutma Makinesi', icon: '👕' },
  { value: 'dishwasher', label: 'Bulaşık Makinesi', icon: '🍽️' },
  { value: 'wifi', label: 'WiFi', icon: '📶' },
  { value: 'parking', label: 'Otopark', icon: '🅿️' },
  { value: 'gym', label: 'Spor Salonu', icon: '🏋️' },
  { value: 'pool', label: 'Havuz', icon: '🏊' },
  { value: 'balcony', label: 'Balkon', icon: '🌅' },
  { value: 'garden', label: 'Bahçe', icon: '🌳' },
  { value: 'elevator', label: 'Asansör', icon: '🛗' },
  { value: 'doorman', label: 'Kapıcı', icon: '🚪' },
  { value: 'furnished', label: 'Eşyalı', icon: '🛋️' },
  { value: 'storage', label: 'Depo', icon: '📦' },
  { value: 'pet_friendly', label: 'Evcil Hayvan OK', icon: '🐾' },
  { value: 'smoke_free', label: 'Sigara Yasak', icon: '🚭' },
  { value: 'security', label: 'Güvenlik', icon: '🔒' },
];

// Pet policy options
export const PET_POLICY_OPTIONS = [
  { value: 'no', label: 'Hayır' },
  { value: 'cats', label: 'Sadece Kedi' },
  { value: 'dogs', label: 'Sadece Köpek' },
  { value: 'small', label: 'Küçük Hayvanlar' },
  { value: 'all', label: 'Tümü OK' },
];

// Parking options
export const PARKING_OPTIONS = [
  { value: 'none', label: 'Yok' },
  { value: 'street', label: 'Sokak' },
  { value: 'lot', label: 'Açık Otopark' },
  { value: 'garage', label: 'Garaj' },
  { value: 'covered', label: 'Kapalı Otopark' },
];

// Laundry options
export const LAUNDRY_OPTIONS = [
  { value: 'none', label: 'Yok' },
  { value: 'in_unit', label: 'Dairede' },
  { value: 'in_building', label: 'Binada' },
  { value: 'nearby', label: 'Yakında' },
];

// Lease term options
export const LEASE_TERM_OPTIONS = [
  { value: 'month', label: 'Aylık' },
  { value: '3months', label: '3 Ay' },
  { value: '6months', label: '6 Ay' },
  { value: '1year', label: '1 Yıl' },
  { value: '2years', label: '2 Yıl' },
  { value: 'flexible', label: 'Esnek' },
];

// Gender preference options
export const GENDER_PREFERENCE_OPTIONS = [
  { value: 'any', label: 'Farketmez' },
  { value: 'male', label: 'Erkek' },
  { value: 'female', label: 'Kadın' },
];

// =============================================
// ROLE PERMISSIONS
// =============================================

export const ROLE_PERMISSIONS = {
  user: {
    canDeleteOwnPosts: true,
    canDeleteAnyPost: false,
    canEditOwnProfile: true,
    canEditAnyProfile: false,
    canChangeRoles: false,
    canAccessAdminPanel: false,
    canApproveEvents: false,
    canApproveGroups: false,
    canApproveListings: false,
  },
  moderator: {
    canDeleteOwnPosts: true,
    canDeleteAnyPost: true,
    canEditOwnProfile: true,
    canEditAnyProfile: false,
    canChangeRoles: false,
    canAccessAdminPanel: true,
    canApproveEvents: true,
    canApproveGroups: true,
    canApproveListings: true,
  },
  admin: {
    canDeleteOwnPosts: true,
    canDeleteAnyPost: true,
    canEditOwnProfile: true,
    canEditAnyProfile: true,
    canChangeRoles: true,
    canAccessAdminPanel: true,
    canApproveEvents: true,
    canApproveGroups: true,
    canApproveListings: true,
  },
} as const;

// Helper function to check permission
export function hasPermission(
  role: UserRole | undefined,
  permission: keyof typeof ROLE_PERMISSIONS.user
): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role][permission];
}

// Role display names
export const ROLE_LABELS: Record<UserRole, string> = {
  user: 'Kullanıcı',
  moderator: 'Moderatör',
  admin: 'Admin',
};

// Role badge colors
export const ROLE_COLORS: Record<UserRole, string> = {
  user: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
  moderator: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

// US States
export const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
];

export const US_STATES_MAP: Record<string, string> = Object.fromEntries(
  US_STATES.map(s => [s.value, s.label])
);

// =============================================
// JOB TYPES
// =============================================

export type JobType = 'fulltime' | 'parttime' | 'contract' | 'freelance' | 'internship';
export type JobCategory = 'tech' | 'healthcare' | 'finance' | 'service' | 'restaurant' | 'construction' | 'retail' | 'education' | 'other';
export type JobListingType = 'seeking_job' | 'hiring';
export type JobStatus = 'pending' | 'approved' | 'rejected' | 'filled' | 'closed';

export interface JobListing {
  id: string;
  listing_type: JobListingType;
  title: string;
  description: string;
  category: JobCategory;
  job_type: JobType;
  company_name: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_type: 'hourly' | 'yearly' | null;
  city: string;
  state: string;
  is_remote: boolean;
  experience_level: string | null;
  skills: string[];
  benefits: string[];
  contact_email: string | null;
  contact_phone: string | null;
  website_url: string | null;
  status: JobStatus;
  user_id: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
  view_count: number;
  // Joined data
  user?: Profile;
}

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  fulltime: 'Tam Zamanlı',
  parttime: 'Yarı Zamanlı',
  contract: 'Sözleşmeli',
  freelance: 'Freelance',
  internship: 'Staj',
};

export const JOB_CATEGORY_LABELS: Record<JobCategory, string> = {
  tech: 'Teknoloji',
  healthcare: 'Sağlık',
  finance: 'Finans',
  service: 'Hizmet',
  restaurant: 'Restoran',
  construction: 'İnşaat',
  retail: 'Perakende',
  education: 'Eğitim',
  other: 'Diğer',
};

export const JOB_CATEGORY_ICONS: Record<JobCategory, string> = {
  tech: '💻',
  healthcare: '🏥',
  finance: '📊',
  service: '🛎️',
  restaurant: '🍽️',
  construction: '🔨',
  retail: '🛒',
  education: '📚',
  other: '💼',
};

export const JOB_LISTING_TYPE_LABELS: Record<JobListingType, string> = {
  seeking_job: 'İş Arıyorum',
  hiring: 'İşçi Arıyorum',
};

// =============================================
// MARKETPLACE TYPES
// =============================================

export type MarketplaceCategory = 'araba' | 'elektronik' | 'giyim' | 'mobilya' | 'hizmet' | 'diger';
export type MarketplaceStatus = 'pending' | 'approved' | 'rejected' | 'sold' | 'closed';
export type MarketplaceCondition = 'new' | 'like_new' | 'good' | 'fair' | 'for_parts';

export interface MarketplaceListing {
  id: string;
  title: string;
  description: string;
  category: MarketplaceCategory;
  condition: MarketplaceCondition;
  price: number;
  is_negotiable: boolean;
  city: string;
  state: string;
  images: string[];
  contact_phone: string | null;
  contact_email: string | null;
  status: MarketplaceStatus;
  user_id: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
  view_count: number;
  // Joined data
  user?: Profile;
}

export const MARKETPLACE_CATEGORY_LABELS: Record<MarketplaceCategory, string> = {
  araba: 'Araba',
  elektronik: 'Elektronik',
  giyim: 'Giyim',
  mobilya: 'Mobilya',
  hizmet: 'Hizmet',
  diger: 'Diğer',
};

export const MARKETPLACE_CATEGORY_ICONS: Record<MarketplaceCategory, string> = {
  araba: '🚗',
  elektronik: '💻',
  giyim: '👕',
  mobilya: '🛋️',
  hizmet: '🔧',
  diger: '📦',
};

export const MARKETPLACE_CONDITION_LABELS: Record<MarketplaceCondition, string> = {
  new: 'Sıfır',
  like_new: 'Sıfır Gibi',
  good: 'İyi',
  fair: 'Orta',
  for_parts: 'Parça İçin',
};
