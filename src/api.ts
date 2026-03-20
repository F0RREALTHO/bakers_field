export type Category = {
  id: number;
  name: string;
};

export type Product = {
  id: number;
  name: string;
  priceInr: number;
  categoryId: number;
  categoryName: string;
  description?: string;
  imageUrl?: string;
  tags?: Tag[];
  featured?: boolean;
};

export type Tag = {
  id: number;
  name: string;
  slug: string;
  textColor: string;
  backgroundColor: string;
};

export type Order = {
  id: number;
  customerName: string;
  phoneNumber: string;
  pinCode: string;
  addressLabel?: string;
  addressLine1?: string;
  addressLine2?: string;
  addressCity?: string;
  addressState?: string;
  totalAmountInr: number;
  subtotalAmountInr?: number;
  discountAmountInr?: number;
  saleDiscountAmountInr?: number;
  saleName?: string;
  couponCode?: string;
  paymentMethod?: string;
  paymentProvider?: string;
  paymentReference?: string;
  paymentStatus?: string;
  items?: OrderItem[];
  placedAt: string;
  status: string;
};

export type OrderItem = {
  itemType: "PRODUCT" | "COMBO" | "CUSTOM";
  itemRefId: number;
  itemName: string;
  unitPriceInr: number;
  quantity: number;
  lineTotalInr: number;
};

export type PlaceOrderRequest = {
  customerName: string;
  phoneNumber: string;
  pinCode: string;
  addressLabel?: string;
  addressLine1?: string;
  addressLine2?: string;
  addressCity?: string;
  addressState?: string;
  totalAmountInr: number;
  subtotalAmountInr?: number;
  couponCode?: string;
  itemCount: number;
  paymentMethod: string;
  paymentProvider?: string;
  paymentReference?: string;
  paymentStatus: string;
  placedAt?: string;
  items: OrderItemRequest[];
};

export type OrderItemRequest = {
  itemType: "PRODUCT" | "COMBO";
  itemRefId: number;
  itemName: string;
  unitPriceInr: number;
  quantity: number;
};

export type Review = {
  id: number;
  productId: number;
  productName: string;
  rating: number;
  comment: string;
  authorName: string;
  authorPhone?: string;
  avatar: string;
  approved: boolean;
  featured: boolean;
  createdAt: string;
};

export type ReviewRequest = {
  productId: number;
  productName: string;
  rating: number;
  comment: string;
  authorName: string;
  authorPhone?: string;
  avatar: string;
};

export type ReviewUpdateRequest = {
  approved?: boolean;
  featured?: boolean;
};

export type Combo = {
  id: number;
  name: string;
  priceInr: number;
  description?: string;
  imageUrl?: string;
  items: ComboItem[];
};

export type ComboItem = {
  productId: number;
  productName: string;
  quantity: number;
};

export type AdminCombo = Combo & {
  active: boolean;
};

export type AdminComboRequest = {
  name: string;
  priceInr: number;
  description?: string;
  imageUrl?: string;
  active: boolean;
  items: AdminComboItemRequest[];
};

export type AdminComboItemRequest = {
  productId: number;
  quantity: number;
};

export type SaleConfig = {
  id?: number;
  name: string;
  type: "PERCENT" | "FLAT";
  amount: number;
  startsAt?: string | null;
  endsAt?: string | null;
  active: boolean;
};

export type CouponValidationRequest = {
  code: string;
  subtotalAmountInr: number;
  phoneNumber: string;
};

export type CouponValidationResponse = {
  code: string;
  discountAmountInr: number;
  finalAmountInr: number;
  saleDiscountAmountInr?: number;
  saleName?: string | null;
};

export type AdminCoupon = {
  id: number;
  code: string;
  type: "PERCENT" | "FLAT";
  amount: number;
  minOrderAmount: number;
  startsAt?: string | null;
  endsAt?: string | null;
  usageLimit?: number | null;
  perCustomerLimit?: number | null;
  timesUsed: number;
  active: boolean;
};

export type AdminCouponRequest = {
  code: string;
  type: "PERCENT" | "FLAT";
  amount: number;
  minOrderAmount?: number;
  startsAt?: string | null;
  endsAt?: string | null;
  usageLimit?: number | null;
  perCustomerLimit?: number | null;
  active: boolean;
};

export type AdminTagRequest = {
  name: string;
  textColor?: string;
  backgroundColor?: string;
};

export type CustomOrderRequest = {
  customerName: string;
  phoneNumber: string;
  description: string;
  occasion: string;
  imageUrl: string;
  estimatedPriceInr: number;
};

