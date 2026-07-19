type UserRole = "superadmin" | "admin" | "modaretor" | "user";

export type PaginatedResponse<T> = {
  message: string;
  statusCode: number;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
export type UserTypes = {
  id: number;
  name: string;
  email: string;
  mobileNumber: string;
  roles?: UserRole[];
  isAdmin: boolean;
  profilePhoto?: Attachment;
  createdAt: string;
  updatedAt: string;
};
export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: Role;
  isVerified: boolean;
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
  mobileNumber: string;
  otp: string | null;
  otpExpiresAt: string;
  profilePhoto?: Attachment;
  isAdmin: boolean;
  orders?: Order[];
  addresses?: Address;
}

export interface CustomerData {
  id: number;
  name: string;
  email: string;
  mobileNumber: string;
  isVerified: boolean;
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
  role: {
    id: number;
    rolename: string;
    description: string;
    isActive: boolean;
  };
  addresses: Address[];
  profilePhoto?: {
    id: number;
    fileName: string;
    url: string;
  };
  orders: Order[];
}
export interface Brand {
  id: number;
  name: string;
  slug?: string;
  description: string;
  attachment: Attachment;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  products: Product[];
}
export interface Category {
  id: number;
  parentId: number | null;
  name: string;
  slug?: string;
  order: number;
  description: string;
  isMainCategory: boolean;
  parent: Category;
  children: [Category];
  attachment: Attachment;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  products: Product[];
  recipes: Recipe[];
}

export enum DiscountType {
  PERCENTAGE = "percentage",
  FIXED = "fixed",
}

export interface Gallery {
  id: number;
  name: string;
  description: string;

  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}
export interface Product {
  id: number;
  name: string;
  slug?: string;
  description: string;
  productDetails?: string;
  sellingPrice: number;
  purchasePrice: number;
  totalValueBySalePrice: number;
  totalValueByPurchasePrice: number;
  unit: Unit;
  supplier: Supplier;
  productSku: string;
  stock: number;
  weight: number | null;
  attachment: Attachment;
  gallery: Gallery;
  saleCount: number;
  isActive: boolean;
  isFeatured: boolean;
  tags?: string[];

  createdAt: string;
  updatedAt: string;
  brand: Brand;
  category: Category;
  createdBy: User;
  updatedBy: User;

  discountType?: DiscountType;
  discountValue?: number;
  discountStartDate?: string;
  discountEndDate?: string;
}

export interface ProductResponse {
  message: string;
  statusCode: number;
  data: Product | Product[];
}

