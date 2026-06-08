const API_BASE = '/api';

/**
 * 从 localStorage 获取 JWT token
 */
function getToken() {
  try {
    const session = JSON.parse(localStorage.getItem('session') || '{}');
    return session.token || null;
  } catch {
    return null;
  }
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json'
  };

  // 添加 JWT Authorization 头
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(API_BASE + path, {
    headers,
    ...options
  });

  const contentType = response.headers.get('content-type') || '';
  const rawText = await response.text();
  let payload = null;

  if (contentType.includes('application/json') || rawText.trim().startsWith('{') || rawText.trim().startsWith('[')) {
    payload = rawText ? JSON.parse(rawText) : null;
  } else if (rawText.trim()) {
    throw new Error('接口返回格式错误');
  }

  // 处理后端统一响应格式 { code, message, data }
  // 递归解包：如果 data 字段本身也是 { code, data } 结构，继续解包
  function unwrap(obj) {
    if (obj && typeof obj === 'object' && 'code' in obj) {
      if (obj.code !== 200) {
        // 401 未授权/登录过期 -> 清除本地登录状态
        // 注意：不在此处自动跳转登录页，避免 bootstrap 加载期间
        // 因 coupons/orders 等接口返回 401 导致 hashchange 覆盖首页路由
        if (obj.code === 401) {
          try {
            localStorage.removeItem('session');
          } catch (e) {}
        }
        throw new Error(obj.message || '请求失败');
      }
      // 如果 data 存在且是对象（非数组、非null），递归解包
      if (obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data) && 'code' in obj.data) {
        return unwrap(obj.data);
      }
      return obj.data;
    }
    return obj;
  }

  if (payload && typeof payload === 'object' && 'code' in payload) {
    return unwrap(payload);
  }

  if (!response.ok) {
    const message = typeof payload === 'string' ? payload : payload?.message || '请求失败';
    throw new Error(message);
  }

  return payload;
}

export const api = {
  getMerchants() {
    return request('/merchants');
  },
  getMerchant(id) {
    return request(`/merchants/${id}`);
  },
  getCoupons() {
    return request('/coupons');
  },
  getOrders() {
    return request('/orders');
  },
  getDashboard() {
    return request('/dashboard');
  },
  getMerchantOrders(merchantId) {
    return request(`/merchant/orders?merchantId=${merchantId}`);
  },
  updateMerchantOrder(orderId, payload) {
    return request(`/merchant/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },
  updateMerchantProduct(productId, payload) {
    return request('/merchant/products', {
      method: 'PUT',
      body: JSON.stringify({ ...payload, id: payload?.id ?? productId })
    });
  },
  deleteMerchantProduct(productId) {
    return request(`/merchant/products/${productId}`, {
      method: 'DELETE'
    });
  },
  login(payload) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  loginMerchant(payload) {
    return request('/auth/merchant/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  loginAdmin(payload) {
    return request('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  loginRider(payload) {
    return request('/auth/rider/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  register(payload) {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  registerMerchant(payload) {
    return request('/auth/merchant/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  registerRider(payload) {
    return request('/auth/rider/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  getCaptcha() {
    return request('/captcha', {
      method: 'GET'
    });
  },
  updateProfile(payload) {
    return request('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },
  updateMerchantProfile(payload) {
    return request('/merchant/profile', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },
  updateRiderProfile(payload) {
    return request('/rider/profile', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },
  getRiderTasks() {
    return request('/rider/tasks');
  },
  updateRiderTask(taskId, payload) {
    return request(`/rider/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },
  addCartItem(payload) {
    return request('/user/cart', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  removeCartItem(id) {
    return request(`/user/cart/${id}`, {
      method: 'DELETE'
    });
  },
  clearCart() {
    return request('/user/cart', {
      method: 'DELETE'
    });
  },
  checkout(payload) {
    return request('/checkout', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  payOrder(orderId) {
    return request(`/orders/${orderId}/pay`, {
      method: 'POST'
    });
  },
  cancelOrder(orderId) {
    return request(`/orders/${orderId}/cancel`, {
      method: 'POST'
    });
  },
  completeOrder(orderId) {
    return request(`/orders/${orderId}/complete`, {
      method: 'POST'
    });
  },
  saveMerchantProduct(payload) {
    return request('/merchant/products', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  getDelivery(orderId) {
    return request(`/delivery/${orderId}`);
  },
  // ===== 管理员 API =====
  adminGetMerchants(page, pageSize, keyword, status) {
    let url = `/admin/merchants?page=${page || 1}&pageSize=${pageSize || 20}`;
    if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
    if (status) url += `&status=${encodeURIComponent(status)}`;
    return request(url);
  },
  adminGetRiders(page, pageSize, keyword, status) {
    let url = `/admin/riders?page=${page || 1}&pageSize=${pageSize || 20}`;
    if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
    if (status) url += `&status=${encodeURIComponent(status)}`;
    return request(url);
  },
  adminGetUsers(page, pageSize, keyword, status) {
    let url = `/admin/users?page=${page || 1}&pageSize=${pageSize || 20}`;
    if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
    if (status) url += `&status=${encodeURIComponent(status)}`;
    return request(url);
  },
  adminAuditMerchant(id, payload) {
    return request(`/admin/merchants/${id}/audit`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },
  adminAuditRider(id, payload) {
    return request(`/admin/riders/${id}/audit`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },
  adminDeleteUser(id) {
    return request(`/admin/users/${id}`, {
      method: 'DELETE'
    });
  },
  adminDeleteMerchant(id) {
    return request(`/admin/merchants/${id}`, {
      method: 'DELETE'
    });
  },
  adminDeleteRider(id) {
    return request(`/admin/riders/${id}`, {
      method: 'DELETE'
    });
  },
  adminUnfreezeUser(id) {
    return request(`/admin/users/${id}/unfreeze`, {
      method: 'PUT'
    });
  },
  adminUnfreezeMerchant(id) {
    return request(`/admin/merchants/${id}/unfreeze`, {
      method: 'PUT'
    });
  },
  adminUnfreezeRider(id) {
    return request(`/admin/riders/${id}/unfreeze`, {
      method: 'PUT'
    });
  }
};
