/* ============================================================
   Supabase data layer
   ------------------------------------------------------------
   Loaded after store.js. If no credentials are configured, the
   app keeps working entirely from localStorage. When Supabase is
   configured it becomes the source of truth for carts + reviews.
   ============================================================ */
(function () {
  const cfg = window.FH_CONFIG || {};
  const SUPABASE_SDK = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';

  const url = String(cfg.SUPABASE_URL || '').trim();
  const key = String(cfg.SUPABASE_ANON_KEY || '').trim();
  const configured = /^https?:\/\//i.test(url) && url.length > 10 && key.length > 20 &&
    !url.includes('YOUR_PROJECT') && !key.includes('YOUR_');

  let client = null;
  let sdkPromise = null;
  let readyPromise = null;
  let channel = null;

  function loadSdk() {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      return Promise.resolve(window.supabase);
    }
    if (sdkPromise) return sdkPromise;
    sdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = SUPABASE_SDK;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        if (window.supabase && typeof window.supabase.createClient === 'function') resolve(window.supabase);
        else reject(new Error('Supabase SDK loaded but createClient() is unavailable.'));
      };
      script.onerror = () => reject(new Error('Could not load the Supabase SDK.'));
      document.head.appendChild(script);
    });
    return sdkPromise;
  }

  function rowToSpot(row) {
    return {
      id: row.id,
      name: row.name,
      lat: Number(row.lat),
      lng: Number(row.lng),
      food: Array.isArray(row.cuisines) ? row.cuisines : [],
      type: row.type || 'Food Cart',
      rating: row.rating == null ? 0 : Number(row.rating),
      reviews: row.review_count == null ? 0 : Number(row.review_count),
      price: row.price || '৳',
      token: 0,
      delivery: row.delivery || 'none',
      status: row.status === 'closed' ? 'closed' : 'open',
      phone: row.phone || '',
      about: row.description || '',
      photos: Array.isArray(row.photos) ? row.photos : [],
      creator: row.vendor_email || 'system',
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
      has_booking: Boolean(spot.hasBooking),
      vendor_email: spot.creator && spot.creator !== 'system' ? spot.creator : null,
      updated_at: new Date().toISOString()
    };
  }

  function rowToReview(row) {
    return {
      id: row.id,
      cartId: row.cart_id,
      authorEmail: row.author_email || '',
      authorName: row.author_name || row.author_email || 'Anonymous Foodie',
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
      author_email: review.authorEmail || null,
      author_name: review.authorName || 'Anonymous Foodie',
      overall: Number(review.overall),
      hygiene: Number(review.hygiene),
      comment: review.comment || ''
    };
  }

  FH.db = {
    configured,
    enabled: false,
    client: null,

    /** Loads the SDK, connects, subscribes to live status changes and merges remote carts. */
    init() {
      if (!configured) {
        console.info('[FH.db] Supabase is not configured — running in local demo mode.');
        return Promise.resolve(false);
      }
      if (readyPromise) return readyPromise;

      readyPromise = loadSdk()
        .then((sdk) => {
          client = sdk.createClient(url, key, {
            auth: { persistSession: false, autoRefreshToken: false }
          });
          this.client = client;
          this.enabled = true;
          this.subscribe();
          return this.listCarts();
        })
        .then((rows) => {
          if (Array.isArray(rows) && rows.length) {
            FH.store.mergeRemote(rows.map(rowToSpot));
            console.info(`[FH.db] Loaded ${rows.length} cart(s) from Supabase.`);
          }
          return true;
        })
        .catch((err) => {
          console.warn('[FH.db] Supabase connection failed:', err);
          if (typeof FH.toast === 'function') {
            FH.toast('Supabase is configured but could not be reached. Saved locally for now.');
          }
          return false;
        });

      return readyPromise;
    },

    async listCarts() {
      if (!client) return [];
      const { data, error } = await client
        .from('carts')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },

    /** Creates or updates a cart. Seed carts are upserted on first write. */
    async saveCart(spot) {
      if (!client || !spot) return null;
      const { data, error } = await client
        .from('carts')
        .upsert(spotToRow(spot), { onConflict: 'id' })
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },

    async updateStatus(spot, status) {
      if (!client || !spot) return false;
      await this.saveCart({ ...spot, status: status === 'closed' ? 'closed' : 'open' });
      return true;
    },

    async listReviews(cartId) {
      if (!client || !cartId) return [];
      const { data, error } = await client
        .from('reviews')
        .select('*')
        .eq('cart_id', cartId)
        .order('created_at', { ascending: false })
        .limit(60);
      if (error) throw error;
      return (data || []).map(rowToReview);
    },

    async addReview(cartId, review) {
      if (!client) return null;
      const { data, error } = await client
        .from('reviews')
        .insert(reviewToRow(review, cartId))
        .select()
        .maybeSingle();
      if (error) throw error;
      return data ? rowToReview(data) : null;
    },

    /** Persists aggregate rating + hygiene so other devices see the same summary. */
    async saveSummary(spot) {
      if (!client || !spot) return false;
      try {
        const patch = {
          ...spot,
          hygiene_rating: spot.hygiene == null ? null : Number(spot.hygiene),
          review_count: Number(spot.reviews) || 0,
          rating: Number(spot.rating) || 0
        };
        await this.saveCart(patch);
        return true;
      } catch (err) {
        console.warn('[FH.db] Could not save review summary:', err);
        return false;
      }
    },

    /** Realtime: keep status and vendor edits in sync across devices. */
    subscribe() {
      if (!client || channel) return;
      try {
        channel = client
          .channel('khalas-carts-live')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'carts' }, (payload) => {
            if (payload && payload.new && payload.new.id) {
              FH.store.mergeRemote([rowToSpot(payload.new)]);
            }
          })
          .subscribe((status) => {
            if (status === 'CHANNEL_ERROR') {
              console.warn('[FH.db] Realtime channel unavailable. Live status still works on this device.');
            }
          });
      } catch (err) {
        console.warn('[FH.db] Realtime setup failed:', err);
      }
    },

    /* Exposed for debugging / future features */
    _rowToSpot: rowToSpot,
    _spotToRow: spotToRow
  };
})();
