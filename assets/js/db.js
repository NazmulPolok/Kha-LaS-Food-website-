/* FastAPI + PostgreSQL data adapter. Keep this API compatible with FH.db. */
(function () {
  let readyPromise = null;
  let pollTimer = null;

  const request = async (path, options = {}) => {
    const token = localStorage.getItem('foodhub_access_token_v1');
    const response = await fetch(`/api${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) }
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.detail || `API request failed (${response.status})`);
    }
    return response.status === 204 ? null : response.json();
  };

  function rowToSpot(row) {
    return {
      id: row.id,
      name: row.name,
      lat: Number(row.lat),
      lng: Number(row.lng),
      food: Array.isArray(row.cuisines) ? row.cuisines : [],
      type: row.type || 'Food Cart',
      rating: Number(row.rating) || 0,
      reviews: Number(row.review_count) || 0,
      price: row.price || '৳',
      token: 0,
      delivery: row.delivery || 'none',
      status: row.status === 'closed' ? 'closed' : 'open',
      phone: row.phone || '',
      about: row.description || '',
      photos: Array.isArray(row.photos) ? row.photos : [],
      creator: row.is_mine ? ((FH.auth.getUser() || {}).email || 'member') : (row.has_vendor ? 'member' : 'system'),
      hasBooking: Boolean(row.has_booking),
      address: row.address || '',
      hygiene: row.hygiene_rating == null ? undefined : Number(row.hygiene_rating),
      createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
      statusUpdatedAt: row.updated_at ? new Date(row.updated_at).getTime() : undefined,
      remote: true
    };
  }

  function spotToRow(spot) {
    return {
      id: String(spot.id),
      name: spot.name || 'Unnamed cart',
      description: spot.about || '',
      type: spot.type || 'Food Cart',
      cuisines: Array.isArray(spot.food) ? spot.food : [],
      lat: Number(spot.lat),
      lng: Number(spot.lng),
      address: spot.address || '',
      phone: spot.phone || '',
      price: spot.price || '৳',
      photos: Array.isArray(spot.photos) ? spot.photos : [],
      status: spot.status === 'closed' ? 'closed' : 'open',
      rating: Number(spot.rating) || 0,
      review_count: Number(spot.reviews) || 0,
      hygiene_rating: spot.hygiene == null ? null : Number(spot.hygiene),
      delivery: spot.delivery || 'none',
      has_booking: Boolean(spot.hasBooking)
    };
  }

  function rowToReview(row) {
    return {
      id: String(row.id),
      cartId: row.cart_id,
      authorName: row.author_name || 'Anonymous Foodie',
      overall: Number(row.overall),
      hygiene: Number(row.hygiene),
      comment: row.comment || '',
      createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
      remote: true
    };
  }

  function reviewToRow(review, cartId) {
    return {
      cart_id: cartId,
      author_name: review.authorName || 'Anonymous Foodie',
      overall: Number(review.overall),
      hygiene: Number(review.hygiene),
      comment: review.comment || ''
    };
  }

  FH.db = {
    configured: true,
    enabled: false,
    client: null,

    init() {
      if (readyPromise) return readyPromise;
      readyPromise = this.listCarts().then(rows => {
        this.enabled = true;
        const cachedCarts = FH.store.S.spots.slice();
        if (rows.length) FH.store.mergeRemote(rows.map(rowToSpot));
        const imported = localStorage.getItem('foodhub_postgres_cart_import_v1');
        const user = FH.auth.getUser();
        if (!imported && user && FH.auth.getToken()) {
          const persistedIds = new Set(rows.map(row => String(row.id)));
          return Promise.all(cachedCarts
            .filter(spot => spot.creator === user.email && !persistedIds.has(String(spot.id)))
            .map(spot => this.saveCart(spot)))
            .then(() => {
              localStorage.setItem('foodhub_postgres_cart_import_v1', 'done');
              return rows;
            });
        }
        return rows;
      }).then(rows => {
        console.info(`[FH.db] Loaded ${rows.length} cart(s) from FastAPI/PostgreSQL.`);
        if (!pollTimer) {
          pollTimer = setInterval(() => {
            this.listCarts().then(latest => FH.store.mergeRemote(latest.map(rowToSpot)))
              .catch(err => console.warn('[FH.db] Could not refresh carts:', err));
          }, 10000);
        }
        return true;
      }).catch(err => {
        this.enabled = false;
        console.warn('[FH.db] FastAPI/PostgreSQL is unavailable:', err);
        FH.toast('Backend is unavailable. Showing locally saved demo data.');
        return false;
      });
      return readyPromise;
    },

    async listCarts() {
      return request('/carts');
    },

    async authenticate(mode, email, password, name) {
      return request(`/auth/${mode}`, { method: 'POST', body: JSON.stringify({ email, password, name: name || '' }) });
    },

    async saveCart(spot) {
      if (!spot) return null;
      return request(`/carts/${encodeURIComponent(spot.id)}`, {
        method: 'PUT', body: JSON.stringify(spotToRow(spot))
      });
    },

    async deleteCart(id) {
      return request(`/carts/${encodeURIComponent(id)}`, { method: 'DELETE' });
    },

    async updateStatus(spot, status) {
      await this.saveCart({ ...spot, status: status === 'closed' ? 'closed' : 'open' });
      return true;
    },

    async listReviews(cartId) {
      return request(`/carts/${encodeURIComponent(cartId)}/reviews`);
    },

    async addReview(cartId, review) {
      const row = await request(`/carts/${encodeURIComponent(cartId)}/reviews`, {
        method: 'POST', body: JSON.stringify(reviewToRow(review, cartId))
      });
      return row ? rowToReview(row) : null;
    },

    async saveSummary(spot) {
      if (!spot) return false;
      await this.saveCart(spot);
      return true;
    },

    _rowToSpot: rowToSpot,
    _spotToRow: spotToRow
  };
})();