export interface OrderResponse {
  message: string;
  statusCode: number;
  data: Order[];

  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
export interface BrandResponse {
  message: string;
  statusCode: number;
  data: Brand | Brand[];
}
export interface CategoryResponse {
  message: string;
  statusCode: number;
  data: Category | Category[];
}
export interface UserResponse {
  message: string;
  statusCode: number;
  data: UserTypes | UserTypes[];
}

export interface Attachment {
  id: number;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  key: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Unit {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedDate: string;
  createdBy: User;
  updatedBy: User;
}

export interface ApiResponseusers {
  message: string;
  statusCode: number;
  data: {
    customers: User[];
    users: User[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}
export type authResponse = {
  message: string;
  statusCode: number;
};

export interface MenuItem {
  parentId: number | null;
  id: number;
  name: string;
  icon: string | null;
  url: string;
  order: number;
  isMainMenu: boolean;
  isActive: boolean;
  isAdminMenu: boolean;
  children: MenuItem[];
}

export interface MenuTreeResponse {
  message: string;
  statusCode: number;
  data: MenuItem[];
}

export interface ApiResponse {
  data: [];
  message: string;
  statusCode: number;
}

export interface Role {
  id: number;
  rolename: string;
  description: string;
  isActive: boolean;
  createdAt: string;

  updatedDate: string;

  createdByUser: User;
  updatedBy: User;
}

export interface Supplier {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  isActive: boolean;
  products: Product[];
  attachment: Attachment;
  createdAt: string;
  updatedAt: string;
  createdBy: User;
  updatedBy: User;
}

export interface Banner {
  id: number;
  title: string;
  description: string;
  targetUrl: string;
  position: string;
  type: string;
  isActive: boolean;

  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  image: Attachment;
  createdBy: User;
  updatedBy: User;
}
export interface Client {
  Id: number;
  name: string;
  order: number;
  isActive: boolean;
  Image?: Attachment;

  createdAt?: string;
  updatedAt?: string;
}

export interface SalesPartner {
  Id: number;
  name: string;
  description: string;
  order: number;
  isActive: boolean;
  Image?: Attachment;

  createdAt?: string;
  updatedAt?: string;
  website: string;
}
export interface PurchaseItem {
  id: number;
  unitPrice: string;
  quantity: number;
  total: string;
  product: Product;
}
export interface Purchase {
  id: number;
  purchaseNumber: string;
  quantity: number;
  totalValue: string;
  purchaseDate: string;
  status: string;
  notes: string;
  paymentStatus: string;
  amountPaid: string;
  paymentDueDate: string;
  createdAt: string;
  updatedAt: string;
  items: PurchaseItem[];
  supplier: Supplier;
  payments: Payment;
  createdBy: User;
  updatedBy: User;
}

export interface Payment {
  id: number;
  paymentNumber: string;
  amount: string;
  paymentDate: string;
  referenceNumber: string;
  notes: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  purchase: Purchase;
  createdBy: User;
  updatedBy: User;
  paymentMethod: PaymentMethod;
}

export interface PaymentMethod {
  id: number;
  code: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: User;
  updatedBy: User;
}

export enum BannerPosition {
  TOP = "top",
  MIDDLE = "middle",
  BOTTOM = "bottom",
  SIDEBAR = "sidebar",
}

export enum BannerType {
  MAIN = "main",
  PROMOTIONAL = "promotional",
  FEATURED = "featured",
}

export interface Banner {
  id: number;
  title: string;
  description: string;
  targetUrl: string;
  position: string;
  type: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  image: Attachment;
  createdBy: User;
  updatedBy: User;
}

export interface Cart {
  id: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  items: CartItem[];
}

export interface CartItem {
  id: number;
  quantity: number;
  product: Product;
}

export interface Wishlist {
  id: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  items: WishlistItem[];
}

export interface WishlistItem {
  id: number;
  product: Product;
}
export interface Coupon {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  value: number;
  maxDiscountAmount?: number | null;
  maxUsage: number;
  minOrderAmount: number;
  timesUsed: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  excludedItemIds?: number[];
  excludedItems?: Product[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CouponUsageLog {
  id: number;
  couponCode: string;
  discountAmount: number | string;
  orderTotal: number | string;
  discountType: "percentage" | "fixed";
  discountValue: number | string;
  createdAt: string;
  coupon: {
    id: number;
    code: string;
    discountType: "percentage" | "fixed";
    value: number | string;
    maxDiscountAmount?: number | string | null;
    minOrderAmount?: number | string | null;
    timesUsed?: number;
    maxUsage?: number;
    validFrom?: string;
    validUntil?: string;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
  };
  order: {
    id: number;
    orderNo: string;
    orderStatus: string;
    paymentStatus: string;
    totalValue: number | string;
    totalDiscount: number | string;
    paidAmount?: number | string;
    createdAt: string;
    updatedAt?: string;
  };
  user: {
    id: number;
    name: string;
    email: string;
    mobileNumber: string;
    profilePhoto?: {
      id: number;
      url: string;
      fileName: string;
    };
  };
}

export interface CouponUsageStats {
  couponCode: string;
  totalUses: number;
  totalDiscountGiven: string;
  avgDiscountAmount: string;
  totalOrderValue: string;
}

export interface ShippingMethod {
  id: number;
  name: string;
  cost: string;
  isActive: boolean;
  deliveryTime: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  createdBy: User;
  updatedBy: User;
}

export interface PaymentMethod {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
  description: string;
  createdAt: string;
  updatedAt: string;
  createdBy: User;
  updatedBy: User;
}

export interface Address {
  id: number;
  address: string;
  area: string;
  division: string;
  city: string;
  type: string;
  isDefault: boolean;
}

export interface OrderItem {
  id: number;
  productId: number;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  unitDiscount?: number;
  createdAt: string;
  updatedAt: string;
  product: Product;
}

export interface StatusTrack {
  id: number;
  status: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  updatedBy: User;
}
export interface Order {
  id: number;
  orderNo: string;
  paidAmount: number;
  totalDiscount: number;
  orderStatus: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  paymentStatus: string;
  discountType: string;
  discountValue: number;
  totalValue: number;
  user: User;
  address: Address;
  shippingMethod: ShippingMethod;
  paymentMethod: PaymentMethod;
  items: OrderItem[];
  payments?: OrderPayment[];
  statusTracks: StatusTrack[];
  coupon: Coupon | null;
  deliveryMan?: DeliveryMan | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderPayment {
  id: number;
  paymentNumber: string;
  amount: string;
  paymentDate: string;
  sslPaymentId: string | null;
  bankTranId?: string | null;
  createdAt: string;
  updatedAt: string;
  order: Order;
  paymentMethod: PaymentMethod;
  createdBy: User;
  notes?: string;
  updatedBy: User;
  paymentType?: PaymentType;
  originalPaymentId?: number | null;
  originalPayment?: OrderPayment | null;
}
export interface OrderSummary {
  year: number;
  month: string;
  orderCount: number;
  totalValue: number;
  cancelOrderCount?: number;
  cancelValue?: number;
}

export interface Subscriber {
  id: string;
  email: string;
  createdAt?: string;
}

export interface UserActivity {
  id: number;
  userType: string;
  action: string;
  entityType: string;
  entityId: number | null;
  oldValue: any;
  newValue: any;
  ipAddress: string;
  userAgent: string;
  requestId: string;
  sessionId: string | null;
  status: string;
  message: string;
  createdAt: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

export interface Recipe {
  id: number;
  title: string;
  details: string;
  nutrition_details: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  attachment: Attachment;
  category: Category;
  createdBy: User;
  updatedBy: User;
}

export enum ActionTaken {
  REPLIED_VIA_EMAIL = "replied_via_email",
  CALLED_CUSTOMER = "called_customer",
  PROVIDED_PRODUCT_INFO = "provided_product_info",
  ISSUE_RESOLVED = "issue_resolved",
  ORDER_PLACED = "order_placed",
  REFUND_PROCESSED = "refund_processed",
  OTHER = "other",
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  mobile?: string;
  message: string;
  contactStatus: "pending" | "in_progress" | "resolved" | "closed";
  actionTaken?: ActionTaken | null;
  responseNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  handledById?: number | null;
  handledBy?: any | null;
}

export interface Shop {
  id: number;
  salesPointId: number;
  shopName: string;
  division: string;
  district: string;
  address: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SalesPoint {
  id: number;
  name: string;
  order: number;
  logoAttachmentId: number;
  description: string;
  website: string;
  contactNumber: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  logoAttachment: Attachment;
  shops: Shop[];
}

export interface SisterConcernDetails {
  established?: number;
  concept?: string;
  location?: string;
  specialties?: string[];
  atmosphere?: string;
  keyFeatures?: string[];
  diningExperience?: string;
  cuisineType?: string;
  service?: string;
  businessModel?: string;
  cuisine?: string;
  cookingMethods?: string[];
}

export interface SisterConcern {
  id: number;
  name: string;
  imageUrl: string;
  description: string;
  details: SisterConcernDetails;
}

export interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
}

export type PaymentStatusOption = "success" | "failed" | "canceled";

export interface PaymentStatusConfig {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  bgGradient: string;
  cardBg: string;
  cardBorder: string;
  badgeClass: string;
  actionText: string;
}

// Add this to your types file (utils/types.ts)

export interface Testimonial {
  id: number;
  name: string;
  role: string;
  text: string;
  rating: number;
  isPublish: boolean;
  attachmentId?: string;
  attachment: Attachment;
  createdAt: string;
  updatedAt: string;
}

export enum OrderStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  SHIPPED = "shipped",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
}

export enum PaymentType {
  PAYMENT = "PAYMENT",
  REFUND = "REFUND",
}

export enum PaymentStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  PARTIAL = "partial",
  PAID = "paid",
  FAILED = "failed",
  REFUNDED = "refunded",
  NEED_REFUND = "need_refund",
  REFUND_COMPLETE = "refund_complete",
  PARTIAL_REFUND = "partial_refund",
}

// WebSocket Notification Types
export interface NotificationData {
  orderId: string;
  orderNo: string;
  userId: string;
  orderStatus?: OrderStatus | string;
  paymentStatus?: PaymentStatus | string;
  totalValue?: number;
  items?: any[];
  user?: {
    id: number;
    name: string;
    email: string;
    mobileNumber: string;
  };
  address?: any;
  createdAt?: Date;
  updatedAt?: Date;
  title?: string;
  message?: string;
  // Broadcast notification fields
  type?: "offer" | "maintenance" | "announcement";
  severity?: "info" | "warning" | "critical";
  discount?: string;
  offerId?: string;
  scheduledTime?: string;
  duration?: string;
}

export interface Notification {
  event: 'newOrder' | 'orderConfirmation' | 'orderStatusUpdate' | 'paymentStatusUpdate' | 'notification' | 'broadcast';
  data: NotificationData;
  timestamp: Date;
}

export interface NotificationContextType {
  socket: any | null;
  notifications: Notification[];
  isConnected: boolean;
  clearNotifications: () => void;
  removeNotification: (index: number) => void;
}

// Delivery Man Types
export interface DeliveryMan {
  id: number;
  name: string;
  mobileNumber: string;
  isActive: boolean;
  totalDeliveries: number;
  totalEarnings: number;
  createdAt: string;
  updatedAt: string;
  orders?: Order[];
}

export interface DeliveryManResponse {
  message: string;
  statusCode: number;
  data: DeliveryMan[];
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface DeliveryManDetailResponse {
  message: string;
  statusCode: number;
  data: DeliveryMan;
}

// Analytics Types
export type AnalyticsPeriod = "1h" | "24h" | "7d" | "30d";

export interface AnalyticsOverview {
  totalRequests: number;
  uniqueVisitors: number;
  avgResponseTime: number;
  requestsPerMinute: number;
  peakHour: string;
  topEndpoint: string;
  period: string;
}

export interface AnalyticsRequests {
  time: string;
  count: number;
}

export interface PeakTraffic {
  hour: string;
  requestCount: number;
}

export interface VisitorsData {
  date: string;
  count: number;
}

export interface TopEndpoint {
  endpoint: string;
  method: string;
  count: number;
  avgResponseTime: number;
}

export interface ResponseTimes {
  avg: number;
  min: number;
  max: number;
}

export interface AnalyticsDashboardData {
  overview: AnalyticsOverview;
  requests: AnalyticsRequests[];
  peakTraffic: PeakTraffic[];
  visitors: VisitorsData[];
  topEndpoints: TopEndpoint[];
  responseTimes: ResponseTimes;
}
