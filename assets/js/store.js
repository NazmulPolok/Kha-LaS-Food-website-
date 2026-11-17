window.FH = window.FH || {};
FH.CATS = {
  food: ['Kabab','Biryani','Kacchi','Fast Food','Deshi','Indian','Thai','Chinese','Turkish','Malay','Arabic'],
  types: ['Indoor','Outdoor','Rooftop','Street Food','Food Cart','Buffet','Fine Dining','Cafe']
};
FH.NO_BOOKING = ['Street Food','Food Cart'];
FH.scoreColor = r => r >= 9 ? '#059669' : r >= 7.5 ? '#84cc16' : r >= 5.5 ? '#eab308' : '#dc2626';
FH.VERIFIED_THRESHOLD = 25; // Minimum 25 confirmations required to be Community Verified (no upper limit)

FH.closeModal = () => {
  const m = document.querySelector('#modal');
  if (!m) return;
  m.classList.add('hidden');
  m.classList.remove('flex');
  m.innerHTML = '';
};

const P = (id,name,lat,lng,food,type,rating,reviews,price,token,delivery,status,phone,about,confirmations = [],creator = 'system',photos = [],hasBooking = false) => ({
  id,name,lat,lng,food,type,rating,reviews,price,token,delivery,status,phone,about,
  confirmations,
  creator,
  photos,
  hasBooking,
  foodpanda:'https://www.foodpanda.com.bd/', pathao:'https://pathao.com/bn/food/'
});

// Helper to generate seed confirmations
const genConfirms = (count, prefix) => Array.from({ length: count }, (_, i) => `${prefix}${i + 1}@gmail.com`);

FH.SEED = [
  P('s1','Old Dhaka Kacchi House',23.7190,90.4100,['Kacchi','Biryani'],'Indoor',9.2,1240,'৳৳',150,'both','open','+8801700000001','Slow-cooked kacchi served in clay pots with tender mutton, potatoes, and boiled egg. Borhani is included with every full platter.', genConfirms(94, 'foodie'), 'system', [
    'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80'
  ], true),
  P('s2','Skyline Rooftop Grill',23.7930,90.4140,['Kabab','Arabic'],'Rooftop',8.4,310,'৳৳৳৳',500,'vendor','open','+8801700000002','Charcoal grills with panoramic 360-degree views over Gulshan lake. Live acoustic music on weekends.', genConfirms(45, 'rooftop'), 'system', [
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&auto=format&fit=crop&q=80'
  ], true),
  P('s3','Lakeside Fuchka Cart',23.7460,90.3760,['Deshi'],'Food Cart',8.9,860,'৳',0,'none','open','','Crispy fuchka shells stuffed with spicy chotpoti, grated hard-boiled egg, and served with four custom tamarind dips by Dhanmondi lake.', genConfirms(52, 'fuchka'), 'system', [
    'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80'
  ], false),
  P('s4','Banani Thai Garden',23.7935,90.4025,['Thai'],'Outdoor',7.8,190,'৳৳৳',300,'aggregator','busy','','Peaceful outdoor garden seating surrounded by lush bamboo and tropical trees. Renowned for spicy tom yum and pad thai.', genConfirms(19, 'thai'), 'system', [
    'https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1547496502-affa22d38842?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1552611052-33e04de081de?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1562967914-608f82629710?w=800&auto=format&fit=crop&q=80'
  ], true),
  P('s5','Mohammadpur Kabab Hub',23.7580,90.3600,['Kabab','Turkish'],'Indoor',7.1,402,'৳৳',200,'both','open','+8801700000005','Authentic seekh, shami, boti kababs and hot butter-brushed tandoor naan straight out of the clay oven.', genConfirms(24, 'kabab'), 'system', [
    'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80'
  ], true),
  P('s6','Dragon Wok Uttara',23.8740,90.3990,['Chinese','Malay'],'Buffet',6.4,145,'৳৳',250,'aggregator','open','','Grand Asian lunch and dinner buffet featuring over 30 dishes including wok noodles, dim sum, crispy prawns, and satay.', genConfirms(7, 'wok'), 'system', [
    'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=800&auto=format&fit=crop&q=80'
  ], true),
  P('s7','Tejgaon Street Burger',23.7650,90.3920,['Fast Food'],'Street Food',5.0,77,'৳',0,'none','closed','+8801700000007','Roadside late-night smash burgers with double beef patties, melted cheese, and signature spicy garlic sauce.', genConfirms(3, 'burger'), 'system', [
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop&q=80'
  ], false),
  P('s8','Cafe Mehfil Dhanmondi',23.7390,90.3750,['Indian','Deshi'],'Cafe',9.4,530,'৳৳৳',200,'aggregator','open','','A serene heritage courtyard with vintage lamps, serving Kolkata-style clay cup chai, kebabs, and handcrafted desserts.', genConfirms(68, 'mehfil'), 'system', [
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&auto=format&fit=crop&q=80'
  ], true),
  P('s9','Maple Fine Dining',23.7810,90.4170,['Arabic','Indian'],'Fine Dining',9.0,88,'৳৳৳৳',1000,'none','open','','Michelin-inspired multi-course tasting menus showcasing royal Mughal and Arabic delicacies in an opulent candlelight ambiance.', genConfirms(28, 'maple'), 'system', [
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&auto=format&fit=crop&q=80'
  ], true)
];