export type AdminLoginRequest = {
  username: string;
  password: string;
  otp: string;
};

export type AdminLoginResponse = {
  token: string;
  expiresAt: string;
};

export type AdminRequestOtpPayload = {
  username: string;
  password: string;
};

export type AdminRequestOtpResponse = {
  message: string;
};

export type AdminCategory = {
  id: number;
  name: string;
};

export type AdminProduct = {
  id: number;
  name: string;
  priceInr: number;
  description?: string;
  imageUrl?: string;
  tags?: Tag[];
  categoryId: number;
  categoryName: string;
  featured?: boolean;
};

export type AdminOrder = Order;

export type AdminCustomOrder = {
  id: number;
  customerName: string;
  phoneNumber: string;
  description: string;
  occasion: string;
  imageUrl: string;
  estimatedPriceInr: number;
  status: string;
  requestedFor: string;
  updatedAt: string;
};

export type AdminCategoryRequest = {
  name: string;
};

export type AdminProductRequest = {
  name: string;
  priceInr: number;
  description?: string;
  imageUrl?: string;
  tagIds?: number[];
  categoryId: number;
  featured?: boolean;
};

export type AdminStatusRequest = {
  status: string;
};

export type AdminPaymentStatusRequest = {
  paymentStatus: string;
  paymentMethod?: string;
  paymentProvider?: string;
  paymentReference?: string;
};

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8080";

type RequestOptions = {
  method?: string;
  body?: unknown;
};

const request = async <T>(path: string, options: RequestOptions = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json"
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed");
  }

  const bodyText = await response.text();
  if (!bodyText) {
    return null as T;
  }

  return JSON.parse(bodyText) as T;
};

const adminRequest = async <T>(
  path: string,
  token: string,
  options: RequestOptions = {}
) => {
  if (!token) {
    throw new Error("Missing admin token");
  }
  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Admin request failed");
  }
  if (response.status === 204) {
    return undefined as T;
  }

  const bodyText = await response.text();
  if (!bodyText) {
    return null as T;
  }

  return JSON.parse(bodyText) as T;
};

