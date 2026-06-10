import './style.css';
import { api } from './api.js';

const storageKey = 'life-assistant-state';

const merchantAvatarPool = [
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=400&q=80'
];

const fallbackUserAvatar = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80';

const defaultState = {
  auth: {
    user: null,
    role: 'guest',
    merchantId: null,
    riderId: null,
    adminId: null
  },
  cart: [],
  orders: [],
  coupons: [],
  addresses: [
    { name: '家', detail: '滨江路 88号 3单元 1802室', phone: '138****1234' },
    { name: '公司', detail: '科技园 A座 16层', phone: '139****5678' }
  ],
  profile: {
    nickname: '生活达人',
    phone: '138****1234',
    avatar: fallbackUserAvatar
  },
  merchants: [],
  dashboard: {},
  loading: false,
  error: null,
  selectedMerchantId: 1,
  selectedProductId: null,
  orderTab: '全部',
  searchText: '',
  filterCategory: '全部',
  chosenCouponId: null,
  route: '#/home',
  toast: null,
  deliveryTick: 0,
  productPickerOpen: false,
  productPickerAction: 'add',
  productPickerQuantity: 1,
  activeProductVariantId: null,
  activeProductGalleryIndex: 0,
  chatThreads: {},
  currentChatMerchantId: null,
  merchantTagModalOpen: false,
  merchantTagDraft: '',
  searchDraft: '',
  searchHistory: ['一品生煎 花园路店 外卖', '一品生煎 中关村店 外卖'],
  hotSearches: [
    {
      title: '新鲜荔枝时令开售',
      heat: '1000.0万热度',
      desc: '2026年5月荔枝新鲜上市，妃子笑、桂味含维C钾丰富，清甜助眠好时光共享',
      image: 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?auto=format&fit=crop&w=300&q=80'
    },
    {
      title: '各地特色早餐推荐',
      heat: '872.7万热度',
      desc: '2026年特色早餐风味升级，兰州牛肉面、武汉热干面等成为各地美食新打卡地',
      image: 'https://images.unsplash.com/photo-1512058564366-c9e3cd51c5f3?auto=format&fit=crop&w=300&q=80'
    }
  ],
  discoverKeywords: ['一品生煎', '北京环球度假区', '比格比萨自助', '蛋糕', '比格披萨', '肯德基', 'KTV', '库迪咖啡', '麦当劳', '蜜雪冰城', '理发', '比格自助', '乐购达超市', '全季'],
  editingProductDraft: null,
  editingMerchantDraft: null,
  activeProductSelections: {},
  reviewDrafts: {},
  riderFilters: {
    tab: 'available'
  },
  riderOnline: true
};

let state = loadState();
let etaTimer = null;

function extractListPayload(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }
  return [];
}

function flattenRiderTaskPayload(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }
  return [
    ...sanitizeArray(payload?.available),
    ...sanitizeArray(payload?.assigned),
    ...sanitizeArray(payload?.completed)
  ];
}

function sanitizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function sanitizeObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function loadState() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) {
    return structuredClone(defaultState);
  }

  try {
    const parsed = JSON.parse(raw);
    const safeParsed = sanitizeObject(parsed);
    const validRoutes = ['#/home', '#/merchant', '#/cart', '#/orders', '#/profile', '#/login', '#/merchant-dashboard', '#/rider-dashboard', '#/admin-dashboard', '#/chat', '#/product-reviews', '#/search'];
    const currentHash = typeof window !== 'undefined' ? window.location.hash : '';
    const productRoute = currentHash.match(/^#\/product\//);
    const merchantEditorRoute = currentHash.match(/^#\/merchant-product-editor\//);
    const reviewRoute = currentHash.match(/^#\/product-reviews\//);
    const initialRoute = validRoutes.includes(currentHash) || productRoute || merchantEditorRoute || reviewRoute ? currentHash : defaultState.route;

    const normalized = structuredClone(defaultState);
    normalized.auth = { ...defaultState.auth, ...sanitizeObject(safeParsed.auth) };
    normalized.profile = { ...defaultState.profile, ...sanitizeObject(safeParsed.profile) };
    normalized.addresses = sanitizeArray(safeParsed.addresses).length ? sanitizeArray(safeParsed.addresses) : defaultState.addresses;
    normalized.cart = sanitizeArray(safeParsed.cart);
    normalized.orders = sanitizeArray(safeParsed.orders).filter((item) => item && typeof item === 'object').map(normalizeOrder);
    normalized.coupons = sanitizeArray(safeParsed.coupons);
    normalized.merchants = sanitizeArray(safeParsed.merchants);
    normalized.dashboard = sanitizeObject(safeParsed.dashboard);
    normalized.loading = false;
    normalized.error = typeof safeParsed.error === 'string' ? safeParsed.error : null;
    normalized.selectedMerchantId = Number(safeParsed.selectedMerchantId) || defaultState.selectedMerchantId;
    normalized.orderTab = ['全部', '待支付', '配送中', '待使用', '已完成', '已取消'].includes(safeParsed.orderTab)
      ? safeParsed.orderTab
      : defaultState.orderTab;
    normalized.searchText = typeof safeParsed.searchText === 'string' ? safeParsed.searchText : defaultState.searchText;
    normalized.filterCategory = typeof safeParsed.filterCategory === 'string' ? safeParsed.filterCategory : defaultState.filterCategory;
    normalized.chosenCouponId = typeof safeParsed.chosenCouponId === 'string' ? safeParsed.chosenCouponId : null;
    normalized.selectedProductId = typeof safeParsed.selectedProductId === 'string' ? safeParsed.selectedProductId : (productRoute ? currentHash.replace(/^#\/product\//, '').split('/')[0] : null);
    normalized.route = initialRoute;
    normalized.toast = typeof safeParsed.toast === 'string' ? safeParsed.toast : null;
    normalized.deliveryTick = Number.isFinite(Number(safeParsed.deliveryTick)) ? Number(safeParsed.deliveryTick) : defaultState.deliveryTick;
    normalized.productPickerOpen = Boolean(safeParsed.productPickerOpen);
    normalized.productPickerAction = safeParsed.productPickerAction === 'buy' ? 'buy' : 'add';
    normalized.productPickerQuantity = Number.isFinite(Number(safeParsed.productPickerQuantity)) ? Number(safeParsed.productPickerQuantity) : defaultState.productPickerQuantity;
    normalized.activeProductVariantId = typeof safeParsed.activeProductVariantId === 'string' ? safeParsed.activeProductVariantId : defaultState.activeProductVariantId;
    normalized.activeProductGalleryIndex = Number.isFinite(Number(safeParsed.activeProductGalleryIndex)) ? Number(safeParsed.activeProductGalleryIndex) : defaultState.activeProductGalleryIndex;
    normalized.chatThreads = sanitizeObject(safeParsed.chatThreads);
    normalized.currentChatMerchantId = Number(safeParsed.currentChatMerchantId) || null;
    normalized.merchantTagModalOpen = Boolean(safeParsed.merchantTagModalOpen);
    normalized.merchantTagDraft = typeof safeParsed.merchantTagDraft === 'string' ? safeParsed.merchantTagDraft : defaultState.merchantTagDraft;
    normalized.searchDraft = typeof safeParsed.searchDraft === 'string' ? safeParsed.searchDraft : defaultState.searchDraft;
    normalized.searchHistory = sanitizeArray(safeParsed.searchHistory).filter(Boolean).length ? sanitizeArray(safeParsed.searchHistory).filter(Boolean) : defaultState.searchHistory;
    normalized.hotSearches = sanitizeArray(safeParsed.hotSearches).length ? sanitizeArray(safeParsed.hotSearches) : defaultState.hotSearches;
    normalized.discoverKeywords = sanitizeArray(safeParsed.discoverKeywords).filter(Boolean).length ? sanitizeArray(safeParsed.discoverKeywords).filter(Boolean) : defaultState.discoverKeywords;
    normalized.activeProductSelections = sanitizeObject(safeParsed.activeProductSelections);
    normalized.reviewDrafts = sanitizeObject(safeParsed.reviewDrafts);
    normalized.riderFilters = { ...defaultState.riderFilters, ...sanitizeObject(safeParsed.riderFilters) };
    normalized.riderOnline = typeof safeParsed.riderOnline === 'boolean' ? safeParsed.riderOnline : defaultState.riderOnline;

    return normalized;
  } catch {
    localStorage.removeItem(storageKey);
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function normalizeOrder(order) {
  const etaMinutes = typeof order.etaMinutes === 'number' ? order.etaMinutes : (order.status === '配送中' ? 18 : 0);
  const normalized = {
    ...order,
    merchantId: order.merchantId || null,
    riderId: order.riderId || null,
    riderName: order.riderName || null,
    etaMinutes,
    items: sanitizeArray(order.items).map((item) => ({
      ...item,
      id: item.id,
      name: item.name || '商品',
      quantity: Number(item.quantity) || 1,
      price: Number(item.price) || 0,
      variantId: item.variantId || null,
      variantLabel: item.variantLabel || item.spec || '标准规格',
      reviewed: Boolean(item.reviewed),
      reviewedAt: item.reviewedAt || null
    })),
    reviewedProductIds: sanitizeArray(order.reviewedProductIds).filter(Boolean)
  };

  if (order.status === '配送中') {
    normalized.eta = `${Math.max(5, etaMinutes)} 分钟`;
  } else if (order.status === '待支付') {
    normalized.eta = '等待支付';
  } else if (order.status === '待使用') {
    normalized.eta = '待核销';
  } else if (order.status === '待取餐') {
    normalized.eta = '骑手待取餐';
  } else if (order.status === '已取消') {
    normalized.eta = '订单已取消';
  } else if (order.status === '已完成') {
    normalized.eta = '已送达';
  }

  return normalized;
}

function isLoggedIn() {
  return Boolean(state.auth.user);
}

function isConsumer() {
  return state.auth.role === 'consumer';
}

function isMerchant() {
  return state.auth.role === 'merchant';
}

function isRider() {
  return state.auth.role === 'rider';
}

function isAdmin() {
  return state.auth.role === 'admin';
}

function getRoleLabel() {
  if (isMerchant()) return '商家';
  if (isRider()) return '骑手';
  if (isAdmin()) return '管理员';
  if (isConsumer()) return '普通用户';
  return '游客';
}

function logoutCurrentAccount() {
  state.auth = { ...defaultState.auth };
  state.profile = structuredClone(defaultState.profile);
  state.cart = [];
  state.chosenCouponId = null;
  saveState();
  showToast('已退出当前账号');
  setRoute('#/home');
}

function isPurchaseBlockedRole() {
  return !isConsumer();
}

function requireConsumerAction(message = '请先登录普通用户账号后再继续') {
  if (isConsumer()) return true;
  showToast(message);
  setRoute('#/login');
  render();
  return false;
}

function showToast(message) {
  state.toast = message;
  saveState();
  const toast = document.getElementById('app-toast');
  if (toast) {
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
      toast.hidden = true;
    }, 1800);
  }
}

function setRoute(route) {
  state.route = route;
  localStorage.setItem('lastRoute', route);
  location.hash = route;
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function getCurrentMerchant() {
  return state.merchants.find((merchant) => String(merchant.id) === String(state.auth.merchantId)) || null;
}

function getSelectedMerchant() {
  const selected = state.merchants.find((merchant) => String(merchant.id) === String(state.selectedMerchantId));
  return selected || state.merchants[0] || null;
}

function getMerchantStats(merchant) {
  const merchantOrders = state.orders.filter((order) => Number(order.merchantId) === Number(merchant?.id));
  return {
    totalOrders: merchantOrders.length,
    pendingOrders: merchantOrders.filter((order) => ['待支付', '待取餐', '配送中', '待使用'].includes(order.status)).length,
    revenue: merchantOrders.reduce((sum, order) => sum + Number(order.amount || 0), 0)
  };
}

function getRiderDashboardData() {
  const riderOrders = state.orders.filter((order) => order.type === '外卖');
  return {
    riderName: state.profile.nickname || '骑手小哥',
    riderCode: state.auth.riderId || 'rider-001',
    serviceArea: state.profile.serviceArea || '学院路 / 中关村 / 五道口',
    online: state.riderOnline,
    todayDeliveries: riderOrders.length,
    pendingPickups: riderOrders.filter((order) => order.status === '待取餐').length,
    completedOrders: riderOrders.filter((order) => order.status === '已完成').length,
    income: riderOrders.filter((order) => order.status === '已完成').reduce((sum, order) => sum + Number(order.amount || 0) * 0.12, 0),
    tasks: riderOrders.map((order) => ({
      id: order.id,
      merchant: order.merchant,
      pickup: findMerchantByProduct(order.items?.[0]?.id || '')?.address || '商家地址待确认',
      destination: '用户收货地址',
      status: order.status,
      eta: order.eta,
      riderId: order.riderId,
      riderName: order.riderName,
      amount: Number(order.amount || 0),
      income: Number((Number(order.amount || 0) * 0.12).toFixed(2)),
      items: sanitizeArray(order.items).map((item) => `${item.name} ×${item.quantity}`).join(' / ')
    }))
  };
}

function syncRiderOrderView(updatedOrder) {
  const index = state.orders.findIndex((order) => order.id === updatedOrder.id);
  if (index >= 0) {
    state.orders[index] = normalizeOrder(updatedOrder);
  }
}

async function refreshRoleData() {
  const tasks = [];
  if (isMerchant()) {
    const merchant = getCurrentMerchant();
    if (merchant) {
      tasks.push(api.getMerchantOrders(merchant.id).then((orders) => {
        const otherOrders = state.orders.filter((order) => Number(order.merchantId) !== Number(merchant.id));
        state.orders = otherOrders.concat(orders.map(normalizeOrder));
      }));
    }
  }
  if (isRider()) {
    tasks.push(api.getRiderTasks().then((tasksData) => {
      flattenRiderTaskPayload(tasksData).forEach((task) => {
        const localOrder = state.orders.find((order) => order.id === task.id);
        if (localOrder) {
          localOrder.status = task.status;
          localOrder.eta = task.eta;
        }
      });
    }));
  }
  if (isConsumer()) {
    tasks.push(api.getOrders().then((orders) => {
      state.orders = orders.map(normalizeOrder);
    }));
  }
  if (tasks.length) {
    await Promise.all(tasks);
    saveState();
  }
}

function getVisibleRiderTasks() {
  const buckets = getRiderTaskBuckets();
  const tab = state.riderFilters.tab;
  if (tab === 'assigned') return buckets.assigned;
  if (tab === 'completed') return buckets.completed;
  return buckets.available;
}

function getRiderTaskBuckets() {
  const riderId = state.auth.riderId;
  const tasks = state.orders
    .filter((order) => order.type === '外卖')
    .map((order) => ({
      id: order.id,
      merchant: order.merchant,
      pickup: findMerchantByProduct(order.items?.[0]?.id || '')?.address || '商家地址待确认',
      destination: '用户收货地址',
      status: order.status,
      eta: order.eta,
      riderId: order.riderId,
      riderName: order.riderName,
      amount: Number(order.amount || 0),
      income: Number((Number(order.amount || 0) * 0.12).toFixed(2)),
      items: sanitizeArray(order.items).map((item) => `${item.name} x${item.quantity}`).join(' / ')
    }));

  const available = state.riderOnline
    ? tasks.filter((task) => task.status === '待取餐' && (!task.riderId || String(task.riderId) === String(riderId)))
    : [];
  const assigned = tasks.filter((task) => String(task.riderId) === String(riderId) && task.status !== '已完成');
  const completed = tasks.filter((task) => String(task.riderId) === String(riderId) && task.status === '已完成');

  return { available, assigned, completed };
}



function getProductImage(productId) {
  for (const merchant of state.merchants) {
    const product = merchant.products.find((item) => String(item.id) === String(productId));
    if (product?.image) {
      return product.image;
    }
  }
  return 'https://via.placeholder.com/120?text=商品';
}

function findProduct(productId) {
  for (const merchant of state.merchants) {
    const product = merchant.products.find((item) => String(item.id) === String(productId));
    if (product) return product;
  }
  return null;
}

function findMerchantByProduct(productId) {
  return state.merchants.find((merchant) => merchant.products.some((item) => String(item.id) === String(productId)));
}

function renderStars(rating, noScore) {
  const r = Math.round((rating || 0) * 10) / 10;
  const full = Math.floor(r);
  const parts = [];
  for (let i = 0; i < 5; i++) {
    parts.push(i < full ? '<span class="star filled">★</span>' : '<span class="star">☆</span>');
  }
  return `<span class="star-wrap">${parts.join('')}${noScore ? '' : `<em class=\"star-score\">${r}</em>`}</span>`;
}

function renderTags(tags) {
  if (!Array.isArray(tags) || !tags.length) return '';
  return `<div class="tag-list">${tags.map((t) => `<span class="tag-badge">${t}</span>`).join('')}</div>`;
}

function createBadge(open) {
  return `<span class="badge ${open ? 'open' : 'closed'}">${open ? '营业中' : '休息中'}</span>`;
}

function formatCurrency(value) {
  return `￥${Number(value).toFixed(2)}`;
}

function readAvatarFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('请选择图片文件'));
      return;
    }

    if (!file.type.startsWith('image/')) {
      reject(new Error('请选择图片格式文件'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      reject(new Error('图片不能超过 5MB'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('图片读取失败'));
    reader.readAsDataURL(file);
  });
}

function getFallbackUserAvatar() {
  return fallbackUserAvatar;
}

function getMerchantAvatar(merchant) {
  if (merchant?.avatar) {
    return merchant.avatar;
  }
  const index = Number(merchant?.id || 1) - 1;
  return merchantAvatarPool[index % merchantAvatarPool.length];
}

function getUserAvatar() {
  return state.profile.avatar || getFallbackUserAvatar();
}

function getRouteProductId() {
  const match = state.route.match(/^#\/product\/([^/]+)/);
  return match ? match[1] : null;
}

function getSelectedProduct() {
  const productId = state.selectedProductId || getRouteProductId();
  if (!productId) return null;
  return findProduct(productId);
}

function syncProductRating(product) {
  if (!product) return 0;
  const reviews = getProductReviews(product);
  if (reviews.length) {
    const average = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length;
    product.rating = Number(Math.round(average * 10) / 10);
  } else if (!Number.isFinite(Number(product.rating))) {
    product.rating = 0;
  }
  return Number(product.rating) || 0;
}

function normalizeSpecGroup(group, fallbackName = '规格维度') {
  // 兼容后端返回的 specs 字段（SpecGroupItem.specs）和前端使用的 values 字段
  const rawValues = sanitizeArray(group?.values?.length ? group.values : group?.specs);
  const normalizedValues = rawValues
    .map((value, index) => {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const label = String(value.label || value.value || '').trim();
        if (!label) return null;
        return {
          id: value.id || `${fallbackName}-${index + 1}`,
          label,
          image: value.image || ''
        };
      }
      const label = String(value || '').trim();
      if (!label) return null;
      return {
        id: `${fallbackName}-${index + 1}`,
        label,
        image: ''
      };
    })
    .filter(Boolean);

  if (!normalizedValues.length && typeof group?.values === 'string') {
    return {
      name: String(group?.name || fallbackName).trim(),
      useImage: Boolean(group?.useImage),
      values: String(group.values)
        .split(',')
        .map((value, index) => {
          const label = value.trim();
          return label ? { id: `${fallbackName}-${index + 1}`, label, image: '' } : null;
        })
        .filter(Boolean)
    };
  }

  return {
    name: String(group?.name || fallbackName).trim(),
    useImage: Boolean(group?.useImage),
    values: normalizedValues
  };
}

function buildGeneratedVariantsFromSpecGroups(product) {
  const normalizedGroups = sanitizeArray(product?.specGroups)
    .map((group, index) => normalizeSpecGroup(group, `规格维度 ${index + 1}`))
    .filter((group) => group.name && group.values.length);

  const existingSpecsById = new Map(
    sanitizeArray(product?.specs)
      .filter((spec) => spec && (spec.id || spec.label || spec.price !== undefined))
      .map((spec, index) => {
        const id = spec.id || `${product.id}-spec-${index + 1}`;
        return [id, {
          ...spec,
          id,
          selections: sanitizeObject(spec.selections)
        }];
      })
  );

  const existingSpecsBySelectionKey = new Map(
    Array.from(existingSpecsById.values())
      .filter((spec) => Object.keys(spec.selections || {}).length)
      .map((spec) => [
        normalizedGroups.map((group) => `${group.name}:${spec.selections[group.name] || ''}`).join('|'),
        spec
      ])
  );

  if (normalizedGroups.length) {
    const generatedVariants = [];

    const walk = (index, selections) => {
      if (index === normalizedGroups.length) {
        const selectionMap = selections.reduce((result, selection) => ({ ...result, [selection.name]: selection.value.label }), {});
        const selectionKey = normalizedGroups.map((group) => `${group.name}:${selectionMap[group.name] || ''}`).join('|');
        const existingSpec = existingSpecsBySelectionKey.get(selectionKey);
        const preferredImage = selections.find((selection) => selection.value.image)?.value.image || '';
        const fallbackId = `${product.id}-${selections.map((selection) => selection.value.label).join('-').replace(/\s+/g, '-')}`;
        generatedVariants.push({
          id: existingSpec?.id || fallbackId,
          label: selections.map((selection) => selection.value.label).join(' / '),
          price: Number.isFinite(Number(existingSpec?.price)) ? Number(existingSpec.price) : Number(product.price) || 0,
          stock: Number.isFinite(Number(existingSpec?.stock)) ? Number(existingSpec.stock) : Number(product.stock) || 0,
          badge: existingSpec?.badge || (generatedVariants.length === 0 ? '默认' : '可选'),
          image: existingSpec?.image || preferredImage || product.image || '',
          selections: selectionMap
        });
        return;
      }

      const group = normalizedGroups[index];
      group.values.forEach((value) => {
        walk(index + 1, selections.concat({ name: group.name, value }));
      });
    };

    walk(0, []);

    if (generatedVariants.length) {
      return generatedVariants;
    }
  }

  const existingSpecs = sanitizeArray(product?.specs)
    .filter((spec) => spec && (spec.label || spec.badge || spec.price !== undefined))
    .map((spec, index) => ({
      id: spec.id || `${product.id}-spec-${index + 1}`,
      label: spec.label || spec.name || `规格 ${index + 1}`,
      price: Number.isFinite(Number(spec.price)) ? Number(spec.price) : Number(product.price),
      stock: Number.isFinite(Number(spec.stock)) ? Number(spec.stock) : Number(product.stock),
      badge: spec.badge || (index === 0 ? '默认' : '可选'),
      image: spec.image || product.image || '',
      selections: sanitizeObject(spec.selections)
    }));

  if (existingSpecs.length) {
    return existingSpecs;
  }

  return [
    {
      id: `${product.id}-default`,
      label: '标准规格',
      price: Number(product.price) || 0,
      stock: Number(product.stock) || 0,
      badge: '默认',
      image: product.image || '',
      selections: {}
    }
  ];
}

function getProductVariants(product) {
  if (!product) return [];
  return buildGeneratedVariantsFromSpecGroups(product).map((variant, index) => ({
    id: variant.id || `${product.id}-spec-${index + 1}`,
    label: variant.label || variant.name || `规格 ${index + 1}`,
    price: Number.isFinite(Number(variant.price)) ? Number(variant.price) : Number(product.price),
    stock: Number.isFinite(Number(variant.stock)) ? Number(variant.stock) : Number(product.stock),
    badge: variant.badge || (index === 0 ? '默认' : '可选'),
    image: variant.image || product.image || '',
    selections: sanitizeObject(variant.selections)
  }));
}

function getProductSelectionState(product) {
  const variants = getProductVariants(product);
  const specGroups = sanitizeArray(product?.specGroups)
    .map((group, index) => normalizeSpecGroup(group, `规格维度 ${index + 1}`))
    .filter((group) => group.name && group.values.length);

  const storedSelections = sanitizeObject(state.activeProductSelections?.[product?.id]);
  const selections = {};

  specGroups.forEach((group) => {
    const allowedValues = group.values.map((value) => value.label);
    const storedValue = storedSelections[group.name];
    const firstAvailable = allowedValues.find((value) => variants.some((variant) => variant.selections[group.name] === value));
    selections[group.name] = allowedValues.includes(storedValue) ? storedValue : (firstAvailable || allowedValues[0]);
  });

  return { specGroups, selections, variants };
}

function getVariantForGroupValue(product, groupName, value, selections = {}) {
  const variants = getProductVariants(product);
  return variants.find(
    (variant) => variant.selections[groupName] === value
      && Object.entries(selections).every(
        ([key, current]) => !current || key === groupName || variant.selections[key] === current
      )
  ) || null;
}

function getSelectionSummaryText(product, selections) {
  const { specGroups } = getProductSelectionState(product);
  const selectedText = specGroups.map((group) => selections[group.name]).filter(Boolean).join(' / ');
  return selectedText || '标准规格';
}

function getVariantStockText(variant) {
  if (!variant) return '当前规格不可用';
  if (variant.stock <= 0) return '已售罄';
  if (variant.stock <= 5) return `仅剩 ${variant.stock} 件`;
  return '有货';
}

function setProductSelection(productId, groupName, value) {
  state.activeProductSelections[productId] = {
    ...sanitizeObject(state.activeProductSelections[productId]),
    [groupName]: value
  };
  saveState();
}

function matchVariantBySelections(product, selections) {
  const variants = getProductVariants(product);
  const matched = variants.find((variant) => Object.entries(selections).every(([groupName, value]) => variant.selections[groupName] === value));
  return matched || variants[0] || null;
}

function getAvailableValuesForGroup(product, groupName, selections) {
  const { variants, specGroups } = getProductSelectionState(product);
  const group = specGroups.find((entry) => entry.name === groupName);
  if (!group) return [];
  return group.values.filter((value) => variants.some((variant) => {
    if (variant.stock <= 0) return false;
    return specGroups.every((specGroup) => {
      const expected = specGroup.name === groupName ? value : selections[specGroup.name];
      return !expected || variant.selections[specGroup.name] === expected;
    });
  }));
}

function syncSelectionToAvailableVariant(product) {
  if (!product) return null;
  const { specGroups, selections } = getProductSelectionState(product);
  specGroups.forEach((group) => {
    const availableValues = getAvailableValuesForGroup(product, group.name, selections);
    if (!availableValues.includes(selections[group.name])) {
      selections[group.name] = availableValues[0] || group.values[0];
    }
  });
  state.activeProductSelections[product.id] = selections;
  const variant = matchVariantBySelections(product, selections);
  state.activeProductVariantId = variant?.id || null;
  saveState();
  return variant;
}

function getProductPrimaryPrice(product) {
  const variants = getProductVariants(product);
  if (!variants.length) return Number(product?.price) || 0;
  return variants.reduce((min, variant) => Math.min(min, Number(variant.price) || 0), Number(variants[0].price) || 0);
}

function getProductReviews(product) {
  const reviews = sanitizeArray(product?.reviews);
  return reviews
    .filter((review) => review && typeof review === 'object')
    .map((review) => ({
      ...review,
      images: sanitizeArray(review.images).filter(Boolean)
    }));
}

function getReviewDraftKey(orderId, productId) {
  return `${orderId}::${productId}`;
}

function getReviewDraft(orderId, productId) {
  const key = getReviewDraftKey(orderId, productId);
  const draft = sanitizeObject(state.reviewDrafts[key]);
  return {
    rating: Number(draft.rating) || 5,
    text: typeof draft.text === 'string' ? draft.text : '',
    images: sanitizeArray(draft.images).filter(Boolean)
  };
}

function updateReviewDraft(orderId, productId, updates) {
  const key = getReviewDraftKey(orderId, productId);
  state.reviewDrafts[key] = {
    ...getReviewDraft(orderId, productId),
    ...updates
  };
  saveState();
}

function clearReviewDraft(orderId, productId) {
  const key = getReviewDraftKey(orderId, productId);
  delete state.reviewDrafts[key];
  saveState();
}

function buildReviewImageGrid(images) {
  const list = sanitizeArray(images).filter(Boolean);
  if (!list.length) return '';
  return `<div class="review-image-grid">${list.map((image) => `<img src="${image}" alt="评价图片" />`).join('')}</div>`;
}

function renderReviewFeedCard(review, product) {
  const name = review.user || '匿名用户';
  const tagText = review.tag || '默认评价';
  const time = review.time || '';
  const text = review.text || '用户未填写文字评价';
  const images = buildReviewImageGrid(review.images);
  return `
    <article class="review-feed-card">
      <div class="review-feed-header">
        <div class="review-feed-user">
          <img class="review-feed-avatar" src="${review.avatar || getFallbackUserAvatar()}" alt="${name} 头像" />
          <div>
            <div class="review-feed-name-row">
              <strong>${name}</strong>
              <span class="review-level-badge">${Number(review.rating || 0)}星</span>
            </div>
            <div class="helper-note">${tagText}${time ? ` · ${time}` : ''}</div>
          </div>
        </div>
      </div>
      <div class="review-feed-body">
        <div class="review-feed-stars">${renderStars(review.rating, true)}</div>
        <p class="review-feed-text">${text}</p>
        ${images}
      </div>
      <div class="review-feed-actions">
        <span>👍 ${Number(review.likes) || 1}</span>
        <span>👎 点踩</span>
        <span>↗ 分享</span>
        <span>💬 ${Number(review.comments) || 0}</span>
      </div>
    </article>`;
}

function getReviewTags(product) {
  const reviews = getProductReviews(product);
  return [
    { label: '全部', count: reviews.length },
    { label: '图/视频', count: reviews.filter((review) => sanitizeArray(review.images).length).length },
    { label: '最新', count: reviews.length },
    { label: '好评', count: reviews.filter((review) => Number(review.rating) >= 4).length }
  ];
}

function getReviewPreviewList(product, limit = 2) {
  return getProductReviews(product).slice(0, limit);
}

function getReviewStatText(product) {
  const reviews = getProductReviews(product);
  if (!reviews.length) return '暂无评价';
  const goodCount = reviews.filter((review) => Number(review.rating) >= 4).length;
  return `好评 ${goodCount} · 共 ${reviews.length} 条`;
}

function getProductReviewRoute(productId) {
  return `#/product-reviews/${productId}`;
}

function getReviewableOrderItems(order) {
  if (!order || order.status === '已取消') return [];
  return sanitizeArray(order.items).filter((item) => item && !item.reviewed);
}

function buildProductImageVariants(image) {
  if (!image) return [];
  const widths = [600, 800, 1000];
  return widths.map((width) => String(image).replace(/w=\d+/g, `w=${width}`).replace(/q=\d+/g, 'q=90')).filter((candidate, index, array) => candidate && array.indexOf(candidate) === index);
}

function getProductGallery(product) {
  if (!product) return [];
  const detailGallery = sanitizeArray(Array.isArray(product?.gallery) ? product.gallery : (product?.gallery ? [product.gallery] : []));
  const gallery = detailGallery.filter(Boolean);
  const fallback = product?.image ? [product.image] : [];
  const merged = [...gallery, ...fallback].filter(Boolean);
  return [...new Set(merged)].slice(0, 8);
}

function getProductServices(product) {
  const services = sanitizeArray(product?.services);
  if (services.length) {
    return services.map((service) => ({ label: service, kind: '服务' }));
  }
  return [
    { label: '24小时客服', kind: '服务' },
    { label: '准时配送', kind: '配送' },
    { label: '退换无忧', kind: '保障' },
    { label: '品质保鲜', kind: '安全' }
  ];
}

function getRelatedProducts(product) {
  const merchant = findMerchantByProduct(product.id);
  if (!merchant) return [];
  return merchant.products.filter((item) => item.id !== product.id).slice(0, 4);
}

function getActiveProductVariant(product) {
  if (!product) return null;
  return syncSelectionToAvailableVariant(product);
}

function buildMerchantSpecGroups(product) {
  const groups = sanitizeArray(product?.specGroups)
    .map((group, index) => normalizeSpecGroup(group, `规格维度 ${index + 1}`))
    .filter((group) => group.name);

  if (groups.length) {
    return groups;
  }

  const specs = getProductVariants(product);
  const valueSet = Array.from(new Set(specs.map((spec) => spec.label).filter(Boolean)));
  if (valueSet.length > 1) {
    return [{
      name: '规格',
      useImage: false,
      values: valueSet.map((label, index) => ({ id: `规格-${index + 1}`, label, image: '' }))
    }];
  }

  return [];
}

function getRouteMerchantEditorProductId() {
  const match = state.route.match(/^#\/merchant-product-editor\/(.+)$/);
  return match ? match[1] : null;
}

function getRouteReviewProductId() {
  const match = state.route.match(/^#\/product-reviews\/([^/]+)/);
  return match ? match[1] : null;
}

function parseListValue(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function createBlankProduct(merchant) {
  const now = Date.now();
  return {
    id: `p${now}`,
    category: merchant?.category || '主食',
    name: '新商品',
    desc: '请输入商品描述',
    price: 18,
    sales: 0,
    stock: 10,
    image: merchant?.products?.[0]?.image || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
    gallery: [],
    services: ['24小时客服', '准时配送'],
    specs: [
      { id: `spec-${now}-1`, label: '标准规格', price: 18, stock: 10, badge: '默认', image: '', selections: {} }
    ],
    specGroups: [
      {
        name: '规格',
        useImage: false,
        values: [{ id: `spec-value-${now}-1`, label: '默认', image: '' }]
      }
    ],
    reviews: [],
    rating: 4.5,
    tags: ['新品']
  };
}

function hydrateMerchantEditorState(force = false) {
  const merchant = getSelectedMerchant();
  if (!merchant) {
    state.editingProductDraft = null;
    state.editingMerchantDraft = null;
    return;
  }

  const editorId = getRouteMerchantEditorProductId();
  const shouldReuseDraft = !force
    && state.editingProductDraft
    && state.editingMerchantDraft
    && (
      (editorId === 'new' && state.editingProductDraft.id)
      || state.editingProductDraft.id === editorId
    )
    && state.editingMerchantDraft.id === merchant.id;

  if (shouldReuseDraft) {
    return;
  }

  if (editorId === 'new') {
    state.editingProductDraft = createBlankProduct(merchant);
    state.editingMerchantDraft = structuredClone(merchant);
    state.merchantTagModalOpen = false;
    state.merchantTagDraft = '';
    return;
  }

  const existingProduct = merchant.products.find((item) => item.id === editorId);
  if (existingProduct) {
    const normalizedProduct = structuredClone(existingProduct);
    normalizedProduct.gallery = sanitizeArray(normalizedProduct.gallery);
    normalizedProduct.services = sanitizeArray(normalizedProduct.services);
    normalizedProduct.specs = sanitizeArray(normalizedProduct.specs).map((spec, index) => ({
      id: spec?.id || `${normalizedProduct.id}-spec-${index + 1}`,
      label: spec?.label || `规格 ${index + 1}`,
      price: Number.isFinite(Number(spec?.price)) ? Number(spec.price) : Number(normalizedProduct.price),
      stock: Number.isFinite(Number(spec?.stock)) ? Number(spec.stock) : Number(normalizedProduct.stock),
      badge: spec?.badge || (index === 0 ? '默认' : '可选'),
      image: spec?.image || '',
      selections: sanitizeObject(spec?.selections)
    }));
    normalizedProduct.tags = sanitizeArray(normalizedProduct.tags);
    normalizedProduct.reviews = sanitizeArray(normalizedProduct.reviews);
    normalizedProduct.specGroups = sanitizeArray(normalizedProduct.specGroups)
      .map((group, index) => normalizeSpecGroup(group, `规格维度 ${index + 1}`))
      .filter((group) => group.name && group.values.length);
    state.editingProductDraft = normalizedProduct;
    state.editingMerchantDraft = structuredClone(merchant);
    state.merchantTagModalOpen = false;
    state.merchantTagDraft = '';
  } else {
    state.editingProductDraft = createBlankProduct(merchant);
    state.editingMerchantDraft = structuredClone(merchant);
    state.merchantTagModalOpen = false;
    state.merchantTagDraft = '';
  }
}

function persistMerchantProductEditor() {
  const merchantDraft = state.editingMerchantDraft;
  const productDraft = state.editingProductDraft;

  if (!merchantDraft || !productDraft) {
    showToast('编辑数据异常');
    return;
  }

  merchantDraft.address = String(merchantDraft.address || '').trim();
  merchantDraft.phone = String(merchantDraft.phone || '').trim();
  if (!merchantDraft.address) {
    showToast('请填写店铺地址');
    return;
  }

  const merchant = state.merchants.find((entry) => entry.id === merchantDraft.id) || merchantDraft;
  const existingProduct = merchant.products.find((item) => item.id === getRouteMerchantEditorProductId()) || null;
  Object.assign(merchant, merchantDraft);

  const normalizedProduct = structuredClone(productDraft);
  normalizedProduct.gallery = sanitizeArray(normalizedProduct.gallery).filter(Boolean);
  normalizedProduct.services = sanitizeArray(normalizedProduct.services).filter(Boolean);
  normalizedProduct.tags = sanitizeArray(normalizedProduct.tags).filter(Boolean);
  normalizedProduct.reviews = sanitizeArray(normalizedProduct.reviews).filter((review) => review && typeof review === 'object');
  normalizedProduct.specGroups = sanitizeArray(normalizedProduct.specGroups)
    .map((group, index) => normalizeSpecGroup(group, `规格维度 ${index + 1}`))
    .filter((group) => group.name && group.values.length);

  normalizedProduct.specs = buildGeneratedVariantsFromSpecGroups(normalizedProduct)
    .map((variant, index) => ({
      id: variant.id || `spec-${Date.now()}-${index}`,
      label: variant.label || `规格 ${index + 1}`,
      price: Number(variant.price) || 0,
      stock: Number(variant.stock) || 0,
      badge: variant.badge || (index === 0 ? '默认' : '可选'),
      image: variant.image || '',
      selections: sanitizeObject(variant.selections)
    }));

  syncProductRating(normalizedProduct);

  if (normalizedProduct.gallery.length) {
    normalizedProduct.image = normalizedProduct.gallery[0];
  }

  normalizedProduct.sales = Number(existingProduct?.sales ?? normalizedProduct.sales ?? 0) || 0;

  const editorId = getRouteMerchantEditorProductId();
  if (editorId === 'new') {
    merchant.products.push(normalizedProduct);
  } else {
    if (existingProduct) {
      Object.assign(existingProduct, normalizedProduct);
    } else {
      merchant.products.push(normalizedProduct);
    }
  }

  state.selectedMerchantId = merchant.id;
  state.selectedProductId = normalizedProduct.id;
  state.editingProductDraft = null;
  state.editingMerchantDraft = null;
  state.merchantTagModalOpen = false;
  state.merchantTagDraft = '';
  saveState();
  showToast('商品与店铺信息已保存');
  setRoute('#/merchant-dashboard');
}

function syncSelectedProductFromRoute() {
  const routeProductId = getRouteProductId();
  if (routeProductId) {
    state.selectedProductId = routeProductId;
    state.activeProductGalleryIndex = 0;
    const product = findProduct(routeProductId);
    if (product) {
      const merchant = findMerchantByProduct(product.id);
      if (merchant) {
        state.selectedMerchantId = merchant.id;
        state.currentChatMerchantId = merchant.id;
      }
    }
  }
  return getSelectedProduct();
}

function ensureChatThread(merchant) {
  if (!merchant) return [];
  const merchantId = String(merchant.id);
  if (!state.chatThreads[merchantId]) {
    const introText = `您好，我是${merchant.name}的客服，欢迎咨询商品、配送与优惠信息。`;
    state.chatThreads[merchantId] = [
      {
        role: 'merchant',
        text: introText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  }
  return state.chatThreads[merchantId];
}

function isMessageReadByMerchant(message, index, messages) {
  if (message.role === 'merchant') {
    return true;
  }
  if (typeof message.merchantRead === 'boolean') {
    return message.merchantRead;
  }
  return messages.slice(index + 1).some((entry) => entry.role === 'merchant');
}

function pushChatMessage(merchant, message) {
  if (!merchant) return;
  const thread = ensureChatThread(merchant);
  const normalizedMessage = {
    ...message,
    merchantRead: message.role === 'user' ? false : true
  };

  if (normalizedMessage.role === 'merchant') {
    thread.forEach((entry) => {
      if (entry.role === 'user') {
        entry.merchantRead = true;
      }
    });
  }

  thread.push(normalizedMessage);
  state.chatThreads[String(merchant.id)] = thread;
  saveState();
}

function getChatMessagesForMerchant(merchant) {
  return ensureChatThread(merchant);
}

function openChatWithMerchant(merchant) {
  if (!merchant) return;
  state.selectedMerchantId = merchant.id;
  state.currentChatMerchantId = merchant.id;
  const currentProduct = getSelectedProduct();
  if (currentProduct) {
    state.selectedProductId = currentProduct.id;
  }
  ensureChatThread(merchant);
  saveState();
  setRoute('#/chat');
  render();
}

function openProductPicker() {
  state.productPickerOpen = true;
  const product = getSelectedProduct();
  const variants = getProductVariants(product);
  const { specGroups, selections } = getProductSelectionState(product);
  if (variants.length) {
    const variant = matchVariantBySelections(product, selections) || variants[0];
    state.activeProductVariantId = variant?.id || variants[0].id;
  }
  state.productPickerQuantity = Math.max(1, Number(state.productPickerQuantity) || 1);
  saveState();
}

function closeProductPicker() {
  state.productPickerOpen = false;
  saveState();
}

function addProductToCart(productId, quantity = 1, redirect = false) {
  const product = findProduct(productId);
  if (!product) {
    showToast('商品不存在');
    return;
  }

  const variant = getActiveProductVariant(product);
  const selectedQuantity = Math.max(1, Number(quantity) || 1);
  if (!variant) {
    showToast('当前规格不可用');
    return;
  }
  if (variant.stock < selectedQuantity) {
    showToast('当前规格库存不足，无法加入购物车');
    return;
  }

  const merchant = findMerchantByProduct(productId);
  const existing = state.cart.find((item) => String(item.id) === String(productId) && String(item.variantId) === String(variant.id));
  if (existing) {
    existing.quantity += selectedQuantity;
  } else {
    state.cart.push({
      id: productId,
      name: product.name,
      merchant: merchant?.name || '未知商家',
      price: variant.price,
      quantity: selectedQuantity,
      variantId: variant.id,
      variantLabel: variant.label,
      spec: variant.label,
      image: variant.image || product.image || ''
    });
  }

  variant.stock = Math.max(0, variant.stock - selectedQuantity);
  product.stock = getProductVariants(product).reduce((sum, item) => sum + (Number(item.stock) || 0), 0);
  state.productPickerOpen = false;
  state.productPickerQuantity = 1;
  saveState();
  showToast(`已加入 ${variant.label} ×${selectedQuantity} 件购物车`);
  if (redirect) {
    setRoute('#/cart');
  } else {
    render();
  }
}

function getAvailableCoupons() {
  const subtotal = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return state.coupons.filter((coupon) => subtotal >= coupon.threshold);
}

function getBestCoupon() {
  const available = getAvailableCoupons();
  if (!available.length) return null;
  return available.reduce((best, current) => (current.discount > best.discount ? current : best), available[0]);
}

function getCartSummary() {
  const subtotal = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const delivery = subtotal >= 30 ? 0 : 4;
  const coupon = state.coupons.find((coupon) => coupon.id === state.chosenCouponId) || getBestCoupon();
  const discount = coupon ? coupon.discount : 0;
  return { subtotal, delivery, discount, total: Math.max(0, subtotal + delivery - discount), coupon };
}

function syncOrdersFromServer() {
  state.orders = state.orders.map((order) => {
    if (order.status === '配送中') {
      const minutes = Math.max(5, order.etaMinutes - 1);
      const etaText = minutes <= 0 ? '已送达' : `${minutes} 分钟`;
      return normalizeOrder({ ...order, etaMinutes: minutes, eta: etaText, status: minutes <= 0 ? '已完成' : '配送中' });
    }
    return normalizeOrder(order);
  });
}

function startEtaTicker() {
  clearInterval(etaTimer);
  etaTimer = setInterval(() => {
    syncOrdersFromServer();
    saveState();
    render();
  }, 60 * 1000);
}

function buildTopbar() {
  const navItems = [
    { route: '#/home', label: '首页', visible: true },
    { route: '#/cart', label: '购物车', visible: isConsumer() },
    { route: '#/orders', label: '订单', visible: isConsumer() },
    { route: '#/profile', label: isMerchant() ? '商家资料' : isRider() ? '骑手资料' : '个人中心', visible: !isAdmin() },
    { route: '#/merchant-dashboard', label: '商家后台', visible: isMerchant() },
    { route: '#/rider-dashboard', label: '骑手工作台', visible: isRider() },
    { route: '#/admin-dashboard', label: '管理后台', visible: isAdmin() },
    { route: '#/login', label: isLoggedIn() ? '切换账号' : '登录', visible: true }
  ].filter((item) => item.visible);

  return `
    <div class="topbar">
      <div class="topbar-inner">
        <div class="brand">
          <div class="brand-mark">LA</div>
          <div class="brand-title">
            <h1>生活助手平台</h1>
            <p>吃喝玩乐一站式生活服务</p>
          </div>
        </div>
        <div class="nav-group">
          ${navItems.map((item) => `<button class="nav-pill ${state.route === item.route ? 'active' : ''}" data-route="${item.route}">${item.label}</button>`).join('')}
        </div>
      </div>
    </div>`;
}

function buildHomeSearchBar() {
  return `
    <section class="home-search-banner">
      <div class="home-search-topline">
        <div class="location-chip">📍 当前位置 · 附近吃喝玩乐</div>
        <div class="search-top-actions">
          <button class="icon-circle" type="button">💬</button>
          <button class="icon-circle" type="button">⌗</button>
        </div>
      </div>
      <button class="home-search-box" id="openSearchPageBtn" type="button">
        <span class="home-search-placeholder">${state.searchDraft || '北京环球度假区'}</span>
        <span class="home-search-submit">搜索</span>
      </button>
    </section>`;
}

function getSearchSuggestions() {
  const keyword = state.searchDraft.trim().toLowerCase();
  if (!keyword) {
    return state.discoverKeywords.slice(0, 12);
  }
  const merchantMatches = state.merchants
    .flatMap((merchant) => [merchant.name, merchant.category, ...(merchant.products || []).map((product) => product.name)])
    .filter(Boolean)
    .filter((item, index, array) => array.indexOf(item) === index)
    .filter((item) => item.toLowerCase().includes(keyword));
  const discoverMatches = state.discoverKeywords.filter((item) => item.toLowerCase().includes(keyword));
  return [...new Set([...merchantMatches, ...discoverMatches])].slice(0, 12);
}

function commitSearch(keyword) {
  const value = String(keyword || '').trim();
  if (!value) {
    showToast('请输入搜索内容');
    return;
  }
  state.searchDraft = value;
  state.searchText = value;
  state.filterCategory = '全部';
  state.searchHistory = [value, ...state.searchHistory.filter((item) => item !== value)].slice(0, 8);
  saveState();
  setRoute('#/home');
}

function renderSearchPage() {
  const suggestions = getSearchSuggestions();
  return `
    <div class="shell search-page-shell">
      <div class="panel search-page-panel">
        <div class="search-page-header">
          <button class="btn ghost" id="backFromSearchBtn">返回</button>
          <div class="search-page-tabs">
            <span class="search-tab active">搜索</span>
            <span class="search-tab">问小团</span>
            <span class="search-tab-tip">吃喝玩乐，小团都安排</span>
          </div>
        </div>

        <div class="search-page-box-row">
          <div class="search-page-box">
            <input class="input search-page-input" id="searchPageInput" value="${state.searchDraft}" placeholder="比格披萨" />
            <button class="search-page-submit" id="searchPageSubmitBtn">搜索</button>
          </div>
        </div>

        <section class="search-section-block">
          <div class="section-head">
            <h3>历史搜索</h3>
            <button class="btn ghost" id="clearSearchHistoryBtn">清空</button>
          </div>
          <div class="search-chip-list">
            ${state.searchHistory.map((item) => `<button class="search-chip" data-search-keyword="${item}">${item}</button>`).join('') || '<span class="helper-note">暂无历史搜索</span>'}
          </div>
        </section>

        <section class="search-section-block">
          <div class="section-head">
            <h3>发现</h3>
            <span class="helper-note">猜你想搜</span>
          </div>
          <div class="search-chip-list discover-list">
            ${suggestions.map((item) => `<button class="search-chip light" data-search-keyword="${item}">${item}</button>`).join('')}
          </div>
        </section>

        <section class="search-section-block">
          <div class="section-head">
            <h3>美团热搜</h3>
          </div>
          <div class="hot-search-list">
            ${state.hotSearches.map((item) => `
              <button class="hot-search-card" data-search-keyword="${item.title}">
                <div class="hot-search-copy">
                  <strong>${item.title}</strong>
                  <span class="hot-search-heat">${item.heat}</span>
                  <p>${item.desc}</p>
                </div>
                <img src="${item.image}" alt="${item.title}" />
              </button>
            `).join('')}
          </div>
        </section>
      </div>
    </div>`;
}

function buildConsumerHomeSection(filtered, summary) {
  return `
      <section class="home-grid">
        <div class="panel">
          <div class="section-head">
            <div>
              <h2>为你推荐</h2>
              <p class="helper-note">支持分类筛选与文本搜索，结果会实时刷新</p>
            </div>
          </div>
          <div class="search-row">
            <input id="searchInput" class="input" type="text" placeholder="输入店名或品类" value="${state.searchText}" />
            <select id="categoryFilter" class="select">
              <option value="全部" ${state.filterCategory === '全部' ? 'selected' : ''}>全部分类</option>
              <option value="中式快餐" ${state.filterCategory === '中式快餐' ? 'selected' : ''}>中式快餐</option>
              <option value="咖啡甜点" ${state.filterCategory === '咖啡甜点' ? 'selected' : ''}>咖啡甜点</option>
              <option value="休闲娱乐" ${state.filterCategory === '休闲娱乐' ? 'selected' : ''}>休闲娱乐</option>
            </select>
            <button class="btn primary" id="applyFilterBtn">筛选</button>
          </div>
          <div class="merchant-grid">
            ${filtered.map((merchant) => {
              const isOpen = merchant.status === 'active';
              return `
              <article class="merchant-card taobao-merchant-card" data-merchant-id="${merchant.id}">
                <div class="merchant-store-header">
                  <img class="merchant-avatar" src="${getMerchantAvatar(merchant)}" alt="${merchant.name} 头像" />
                  <div class="merchant-store-main">
                    <div class="card-row">
                      <div>
                        <strong class="merchant-store-name">${merchant.name}</strong>
                        <div class="merchant-store-meta">${renderStars(merchant.rating)}<span class="helper-note">月售 ${merchant.monthlySales || 0}</span></div>
                      </div>
                      ${createBadge(isOpen)}
                    </div>
                    <p class="helper-note">${merchant.category || ''} · 配送费 ¥${Number(merchant.deliveryFee || 0).toFixed(2)} · 起送 ¥${Number(merchant.minDeliveryFee || 0).toFixed(2)}</p>
                    <p class="helper-note">${merchant.description || ''}</p>
                  </div>
                </div>
                <div class="merchant-products-preview">
                  ${(merchant.products || []).slice(0, 3).map((product) => `
                    <div class="merchant-product-item" data-product-id="${product.id}">
                      <img class="merchant-product-img" src="${product.image || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=200&h=200&q=80'}" alt="${product.name}" />
                      <span class="merchant-product-name">${product.name}</span>
                    </div>
                  `).join('')}
                </div>
                <div class="merchant-preview-actions">
                  <button class="btn secondary merchant-detail-btn" data-merchant-entry="${merchant.id}">查看商家详情</button>
                </div>
              </article>`;
            }).join('')}
          </div>
        </div>

        <div class="panel">
          <div class="section-head">
            <h3>用户状态</h3>
            <span class="helper-note">${isLoggedIn() ? `当前角色：${getRoleLabel()}` : '游客浏览中'}</span>
          </div>
          <div class="user-avatar-card">
            <img class="merchant-avatar" src="${getUserAvatar()}" alt="用户头像" />
            <div>
              <strong class="merchant-store-name">${state.profile.nickname}</strong>
              <p class="helper-note">${isLoggedIn() ? `${state.auth.user} · ${getRoleLabel()}账号` : '游客模式，可浏览商品与商家'}</p>
            </div>
          </div>
          <p class="helper-note">${isConsumer() ? '当前登录用户可在个人中心更新资料，并保存在当前浏览器中。' : '游客和普通用户以浏览和消费为主，商家与骑手请使用专属角色账号登录。'}</p>
          <div class="quick-nav">
            <div class="quick-tile"><span class="badge open">我的地址</span><strong>${state.addresses[0].detail}</strong></div>
            <div class="quick-tile"><span class="badge open">优惠券</span><strong>${state.coupons.length} 张可用</strong></div>
          </div>
          <div class="footer-note">数据会通过 API 适配层加载，便于后端接入时直接切换。</div>
        </div>
      </section>`;
}

function buildMerchantHomeSection() {
  const merchant = getCurrentMerchant() || getSelectedMerchant();
  const merchantStats = getMerchantStats(merchant);
  const merchantOrders = state.orders.filter((order) => Number(order.merchantId) === Number(merchant?.id));
  return `
      <section class="hero">
        <div class="panel">
          <p class="helper-note">商家首页 / 店铺运营</p>
          <h2 class="hero-title">欢迎回来，${merchant?.name || '商家'}。</h2>
          <p class="hero-copy">商家账号专注店铺经营，不参与普通用户购物流程。你可以维护商品、规格、店铺头像和基础经营数据。</p>
          <div class="hero-actions">
            <button class="btn primary" data-route="#/merchant-dashboard">进入商家后台</button>
            <button class="btn secondary" data-route="#/profile">查看商家资料</button>
          </div>
              <div class="hero-stats">
                <div class="stat-card"><strong>${merchantStats.totalOrders}</strong><span>本店订单</span></div>
                <div class="stat-card"><strong>${merchantStats.pendingOrders}</strong><span>待处理</span></div>
                <div class="stat-card"><strong>${formatCurrency(merchantStats.revenue)}</strong><span>累计营业额</span></div>
              </div>
        </div>
        <div class="panel">
          <div class="section-head"><h3>商家入口</h3><span class="helper-note">专属功能</span></div>
          <div class="quick-nav">
            <div class="quick-tile" data-route="#/merchant-dashboard"><span class="badge open">商品</span><strong>维护商品与规格</strong><p class="helper-note">新增商品、编辑规格、管理库存。</p></div>
            <div class="quick-tile" data-route="#/profile"><span class="badge open">资料</span><strong>管理店铺头像与资料</strong><p class="helper-note">单独维护商家资料，不与用户资料混用。</p></div>
            <div class="quick-tile" data-route="#/merchant-dashboard"><span class="badge open">订单</span><strong>处理本店订单</strong><p class="helper-note">仅查看属于本店的订单并更新状态。</p></div>
          </div>
        </div>
      </section>
      <section class="home-grid">
        <div class="panel">
          <div class="section-head">
            <h3>本店订单</h3>
            <span class="helper-note">${merchantOrders.length} 单</span>
          </div>
          <div class="product-list">
            ${merchantOrders.length ? merchantOrders.map((order) => `
              <div class="product-item">
                <div class="card-row">
                  <div>
                    <strong>${order.id}</strong>
                    <p class="helper-note">${order.items.map((item) => `${item.name} ×${item.quantity}`).join(' / ')}</p>
                    <p class="helper-note">状态：${order.status}${order.riderName ? ` · 骑手：${order.riderName}` : ''}</p>
                  </div>
                  <div>
                    <div class="order-amount">${formatCurrency(order.amount)}</div>
                    <p class="helper-note" style="margin-top:8px;">${order.eta}</p>
                  </div>
                </div>
              </div>
            `).join('') : '<div class="empty-state">当前店铺还没有订单。</div>'}
          </div>
        </div>
      </section>`;
}

function buildRiderHomeSection() {
  const rider = getRiderDashboardData();
  return `
      <section class="hero">
        <div class="panel">
          <p class="helper-note">骑手首页 / 配送工作</p>
          <h2 class="hero-title">欢迎出勤，${rider.riderName}。</h2>
          <p class="hero-copy">骑手账号只处理配送任务、待取餐和收入，不参与商家商品管理或普通用户购物。</p>
          <div class="hero-actions">
            <button class="btn primary" data-route="#/rider-dashboard">进入骑手工作台</button>
            <button class="btn secondary" data-route="#/profile">查看骑手资料</button>
          </div>
          <div class="hero-stats">
            <div class="stat-card"><strong>${rider.pendingPickups}</strong><span>待取餐</span></div>
            <div class="stat-card"><strong>${rider.completedOrders}</strong><span>已完成</span></div>
            <div class="stat-card"><strong>${formatCurrency(rider.income)}</strong><span>今日收入</span></div>
          </div>
        </div>
        <div class="panel">
          <div class="section-head"><h3>骑手入口</h3><span class="helper-note">配送专属</span></div>
          <div class="quick-nav">
            <div class="quick-tile" data-route="#/rider-dashboard"><span class="badge open">任务</span><strong>查看配送任务与路线</strong><p class="helper-note">待取餐、配送中、已完成统一管理。</p></div>
            <div class="quick-tile" data-route="#/profile"><span class="badge open">资料</span><strong>维护骑手资料</strong><p class="helper-note">独立资料页，不展示购物地址或店铺数据。</p></div>
          </div>
        </div>
      </section>`;
}

function renderHome() {
  const merchantList = state.merchants.filter((merchant) => merchant.status === 'active' || true);
  const filtered = merchantList.filter((merchant) => {
    const text = `${merchant.name} ${merchant.category}`.toLowerCase();
    const search = state.searchText.trim().toLowerCase();
    const categoryOk = state.filterCategory === '全部' || merchant.category === state.filterCategory;
    return (!search || text.includes(search)) && categoryOk;
  });

  const summary = getCartSummary();
  const heroSection = isMerchant()
    ? buildMerchantHomeSection()
    : isRider()
      ? buildRiderHomeSection()
      : buildConsumerHomeSection(filtered, summary);

  return `
    <div class="shell">
      ${buildHomeSearchBar()}
      ${heroSection}
    </div>`;
}

async function renderMerchant() {
  // 从 state 中获取选中的商家基本信息
  const basicMerchant = getSelectedMerchant();
  const merchantId = basicMerchant?.id;

  // 尝试从后端加载商家详情（含商品列表）
  let merchantDetail = null;
  let products = [];
  if (merchantId) {
    try {
      merchantDetail = await api.getMerchant(merchantId);
    } catch (error) {
      console.warn('商家详情加载失败:', error.message);
    }
  }

  // 合并基本信息与详情数据
  const merchant = { ...(basicMerchant || {}), ...(merchantDetail || {}) };

  // 从 merchantDetail.categoryList 中提取所有商品，展平为 products 数组
  if (merchantDetail && Array.isArray(merchantDetail.categoryList)) {
    merchantDetail.categoryList.forEach((cat) => {
      if (Array.isArray(cat.products)) {
        cat.products.forEach((p) => {
          // 给商品补充分类信息，用于前端分类筛选
          products.push({ ...p, category: cat.name });
        });
      }
    });
  }

  const category = localStorage.getItem('selectedCategory') || '热销';
  const filteredProducts = products.filter((item) => item.category === category || category === '全部');

  return `
    <div class="shell">
      <div class="panel merchant-store-hero">
        <div class="merchant-hero-top">
          <img class="merchant-hero-avatar" src="${merchant ? getMerchantAvatar(merchant) : getFallbackUserAvatar()}" alt="${merchant?.name || '商家头像'}" />
          <div class="merchant-hero-copy">
            <p class="helper-note">商家详情 / 商品浏览</p>
            <h2 style="margin:0">${merchant?.name || '请选择商家'}</h2>
            <p class="helper-note">${merchant?.description || ''}</p>
            <div class="merchant-store-meta">
              ${renderStars(merchant?.rating || 0)}
              <span class="merchant-score">${merchant?.rating || '--'}</span>
              <span class="helper-note">${merchant?.monthlySales || '--'}</span>
            </div>
          </div>
        </div>
        <div class="merchant-store-summary">
          <div class="merchant-stat-pill"><strong>${merchant?.distance || '--'}</strong><span>距离</span></div>
          <div class="merchant-stat-pill"><strong>${merchant?.deliveryFee ? '¥' + Number(merchant.deliveryFee).toFixed(2) : '--'}</strong><span>配送费</span></div>
          <div class="merchant-stat-pill"><strong>${merchant ? (merchant.status === 'active' ? '营业中' : '休息中') : '--'}</strong><span>状态</span></div>
          <div class="merchant-stat-pill"><strong>${merchant?.address || '--'}</strong><span>门店地址</span></div>
        </div>
        ${merchant ? createBadge(merchant.status === 'active') : ''}
      </div>
      <div class="panel" style="margin-top: 18px;">
        <div class="card-row">
          <div>
            <h3 style="margin:0">店铺信息</h3>
            <p class="helper-note">${merchant?.address || ''} · ${merchant?.phone || ''}</p>
          </div>
        </div>
        <div class="merchant-meta">
          <span>⭐ ${merchant?.rating || '--'}</span>
          <span>${merchant?.monthlySales || '--'}</span>
          <span>${merchant?.distance || '--'}</span>
          <span>${merchant?.deliveryFee ? '¥' + Number(merchant.deliveryFee).toFixed(2) : '--'}</span>
        </div>
        <div class="category-tabs">
          ${['热销', '主食', '饮料', '咖啡', '甜点', '活动', '会员'].map((item) => `<button class="category-tab ${item === category ? 'active' : ''}" data-category="${item}">${item}</button>`).join('')}
          <button class="category-tab ${category === '全部' ? 'active' : ''}" data-category="全部">全部</button>
        </div>
        <div class="product-list taobao-list">
          ${filteredProducts.map((item) => {
            const qty = state.cart.find((cartItem) => String(cartItem.id) === String(item.id))?.quantity || 0;
            const lowestPrice = getProductPrimaryPrice(item);
            return `
            <article class="product-item taobao-item product-detail-entry" data-product-detail="${item.id}">
              <img class="product-image" src="${item.image || 'https://via.placeholder.com/120?text=商品'}" alt="${item.name}" />
              <div class="product-main">
                <div class="product-title-row">
                  <strong class="product-title">${item.name}</strong>
                  <span class="product-price">${formatCurrency(lowestPrice)}</span>
                </div>
                <div class="product-tags-row">${renderTags(item.tags)}</div>
                <div class="product-desc-row">${item.description || item.desc}</div>
                <div class="product-meta-row">
                  <span class="meta-sale">月售 ${item.monthlySales || item.sales}</span>
                  <span class="meta-rating">${renderStars(item.rating)}</span>
                  <span class="meta-stock">库存 ${item.stock}</span>
                </div>
              </div>
              <div class="product-side">
                <button class="btn coupon-btn" disabled>领券</button>
                <div class="quantity-wrap">
                  <button class="qty-btn" data-decrease="${item.id}">-</button>
                  <span>${qty}</span>
                  <button class="qty-btn" data-increase="${item.id}">+</button>
                </div>
                <button class="btn spec-btn" disabled>规格 <span style="font-size:1.1em;">›</span></button>
              </div>
            </article>`;
          }).join('')}
        </div>
      </div>
    </div>`;
}

async function renderProductDetail() {
  let product = syncSelectedProductFromRoute();
  if (!product) {
    return `
      <div class="shell">
        <div class="panel empty-state">
          商品不存在，返回首页查看更多内容。
        </div>
      </div>`;
  }

  // 尝试从商家详情接口获取更丰富的商品数据（含 description, stock, specGroups 等）
  const merchant = findMerchantByProduct(product.id);
  if (merchant?.id) {
    try {
      const merchantDetail = await api.getMerchant(merchant.id);
      if (merchantDetail && Array.isArray(merchantDetail.categoryList)) {
        for (const cat of merchantDetail.categoryList) {
          if (Array.isArray(cat.products)) {
            const richProduct = cat.products.find((p) => String(p.id) === String(product.id));
            if (richProduct) {
              // 合并富数据到 product 对象，保留已有字段
              product = { ...product, ...richProduct };
              break;
            }
          }
        }
      }
    } catch (error) {
      console.warn('商家详情加载失败，使用基础商品数据:', error.message);
    }
  }

  const variants = getProductVariants(product);
  const activeVariant = getActiveProductVariant(product);
  const { specGroups, selections } = getProductSelectionState(product);
  const gallery = getProductGallery(product);
  const reviews = getProductReviews(product);
  const averageRating = syncProductRating(product);
  const services = getProductServices(product);
  const relatedProducts = getRelatedProducts(product);

  return `
    <div class="shell product-detail-shell">
      <div class="panel product-detail-panel">
        <div class="product-detail-layout">
          <div class="product-detail-gallery-block">
            <div class="gallery-scroll-pane">
              ${gallery.map((image, index) => `
                <div class="gallery-image-card">
                  <div class="gallery-image-badge">${index + 1}/${gallery.length}</div>
                  <img class="gallery-scroll-image" src="${image}" alt="${product.name} 大图 ${index + 1}" />
                </div>
              `).join('')}
            </div>
          </div>

          <div class="product-detail-info-block">
            <div class="product-detail-topline">
              <div>
                <p class="helper-note">${merchant?.category || '商品详情'} · ${merchant?.name || '店铺'} </p>
                <h1 class="product-detail-title">${product.name}</h1>
              </div>
              ${merchant ? createBadge(merchant.status === 'active') : ''}
            </div>

            <div class="product-detail-meta-row">
              ${renderStars(averageRating)}
              <span class="product-detail-score">${averageRating.toFixed(1)}</span>
              <span class="helper-note">月售 ${product.monthlySales || product.sales || 0}</span>
              <span class="helper-note">库存 ${product.stock ?? '充足'}</span>
            </div>

            <div class="product-detail-price-block">
              <div>
                <div class="product-detail-price-main">${formatCurrency(activeVariant?.price || getProductPrimaryPrice(product))}</div>
                <div class="product-detail-price-sub">${activeVariant?.label || '默认规格'} · 当前选中规格</div>
              </div>
              <div class="badge ${(activeVariant?.stock ?? product.stock ?? 0) > 0 ? 'open' : 'closed'}">${getVariantStockText(activeVariant || product)}</div>
            </div>

            <p class="product-detail-copy">${product.description || product.desc || ''}</p>

            <div class="detail-section-block taobao-selection-summary">
              <div class="selection-summary-top">
                <span class="selection-summary-label">已选</span>
                <div>
                  <strong>${getSelectionSummaryText(product, selections)}</strong>
                  <p class="helper-note">${getVariantStockText(activeVariant)}${activeVariant?.badge ? ` · ${activeVariant.badge}` : ''}</p>
                </div>
              </div>
            </div>

            <div class="detail-section-block">
              <div class="section-head">
                <div>
                  <h3>规格选择</h3>
                  <span class="helper-note">可动态切换规格并计算价格</span>
                </div>
              </div>
              <div class="product-spec-selector-stack">
                ${specGroups.length ? specGroups.map((group) => {
                  const availableValues = getAvailableValuesForGroup(product, group.name, selections);
                  return `
                    <div class="product-spec-group-block">
                      <div class="product-spec-group-title">${group.name}</div>
                      <div class="product-spec-group-values">
                        ${group.values.map((value) => {
                          const valueLabel = value.label;
                          const selected = selections[group.name] === valueLabel;
                          const disabled = !availableValues.includes(valueLabel);
                          const previewVariant = getVariantForGroupValue(product, group.name, valueLabel, selections);
                          const previewImage = group.useImage ? (value.image || previewVariant?.image || product.image || '') : '';
                          const valuePrice = Number(previewVariant?.price || activeVariant?.price || getProductPrimaryPrice(product));
                          return `
                            <button class="variant-chip spec-value-card ${selected ? 'active' : ''} ${previewImage ? 'with-image' : ''}" data-spec-selection="${group.name}::${valueLabel}" ${disabled ? 'disabled' : ''}>
                              ${previewImage ? `<img class="spec-card-thumb" src="${previewImage}" alt="${valueLabel}" />` : ''}
                              <span class="variant-chip-name">${valueLabel}</span>
                              <span class="variant-chip-price">${formatCurrency(valuePrice)}</span>
                              <span class="variant-chip-stock">${disabled ? '已售罄' : (previewVariant?.stock <= 5 ? `仅剩 ${previewVariant?.stock || 0} 件` : '有货')}</span>
                            </button>`;
                        }).join('')}
                      </div>
                    </div>`;
                }).join('') : `
                  <div class="variant-grid">
                    ${variants.map((variant) => `
                      <button class="variant-chip ${variant.id === activeVariant?.id ? 'active' : ''}" data-product-variant="${variant.id}">
                        <span class="variant-chip-name">${variant.label}</span>
                        <span class="variant-chip-price">${formatCurrency(variant.price)}</span>
                        <span class="variant-chip-stock">库存 ${variant.stock}</span>
                      </button>
                    `).join('')}
                  </div>`}
              </div>
            </div>

            <div class="detail-section-block review-preview-section">
              <button class="review-preview-entry" data-review-route="${getProductReviewRoute(product.id)}">
                <div class="section-head review-preview-head">
                  <div>
                    <h3>评价</h3>
                    <p class="helper-note">${getReviewStatText(product)}</p>
                  </div>
                  <span class="review-preview-link">查看全部 ></span>
                </div>
                <div class="review-preview-score-row">
                  <strong>${averageRating.toFixed(1)}</strong>
                  <span>${renderStars(averageRating)}</span>
                  <span class="helper-note">${reviews.length} 条真实评价</span>
                </div>
                <div class="review-tag-row">
                  ${getReviewTags(product).map((tag) => `<span class="review-filter-chip">${tag.label} ${tag.count}</span>`).join('')}
                </div>
                <div class="product-review-preview-list">
                  ${reviews.length ? getReviewPreviewList(product).map((review) => `
                    <div class="review-preview-card">
                      <div class="review-preview-user-row">
                        <strong>${review.user}</strong>
                        <span>${renderStars(review.rating, true)}</span>
                      </div>
                      <p class="helper-note review-preview-text">${review.text}</p>
                      ${buildReviewImageGrid(review.images)}
                    </div>
                  `).join('') : '<div class="empty-state">暂无评价，快来提交第一条真实点评吧。</div>'}
                </div>
              </button>
            </div>

            <div class="detail-section-block">
              <div class="section-head">
                <h3>相关服务</h3>
              </div>
              <div class="service-chip-grid">
                ${services.map((service) => `<span class="service-chip">${service.label}</span>`).join('')}
              </div>
            </div>

            <div class="detail-action-row">
              <button class="btn secondary" id="contactMerchantBtn">联系客服</button>
              <button class="btn secondary" id="viewStoreBtn">查看店铺</button>
            </div>

            <div class="footer-cta-row">
              <button class="btn primary" id="openSpecPickerBtn">加入购物车</button>
              <button class="btn secondary" id="buyNowBtn">立即购买</button>
            </div>
          </div>
        </div>
      </div>

      <div class="panel" style="margin-top:18px;">
        <div class="section-head">
          <div>
            <h3 style="margin:0;">店铺推荐</h3>
            <p class="helper-note">来自同店的热门商品</p>
          </div>
        </div>
        <div class="related-products-grid">
          ${relatedProducts.map((item) => `
            <article class="related-product-card" data-product-detail="${item.id}">
              <img class="related-product-image" src="${item.image}" alt="${item.name}" />
              <div class="related-product-copy">
                <strong>${item.name}</strong>
                <p class="helper-note">${item.description || item.desc || ''}</p>
                <div class="related-product-footer">
                  <span class="product-price">${formatCurrency(item.price)}</span>
                  <span class="helper-note">月售 ${item.monthlySales || item.sales || 0}</span>
                </div>
              </div>
            </article>
          `).join('')}
        </div>
      </div>

      ${state.productPickerOpen ? `
        <div class="product-picker-overlay">
          <div class="product-picker-panel">
            <div class="product-picker-header">
              <div>
                <p class="helper-note">规格选择</p>
                <h3 style="margin:0;">${product.name}</h3>
              </div>
              <button class="btn ghost" id="cancelProductPickerBtn">关闭</button>
            </div>
            <div class="product-picker-body">
              <div class="product-picker-preview-row">
                <img class="product-picker-thumb" src="${product.image}" alt="${product.name}" />
                <div>
                  <strong>${product.name}</strong>
                  <p class="helper-note">${activeVariant?.label || '标准规格'} · ${formatCurrency(activeVariant?.price || product.price)}</p>
                </div>
              </div>
              <div class="variant-grid">
                ${specGroups.length ? specGroups.map((group) => {
                  const availableValues = getAvailableValuesForGroup(product, group.name, selections);
                  return `
                    <div class="product-spec-group-block compact">
                      <div class="product-spec-group-title">${group.name}</div>
                      <div class="product-spec-group-values">
                        ${group.values.map((value) => {
                          const valueLabel = value.label;
                          const selected = selections[group.name] === valueLabel;
                          const disabled = !availableValues.includes(valueLabel);
                          const previewVariant = getVariantForGroupValue(product, group.name, valueLabel, selections);
                          const previewImage = group.useImage ? (value.image || previewVariant?.image || product.image || '') : '';
                          return `
                            <button class="variant-chip spec-value-card ${selected ? 'active' : ''} ${previewImage ? 'with-image' : ''}" data-spec-selection="${group.name}::${valueLabel}" ${disabled ? 'disabled' : ''}>
                              ${previewImage ? `<img class="spec-card-thumb" src="${previewImage}" alt="${valueLabel}" />` : ''}
                              <span class="variant-chip-name">${valueLabel}</span>
                              <span class="variant-chip-stock">${disabled ? '已售罄' : getVariantStockText(previewVariant)}</span>
                            </button>`;
                        }).join('')}
                      </div>
                    </div>`;
                }).join('') : variants.map((variant) => `
                  <button class="variant-chip ${variant.id === activeVariant?.id ? 'active' : ''}" data-product-variant="${variant.id}">
                    <span class="variant-chip-name">${variant.label}</span>
                    <span class="variant-chip-price">${formatCurrency(variant.price)}</span>
                  </button>
                `).join('')}
              </div>
              <div class="quantity-picker-row">
                <span class="helper-note">选择数量</span>
                <div class="quantity-wrap">
                  <button class="qty-btn" id="decreasePickerQty">-</button>
                  <span id="pickerQtyValue">${state.productPickerQuantity}</span>
                  <button class="qty-btn" id="increasePickerQty">+</button>
                </div>
              </div>
              <div class="picker-summary">
                <span>合计</span>
                <strong>${formatCurrency((activeVariant?.price || getProductPrimaryPrice(product)) * state.productPickerQuantity)}</strong>
              </div>
            </div>
            <div class="product-picker-actions">
              <button class="btn ghost" id="cancelProductPickerBtnSecondary">取消</button>
              <button class="btn primary" id="confirmAddToCartBtn">确认加入购物车</button>
            </div>
          </div>
        </div>
      ` : ''}
    </div>`;
}

function renderProductReviewsPage() {
  const product = findProduct(getRouteReviewProductId());
  if (!product) {
    return `
      <div class="shell">
        <div class="panel empty-state">评价页面不存在，返回商品详情查看更多内容。</div>
      </div>`;
  }

  const merchant = findMerchantByProduct(product.id);
  const reviews = getProductReviews(product);
  const averageRating = syncProductRating(product);
  const tags = getReviewTags(product);

  return `
    <div class="shell review-page-shell">
      <div class="panel review-page-panel">
        <div class="review-page-header">
          <button class="btn secondary" id="backToProductDetailBtn">返回商品</button>
          <div>
            <h2 style="margin:0;">评价</h2>
            <p class="helper-note">${product.name} · ${merchant?.name || '店铺'}</p>
          </div>
          <button class="btn ghost" data-route="#/merchant">查看店铺</button>
        </div>

        <div class="review-page-summary">
          <div class="review-page-score-card">
            <strong>${averageRating.toFixed(1)}</strong>
            <span>${renderStars(averageRating)}</span>
            <em>${reviews.length} 条评价</em>
          </div>
          <div class="review-tag-row">
            ${tags.map((tag) => `<span class="review-filter-chip">${tag.label} ${tag.count}</span>`).join('')}
          </div>
        </div>

        <div class="review-feed-list">
          ${reviews.length ? reviews.map((review) => renderReviewFeedCard(review, product)).join('') : '<div class="empty-state">暂无评价，快去下单后提交第一条评价吧。</div>'}
        </div>
      </div>
    </div>`;
}

function renderChat() {
  const merchant = getSelectedMerchant();
  const chatMessages = getChatMessagesForMerchant(merchant);
  const currentProduct = getSelectedProduct();
  const unreadMessages = chatMessages.filter((message, index) => message.role === 'user' && !isMessageReadByMerchant(message, index, chatMessages));

  return `
    <div class="shell chat-shell">
      <div class="panel chat-layout">
        <section class="chat-main-panel">
          <div class="chat-header">
            <div class="chat-merchant-profile">
              <img class="merchant-avatar-preview" src="${merchant ? getMerchantAvatar(merchant) : getFallbackUserAvatar()}" alt="${merchant?.name || '商家头像'}" />
              <div>
                <strong class="merchant-store-name">${merchant?.name || '商家客服'}</strong>
                <p class="helper-note">在线 · 回复较快</p>
              </div>
            </div>
            <div class="chat-header-actions">
              <button class="btn secondary" id="backToProductBtn">${currentProduct ? '返回商品' : '返回店铺'}</button>
            </div>
          </div>

          <div class="chat-thread" id="chatThread">
            ${chatMessages.map((message, index) => {
              const messageReadByMerchant = isMessageReadByMerchant(message, index, chatMessages);
              const merchantReadBadge = message.role === 'user'
                ? `<span class="chat-status-pill ${messageReadByMerchant ? 'read' : 'unread'}">${messageReadByMerchant ? '商家已读' : '商家未读'}</span>`
                : '';

              if (message.kind === 'image' && message.attachment) {
                return `
                  <div class="chat-message ${message.role === 'user' ? 'chat-message-user' : 'chat-message-merchant'}">
                    <div class="chat-bubble chat-image-bubble">
                      <img class="chat-attachment-image" src="${message.attachment}" alt="聊天图片" />
                      <div class="chat-image-caption">${message.text || '图片消息'}</div>
                    </div>
                    <div class="chat-message-meta">
                      <div class="chat-time">${message.time}</div>
                      ${merchantReadBadge}
                    </div>
                  </div>
                `;
              }

              if (message.kind === 'product-link') {
                return `
                  <div class="chat-message ${message.role === 'user' ? 'chat-message-user' : 'chat-message-merchant'}">
                    <div class="chat-bubble">
                      <div class="chat-link-card">
                        <img class="chat-link-thumb" src="${message.image}" alt="${message.productName}" />
                        <div class="chat-link-copy">
                          <strong>${message.productName}</strong>
                          <p class="helper-note">${formatCurrency(message.price)} · ${message.merchantName}</p>
                          <a class="chat-link" data-route="${message.route}">查看商品</a>
                        </div>
                      </div>
                    </div>
                    <div class="chat-message-meta">
                      <div class="chat-time">${message.time}</div>
                      ${merchantReadBadge}
                    </div>
                  </div>
                `;
              }

              return `
                <div class="chat-message ${message.role === 'user' ? 'chat-message-user' : 'chat-message-merchant'}">
                  <div class="chat-bubble">${message.text}</div>
                  <div class="chat-message-meta">
                    <div class="chat-time">${message.time}</div>
                    ${merchantReadBadge}
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <div class="chat-input-row">
            <input class="input chat-input" id="chatMessageInput" placeholder="输入你想咨询的内容..." />
            <label class="btn secondary" for="chatImageInput">上传图片</label>
            <input type="file" accept="image/*" id="chatImageInput" class="avatar-file-input" />
            <button class="btn secondary" id="sendProductLinkBtn">发送商品链接</button>
            <button class="btn primary" id="sendChatBtn">发送</button>
          </div>

          <div class="chat-merchant-reply-panel">
            <div class="section-head">
              <div>
                <h3 style="margin:0;">商家回复</h3>
                <p class="helper-note">商家可以主动回复当前对话，避免自动回复。</p>
              </div>
            </div>
            <div class="chat-input-row merchant-reply-row">
              <input class="input chat-input" id="merchantReplyInput" placeholder="输入商家回复内容..." />
              <button class="btn primary" id="sendMerchantReplyBtn">商家回复</button>
            </div>
          </div>
        </section>

        <aside class="chat-sidebar-panel">
          <div class="detail-section-block">
            <div class="section-head">
              <h3>当前咨询</h3>
            </div>
            ${currentProduct ? `
              <div class="chat-product-preview">
                <img class="product-picker-thumb" src="${currentProduct.image}" alt="${currentProduct.name}" />
                <div>
                  <strong>${currentProduct.name}</strong>
                  <p class="helper-note">${formatCurrency(activeVariant?.price || getProductPrimaryPrice(product))} · ${merchant?.name || '商家客服'}</p>
                </div>
              </div>
            ` : ''}
            <p class="helper-note">在这里与商家直接沟通，发货时效、优惠券、规格选择都可以即时确认。</p>
            <div class="chat-read-summary">
              <span class="service-chip">${unreadMessages.length} 条商家未读</span>
              <span class="service-chip">${chatMessages.length - unreadMessages.length} 条已读</span>
            </div>
          </div>

          <div class="detail-section-block">
            <div class="section-head">
              <h3>客服提示</h3>
            </div>
            <div class="service-chip-grid">
              <span class="service-chip">24小时响应</span>
              <span class="service-chip">多规格咨询</span>
              <span class="service-chip">配送时间确认</span>
            </div>
          </div>
        </aside>
      </div>
    </div>`;
}

function renderMerchantProductEditor() {
  hydrateMerchantEditorState();
  const merchant = state.editingMerchantDraft || getSelectedMerchant();
  const product = state.editingProductDraft;
  const gallery = sanitizeArray(product?.gallery).filter(Boolean);
  const services = sanitizeArray(product?.services);
  const generatedSpecs = getProductVariants(product);
  const specGroups = buildMerchantSpecGroups(product);
  const specGroupDraftKey = `${product?.id || 'draft'}-${specGroups.length}`;
  const tags = sanitizeArray(product?.tags);
  const isNewProduct = state.route === '#/merchant-product-editor/new';

  if (!merchant || !product) {
    return `
      <div class="shell">
        <div class="panel empty-state">商家编辑页数据异常，返回商家后台重新进入。</div>
      </div>`;
  }

  const tagListMarkup = tags.length ? tags.map((tag, index) => `
    <div class="merchant-tag-chip">
      <span>${tag}</span>
      <button class="btn ghost remove-tag-btn" data-tag-index="${index}">×</button>
    </div>
  `).join('') : '<div class="helper-note">暂无标签，点击“添加标签”按钮配置商品标签。</div>';

  return `
    <div class="shell merchant-editor-shell">
      <div class="panel merchant-editor-header-panel">
        <div class="section-head">
          <div>
            <p class="helper-note">商家后台 / 商品编辑</p>
            <h2 style="margin:0;">${isNewProduct ? '新增商品' : '编辑商品'}</h2>
          </div>
          <div class="detail-action-row">
            <button class="btn secondary" id="backToMerchantDashboardBtn">返回商家后台</button>
            <button class="btn primary" id="saveMerchantProductBtn">保存商品与店铺信息</button>
          </div>
        </div>
      </div>

      <div class="merchant-editor-layout">
        <section class="panel merchant-editor-main-panel">
          <div class="detail-section-block">
            <div class="section-head">
              <div>
                <h3 style="margin:0;">店铺信息</h3>
                <p class="helper-note">这里可以维护店铺地址、联系方式与营业状态。</p>
              </div>
              <button class="btn ghost" id="resetMerchantAddressBtn">恢复原地址</button>
            </div>
            <div class="merchant-settings-grid">
              <div class="form-row">
                <label>店铺名称</label>
                <input class="input merchant-editor-field" data-field="name" value="${merchant.name}" readonly />
              </div>
              <div class="form-row">
                <label>店铺地址</label>
                <input class="input merchant-editor-field" data-field="address" value="${merchant.address || ''}" />
              </div>
              <div class="form-row">
                <label>联系方式</label>
                <input class="input merchant-editor-field" data-field="phone" value="${merchant.phone || ''}" />
              </div>
              <div class="form-row">
                <label>店铺状态</label>
                <select class="select merchant-editor-field" data-field="open">
                  <option value="true" ${merchant.open ? 'selected' : ''}>营业中</option>
                  <option value="false" ${!merchant.open ? 'selected' : ''}>休息中</option>
                </select>
              </div>
              <div class="form-row merchant-description-field">
                <label>店铺描述</label>
                <textarea class="input merchant-editor-field" rows="4" data-field="description">${merchant.description || ''}</textarea>
              </div>
            </div>
          </div>

          <div class="detail-section-block">
            <div class="section-head">
              <div>
                <h3 style="margin:0;">商品基础信息</h3>
                <p class="helper-note">商品名称、分类、价格、库存、评分和标签都可在这里编辑。</p>
              </div>
            </div>
            <div class="merchant-settings-grid">
              <div class="form-row">
                <label>商品名称</label>
                <input class="input product-editor-field" data-field="name" value="${product.name}" />
              </div>
              <div class="form-row">
                <label>商品分类</label>
                <input class="input product-editor-field" data-field="category" value="${product.category}" />
              </div>
              <div class="form-row">
                <label>商品价格</label>
                <input class="input product-editor-field" type="number" min="0" step="0.1" data-field="price" value="${product.price}" />
              </div>
              <div class="form-row">
                <label>商品库存</label>
                <input class="input product-editor-field" type="number" min="0" step="1" data-field="stock" value="${product.stock}" />
              </div>
              <div class="form-row merchant-description-field">
                <label>月售数量</label>
                <div class="sales-readonly-card">
                  <strong>${product.sales}</strong>
                  <p class="helper-note">月售数量由系统统计生成，商家不可直接修改。</p>
                </div>
              </div>
              <div class="form-row">
                <label>评分</label>
                <div class="sales-readonly-card">
                  <strong>${Number(product.rating || 0).toFixed(1)}</strong>
                  <p class="helper-note">评分根据用户真实评价自动计算，商家无法手动修改。</p>
                </div>
              </div>
              <div class="form-row merchant-description-field">
                <label>商品描述</label>
                <textarea class="input product-editor-field" rows="5" data-field="desc">${product.desc || ''}</textarea>
              </div>
              <div class="form-row merchant-description-field">
                <div class="merchant-tag-editor-panel">
                  <div class="section-head">
                    <div>
                      <h4 style="margin:0;">商品标签</h4>
                      <p class="helper-note">使用弹窗管理标签，便于搜索与推荐。</p>
                    </div>
                    <button class="btn secondary" id="openTagModalBtn">添加标签</button>
                  </div>
                  <div class="merchant-tag-list">${tagListMarkup}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="detail-section-block">
            <div class="section-head">
              <div>
                <h3 style="margin:0;">多图上传</h3>
                <p class="helper-note">支持从本地上传多张图片，第一张会自动作为主图展示。</p>
              </div>
              <label class="btn secondary" for="merchantProductGalleryInput">上传图片</label>
              <input type="file" accept="image/*" id="merchantProductGalleryInput" class="avatar-file-input" multiple />
            </div>

            <div class="gallery-editor-grid">
              ${gallery.length ? gallery.map((image, index) => `
                <div class="gallery-editor-card">
                  <img src="${image}" alt="商品图片 ${index + 1}" />
                  <div class="gallery-editor-actions">
                    <span class="helper-note">${index === 0 ? '主图' : '图片'} ${index + 1}</span>
                    <button class="btn ghost remove-gallery-btn" data-gallery-index="${index}">移除</button>
                  </div>
                </div>
              `).join('') : '<div class="helper-note">暂无图片，点击上传按钮添加多张展示图。</div>'}
            </div>
          </div>

          <div class="detail-section-block">
            <div class="section-head">
              <div>
                <h3 style="margin:0;">服务与规格</h3>
                <p class="helper-note">支持像淘宝一样按规格维度维护价格、库存和对应图片。</p>
              </div>
            </div>

            <div class="form-row merchant-description-field">
              <label>服务标签（英文逗号分隔）</label>
              <input class="input product-editor-field" data-field="services" value="${services.join(', ')}" />
            </div>

            <div class="spec-group-list">
              ${specGroups.length ? specGroups.map((group, index) => `
                <div class="spec-group-row" data-spec-group-key="${specGroupDraftKey}-${index}">
                  <div class="form-row">
                    <label>规格名称</label>
                    <input class="input spec-group-field" data-group-index="${index}" data-field="name" value="${group.name}" />
                  </div>
                  <div class="form-row spec-group-switch-row">
                    <label class="spec-group-switch">
                      <input type="checkbox" class="spec-group-toggle-image" data-group-index="${index}" ${group.useImage ? 'checked' : ''} />
                      <span>该规格使用图片块展示</span>
                    </label>
                  </div>
                  <div class="spec-value-list">
                    ${group.values.map((value, valueIndex) => `
                      <div class="spec-value-row" data-spec-value-key="${specGroupDraftKey}-${index}-${valueIndex}">
                        <div class="form-row">
                          <label>规格值</label>
                          <input class="input spec-value-field" data-group-index="${index}" data-value-index="${valueIndex}" data-field="label" value="${value.label}" />
                        </div>
                        ${group.useImage ? `
                          <div class="form-row merchant-description-field">
                            <label>规格值图片</label>
                            <div class="spec-image-upload-row">
                              <label class="btn secondary" for="specGroupImage_${index}_${valueIndex}">上传图片</label>
                              <input type="file" accept="image/*" id="specGroupImage_${index}_${valueIndex}" class="avatar-file-input spec-value-image-input" data-group-index="${index}" data-value-index="${valueIndex}" />
                              ${value.image ? `<img class="spec-image-preview" src="${value.image}" alt="${value.label}" />` : '<span class="helper-note">未上传时买家侧使用商品主图</span>'}
                            </div>
                          </div>
                        ` : ''}
                        <div class="spec-row-actions">
                          <button class="btn ghost remove-spec-value-btn" data-group-index="${index}" data-value-index="${valueIndex}">删除规格值</button>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                  <div class="detail-action-row">
                    <button class="btn secondary add-spec-value-btn" data-group-index="${index}">新增规格值</button>
                    <button class="btn ghost remove-spec-group-btn" data-group-index="${index}">移除维度</button>
                  </div>
                </div>
              `).join('') : '<div class="helper-note">暂无规格维度，点击“新增规格维度”开始配置多规格商品。</div>'}
            </div>

            <div class="detail-action-row">
              <button class="btn secondary" id="addProductSpecBtn">新增规格维度</button>
            </div>

            <div class="spec-editor-list">
              ${generatedSpecs.map((spec, index) => `
                <div class="spec-row enhanced-spec-row">
                  <div class="form-row merchant-description-field">
                    <label>规格组合</label>
                    <div class="sales-readonly-card">
                      <strong>${spec.label || `规格 ${index + 1}`}</strong>
                      <p class="helper-note">${Object.entries(spec.selections || {}).map(([key, value]) => `${key}：${value}`).join(' · ') || '默认规格'}</p>
                    </div>
                  </div>
                  <div class="form-row">
                    <label>规格价格</label>
                    <input class="input product-spec-field" data-spec-index="${index}" data-field="price" type="number" min="0" step="0.1" value="${spec.price}" />
                  </div>
                  <div class="form-row">
                    <label>规格库存</label>
                    <input class="input product-spec-field" data-spec-index="${index}" data-field="stock" type="number" min="0" step="1" value="${spec.stock}" />
                  </div>
                  <div class="form-row">
                    <label>规格标识</label>
                    <input class="input product-spec-field" data-spec-index="${index}" data-field="badge" value="${spec.badge || ''}" placeholder="如：店长推荐" />
                  </div>
                  <div class="form-row merchant-description-field">
                    <label>规格图片</label>
                    <div class="spec-image-upload-row">
                      <label class="btn secondary" for="specImageInput_${index}">上传规格图片</label>
                      <input type="file" accept="image/*" id="specImageInput_${index}" class="avatar-file-input product-spec-image-input" data-spec-index="${index}" />
                      ${spec.image ? `<img class="spec-image-preview" src="${spec.image}" alt="${spec.label || `规格 ${index + 1}`}" />` : '<span class="helper-note">未上传时默认使用商品主图</span>'}
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </section>

        <aside class="panel merchant-editor-preview-panel">
          <div class="section-head">
            <div>
              <h3 style="margin:0;">编辑预览</h3>
              <p class="helper-note">保存后会更新店铺商品页面展示。</p>
            </div>
          </div>

          <div class="merchant-preview-summary">
            <img class="product-editor-preview-image" src="${product.image || gallery[0] || 'https://via.placeholder.com/400?text=商品'}" alt="商品主图预览" />
            <div>
              <strong class="merchant-store-name">${product.name}</strong>
              <p class="helper-note">${product.category} · ${formatCurrency(product.price)}</p>
              <p class="helper-note">月售 ${product.sales} · 库存 ${product.stock}</p>
              <div class="service-chip-grid">
                ${tags.map((tag) => `<span class="service-chip">${tag}</span>`).join('') || '<span class="helper-note">暂无标签</span>'}
              </div>
            </div>
          </div>

          <div class="detail-section-block">
            <div class="section-head">
              <h3>商品简介</h3>
            </div>
            <p class="helper-note">${product.desc || '请输入商品描述'}</p>
          </div>

          <div class="detail-section-block">
            <div class="section-head">
              <h3>规格预览</h3>
            </div>
            <div class="variant-grid">
              ${generatedSpecs.map((spec) => `
                <div class="variant-chip active">
                  <span class="variant-chip-name">${spec.label}</span>
                  <span class="variant-chip-price">${formatCurrency(spec.price)}</span>
                  <span class="variant-chip-stock">库存 ${spec.stock}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="detail-section-block">
            <div class="section-head">
              <h3>店铺信息预览</h3>
            </div>
            <div class="merchant-info-preview-list">
              <div class="quick-tile"><strong>地址</strong><p class="helper-note">${merchant.address || '未填写地址'}</p></div>
              <div class="quick-tile"><strong>联系电话</strong><p class="helper-note">${merchant.phone || '未填写电话'}</p></div>
            </div>
          </div>
        </aside>
      </div>

      <div class="merchant-tag-modal ${state.merchantTagModalOpen ? 'active' : ''}" id="merchantTagModal">
        <div class="merchant-tag-modal-card">
          <div class="section-head">
            <div>
              <h3 style="margin:0;">添加标签</h3>
              <p class="helper-note">输入标签后点击确认加入商品标签池。</p>
            </div>
            <button class="btn ghost" id="closeTagModalBtn">关闭</button>
          </div>
          <div class="form-row">
            <label for="merchantTagInput">标签名称</label>
            <input class="input" id="merchantTagInput" value="${state.merchantTagDraft || ''}" placeholder="例如：热销、优惠、推荐" />
          </div>
          <div class="detail-action-row">
            <button class="btn secondary" id="cancelTagModalBtn">取消</button>
            <button class="btn primary" id="confirmAddTagBtn">确认添加</button>
          </div>
        </div>
      </div>
    </div>`;
}

function renderCart() {
  const summary = getCartSummary();
  return `
    <div class="shell">
      <div class="card-row"><h2 style="margin:0">购物车</h2><p class="helper-note">实时计算金额、起送价与最优优惠券</p></div>
      <div class="cart-layout">
        <div>
          ${state.cart.length === 0 ? '<div class="panel empty-state">购物车空空如也，去商家页添加商品吧。</div>' : state.cart.map((item) => `
            <div class="panel cart-item">
              <div class="cart-row">
                <img class="cart-thumb" src="${getProductImage(item.id)}" alt="${item.name}" />
                <div>
                  <strong>${item.name}</strong>
                  <p class="helper-note">${item.merchant}${item.spec ? ` · ${item.spec}` : ''}</p>
                </div>
                <strong>${formatCurrency(item.price * item.quantity)}</strong>
              </div>
              <div class="price-row">
                <span class="helper-note">单价 ${formatCurrency(item.price)}${item.spec ? ` · ${item.spec}` : ''}</span>
                <div class="quantity-wrap">
                  <button class="qty-btn" data-decrease="${item.id}">-</button>
                  <span>${item.quantity}</span>
                  <button class="qty-btn" data-increase="${item.id}">+</button>
                </div>
              </div>
            </div>`).join('')}
        </div>
        <div class="panel summary-box">
          <h3>结算明细</h3>
          <div class="summary-line"><span>商品金额</span><span>${formatCurrency(summary.subtotal)}</span></div>
          <div class="summary-line"><span>配送费</span><span>${summary.delivery === 0 ? '免费' : formatCurrency(summary.delivery)}</span></div>
          <div class="summary-line"><span>可用优惠券</span><span>${getAvailableCoupons().length ? getAvailableCoupons().map((coupon) => coupon.title).join(' / ') : '暂无可用'}</span></div>
          <div class="summary-line"><span>当前优惠</span><span>${summary.coupon ? `${summary.coupon.title} -${formatCurrency(summary.discount)}` : '未使用'}</span></div>
          <div class="summary-total"><span>实付</span><span>${formatCurrency(summary.total)}</span></div>
          <button class="btn primary" id="checkoutBtn" ${isConsumer() ? '' : 'disabled'}>${isConsumer() ? '去结算' : '登录后购买'}</button>
          <button class="btn ghost" id="clearCartBtn">清空购物车</button>
          <p class="helper-note">${summary.subtotal < 30 ? `还差 ${formatCurrency(30 - summary.subtotal)} 起送` : '已满足起送价，可直接结算'}</p>
        </div>
      </div>
    </div>`;
}

function renderOrders() {
  const tabs = ['全部', '待支付', '配送中', '待使用', '已完成', '已取消'];
  const shown = state.orderTab === '全部' ? state.orders : state.orders.filter((item) => item.status === state.orderTab);

  return `
    <div class="shell">
      <div class="panel">
        <div class="section-head">
          <h2 style="margin:0">订单管理</h2>
          <p class="helper-note">支持状态过滤、动态展示配送进度与核销信息，并在订单中提交已购买商品评价</p>
        </div>
        <div class="order-tabs">
          ${tabs.map((tab) => `<button class="order-tab ${tab === state.orderTab ? 'active' : ''}" data-order-tab="${tab}">${tab}</button>`).join('')}
        </div>
        <div class="order-list-taobao">
          ${shown.length === 0 ? '<div class="empty-state">暂无订单，提交订单后会自动进入本地列表。</div>' : shown.map((order) => {
            const items = sanitizeArray(order.items);
            const orderReviewableItems = getReviewableOrderItems(order);
            const canPay = order.status === '待支付';
            const canCancel = ['待支付', '待取餐'].includes(order.status);
            const canComplete = order.status === '配送中';

            return `
            <div class="order-item-taobao">
              <div class="order-main">
                <div class="order-title-row">
                  <strong class="order-title">${order.type} · ${order.merchant}</strong>
                  <span class="order-status">${order.status}</span>
                </div>
                <div class="order-meta-row">
                  <span class="order-id">订单号 ${order.id}</span>
                  <span class="order-time">${order.time}</span>
                </div>
              </div>
              <div class="order-side">
                <div class="order-amount">${formatCurrency(order.amount)}</div>
                <div class="order-eta">${order.eta}</div>
              </div>
              ${order.type === '外卖' ? `<div class="order-progress">
                <span class="order-progress-label">${order.status === '配送中' ? '配送中' : order.status === '待取餐' ? '骑手待取餐' : '等待'}</span>
                <span class="order-progress-detail">${order.status === '配送中'
                  ? `${order.riderName || '骑手待分配'} 正在配送，预计 ${order.eta} 送达`
                  : order.status === '待取餐'
                    ? `${order.riderName || '骑手待分配'} 已接单，正在前往商家取餐`
                    : '等待商家接单或核销流程'}</span>
              </div>` : ''}
              <div class="order-detail-stack">
                <div class="detail-action-row" style="margin-bottom: 12px;">
                  ${canPay ? `<button class="btn primary order-pay-btn" data-order-id="${order.id}">支付订单</button>` : ''}
                  ${canCancel ? `<button class="btn ghost order-cancel-btn" data-order-id="${order.id}">取消订单</button>` : ''}
                  ${canComplete ? `<button class="btn secondary order-complete-btn" data-order-id="${order.id}">确认收货</button>` : ''}
                </div>
                ${items.length === 0 ? '<div class="helper-note">暂无商品明细</div>' : items.map((item) => {
                  const reviewable = !item.reviewed && order.status !== '已取消';
                  return `
                  <div class="order-line-card">
                    <div class="order-line-main">
                      <strong>${item.name}</strong>
                      <p class="helper-note">${item.variantLabel || '标准规格'} · 数量 ${item.quantity}</p>
                    </div>
                    <div class="order-line-meta">
                      <div class="order-line-price">${formatCurrency(item.price * item.quantity)}</div>
                      ${item.reviewed ? '<span class="tag-badge">已评价</span>' : reviewable ? '<span class="badge open">可评价</span>' : '<span class="helper-note">当前状态不可评价</span>'}
                    </div>
                    ${reviewable ? `
                      <div class="review-form-block order-review-form" data-order-id="${order.id}" data-product-id="${item.id}">
                        <div class="review-input-grid">
                          <div class="form-row">
                            <label>评分</label>
                            <select class="select order-review-rating" data-review-rating="${order.id}::${item.id}">
                              <option value="5" ${getReviewDraft(order.id, item.id).rating === 5 ? 'selected' : ''}>5 星</option>
                              <option value="4" ${getReviewDraft(order.id, item.id).rating === 4 ? 'selected' : ''}>4 星</option>
                              <option value="3" ${getReviewDraft(order.id, item.id).rating === 3 ? 'selected' : ''}>3 星</option>
                              <option value="2" ${getReviewDraft(order.id, item.id).rating === 2 ? 'selected' : ''}>2 星</option>
                              <option value="1" ${getReviewDraft(order.id, item.id).rating === 1 ? 'selected' : ''}>1 星</option>
                            </select>
                          </div>
                          <div class="form-row">
                            <label>评价内容</label>
                            <textarea class="input order-review-text" rows="3" placeholder="分享这次购买的体验..." data-review-text="${order.id}::${item.id}">${getReviewDraft(order.id, item.id).text}</textarea>
                          </div>
                          <div class="form-row">
                            <label>上传图片</label>
                            <label class="btn secondary review-upload-label" for="orderReviewImage_${order.id}_${item.id}">选择本地图片</label>
                            <input type="file" accept="image/*" id="orderReviewImage_${order.id}_${item.id}" class="avatar-file-input order-review-image-input" data-order-id="${order.id}" data-product-id="${item.id}" multiple />
                            <div class="review-upload-hint helper-note">支持多张图片，最多 9 张</div>
                            <div class="review-draft-images">${buildReviewImageGrid(getReviewDraft(order.id, item.id).images)}</div>
                          </div>
                        </div>
                        <div class="detail-action-row">
                          <button class="btn primary submit-order-review-btn" data-order-id="${order.id}" data-product-id="${item.id}">提交评价</button>
                        </div>
                      </div>
                    ` : ''}
                  </div>
                `;
                }).join('')}
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>`;
}

function renderConsumerProfile() {
  return `
    <div class="shell">
      <div class="auth-grid">
        <div class="panel">
          <div class="profile-avatar-panel">
            <img class="profile-avatar-preview" src="${getUserAvatar()}" alt="用户头像预览" />
            <div>
              <h2 style="margin: 0;">个人中心</h2>
              <p class="helper-note">${state.profile.nickname} · ${state.profile.phone}</p>
              <p class="helper-note">资料、地址与优惠券将实时更新到浏览器本地缓存，可直接对接服务端时替换 API 层。</p>
            </div>
          </div>
          <div class="avatar-upload-zone">
            <div class="avatar-upload-copy">
              <strong>从本地选择头像</strong>
              <p class="helper-note">支持从相册或本地文件选择图片，预览后可保存到当前账号。</p>
            </div>
            <label class="btn secondary" for="profileAvatarInput">从本地选择图片</label>
            <input type="file" accept="image/*" id="profileAvatarInput" class="avatar-file-input" />
          </div>
          <div class="auth-form">
            <div class="form-row"><label>昵称</label><input class="input" id="profileName" value="${state.profile.nickname}" /></div>
            <div class="form-row"><label>手机号</label><input class="input" id="profilePhone" value="${state.profile.phone}" /></div>
            <button class="btn primary" id="saveProfileBtn">保存资料</button>
          </div>
        </div>
        <div class="panel">
          <h3>收货地址</h3>
          <div class="product-list">
            ${state.addresses.map((item) => `
              <div class="product-item">
                <strong>${item.name}</strong>
                <p class="helper-note">${item.detail}</p>
                <p class="helper-note">${item.phone}</p>
              </div>`).join('')}
          </div>
          <h3 style="margin-top: 18px;">优惠券</h3>
          <div class="product-list">
            ${state.coupons.map((coupon) => `
              <div class="product-item">
                <strong>${coupon.title}</strong>
                <p class="helper-note">${coupon.id} · 满 ${coupon.threshold} 元减 ${coupon.discount} 元 · ${coupon.status}</p>
              </div>`).join('')}
          </div>
        </div>
      </div>
    </div>`;
}

function renderMerchantProfile() {
  const merchant = getCurrentMerchant() || getSelectedMerchant();
  return `
    <div class="shell">
      <div class="auth-grid">
        <div class="panel">
          <div class="profile-avatar-panel">
            <img class="profile-avatar-preview" src="${merchant ? getMerchantAvatar(merchant) : getFallbackUserAvatar()}" alt="商家头像预览" />
            <div>
              <h2 style="margin: 0;">商家资料</h2>
              <p class="helper-note">${merchant?.name || '未绑定店铺'} · ${merchant?.category || '商家账号'}</p>
              <p class="helper-note">商家账号只维护店铺信息、联系方式与经营资料，不展示用户收货地址或优惠券。</p>
            </div>
          </div>
          <div class="merchant-avatar-editor">
            <img class="merchant-avatar-preview" src="${merchant ? getMerchantAvatar(merchant) : getFallbackUserAvatar()}" alt="店铺头像预览" />
            <div class="merchant-avatar-controls">
              <div class="avatar-upload-copy">
                <strong>上传店铺头像</strong>
                <p class="helper-note">从本地相册或设备中选择图片，立即更新店铺头像。</p>
              </div>
              <label class="btn secondary" for="merchantAvatarInput">从本地选择图片</label>
              <input type="file" accept="image/*" id="merchantAvatarInput" class="avatar-file-input" />
            </div>
          </div>
        </div>
        <div class="panel">
          <h3>店铺信息</h3>
          ${merchant ? `
            <div class="product-item">
              <strong>${merchant.name}</strong>
              <p class="helper-note">${merchant.address}</p>
              <p class="helper-note">${merchant.phone}</p>
              <p class="helper-note">${merchant.description}</p>
            </div>
          ` : '<div class="empty-state">当前商家账号还未绑定店铺信息。</div>'}
          <h3 style="margin-top:18px;">经营入口</h3>
          <div class="quick-nav">
            <div class="quick-tile" data-route="#/merchant-dashboard"><span class="badge open">店铺</span><strong>进入商家后台</strong></div>
          </div>
        </div>
      </div>
    </div>`;
}

function renderRiderProfile() {
  const rider = getRiderDashboardData();
  return `
    <div class="shell">
      <div class="auth-grid">
        <div class="panel">
          <div class="profile-avatar-panel">
            <img class="profile-avatar-preview" src="${state.profile.avatar || getFallbackUserAvatar()}" alt="骑手头像预览" />
            <div>
              <h2 style="margin: 0;">骑手资料</h2>
              <p class="helper-note">${rider.riderName} · 配送骑手</p>
              <p class="helper-note">骑手账号聚焦配送任务、收入和工作状态，不参与普通用户购物流程。</p>
            </div>
          </div>
          <div class="auth-form">
            <div class="form-row"><label>骑手昵称</label><input class="input" id="profileName" value="${state.profile.nickname}" /></div>
            <div class="form-row"><label>联系电话</label><input class="input" id="profilePhone" value="${state.profile.phone}" /></div>
            <div class="form-row"><label>服务区域</label><input class="input" id="riderServiceArea" value="${rider.serviceArea}" /></div>
            <button class="btn primary" id="saveProfileBtn">保存资料</button>
          </div>
        </div>
        <div class="panel">
          <h3>工作信息</h3>
          <div class="product-list">
            <div class="product-item"><strong>骑手编号</strong><p class="helper-note">${rider.riderCode}</p></div>
            <div class="product-item"><strong>在线状态</strong><p class="helper-note">${rider.online ? '在线' : '休息中'}</p></div>
            <div class="product-item"><strong>今日配送</strong><p class="helper-note">${rider.todayDeliveries} 单</p></div>
            <div class="product-item"><strong>待取餐</strong><p class="helper-note">${rider.pendingPickups} 单</p></div>
            <div class="product-item"><strong>今日收入</strong><p class="helper-note">${formatCurrency(rider.income)}</p></div>
          </div>
          <h3 style="margin-top:18px;">工作入口</h3>
          <div class="quick-nav">
            <div class="quick-tile" data-route="#/rider-dashboard"><span class="badge open">配送</span><strong>进入骑手工作台</strong></div>
          </div>
        </div>
      </div>
    </div>`;
}

function renderGuestProfile() {
  return `
    <div class="shell">
      <div class="panel empty-state">
        当前为游客模式。你可以浏览商家与商品，但下单、评价、购物车等功能需要先登录普通用户账号。
        <div style="margin-top:16px;">
          <button class="btn primary" data-route="#/login">立即登录</button>
        </div>
      </div>
    </div>`;
}

function renderProfile() {
  // 管理员直接进入管理后台，不需要单独的资料页
  if (isAdmin()) {
    state.route = '#/admin-dashboard';
    saveState();
    // 返回空，render() 会重新调用
    return '';
  }
  if (isMerchant()) return renderMerchantProfile();
  if (isRider()) return renderRiderProfile();
  if (isConsumer()) return renderConsumerProfile();
  return renderGuestProfile();
}

/* ===== 管理后台数据与操作 ===== */
let adminPageData = { merchants: [], riders: [], users: [], activeTab: 'merchants', loading: false };

async function loadAdminMerchants() {
  adminPageData.loading = true;
  try { const res = await api.adminGetMerchants(1, 50); adminPageData.merchants = extractListPayload(res); }
  catch (e) { console.error(e); adminPageData.merchants = []; }
  adminPageData.loading = false;
}
async function loadAdminRiders() {
  adminPageData.loading = true;
  try { const res = await api.adminGetRiders(1, 50); adminPageData.riders = extractListPayload(res); }
  catch (e) { console.error(e); adminPageData.riders = []; }
  adminPageData.loading = false;
}
async function loadAdminUsers() {
  adminPageData.loading = true;
  try { const res = await api.adminGetUsers(1, 50); adminPageData.users = extractListPayload(res); }
  catch (e) { console.error(e); adminPageData.users = []; }
  adminPageData.loading = false;
}

window.switchAdminTab = async function(tab) {
  adminPageData.activeTab = tab;
  // 直接重新渲染，不触发 hashchange
  await render();
};

window.adminAuditMerchant = async function(id, status) {
  if (!confirm(`确定要${status === 'active' ? '通过' : '拒绝'}该商家吗？`)) return;
  try {
    await api.adminAuditMerchant(id, { status, opinion: status === 'active' ? '审核通过' : '审核不通过' });
    showToast('操作成功');
    setRoute('#/admin-dashboard');
  } catch (e) { showToast('操作失败'); }
};

window.adminAuditRider = async function(id, status) {
  if (!confirm(`确定要${status === 'active' ? '通过' : '拒绝'}该骑手吗？`)) return;
  try {
    await api.adminAuditRider(id, { status, opinion: status === 'active' ? '审核通过' : '审核不通过' });
    showToast('操作成功');
    setRoute('#/admin-dashboard');
  } catch (e) { showToast('操作失败'); }
};

window.adminDeleteUser = async function(id) {
  if (!confirm('确定要冻结该用户吗？')) return;
  try { await api.adminDeleteUser(id); showToast('已冻结'); await Promise.all([loadAdminMerchants(), loadAdminRiders(), loadAdminUsers()]); await render(); }
  catch (e) { showToast('操作失败: ' + (e.message || '未知错误')); }
};
window.adminDeleteMerchant = async function(id) {
  if (!confirm('确定要冻结该商家吗？')) return;
  try { await api.adminDeleteMerchant(id); showToast('已冻结'); await Promise.all([loadAdminMerchants(), loadAdminRiders(), loadAdminUsers()]); await render(); }
  catch (e) { showToast('操作失败: ' + (e.message || '未知错误')); }
};
window.adminDeleteRider = async function(id) {
  if (!confirm('确定要冻结该骑手吗？')) return;
  try { await api.adminDeleteRider(id); showToast('已冻结'); await Promise.all([loadAdminMerchants(), loadAdminRiders(), loadAdminUsers()]); await render(); }
  catch (e) { showToast('操作失败: ' + (e.message || '未知错误')); }
};

window.adminUnfreezeUser = async function(id) {
  if (!confirm('确定要解冻该用户吗？')) return;
  try { await api.adminUnfreezeUser(id); showToast('已解冻'); await Promise.all([loadAdminMerchants(), loadAdminRiders(), loadAdminUsers()]); await render(); }
  catch (e) { showToast('操作失败: ' + (e.message || '未知错误')); }
};
window.adminUnfreezeMerchant = async function(id) {
  if (!confirm('确定要解冻该商家吗？')) return;
  try { await api.adminUnfreezeMerchant(id); showToast('已解冻'); await Promise.all([loadAdminMerchants(), loadAdminRiders(), loadAdminUsers()]); await render(); }
  catch (e) { showToast('操作失败: ' + (e.message || '未知错误')); }
};
window.adminUnfreezeRider = async function(id) {
  if (!confirm('确定要解冻该骑手吗？')) return;
  try { await api.adminUnfreezeRider(id); showToast('已解冻'); await Promise.all([loadAdminMerchants(), loadAdminRiders(), loadAdminUsers()]); await render(); }
  catch (e) { showToast('操作失败: ' + (e.message || '未知错误')); }
};

function renderAdminMerchantTable() {
  const items = adminPageData.merchants;
  if (!items.length) return '<p class="helper-note">暂无商家数据</p>';
  return `<table class="admin-table"><thead><tr>
    <th>ID</th><th>用户名</th><th>店铺名</th><th>手机号</th><th>评分</th><th>月销量</th><th>状态</th><th>操作</th>
  </tr></thead><tbody>${items.map(m => {
    const statusBadge = m.status === 'active' ? '<span class="badge open">已通过</span>'
      : m.status === 'pending' ? '<span class="badge warn">待审核</span>'
      : m.status === 'rejected' ? '<span class="badge closed">已拒绝</span>'
      : m.status === 'frozen' ? '<span class="badge closed">已冻结</span>'
      : '<span class="badge">' + (m.status || '未知') + '</span>';
    // 使用字符串传递ID，避免JavaScript Number精度丢失（ID超过Number.MAX_SAFE_INTEGER）
    const idStr = String(m.id);
    const auditBtns = m.status === 'pending'
      ? `<button class="btn small primary" onclick="adminAuditMerchant('${idStr}','active')">通过</button>
         <button class="btn small danger" onclick="adminAuditMerchant('${idStr}','rejected')">拒绝</button>`
      : m.status === 'frozen'
        ? `<button class="btn small primary" onclick="adminUnfreezeMerchant('${idStr}')">解除冻结</button>`
        : `<button class="btn small ghost" onclick="adminDeleteMerchant('${idStr}')">冻结</button>`;
    return `<tr>
      <td>${m.id}</td>
      <td>${m.username || '-'}</td>
      <td>${m.name || '-'}</td>
      <td>${m.phone || '-'}</td>
      <td>${m.rating || 0}</td>
      <td>${m.monthlySales || 0}</td>
      <td>${statusBadge}</td>
      <td style="white-space:nowrap;">${auditBtns}</td>
    </tr>`;
  }).join('')}</tbody></table>`;
}

function renderAdminRiderTable() {
  const items = adminPageData.riders;
  if (!items.length) return '<p class="helper-note">暂无骑手数据</p>';
  return `<table class="admin-table"><thead><tr>
    <th>ID</th><th>姓名</th><th>手机号</th><th>服务区域</th><th>状态</th><th>操作</th>
  </tr></thead><tbody>${items.map(r => {
    const statusBadge = r.status === 'active' ? '<span class="badge open">已通过</span>'
      : r.status === 'pending' ? '<span class="badge warn">待审核</span>'
      : r.status === 'rejected' ? '<span class="badge closed">已拒绝</span>'
      : r.status === 'frozen' ? '<span class="badge closed">已冻结</span>'
      : '<span class="badge">' + (r.status || '未知') + '</span>';
    // 使用字符串传递ID，避免JavaScript Number精度丢失
    const idStr = String(r.id);
    const auditBtns = r.status === 'pending'
      ? `<button class="btn small primary" onclick="adminAuditRider('${idStr}','active')">通过</button>
         <button class="btn small danger" onclick="adminAuditRider('${idStr}','rejected')">拒绝</button>`
      : r.status === 'frozen'
        ? `<button class="btn small primary" onclick="adminUnfreezeRider('${idStr}')">解除冻结</button>`
        : `<button class="btn small ghost" onclick="adminDeleteRider('${idStr}')">冻结</button>`;
    return `<tr>
      <td>${r.id}</td>
      <td>${r.name || r.username || '-'}</td>
      <td>${r.phone || '-'}</td>
      <td>${r.serviceArea || '-'}</td>
      <td>${statusBadge}</td>
      <td style="white-space:nowrap;">${auditBtns}</td>
    </tr>`;
  }).join('')}</tbody></table>`;
}

function renderAdminUserTable() {
  const items = adminPageData.users;
  if (!items.length) return '<p class="helper-note">暂无用户数据</p>';
  return `<table class="admin-table"><thead><tr>
    <th>ID</th><th>用户名</th><th>昵称</th><th>手机号</th><th>角色</th><th>状态</th><th>操作</th>
  </tr></thead><tbody>${items.map(u => {
    const statusBadge = u.status === 'active' ? '<span class="badge open">正常</span>' : '<span class="badge closed">已冻结</span>';
    // 使用字符串传递ID，避免JavaScript Number精度丢失
    const idStr = String(u.id);
    return `<tr>
      <td>${u.id}</td>
      <td>${u.username || '-'}</td>
      <td>${u.nickname || '-'}</td>
      <td>${u.phone || '-'}</td>
      <td>${u.role || 'consumer'}</td>
      <td>${statusBadge}</td>
      <td>${u.status === 'active'
        ? `<button class="btn small ghost" onclick="adminDeleteUser('${idStr}')">冻结</button>`
        : `<button class="btn small primary" onclick="adminUnfreezeUser('${idStr}')">解除冻结</button>`}</td>
    </tr>`;
  }).join('')}</tbody></table>`;
}

async function renderAdminDashboard() {
  if (!isAdmin()) {
    return `
      <div class="shell">
        <div class="panel empty-state">当前账号不是管理员，请切换为管理员登录后再查看管理后台。</div>
      </div>`;
  }
  await Promise.all([loadAdminMerchants(), loadAdminRiders(), loadAdminUsers()]);
  const tab = adminPageData.activeTab || 'merchants';
  let tabContent = '';
  if (tab === 'merchants') tabContent = renderAdminMerchantTable();
  else if (tab === 'riders') tabContent = renderAdminRiderTable();
  else if (tab === 'users') tabContent = renderAdminUserTable();

  return `
    <div class="shell">
      <div class="panel">
        <h2>🛠️ 管理后台</h2>
        <p class="helper-note">欢迎回来，管理员 ${state.auth.user}</p>
        <div class="admin-tabs" style="display:flex;gap:8px;margin:16px 0;flex-wrap:wrap;">
          <button class="btn ${tab === 'merchants' ? 'primary' : 'ghost'}" onclick="switchAdminTab('merchants')">
            🏪 商家管理 (${adminPageData.merchants.length})
          </button>
          <button class="btn ${tab === 'riders' ? 'primary' : 'ghost'}" onclick="switchAdminTab('riders')">
            🚴 骑手管理 (${adminPageData.riders.length})
          </button>
          <button class="btn ${tab === 'users' ? 'primary' : 'ghost'}" onclick="switchAdminTab('users')">
            👤 用户管理 (${adminPageData.users.length})
          </button>
        </div>
        <div class="admin-tab-content">
          ${adminPageData.loading ? '<p class="helper-note">加载中...</p>' : tabContent}
        </div>
        <div style="margin-top:20px;">
          <button class="btn secondary" data-route="#/home">返回首页</button>
        </div>
      </div>
    </div>`;
}

function renderAuth() {
  return `
    <div class="shell">
      <div class="auth-grid">
        <div class="panel">
          <p class="helper-note">账号登录</p>
          <h2 style="margin-top:0;">欢迎回到生活助手平台</h2>
          <p class="helper-note">游客可以直接浏览商品与商家；登录后可按账号角色进入普通用户、商家或骑手功能。</p>
          <form class="auth-form" id="loginForm">
            <div class="form-row"><label>登录身份</label>
              <select class="input" id="loginRole">
                <option value="consumer">普通用户</option>
                <option value="merchant">商家</option>
                <option value="rider">骑手</option>
                <option value="admin">管理员</option>
              </select>
            </div>
            <div class="form-row"><label>用户名/手机号</label><input class="input" id="loginName" placeholder="请输入用户名或手机号" /></div>
            <div class="form-row"><label>密码</label><input class="input" id="loginPassword" type="password" placeholder="请输入密码" /></div>
            <!-- 验证码已暂时屏蔽，保留代码以便后续恢复
            <div class="captcha-box">
              <img id="captchaImage" src="" alt="验证码" style="cursor:pointer;vertical-align:middle;border:1px solid #ddd;border-radius:4px;width:130px;height:48px;" />
              <button type="button" class="btn ghost" id="refreshCaptchaBtn">换一张</button>
            </div>
            <div class="form-row"><label>输入验证码</label><input class="input" id="captchaInput" placeholder="请输入图形验证码" /></div>
            -->
            <button class="btn primary" type="submit">登录</button>
          </form>
          <div class="quick-nav" style="margin-top:16px;">
            <div class="quick-tile"><span class="badge open">普通用户</span><strong>浏览、下单、评价、个人资料</strong></div>
            <div class="quick-tile"><span class="badge open">商家</span><strong>商品管理、店铺资料、经营看板</strong></div>
            <div class="quick-tile"><span class="badge open">骑手</span><strong>接单、配送、收入与任务列表</strong></div>
            <div class="quick-tile"><span class="badge open">管理员</span><strong>审核商家与骑手、管理用户与订单</strong></div>
          </div>
        </div>
        <div class="panel">
          <h3>注册普通用户</h3>
          <form class="auth-form" id="registerForm">
            <div class="form-row"><label>用户名</label><input class="input" id="registerName" placeholder="2-20 个字符" /></div>
            <div class="form-row"><label>手机号</label><input class="input" id="registerPhone" placeholder="11 位手机号" /></div>
            <div class="form-row"><label>密码</label><input class="input" id="registerPassword" type="password" placeholder="包含字母和数字" /></div>
            <button class="btn secondary" type="submit">注册账号</button>
          </form>
          <hr style="margin:20px 0;" />
          <h3>注册商家</h3>
          <form class="auth-form" id="registerMerchantForm">
            <div class="form-row"><label>用户名</label><input class="input" id="registerMerchantName" placeholder="2-20 个字符" /></div>
            <div class="form-row"><label>手机号</label><input class="input" id="registerMerchantPhone" placeholder="11 位手机号" /></div>
            <div class="form-row"><label>密码</label><input class="input" id="registerMerchantPassword" type="password" placeholder="包含字母和数字" /></div>
            <button class="btn secondary" type="submit">注册商家</button>
          </form>
          <hr style="margin:20px 0;" />
          <h3>注册骑手</h3>
          <form class="auth-form" id="registerRiderForm">
            <div class="form-row"><label>用户名</label><input class="input" id="registerRiderName" placeholder="2-20 个字符" /></div>
            <div class="form-row"><label>手机号</label><input class="input" id="registerRiderPhone" placeholder="11 位手机号" /></div>
            <div class="form-row"><label>密码</label><input class="input" id="registerRiderPassword" type="password" placeholder="包含字母和数字" /></div>
            <button class="btn secondary" type="submit">注册骑手</button>
          </form>
          <div class="footer-note">当前演示支持四类登录：普通用户、商家、骑手、管理员。管理员账号由系统内部创建，不开放注册。</div>
        </div>
      </div>
    </div>`;
}

function renderMerchantDashboard() {
  if (!isMerchant()) {
    return `
      <div class="shell">
        <div class="panel empty-state">当前账号不是商家账号，请切换为商家登录后再查看商家后台。</div>
      </div>`;
  }

  const dashboard = state.dashboard;
  const merchant = getCurrentMerchant() || getSelectedMerchant() || state.merchants[0] || { products: [], name: '暂无商家', avatar: '' };
  const merchantOrders = state.orders.filter((order) => Number(order.merchantId) === Number(merchant.id));
  return `
    <div class="shell">
      <div class="panel">
        <p class="helper-note">商家后台首页</p>
        <h2 style="margin-top:0;">商家数据概览</h2>
        <div class="dashboard-grid">
          <div class="metric-box"><span>今日订单</span><strong>${merchantOrders.length || (dashboard.todayOrders ?? 0)}</strong></div>
          <div class="metric-box"><span>待处理订单</span><strong>${merchantOrders.filter((order) => ['待支付', '配送中', '待使用'].includes(order.status)).length}</strong></div>
          <div class="metric-box"><span>新增评价</span><strong>${dashboard.newReviews ?? 12}</strong></div>
          <div class="metric-box"><span>营业额</span><strong>${formatCurrency(merchantOrders.reduce((sum, order) => sum + Number(order.amount || 0), 0) || (dashboard.revenue ?? 0))}</strong></div>
        </div>
      </div>
      <div class="panel" style="margin-top:20px;">
        <div class="section-head">
          <div>
            <h3 style="margin:0;">店铺资料管理</h3>
            <p class="helper-note">当前商家：${merchant.name}</p>
          </div>
        </div>
        <div class="merchant-avatar-editor">
          <img class="merchant-avatar-preview" src="${getMerchantAvatar(merchant)}" alt="店铺头像预览" />
          <div class="merchant-avatar-controls">
            <div class="auth-form" style="width:100%;">
              <div class="form-row"><label>店铺昵称</label><input class="input" id="merchantProfileName" value="${merchant.name || ''}" /></div>
              <div class="form-row"><label>联系电话</label><input class="input" id="merchantProfilePhone" value="${merchant.phone || ''}" /></div>
              <div class="form-row"><label>店铺地址</label><input class="input" id="merchantProfileAddress" value="${merchant.address || ''}" /></div>
              <div class="form-row"><label>店铺简介</label><textarea class="input" id="merchantProfileDescription" rows="4">${merchant.description || ''}</textarea></div>
              <div class="detail-action-row">
                <label class="btn secondary" for="merchantAvatarInput">上传店铺头像</label>
                <input type="file" accept="image/*" id="merchantAvatarInput" class="avatar-file-input" />
                <button class="btn primary" id="saveMerchantProfileBtn">保存店铺资料</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="panel" style="margin-top:20px;">
        <div class="section-head">
          <h3>订单处理</h3>
          <span class="helper-note">仅显示当前店铺订单</span>
        </div>
        <div class="product-list">
          ${merchantOrders.length ? merchantOrders.map((order) => `
            <div class="product-item">
              <div class="card-row">
                <div>
                  <strong>${order.id}</strong>
                  <p class="helper-note">${order.items.map((item) => `${item.name} ×${item.quantity}`).join(' / ')}</p>
                  <p class="helper-note">状态：${order.status}${order.riderName ? ` · 骑手：${order.riderName}` : ''}</p>
                </div>
                <div>
                  <div class="order-amount">${formatCurrency(order.amount)}</div>
                  <div class="detail-action-row" style="margin-top:8px;">
                    <button class="btn secondary merchant-order-status-btn" data-order-id="${order.id}" data-status="配送中">标记配送中</button>
                    <button class="btn primary merchant-order-status-btn" data-order-id="${order.id}" data-status="已完成">完成订单</button>
                  </div>
                </div>
              </div>
            </div>
          `).join('') : '<div class="empty-state">当前店铺还没有订单。</div>'}
        </div>
      </div>
      <div class="panel" style="margin-top:20px;">
        <div class="section-head">
          <h3>商品管理</h3>
          <button class="btn primary" data-route="#/merchant-product-editor/new">添加商品</button>
        </div>
        <div class="product-list">
          ${(merchant.products || []).map((item) => `
            <div class="product-item manager-card" data-product-id="${item.id}">
              <img class="product-image" src="${item.image || 'https://via.placeholder.com/120?text=商品'}" alt="${item.name}" />
              <div class="product-info">
                ${renderTags(item.tags)}
                <div class="meta-row">${renderStars(item.rating)}<span class="helper-note small">${item.category}</span></div>
                <div class="card-row">
                  <div>
                    <strong>${item.name}</strong>
                    <p class="helper-note">${item.desc}</p>
                  </div>
                  <span>${formatCurrency(item.price)}</span>
                </div>
                <div class="price-row">
                  <span class="helper-note">月售 ${item.sales} · 库存 ${item.stock}</span>
                  <div class="quantity-wrap">
                    <button class="qty-btn manage-product-qty" data-action="decrease" data-product-id="${item.id}">-</button>
                    <span>${item.stock}</span>
                    <button class="qty-btn manage-product-qty" data-action="increase" data-product-id="${item.id}">+</button>
                  </div>
                </div>
                <div class="manage-actions">
                  <button class="btn secondary" data-route="#/merchant-product-editor/${item.id}">编辑</button>
                  <button class="btn ghost manage-product-delete" data-product-id="${item.id}">删除</button>
                </div>
              </div>
            </div>`).join('') || '<div class="empty-state">暂无商品数据</div>'}
        </div>
      </div>
    </div>`;
}



function renderRiderDashboard() {
  if (!isRider()) {
    return `
      <div class="shell">
        <div class="panel empty-state">当前账号不是骑手账号，请切换为骑手登录后再查看骑手工作台。</div>
      </div>`;
  }

  const rider = getRiderDashboardData();
  const taskBuckets = getRiderTaskBuckets();
  const visibleTasks = getVisibleRiderTasks();
  return `
    <div class="shell">
      <div class="panel">
        <p class="helper-note">骑手工作台</p>
        <h2 style="margin-top:0;">配送任务概览</h2>
        <div class="dashboard-grid">
          <div class="metric-box"><span>今日配送</span><strong>${rider.todayDeliveries}</strong></div>
          <div class="metric-box"><span>待取餐</span><strong>${rider.pendingPickups}</strong></div>
          <div class="metric-box"><span>已完成</span><strong>${rider.completedOrders}</strong></div>
          <div class="metric-box"><span>今日收入</span><strong>${formatCurrency(rider.income)}</strong></div>
        </div>
      </div>
      <div class="panel" style="margin-top:20px;">
        <div class="section-head">
          <h3>骑手资料</h3>
          <span class="helper-note">在线状态：${rider.online ? '在线' : '休息中'}</span>
        </div>
        <div class="detail-action-row" style="margin-bottom:12px;">
          <button class="btn ${rider.online ? 'primary' : 'secondary'}" id="toggleRiderOnlineBtn">${rider.online ? '切换离线' : '切换上线'}</button>
        </div>
        <div class="product-list">
          <div class="product-item"><strong>骑手编号</strong><p class="helper-note">${rider.riderCode}</p></div>
          <div class="product-item"><strong>服务区域</strong><p class="helper-note">${rider.serviceArea}</p></div>
          <div class="product-item"><strong>联系方式</strong><p class="helper-note">${state.profile.phone}</p></div>
        </div>
      </div>
      <div class="panel" style="margin-top:20px;">
        <div class="section-head">
          <h3>任务筛选</h3>
          <div class="detail-action-row">
            <button class="btn ${state.riderFilters.tab === 'available' ? 'primary' : 'secondary'} rider-filter-btn" data-rider-tab="available">待抢单 ${taskBuckets.available.length}</button>
            <button class="btn ${state.riderFilters.tab === 'assigned' ? 'primary' : 'secondary'} rider-filter-btn" data-rider-tab="assigned">我的任务 ${taskBuckets.assigned.length}</button>
            <button class="btn ${state.riderFilters.tab === 'completed' ? 'primary' : 'secondary'} rider-filter-btn" data-rider-tab="completed">已完成 ${taskBuckets.completed.length}</button>
          </div>
        </div>
        <div class="product-list">
          ${visibleTasks.length ? visibleTasks.map((task) => `
            <div class="product-item">
              <div class="card-row">
                <div>
                  <strong>${task.merchant}</strong>
                  <p class="helper-note">订单号：${task.id}</p>
                  <p class="helper-note">商品：${task.items}</p>
                  <p class="helper-note">取餐：${task.pickup}</p>
                  <p class="helper-note">送达：${task.destination}</p>
                  <p class="helper-note">状态：${task.status} · 预计：${task.eta}</p>
                  <p class="helper-note">联系方式：商家 ${findMerchantByProduct(task.id)?.phone || '待确认'} · 用户 138****1234</p>
                  <p class="helper-note">配送收入预估：${formatCurrency(task.income)}</p>
                </div>
                <div class="detail-action-row">
                  ${state.riderFilters.tab === 'available' ? `<button class="btn primary rider-task-btn" data-order-id="${task.id}" data-status="待取餐">立即接单</button>` : ''}
                  ${state.riderFilters.tab === 'assigned' && task.status === '待取餐' ? `<button class="btn secondary rider-task-btn" data-order-id="${task.id}" data-status="配送中">已取餐</button>` : ''}
                  ${state.riderFilters.tab === 'assigned' && task.status === '配送中' ? `<button class="btn primary rider-task-btn" data-order-id="${task.id}" data-status="已完成">送达完成</button>` : ''}
                  <button class="btn ghost rider-detail-btn" data-rider-order-id="${task.id}">查看详情</button>
                </div>
              </div>
            </div>
          `).join('') : '<div class="empty-state">当前筛选下没有任务。</div>'}
        </div>
      </div>
    </div>`;
}

function getRouteAccessRedirect(route) {
  if (route === '#/merchant-dashboard' || route.startsWith('#/merchant-product-editor/')) {
    return isMerchant() ? null : '#/login';
  }
  if (route === '#/rider-dashboard') {
    return isRider() ? null : '#/login';
  }
  if (route === '#/admin-dashboard') {
    return isAdmin() ? null : '#/login';
  }
  if (route === '#/cart' || route === '#/orders') {
    return isConsumer() ? null : '#/login';
  }
  return null;
}

async function render() {
  const redirectRoute = getRouteAccessRedirect(state.route);
  if (redirectRoute && state.route !== redirectRoute) {
    state.route = redirectRoute;
    saveState();
  }
  const app = document.getElementById('app');
  let page;
  // 管理员点击"管理后台"（#/profile）时重定向到 #/admin-dashboard
  if (state.route === '#/profile' && isAdmin()) {
    state.route = '#/admin-dashboard';
    saveState();
    page = await renderAdminDashboard();
  } else {
    page = state.route === '#/chat' ? renderChat()
      : state.route === '#/search' ? renderSearchPage()
      : state.route.startsWith('#/merchant-product-editor/') ? renderMerchantProductEditor()
      : state.route.startsWith('#/product-reviews/') ? renderProductReviewsPage()
      : state.route.startsWith('#/product/') ? await renderProductDetail()
      : state.route === '#/merchant' ? await renderMerchant()
      : state.route === '#/cart' ? renderCart()
      : state.route === '#/orders' ? renderOrders()
      : state.route === '#/profile' ? renderProfile()
      : state.route === '#/login' ? renderAuth()
      : state.route === '#/merchant-dashboard' ? renderMerchantDashboard()
      : state.route === '#/rider-dashboard' ? renderRiderDashboard()
      : state.route === '#/admin-dashboard' ? await renderAdminDashboard()
      : renderHome();
  }

  app.innerHTML = `${buildTopbar()}${page}`;
  app.insertAdjacentHTML('beforeend', `<div id="app-toast" class="toast" hidden></div>`);
  bindEvents();
  // 登录页面自动加载验证码
  if (state.route === '#/login') {
    setTimeout(() => {
      const captchaImage = document.getElementById('captchaImage');
      if (captchaImage) {
        const refreshBtn = document.getElementById('refreshCaptchaBtn');
        if (refreshBtn) refreshBtn.click();
      }
    }, 100);
  }
}

function bindEvents() {
  document.querySelectorAll('[data-route]').forEach((element) => {
    element.addEventListener('click', () => {
      if (element.getAttribute('data-route') === '#/login' && isLoggedIn()) {
        logoutCurrentAccount();
        return;
      }
      setRoute(element.getAttribute('data-route'));
    });
  });

  document.querySelectorAll('[data-merchant-id]').forEach((card) => {
    card.addEventListener('click', (event) => {
      if (event.target.closest('[data-product-detail], .merchant-detail-btn')) {
        return;
      }
      state.selectedMerchantId = Number(card.getAttribute('data-merchant-id'));
      localStorage.setItem('selectedMerchantId', String(state.selectedMerchantId));
      setRoute('#/merchant');
    });
  });

  document.querySelectorAll('.merchant-detail-btn').forEach((button) => {
    button.addEventListener('click', () => {
      state.selectedMerchantId = Number(button.getAttribute('data-merchant-entry'));
      localStorage.setItem('selectedMerchantId', String(state.selectedMerchantId));
      setRoute('#/merchant');
    });
  });

  document.querySelectorAll('[data-product-detail]').forEach((element) => {
    element.addEventListener('click', (event) => {
      if (event.target.closest('.qty-btn, .btn')) {
        return;
      }
      const productId = element.getAttribute('data-product-detail');
      state.selectedProductId = productId;
      state.productPickerOpen = false;
      state.activeProductVariantId = null;
      const product = findProduct(productId);
      if (product) {
        const merchant = findMerchantByProduct(productId);
        if (merchant) {
          state.selectedMerchantId = merchant.id;
          localStorage.setItem('selectedMerchantId', String(merchant.id));
        }
      }
      setRoute(`#/product/${productId}`);
      render();
    });
  });

  document.getElementById('openSearchPageBtn')?.addEventListener('click', () => {
    setRoute('#/search');
  });

  document.getElementById('backFromSearchBtn')?.addEventListener('click', () => {
    setRoute('#/home');
  });

  document.getElementById('searchPageInput')?.addEventListener('input', (event) => {
    state.searchDraft = event.target.value;
    saveState();
  });

  document.getElementById('searchPageSubmitBtn')?.addEventListener('click', () => {
    commitSearch(document.getElementById('searchPageInput')?.value || '');
  });

  document.getElementById('searchPageInput')?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commitSearch(event.target.value || '');
    }
  });

  document.getElementById('clearSearchHistoryBtn')?.addEventListener('click', () => {
    state.searchHistory = [];
    saveState();
    render();
  });

  document.querySelectorAll('[data-search-keyword]').forEach((button) => {
    button.addEventListener('click', () => {
      commitSearch(button.getAttribute('data-search-keyword') || '');
    });
  });

  document.getElementById('browseMerchantBtn')?.addEventListener('click', () => {
    const firstMerchant = isMerchant() ? (getCurrentMerchant() || state.merchants[0]) : state.merchants[0];
    if (!firstMerchant) {
      showToast('暂无可浏览商家');
      return;
    }
    state.selectedMerchantId = firstMerchant.id;
    localStorage.setItem('selectedMerchantId', String(firstMerchant.id));
    setRoute(isMerchant() ? '#/merchant-dashboard' : '#/merchant');
  });

  document.getElementById('applyFilterBtn')?.addEventListener('click', () => {
    state.searchText = document.getElementById('searchInput')?.value || '';
    state.filterCategory = document.getElementById('categoryFilter')?.value || '全部';
    saveState();
    render();
  });

  document.getElementById('searchInput')?.addEventListener('input', (event) => {
    state.searchText = event.target.value;
    saveState();
  });

  document.getElementById('categoryFilter')?.addEventListener('change', (event) => {
    state.filterCategory = event.target.value;
    saveState();
    render();
  });

  document.querySelectorAll('[data-review-route]').forEach((element) => {
    element.addEventListener('click', () => {
      const route = element.getAttribute('data-review-route');
      if (route) {
        setRoute(route);
      }
    });
  });

  document.querySelectorAll('[data-category]').forEach((button) => {    button.addEventListener('click', () => {
      localStorage.setItem('selectedCategory', button.getAttribute('data-category'));
      render();
    });
  });

  document.getElementById('backToProductDetailBtn')?.addEventListener('click', () => {
    const productId = getRouteReviewProductId();
    if (productId) {
      setRoute(`#/product/${productId}`);
    }
  });

  document.querySelectorAll('[data-increase]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!requireConsumerAction(isMerchant() ? '商家账号不能加入购物车，请切换普通用户账号' : isRider() ? '骑手账号不能加入购物车，请切换普通用户账号' : '游客可浏览，登录普通用户账号后才能加入购物车')) return;
      const productId = button.getAttribute('data-increase');
      try {
        const response = await api.addCartItem({ productId });
        const existing = state.cart.find((item) => String(item.id) === String(productId));
        // 安全地查找商品：处理 merchant.products 可能为 undefined 的情况
        const allProducts = state.merchants.flatMap((merchant) => merchant.products || []);
        const product = allProducts.find((item) => String(item.id) === String(productId));
        if (existing) {
          existing.quantity += 1;
        } else {
          const merchant = state.merchants.find((entry) => (entry.products || []).some((item) => String(item.id) === String(productId)));
          state.cart.push({ id: productId, name: product?.name || '未知商品', merchant: merchant?.name || '未知商家', price: product?.price || 0, quantity: 1 });
        }
        if (product) product.stock = response.stock;
        saveState();
        showToast('已加入购物车');
        render();
      } catch (error) {
        showToast(error.message);
      }
    });
  });

  document.querySelectorAll('[data-decrease]').forEach((button) => {
    button.addEventListener('click', async () => {
      const productId = button.getAttribute('data-decrease');
      try {
        await api.removeCartItem(productId);
        const item = state.cart.find((cartItem) => String(cartItem.id) === String(productId));
        if (!item) return;
        const product = state.merchants.flatMap((merchant) => merchant.products || []).find((entry) => String(entry.id) === String(productId));
        item.quantity -= 1;
        if (product) {
          product.stock += 1;
        }
        if (item.quantity <= 0) {
          state.cart = state.cart.filter((cartItem) => cartItem.id !== productId);
        }
        saveState();
        showToast('已更新购物车数量');
        render();
      } catch (error) {
        showToast(error.message);
      }
    });
  });

  document.getElementById('openSpecPickerBtn')?.addEventListener('click', () => {
    if (!requireConsumerAction(isMerchant() ? '商家账号不能购买商品，请切换普通用户账号' : isRider() ? '骑手账号不能购买商品，请切换普通用户账号' : '游客可浏览，登录普通用户账号后才能购买商品')) return;
    const product = getSelectedProduct();
    if (!product) {
      showToast('商品不存在');
      return;
    }
    state.productPickerAction = 'add';
    openProductPicker();
    render();
  });

  document.getElementById('buyNowBtn')?.addEventListener('click', () => {
    if (!requireConsumerAction(isMerchant() ? '商家账号不能立即购买，请切换普通用户账号' : isRider() ? '骑手账号不能立即购买，请切换普通用户账号' : '游客可浏览，登录普通用户账号后才能立即购买')) return;
    const product = getSelectedProduct();
    if (!product) {
      showToast('商品不存在');
      return;
    }
    state.productPickerAction = 'buy';
    state.productPickerOpen = false;
    state.productPickerQuantity = Math.max(1, Number(state.productPickerQuantity) || 1);
    addProductToCart(product.id, state.productPickerQuantity, true);
  });

  document.querySelectorAll('.product-gallery-thumb').forEach((thumb) => {
    thumb.addEventListener('click', () => {
      state.activeProductGalleryIndex = Number(thumb.getAttribute('data-gallery-index'));
      saveState();
      render();
    });
  });

  document.querySelectorAll('[data-spec-selection]').forEach((button) => {
    button.addEventListener('click', () => {
      const product = getSelectedProduct();
      if (!product) return;
      const [groupName, value] = (button.getAttribute('data-spec-selection') || '').split('::');
      if (!groupName || !value) return;
      setProductSelection(product.id, groupName, value);
      syncSelectionToAvailableVariant(product);
      render();
    });
  });

  document.querySelectorAll('[data-product-variant]').forEach((button) => {
    button.addEventListener('click', () => {
      state.activeProductVariantId = button.getAttribute('data-product-variant');
      saveState();
      render();
    });
  });

  document.getElementById('increasePickerQty')?.addEventListener('click', () => {
    state.productPickerQuantity = Math.min(99, (Number(state.productPickerQuantity) || 1) + 1);
    saveState();
    render();
  });

  document.getElementById('decreasePickerQty')?.addEventListener('click', () => {
    state.productPickerQuantity = Math.max(1, (Number(state.productPickerQuantity) || 1) - 1);
    saveState();
    render();
  });

  document.getElementById('confirmAddToCartBtn')?.addEventListener('click', () => {
    const product = getSelectedProduct();
    if (!product) {
      showToast('商品不存在');
      return;
    }
    addProductToCart(product.id, state.productPickerQuantity, false);
  });

  document.querySelectorAll('#cancelProductPickerBtn, #cancelProductPickerBtnSecondary').forEach((button) => {
    button.addEventListener('click', () => {
      closeProductPicker();
      render();
    });
  });

  document.getElementById('contactMerchantBtn')?.addEventListener('click', () => {
    const product = getSelectedProduct();
    if (!product) {
      showToast('商品不存在');
      return;
    }
    const merchant = findMerchantByProduct(product.id);
    if (merchant) {
      openChatWithMerchant(merchant);
      showToast('已进入客服聊天');
    } else {
      showToast('该商品所属店铺不存在');
    }
  });

  document.getElementById('sendChatBtn')?.addEventListener('click', () => {
    const merchant = getSelectedMerchant();
    if (!merchant) {
      showToast('当前没有可联系的商家');
      return;
    }
    const input = document.getElementById('chatMessageInput');
    const text = input?.value.trim();
    if (!text) return;
    pushChatMessage(merchant, {
      role: 'user',
      kind: 'text',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    input.value = '';
    showToast('消息已发送，等待商家回复');
    render();
  });

  document.getElementById('chatImageInput')?.addEventListener('change', async (event) => {
    const merchant = getSelectedMerchant();
    if (!merchant) {
      showToast('当前没有可联系的商家');
      event.target.value = '';
      return;
    }
    const file = event.target.files?.[0];
    try {
      const attachment = await readAvatarFile(file);
      pushChatMessage(merchant, {
        role: 'user',
        kind: 'image',
        text: '已发送图片',
        attachment,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      showToast('图片已发送，等待商家回复');
      render();
    } catch (error) {
      showToast(error.message);
    } finally {
      event.target.value = '';
    }
  });

  document.getElementById('sendProductLinkBtn')?.addEventListener('click', () => {
    const merchant = getSelectedMerchant();
    const product = getSelectedProduct();
    if (!merchant || !product) {
      showToast('当前没有可分享的商品');
      return;
    }

    pushChatMessage(merchant, {
      role: 'user',
      kind: 'product-link',
      text: `分享了商品：${product.name}`,
      productId: product.id,
      productName: product.name,
      price: product.price,
      merchantName: merchant.name,
      image: product.image,
      route: `#/product/${product.id}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    showToast('商品链接已发送，等待商家回复');
    render();
  });

  document.getElementById('chatMessageInput')?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      document.getElementById('sendChatBtn')?.click();
    }
  });

  document.getElementById('merchantReplyInput')?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      document.getElementById('sendMerchantReplyBtn')?.click();
    }
  });

  document.getElementById('sendMerchantReplyBtn')?.addEventListener('click', () => {
    const merchant = getSelectedMerchant();
    if (!merchant) {
      showToast('当前没有可联系的商家');
      return;
    }
    const input = document.getElementById('merchantReplyInput');
    const text = input?.value.trim();
    if (!text) return;
    pushChatMessage(merchant, {
      role: 'merchant',
      kind: 'text',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    input.value = '';
    showToast('商家回复已发送');
    render();
  });

  document.getElementById('backToProductBtn')?.addEventListener('click', () => {
    const productId = state.selectedProductId;
    if (productId) {
      setRoute(`#/product/${productId}`);
    } else {
      const merchant = getSelectedMerchant();
      setRoute(merchant ? '#/merchant' : '#/home');
    }
  });

  document.getElementById('viewStoreBtn')?.addEventListener('click', () => {
    const product = getSelectedProduct();
    if (!product) {
      showToast('商品不存在');
      return;
    }
    const merchant = findMerchantByProduct(product.id);
    if (merchant) {
      state.selectedMerchantId = merchant.id;
      localStorage.setItem('selectedMerchantId', String(merchant.id));
      setRoute('#/merchant');
    } else {
      showToast('该商品所属店铺不存在');
    }
  });

  document.getElementById('checkoutBtn')?.addEventListener('click', async () => {
    if (!requireConsumerAction(isMerchant() ? '商家账号不能结算，请切换普通用户账号' : isRider() ? '骑手账号不能结算，请切换普通用户账号' : '请先登录普通用户账号后再结算')) return;
    const summary = getCartSummary();
    if (!state.cart.length) {
      showToast('购物车为空');
      return;
    }

    if (summary.subtotal < 30) {
      showToast('未达到起送价，请继续加菜');
      return;
    }

    try {
      const response = await api.checkout({ couponId: summary.coupon?.id || null });
      const newOrder = normalizeOrder(response.order);
      state.orders.unshift(newOrder);
      state.cart = [];
      saveState();
      showToast('下单成功，等待支付与配送');
      setRoute('#/orders');
    } catch (error) {
      showToast(error.message);
    }
  });

  document.getElementById('clearCartBtn')?.addEventListener('click', async () => {
    try {
      await api.clearCart();
      state.cart = [];
      saveState();
      showToast('购物车已清空');
      render();
    } catch (error) {
      showToast(error.message);
    }
  });

  document.querySelectorAll('.manage-product-qty').forEach((button) => {
    button.addEventListener('click', async () => {
      const productId = button.getAttribute('data-product-id');
      const action = button.getAttribute('data-action');
      const product = findProduct(productId);
      if (!product) return;
      const nextStock = Math.max(0, product.stock + (action === 'increase' ? 1 : -1));
      try {
        const updated = await api.updateMerchantProduct(productId, { stock: nextStock, price: product.price });
        Object.assign(product, updated);
        saveState();
        showToast('已更新库存');
        render();
      } catch (error) {
        showToast(error.message);
      }
    });
  });

  document.querySelectorAll('.manage-product-delete').forEach((button) => {
    button.addEventListener('click', async () => {
      const productId = button.getAttribute('data-product-id');
      const merchant = findMerchantByProduct(productId);
      if (!merchant) return;
      try {
        await api.deleteMerchantProduct(productId);
        merchant.products = merchant.products.filter((item) => item.id !== productId);
        saveState();
        showToast('已删除商品');
        render();
      } catch (error) {
        showToast(error.message);
      }
    });
  });

  document.getElementById('backToMerchantDashboardBtn')?.addEventListener('click', () => {
    setRoute('#/merchant-dashboard');
  });

  document.getElementById('resetMerchantAddressBtn')?.addEventListener('click', () => {
    const merchant = getSelectedMerchant();
    if (!state.editingMerchantDraft || !merchant) return;
    state.editingMerchantDraft.address = merchant.address || '';
    saveState();
    showToast('已恢复店铺地址');
    render();
  });

  document.getElementById('saveMerchantProductBtn')?.addEventListener('click', async () => {
    const merchant = getCurrentMerchant() || getSelectedMerchant();
    if (!merchant || !state.editingProductDraft || !state.editingMerchantDraft) {
      showToast('当前没有可保存的商家商品');
      return;
    }

    const merchantDraft = state.editingMerchantDraft;
    const productDraft = state.editingProductDraft;
    merchantDraft.address = String(merchantDraft.address || '').trim();
    merchantDraft.phone = String(merchantDraft.phone || '').trim();
    if (!merchantDraft.address) {
      showToast('请填写店铺地址');
      return;
    }

    const normalizedProduct = structuredClone(productDraft);
    normalizedProduct.gallery = sanitizeArray(normalizedProduct.gallery).filter(Boolean);
    normalizedProduct.services = sanitizeArray(normalizedProduct.services).filter(Boolean);
    normalizedProduct.tags = sanitizeArray(normalizedProduct.tags).filter(Boolean);
    normalizedProduct.reviews = sanitizeArray(normalizedProduct.reviews).filter((review) => review && typeof review === 'object');
    normalizedProduct.specGroups = sanitizeArray(normalizedProduct.specGroups)
      .map((group, index) => normalizeSpecGroup(group, `规格维度 ${index + 1}`))
      .filter((group) => group.name && group.values.length);
    normalizedProduct.specs = buildGeneratedVariantsFromSpecGroups(normalizedProduct).map((variant, index) => ({
      id: variant.id || `spec-${Date.now()}-${index}`,
      label: variant.label || `规格 ${index + 1}`,
      price: Number(variant.price) || 0,
      stock: Number(variant.stock) || 0,
      badge: variant.badge || (index === 0 ? '默认' : '可选'),
      image: variant.image || '',
      selections: sanitizeObject(variant.selections)
    }));
    if (normalizedProduct.gallery.length) {
      normalizedProduct.image = normalizedProduct.gallery[0];
    }

    try {
      const updatedMerchant = await api.updateMerchantProfile({
        merchantId: merchant.id,
        name: merchantDraft.name,
        phone: merchantDraft.phone,
        address: merchantDraft.address,
        description: merchantDraft.description,
        avatar: merchantDraft.avatar || merchant.avatar || ''
      });
      Object.assign(merchant, updatedMerchant || merchantDraft);
      const isNewProduct = getRouteMerchantEditorProductId() === 'new';
      const savedProduct = isNewProduct
        ? await api.saveMerchantProduct({ ...normalizedProduct, merchantId: merchant.id })
        : await api.updateMerchantProduct(normalizedProduct.id, { ...normalizedProduct, merchantId: merchant.id });
      const currentMerchant = getCurrentMerchant() || merchant;
      const existing = currentMerchant.products.find((item) => item.id === savedProduct.id);
      if (existing) {
        Object.assign(existing, savedProduct);
      } else {
        currentMerchant.products.push(savedProduct);
      }
      state.selectedMerchantId = currentMerchant.id;
      state.selectedProductId = savedProduct.id;
      state.editingProductDraft = null;
      state.editingMerchantDraft = null;
      state.merchantTagModalOpen = false;
      state.merchantTagDraft = '';
      saveState();
      showToast('商品与店铺信息已保存');
      setRoute('#/merchant-dashboard');
    } catch (error) {
      showToast(error.message);
    }
  });

  document.getElementById('merchantProductGalleryInput')?.addEventListener('change', async (event) => {
    if (!state.editingProductDraft) {
      showToast('当前没有待编辑商品');
      event.target.value = '';
      return;
    }

    const files = Array.from(event.target.files || []);
    if (!files.length) {
      event.target.value = '';
      return;
    }

    try {
      const attachments = await Promise.all(files.map((file) => readAvatarFile(file)));
      state.editingProductDraft.gallery = sanitizeArray(state.editingProductDraft.gallery).concat(attachments);
      if (!state.editingProductDraft.image && attachments[0]) {
        state.editingProductDraft.image = attachments[0];
      }
      saveState();
      showToast(`已上传 ${attachments.length} 张图片`);
      render();
    } catch (error) {
      showToast(error.message);
    } finally {
      event.target.value = '';
    }
  });

  document.getElementById('openTagModalBtn')?.addEventListener('click', () => {
    state.merchantTagModalOpen = true;
    state.merchantTagDraft = '';
    saveState();
    render();
  });

  document.getElementById('closeTagModalBtn')?.addEventListener('click', () => {
    state.merchantTagModalOpen = false;
    state.merchantTagDraft = '';
    saveState();
    render();
  });

  document.getElementById('cancelTagModalBtn')?.addEventListener('click', () => {
    state.merchantTagModalOpen = false;
    state.merchantTagDraft = '';
    saveState();
    render();
  });

  document.getElementById('merchantTagInput')?.addEventListener('input', (event) => {
    state.merchantTagDraft = event.target.value;
    saveState();
  });

  document.getElementById('confirmAddTagBtn')?.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!state.editingProductDraft) return;
    const tag = document.getElementById('merchantTagInput')?.value.trim() || '';
    if (!tag) {
      showToast('请输入标签名称');
      return;
    }
    const tags = sanitizeArray(state.editingProductDraft.tags);
    if (!tags.includes(tag)) {
      tags.push(tag);
      state.editingProductDraft.tags = tags;
      saveState();
    }
    state.merchantTagModalOpen = false;
    state.merchantTagDraft = '';
    saveState();
    render();
  });

  document.getElementById('addProductSpecBtn')?.addEventListener('click', () => {
    if (!state.editingProductDraft) {
      showToast('当前没有待编辑商品');
      return;
    }

    const nextIndex = sanitizeArray(state.editingProductDraft.specGroups).length + 1;
    const specGroups = sanitizeArray(state.editingProductDraft.specGroups).map((group, index) => normalizeSpecGroup(group, `规格维度 ${index + 1}`));
    specGroups.push({
      name: `规格维度 ${nextIndex}`,
      useImage: false,
      values: [{ id: `spec-value-${Date.now()}`, label: '默认', image: '' }]
    });
    state.editingProductDraft.specGroups = specGroups;
    state.editingProductDraft.specs = buildGeneratedVariantsFromSpecGroups(state.editingProductDraft);
    saveState();
    render();
  });

  document.querySelectorAll('.merchant-editor-field').forEach((element) => {
    element.addEventListener('input', (event) => {
      const field = event.target.getAttribute('data-field');
      if (!state.editingMerchantDraft) return;
      if (field === 'open') {
        state.editingMerchantDraft.open = event.target.value === 'true';
      } else {
        state.editingMerchantDraft[field] = event.target.value;
      }
      saveState();
    });
  });

  document.querySelectorAll('.product-editor-field').forEach((element) => {
    element.addEventListener('input', (event) => {
      if (!state.editingProductDraft) return;
      const field = event.target.getAttribute('data-field');
      if (field === 'services') {
        state.editingProductDraft[field] = parseListValue(event.target.value);
      } else if (['price', 'stock', 'sales'].includes(field)) {
        state.editingProductDraft[field] = Number(event.target.value);
      } else {
        state.editingProductDraft[field] = event.target.value;
      }
      saveState();
    });
  });

  document.querySelectorAll('.spec-group-field').forEach((element) => {
    element.addEventListener('input', (event) => {
      if (!state.editingProductDraft) return;
      const groupIndex = Number(event.target.getAttribute('data-group-index'));
      const field = event.target.getAttribute('data-field');
      if (!Number.isFinite(groupIndex)) return;
      const specGroups = sanitizeArray(state.editingProductDraft.specGroups).map((group, index) => normalizeSpecGroup(group, `规格维度 ${index + 1}`));
      if (!specGroups[groupIndex]) return;
      if (field === 'name') {
        specGroups[groupIndex].name = event.target.value;
      }
      state.editingProductDraft.specGroups = specGroups;
      state.editingProductDraft.specs = buildGeneratedVariantsFromSpecGroups(state.editingProductDraft);
      saveState();
    });
  });

  document.querySelectorAll('.spec-value-field').forEach((element) => {
    element.addEventListener('input', (event) => {
      if (!state.editingProductDraft) return;
      const groupIndex = Number(event.target.getAttribute('data-group-index'));
      const valueIndex = Number(event.target.getAttribute('data-value-index'));
      const field = event.target.getAttribute('data-field');
      if (!Number.isFinite(groupIndex) || !Number.isFinite(valueIndex)) return;
      const specGroups = sanitizeArray(state.editingProductDraft.specGroups).map((group, index) => normalizeSpecGroup(group, `规格维度 ${index + 1}`));
      const group = specGroups[groupIndex];
      const value = group?.values?.[valueIndex];
      if (!group || !value) return;
      if (field === 'label') {
        value.label = event.target.value;
      }
      state.editingProductDraft.specGroups = specGroups;
      state.editingProductDraft.specs = buildGeneratedVariantsFromSpecGroups(state.editingProductDraft);
      saveState();
    });
  });

  document.querySelectorAll('.spec-group-toggle-image').forEach((element) => {
    element.addEventListener('change', (event) => {
      if (!state.editingProductDraft) return;
      const groupIndex = Number(event.target.getAttribute('data-group-index'));
      if (!Number.isFinite(groupIndex)) return;
      const specGroups = sanitizeArray(state.editingProductDraft.specGroups).map((group, index) => normalizeSpecGroup(group, `规格维度 ${index + 1}`));
      if (!specGroups[groupIndex]) return;
      specGroups[groupIndex].useImage = event.target.checked;
      if (!event.target.checked) {
        specGroups[groupIndex].values = specGroups[groupIndex].values.map((value) => ({ ...value, image: '' }));
      }
      state.editingProductDraft.specGroups = specGroups;
      state.editingProductDraft.specs = buildGeneratedVariantsFromSpecGroups(state.editingProductDraft);
      saveState();
      render();
    });
  });

  document.querySelectorAll('.add-spec-value-btn').forEach((button) => {
    button.addEventListener('click', () => {
      if (!state.editingProductDraft) return;
      const groupIndex = Number(button.getAttribute('data-group-index'));
      if (!Number.isFinite(groupIndex)) return;
      const specGroups = sanitizeArray(state.editingProductDraft.specGroups).map((group, index) => normalizeSpecGroup(group, `规格维度 ${index + 1}`));
      if (!specGroups[groupIndex]) return;
      specGroups[groupIndex].values.push({
        id: `spec-value-${Date.now()}-${groupIndex}`,
        label: `选项 ${specGroups[groupIndex].values.length + 1}`,
        image: ''
      });
      state.editingProductDraft.specGroups = specGroups;
      state.editingProductDraft.specs = buildGeneratedVariantsFromSpecGroups(state.editingProductDraft);
      saveState();
      render();
    });
  });

  document.querySelectorAll('.remove-spec-value-btn').forEach((button) => {
    button.addEventListener('click', () => {
      if (!state.editingProductDraft) return;
      const groupIndex = Number(button.getAttribute('data-group-index'));
      const valueIndex = Number(button.getAttribute('data-value-index'));
      if (!Number.isFinite(groupIndex) || !Number.isFinite(valueIndex)) return;
      const specGroups = sanitizeArray(state.editingProductDraft.specGroups).map((group, index) => normalizeSpecGroup(group, `规格维度 ${index + 1}`));
      const group = specGroups[groupIndex];
      if (!group || group.values.length <= 1) {
        showToast('每个规格维度至少保留一个规格值');
        return;
      }
      group.values.splice(valueIndex, 1);
      state.editingProductDraft.specGroups = specGroups;
      state.editingProductDraft.specs = buildGeneratedVariantsFromSpecGroups(state.editingProductDraft);
      saveState();
      render();
    });
  });

  document.querySelectorAll('.product-spec-field').forEach((element) => {
    element.addEventListener('input', (event) => {
      if (!state.editingProductDraft) return;
      const specIndex = Number(event.target.getAttribute('data-spec-index'));
      const field = event.target.getAttribute('data-field');
      if (!Number.isFinite(specIndex)) return;
      const specs = sanitizeArray(state.editingProductDraft.specs);
      if (!specs[specIndex]) return;
      specs[specIndex][field] = ['price', 'stock'].includes(field) ? Number(event.target.value) : event.target.value;
      if (field === 'price') {
        state.editingProductDraft.price = Math.min(...specs.map((spec) => Number(spec.price) || 0));
      }
      if (field === 'stock') {
        state.editingProductDraft.stock = specs.reduce((sum, spec) => sum + (Number(spec.stock) || 0), 0);
      }
      state.editingProductDraft.specs = specs;
      saveState();
    });
  });

  document.querySelectorAll('.remove-gallery-btn').forEach((button) => {
    button.addEventListener('click', () => {
      if (!state.editingProductDraft) return;
      const index = Number(button.getAttribute('data-gallery-index'));
      const gallery = sanitizeArray(state.editingProductDraft.gallery);
      gallery.splice(index, 1);
      state.editingProductDraft.gallery = gallery;
      if (!gallery.length) {
        state.editingProductDraft.image = state.editingProductDraft.image || '';
      } else {
        state.editingProductDraft.image = gallery[0];
      }
      saveState();
      render();
    });
  });

  document.querySelectorAll('.spec-value-image-input').forEach((element) => {
    element.addEventListener('change', async (event) => {
      if (!state.editingProductDraft) {
        event.target.value = '';
        return;
      }
      const groupIndex = Number(event.target.getAttribute('data-group-index'));
      const valueIndex = Number(event.target.getAttribute('data-value-index'));
      const file = event.target.files?.[0];
      if (!Number.isFinite(groupIndex) || !Number.isFinite(valueIndex) || !file) {
        event.target.value = '';
        return;
      }
      try {
        const image = await readAvatarFile(file);
        const specGroups = sanitizeArray(state.editingProductDraft.specGroups).map((group, index) => normalizeSpecGroup(group, `规格维度 ${index + 1}`));
        const value = specGroups[groupIndex]?.values?.[valueIndex];
        if (!value) return;
        value.image = image;
        state.editingProductDraft.specGroups = specGroups;
        state.editingProductDraft.specs = buildGeneratedVariantsFromSpecGroups(state.editingProductDraft);
        saveState();
        render();
      } catch (error) {
        showToast(error.message);
      } finally {
        event.target.value = '';
      }
    });
  });


  document.querySelectorAll('.remove-spec-btn').forEach((button) => {
    button.addEventListener('click', () => {
      if (!state.editingProductDraft) return;
      const index = Number(button.getAttribute('data-spec-index'));
      const specs = sanitizeArray(state.editingProductDraft.specs);
      specs.splice(index, 1);
      state.editingProductDraft.specs = specs;
      saveState();
      render();
    });
  });

  document.querySelectorAll('.remove-spec-group-btn').forEach((button) => {
    button.addEventListener('click', () => {
      if (!state.editingProductDraft) return;
      const index = Number(button.getAttribute('data-group-index'));
      const specGroups = sanitizeArray(state.editingProductDraft.specGroups).map((group, groupIndex) => normalizeSpecGroup(group, `规格维度 ${groupIndex + 1}`));
      specGroups.splice(index, 1);
      if (!specGroups.length) {
        specGroups.push({
          name: '规格',
          useImage: false,
          values: [{ id: `spec-value-${Date.now()}`, label: '默认', image: '' }]
        });
      }
      state.editingProductDraft.specGroups = specGroups;
      state.editingProductDraft.specs = buildGeneratedVariantsFromSpecGroups(state.editingProductDraft);
      saveState();
      render();
    });
  });

  document.querySelectorAll('.remove-tag-btn').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (!state.editingProductDraft) return;
      const index = Number(button.getAttribute('data-tag-index'));
      const tags = sanitizeArray(state.editingProductDraft.tags);
      tags.splice(index, 1);
      state.editingProductDraft.tags = tags;
      saveState();
      render();
    });
  });

  document.querySelectorAll('.order-review-rating').forEach((element) => {
    element.addEventListener('change', (event) => {
      const [orderId, productId] = (event.target.getAttribute('data-review-rating') || '').split('::');
      if (!orderId || !productId) return;
      updateReviewDraft(orderId, productId, { rating: Number(event.target.value) || 5 });
    });
  });

  document.querySelectorAll('.order-review-text').forEach((element) => {
    element.addEventListener('input', (event) => {
      const [orderId, productId] = (event.target.getAttribute('data-review-text') || '').split('::');
      if (!orderId || !productId) return;
      updateReviewDraft(orderId, productId, { text: event.target.value });
    });
  });

  document.querySelectorAll('.order-review-image-input').forEach((element) => {
    element.addEventListener('change', async (event) => {
      const orderId = event.target.getAttribute('data-order-id');
      const productId = event.target.getAttribute('data-product-id');
      const files = Array.from(event.target.files || []).slice(0, 9);
      if (!orderId || !productId || !files.length) {
        event.target.value = '';
        return;
      }

      try {
        const images = await Promise.all(files.map((file) => readAvatarFile(file)));
        updateReviewDraft(orderId, productId, {
          images: getReviewDraft(orderId, productId).images.concat(images).slice(0, 9)
        });
        showToast(`已添加 ${images.length} 张评价图片`);
        render();
      } catch (error) {
        showToast(error.message);
      } finally {
        event.target.value = '';
      }
    });
  });

  document.querySelectorAll('.submit-order-review-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const orderId = button.getAttribute('data-order-id');
      const productId = button.getAttribute('data-product-id');
      const order = state.orders.find((entry) => entry.id === orderId);
      const item = sanitizeArray(order?.items).find((entry) => String(entry.id) === String(productId));

      if (!order || !item) {
        showToast('订单或商品不存在');
        return;
      }

      if (item.reviewed) {
        showToast('该商品已评价');
        return;
      }

      const form = button.closest('.order-review-form');
      const rating = Number(form?.querySelector('.order-review-rating')?.value || 0);
      const text = form?.querySelector('.order-review-text')?.value.trim() || '';
      const reviewImages = getReviewDraft(orderId, productId).images;

      if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
        showToast('请选择评分');
        return;
      }

      if (!text) {
        showToast('请填写评价内容');
        return;
      }

      const product = findProduct(productId);
      if (!product) {
        showToast('商品不存在');
        return;
      }

      product.reviews = sanitizeArray(product.reviews);
      product.reviews.unshift({
        user: state.profile.nickname || state.auth.user || '匿名用户',
        avatar: state.profile.avatar || getFallbackUserAvatar(),
        rating,
        text,
        images: reviewImages,
        likes: 1,
        comments: 0,
        tag: item.variantLabel || '默认规格',
        time: new Date().toLocaleDateString('zh-CN')
      });
      syncProductRating(product);
      item.reviewed = true;
      item.reviewedAt = new Date().toLocaleDateString('zh-CN');
      order.reviewedProductIds = Array.from(new Set([...sanitizeArray(order.reviewedProductIds), productId]));
      clearReviewDraft(orderId, productId);
      saveState();
      showToast('评价已提交');
      render();
    });
  });

  // 验证码状态
  let captchaKey = '';

  async function loadCaptcha() {
    try {
      const data = await api.getCaptcha();
      if (data && data.key && data.image) {
        captchaKey = data.key;
        const img = document.getElementById('captchaImage');
        if (img) img.src = data.image;
      }
    } catch (error) {
      // 验证码加载失败时忽略，登录时不校验验证码
      console.warn('验证码加载失败:', error.message);
    }
  }

  document.getElementById('refreshCaptchaBtn')?.addEventListener('click', loadCaptcha);
  document.getElementById('captchaImage')?.addEventListener('click', loadCaptcha);

  document.getElementById('loginForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const loginRole = document.getElementById('loginRole')?.value || 'consumer';
    const loginName = document.getElementById('loginName')?.value.trim() || '';
    const password = document.getElementById('loginPassword')?.value.trim() || '';
    const captcha = document.getElementById('captchaInput')?.value.trim() || '';

    if (!loginName || !password) {
      showToast('请输入用户名与密码');
      return;
    }

    // 如果验证码已加载，则校验
    if (captchaKey && !captcha) {
      showToast('请输入验证码');
      return;
    }

    try {
      let response;
      if (loginRole === 'merchant') {
        response = await api.loginMerchant({ username: loginName, password, captchaKey, captcha });
      } else if (loginRole === 'rider') {
        response = await api.loginRider({ username: loginName, password, captchaKey, captcha });
      } else if (loginRole === 'admin') {
        response = await api.loginAdmin({ username: loginName, password, captchaKey, captcha });
      } else {
        response = await api.login({ username: loginName, password, captchaKey, captcha });
      }
      // 保存 JWT token 到 localStorage
      if (response.accessToken) {
        const sessionData = { token: response.accessToken };
        localStorage.setItem('session', JSON.stringify(sessionData));
      }
      state.auth.user = response.user.username;
      state.auth.role = response.user.role;
      state.auth.merchantId = response.user.merchantId || null;
      state.auth.riderId = response.user.riderId || null;
      state.auth.adminId = response.user.id || null;
      state.profile.nickname = response.user.nickname;
      state.profile.phone = response.user.phone;
      state.profile.avatar = response.user.avatar || state.profile.avatar || getFallbackUserAvatar();
      if (response.user.merchantId) {
        state.selectedMerchantId = response.user.merchantId;
      }
      saveState();
      showToast(`登录成功，欢迎 ${response.user.username}`);
      if (isAdmin()) {
        setRoute('#/admin-dashboard');
      } else {
        setRoute('#/home');
      }
      render();
    } catch (error) {
      showToast(error.message);
      // 登录失败后刷新验证码
      loadCaptcha();
    }
  });

  document.getElementById('registerForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.getElementById('registerName')?.value.trim() || '';
    const phone = document.getElementById('registerPhone')?.value.trim() || '';
    const password = document.getElementById('registerPassword')?.value.trim() || '';

    if (!/^[A-Za-z0-9_]{2,20}$/.test(username)) {
      showToast('用户名格式不正确');
      return;
    }

    if (!/^1\d{10}$/.test(phone)) {
      showToast('手机号格式不正确');
      return;
    }

    if (!/^(?=.*[A-Za-z])(?=.*\d).{6,20}$/.test(password)) {
      showToast('密码需要包含字母和数字，长度 6-20');
      return;
    }

    try {
      await api.register({ username, phone, password, nickname: username });
      showToast('注册成功，请登录');
      setRoute('#/login');
    } catch (error) {
      showToast(error.message);
    }
  });

  document.getElementById('registerMerchantForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.getElementById('registerMerchantName')?.value.trim() || '';
    const phone = document.getElementById('registerMerchantPhone')?.value.trim() || '';
    const password = document.getElementById('registerMerchantPassword')?.value.trim() || '';

    if (!/^[A-Za-z0-9_]{2,20}$/.test(username)) {
      showToast('用户名格式不正确');
      return;
    }

    if (!/^1\d{10}$/.test(phone)) {
      showToast('手机号格式不正确');
      return;
    }

    if (!/^(?=.*[A-Za-z])(?=.*\d).{6,20}$/.test(password)) {
      showToast('密码需要包含字母和数字，长度 6-20');
      return;
    }

    try {
      await api.registerMerchant({ username, phone, password, nickname: username });
      showToast('商家注册成功，请等待管理员审核后登录');
      setRoute('#/login');
    } catch (error) {
      showToast(error.message);
    }
  });

  document.getElementById('registerRiderForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.getElementById('registerRiderName')?.value.trim() || '';
    const phone = document.getElementById('registerRiderPhone')?.value.trim() || '';
    const password = document.getElementById('registerRiderPassword')?.value.trim() || '';

    if (!/^[A-Za-z0-9_]{2,20}$/.test(username)) {
      showToast('用户名格式不正确');
      return;
    }

    if (!/^1\d{10}$/.test(phone)) {
      showToast('手机号格式不正确');
      return;
    }

    if (!/^(?=.*[A-Za-z])(?=.*\d).{6,20}$/.test(password)) {
      showToast('密码需要包含字母和数字，长度 6-20');
      return;
    }

    try {
      await api.registerRider({ username, phone, password, nickname: username });
      showToast('骑手注册成功，请等待管理员审核后登录');
      setRoute('#/login');
    } catch (error) {
      showToast(error.message);
    }
  });

  document.getElementById('profileAvatarInput')?.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    try {
      const avatar = await readAvatarFile(file);
      state.profile.avatar = avatar;
      saveState();
      showToast('头像已预览');
      render();
    } catch (error) {
      showToast(error.message);
    } finally {
      event.target.value = '';
    }
  });

  document.getElementById('saveProfileBtn')?.addEventListener('click', async () => {
    const nickname = document.getElementById('profileName')?.value.trim() || '生活达人';
    const phone = document.getElementById('profilePhone')?.value.trim() || state.profile.phone;
    const serviceArea = document.getElementById('riderServiceArea')?.value.trim() || undefined;
    state.profile.nickname = nickname;
    state.profile.phone = phone;
    state.profile.avatar = state.profile.avatar || getFallbackUserAvatar();
    saveState();
    try {
      const payload = isRider()
        ? { nickname, phone, avatar: state.profile.avatar, serviceArea }
        : { nickname, phone, avatar: state.profile.avatar };
      const response = isRider() ? await api.updateRiderProfile(payload) : await api.updateProfile(payload);
      if (response?.serviceArea) {
        state.profile.serviceArea = response.serviceArea;
      }
      showToast('资料已保存');
      render();
    } catch (error) {
      showToast(error.message);
    }
  });

  document.getElementById('saveMerchantProfileBtn')?.addEventListener('click', async () => {
    const merchant = getCurrentMerchant();
    if (!merchant) {
      showToast('当前商家不存在');
      return;
    }
    const payload = {
      merchantId: merchant.id,
      name: document.getElementById('merchantProfileName')?.value.trim() || merchant.name,
      phone: document.getElementById('merchantProfilePhone')?.value.trim() || merchant.phone,
      address: document.getElementById('merchantProfileAddress')?.value.trim() || merchant.address,
      description: document.getElementById('merchantProfileDescription')?.value.trim() || merchant.description,
      avatar: merchant.avatar || ''
    };
    try {
      const updated = await api.updateMerchantProfile(payload);
      Object.assign(merchant, updated || payload);
      saveState();
      showToast('店铺资料已保存');
      render();
    } catch (error) {
      showToast(error.message);
    }
  });

  document.querySelectorAll('.merchant-order-status-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      const orderId = button.getAttribute('data-order-id');
      const nextStatus = button.getAttribute('data-status');
      const order = state.orders.find((item) => item.id === orderId);
      if (!order) return;
      if (nextStatus === '配送中' && order.status !== '待取餐') {
        showToast('请先让骑手接单后再进入配送中');
        return;
      }
      if (nextStatus === '已完成' && !['配送中', '待使用'].includes(order.status)) {
        showToast('当前订单状态不能直接完成');
        return;
      }
      try {
        const updated = await api.updateMerchantOrder(orderId, {
          status: nextStatus,
          eta: nextStatus === '配送中' ? '18 分钟' : nextStatus === '已完成' ? '已送达' : order.eta
        });
        Object.assign(order, normalizeOrder(updated));
        await refreshRoleData();
        showToast('商家订单状态已更新');
        render();
      } catch (error) {
        showToast(error.message);
      }
    });
  });

  document.getElementById('toggleRiderOnlineBtn')?.addEventListener('click', async () => {
    state.riderOnline = !state.riderOnline;
    await refreshRoleData();
    saveState();
    showToast(state.riderOnline ? '骑手已上线，可接单' : '骑手已离线，停止展示待抢单');
    render();
  });

  document.querySelectorAll('.rider-filter-btn').forEach((button) => {
    button.addEventListener('click', () => {
      state.riderFilters.tab = button.getAttribute('data-rider-tab') || 'available';
      saveState();
      render();
    });
  });

  document.querySelectorAll('.rider-detail-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const task = getRiderDashboardData().tasks.find((item) => item.id === button.getAttribute('data-rider-order-id'));
      if (!task) return;
      state.route = '#/rider-dashboard';
      state.riderFilters.tab = task.status === '已完成' ? 'completed' : task.riderId === state.auth.riderId ? 'assigned' : 'available';
      saveState();
      showToast(`${task.merchant} · ${task.items} · ${task.pickup} → ${task.destination}`);
      render();
    });
  });

  document.querySelectorAll('.rider-task-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      const orderId = button.getAttribute('data-order-id');
      const status = button.getAttribute('data-status');
      try {
        const updated = await api.updateRiderTask(orderId, {
          status,
          riderId: state.auth.riderId,
          riderName: state.profile.nickname || '同城骑手',
          eta: status === '已完成' ? '已送达' : status === '配送中' ? '15分钟' : '25分钟'
        });
        const localOrder = state.orders.find((item) => item.id === orderId);
        if (localOrder) {
          if (status === '待取餐' && localOrder.riderId && localOrder.riderId !== state.auth.riderId) {
            showToast('该订单已被其他骑手接单');
            return;
          }
          if (status === '待取餐' && localOrder.status !== '待支付' && localOrder.status !== '待取餐') {
            showToast('当前订单不在可接单状态');
            return;
          }
          if (status === '配送中' && localOrder.status !== '待取餐') {
            showToast('请先接单后再标记已取餐');
            return;
          }
          if (status === '已完成' && localOrder.status !== '配送中') {
            showToast('只有配送中的订单才能完成');
            return;
          }
          localOrder.status = updated.status || localOrder.status;
          localOrder.eta = updated.eta || localOrder.eta;
          localOrder.riderId = state.auth.riderId;
          localOrder.riderName = state.profile.nickname || localOrder.riderName;
        }
        await refreshRoleData();
        saveState();
        showToast('骑手任务状态已更新');
        render();
      } catch (error) {
        showToast(error.message);
      }
    });
  });

  document.getElementById('merchantAvatarInput')?.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    const merchant = getCurrentMerchant() || getSelectedMerchant();
    if (!merchant) {
      showToast('当前没有可编辑的商家');
      event.target.value = '';
      return;
    }

    try {
      merchant.avatar = await readAvatarFile(file);
      saveState();
      showToast('店铺头像已更新');
      render();
    } catch (error) {
      showToast(error.message);
    } finally {
      event.target.value = '';
    }
  });

  document.querySelectorAll('.order-pay-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        const updated = await api.payOrder(button.getAttribute('data-order-id'));
        const order = state.orders.find((item) => item.id === updated.id);
        if (order) Object.assign(order, normalizeOrder(updated));
        saveState();
        showToast('支付成功，等待商家接单');
        render();
      } catch (error) {
        showToast(error.message);
      }
    });
  });

  document.querySelectorAll('.order-cancel-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        const updated = await api.cancelOrder(button.getAttribute('data-order-id'));
        const order = state.orders.find((item) => item.id === updated.id);
        if (order) Object.assign(order, normalizeOrder(updated));
        saveState();
        showToast('订单已取消');
        render();
      } catch (error) {
        showToast(error.message);
      }
    });
  });

  document.querySelectorAll('.order-complete-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        const updated = await api.completeOrder(button.getAttribute('data-order-id'));
        const order = state.orders.find((item) => item.id === updated.id);
        if (order) Object.assign(order, normalizeOrder(updated));
        saveState();
        showToast('确认收货成功');
        render();
      } catch (error) {
        showToast(error.message);
      }
    });
  });

  document.querySelectorAll('[data-order-tab]').forEach((tab) => {
    tab.addEventListener('click', () => {
      state.orderTab = tab.getAttribute('data-order-tab');
      saveState();
      render();
    });
  });
}