(function () {
  const STORAGE_SPOTS_KEY = 'foodhub_spots_data_v5';
  const L = new Set(), now = Date.now();

  function loadSavedSpots() {
    try {
      const raw = localStorage.getItem(STORAGE_SPOTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      }
      // Migrate from v4 or v3
      const prevRaw = localStorage.getItem('foodhub_spots_data_v4') || localStorage.getItem('foodhub_spots_data_v3');
      if (prevRaw) {
        const prevParsed = JSON.parse(prevRaw);
        if (Array.isArray(prevParsed)) {
          const userSpots = prevParsed.filter(s => s.id && s.id.startsWith('user_spot_')).map(s => ({
            ...s,
            hasBooking: Boolean(s.hasBooking),
            delivery: s.delivery || 'none'
          }));
          const seedWithPhotos = FH.SEED.map(s => {
            const existing = prevParsed.find(x => x.id === s.id);
            return {
              ...s,
              confirmations: existing && existing.confirmations ? existing.confirmations : [...s.confirmations],
              photos: [...s.photos]
            };
          });
          return [...userSpots, ...seedWithPhotos];
        }
      }
    } catch (e) {
      console.warn('Could not load spots from localStorage', e);
    }
    return FH.SEED.map(s => ({ ...s, confirmations: [...s.confirmations], photos: [...s.photos] }));
  }

  const S = {
    spots: loadSavedSpots(),
    f: { q: '', food: [], type: '', min: 1, delivery: false, booking: false, verified: false },
    sel: null, bookings: [],
    chat: {
      s1: [{ u: 'Foodie#412', t: 'Queue is about 15 min. Kacchi just came out hot.', ts: now - 300000 }],
      s2: [{ u: 'Foodie#207', t: 'Rooftop is packed after 8pm.', ts: now - 900000 }]
    }
  };

  FH.store = {
    S,
    save() {
      try {
        localStorage.setItem(STORAGE_SPOTS_KEY, JSON.stringify(S.spots));
      } catch (e) {
        console.warn('Failed to save spots to localStorage', e);
      }
    },
    on(fn) { L.add(fn); },
    emit() { L.forEach(f => f()); },
    get(id) { return S.spots.find(s => s.id === id); },
    filtered() {
      const f = S.f, q = f.q.trim().toLowerCase();
      return S.spots.filter(s =>
        (!q || (s.name + ' ' + s.food.join(' ') + ' ' + s.type).toLowerCase().includes(q)) &&
        (!f.food.length || f.food.some(x => s.food.includes(x))) &&
        (!f.type || s.type === f.type) && s.rating >= f.min &&
        (!f.delivery || (s.delivery && s.delivery !== 'none')) &&
        (!f.booking || s.hasBooking === true) &&
        (!f.verified || ((s.confirmations && s.confirmations.length >= FH.VERIFIED_THRESHOLD))));
    },
    select(id) { S.sel = id; this.emit(); },
    setFilter(p) { Object.assign(S.f, p); this.emit(); },
    addReview(id, score) {
      const s = this.get(id);
      if (!s) return;
      s.rating = Math.round((s.rating * s.reviews + score) / (s.reviews + 1) * 10) / 10;
      s.reviews++;
      this.save();
      this.emit();
    },
    addChat(id, m) { (S.chat[id] = S.chat[id] || []).push(m); this.emit(); },
    addBooking(b) { S.bookings.push(b); },
    addSpot(spot) {
      S.spots.unshift(spot);
      this.save();
      this.select(spot.id);
      this.emit();
      if (FH.db && FH.db.enabled) {
        FH.db.saveCart(spot).catch(err => {
          console.warn('[FH.store] Could not save cart:', err);
          FH.toast('Cart saved on this device. It could not reach the backend.');
        });
      }
    },
    setStatus(id, status, by) {
      const s = this.get(id);
      if (!s) return false;
      s.status = status === 'closed' ? 'closed' : 'open';
      s.statusUpdatedAt = Date.now();
      if (by) s.statusUpdatedBy = by;
      this.save();
      this.emit();
      return true;
    },
    /**
     * Merge carts fetched from FastAPI (initial load + periodic refresh).
     * Local-only fields (confirmations/photos) are protected when the remote
     * row has not populated them yet.
     */
    mergeRemote(list) {
      if (!Array.isArray(list) || !list.length) return;
      const byId = new Map(S.spots.map(s => [s.id, s]));

      list.forEach(remote => {
        if (!remote || !remote.id) return;
        const existing = byId.get(remote.id);

        if (existing) {
          const localPhotos = existing.photos;
          const localFood = existing.food;
          const localConfirmations = existing.confirmations;

          Object.assign(existing, remote);

          if ((!remote.photos || !remote.photos.length) && Array.isArray(localPhotos) && localPhotos.length) {
            existing.photos = localPhotos;
          }
          if ((!remote.food || !remote.food.length) && Array.isArray(localFood) && localFood.length) {
            existing.food = localFood;
          }
          existing.confirmations = Array.isArray(localConfirmations) ? localConfirmations : [];
        } else {
          remote.confirmations = remote.confirmations || [];
          S.spots.unshift(remote);
          byId.set(remote.id, remote);
        }
      });

      this.save();
      this.emit();
    },
    updateSpot(id, updatedData) {
      const s = this.get(id);
      if (!s) return false;
      Object.assign(s, updatedData);
      this.save();
      this.select(id);
      this.emit();
      if (FH.db && FH.db.enabled) {
        FH.db.saveCart(s).catch(err => {
          console.warn('[FH.store] Could not update cart:', err);
          FH.toast('Cart changes are saved on this device but did not reach the backend.');
        });
      }
      return true;
    },
    deleteSpot(id) {
      const idx = S.spots.findIndex(s => s.id === id);
      if (idx === -1) return false;
      S.spots.splice(idx, 1);
      if (S.sel === id) S.sel = null;
      this.save();
      this.emit();
      if (FH.db && FH.db.enabled) {
        FH.db.deleteCart(id).catch(err => {
          console.warn('[FH.store] Could not delete cart:', err);
          FH.toast('Cart was removed on this device but not from the backend.');
        });
      }
      return true;
    },
    getUserSpots(email) {
      if (!email) return [];
      return S.spots.filter(s => s.creator === email);
    },
    confirmSpot(id, email) {
      const s = this.get(id);
      if (!s || !email) return false;
      s.confirmations = s.confirmations || [];
      if (!s.confirmations.includes(email)) {
        s.confirmations.push(email);
        this.save();
        this.emit();
        return true;
      }
      return false;
    },
    unconfirmSpot(id, email) {
      const s = this.get(id);
      if (!s || !email || !s.confirmations) return false;
      const idx = s.confirmations.indexOf(email);
      if (idx !== -1) {
        s.confirmations.splice(idx, 1);
        this.save();
        this.emit();
        return true;
      }
      return false;
    },
    isConfirmedByUser(id, email) {
      const s = this.get(id);
      return Boolean(s && s.confirmations && email && s.confirmations.includes(email));
    },
    addPhoto(id, photoUrl) {
      const s = this.get(id);
      if (!s || !photoUrl) return false;
      s.photos = s.photos || [];
      if (s.photos.length >= 8) {
        FH.toast('Maximum 8 photos allowed per spot.');
        return false;
      }
      s.photos.push(photoUrl);
      this.save();
      this.emit();
      if (FH.db && FH.db.enabled) {
        FH.db.saveCart(s).catch(err => {
          console.warn('[FH.store] Could not save cart photo:', err);
          FH.toast('Photo was added on this device but did not reach the backend.');
        });
      }
      return true;
    }
  };
})();
