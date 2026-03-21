import { useEffect, useMemo, useRef, useState } from "react";
import { ColorWheel } from "../components/ColorWheel";
import {
  api,
  type AdminCategory,
  type AdminCustomOrder,
  type AdminCombo,
  type AdminCoupon,
  type AdminMetrics,
  type AdminOrder,
  type AdminProduct,
  type Tag
} from "../api";
import type { AlertToastState } from "../hooks/useAlertToast";
import { useAdminSession } from "../hooks/useAdminSession";
import { Select, SelectContent, SelectItem, SelectTrigger } from "../components/ui/select";
import { useReviews } from "../hooks/useReviews";

const orderStatuses = ["PLACED", "PREPARING", "READY", "COMPLETED", "CANCELLED"];
const paymentStatuses = ["PENDING", "PAID", "FAILED", "REFUNDED"];
const customStatuses = ["NEW", "REVIEWING", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

type AdminPageProps = {
  onToast: (toast: AlertToastState) => void;
};

type TabKey = "orders" | "stats" | "reviews" | "stock" | "coupons";

export const AdminPage = ({ onToast }: AdminPageProps) => {
  const { token, clearToken } = useAdminSession();
  const [tab, setTab] = useState<TabKey>("orders");
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [customOrders, setCustomOrders] = useState<AdminCustomOrder[]>([]);
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [combos, setCombos] = useState<AdminCombo[]>([]);
  const [adminMetrics, setAdminMetrics] = useState<AdminMetrics>({
    totalOrders: 0,
    totalCustomOrders: 0,
    totalRevenueInr: 0,
    uniqueOrderingCustomers: 0,
    uniqueVisitors: 0,
    totalVisits: 0
  });
  const [loading, setLoading] = useState(true);
  const [orderFilter, setOrderFilter] = useState("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [selectedOrderDate, setSelectedOrderDate] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [stockSearch, setStockSearch] = useState("");
  const [stockCategory, setStockCategory] = useState("all");
  const [categorySearch, setCategorySearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [productEditor, setProductEditor] = useState<AdminProduct | null>(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [productSubPage, setProductSubPage] = useState<"none" | "addProduct" | "editProduct" | "editCategory">("none");
  const [categoryEditor, setCategoryEditor] = useState<AdminCategory | null>(null);
  const [newProductStock, setNewProductStock] = useState("");
  const [newProductIngredients, setNewProductIngredients] = useState<string[]>([]);
  const [newIngredientDraft, setNewIngredientDraft] = useState("");
  const [newProductCalories, setNewProductCalories] = useState("");
  const [newProductProtein, setNewProductProtein] = useState("");
  const [editProductStock, setEditProductStock] = useState("");
  const [editProductIngredients, setEditProductIngredients] = useState<string[]>([]);
  const [editIngredientDraft, setEditIngredientDraft] = useState("");
  const [editProductCalories, setEditProductCalories] = useState("");
  const [editProductProtein, setEditProductProtein] = useState("");

  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [couponEditorId, setCouponEditorId] = useState<number | null>(null);
  const [couponForm, setCouponForm] = useState({
    code: "",
    type: "PERCENT" as "PERCENT" | "FLAT",
    amount: "",
    minOrderAmount: "",
    startsAt: "",
    endsAt: "",
    usageLimit: "",
    perCustomerLimit: "",
    active: true
  });
  const [newProduct, setNewProduct] = useState({
    name: "",
    priceInr: "",
    categoryId: "",
    description: "",
    imageUrl: "",
    tagIds: [] as number[]
  });
  const [newTagName, setNewTagName] = useState("");
  const [newTagTextColor, setNewTagTextColor] = useState("#7a3f0c");
  const [newTagBgColor, setNewTagBgColor] = useState("#fde6c2");
  const [comboEditorId, setComboEditorId] = useState<number | null>(null);
  const [comboForm, setComboForm] = useState({
    name: "",
    priceInr: "",
    description: "",
    imageUrl: "",
    active: true
  });
  const [comboItems, setComboItems] = useState<{ productId: string; quantity: string }[]>([]);
  const [comboItemDraft, setComboItemDraft] = useState({ productId: "", quantity: "1" });
  const [reviewRange, setReviewRange] = useState("all");
  const [reviewSort, setReviewSort] = useState("newest");
  const [statsRange, setStatsRange] = useState("today");
  const [statsMonth, setStatsMonth] = useState(new Date().getMonth());
  const [statsYear, setStatsYear] = useState(new Date().getFullYear());
  const [statsCustomStart, setStatsCustomStart] = useState("");
  const [statsCustomEnd, setStatsCustomEnd] = useState("");
  const [reviewMonth, setReviewMonth] = useState(() => new Date().getMonth());
  const [reviewYear, setReviewYear] = useState(() => new Date().getFullYear());
  const [saleForm, setSaleForm] = useState({
    name: "",
    type: "PERCENT" as "PERCENT" | "FLAT",
    amount: "",
    startsAt: "",
    endsAt: "",
    active: false
  });
  const [isUploadingNewProductImage, setIsUploadingNewProductImage] = useState(false);
  const [isUploadingEditProductImage, setIsUploadingEditProductImage] = useState(false);
  const [isUploadingComboImage, setIsUploadingComboImage] = useState(false);
  const newProductImageInputRef = useRef<HTMLInputElement | null>(null);
  const editProductImageInputRef = useRef<HTMLInputElement | null>(null);
  const comboImageInputRef = useRef<HTMLInputElement | null>(null);

  const [productDrafts, setProductDrafts] = useState<Record<number, AdminProduct>>({});
  const [categoryDrafts, setCategoryDrafts] = useState<Record<number, string>>({});
  const [orderStatusDrafts, setOrderStatusDrafts] = useState<Record<number, string>>({});
  const [paymentStatusDrafts, setPaymentStatusDrafts] = useState<Record<number, string>>({});
  const [customStatusDrafts, setCustomStatusDrafts] = useState<Record<number, string>>({});
  const { reviews, updateReview } = useReviews({ adminToken: token ?? undefined });

  useEffect(() => {
    const load = async () => {
      if (!token) {
        return;
      }
      try {
        setLoading(true);
        const [
          productsData,
          categoriesData,
          ordersData,
          customOrdersData,
          tagsData,
          combosData,
          saleData,
          metricsData
        ] = await Promise.all([
          api.adminGetProducts(token),
          api.adminGetCategories(token),
          api.adminGetOrders(token),
          api.adminGetCustomOrders(token),
          api.adminGetTags(token),
          api.adminGetCombos(token),
          api.adminGetSale(token),
          api.adminGetMetrics(token)
        ]);
        const couponsData = await api.adminGetCoupons(token);
        setProducts(productsData);
        setCategories(categoriesData);
        setOrders(ordersData);
        setCustomOrders(customOrdersData);
        setCoupons(couponsData);
        setTags(tagsData);
        setCombos(combosData);
        setAdminMetrics(metricsData);
        if (saleData) {
          setSaleForm({
            name: saleData.name,
            type: saleData.type,
            amount: String(saleData.amount),
            startsAt: saleData.startsAt ? saleData.startsAt.slice(0, 10) : "",
            endsAt: saleData.endsAt ? saleData.endsAt.slice(0, 10) : "",
            active: saleData.active
          });
        }
        setProductDrafts(
          Object.fromEntries(productsData.map((product) => [product.id, product]))
        );
        setCategoryDrafts(
          Object.fromEntries(categoriesData.map((category) => [category.id, category.name]))
        );
        setOrderStatusDrafts(
          Object.fromEntries(ordersData.map((order) => [order.id, order.status]))
        );
        setPaymentStatusDrafts(
          Object.fromEntries(
            ordersData.map((order) => [order.id, order.paymentStatus ?? "PENDING"])
          )
        );
        setCustomStatusDrafts(
          Object.fromEntries(customOrdersData.map((order) => [order.id, order.status]))
        );
      } catch {
        onToast({ type: "error", message: "Unable to load admin data." });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token, onToast]);

  const categoryOptions = useMemo(() => categories, [categories]);
  const productCount = products.length;
  const pendingOrders = orders.filter((order) => order.status !== "COMPLETED").length;
  const completedOrders = orders.filter((order) => order.status === "COMPLETED").length;
  const toValidDate = (value?: string) => {
    const date = new Date(value ?? "");
    return Number.isNaN(date.getTime()) ? null : date;
  };
  const calendarMonths = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];
  const calendarYears = useMemo(() => {
    const yearSet = new Set<number>();
    yearSet.add(new Date().getFullYear());
    orders.forEach((order) => {
      const placed = toValidDate(order.placedAt);
      if (placed) {
        yearSet.add(placed.getFullYear());
      }
    });
    return Array.from(yearSet.values()).sort((a, b) => a - b);
  }, [orders]);
  const reviewYears = useMemo(() => {
    const yearSet = new Set<number>();
    yearSet.add(new Date().getFullYear());
    reviews.forEach((review) => {
      const created = toValidDate(review.createdAt);
      if (created) {
        yearSet.add(created.getFullYear());
      }
    });
    return Array.from(yearSet.values()).sort((a, b) => a - b);
  }, [reviews]);
  const { filteredStatsOrders, todayOrders, totalRevenue, averageOrder } = useMemo(() => {
    const now = new Date();
    const { start, end } = (() => {
      if (statsRange === "today") {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        return { start: startOfToday, end: startOfTomorrow };
      }
      if (statsRange === "month") {
        return {
          start: new Date(statsYear, statsMonth, 1),
          end: new Date(statsYear, statsMonth + 1, 1)
        };
      }
      if (statsRange === "year") {
        return {
          start: new Date(statsYear, 0, 1),
          end: new Date(statsYear + 1, 0, 1)
        };
      }
      if (statsRange === "last30") {
        const s = new Date();
        s.setDate(s.getDate() - 30);
        return { start: s, end: now };
      }
      if (statsRange === "custom") {
        const s = statsCustomStart ? new Date(statsCustomStart) : new Date(0);
        const e = statsCustomEnd ? new Date(statsCustomEnd) : new Date("9999-12-31");
        if (statsCustomEnd) {
          e.setDate(e.getDate() + 1); // Make end date inclusive
        }
        return { start: s, end: e };
      }
      return { start: new Date(0), end: new Date("9999-12-31") };
    })();

    const list = orders.filter((order) => {
      const placed = toValidDate(order.placedAt);
      if (!placed) return false;
      return placed >= start && placed < end;
    });

    const revenue = list.reduce((sum, order) => sum + order.totalAmountInr, 0);
    const avg = list.length ? Math.round(revenue / list.length) : 0;
    return {
      filteredStatsOrders: list,
      todayOrders: list.length,
      totalRevenue: revenue,
      averageOrder: avg
    };
  }, [orders, statsRange, statsMonth, statsYear, statsCustomStart, statsCustomEnd]);

  useEffect(() => {
    setSelectedOrderDate(null);
  }, [calendarMonth, calendarYear]);

  const orderCalendarDays = useMemo(() => {
    const year = calendarYear;
    const month = calendarMonth;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay();
    const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;

    const days = Array.from({ length: totalCells }).map((_, index) => {
      const date = new Date(year, month, index - startOffset + 1);
      const isCurrentMonth = date.getMonth() === month;
      const key = date.toDateString();
      return {
        key,
        label: String(date.getDate()),
        date,
        count: 0,
        isCurrentMonth
      };
    });

    const dayMap = new Map(days.map((day) => [day.key, day]));
    orders.forEach((order) => {
      const placed = toValidDate(order.placedAt);
      if (!placed) {
        return;
      }
      const key = placed.toDateString();
      const target = dayMap.get(key);
      if (target && target.isCurrentMonth) {
        target.count += 1;
      }
    });

    return days;
  }, [orders, calendarYear, calendarMonth]);

  const calendarLabel = useMemo(() => {
    const current = new Date(calendarYear, calendarMonth, 1);
    return current.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  }, [calendarMonth, calendarYear]);

  const calendarSelectionLabel = useMemo(() => {
    if (selectedOrderDate) {
      const selectedDate = toValidDate(selectedOrderDate);
      return selectedDate
        ? selectedDate.toLocaleDateString(undefined, {
          day: "numeric",
          month: "short",
          year: "numeric"
        })
        : "Selected date";
    }
    return new Date().toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }, [selectedOrderDate]);

  const weeklySales = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(today);
    start.setDate(today.getDate() - 6);

    const days = Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const label = date.toLocaleDateString(undefined, { weekday: "short" });
      return {
        key: date.toDateString(),
        label,
        date,
        total: 0
      };
    });

    const dayMap = new Map(days.map((day) => [day.key, day]));
    orders.forEach((order) => {
      const placed = toValidDate(order.placedAt);
      if (!placed) {
        return;
      }
      const key = placed.toDateString();
      const target = dayMap.get(key);
      if (target) {
        target.total += order.totalAmountInr;
      }
    });

    const maxTotal = Math.max(1, ...days.map((day) => day.total));
    const chartDays = days.map((day) => ({
      ...day,
      percent: Math.round((day.total / maxTotal) * 100)
    }));

    return {
      days: chartDays,
      maxTotal
    };
  }, [orders]);

  const reviewStats = useMemo(() => {
    if (reviews.length === 0) {
      return {
        average: 0,
        total: 0,
        pending: 0,
        featured: 0
      };
    }
    const total = reviews.length;
    const average =
      Math.round(
        (reviews.reduce((sum, review) => sum + review.rating, 0) / total) * 10
      ) / 10;
    const pending = reviews.filter((review) => !review.approved).length;
    const featured = reviews.filter((review) => review.approved && review.featured).length;
    return { average, total, pending, featured };
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    const now = new Date();
    const { start, end } = (() => {
      if (reviewRange === "month") {
        return {
          start: new Date(reviewYear, reviewMonth, 1),
          end: new Date(reviewYear, reviewMonth + 1, 1)
        };
      }
      if (reviewRange === "year") {
        return {
          start: new Date(reviewYear, 0, 1),
          end: new Date(reviewYear + 1, 0, 1)
        };
      }
      if (reviewRange === "last30") {
        return {
          start: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30),
          end: null
        };
      }
      return { start: null, end: null };
    })();

    const filtered = start
      ? reviews.filter((review) => {
          const created = new Date(review.createdAt);
          if (Number.isNaN(created.getTime())) {
            return false;
          }
          if (end) {
            return created >= start && created < end;
          }
          return created >= start;
        })
      : reviews;

    const sorted = [...filtered].sort((a, b) =>
      reviewSort === "oldest"
        ? a.createdAt.localeCompare(b.createdAt)
        : b.createdAt.localeCompare(a.createdAt)
    );

    return sorted;
  }, [reviews, reviewRange, reviewSort, reviewMonth, reviewYear]);

  const toggleTag = (tagId: number, selected: number[], setter: (next: number[]) => void) => {
    if (selected.includes(tagId)) {
      setter(selected.filter((id) => id !== tagId));
      return;
    }
    setter([...selected, tagId]);
  };

  const toggleEditorTag = (tag: Tag) => {
    setProductEditor((current) => {
      if (!current) {
        return current;
      }
      const currentTags = current.tags ?? [];
      const exists = currentTags.some((item) => item.id === tag.id);
      const nextTags = exists
        ? currentTags.filter((item) => item.id !== tag.id)
        : [...currentTags, tag];
      return { ...current, tags: nextTags };
    });
  };

  const isEditorTagActive = (tag?: Tag) => {
    if (!tag || !productEditor) {
      return false;
    }
    return (productEditor.tags ?? []).some((item) => item.id === tag.id);
  };

  const getTagBySlug = (slug: string) => tags.find((tag) => tag.slug === slug);

  const getCategorySummary = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("bread")) {
      return "Freshly baked daily loaves and buns";
    }
    if (lower.includes("cake")) {
      return "Custom and ready-made celebration cakes";
    }
    if (lower.includes("pastry") || lower.includes("croissant")) {
      return "Flaky danishes, croissants and tarts";
    }
    if (lower.includes("cookie") || lower.includes("treat")) {
      return "Cookies, bars, and sweet treats";
    }
    return "Curated bakery favorites and specials";
  };

  const getCategoryImage = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("bread")) {
      return "https://images.unsplash.com/photo-1549931319-a545dcf3bc73";
    }
    if (lower.includes("cake")) {
      return "https://images.unsplash.com/photo-1542826438-9b1f09b8d9a8";
    }
    if (lower.includes("pastry") || lower.includes("croissant")) {
      return "https://images.unsplash.com/photo-1509440159596-0249088772ff";
    }
    if (lower.includes("savory") || lower.includes("savoury") || lower.includes("snack")) {
      return "https://images.unsplash.com/photo-1512058564366-18510be2db19";
    }
    return "https://images.unsplash.com/photo-1499636136210-6f4ee915583e";
  };

  const formattedOrderDate = (order: AdminOrder) => {
    const date = toValidDate(order.placedAt);
    return date ? date.toLocaleString() : "Unknown date";
  };

  const formatCouponDate = (value?: string | null) => {
    if (!value) {
      return "No expiry";
    }
    const date = new Date(value);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const filteredOrderGroups = useMemo(() => {
    const search = orderSearch.trim().toLowerCase();
    const now = new Date();
    const customPhoneSet = new Set(customOrders.map((order) => order.phoneNumber));

    const matchesFilter = (order: AdminOrder) => {
      const matchesSearch =
        !search ||
        `${order.id}`.includes(search) ||
        order.customerName.toLowerCase().includes(search);

      if (!matchesSearch) {
        return false;
      }

      if (orderFilter === "pending") {
        return order.status === "PLACED";
      }

      if (orderFilter === "baking") {
        return order.status === "PREPARING";
      }

      if (orderFilter === "today") {
        const placed = toValidDate(order.placedAt);
        return placed ? placed.toDateString() === now.toDateString() : false;
      }

      if (selectedOrderDate) {
        const placed = toValidDate(order.placedAt);
        if (!placed) {
          return false;
        }
        placed.setHours(0, 0, 0, 0);
        return placed.toISOString().slice(0, 10) === selectedOrderDate;
      }

      return true;
    };

    const filteredOrders = orders.filter(matchesFilter);
    const grouped = new Map<string, AdminOrder[]>();

    filteredOrders.forEach((order) => {
      const list = grouped.get(order.phoneNumber) ?? [];
      list.push(order);
      grouped.set(order.phoneNumber, list);
    });

    const groups = Array.from(grouped.entries()).map(([phoneNumber, groupOrders]) => {
      const sortedOrders = [...groupOrders].sort((a, b) => {
        const aDate = toValidDate(a.placedAt);
        const bDate = toValidDate(b.placedAt);
        return (bDate?.getTime() ?? 0) - (aDate?.getTime() ?? 0);
      });
      const activeOrders = sortedOrders.filter((order) => order.status !== "COMPLETED");
      const completedOrders = sortedOrders.filter((order) => order.status === "COMPLETED");
      const latest = sortedOrders[0];
      return {
        phoneNumber,
        customerName: latest.customerName,
        activeOrders,
        completedOrders,
        hasCustom: customPhoneSet.has(phoneNumber),
        orderCount: groupOrders.length,
        latestPlacedAt: latest.placedAt,
        hasActive: activeOrders.length > 0,
        hasCompleted: completedOrders.length > 0
      };
    });

    return groups.sort((a, b) => {
      if (a.hasCustom !== b.hasCustom) {
        return a.hasCustom ? -1 : 1;
      }
      if (a.orderCount !== b.orderCount) {
        return b.orderCount - a.orderCount;
      }
      const aDate = toValidDate(a.latestPlacedAt);
      const bDate = toValidDate(b.latestPlacedAt);
      return (bDate?.getTime() ?? 0) - (aDate?.getTime() ?? 0);
    });
  }, [orders, orderFilter, orderSearch, customOrders, selectedOrderDate]);

  const filteredProducts = useMemo(() => {
    const search = stockSearch.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch =
        !search ||
        product.name.toLowerCase().includes(search) ||
        (product.tags ?? []).some((tag) => tag.name.toLowerCase().includes(search));
      const matchesCategory =
        stockCategory === "all" || product.categoryId === Number(stockCategory);
      return matchesSearch && matchesCategory;
    });
  }, [products, stockSearch, stockCategory]);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      onToast({ type: "error", message: "Category name is required." });
      return;
    }
    try {
      const created = await api.adminCreateCategory(token, { name: newCategoryName.trim() });
      setCategories((current) => [...current, created]);
      setCategoryDrafts((current) => ({ ...current, [created.id]: created.name }));
      setNewCategoryName("");
      setNewCategoryDescription("");
      onToast({ type: "success", message: "Category added." });
    } catch (error) {
      onToast({ type: "error", message: "Unable to create category." });
    }
  };

  const handleUpdateCategory = async (categoryId: number) => {
    const name = (categoryDrafts[categoryId] ?? "").trim();
    if (!name) {
      onToast({ type: "error", message: "Category name is required." });
      return;
    }
    try {
      const updated = await api.adminUpdateCategory(token, categoryId, { name });
      setCategories((current) =>
        current.map((category) => (category.id === categoryId ? updated : category))
      );
      onToast({ type: "success", message: "Category updated." });
    } catch {
      onToast({ type: "error", message: "Unable to update category." });
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    try {
      await api.adminDeleteCategory(token, categoryId);
      setCategories((current) => current.filter((category) => category.id !== categoryId));
      onToast({ type: "success", message: "Category deleted." });
    } catch {
      onToast({ type: "error", message: "Unable to delete category." });
    }
  };

  const handleCreateProduct = async () => {
    if (!newProduct.name.trim() || !newProduct.priceInr || !newProduct.categoryId) {
      onToast({ type: "error", message: "Name, price, and category are required." });
      return;
    }
    try {
      const created = await api.adminCreateProduct(token, {
        name: newProduct.name.trim(),
        priceInr: Number(newProduct.priceInr),
        categoryId: Number(newProduct.categoryId),
        description: newProduct.description.trim() || undefined,
        imageUrl: newProduct.imageUrl.trim() || undefined,
        tagIds: newProduct.tagIds
      });
      setProducts((current) => [...current, created]);
      setProductDrafts((current) => ({ ...current, [created.id]: created }));
      setNewProduct({
        name: "",
        priceInr: "",
        categoryId: "",
        description: "",
        imageUrl: "",
        tagIds: []
      });
      onToast({ type: "success", message: "Product created." });
    } catch {
      onToast({ type: "error", message: "Unable to create product." });
    }
  };

  const handleUploadImage = async (
    file: File,
    setUploading: (value: boolean) => void,
    onUploaded: (imageUrl: string) => void
  ) => {
    if (!token) {
      onToast({ type: "error", message: "Admin session expired. Please login again." });
      return;
    }
    setUploading(true);
    try {
      const uploaded = await api.adminUploadImage(token, file);
      onUploaded(uploaded.url);
      onToast({ type: "success", message: "Photo uploaded." });
    } catch (error) {
      const message = error instanceof Error && error.message
        ? error.message
        : "Unable to upload photo.";
      onToast({ type: "error", message });
    } finally {
      setUploading(false);
    }
  };

  const handleToggleFeatured = async (productId: number, currentlyFeatured: boolean) => {
    try {
      const updated = await api.adminToggleFeatured(token, productId, !currentlyFeatured);
      setProducts((current) =>
        current.map((p) => (p.id === productId ? updated : p))
      );
      setProductDrafts((current) => ({ ...current, [productId]: updated }));
      onToast({
        type: "success",
        message: !currentlyFeatured
          ? "Marked as Today's Special!"
          : "Removed from Today's Specials."
      });
    } catch {
      onToast({ type: "error", message: "Unable to update featured status." });
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      onToast({ type: "error", message: "Tag name is required." });
      return;
    }
    try {
      const created = await api.adminCreateTag(token, {
        name: newTagName.trim(),
        textColor: newTagTextColor,
        backgroundColor: newTagBgColor
      });
      setTags((current) => [...current, created]);
      setNewTagName("");
      onToast({ type: "success", message: "Tag created." });
    } catch {
      onToast({ type: "error", message: "Unable to create tag." });
    }
  };

  const handleDeleteTag = async (tagId: number) => {
    const isTagInUse = products.some((p) => (p.tags ?? []).some((t) => t.id === tagId));
    if (isTagInUse) {
      onToast({ type: "error", message: "Cannot delete tag: it is currently applied to one or more products." });
      return;
    }
    try {
      await api.adminDeleteTag(token, tagId);
      setTags((current) => current.filter((t) => t.id !== tagId));
      setProductEditor((current) => {
        if (!current) return current;
        return {
          ...current,
          tags: (current.tags ?? []).filter((t) => t.id !== tagId)
        };
      });
      onToast({ type: "success", message: "Tag deleted." });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("is in use")) {
        onToast({ type: "error", message: "Cannot delete tag: it is currently applied to one or more products." });
      } else {
        onToast({ type: "error", message: "Unable to delete tag." });
      }
    }
  };

  const resetComboForm = () => {
    setComboEditorId(null);
    setComboForm({
      name: "",
      priceInr: "",
      description: "",
      imageUrl: "",
      active: true
    });
    setComboItems([]);
    setComboItemDraft({ productId: "", quantity: "1" });
  };

  const handleAddComboItem = () => {
    if (!comboItemDraft.productId || !comboItemDraft.quantity) {
      return;
    }
    setComboItems((current) => [...current, comboItemDraft]);
    setComboItemDraft({ productId: "", quantity: "1" });
  };

  const handleRemoveComboItem = (index: number) => {
    setComboItems((current) => current.filter((_, idx) => idx !== index));
  };

  const handleEditCombo = (combo: AdminCombo) => {
    setComboEditorId(combo.id);
    setComboForm({
      name: combo.name,
      priceInr: String(combo.priceInr),
      description: combo.description ?? "",
      imageUrl: combo.imageUrl ?? "",
      active: combo.active
    });
    setComboItems(
      combo.items.map((item) => ({
        productId: String(item.productId),
        quantity: String(item.quantity)
      }))
    );
  };

  const handleSaveCombo = async () => {
    if (!comboForm.name.trim() || !comboForm.priceInr || comboItems.length === 0) {
      onToast({ type: "error", message: "Name, price, and items are required." });
      return;
    }
    const payload = {
      name: comboForm.name.trim(),
      priceInr: Number(comboForm.priceInr),
      description: comboForm.description.trim() || undefined,
      imageUrl: comboForm.imageUrl.trim() || undefined,
      active: comboForm.active,
      items: comboItems.map((item) => ({
        productId: Number(item.productId),
        quantity: Number(item.quantity)
      }))
    };

    try {
      if (comboEditorId) {
        const updated = await api.adminUpdateCombo(token, comboEditorId, payload);
        setCombos((current) => current.map((combo) => (combo.id === updated.id ? updated : combo)));
        onToast({ type: "success", message: "Combo updated." });
      } else {
        const created = await api.adminCreateCombo(token, payload);
        setCombos((current) => [created, ...current]);
        onToast({ type: "success", message: "Combo created." });
      }
      resetComboForm();
    } catch {
      onToast({ type: "error", message: "Unable to save combo." });
    }
  };

  const handleDeleteCombo = async (comboId: number) => {
    try {
      await api.adminDeleteCombo(token, comboId);
      setCombos((current) => current.filter((combo) => combo.id !== comboId));
      onToast({ type: "success", message: "Combo deleted." });
    } catch {
      onToast({ type: "error", message: "Unable to delete combo." });
    }
  };

  const handleSaveSale = async () => {
    if (!saleForm.name.trim() || !saleForm.amount) {
      onToast({ type: "error", message: "Sale name and amount are required." });
      return;
    }
    try {
      const payload = {
        name: saleForm.name.trim(),
        type: saleForm.type,
        amount: Number(saleForm.amount),
        startsAt: saleForm.startsAt ? new Date(saleForm.startsAt).toISOString() : null,
        endsAt: saleForm.endsAt ? new Date(saleForm.endsAt).toISOString() : null,
        active: saleForm.active
      };
      const updated = await api.adminUpdateSale(token, payload);
      setSaleForm({
        name: updated.name,
        type: updated.type,
        amount: String(updated.amount),
        startsAt: updated.startsAt ? updated.startsAt.slice(0, 10) : "",
        endsAt: updated.endsAt ? updated.endsAt.slice(0, 10) : "",
        active: updated.active
      });
      onToast({ type: "success", message: "Sale updated." });
    } catch {
      onToast({ type: "error", message: "Unable to update sale." });
    }
  };

  const resetCouponForm = () => {
    setCouponEditorId(null);
    setCouponForm({
      code: "",
      type: "PERCENT",
      amount: "",
      minOrderAmount: "",
      startsAt: "",
      endsAt: "",
      usageLimit: "",
      perCustomerLimit: "",
      active: true
    });
  };

  const handleEditCoupon = (coupon: AdminCoupon) => {
    setCouponEditorId(coupon.id);
    setCouponForm({
      code: coupon.code,
      type: coupon.type,
      amount: String(coupon.amount),
      minOrderAmount: String(coupon.minOrderAmount ?? ""),
      startsAt: coupon.startsAt ? coupon.startsAt.slice(0, 16) : "",
      endsAt: coupon.endsAt ? coupon.endsAt.slice(0, 16) : "",
      usageLimit: coupon.usageLimit != null ? String(coupon.usageLimit) : "",
      perCustomerLimit: coupon.perCustomerLimit != null ? String(coupon.perCustomerLimit) : "",
      active: coupon.active
    });
  };

  const handleSaveCoupon = async () => {
    if (!couponForm.code.trim() || !couponForm.amount) {
      onToast({ type: "error", message: "Coupon code and amount are required." });
      return;
    }
    const payload = {
      code: couponForm.code.trim().toUpperCase(),
      type: couponForm.type,
      amount: Number(couponForm.amount),
      minOrderAmount: couponForm.minOrderAmount ? Number(couponForm.minOrderAmount) : undefined,
      startsAt: couponForm.startsAt ? new Date(couponForm.startsAt).toISOString() : null,
      endsAt: couponForm.endsAt ? new Date(couponForm.endsAt).toISOString() : null,
      usageLimit: couponForm.usageLimit ? Number(couponForm.usageLimit) : null,
      perCustomerLimit: couponForm.perCustomerLimit ? Number(couponForm.perCustomerLimit) : null,
      active: couponForm.active
    };

    try {
      if (couponEditorId) {
        const updated = await api.adminUpdateCoupon(token, couponEditorId, payload);
        setCoupons((current) => current.map((coupon) => (coupon.id === updated.id ? updated : coupon)));
        onToast({ type: "success", message: "Coupon updated." });
      } else {
        const created = await api.adminCreateCoupon(token, payload);
        setCoupons((current) => [...current, created]);
        onToast({ type: "success", message: "Coupon created." });
      }
      resetCouponForm();
    } catch {
      onToast({ type: "error", message: "Unable to save coupon." });
    }
  };

  const handleToggleCouponActive = async (coupon: AdminCoupon) => {
    const payload = {
      code: coupon.code,
      type: coupon.type,
      amount: coupon.amount,
      minOrderAmount: coupon.minOrderAmount,
      startsAt: coupon.startsAt ?? null,
      endsAt: coupon.endsAt ?? null,
      usageLimit: coupon.usageLimit ?? null,
      perCustomerLimit: coupon.perCustomerLimit ?? null,
      active: !coupon.active
    };

    try {
      const updated = await api.adminUpdateCoupon(token, coupon.id, payload);
      setCoupons((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch {
      onToast({ type: "error", message: "Unable to update coupon status." });
    }
  };

  const handleDeleteCoupon = async (couponId: number) => {
    try {
      await api.adminDeleteCoupon(token, couponId);
      setCoupons((current) => current.filter((coupon) => coupon.id !== couponId));
      onToast({ type: "success", message: "Coupon deleted." });
    } catch {
      onToast({ type: "error", message: "Unable to delete coupon." });
    }
  };

  const handleUpdateProduct = async (productId: number) => {
    const draft = productDrafts[productId];
    if (!draft) {
      return;
    }
    try {
      const updated = await api.adminUpdateProduct(token, productId, {
        name: draft.name,
        priceInr: draft.priceInr,
        categoryId: draft.categoryId,
        description: draft.description,
        imageUrl: draft.imageUrl,
        tagIds: (draft.tags ?? []).map((tag) => tag.id)
      });
      setProducts((current) => current.map((product) => (product.id === productId ? updated : product)));
      setProductDrafts((current) => ({ ...current, [productId]: updated }));
      onToast({ type: "success", message: "Product updated." });
    } catch {
      onToast({ type: "error", message: "Unable to update product." });
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    try {
      await api.adminDeleteProduct(token, productId);
      setProducts((current) => current.filter((product) => product.id !== productId));
      onToast({ type: "success", message: "Product deleted." });
    } catch {
      onToast({ type: "error", message: "Unable to delete product." });
    }
  };

  const handleEditProduct = (productId: number) => {
    const selected = products.find((product) => product.id === productId) ?? null;
    if (!selected) {
      return;
    }
    setProductEditor({ ...selected });
    setEditProductStock("");
    setEditProductIngredients(["Belgian Chocolate", "Organic Flour", "Sea Salt"]);
    setEditIngredientDraft("");
    setEditProductCalories("320 kcal");
    setEditProductProtein("4g");
    setProductSubPage("editProduct");
  };

  const addIngredient = (
    value: string,
    setList: (next: string[]) => void,
    current: string[]
  ) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    if (current.includes(trimmed)) {
      return;
    }
    setList([...current, trimmed]);
  };

  const removeIngredient = (
    value: string,
    setList: (next: string[]) => void,
    current: string[]
  ) => {
    setList(current.filter((item) => item !== value));
  };

  const handleUpdateEditorProduct = async () => {
    if (!productEditor) {
      return;
    }
    try {
      const updated = await api.adminUpdateProduct(token, productEditor.id, {
        name: productEditor.name,
        priceInr: productEditor.priceInr,
        categoryId: productEditor.categoryId,
        description: productEditor.description,
        imageUrl: productEditor.imageUrl,
        tagIds: (productEditor.tags ?? []).map((tag) => tag.id)
      });
      setProducts((current) => current.map((product) => (product.id === updated.id ? updated : product)));
      setProductDrafts((current) => ({ ...current, [updated.id]: updated }));
      setProductEditor(updated);
      onToast({ type: "success", message: "Product updated." });
    } catch {
      onToast({ type: "error", message: "Unable to update product." });
    }
  };

  const handleUpdateOrderStatus = async (orderId: number) => {
    try {
      const status = orderStatusDrafts[orderId];
      const updated = await api.adminUpdateOrderStatus(token, orderId, { status });
      setOrders((current) => current.map((order) => (order.id === orderId ? updated : order)));
      onToast({ type: "success", message: "Order updated." });
    } catch {
      onToast({ type: "error", message: "Unable to update order." });
    }
  };

  const handleUpdatePaymentStatus = async (orderId: number) => {
    const status = paymentStatusDrafts[orderId];
    if (!status) {
      return;
    }
    try {
      const updated = await api.adminUpdateOrderPayment(token, orderId, {
        paymentStatus: status
      });
      setOrders((current) => current.map((order) => (order.id === orderId ? updated : order)));
      onToast({ type: "success", message: "Payment status updated." });
    } catch {
      onToast({ type: "error", message: "Unable to update payment status." });
    }
  };

  const handleUpdateCustomStatus = async (orderId: number) => {
    try {
      const status = customStatusDrafts[orderId];
      const updated = await api.adminUpdateCustomOrderStatus(token, orderId, { status });
      setCustomOrders((current) => current.map((order) => (order.id === orderId ? updated : order)));
      onToast({ type: "success", message: "Custom order updated." });
    } catch {
      onToast({ type: "error", message: "Unable to update custom order." });
    }
  };

  const normalizeWhatsAppPhone = (value: string) => {
    const digits = value.replace(/[^0-9]/g, "");
    if (!digits) {
      return "";
    }
    if (digits.length === 10) {
      return `91${digits}`;
    }
    if (digits.length === 11 && digits.startsWith("0")) {
      return `91${digits.slice(1)}`;
    }
    return digits;
  };

  const handleOpenWhatsAppChat = (order: AdminOrder) => {
    const phone = normalizeWhatsAppPhone(order.phoneNumber ?? "");
    if (!phone) {
      onToast({ type: "error", message: "Customer phone number is missing." });
      return;
    }
    const text = encodeURIComponent(
      `Hi ${order.customerName}, this is BakersField regarding your order #${order.id}.`
    );
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="page admin-page admin-shell">
      <header className="admin-topbar admin-topbar--compact">
        <div className="admin-brand">
          <div className="admin-logo" aria-hidden="true">🍞</div>
          <div>
            <h2>BakersField</h2>
            <p>by Rashmi</p>
          </div>
        </div>
        <div className="admin-actions">
          <button className="ghost" onClick={clearToken} type="button">
            Log Out
          </button>
        </div>
      </header>

      <section className="admin-overview">
        <div className="admin-stat">
          <p>Active Orders</p>
          <h3>{pendingOrders}</h3>
        </div>
        <div className="admin-stat">
          <p>Custom Requests</p>
          <h3>{customOrders.length}</h3>
        </div>
        <div className="admin-stat">
          <p>Menu Items</p>
          <h3>{productCount}</h3>
        </div>
      </section>

      {loading ? <p className="muted">Loading admin data...</p> : null}

      {tab === "orders" ? (
        <div className="admin-orders">
          <div className="admin-tabs admin-tabs--underline">
            {(
              [
                { key: "all", label: "All Orders" },
                { key: "today", label: "Today" },
                { key: "pending", label: "Pending" },
                { key: "baking", label: "Baking" }
              ] as const
            ).map((item) => (
              <button
                key={item.key}
                className={`admin-tab ${orderFilter === item.key ? "is-active" : ""}`}
                onClick={() => setOrderFilter(item.key)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="admin-search">
            <span aria-hidden="true">🔍</span>
            <input
              placeholder="Search Order # or Guest Name"
              value={orderSearch}
              onChange={(event) => setOrderSearch(event.target.value)}
            />
          </div>

          <div className="admin-calendar">
            <button
              className="admin-calendar__toggle"
              type="button"
              onClick={() => setCalendarOpen((current) => !current)}
            >
              <span>
                <span className="admin-calendar__toggle-label">Order date</span>
                <strong>{calendarSelectionLabel}</strong>
              </span>
              <span className="admin-calendar__chevron">▾</span>
            </button>
            {calendarOpen ? (
              <div className="admin-calendar__panel">
                <div className="admin-calendar__header">
                  <Select
                    value={String(calendarMonth)}
                    onValueChange={(value) => setCalendarMonth(Number(value))}
                  >
                    <SelectTrigger
                      className="admin-calendar__select"
                      placeholder="Month"
                    />
                    <SelectContent>
                      {calendarMonths.map((month, index) => (
                        <SelectItem key={month} index={index} value={String(index)}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={String(calendarYear)}
                    onValueChange={(value) => setCalendarYear(Number(value))}
                  >
                    <SelectTrigger
                      className="admin-calendar__select"
                      placeholder="Year"
                    />
                    <SelectContent>
                      {calendarYears.map((year, index) => (
                        <SelectItem key={year} index={index} value={String(year)}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <button
                    className="ghost"
                    type="button"
                    onClick={() => {
                      setSelectedOrderDate(null);
                      setCalendarOpen(false);
                    }}
                    disabled={!selectedOrderDate}
                  >
                    Reset
                  </button>
                </div>
                <div className="admin-calendar__grid">
                  {orderCalendarDays.map((day) => (
                    <button
                      key={day.key}
                      type="button"
                      className={`admin-calendar__day ${
                        selectedOrderDate === day.key ? "is-active" : ""
                      } ${day.count === 0 ? "is-empty" : ""} ${
                        day.isCurrentMonth ? "" : "is-outside"
                      }`}
                      onClick={() => {
                        if (!day.isCurrentMonth) {
                          return;
                        }
                        setSelectedOrderDate(day.key);
                        setCalendarOpen(false);
                      }}
                      disabled={!day.isCurrentMonth}
                    >
                      <span className="admin-calendar__date">{day.label}</span>
                      {day.isCurrentMonth ? (
                        <span className="admin-calendar__count">{day.count}</span>
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="admin-card admin-card--custom admin-card--spaced">
            <div className="admin-card__header">
              <div>
                <p className="admin-kicker">Priority</p>
                <h3>Custom Orders</h3>
              </div>
              <span className="admin-pill admin-pill--custom">VIP Queue</span>
            </div>
            {customOrders.length === 0 ? (
              <p className="muted">No custom orders right now.</p>
            ) : (
              <div className="admin-list">
                {customOrders.map((order) => (
                  <div key={order.id} className="admin-order-card admin-order-card--custom">
                    <div className="admin-order-card__header">
                      <div>
                        <span>Custom #{order.id}</span>
                        <h4>{order.customerName}</h4>
                      </div>
                      <span className="admin-pill admin-pill--custom">{order.status}</span>
                    </div>
                    <div className="admin-order-card__content">
                      {order.imageUrl ? (
                        <div 
                          className="admin-order-card__image"
                          style={{ backgroundImage: `url(${order.imageUrl})` }}
                          onClick={() => window.open(order.imageUrl, "_blank")}
                        />
                      ) : null}
                      <div className="admin-order-card__details">
                        <div className="admin-order-card__meta">
                          <span>{order.phoneNumber}</span>
                          <span>₹{order.estimatedPriceInr}</span>
                        </div>
                        <div className="admin-order-card__occasion">
                          <span className="admin-label">Occasion</span>
                          <strong>{order.occasion}</strong>
                        </div>
                        <p className="muted">{order.description}</p>
                      </div>
                    </div>
                    <div className="admin-row admin-row--wide">
                      <Select
                        value={customStatusDrafts[order.id] ?? order.status}
                        onValueChange={(value) =>
                          setCustomStatusDrafts((current) => ({
                            ...current,
                            [order.id]: value
                          }))
                        }
                      >
                        <SelectTrigger className="admin-select" placeholder="Status" />
                        <SelectContent>
                          {customStatuses.map((status, index) => (
                            <SelectItem key={status} index={index} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <button
                        className="primary"
                        onClick={() => handleUpdateCustomStatus(order.id)}
                        type="button"
                      >
                        Update
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="admin-card admin-card--spaced admin-card--standard">
            <div className="admin-card__header">
              <div>
                <p className="admin-kicker">Standard</p>
                <h3>Normal Orders</h3>
              </div>
            </div>
            <div className="admin-list">
              {filteredOrderGroups.filter((group) => group.hasActive).map((group) => (
                <div key={group.phoneNumber} className="admin-order-group">
                  <div className="admin-order-group__header">
                    <div>
                      <p className="admin-order-group__eyebrow">Customer</p>
                      <h4>{group.customerName}</h4>
                      <p className="muted">{group.phoneNumber}</p>
                    </div>
                    <div className="admin-order-group__badges">
                      {group.hasCustom ? (
                        <span className="admin-pill admin-pill--custom">Custom</span>
                      ) : null}
                      {group.orderCount > 1 ? (
                        <span className="admin-pill">Repeat x{group.orderCount}</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="admin-list">
                    {group.activeOrders.map((order) => (
                      <div
                        key={order.id}
                        className={`admin-order-card admin-order-card--standard ${
                          order.status === "COMPLETED" ? "is-completed" : ""
                        }`}
                      >
                        <div className="admin-order-card__header">
                          <div>
                            <span>Order #{order.id}</span>
                            <h4>{order.customerName}</h4>
                          </div>
                          <span className="admin-pill">{order.status}</span>
                        </div>
                        <div className="admin-order-card__meta">
                          <span>{order.phoneNumber}</span>
                          <span>₹{order.totalAmountInr}</span>
                        </div>
                        {order.addressLine1 || order.addressCity ? (
                          <p className="admin-order-card__address">
                            {order.addressLine1 ?? ""}
                            {order.addressCity ? `, ${order.addressCity}` : ""}
                            {order.addressState ? `, ${order.addressState}` : ""}
                            {order.pinCode ? ` · ${order.pinCode}` : ""}
                          </p>
                        ) : null}
                        <div className="admin-row admin-row--wide">
                          <Select
                            value={orderStatusDrafts[order.id] ?? order.status}
                            onValueChange={(value) =>
                              setOrderStatusDrafts((current) => ({
                                ...current,
                                [order.id]: value
                              }))
                            }
                          >
                            <SelectTrigger className="admin-select" placeholder="Status" />
                            <SelectContent>
                              {orderStatuses.map((status, index) => (
                                <SelectItem key={status} index={index} value={status}>
                                  {status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <button
                            className="primary"
                            onClick={() => handleUpdateOrderStatus(order.id)}
                            type="button"
                          >
                            Update
                          </button>
                          <button
                            className="ghost"
                            onClick={() => setSelectedOrder(order)}
                            type="button"
                          >
                            Manage
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-card admin-card--spaced admin-card--completed">
            <div className="admin-card__header">
              <div>
                <p className="admin-kicker">Archive</p>
                <h3>Completed Orders</h3>
              </div>
            </div>
            {filteredOrderGroups.filter((group) => group.hasCompleted).length === 0 ? (
              <p className="muted">No completed orders yet.</p>
            ) : (
              <div className="admin-list">
                {filteredOrderGroups.filter((group) => group.hasCompleted).map((group) => (
                  <div key={`completed-${group.phoneNumber}`} className="admin-order-group">
                    <div className="admin-order-group__header">
                      <div>
                        <p className="admin-order-group__eyebrow">Customer</p>
                        <h4>{group.customerName}</h4>
                        <p className="muted">{group.phoneNumber}</p>
                      </div>
                      <div className="admin-order-group__badges">
                        {group.hasCustom ? (
                          <span className="admin-pill admin-pill--custom">Custom</span>
                        ) : null}
                        <span className="admin-pill">Completed</span>
                      </div>
                    </div>
                    <div className="admin-list">
                      {group.completedOrders.map((order) => (
                        <div
                          key={order.id}
                          className="admin-order-card admin-order-card--standard is-completed"
                        >
                          <div className="admin-order-card__header">
                            <div>
                              <span>Order #{order.id}</span>
                              <h4>{order.customerName}</h4>
                            </div>
                            <span className="admin-pill">{order.status}</span>
                          </div>
                          <div className="admin-order-card__meta">
                            <span>{order.phoneNumber}</span>
                            <span>₹{order.totalAmountInr}</span>
                          </div>
                          {order.addressLine1 || order.addressCity ? (
                            <p className="admin-order-card__address">
                              {order.addressLine1 ?? ""}
                              {order.addressCity ? `, ${order.addressCity}` : ""}
                              {order.addressState ? `, ${order.addressState}` : ""}
                              {order.pinCode ? ` · ${order.pinCode}` : ""}
                            </p>
                          ) : null}
                          <div className="admin-row admin-row--wide">
                            <Select
                              value={orderStatusDrafts[order.id] ?? order.status}
                              onValueChange={(value) =>
                                setOrderStatusDrafts((current) => ({
                                  ...current,
                                  [order.id]: value
                                }))
                              }
                            >
                              <SelectTrigger className="admin-select" placeholder="Status" />
                              <SelectContent>
                                {orderStatuses.map((status, index) => (
                                  <SelectItem key={status} index={index} value={status}>
                                    {status}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <button
                              className="primary"
                              onClick={() => handleUpdateOrderStatus(order.id)}
                              type="button"
                            >
                              Update
                            </button>
                            <button
                              className="ghost"
                              onClick={() => setSelectedOrder(order)}
                              type="button"
                            >
                              Manage
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {tab === "stock" ? (
        <div className="admin-grid">
          {productSubPage !== "none" ? (
            <div className="admin-fab-modal">
              <div
                className="admin-fab-modal__backdrop"
                onClick={() => setProductSubPage("none")}
              />
              <div className="admin-fab-modal__panel" role="dialog" aria-modal="true">
                {productSubPage === "addProduct" ? (
                  <div className="admin-fab-modal__content">
                    <header className="admin-modal-header">
                      <button
                        className="admin-modal-icon"
                        type="button"
                        onClick={() => setProductSubPage("none")}
                        aria-label="Back"
                      >
                        ←
                      </button>
                      <h3>Add Product</h3>
                      <span className="admin-modal-icon admin-modal-icon--ghost" aria-hidden="true" />
                    </header>

                    <div className="admin-modal-body">
                      <section className="admin-modal-section">
                        <h4>Product Media</h4>
                        <div className="admin-media-grid">
                          <div className="admin-media-card admin-media-card--with-action">
                            <div
                              className="admin-media-card__image"
                              style={{
                                backgroundImage: newProduct.imageUrl
                                  ? `url(${newProduct.imageUrl})`
                                  : undefined
                              }}
                            />
                            <button
                              className="admin-media-card__remove"
                              type="button"
                              aria-label="Remove image"
                              onClick={() =>
                                setNewProduct((current) => ({ ...current, imageUrl: "" }))
                              }
                            >
                              ×
                            </button>
                          </div>
                          <div className="admin-media-card admin-media-card--with-action">
                            <div className="admin-media-card__image" />
                            <button className="admin-media-card__remove" type="button" aria-label="Remove image">
                              ×
                            </button>
                          </div>
                          <button
                            className="admin-media-add"
                            type="button"
                            onClick={() => newProductImageInputRef.current?.click()}
                            disabled={isUploadingNewProductImage}
                          >
                            <span className="admin-media-add__icon">＋</span>
                            <span>{isUploadingNewProductImage ? "Uploading..." : "Add Photo"}</span>
                          </button>
                          <input
                            ref={newProductImageInputRef}
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (!file) {
                                return;
                              }
                              void handleUploadImage(file, setIsUploadingNewProductImage, (imageUrl) => {
                                setNewProduct((current) => ({ ...current, imageUrl }));
                              });
                              event.target.value = "";
                            }}
                          />
                        </div>
                      </section>

                      <section className="admin-modal-section">
                        <h4>Essential Details</h4>
                        <div className="admin-modal-fields">
                          <label>
                            Product Name
                            <input
                              value={newProduct.name}
                              onChange={(event) =>
                                setNewProduct((current) => ({ ...current, name: event.target.value }))
                              }
                              type="text"
                            />
                          </label>
                          <div className="admin-modal-field-row">
                            <label>
                              Price (INR)
                              <input
                                value={newProduct.priceInr}
                                onChange={(event) =>
                                  setNewProduct((current) => ({ ...current, priceInr: event.target.value }))
                                }
                                type="number"
                              />
                            </label>
                            <label>
                              Stock (Qty)
                              <input
                                value={newProductStock}
                                onChange={(event) => setNewProductStock(event.target.value)}
                                type="number"
                              />
                            </label>
                          </div>
                          <label>
                            Category
                            <Select
                              value={newProduct.categoryId}
                              onValueChange={(value) =>
                                setNewProduct((current) => ({ ...current, categoryId: value }))
                              }
                            >
                              <SelectTrigger className="admin-select" placeholder="Select category" />
                              <SelectContent>
                                {categoryOptions.map((category, index) => (
                                  <SelectItem key={category.id} index={index} value={String(category.id)}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </label>
                          <label>
                            Image URL
                            <input
                              value={newProduct.imageUrl}
                              onChange={(event) =>
                                setNewProduct((current) => ({ ...current, imageUrl: event.target.value }))
                              }
                              type="text"
                            />
                          </label>
                        </div>
                      </section>

                      <section className="admin-modal-section">
                        <h4>Product Story</h4>
                        <textarea
                          rows={4}
                          value={newProduct.description}
                          onChange={(event) =>
                            setNewProduct((current) => ({ ...current, description: event.target.value }))
                          }
                          placeholder="Describe the product"
                        />
                      </section>

                      <section className="admin-modal-section">
                        <h4>Ingredients</h4>
                        <div className="admin-chip-group">
                          {newProductIngredients.map((item) => (
                            <button
                              key={item}
                              type="button"
                              className="admin-chip"
                              onClick={() =>
                                removeIngredient(item, setNewProductIngredients, newProductIngredients)
                              }
                            >
                              {item} <span>×</span>
                            </button>
                          ))}
                          <button
                            type="button"
                            className="admin-chip admin-chip--ghost"
                            onClick={() => {
                              addIngredient(newIngredientDraft, setNewProductIngredients, newProductIngredients);
                              setNewIngredientDraft("");
                            }}
                          >
                            + Add Ingredient
                          </button>
                        </div>
                        <input
                          value={newIngredientDraft}
                          onChange={(event) => setNewIngredientDraft(event.target.value)}
                          placeholder="Type ingredient and tap Add"
                          type="text"
                        />
                      </section>

                      <section className="admin-modal-section">
                        <h4>Nutrients (Per Serving)</h4>
                        <div className="admin-nutrient-grid">
                          <label className="admin-nutrient-card">
                            <span>Calories</span>
                            <input
                              value={newProductCalories}
                              onChange={(event) => setNewProductCalories(event.target.value)}
                              type="text"
                            />
                          </label>
                          <label className="admin-nutrient-card">
                            <span>Protein</span>
                            <input
                              value={newProductProtein}
                              onChange={(event) => setNewProductProtein(event.target.value)}
                              type="text"
                            />
                          </label>
                        </div>
                      </section>

                      <section className="admin-modal-section">
                        <h4>Product Tags</h4>
                        <div className="admin-tag-picker">
                          {tags.map((tag) => (
                            <span
                              key={tag.id}
                              className={`admin-tag-chip ${newProduct.tagIds.includes(tag.id) ? "is-active" : ""}`}
                              style={{ backgroundColor: tag.backgroundColor, color: tag.textColor, position: "relative", display: "inline-flex", alignItems: "center" }}
                            >
                              <button
                                type="button"
                                style={{ all: "unset", cursor: "pointer", marginRight: 6 }}
                                onClick={() =>
                                  toggleTag(tag.id, newProduct.tagIds, (next) =>
                                    setNewProduct((current) => ({ ...current, tagIds: next }))
                                  )
                                }
                                aria-label="Toggle tag"
                              >
                                {tag.name}
                              </button>
                              <button
                                type="button"
                                className="admin-tag-delete"
                                aria-label="Delete tag"
                                onClick={async () => {
                                  if (window.confirm(`Delete tag '${tag.name}'?`)) {
                                    try {
                                      await api.adminDeleteTag(token, tag.id);
                                      setTags((current) => current.filter((t) => t.id !== tag.id));
                                      onToast({ type: "success", message: "Tag deleted." });
                                    } catch {
                                      onToast({ type: "error", message: "Failed to delete tag." });
                                    }
                                  }
                                }}
                                style={{ marginLeft: 4, color: "#e63946", background: "none", border: "none", fontSize: 16, cursor: "pointer" }}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="admin-tag-create">
                          <input
                            value={newTagName}
                            onChange={(event) => setNewTagName(event.target.value)}
                            placeholder="New tag name"
                            type="text"
                          />
                          <div className="admin-tag-colors" style={{ display: "flex", justifyContent: "center", gap: 32 }}>
                            <ColorWheel color={newTagTextColor} onChange={setNewTagTextColor} label="TEXT" />
                            <ColorWheel color={newTagBgColor} onChange={setNewTagBgColor} label="BACKGROUND" />
                          </div>
                          {/* Color wheel preview */}
                          <div className="admin-tag-preview-pill-row">
                            <span
                              className="admin-tag-preview-pill"
                              style={{
                                background: newTagBgColor,
                                color: newTagTextColor,
                                borderColor: newTagBgColor
                              }}
                            >
                              PREVIEW
                            </span>
                          </div>
                          <button className="ghost" type="button" onClick={handleCreateTag}>
                            Create Tag
                          </button>
                        </div>
                      </section>
                    </div>

                    <div className="admin-modal-footer">
                      <button className="primary primary--wide" onClick={handleCreateProduct} type="button">
                        Save Product
                      </button>
                    </div>
                  </div>
                ) : null}

                {productSubPage === "editCategory" ? (
                  <div className="admin-fab-modal__content">
                    <header className="admin-modal-header">
                      <button
                        className="admin-modal-icon"
                        type="button"
                        onClick={() => setProductSubPage("none")}
                        aria-label="Back"
                      >
                        ←
                      </button>
                      <h3>Edit Category</h3>
                      <span className="admin-modal-icon admin-modal-icon--ghost" aria-hidden="true" />
                    </header>
                    <div className="admin-modal-body">
                      <section className="admin-modal-section">
                        <h4>Category Details</h4>
                        <label>
                          Category Name
                          <input
                            value={categoryEditor ? categoryDrafts[categoryEditor.id] ?? categoryEditor.name : ""}
                            onChange={(event) => {
                              if (!categoryEditor) {
                                return;
                              }
                              setCategoryDrafts((current) => ({
                                ...current,
                                [categoryEditor.id]: event.target.value
                              }));
                            }}
                            type="text"
                          />
                        </label>
                      </section>
                    </div>
                    <div className="admin-modal-footer">
                      <button
                        className="primary primary--wide"
                        onClick={() => {
                          if (!categoryEditor) {
                            return;
                          }
                          handleUpdateCategory(categoryEditor.id);
                          setProductSubPage("none");
                        }}
                        type="button"
                      >
                        Save Category
                      </button>
                    </div>
                  </div>
                ) : null}

                {productSubPage === "editProduct" ? (
                  <div className="admin-fab-modal__content">
                    <header className="admin-modal-header">
                      <button
                        className="admin-modal-icon"
                        type="button"
                        onClick={() => setProductSubPage("none")}
                        aria-label="Back"
                      >
                        ←
                      </button>
                      <h3>Edit Product</h3>
                      <button
                        className="admin-modal-icon admin-modal-icon--danger"
                        type="button"
                        aria-label="Close edit product"
                        onClick={() => setProductSubPage("none")}
                      >
                        ✕
                      </button>
                    </header>
                    {productEditor ? (
                      <div className="admin-modal-body">
                        <section className="admin-modal-section">
                          <h4>Product Media</h4>
                          <div className="admin-media-grid">
                            <div className="admin-media-card admin-media-card--with-action">
                              <div
                                className="admin-media-card__image"
                                style={{
                                  backgroundImage: productEditor.imageUrl
                                    ? `url(${productEditor.imageUrl})`
                                    : undefined
                                }}
                              />
                              <button
                                className="admin-media-card__remove"
                                type="button"
                                aria-label="Remove image"
                                onClick={() =>
                                  setProductEditor((current) =>
                                    current ? { ...current, imageUrl: "" } : current
                                  )
                                }
                              >
                                ×
                              </button>
                            </div>
                            <div className="admin-media-card admin-media-card--with-action">
                              <div className="admin-media-card__image" />
                              <button className="admin-media-card__remove" type="button" aria-label="Remove image">
                                ×
                              </button>
                            </div>
                            <button
                              className="admin-media-add"
                              type="button"
                              onClick={() => editProductImageInputRef.current?.click()}
                              disabled={isUploadingEditProductImage}
                            >
                              <span className="admin-media-add__icon">＋</span>
                              <span>{isUploadingEditProductImage ? "Uploading..." : "Add Photo"}</span>
                            </button>
                            <input
                              ref={editProductImageInputRef}
                              type="file"
                              accept="image/*"
                              hidden
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                if (!file) {
                                  return;
                                }
                                void handleUploadImage(file, setIsUploadingEditProductImage, (imageUrl) => {
                                  setProductEditor((current) =>
                                    current ? { ...current, imageUrl } : current
                                  );
                                });
                                event.target.value = "";
                              }}
                            />
                          </div>
                        </section>

                        <section className="admin-modal-section">
                          <h4>Essential Details</h4>
                          <div className="admin-modal-fields">
                            <label>
                              Product Name
                              <input
                                value={productEditor.name}
                                onChange={(event) =>
                                  setProductEditor((current) =>
                                    current ? { ...current, name: event.target.value } : current
                                  )
                                }
                                type="text"
                              />
                            </label>
                            <div className="admin-modal-field-row">
                              <label>
                                Price (INR)
                                <input
                                  type="number"
                                  value={productEditor.priceInr}
                                  onChange={(event) =>
                                    setProductEditor((current) =>
                                      current
                                        ? { ...current, priceInr: Number(event.target.value) }
                                        : current
                                    )
                                  }
                                />
                              </label>
                              <label>
                                Stock (Qty)
                                <input
                                  value={editProductStock}
                                  onChange={(event) => setEditProductStock(event.target.value)}
                                  type="number"
                                />
                              </label>
                            </div>
                            <label>
                              Category
                              <Select
                                value={String(productEditor.categoryId)}
                                onValueChange={(value) =>
                                  setProductEditor((current) =>
                                    current ? { ...current, categoryId: Number(value) } : current
                                  )
                                }
                              >
                                <SelectTrigger className="admin-select" placeholder="Select category" />
                                <SelectContent>
                                  {categoryOptions.map((category, index) => (
                                    <SelectItem key={category.id} index={index} value={String(category.id)}>
                                      {category.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </label>
                            <label>
                              Image URL
                              <input
                                value={productEditor.imageUrl ?? ""}
                                onChange={(event) =>
                                  setProductEditor((current) =>
                                    current ? { ...current, imageUrl: event.target.value } : current
                                  )
                                }
                                type="text"
                              />
                            </label>
                          </div>
                        </section>

                        <section className="admin-modal-section">
                          <h4>Product Story</h4>
                          <textarea
                            rows={4}
                            value={productEditor.description ?? ""}
                            onChange={(event) =>
                              setProductEditor((current) =>
                                current ? { ...current, description: event.target.value } : current
                              )
                            }
                            placeholder="Describe the product"
                          />
                        </section>

                        <section className="admin-modal-section">
                          <h4>Ingredients</h4>
                          <div className="admin-chip-group">
                            {editProductIngredients.map((item) => (
                              <button
                                key={item}
                                type="button"
                                className="admin-chip"
                                onClick={() =>
                                  removeIngredient(item, setEditProductIngredients, editProductIngredients)
                                }
                              >
                                {item} <span>×</span>
                              </button>
                            ))}
                            <button
                              type="button"
                              className="admin-chip admin-chip--ghost"
                              onClick={() => {
                                addIngredient(editIngredientDraft, setEditProductIngredients, editProductIngredients);
                                setEditIngredientDraft("");
                              }}
                            >
                              + Add Ingredient
                            </button>
                          </div>
                          <input
                            value={editIngredientDraft}
                            onChange={(event) => setEditIngredientDraft(event.target.value)}
                            placeholder="Type ingredient and tap Add"
                            type="text"
                          />
                        </section>

                        <section className="admin-modal-section">
                          <h4>Nutrients (Per Serving)</h4>
                          <div className="admin-nutrient-grid">
                            <label className="admin-nutrient-card">
                              <span>Calories</span>
                              <input
                                value={editProductCalories}
                                onChange={(event) => setEditProductCalories(event.target.value)}
                                type="text"
                              />
                            </label>
                            <label className="admin-nutrient-card">
                              <span>Protein</span>
                              <input
                                value={editProductProtein}
                                onChange={(event) => setEditProductProtein(event.target.value)}
                                type="text"
                              />
                            </label>
                          </div>
                        </section>

                        <section className="admin-modal-section">
                          <h4>Product Tags</h4>
                          <div className="admin-tag-toggles">
                            {(["trending", "new"] as const).map((slug) => {
                              const tag = getTagBySlug(slug);
                              const isActive = isEditorTagActive(tag);
                              return (
                                <div
                                  key={slug}
                                  className={`admin-tag-toggle-row ${
                                    isActive ? "is-active" : ""
                                  }`}
                                >
                                  <button
                                    type="button"
                                    className={`admin-tag-toggle ${
                                      isActive ? "is-active" : ""
                                    }`}
                                    style={
                                      tag
                                        ? {
                                            backgroundColor: tag.backgroundColor,
                                            color: tag.textColor
                                          }
                                        : undefined
                                    }
                                    onClick={() => {
                                      if (tag) {
                                        toggleEditorTag(tag);
                                      } else {
                                        onToast({
                                          type: "error",
                                          message: "Tag not available yet. Refresh after restart."
                                        });
                                      }
                                    }}
                                  >
                                    {slug === "trending" ? "Trending" : "New"}
                                  </button>
                                  <label className="admin-tag-switch">
                                    <input
                                      type="checkbox"
                                      checked={isActive}
                                      onChange={() => {
                                        if (tag) {
                                          toggleEditorTag(tag);
                                        } else {
                                          onToast({
                                            type: "error",
                                            message: "Tag not available yet. Refresh after restart."
                                          });
                                        }
                                      }}
                                    />
                                    <span className="admin-tag-switch__track" aria-hidden="true">
                                      <span className="admin-tag-switch__thumb" />
                                    </span>
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                          <div className="admin-tag-picker">
                            {tags.map((tag) => {
                              const isBuiltIn = tag.slug === "trending" || tag.slug === "new";
                              return (
                                <div key={tag.id} className="admin-tag-item">
                                  <button
                                    type="button"
                                    className={`admin-tag-chip ${
                                      (productEditor.tags ?? []).some((item) => item.id === tag.id)
                                        ? "is-active"
                                        : ""
                                    }`}
                                    onClick={() => toggleEditorTag(tag)}
                                    style={{
                                      backgroundColor: tag.backgroundColor,
                                      color: tag.textColor
                                    }}
                                  >
                                    {tag.name}
                                  </button>
                                  {!isBuiltIn && (
                                    <button
                                      type="button"
                                      className="admin-tag-delete"
                                      onClick={() => handleDeleteTag(tag.id)}
                                      aria-label={`Delete tag ${tag.name}`}
                                    >
                                      ×
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          <div className="admin-tag-create">
                            <input
                              value={newTagName}
                              onChange={(event) => setNewTagName(event.target.value)}
                              placeholder="New tag name"
                              type="text"
                            />
                            <div className="admin-tag-picker">
                              <span
                                className="admin-tag-chip is-active"
                                style={{
                                  backgroundColor: newTagBgColor,
                                  color: newTagTextColor
                                }}
                              >
                                {newTagName.trim() || "Preview"}
                              </span>
                            </div>
                            <div className="admin-tag-colors">
                              <ColorWheel
                                label="Text Color"
                                color={newTagTextColor}
                                onChange={setNewTagTextColor}
                              />
                              <ColorWheel
                                label="Background"
                                color={newTagBgColor}
                                onChange={setNewTagBgColor}
                              />
                            </div>
                            <button className="ghost" type="button" onClick={handleCreateTag}>
                              Create Tag
                            </button>
                          </div>
                        </section>
                      </div>
                    ) : (
                      <div className="admin-modal-body">
                        <p className="muted">Pick a product to edit.</p>
                      </div>
                    )}
                    <div className="admin-modal-footer">
                      <button className="primary primary--wide" onClick={handleUpdateEditorProduct} type="button">
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {productSubPage === "none" ? (
            <section className="admin-card">
              <h3>Stock Overview</h3>
              <div className="admin-summary-grid">
                <div className="admin-metric-card">
                  <p>Total Products</p>
                  <h4>{productCount}</h4>
                </div>
                <div className="admin-metric-card">
                  <p>Categories</p>
                  <h4>{categories.length}</h4>
                </div>
                <div className="admin-metric-card">
                  <p>Custom Requests</p>
                  <h4>{customOrders.length}</h4>
                </div>
              </div>
            </section>
          ) : null}

          {productSubPage === "none" ? (
            <section className="admin-card">
              <div className="admin-search">
                <span aria-hidden="true">🔍</span>
                <input
                  placeholder="Search menu items..."
                  value={stockSearch}
                  onChange={(event) => setStockSearch(event.target.value)}
                />
              </div>
              <div className="admin-filter-row">
                <button
                  className={`chip ${stockCategory === "all" ? "is-active" : ""}`}
                  onClick={() => setStockCategory("all")}
                  type="button"
                >
                  All Items
                </button>
                {categoryOptions.map((category) => (
                  <button
                    key={category.id}
                    className={`chip ${
                      stockCategory === String(category.id) ? "is-active" : ""
                    }`}
                    onClick={() => setStockCategory(String(category.id))}
                    type="button"
                  >
                    {category.name}
                  </button>
                ))}
              </div>
              <div className="admin-stock-list">
                {filteredProducts.map((product) => (
                  <article key={product.id} className="admin-stock-item">
                    <div
                      className="admin-stock-thumb"
                      style={{ backgroundImage: product.imageUrl ? `url(${product.imageUrl})` : undefined }}
                    />
                    <div className="admin-stock-meta">
                      <div>
                        <p className="admin-stock-eyebrow">#{product.id}</p>
                        <h4 style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {product.name}
                          {product.featured ? (
                            <span style={{
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              color: "#c8842a",
                              background: "#faecd8",
                              padding: "2px 8px",
                              borderRadius: 6,
                              letterSpacing: "0.03em"
                            }}>
                              Today&apos;s Special
                            </span>
                          ) : null}
                        </h4>
                        <p className="muted">{product.categoryName}</p>
                      </div>
                      <div className="admin-stock-tags">
                        {(product.tags ?? []).slice(0, 3).map((tag) => (
                          <span key={tag.id} className="admin-pill admin-pill--muted">{tag.name}</span>
                        ))}
                      </div>
                    </div>
                    <div className="admin-stock-actions">
                      <span className="admin-amount">₹{product.priceInr}</span>
                      <div className="admin-actions">
                        <button
                          className="ghost admin-action"
                          onClick={() => handleToggleFeatured(product.id, !!product.featured)}
                          type="button"
                          title={product.featured ? "Remove from Today's Specials" : "Mark as Today's Special"}
                          style={{
                            fontSize: "1.1rem",
                            padding: "4px 8px",
                            color: product.featured ? "#c8842a" : "#a08060",
                            transition: "color 0.2s ease"
                          }}
                        >
                          {product.featured ? "★" : "☆"}
                        </button>
                        <button
                          className="ghost admin-action admin-action--edit"
                          onClick={() => handleEditProduct(product.id)}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          className="ghost admin-action admin-action--delete"
                          onClick={() => handleDeleteProduct(product.id)}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {productSubPage === "none" ? (
            <section className="admin-card">
              <div className="admin-card__header">
                <h3>Combos</h3>
              </div>
              <div className="admin-form">
                <label>
                  Combo Name
                  <input
                    value={comboForm.name}
                    onChange={(event) =>
                      setComboForm((current) => ({ ...current, name: event.target.value }))
                    }
                    placeholder="Festival Delight"
                  />
                </label>
                <div className="admin-row">
                  <label>
                    Price
                    <input
                      type="number"
                      value={comboForm.priceInr}
                      onChange={(event) =>
                        setComboForm((current) => ({ ...current, priceInr: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Image URL
                    <input
                      value={comboForm.imageUrl}
                      onChange={(event) =>
                        setComboForm((current) => ({ ...current, imageUrl: event.target.value }))
                      }
                    />
                    <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                      <button
                        className="ghost"
                        type="button"
                        onClick={() => comboImageInputRef.current?.click()}
                        disabled={isUploadingComboImage}
                      >
                        {isUploadingComboImage ? "Uploading..." : "Add Photo"}
                      </button>
                      {comboForm.imageUrl ? (
                        <button
                          className="ghost"
                          type="button"
                          onClick={() => setComboForm((current) => ({ ...current, imageUrl: "" }))}
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                    <input
                      ref={comboImageInputRef}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) {
                          return;
                        }
                        void handleUploadImage(file, setIsUploadingComboImage, (imageUrl) => {
                          setComboForm((current) => ({ ...current, imageUrl }));
                        });
                        event.target.value = "";
                      }}
                    />
                  </label>
                </div>
                <label>
                  Description
                  <textarea
                    rows={2}
                    value={comboForm.description}
                    onChange={(event) =>
                      setComboForm((current) => ({ ...current, description: event.target.value }))
                    }
                  />
                </label>
                <label className="admin-toggle">
                  <input
                    type="checkbox"
                    checked={comboForm.active}
                    onChange={(event) =>
                      setComboForm((current) => ({ ...current, active: event.target.checked }))
                    }
                  />
                  Active
                </label>
                <div className="admin-row">
                  <label>
                    Product
                    <Select
                      value={comboItemDraft.productId}
                      onValueChange={(value) =>
                        setComboItemDraft((current) => ({
                          ...current,
                          productId: value
                        }))
                      }
                    >
                      <SelectTrigger className="admin-select" placeholder="Select product" />
                      <SelectContent>
                        {products.map((product, index) => (
                          <SelectItem key={product.id} index={index} value={String(product.id)}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </label>
                  <label>
                    Qty
                    <input
                      type="number"
                      value={comboItemDraft.quantity}
                      onChange={(event) =>
                        setComboItemDraft((current) => ({
                          ...current,
                          quantity: event.target.value
                        }))
                      }
                    />
                  </label>
                  <button className="ghost" type="button" onClick={handleAddComboItem}>
                    Add Item
                  </button>
                </div>
                {comboItems.length > 0 ? (
                  <div className="admin-combo-items">
                    {comboItems.map((item, index) => {
                      const product = products.find(
                        (entry) => String(entry.id) === item.productId
                      );
                      return (
                        <div key={`${item.productId}-${index}`} className="admin-combo-item">
                          <span>{product?.name ?? "Product"}</span>
                          <span>× {item.quantity}</span>
                          <button
                            className="ghost"
                            type="button"
                            onClick={() => handleRemoveComboItem(index)}
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
                <div className="admin-actions">
                  <button className="primary" type="button" onClick={handleSaveCombo}>
                    {comboEditorId ? "Update Combo" : "Create Combo"}
                  </button>
                  {comboEditorId ? (
                    <button className="ghost" type="button" onClick={resetComboForm}>
                      Cancel
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="admin-list">
                {combos.map((combo) => (
                  <div key={combo.id} className="admin-coupon-card">
                    <div>
                      <p className="admin-stock-eyebrow">{combo.active ? "Active" : "Paused"}</p>
                      <h4>{combo.name}</h4>
                      <p className="muted">₹{combo.priceInr}</p>
                      <p className="muted">
                        {combo.items.map((item) => `${item.quantity}x ${item.productName}`).join(" · ")}
                      </p>
                    </div>
                    <div className="admin-actions">
                      <button className="ghost" type="button" onClick={() => handleEditCombo(combo)}>
                        Edit
                      </button>
                      <button className="ghost" type="button" onClick={() => handleDeleteCombo(combo.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {productSubPage === "none" ? (
            <section className="admin-card admin-categories">
              <div className="admin-categories__header">
                <h3>Manage Categories</h3>
              </div>
              <div className="admin-category-search">
                <span aria-hidden="true">🔍</span>
                <input
                  placeholder="Search categories..."
                  value={categorySearch}
                  onChange={(event) => setCategorySearch(event.target.value)}
                />
              </div>
              <div className="admin-category-list">
                {categories
                  .filter((category) =>
                    category.name.toLowerCase().includes(categorySearch.trim().toLowerCase())
                  )
                  .map((category) => (
                    <article key={category.id} className="admin-category-card">
                      <div className="admin-category-thumb">
                        <img alt={category.name} src={getCategoryImage(category.name)} />
                      </div>
                      <div className="admin-category-meta">
                        <h4>{category.name}</h4>
                        <p className="muted">{getCategorySummary(category.name)}</p>
                      </div>
                      <div className="admin-category-actions">
                        <button
                          className="admin-icon-button"
                          type="button"
                          onClick={() => {
                            setCategoryEditor(category);
                            setProductSubPage("editCategory");
                          }}
                        >
                          ✎
                        </button>
                        <button
                          className="admin-icon-button admin-icon-button--danger"
                          type="button"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          ✕
                        </button>
                      </div>
                    </article>
                  ))}
              </div>

              <div className="admin-category-form" id="admin-category-form">
                <div className="admin-category-form__header">
                  <span>＋</span>
                  <h4>New Category</h4>
                </div>
                <label>
                  Category Name
                  <input
                    value={newCategoryName}
                    onChange={(event) => setNewCategoryName(event.target.value)}
                    placeholder="e.g. Cookies"
                    type="text"
                  />
                </label>
                <label>
                  Description
                  <textarea
                    rows={2}
                    value={newCategoryDescription}
                    onChange={(event) => setNewCategoryDescription(event.target.value)}
                    placeholder="What items go in here?"
                  />
                </label>
                <div className="admin-category-form__actions">
                  <button className="primary" onClick={handleCreateCategory} type="button">
                    Save Category
                  </button>
                  <button
                    className="ghost"
                    type="button"
                    onClick={() => {
                      setNewCategoryName("");
                      setNewCategoryDescription("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </section>
          ) : null}

          {productSubPage === "none" ? (
            <div className="admin-fab">
              <button
                className="admin-fab__button"
                type="button"
                aria-label="Add product or category"
                onClick={() => setAddMenuOpen((current) => !current)}
              >
                +
              </button>
              {addMenuOpen ? (
                <div className="admin-fab__menu">
                  <button
                    className="ghost"
                    type="button"
                    onClick={() => {
                      setAddMenuOpen(false);
                      setProductSubPage("addProduct");
                    }}
                  >
                    Add Product
                  </button>
                  <button
                    className="ghost"
                    type="button"
                    onClick={() => {
                      setAddMenuOpen(false);
                      setProductSubPage("none");
                      document.getElementById("admin-category-form")?.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                      });
                    }}
                  >
                    Add Category
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === "stats" ? (
        <div className="admin-grid">
          <section className="admin-card">
            <div className="admin-card__header">
              <div>
                <h3>{statsRange === "today" ? "Today" : statsRange === "all" ? "All Time" : statsRange === "last30" ? "Last 30 Days" : statsRange === "month" ? "This month" : "This year"}</h3>
                <p className="muted">Overview of core metrics.</p>
              </div>
              <div className="admin-filter-row">
                <Select value={statsRange} onValueChange={setStatsRange}>
                  <SelectTrigger className="admin-select" placeholder="Range" />
                  <SelectContent>
                    {["today", "all", "last30", "month", "year", "custom"].map((value, index) => (
                      <SelectItem key={value} index={index} value={value}>
                        {value === "today"
                          ? "Today"
                          : value === "all"
                            ? "All time"
                            : value === "last30"
                              ? "Last 30 days"
                              : value === "month"
                                ? "This month"
                                : value === "year"
                                  ? "This year"
                                  : "Custom range"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {statsRange === "custom" ? (
                  <div className="admin-date-picker-row">
                    <input
                      type="date"
                      className="admin-date-picker"
                      value={statsCustomStart}
                      onChange={(e) => setStatsCustomStart(e.target.value)}
                    />
                    <span className="admin-date-separator">→</span>
                    <input
                      type="date"
                      className="admin-date-picker"
                      value={statsCustomEnd}
                      onChange={(e) => setStatsCustomEnd(e.target.value)}
                    />
                  </div>
                ) : null}
                {statsRange === "month" ? (
                  <Select
                    value={String(statsMonth)}
                    onValueChange={(value) => setStatsMonth(Number(value))}
                  >
                    <SelectTrigger className="admin-select" placeholder="Month" />
                    <SelectContent>
                      {calendarMonths.map((month, index) => (
                        <SelectItem key={month} index={index} value={String(index)}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : null}
                {statsRange === "month" || statsRange === "year" ? (
                  <Select
                    value={String(statsYear)}
                    onValueChange={(value) => setStatsYear(Number(value))}
                  >
                    <SelectTrigger className="admin-select" placeholder="Year" />
                    <SelectContent>
                      {calendarYears.map((year, index) => (
                        <SelectItem key={year} index={index} value={String(year)}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : null}
              </div>
            </div>
            <div className="admin-summary-grid">
              <div className="admin-metric-card">
                <p>Orders</p>
                <h4>{todayOrders}</h4>
              </div>
              <div className="admin-metric-card">
                <p>Revenue</p>
                <h4>₹{totalRevenue}</h4>
              </div>
              <div className="admin-metric-card">
                <p>Avg Ticket</p>
                <h4>₹{averageOrder}</h4>
              </div>
              <div className="admin-metric-card">
                <p>Total Orders (All Time)</p>
                <h4>{adminMetrics.totalOrders}</h4>
              </div>
            </div>
          </section>

          <section className="admin-card">
            <h3>Order Performance</h3>
            <div className="admin-summary-grid">
              <div className="admin-metric-card">
                <p>Completed</p>
                <h4>{completedOrders}</h4>
              </div>
              <div className="admin-metric-card">
                <p>Active</p>
                <h4>{pendingOrders}</h4>
              </div>
              <div className="admin-metric-card">
                <p>Custom Requests</p>
                <h4>{customOrders.length}</h4>
              </div>
            </div>
            <div className="admin-summary-grid" style={{ marginTop: 12 }}>
              <div className="admin-metric-card">
                <p>Users With Orders</p>
                <h4>{adminMetrics.uniqueOrderingCustomers}</h4>
              </div>
              <div className="admin-metric-card">
                <p>Unique Visitors</p>
                <h4>{adminMetrics.uniqueVisitors}</h4>
              </div>
              <div className="admin-metric-card">
                <p>Total Visits</p>
                <h4>{adminMetrics.totalVisits}</h4>
              </div>
            </div>
            <div className="admin-chart">
              <div>
                <h4>Weekly Sales</h4>
                <p className="muted">Last 7 days revenue summary.</p>
              </div>
              <div className="admin-chart__grid">
                {weeklySales.days.map((day) => (
                  <div key={day.key} className="admin-chart__bar">
                    <span className="admin-chart__value">₹{day.total}</span>
                    <div className="admin-chart__track">
                      <span
                        className="admin-chart__fill"
                        style={{ height: `${day.percent}%` }}
                      />
                    </div>
                    <span className="admin-chart__label">{day.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {tab === "reviews" ? (
        <div className="admin-grid">
          <section className="admin-card">
            <h3>Reviews Summary</h3>
            <div className="admin-summary-grid">
              <div className="admin-metric-card">
                <p>Average Rating</p>
                <h4>{reviewStats.average ? `${reviewStats.average} ★` : "-"}</h4>
              </div>
              <div className="admin-metric-card">
                <p>Total Reviews</p>
                <h4>{reviewStats.total}</h4>
              </div>
              <div className="admin-metric-card">
                <p>Pending</p>
                <h4>{reviewStats.pending}</h4>
              </div>
              <div className="admin-metric-card">
                <p>Featured</p>
                <h4>{reviewStats.featured}</h4>
              </div>
            </div>
          </section>

          <section className="admin-card">
            <div className="admin-card__header">
              <div>
                <h3>Review Inbox</h3>
                <p className="muted">Sort by date range and newest/oldest.</p>
              </div>
              <div className="admin-filter-row">
                <Select value={reviewRange} onValueChange={setReviewRange}>
                  <SelectTrigger className="admin-select" placeholder="Range" />
                  <SelectContent>
                    {["all", "last30", "month", "year"].map((value, index) => (
                      <SelectItem key={value} index={index} value={value}>
                        {value === "all"
                          ? "All time"
                          : value === "last30"
                            ? "Last 30 days"
                            : value === "month"
                              ? "This month"
                              : "This year"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {reviewRange === "month" ? (
                  <Select
                    value={String(reviewMonth)}
                    onValueChange={(value) => setReviewMonth(Number(value))}
                  >
                    <SelectTrigger className="admin-select" placeholder="Month" />
                    <SelectContent>
                      {calendarMonths.map((month, index) => (
                        <SelectItem key={month} index={index} value={String(index)}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : null}
                {reviewRange === "month" || reviewRange === "year" ? (
                  <Select
                    value={String(reviewYear)}
                    onValueChange={(value) => setReviewYear(Number(value))}
                  >
                    <SelectTrigger className="admin-select" placeholder="Year" />
                    <SelectContent>
                      {reviewYears.map((year, index) => (
                        <SelectItem key={year} index={index} value={String(year)}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : null}
                <Select value={reviewSort} onValueChange={setReviewSort}>
                  <SelectTrigger className="admin-select" placeholder="Sort" />
                  <SelectContent>
                    {["newest", "oldest"].map((value, index) => (
                      <SelectItem key={value} index={index} value={value}>
                        {value === "newest" ? "Newest first" : "Oldest first"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="admin-review-list">
              {filteredReviews.length === 0 ? (
                <p className="muted">No reviews submitted yet.</p>
              ) : (
                filteredReviews.map((review) => {
                  const isCustom = review.productName.startsWith("Custom Cake");
                  const customName = review.productName.startsWith("Custom Cake:")
                    ? review.productName.replace("Custom Cake:", "").trim()
                    : "";
                  const productLabel = isCustom ? "Custom Cake" : review.productName;

                  return (
                    <article key={review.id} className="admin-review-card">
                      <div className="admin-review-card__content">
                        <div className="admin-review-card__header">
                          <div>
                            <div className="admin-review-card__product-row">
                              <p className="admin-review-card__product">{productLabel}</p>
                              {customName ? (
                                <span className="admin-review-card__custom-name">
                                  {customName}
                                </span>
                              ) : null}
                            </div>
                            <h4>{review.comment}</h4>
                          </div>
                          <span className="admin-pill">{review.rating} ★</span>
                        </div>
                        <div className="admin-review-card__footer">
                          <div className="admin-review-card__author">
                            <img src={review.avatar} alt={review.authorName} />
                            <div>
                              <span>{review.authorName}</span>
                              <span className="muted">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="admin-review-card__actions">
                            <label className="admin-toggle">
                              <input
                                type="checkbox"
                                checked={review.approved}
                                onChange={(event) => {
                                  const approved = event.target.checked;
                                  void updateReview(review.id, {
                                    approved,
                                    featured: approved ? review.featured : false
                                  });
                                }}
                              />
                              Approved
                            </label>
                            <label className="admin-toggle">
                              <input
                                type="checkbox"
                                checked={review.featured}
                                disabled={!review.approved}
                                onChange={(event) =>
                                  void updateReview(review.id, {
                                    featured: event.target.checked
                                  })
                                }
                              />
                              Feature on hero
                            </label>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
            <p className="muted admin-review-note">
              Approved reviews can be featured on the home page hero section.
            </p>
          </section>
        </div>
      ) : null}

      {tab === "coupons" ? (
        <div className="admin-coupons-page">
          <section className="admin-coupon-create">
            <div className="admin-coupon-create__header">
              <span className="admin-coupon-create__icon">%</span>
              <h3>Festival Sale</h3>
            </div>
            <div className="admin-coupon-form">
              <label className="admin-coupon-field">
                <span>Sale Name</span>
                <input
                  className="admin-coupon-input"
                  value={saleForm.name}
                  onChange={(event) =>
                    setSaleForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Diwali Sale"
                />
              </label>
              <div className="admin-coupon-field">
                <span>Sale Type</span>
                <div className="admin-coupon-toggle">
                  <label>
                    <input
                      type="radio"
                      name="saleType"
                      value="PERCENT"
                      checked={saleForm.type === "PERCENT"}
                      onChange={() =>
                        setSaleForm((current) => ({
                          ...current,
                          type: "PERCENT"
                        }))
                      }
                    />
                    <span>Percentage (%)</span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="saleType"
                      value="FLAT"
                      checked={saleForm.type === "FLAT"}
                      onChange={() =>
                        setSaleForm((current) => ({
                          ...current,
                          type: "FLAT"
                        }))
                      }
                    />
                    <span>Flat (₹)</span>
                  </label>
                </div>
              </div>
              <div className="admin-coupon-row">
                <label className="admin-coupon-field">
                  <span>Amount</span>
                  <div className="admin-coupon-amount">
                    <span className="admin-coupon-amount__symbol">
                      {saleForm.type === "PERCENT" ? "%" : "₹"}
                    </span>
                    <input
                      type="number"
                      value={saleForm.amount}
                      onChange={(event) =>
                        setSaleForm((current) => ({ ...current, amount: event.target.value }))
                      }
                    />
                  </div>
                </label>
                <label className="admin-coupon-field">
                  <span>Start Date</span>
                  <input
                    type="date"
                    className="admin-coupon-input"
                    value={saleForm.startsAt}
                    onChange={(event) =>
                      setSaleForm((current) => ({ ...current, startsAt: event.target.value }))
                    }
                  />
                </label>
                <label className="admin-coupon-field">
                  <span>End Date</span>
                  <input
                    type="date"
                    className="admin-coupon-input"
                    value={saleForm.endsAt}
                    onChange={(event) =>
                      setSaleForm((current) => ({ ...current, endsAt: event.target.value }))
                    }
                  />
                </label>
              </div>
              <div className="admin-coupon-footer">
                <label className="admin-coupon-switch">
                  <input
                    type="checkbox"
                    checked={saleForm.active}
                    onChange={(event) =>
                      setSaleForm((current) => ({ ...current, active: event.target.checked }))
                    }
                  />
                  <span />
                  <span>Active</span>
                </label>
                <div className="admin-coupon-footer__actions">
                  <button className="admin-coupon-submit" type="button" onClick={handleSaveSale}>
                    Save Sale
                  </button>
                </div>
              </div>
            </div>
          </section>
          <section className="admin-coupon-create">
            <div className="admin-coupon-create__header">
              <span className="admin-coupon-create__icon">+</span>
              <h3>{couponEditorId ? "Edit Coupon" : "Create Coupon"}</h3>
            </div>
            <div className="admin-coupon-form">
              <label className="admin-coupon-field">
                <span>Coupon Code</span>
                <input
                  className="admin-coupon-input admin-coupon-input--code"
                  value={couponForm.code}
                  onChange={(event) =>
                    setCouponForm((current) => ({
                      ...current,
                      code: event.target.value.toUpperCase()
                    }))
                  }
                  placeholder="e.g. BAKE50"
                />
              </label>
              <div className="admin-coupon-field">
                <span>Discount Type</span>
                <div className="admin-coupon-toggle">
                  <label>
                    <input
                      type="radio"
                      name="couponType"
                      value="PERCENT"
                      checked={couponForm.type === "PERCENT"}
                      onChange={() =>
                        setCouponForm((current) => ({
                          ...current,
                          type: "PERCENT"
                        }))
                      }
                    />
                    <span>Percentage (%)</span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="couponType"
                      value="FLAT"
                      checked={couponForm.type === "FLAT"}
                      onChange={() =>
                        setCouponForm((current) => ({
                          ...current,
                          type: "FLAT"
                        }))
                      }
                    />
                    <span>Flat (₹)</span>
                  </label>
                </div>
              </div>
              <div className="admin-coupon-row">
                <label className="admin-coupon-field">
                  <span>Discount Amount</span>
                  <div className="admin-coupon-amount">
                    <span className="admin-coupon-amount__symbol">
                      {couponForm.type === "PERCENT" ? "%" : "₹"}
                    </span>
                    <input
                      type="number"
                      value={couponForm.amount}
                      onChange={(event) =>
                        setCouponForm((current) => ({
                          ...current,
                          amount: event.target.value
                        }))
                      }
                      placeholder={couponForm.type === "PERCENT" ? "10" : "200"}
                    />
                  </div>
                </label>
                <label className="admin-coupon-field">
                  <span>
                    Min. Order <em>(Optional)</em>
                  </span>
                  <input
                    type="number"
                    className="admin-coupon-input"
                    value={couponForm.minOrderAmount}
                    onChange={(event) =>
                      setCouponForm((current) => ({
                        ...current,
                        minOrderAmount: event.target.value
                      }))
                    }
                    placeholder="₹500"
                  />
                </label>
              </div>
              <div className="admin-coupon-row">
                <label className="admin-coupon-field">
                  <span>Start Date</span>
                  <input
                    type="date"
                    className="admin-coupon-input"
                    value={couponForm.startsAt}
                    onChange={(event) =>
                      setCouponForm((current) => ({
                        ...current,
                        startsAt: event.target.value
                      }))
                    }
                  />
                </label>
                <label className="admin-coupon-field">
                  <span>End Date</span>
                  <input
                    type="date"
                    className="admin-coupon-input"
                    value={couponForm.endsAt}
                    onChange={(event) =>
                      setCouponForm((current) => ({
                        ...current,
                        endsAt: event.target.value
                      }))
                    }
                  />
                </label>
              </div>
              <div className="admin-coupon-row">
                <label className="admin-coupon-field">
                  <span>Usage Limit</span>
                  <input
                    type="number"
                    className="admin-coupon-input"
                    value={couponForm.usageLimit}
                    onChange={(event) =>
                      setCouponForm((current) => ({
                        ...current,
                        usageLimit: event.target.value
                      }))
                    }
                  />
                </label>
                <label className="admin-coupon-field">
                  <span>Per-customer Limit</span>
                  <input
                    type="number"
                    className="admin-coupon-input"
                    value={couponForm.perCustomerLimit}
                    onChange={(event) =>
                      setCouponForm((current) => ({
                        ...current,
                        perCustomerLimit: event.target.value
                      }))
                    }
                  />
                </label>
              </div>
              <div className="admin-coupon-footer">
                <label className="admin-coupon-switch">
                  <input
                    type="checkbox"
                    checked={couponForm.active}
                    onChange={(event) =>
                      setCouponForm((current) => ({
                        ...current,
                        active: event.target.checked
                      }))
                    }
                  />
                  <span />
                  <span>Active</span>
                </label>
                <div className="admin-coupon-footer__actions">
                  <button className="admin-coupon-submit" type="button" onClick={handleSaveCoupon}>
                    {couponEditorId ? "Update Coupon" : "Generate Coupon"}
                  </button>
                  {couponEditorId ? (
                    <button className="ghost" type="button" onClick={resetCouponForm}>
                      Cancel
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <section className="admin-coupon-list">
            <div className="admin-coupon-list__header">
              <h3>All Coupons</h3>
              <button className="link-button" type="button">
                See all
              </button>
            </div>
            <div className="admin-coupon-cards">
              {coupons.map((coupon) => {
                const hasLimit = coupon.usageLimit != null && coupon.usageLimit > 0;
                const progress = hasLimit
                  ? Math.min(100, Math.round((coupon.timesUsed / (coupon.usageLimit ?? 1)) * 100))
                  : 0;
                const limitLabel = hasLimit
                  ? `${coupon.timesUsed}/${coupon.usageLimit}`
                  : `${coupon.timesUsed}/∞`;
                const description = `${
                  coupon.type === "PERCENT"
                    ? `${coupon.amount}% OFF`
                    : `Flat ₹${coupon.amount} OFF`
                } • ${coupon.minOrderAmount > 0 ? `Min. Order ₹${coupon.minOrderAmount}` : "No Min. Order"}`;

                return (
                  <article
                    key={coupon.id}
                    className={`admin-coupon-card ${coupon.active ? "" : "is-paused"}`}
                  >
                    <div className="admin-coupon-card__top">
                      <div>
                        <div className="admin-coupon-card__title">
                          <h4>{coupon.code}</h4>
                          <span
                            className={`admin-coupon-status ${
                              coupon.active ? "is-active" : "is-paused"
                            }`}
                          >
                            {coupon.active ? "Active" : "Paused"}
                          </span>
                        </div>
                        <p className="admin-coupon-card__meta">{description}</p>
                      </div>
                      <label className="admin-coupon-switch">
                        <input
                          type="checkbox"
                          checked={coupon.active}
                          onChange={() => handleToggleCouponActive(coupon)}
                        />
                        <span />
                      </label>
                    </div>
                    <div className="admin-coupon-card__bottom">
                      <div className="admin-coupon-progress">
                        <div className="admin-coupon-progress__row">
                          <span>Redeemed</span>
                          <span>{limitLabel}</span>
                        </div>
                        <div className="admin-coupon-progress__track">
                          <div style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                      <div className="admin-coupon-expiry">
                        <span>Expires</span>
                        <strong>{formatCouponDate(coupon.endsAt)}</strong>
                      </div>
                    </div>
                    <div className="admin-coupon-card__actions">
                      <button
                        className="ghost"
                        type="button"
                        onClick={() => handleEditCoupon(coupon)}
                      >
                        Edit
                      </button>
                      <button
                        className="ghost"
                        type="button"
                        onClick={() => handleDeleteCoupon(coupon.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      ) : null}

      {selectedOrder ? (
        <div className="admin-detail">
          <div
            className="admin-detail__backdrop"
            onClick={() => setSelectedOrder(null)}
          />
          <div className="admin-detail__panel" role="dialog" aria-modal="true">
            <header className="admin-detail__header">
              <button className="ghost" onClick={() => setSelectedOrder(null)} type="button">
                Back
              </button>
              <div>
                <h3>Order #{selectedOrder.id}</h3>
                <p className="muted">Placed on {formattedOrderDate(selectedOrder)}</p>
              </div>
              <span className="admin-pill">{selectedOrder.status}</span>
            </header>

            <section className="admin-detail__section">
              <h4>Guest Info</h4>
              <div className="admin-detail__card">
                <p className="admin-detail__name">{selectedOrder.customerName}</p>
                <p className="muted">{selectedOrder.phoneNumber}</p>
                <p className="muted">PIN Code: {selectedOrder.pinCode}</p>
                {selectedOrder.addressLine1 || selectedOrder.addressCity ? (
                  <div className="admin-detail__address">
                    <p className="muted">
                      {selectedOrder.addressLabel ? `${selectedOrder.addressLabel} • ` : ""}
                      {selectedOrder.addressLine1 ?? ""}
                    </p>
                    {selectedOrder.addressLine2 ? (
                      <p className="muted">{selectedOrder.addressLine2}</p>
                    ) : null}
                    {selectedOrder.addressCity || selectedOrder.addressState ? (
                      <p className="muted">
                        {[selectedOrder.addressCity, selectedOrder.addressState]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </section>

            <section className="admin-detail__section">
              <h4>Order Items</h4>
              {selectedOrder.items && selectedOrder.items.length > 0 ? (
                <div className="admin-detail__card admin-detail__items">
                  {selectedOrder.items.map((item, index) => (
                    <div key={`${item.itemType}-${item.itemRefId}-${index}`} className="admin-detail__item">
                      <div>
                        <p className="admin-detail__item-name">{item.itemName}</p>
                        <p className="muted">
                          {item.itemType === "COMBO" ? "Combo" : "Product"} · ₹{item.unitPriceInr} × {item.quantity}
                        </p>
                      </div>
                      <strong>₹{item.lineTotalInr}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="admin-detail__card">
                  <p className="muted">{selectedOrder.items?.length ?? 0} item(s)</p>
                </div>
              )}
            </section>

            <section className="admin-detail__section">
              <h4>Summary</h4>
              <div className="admin-detail__card admin-detail__summary">
                <div>
                  <span>Subtotal</span>
                  <strong>₹{selectedOrder.subtotalAmountInr ?? selectedOrder.totalAmountInr}</strong>
                </div>
                {selectedOrder.saleDiscountAmountInr && selectedOrder.saleDiscountAmountInr > 0 ? (
                  <div>
                    <span>Sale {selectedOrder.saleName ? `(${selectedOrder.saleName})` : ""}</span>
                    <strong>-₹{selectedOrder.saleDiscountAmountInr}</strong>
                  </div>
                ) : null}
                {selectedOrder.discountAmountInr && selectedOrder.discountAmountInr > 0 ? (
                  <div>
                    <span>Discount</span>
                    <strong>-₹{selectedOrder.discountAmountInr}</strong>
                  </div>
                ) : null}
                {selectedOrder.couponCode ? (
                  <div>
                    <span>Coupon</span>
                    <strong>{selectedOrder.couponCode}</strong>
                  </div>
                ) : null}
                <div>
                  <span>Total Amount</span>
                  <strong>₹{selectedOrder.totalAmountInr}</strong>
                </div>
              </div>
            </section>

            <section className="admin-detail__section">
              <h4>Payment</h4>
              <div className="admin-detail__card">
                <p className="admin-detail__name">{selectedOrder.paymentMethod ?? "-"}</p>
                <p className="muted">Provider: {selectedOrder.paymentProvider ?? "-"}</p>
                <p className="muted">Reference: {selectedOrder.paymentReference ?? "-"}</p>
                <p className="muted">Status: {selectedOrder.paymentStatus ?? "PENDING"}</p>
              </div>
            </section>

            <div className="admin-detail__actions">
              <button
                className="primary"
                type="button"
                onClick={() => handleOpenWhatsAppChat(selectedOrder)}
              >
                Chat on WhatsApp
              </button>
              <div className="admin-detail__row">
                <Select
                  value={orderStatusDrafts[selectedOrder.id] ?? selectedOrder.status}
                  onValueChange={(value) =>
                    setOrderStatusDrafts((current) => ({
                      ...current,
                      [selectedOrder.id]: value
                    }))
                  }
                >
                  <SelectTrigger className="admin-select" placeholder="Status" />
                  <SelectContent>
                    {orderStatuses.map((status, index) => (
                      <SelectItem key={status} index={index} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button
                  className="ghost"
                  onClick={() => handleUpdateOrderStatus(selectedOrder.id)}
                  type="button"
                >
                  Update Status
                </button>
              </div>
              <div className="admin-detail__row">
                <Select
                  value={paymentStatusDrafts[selectedOrder.id] ?? "PENDING"}
                  onValueChange={(value) =>
                    setPaymentStatusDrafts((current) => ({
                      ...current,
                      [selectedOrder.id]: value
                    }))
                  }
                >
                  <SelectTrigger className="admin-select" placeholder="Payment" />
                  <SelectContent>
                    {paymentStatuses.map((status, index) => (
                      <SelectItem key={status} index={index} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button
                  className="ghost"
                  onClick={() => handleUpdatePaymentStatus(selectedOrder.id)}
                  type="button"
                >
                  Update Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <nav className="admin-bottom-nav">
        {(
          [
            {
              key: "orders",
              label: "Orders",
              icon: (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm2 5h6m-6 4h6m-6 4h4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              )
            },
            {
              key: "stats",
              label: "Stats",
              icon: (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M5 19V9m7 10V5m7 14v-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              )
            },
            {
              key: "reviews",
              label: "Reviews",
              icon: (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M7 18l-1.5 3.5L9 20l2 2 2.5-5.5M6 11a6 6 0 1 0 12 0a6 6 0 0 0-12 0z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              )
            },
            {
              key: "stock",
              label: "Product",
              icon: (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M6 8h12l-1 11H7L6 8zm2-4h8l1 4H7l1-4z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              )
            },
            {
              key: "coupons",
              label: "Coupons",
              icon: (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M4 9a2 2 0 0 0 2-2h12a2 2 0 0 0 2 2v6a2 2 0 0 0-2 2H6a2 2 0 0 0-2-2V9z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M10 9h4m-4 6h4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              )
            }
          ] as const
        ).map((item) => (
          <button
            key={item.key}
            className={`admin-bottom-nav__item ${tab === item.key ? "is-active" : ""}`}
            onClick={() => setTab(item.key)}
            type="button"
          >
            <span className="admin-bottom-nav__icon">{item.icon}</span>
            <span className="admin-bottom-nav__label">{item.label}</span>
          </button>
        ))}
      </nav>
    </section>
  );
};