export const api = {
  getCategories: () => request<Category[]>("/api/categories"),
  getProducts: () => request<Product[]>("/api/products"),
  getCombos: () => request<Combo[]>("/api/combos"),
  getActiveSale: () => request<SaleConfig | null>("/api/sales/active"),
  getTags: () => request<Tag[]>("/api/tags"),
  getOrder: (id: string) => request<Order>(`/api/orders/${id}`),
  placeOrder: (payload: PlaceOrderRequest) =>
    request<Order>("/api/orders", { method: "POST", body: payload }),
  validateCoupon: (payload: CouponValidationRequest) =>
    request<CouponValidationResponse>("/api/coupons/validate", { method: "POST", body: payload }),
  placeCustomOrder: (payload: CustomOrderRequest) =>
    request<{ id: number }>("/api/custom-orders", {
      method: "POST",
      body: payload
    }),
  adminRequestOtp: (payload: AdminRequestOtpPayload) =>
    request<AdminRequestOtpResponse>("/api/admin/x7k2m9n5b3v1w4q6z2a4m8p0/login/request-otp", {
      method: "POST",
      body: payload
    }),
  adminLogin: (payload: AdminLoginRequest) =>
    request<AdminLoginResponse>("/api/admin/x7k2m9n5b3v1w4q6z2a4m8p0/login", {
      method: "POST",
      body: payload
    }),
  adminGetProducts: (token: string) => adminRequest<AdminProduct[]>("/api/admin/products", token),
  adminCreateProduct: (token: string, payload: AdminProductRequest) =>
    adminRequest<AdminProduct>("/api/admin/products", token, {
      method: "POST",
      body: payload
    }),
  adminUpdateProduct: (token: string, id: number, payload: AdminProductRequest) =>
    adminRequest<AdminProduct>(`/api/admin/products/${id}`, token, {
      method: "PUT",
      body: payload
    }),
  adminDeleteProduct: (token: string, id: number) =>
    adminRequest<void>(`/api/admin/products/${id}`, token, { method: "DELETE" }),
  adminToggleFeatured: (token: string, id: number, featured: boolean) =>
    adminRequest<AdminProduct>(`/api/admin/products/${id}/featured`, token, {
      method: "PUT",
      body: { featured }
    }),
  adminGetCategories: (token: string) => adminRequest<AdminCategory[]>("/api/admin/categories", token),
  adminCreateCategory: (token: string, payload: AdminCategoryRequest) =>
    adminRequest<AdminCategory>("/api/admin/categories", token, {
      method: "POST",
      body: payload
    }),
  adminUpdateCategory: (token: string, id: number, payload: AdminCategoryRequest) =>
    adminRequest<AdminCategory>(`/api/admin/categories/${id}`, token, {
      method: "PUT",
      body: payload
    }),
  adminDeleteCategory: (token: string, id: number) =>
    adminRequest<void>(`/api/admin/categories/${id}`, token, { method: "DELETE" }),
  adminGetTags: (token: string) => adminRequest<Tag[]>("/api/admin/tags", token),
  adminCreateTag: (token: string, payload: AdminTagRequest) =>
    adminRequest<Tag>("/api/admin/tags", token, { method: "POST", body: payload }),
  adminUpdateTag: (token: string, id: number, payload: AdminTagRequest) =>
    adminRequest<Tag>(`/api/admin/tags/${id}`, token, { method: "PUT", body: payload }),
  adminDeleteTag: (token: string, id: number) =>
    adminRequest<void>(`/api/admin/tags/${id}`, token, { method: "DELETE" }),
  adminGetCombos: (token: string) => adminRequest<AdminCombo[]>("/api/admin/combos", token),
  adminCreateCombo: (token: string, payload: AdminComboRequest) =>
    adminRequest<AdminCombo>("/api/admin/combos", token, { method: "POST", body: payload }),
  adminUpdateCombo: (token: string, id: number, payload: AdminComboRequest) =>
    adminRequest<AdminCombo>(`/api/admin/combos/${id}`, token, { method: "PUT", body: payload }),
  adminDeleteCombo: (token: string, id: number) =>
    adminRequest<void>(`/api/admin/combos/${id}`, token, { method: "DELETE" }),
  adminGetSale: (token: string) => adminRequest<SaleConfig | null>("/api/admin/sales/current", token),
  adminUpdateSale: (token: string, payload: SaleConfig) =>
    adminRequest<SaleConfig>("/api/admin/sales/current", token, { method: "PUT", body: payload }),
  adminGetOrders: (token: string) => adminRequest<AdminOrder[]>("/api/admin/orders", token),
  adminUpdateOrderStatus: (token: string, id: number, payload: AdminStatusRequest) =>
    adminRequest<AdminOrder>(`/api/admin/orders/${id}`, token, {
      method: "PATCH",
      body: payload
    }),
  adminUpdateOrderPayment: (token: string, id: number, payload: AdminPaymentStatusRequest) =>
    adminRequest<AdminOrder>(`/api/admin/orders/${id}/payment`, token, {
      method: "PATCH",
      body: payload
    }),
  adminGetCustomOrders: (token: string) =>
    adminRequest<AdminCustomOrder[]>("/api/admin/custom-orders", token),
  adminUpdateCustomOrderStatus: (token: string, id: number, payload: AdminStatusRequest) =>
    adminRequest<AdminCustomOrder>(`/api/admin/custom-orders/${id}`, token, {
      method: "PATCH",
      body: payload
    }),
  getReviews: (params?: {
    featured?: boolean;
    authorPhone?: string;
    authorName?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.featured) query.set("featured", "true");
    if (params?.authorPhone) query.set("authorPhone", params.authorPhone);
    if (params?.authorName) query.set("authorName", params.authorName);
    const suffix = query.toString();
    return request<Review[]>(`/api/reviews${suffix ? `?${suffix}` : ""}`);
  },
  createReview: (payload: ReviewRequest) =>
    request<Review>("/api/reviews", { method: "POST", body: payload }),
  adminGetReviews: (token: string) => adminRequest<Review[]>("/api/admin/reviews", token),
  adminUpdateReview: (token: string, id: number, payload: ReviewUpdateRequest) =>
    adminRequest<Review>(`/api/admin/reviews/${id}`, token, {
      method: "PATCH",
      body: payload
    }),
  adminGetCoupons: (token: string) => adminRequest<AdminCoupon[]>("/api/admin/coupons", token),
  adminCreateCoupon: (token: string, payload: AdminCouponRequest) =>
    adminRequest<AdminCoupon>("/api/admin/coupons", token, {
      method: "POST",
      body: payload
    }),
  adminUpdateCoupon: (token: string, id: number, payload: AdminCouponRequest) =>
    adminRequest<AdminCoupon>(`/api/admin/coupons/${id}`, token, {
      method: "PUT",
      body: payload
    }),
  adminDeleteCoupon: (token: string, id: number) =>
    adminRequest<void>(`/api/admin/coupons/${id}`, token, { method: "DELETE" })
};
