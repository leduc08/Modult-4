export type Region = 'Bắc' | 'Trung' | 'Nam' | 'Tây Nguyên' | 'Tây Nam Bộ';

export type TravelStyle = 'Nghỉ dưỡng & Chill' | 'Phượt & Khám phá' | 'Foodie & Ẩm thực' | 'Văn hóa & Di sản' | 'Sống ảo & Check-in' | 'Gia đình & Trẻ nhỏ';

export type CompanionType = 'Một mình (Solo)' | 'Cặp đôi (Couple)' | 'Nhóm bạn (Friends)' | 'Gia đình có trẻ nhỏ/người lớn';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface POI {
  id: string;
  name: string;
  category: 'Thiên nhiên' | 'Di sản & Văn hóa' | 'Tâm linh' | 'Check-in' | 'Mạo hiểm' | 'Giải trí';
  coordinates: Coordinates;
  address: string;
  openingHours: string;
  ticketPrice: number; // in VND
  priceDescription?: string;
  estimatedTime: string;
  description: string;
  imageUrl: string;
  tags: string[];
  localTips: string;
  rating: number;
  reviewCount: number;
}

export interface FoodSpot {
  id: string;
  name: string;
  dishName: string;
  category: 'Món chính' | 'Ăn vặt & Đường phố' | 'Tráng miệng' | 'Đặc sản làm quà' | 'Cà phê & Đồ uống';
  address: string;
  coordinates: Coordinates;
  priceRange: string;
  avgPrice: number;
  bestTime: string;
  isMustTry: boolean;
  isSeasonal: boolean;
  isLocalFavorite: boolean;
  description: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  signatureDish: string;
}

export interface Festival {
  id: string;
  name: string;
  provinceId: string;
  provinceName: string;
  solarDate: string;
  lunarDate: string;
  scale: 'Quốc gia' | 'Tỉnh' | 'Địa phương';
  description: string;
  highlights: string[];
  dressCode: string;
  etiquette: string;
  ticketPrice: number;
  imageUrl: string;
  coordinates?: Coordinates;
  isAnnual?: boolean;
}

export type FestivalEvent = Festival;

export interface Souvenir {
  id: string;
  name: string;
  provinceId: string;
  provinceName: string;
  standardPrice: string;
  shelfLife: string;
  isOCOP: boolean;
  ocopStars?: number;
  flightRule: 'Được xách tay' | 'Bắt buộc ký gửi đóng thùng xốp' | 'Cấm mang lên máy bay' | 'Ký gửi có điều kiện';
  flightNote: string;
  trustedAddresses: string[];
  imageUrl: string;
}

export type SouvenirItem = Souvenir;

export interface TravelTip {
  id: string;
  title: string;
  category: 'timing' | 'finance' | 'food' | 'safety' | 'transport' | 'culture' | 'an_toan' | 'tai_chinh' | 'hang_khong' | 'thoi_tiet' | 'am_thuc' | 'van_hoa';
  provinceId?: string;
  provinceName?: string;
  content: string;
  importance: 'Cao' | 'Trung bình' | 'Khẩn cấp';
  tags: string[];
  isSafetyAlert?: boolean;
}

export interface Province {
  id: string;
  name: string;
  region: Region;
  coordinates: Coordinates;
  tagline: string;
  description: string;
  bestMonths: string;
  weatherSummary: string;
  cultureHistory: string;
  culturalTaboos: string[];
  transportation: {
    arrival: string[];
    localMove: string[];
    avgBikeRental: string;
    avgTaxiRate: string;
  };
  pois: POI[];
  foods: FoodSpot[];
  festivals: Festival[];
  souvenirs: Souvenir[];
  tips: TravelTip[];
  imageUrl: string;
}

export interface ItineraryItem {
  id: string;
  timeSlot: string;
  title: string;
  activityType: string;
  locationName: string;
  address?: string;
  coordinates?: Coordinates;
  estimatedCost: number;
  duration: string;
  notes: string;
  insiderTip?: string;
  poiId?: string;
  foodId?: string;
}

export interface ItineraryDay {
  dayNumber: number;
  dateStr?: string;
  theme: string;
  items: ItineraryItem[];
  dayCostEstimated: number;
}

export interface BudgetBreakdown {
  stay: number;
  food: number;
  transport: number;
  tickets: number;
  contingency: number;
}

export interface TripPlan {
  id: string;
  title: string;
  destination: string;
  provinceId: string;
  durationDays: number;
  travelStyle: TravelStyle;
  companion: CompanionType;
  totalBudget: number;
  budgetPerPerson: number;
  peopleCount: number;
  budgetBreakdown: BudgetBreakdown;
  days: ItineraryDay[];
  summaryAI: string;
  safetyAlerts: string[];
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  richData?: {
    pois?: POI[];
    foods?: FoodSpot[];
    tripPlan?: TripPlan;
    tips?: TravelTip[];
    festivals?: Festival[];
    souvenirs?: Souvenir[];
  };
  suggestedActions?: {
    label: string;
    action: string;
    payload?: any;
  }[];
}

export interface ExpenseItem {
  id: string;
  category: 'stay' | 'food' | 'transport' | 'tickets' | 'shopping' | 'contingency' | 'other';
  title: string;
  amount: number;
  date?: string;
  dayNumber?: number;
  timestamp?: string;
  paidBy?: string;
  paymentMethod?: 'cash' | 'transfer' | 'card';
  note?: string;
  receiptImage?: string;
  tripId?: string;
}

export interface TripBudget {
  id: string;
  name: string;
  destination: string;
  duration: string;
  totalBudget: number;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  primaryStyle: TravelStyle;
  dietaryRestrictions: string[];
  preferredPace: 'relaxed' | 'balanced' | 'intensive';
  visitedProvinces: string[];
  savedItems: string[];
}

export type LanguageCode = 'vi' | 'en' | 'ko' | 'ja' | 'zh';