async function bootstrap() {
  state.loading = true;
  saveState();
  // 1. 先加载商家列表（公开接口，无需登录），加载后立即渲染
  try {
    const merchantsResult = await api.getMerchants();
    // 后端返回 Result<PageResult<Merchant>>，unwrap 后得到商家数组
    state.merchants = extractListPayload(merchantsResult);
  } catch (error) {
    state.merchants = state.merchants || [];
    console.warn('商家列表加载失败:', error.message);
  }

  // 商家列表加载完后重新渲染（无论当前路由是什么，确保商品详情页等页面能获取到数据）
  await render();

  // 2. 再加载需要登录的接口（coupons/orders/dashboard），这些接口在未登录时会返回 401
  //    每个接口独立 try/catch，避免一个失败影响其他
  try {
    state.coupons = await api.getCoupons();
  } catch (error) {
    state.coupons = state.coupons || [];
    console.warn('优惠券加载失败:', error.message);
  }

  try {
    state.orders = (await api.getOrders()).map(normalizeOrder);
  } catch (error) {
    state.orders = state.orders || [];
    console.warn('订单加载失败:', error.message);
  }

  try {
    state.dashboard = await api.getDashboard();
  } catch (error) {
    state.dashboard = state.dashboard || null;
    console.warn('仪表盘加载失败:', error.message);
  }

  const persistedMerchants = new Map((state.merchants || []).map((merchant) => [merchant.id, merchant]));
  state.merchants = (state.merchants || []).map((merchant) => {
    const persistedMerchant = persistedMerchants.get(merchant.id);
    return {
      ...merchant,
      avatar: persistedMerchant?.avatar || merchant.avatar || getMerchantAvatar(merchant)
    };
  });
  state.loading = false;
  saveState();
  if (!state.selectedMerchantId && state.merchants.length) {
    state.selectedMerchantId = state.merchants[0].id;
  }
  await render();
  startEtaTicker();
}

window.addEventListener('hashchange', async () => {
  state.route = location.hash || '#/home';
  saveState();
  window.scrollTo({ top: 0, behavior: 'auto' });
  await render();
});

bootstrap();
