/**
 * খাLaS — 24-Hour Free Ad Wall & Private Admin Queue Moderation System
 * Multi-block Bento Grid, Capacity Enforcement, Auto-Expiry, & FIFO Queue Engine
 */
(function () {
  window.FH = window.FH || {};

  // Capacity Limits per Block Size
  const LIMITS = {
    '2x2': 2,   // Hero Mega (Max 2)
    '2x1': 6,   // Wide Banner (Max 6)
    '1x2': 4,   // Tall Poster (Max 4)
    '1x1': 16   // Square Card (Max 16)
  };
  const TOTAL_CAPACITY = 28;

  const STORAGE_KEYS = {
    LIVE: 'khalas_ads_live',
    QUEUE: 'khalas_ads_queue',
    PENDING: 'khalas_ads_pending',
    AUTO_APPROVE: 'khalas_ads_auto_approve',
    SEEDED: 'khalas_ads_seeded_v2'
  };

  const PRESETS = [
    { id: 'fire', name: 'Fire Discount', icon: 'fa-fire', desc: 'Fiery red & charcoal embers', sampleBg: 'from-red-600 to-amber-600' },
    { id: 'gold', name: 'Royal Biryani Gold', icon: 'fa-crown', desc: 'Regal obsidian black & gold foil', sampleBg: 'from-amber-500 to-yellow-300' },
    { id: 'neon', name: 'Midnight Street Neon', icon: 'fa-bolt', desc: 'Dhaka nightlife cyber cyan & violet', sampleBg: 'from-purple-600 to-cyan-400' },
    { id: 'emerald', name: 'Fresh Combo Emerald', icon: 'fa-leaf', desc: 'Lush dark jade & fresh mint', sampleBg: 'from-emerald-500 to-teal-400' },
    { id: 'crimson', name: 'Grand Opening Crimson', icon: 'fa-sparkles', desc: 'Ruby crimson & festive sparkle', sampleBg: 'from-rose-600 to-pink-500' },
    { id: 'deshi', name: 'Deshi Cart Classic', icon: 'fa-bowl-rice', desc: 'Dhaka street terracotta & mustard', sampleBg: 'from-amber-600 to-orange-500' }
  ];

  const CATEGORIES = [
    'Discount / % Off',
    'Combo / Platter',
    'Grand Opening',
    'Late Night / Street Food'
  ];

  // State
  let liveAds = [];
  let queuedAds = [];
  let pendingAds = [];
  let autoApproveSetting = false; // Default: Manual Approval Required
  let activeFilter = 'All';
  let activeAdminTab = 'pending';
  let countdownInterval = null;

  // Helper: Format Countdown
  function formatCountdown(ms) {
    if (ms <= 0) return '00:00:00';
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  // Load from Storage
  function loadState() {
    try {
      liveAds = JSON.parse(localStorage.getItem(STORAGE_KEYS.LIVE) || '[]');
      queuedAds = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUEUE) || '[]');
      pendingAds = JSON.parse(localStorage.getItem(STORAGE_KEYS.PENDING) || '[]');
      autoApproveSetting = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUTO_APPROVE) || 'false');
    } catch (e) {
      console.error('Error loading ads from localStorage', e);
      liveAds = []; queuedAds = []; pendingAds = []; autoApproveSetting = false;
    }

    if (!localStorage.getItem(STORAGE_KEYS.SEEDED) || liveAds.length === 0) {
      seedInitialData();
    }
  }

  // Save to Storage
  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEYS.LIVE, JSON.stringify(liveAds));
      localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(queuedAds));
      localStorage.setItem(STORAGE_KEYS.PENDING, JSON.stringify(pendingAds));
      localStorage.setItem(STORAGE_KEYS.AUTO_APPROVE, JSON.stringify(autoApproveSetting));
    } catch (e) {
      console.error('Error saving ads to localStorage', e);
    }
  }

  // Initial Seed Data
  function seedInitialData() {
    const now = Date.now();
    const h = 3600 * 1000;

    // 2x2 Hero Mega (2 Live, 1 Queued)
    liveAds = [
      {
        id: 'ad-seed-2x2-1',
        spotId: 's1',
        spotName: 'Old Dhaka Kacchi House',
        spotArea: 'Nazira Bazar, Old Dhaka',
        blockSize: '2x2',
        category: 'Combo / Platter',
        preset: 'gold',
        headline: 'Royal Kacchi Platter with Clay Pot Borhani',
        subtext: 'Get 40% OFF on our slow-cooked mutton kacchi feast platter with double potatoes and 2 complimentary clay-cup chilled borhanis.',
        highlightTag: '40% OFF',
        promoCode: 'ROYAL40',
        status: 'LIVE',
        submittedAt: now - 5 * h,
        approvedAt: now - 5 * h,
        expiresAt: now + 19 * h
      },
      {
        id: 'ad-seed-2x2-2',
        spotId: 's2',
        spotName: 'Skyline Rooftop Grill',
        spotArea: 'Gulshan 2 Lakeview, Dhaka',
        blockSize: '2x2',
        category: 'Late Night / Street Food',
        preset: 'neon',
        headline: 'Midnight Charcoal BBQ & Acoustic Lounge',
        subtext: 'Panoramic 360° Gulshan lake night views! Unlimited spiced grilled chicken wings and live charcoal kebab grills till 2:00 AM.',
        highlightTag: 'MIDNIGHT BBQ',
        promoCode: 'SKYLINE24',
        status: 'LIVE',
        submittedAt: now - 3 * h,
        approvedAt: now - 3 * h,
        expiresAt: now + 21 * h
      },

      // 2x1 Wide Banner (5 Live, 1 Queued)
      {
        id: 'ad-seed-2x1-1',
        spotId: 's3',
        spotName: 'Lakeside Fuchka Cart',
        spotArea: 'Dhanmondi Lake Walkway',
        blockSize: '2x1',
        category: 'Late Night / Street Food',
        preset: 'deshi',
        headline: 'Unlimited Spicy Tetul Fuchka Refills',
        subtext: '4 custom tamarind dips with grated boiled egg. Free refills on spicy tok!',
        highlightTag: '৳99 ONLY',
        promoCode: 'FUCHKA99',
        status: 'LIVE',
        submittedAt: now - 8 * h,
        approvedAt: now - 8 * h,
        expiresAt: now + 16 * h
      },
      {
        id: 'ad-seed-2x1-2',
        spotId: 's4',
        spotName: 'Banani Thai Garden',
        spotArea: 'Road 11, Banani',
        blockSize: '2x1',
        category: 'Discount / % Off',
        preset: 'emerald',
        headline: 'Buy 1 Get 1 Spicy Tom Yum Soup Bowl',
        subtext: 'Authentic Thai lemongrass, jumbo prawns, and fresh lime chili broth.',
        highlightTag: 'BOGO FREE',
        promoCode: 'TOMYUM',
        status: 'LIVE',
        submittedAt: now - 11 * h,
        approvedAt: now - 11 * h,
        expiresAt: now + 13 * h
      },
      {
        id: 'ad-seed-2x1-3',
        spotId: 's5',
        spotName: 'Mohammadpur Kabab Hub',
        spotArea: 'Town Hall Market, Mohammadpur',
        blockSize: '2x1',
        category: 'Discount / % Off',
        preset: 'fire',
        headline: 'Hot Butter Naan + Seekh Kabab Combo',
        subtext: 'Fresh clay tandoor naan with succulent beef seekh and mint yogurt raita.',
        highlightTag: '25% OFF',
        promoCode: 'KABAB25',
        status: 'LIVE',
        submittedAt: now - 14 * h,
        approvedAt: now - 14 * h,
        expiresAt: now + 10 * h
      },
      {
        id: 'ad-seed-2x1-4',
        spotId: null,
        spotName: 'Dhanmondi Waffle Cart',
        spotArea: 'Dhanmondi 27, Dhaka',
        blockSize: '2x1',
        category: 'Combo / Platter',
        preset: 'crimson',
        headline: 'Belgian Chocolate & Nutella Waffle Blast',
        subtext: 'Double Nutella drizzle with toasted hazelnuts and vanilla ice cream scoop.',
        highlightTag: 'COMBO ৳199',
        promoCode: 'WAFFLE24',
        status: 'LIVE',
        submittedAt: now - 16 * h,
        approvedAt: now - 16 * h,
        expiresAt: now + 8 * h
      },
      {
        id: 'ad-seed-2x1-5',
        spotId: null,
        spotName: 'Bailey Road Khichuri Corner',
        spotArea: 'Bailey Road, Dhaka',
        blockSize: '2x1',
        category: 'Late Night / Street Food',
        preset: 'gold',
        headline: 'Piping Hot Beef Bhuna Khichuri Platter',
        subtext: 'Ghee-tossed fragrant bhuna khichuri with spicy beef chunk and fried eggplant.',
        highlightTag: 'STREET HIT',
        promoCode: 'KHICHURI',
        status: 'LIVE',
        submittedAt: now - 2 * h,
        approvedAt: now - 2 * h,
        expiresAt: now + 22 * h
      },

      // 1x2 Tall Poster (3 Live, 1 Queued)
      {
        id: 'ad-seed-1x2-1',
        spotId: null,
        spotName: 'Bakarkhani Heritage',
        spotArea: 'Lalbagh, Old Dhaka',
        blockSize: '1x2',
        category: 'Late Night / Street Food',
        preset: 'deshi',
        headline: 'Authentic Crispy Ghee Bakarkhani',
        subtext: 'Handcrafted old dhaka layered flaky pastry served warm with sweetened malai tea.',
        highlightTag: 'HERITAGE',
        promoCode: 'BAKAR',
        status: 'LIVE',
        submittedAt: now - 7 * h,
        approvedAt: now - 7 * h,
        expiresAt: now + 17 * h
      },
      {
        id: 'ad-seed-1x2-2',
        spotId: null,
        spotName: 'Mirpur Matka Chai',
        spotArea: 'Mirpur 10 Circle',
        blockSize: '1x2',
        category: 'Late Night / Street Food',
        preset: 'fire',
        headline: 'Smoky Clay-Cup Tandoori Cha',
        subtext: 'Flavored with cardamom, saffron, and slow-boiled creamy cow milk.',
        highlightTag: '৳25 ONLY',
        promoCode: null,
        status: 'LIVE',
        submittedAt: now - 12 * h,
        approvedAt: now - 12 * h,
        expiresAt: now + 12 * h
      },
      {
        id: 'ad-seed-1x2-3',
        spotId: null,
        spotName: 'Khilgaon Pizza Cart',
        spotArea: 'Taltola, Khilgaon',
        blockSize: '1x2',
        category: 'Discount / % Off',
        preset: 'crimson',
        headline: 'Artisan Wood-Fired Slice Rush',
        subtext: 'Double pepperoni and mozzarella cheese pull with garlic dip.',
        highlightTag: '30% OFF',
        promoCode: 'PIZZAFUN',
        status: 'LIVE',
        submittedAt: now - 18 * h,
        approvedAt: now - 18 * h,
        expiresAt: now + 6 * h
      },

      // 1x1 Square Card (12 Live, 3 Queued)
      {
        id: 'ad-seed-1x1-1', spotId: 's1', spotName: 'Old Dhaka Kacchi', spotArea: 'Old Dhaka',
        blockSize: '1x1', category: 'Combo / Platter', preset: 'gold',
        headline: 'Extra Mutton Boti Addon', subtext: 'Add extra spicy mutton pieces for ৳99',
        highlightTag: 'ADDON ৳99', promoCode: null, status: 'LIVE',
        submittedAt: now - 4 * h, approvedAt: now - 4 * h, expiresAt: now + 20 * h
      },
      {
        id: 'ad-seed-1x1-2', spotId: 's3', spotName: 'Lakeside Fuchka', spotArea: 'Dhanmondi',
        blockSize: '1x1', category: 'Late Night / Street Food', preset: 'deshi',
        headline: 'Special Doi Fuchka Plate', subtext: 'Sweet curd, tamarind, and chili crunch',
        highlightTag: 'TOP RATED', promoCode: 'DOI10', status: 'LIVE',
        submittedAt: now - 9 * h, approvedAt: now - 9 * h, expiresAt: now + 15 * h
      },
      {
        id: 'ad-seed-1x1-3', spotId: null, spotName: 'Uttara Burger Hub', spotArea: 'Sector 3, Uttara',
        blockSize: '1x1', category: 'Discount / % Off', preset: 'fire',
        headline: 'Smash Beef Cheeseburger', subtext: 'Double beef patty with secret sauce',
        highlightTag: '20% OFF', promoCode: 'SMASH20', status: 'LIVE',
        submittedAt: now - 6 * h, approvedAt: now - 6 * h, expiresAt: now + 18 * h
      },
      {
        id: 'ad-seed-1x1-4', spotId: null, spotName: 'Gulshan Shawarma', spotArea: 'Gulshan 1',
        blockSize: '1x1', category: 'Late Night / Street Food', preset: 'neon',
        headline: 'Jumbo Chicken Shawarma', subtext: 'Pickles and authentic Lebanese garlic toum',
        highlightTag: 'BOGO', promoCode: 'TOUM', status: 'LIVE',
        submittedAt: now - 15 * h, approvedAt: now - 15 * h, expiresAt: now + 9 * h
      },
      {
        id: 'ad-seed-1x1-5', spotId: null, spotName: 'Dhaka Momos Cart', spotArea: 'Banani',
        blockSize: '1x1', category: 'Combo / Platter', preset: 'emerald',
        headline: 'Steamed Darjeeling Momos', subtext: 'Fiery chili dip & clear vegetable broth',
        highlightTag: '12 PCS ৳150', promoCode: null, status: 'LIVE',
        submittedAt: now - 10 * h, approvedAt: now - 10 * h, expiresAt: now + 14 * h
      },
      {
        id: 'ad-seed-1x1-6', spotId: null, spotName: 'Bashundhara Dosa Point', spotArea: 'Gate 2, Bashundhara',
        blockSize: '1x1', category: 'Grand Opening', preset: 'deshi',
        headline: 'Crispy Butter Masala Dosa', subtext: 'Coconut chutney and spicy piping sambar',
        highlightTag: 'NEW OPENING', promoCode: 'DOSA', status: 'LIVE',
        submittedAt: now - 1 * h, approvedAt: now - 1 * h, expiresAt: now + 23 * h
      },
      {
        id: 'ad-seed-1x1-7', spotId: null, spotName: 'Baily Shingara Stall', spotArea: 'Bailey Road',
        blockSize: '1x1', category: 'Late Night / Street Food', preset: 'fire',
        headline: 'Kolija Shingara Trio', subtext: 'Crispy crust filled with spiced liver and potato',
        highlightTag: '৳30 ONLY', promoCode: null, status: 'LIVE',
        submittedAt: now - 13 * h, approvedAt: now - 13 * h, expiresAt: now + 11 * h
      },
      {
        id: 'ad-seed-1x1-8', spotId: null, spotName: 'Jatra Chotpoti Corner', spotArea: 'Shahbagh',
        blockSize: '1x1', category: 'Late Night / Street Food', preset: 'crimson',
        headline: 'Special Spicy Chotpoti', subtext: 'Extra egg & green chili crunch topping',
        highlightTag: 'CHILI BLAST', promoCode: null, status: 'LIVE',
        submittedAt: now - 17 * h, approvedAt: now - 17 * h, expiresAt: now + 7 * h
      },
      {
        id: 'ad-seed-1x1-9', spotId: null, spotName: 'Mohakhali Faluda Bar', spotArea: 'Wireless Gate',
        blockSize: '1x1', category: 'Combo / Platter', preset: 'emerald',
        headline: 'Royal Kulfi Shahi Faluda', subtext: 'Topped with rabri, jelly, and dry fruits',
        highlightTag: '৳120 ONLY', promoCode: 'FALUDA', status: 'LIVE',
        submittedAt: now - 8 * h, approvedAt: now - 8 * h, expiresAt: now + 16 * h
      },
      {
        id: 'ad-seed-1x1-10', spotId: null, spotName: 'Rampura Halim Ghar', spotArea: 'BTV Road, Rampura',
        blockSize: '1x1', category: 'Late Night / Street Food', preset: 'gold',
        headline: 'Mutton Shahi Haleem Bowl', subtext: 'Slow-simmered lentils and shredded meat',
        highlightTag: 'WINTER HIT', promoCode: 'HALEEM', status: 'LIVE',
        submittedAt: now - 19 * h, approvedAt: now - 19 * h, expiresAt: now + 5 * h
      },
      {
        id: 'ad-seed-1x1-11', spotId: null, spotName: 'Lalbagh Lassi Cart', spotArea: 'Lalbagh Fort',
        blockSize: '1x1', category: 'Discount / % Off', preset: 'deshi',
        headline: 'Thick Malai Sweet Lassi', subtext: 'Traditional earthen bowl thick sour curd',
        highlightTag: '15% OFF', promoCode: 'LASSI15', status: 'LIVE',
        submittedAt: now - 21 * h, approvedAt: now - 21 * h, expiresAt: now + 3 * h
      },
      {
        id: 'ad-seed-1x1-12', spotId: null, spotName: 'Panthapath Crepe Cart', spotArea: 'Panthapath',
        blockSize: '1x1', category: 'Grand Opening', preset: 'neon',
        headline: 'French Crepe with Berries', subtext: 'Fresh strawberries, dark chocolate swirl',
        highlightTag: 'NEW SPOT', promoCode: 'CREPE', status: 'LIVE',
        submittedAt: now - 22 * h, approvedAt: now - 22 * h, expiresAt: now + 2 * h
      }
    ];

    // Queued Ads (FIFO waiting for slots)
    queuedAds = [
      {
        id: 'ad-seed-q-2x2',
        spotId: 's5',
        spotName: 'Mohammadpur Kabab Hub',
        spotArea: 'Mohammadpur Town Hall',
        blockSize: '2x2',
        category: 'Combo / Platter',
        preset: 'fire',
        headline: 'Grand Charcoal Platter for Four',
        subtext: '4 mutton seekh, 4 reshmi boti, 4 garlic naans, salad, and soft drinks. Best grill deal in town!',
        highlightTag: 'MEGA COMBO',
        promoCode: 'HUB4',
        status: 'QUEUED',
        submittedAt: now - 2 * h,
        approvedAt: now - 2 * h,
        queuedAt: now - 2 * h,
        expiresAt: null
      },
      {
        id: 'ad-seed-q-2x1',
        spotId: null,
        spotName: 'Gulshan Shawarma Express',
        spotArea: 'Gulshan 2, Dhaka',
        blockSize: '2x1',
        category: 'Late Night / Street Food',
        preset: 'neon',
        headline: 'Lebanese Cheesy Shawarma Roll',
        subtext: 'Charcoal grilled chicken with mozzarella cheese pull and spicy garlic aioli dip.',
        highlightTag: 'BUY 1 GET 1',
        promoCode: 'SHAWARMA',
        status: 'QUEUED',
        submittedAt: now - 3 * h,
        approvedAt: now - 3 * h,
        queuedAt: now - 3 * h,
        expiresAt: null
      },
      {
        id: 'ad-seed-q-1x2',
        spotId: null,
        spotName: 'Uttara Monster Burgers',
        spotArea: 'Sector 7, Uttara',
        blockSize: '1x2',
        category: 'Discount / % Off',
        preset: 'emerald',
        headline: 'Triple Cheesy Smash Burger',
        subtext: 'Triple smashed beef patties, cheddar slices, caramelized onions and spicy jalapenos.',
        highlightTag: '30% OFF',
        promoCode: 'TRIPLE30',
        status: 'QUEUED',
        submittedAt: now - 4 * h,
        approvedAt: now - 4 * h,
        queuedAt: now - 4 * h,
        expiresAt: null
      },
      {
        id: 'ad-seed-q-1x1-1',
        spotId: null,
        spotName: 'Dhanmondi Ice Cream Cart',
        spotArea: 'Dhanmondi 8/A',
        blockSize: '1x1',
        category: 'Grand Opening',
        preset: 'crimson',
        headline: 'Rolled Ice Cream Rolls',
        subtext: 'Fresh fruit rolls on frozen grill plate',
        highlightTag: 'NEW',
        promoCode: 'ROLLS',
        status: 'QUEUED',
        submittedAt: now - 1 * h,
        approvedAt: now - 1 * h,
        queuedAt: now - 1 * h,
        expiresAt: null
      },
      {
        id: 'ad-seed-q-1x1-2',
        spotId: null,
        spotName: 'Banani Boba Cart',
        spotArea: 'Road 11, Banani',
        blockSize: '1x1',
        category: 'Discount / % Off',
        preset: 'neon',
        headline: 'Brown Sugar Milk Boba',
        subtext: 'Chewy warm tapioca pearls with fresh cream',
        highlightTag: '20% OFF',
        promoCode: 'BOBA20',
        status: 'QUEUED',
        submittedAt: now - 30 * 60 * 1000,
        approvedAt: now - 30 * 60 * 1000,
        queuedAt: now - 30 * 60 * 1000,
        expiresAt: null
      },
      {
        id: 'ad-seed-q-1x1-3',
        spotId: null,
        spotName: 'Tejgaon Egg Chop Stall',
        spotArea: 'Tejgaon Link Road',
        blockSize: '1x1',
        category: 'Late Night / Street Food',
        preset: 'deshi',
        headline: 'Crispy Dimer Chop Duo',
        subtext: 'Potato crust filled with spicy whole egg',
        highlightTag: '৳20 ONLY',
        promoCode: null,
        status: 'QUEUED',
        submittedAt: now - 15 * 60 * 1000,
        approvedAt: now - 15 * 60 * 1000,
        queuedAt: now - 15 * 60 * 1000,
        expiresAt: null
      }
    ];

    // Pending Approvals (Waiting for Admin Review)
    pendingAds = [
      {
        id: 'ad-seed-p-1',
        spotId: 's4',
        spotName: 'Banani Thai Garden',
        spotArea: 'Road 11, Banani',
        blockSize: '2x1',
        category: 'Combo / Platter',
        preset: 'emerald',
        headline: 'Weekend Thai BBQ Platter Special',
        subtext: 'Grilled satay skewers, prawn pad thai, and chilled Thai iced tea at 35% discount.',
        highlightTag: '35% OFF',
        promoCode: 'THAIBBQ',
        status: 'PENDING_APPROVAL',
        submittedAt: now - 10 * 60 * 1000,
        approvedAt: null,
        queuedAt: null,
        expiresAt: null
      },
      {
        id: 'ad-seed-p-2',
        spotId: null,
        spotName: 'Khilgaon Naga Wings Hub',
        spotArea: 'Taltola Market, Khilgaon',
        blockSize: '1x1',
        category: 'Late Night / Street Food',
        preset: 'fire',
        headline: 'Ghost Pepper Naga Wings Challenge',
        subtext: 'Finest Sylheti naga morich glazed crispy wings. Can you finish 6 wings?',
        highlightTag: 'SPICY HIT',
        promoCode: 'NAGA99',
        status: 'PENDING_APPROVAL',
        submittedAt: now - 25 * 60 * 1000,
        approvedAt: null,
        queuedAt: null,
        expiresAt: null
      },
      {
        id: 'ad-seed-p-3',
        spotId: null,
        spotName: 'Chawkbazar Shahi Faluda',
        spotArea: 'Chawkbazar, Old Dhaka',
        blockSize: '1x2',
        category: 'Grand Opening',
        preset: 'gold',
        headline: 'Grand Opening: Heritage Shahi Faluda',
        subtext: 'Celebrating 50 years of traditional Dhaka faluda with pistachios, saffron syrup, and malai.',
        highlightTag: '50 YRS',
        promoCode: 'CHAWK50',
        status: 'PENDING_APPROVAL',
        submittedAt: now - 45 * 60 * 1000,
        approvedAt: null,
        queuedAt: null,
        expiresAt: null
      }
    ];

    localStorage.setItem(STORAGE_KEYS.SEEDED, 'true');
    saveState();
  }

  // Rotation Engine: Check Expirations & Promote Oldest from Queue (FIFO)
  function checkExpirations() {
    const now = Date.now();
    let stateChanged = false;
    const expiredList = [];

    // Filter out expired ads
    const stillLive = [];
    for (const ad of liveAds) {
      if (ad.expiresAt && now >= ad.expiresAt) {
        expiredList.push(ad);
      } else {
        stillLive.push(ad);
      }
    }

    if (expiredList.length > 0) {
      liveAds = stillLive;
      stateChanged = true;

      // For each expired ad, find the oldest queued ad matching the exact blockSize
      expiredList.forEach(expiredAd => {
        const queueIdx = queuedAds.findIndex(q => q.blockSize === expiredAd.blockSize);
        if (queueIdx !== -1) {
          const promoted = queuedAds.splice(queueIdx, 1)[0];
          promoted.status = 'LIVE';
          promoted.approvedAt = now;
          promoted.expiresAt = now + 24 * 3600 * 1000;
          liveAds.push(promoted);
          if (FH.toast) {
            FH.toast(`⏰ 24h expired: Promoted "${promoted.headline}" (${promoted.blockSize}) to Live Wall!`);
          }
        } else {
          if (FH.toast) {
            FH.toast(`⏰ Ad "${expiredAd.headline}" (${expiredAd.blockSize}) expired and freed up a slot.`);
          }
        }
      });

      saveState();
      renderWall();
      renderAdmin();
    } else {
      // Just update countdown labels in the DOM efficiently
      updateLiveTimers();
    }
  }

  // Update live timer badges in place without re-rendering whole grid
  function updateLiveTimers() {
    const now = Date.now();
    const badges = document.querySelectorAll('[data-ad-timer-id]');
    badges.forEach(badge => {
      const adId = badge.getAttribute('data-ad-timer-id');
      const ad = liveAds.find(a => a.id === adId);
      if (ad && ad.expiresAt) {
        const rem = ad.expiresAt - now;
        badge.innerHTML = `<i class="fa-regular fa-clock"></i> ${formatCountdown(rem)}`;
      }
    });

    // Also update in Admin panel if visible
    const adminBadges = document.querySelectorAll('[data-admin-timer-id]');
    adminBadges.forEach(badge => {
      const adId = badge.getAttribute('data-admin-timer-id');
      const ad = liveAds.find(a => a.id === adId);
      if (ad && ad.expiresAt) {
        const rem = ad.expiresAt - now;
        badge.textContent = formatCountdown(rem);
      }
    });
  }

  // Fast-Forward Demo Trigger: Expire nearest ad by 24h to demonstrate rotation immediately
  function fastForwardExpiry() {
    if (liveAds.length === 0) {
      if (FH.toast) FH.toast('No active live ads to expire.');
      return;
    }

    // Find live ad with lowest expiresAt
    let target = liveAds[0];
    for (let i = 1; i < liveAds.length; i++) {
      if (liveAds[i].expiresAt < target.expiresAt) {
        target = liveAds[i];
      }
    }

    // Expire it now
    target.expiresAt = Date.now() - 1000;
    if (FH.toast) {
      FH.toast(`Expiring "${target.headline}" (${target.blockSize})...`);
    }
    checkExpirations();
  }

  // Top Summary Bar Data
  function getOccupancyData() {
    const counts = {
      '2x2': { live: 0, queue: 0, max: LIMITS['2x2'] },
      '2x1': { live: 0, queue: 0, max: LIMITS['2x1'] },
      '1x2': { live: 0, queue: 0, max: LIMITS['1x2'] },
      '1x1': { live: 0, queue: 0, max: LIMITS['1x1'] }
    };

    liveAds.forEach(a => {
      if (counts[a.blockSize]) counts[a.blockSize].live++;
    });

    queuedAds.forEach(a => {
      if (counts[a.blockSize]) counts[a.blockSize].queue++;
    });

    const totalLive = liveAds.length;
    return { counts, totalLive };
  }

  // Render Bento Ad Card HTML
  function renderAdCard(ad) {
    const isHero = ad.blockSize === '2x2';
    const isWide = ad.blockSize === '2x1';
    const isTall = ad.blockSize === '1x2';
    const isSquare = ad.blockSize === '1x1';

    const presetClass = `preset-${ad.preset || 'fire'}`;
    const sizeClass = `ad-size-${ad.blockSize}`;
    const rem = ad.expiresAt ? Math.max(0, ad.expiresAt - Date.now()) : 0;
    const timeFormatted = formatCountdown(rem);

    // Escape helper
    const esc = FH.esc || (t => String(t || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])));

    let layoutHtml = '';

    if (isHero) {
      // 2x2 Hero Mega
      layoutHtml = `
        <div class="flex items-start justify-between gap-2">
          <div class="flex flex-wrap items-center gap-1.5">
            <span class="preset-tag keep-white text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-md shadow-sm">
              <i class="fa-solid fa-fire-flame-curved mr-1"></i> ${esc(ad.highlightTag || 'SPECIAL')}
            </span>
            <span class="ad-timer-badge" data-ad-timer-id="${ad.id}">
              <i class="fa-regular fa-clock"></i> ${timeFormatted}
            </span>
          </div>
          <span class="text-[10px] font-bold uppercase tracking-wider opacity-75 bg-black/40 px-2 py-0.5 rounded border border-white/10">
            ${esc(ad.category)}
          </span>
        </div>

        <div class="my-auto py-3 space-y-1.5">
          <div class="flex items-center gap-1.5 text-xs font-semibold opacity-90 preset-accent truncate">
            <i class="fa-solid fa-store"></i> <span>${esc(ad.spotName)}</span>
            <span class="opacity-60 text-[11px]">• ${esc(ad.spotArea)}</span>
          </div>
          <h3 class="text-lg md:text-xl font-black text-white leading-tight drop-shadow-sm line-clamp-2">
            ${esc(ad.headline)}
          </h3>
          <p class="text-xs text-slate-200/90 leading-snug line-clamp-2">
            ${esc(ad.subtext)}
          </p>
        </div>

        <div class="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
          <div class="flex items-center gap-1.5">
            ${ad.promoCode ? `
              <span class="ad-code-badge" title="Click to copy promo code" onclick="FH.adWall.copyCode('${esc(ad.promoCode)}')">
                <i class="fa-solid fa-ticket preset-accent"></i> ${esc(ad.promoCode)}
              </span>` : ''}
          </div>
          <button type="button" class="preset-btn keep-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition" onclick="FH.adWall.viewOnMap('${esc(ad.spotId)}', '${esc(ad.spotName)}', '${esc(ad.spotArea)}')">
            <i class="fa-solid fa-location-dot"></i> <span>View on Map</span>
          </button>
        </div>
      `;
    } else if (isWide) {
      // 2x1 Wide Banner
      layoutHtml = `
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-1.5">
            <span class="preset-tag keep-white text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-sm">
              ${esc(ad.highlightTag || 'DEAL')}
            </span>
            <span class="ad-timer-badge text-[10px]" data-ad-timer-id="${ad.id}">
              <i class="fa-regular fa-clock"></i> ${timeFormatted}
            </span>
          </div>
          <div class="flex items-center gap-1 text-[11px] font-semibold opacity-80 preset-accent truncate max-w-[180px]">
            <i class="fa-solid fa-store"></i> <span class="truncate">${esc(ad.spotName)}</span>
          </div>
        </div>

        <div class="my-auto py-1.5">
          <h3 class="text-sm md:text-base font-black text-white leading-tight truncate">
            ${esc(ad.headline)}
          </h3>
          <p class="text-xs text-slate-200/80 leading-snug line-clamp-1 mt-0.5">
            ${esc(ad.subtext)}
          </p>
        </div>

        <div class="pt-1.5 border-t border-white/10 flex items-center justify-between gap-2">
          <div class="flex items-center gap-1">
            ${ad.promoCode ? `
              <span class="ad-code-badge text-[10px]" onclick="FH.adWall.copyCode('${esc(ad.promoCode)}')">
                <i class="fa-solid fa-ticket preset-accent"></i> ${esc(ad.promoCode)}
              </span>` : `<span class="text-[10px] opacity-60">${esc(ad.category)}</span>`}
          </div>
          <button type="button" class="preset-btn keep-white px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95 transition" onclick="FH.adWall.viewOnMap('${esc(ad.spotId)}', '${esc(ad.spotName)}', '${esc(ad.spotArea)}')">
            <i class="fa-solid fa-location-dot text-[10px]"></i> <span>View</span>
          </button>
        </div>
      `;
    } else if (isTall) {
      // 1x2 Tall Poster
      layoutHtml = `
        <div class="space-y-1.5">
          <div class="flex items-center justify-between gap-1">
            <span class="preset-tag keep-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-sm">
              ${esc(ad.highlightTag || 'OFFER')}
            </span>
            <span class="ad-timer-badge text-[10px]" data-ad-timer-id="${ad.id}">
              <i class="fa-regular fa-clock"></i> ${timeFormatted}
            </span>
          </div>
          <div class="text-[10px] font-semibold opacity-75 preset-accent truncate">
            <i class="fa-solid fa-location-crosshairs"></i> ${esc(ad.spotArea || ad.spotName)}
          </div>
        </div>

        <div class="my-auto py-2 space-y-1.5">
          <h3 class="text-sm md:text-base font-black text-white leading-snug line-clamp-3">
            ${esc(ad.headline)}
          </h3>
          <p class="text-[11px] text-slate-200/80 leading-snug line-clamp-3">
            ${esc(ad.subtext)}
          </p>
          ${ad.promoCode ? `
            <div class="pt-1">
              <span class="ad-code-badge text-[10px]" onclick="FH.adWall.copyCode('${esc(ad.promoCode)}')">
                <i class="fa-solid fa-ticket preset-accent"></i> Code: ${esc(ad.promoCode)}
              </span>
            </div>` : ''}
        </div>

        <div class="pt-2 border-t border-white/10 space-y-2">
          <div class="text-[11px] font-bold text-white truncate">
            <i class="fa-solid fa-store text-brand text-[10px]"></i> ${esc(ad.spotName)}
          </div>
          <button type="button" class="preset-btn keep-white w-full py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition" onclick="FH.adWall.viewOnMap('${esc(ad.spotId)}', '${esc(ad.spotName)}', '${esc(ad.spotArea)}')">
            <i class="fa-solid fa-location-dot"></i> <span>View on Map</span>
          </button>
        </div>
      `;
    } else {
      // 1x1 Square Card
      layoutHtml = `
        <div class="flex items-center justify-between gap-1">
          <span class="preset-tag keep-white text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shadow-sm">
            ${esc(ad.highlightTag || 'FREE')}
          </span>
          <span class="ad-timer-badge text-[9px] px-1.5 py-0.2" data-ad-timer-id="${ad.id}">
            ${timeFormatted}
          </span>
        </div>

        <div class="my-auto py-1">
          <h4 class="text-xs font-black text-white leading-tight line-clamp-2">
            ${esc(ad.headline)}
          </h4>
          <div class="text-[10px] font-semibold opacity-80 preset-accent truncate mt-1">
            ${esc(ad.spotName)}
          </div>
        </div>

        <div class="pt-1 border-t border-white/10 flex items-center justify-between gap-1">
          <span class="text-[9px] opacity-60 truncate">${esc(ad.spotArea || ad.category)}</span>
          <button type="button" class="preset-btn keep-white px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 shadow-sm active:scale-95 transition" onclick="FH.adWall.viewOnMap('${esc(ad.spotId)}', '${esc(ad.spotName)}', '${esc(ad.spotArea)}')">
            <span>Map</span>
          </button>
        </div>
      `;
    }

    return `
      <div class="ad-card ${presetClass} ${sizeClass}" data-ad-id="${ad.id}">
        ${layoutHtml}
      </div>
    `;
  }

  // Render Full Promo Wall View
  function renderWall() {
    const wall = document.querySelector('#promoWallView');
    if (!wall) return;

    // Filter Ads
    let filtered = liveAds;
    if (activeFilter !== 'All') {
      filtered = liveAds.filter(a => a.category === activeFilter);
    }

    // Top Summary Bar
    const { counts, totalLive } = getOccupancyData();

    const summaryEl = document.querySelector('#adWallSummaryBar');
    if (summaryEl) {
      summaryEl.innerHTML = `
        <div class="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div class="flex flex-wrap items-center gap-2 md:gap-3">
            <span class="font-extrabold text-white flex items-center gap-1.5 bg-[#07192f] border border-[#14355f] px-2.5 py-1 rounded-lg">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Slots: <span class="text-brand font-black">${totalLive}/${TOTAL_CAPACITY}</span>
            </span>

            <div class="flex flex-wrap items-center gap-1.5">
              <div class="bg-[#07192f]/80 border border-[#14355f] px-2 py-0.5 rounded-md flex items-center gap-1.5" title="Hero Mega (2x2)">
                <span class="font-bold text-slate-200">Hero Mega (2x2):</span>
                <span class="font-semibold ${counts['2x2'].live >= counts['2x2'].max ? 'text-amber-400' : 'text-emerald-400'}">${counts['2x2'].live}/${counts['2x2'].max} Live</span>
                <span class="text-slate-500">|</span>
                <span class="text-slate-400">Queue: <strong class="${counts['2x2'].queue > 0 ? 'text-brand' : 'text-slate-400'}">${counts['2x2'].queue}</strong></span>
              </div>

              <div class="bg-[#07192f]/80 border border-[#14355f] px-2 py-0.5 rounded-md flex items-center gap-1.5" title="Wide Banner (2x1)">
                <span class="font-bold text-slate-200">Wide Banner (2x1):</span>
                <span class="font-semibold ${counts['2x1'].live >= counts['2x1'].max ? 'text-amber-400' : 'text-emerald-400'}">${counts['2x1'].live}/${counts['2x1'].max} Live</span>
                <span class="text-slate-500">|</span>
                <span class="text-slate-400">Queue: <strong class="${counts['2x1'].queue > 0 ? 'text-brand' : 'text-slate-400'}">${counts['2x1'].queue}</strong></span>
              </div>

              <div class="bg-[#07192f]/80 border border-[#14355f] px-2 py-0.5 rounded-md flex items-center gap-1.5" title="Tall Poster (1x2)">
                <span class="font-bold text-slate-200">Tall Poster (1x2):</span>
                <span class="font-semibold ${counts['1x2'].live >= counts['1x2'].max ? 'text-amber-400' : 'text-emerald-400'}">${counts['1x2'].live}/${counts['1x2'].max} Live</span>
                <span class="text-slate-500">|</span>
                <span class="text-slate-400">Queue: <strong class="${counts['1x2'].queue > 0 ? 'text-brand' : 'text-slate-400'}">${counts['1x2'].queue}</strong></span>
              </div>

              <div class="bg-[#07192f]/80 border border-[#14355f] px-2 py-0.5 rounded-md flex items-center gap-1.5" title="Square Card (1x1)">
                <span class="font-bold text-slate-200">Square Card (1x1):</span>
                <span class="font-semibold ${counts['1x1'].live >= counts['1x1'].max ? 'text-amber-400' : 'text-emerald-400'}">${counts['1x1'].live}/${counts['1x1'].max} Live</span>
                <span class="text-slate-500">|</span>
                <span class="text-slate-400">Queue: <strong class="${counts['1x1'].queue > 0 ? 'text-brand' : 'text-slate-400'}">${counts['1x1'].queue}</strong></span>
              </div>
            </div>
          </div>

          <div class="text-[11px] text-slate-400 flex items-center gap-1">
            <i class="fa-solid fa-shield-halved text-emerald-400"></i>
            <span>FIFO 24-Hour Automated Promotion</span>
          </div>
        </div>
      `;
    }

    // Category Tabs
    const tabsContainer = document.querySelector('#adWallCategoryTabs');
    if (tabsContainer) {
      const allCategories = ['All', ...CATEGORIES];
      tabsContainer.innerHTML = allCategories.map(cat => {
        const isSel = cat === activeFilter;
        return `
          <button type="button" class="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            isSel ? 'bg-brand text-white shadow-lg shadow-brand/25 ring-1 ring-brand' : 'bg-[#0c233f] text-slate-300 hover:text-white hover:bg-[#102d50] border border-[#14355f]'
          }" onclick="FH.adWall.setFilter('${cat}')">
            <span>${cat}</span>
            <span class="text-[10px] px-1.5 py-0.2 rounded-full ${isSel ? 'bg-black/25 text-white' : 'bg-[#07192f] text-slate-400'}">
              ${cat === 'All' ? liveAds.length : liveAds.filter(a => a.category === cat).length}
            </span>
          </button>
        `;
      }).join('');
    }

    // Bento Grid Container
    const gridEl = document.querySelector('#adBentoGrid');
    if (gridEl) {
      if (filtered.length === 0) {
        gridEl.innerHTML = `
          <div class="col-span-full py-16 text-center space-y-3 bg-[#0c233f]/50 border border-[#14355f] rounded-2xl p-6">
            <div class="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/30 text-brand flex items-center justify-center mx-auto text-xl">
              <i class="fa-solid fa-bullhorn"></i>
            </div>
            <h3 class="text-base font-bold text-white">No active ads in this category</h3>
            <p class="text-xs text-slate-400 max-w-sm mx-auto">Be the first to feature your roadside cart or food spot on the 24-hour Free Ad Wall.</p>
            <button type="button" class="bg-brand hover:bg-brand-hover text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-brand/25 transition inline-flex items-center gap-1.5" onclick="FH.adWall.openSubmitModal()">
              <i class="fa-solid fa-plus-circle"></i> <span>Post Free Ad Now</span>
            </button>
          </div>
        `;
      } else {
        gridEl.innerHTML = filtered.map(ad => renderAdCard(ad)).join('');
      }
    }
  }

  // Render Admin Dashboard HTML
  function renderAdmin() {
    const admin = document.querySelector('#adminView');
    if (!admin || admin.classList.contains('hidden')) return;

    // Occupancy
    const { counts, totalLive } = getOccupancyData();

    // Settings Toggle state
    const toggleEl = document.querySelector('#adminAutoApproveToggle');
    if (toggleEl) {
      toggleEl.checked = autoApproveSetting;
    }
    const modeBadge = document.querySelector('#adminModeBadge');
    if (modeBadge) {
      if (autoApproveSetting) {
        modeBadge.className = 'text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-500/50 text-emerald-300 inline-flex items-center gap-1.5';
        modeBadge.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-400"></span> Mode: Auto-Publish (Skip Approval)';
      } else {
        modeBadge.className = 'text-xs font-bold px-2.5 py-1 rounded-full bg-amber-950 border border-amber-500/50 text-amber-300 inline-flex items-center gap-1.5';
        modeBadge.innerHTML = '<span class="w-2 h-2 rounded-full bg-amber-400"></span> Mode: Manual Approval Required';
      }
    }

    // Tab Counts
    const pCountEl = document.querySelector('#adminPendingBadge');
    if (pCountEl) pCountEl.textContent = pendingAds.length;
    const lCountEl = document.querySelector('#adminLiveBadge');
    if (lCountEl) lCountEl.textContent = `${totalLive}/${TOTAL_CAPACITY}`;
    const qCountEl = document.querySelector('#adminQueueBadge');
    if (qCountEl) qCountEl.textContent = queuedAds.length;

    // Render Tab Content
    const contentEl = document.querySelector('#adminTabContent');
    if (!contentEl) return;

    if (activeAdminTab === 'pending') {
      if (pendingAds.length === 0) {
        contentEl.innerHTML = `
          <div class="py-16 text-center space-y-2 bg-[#0c233f] border border-[#14355f] rounded-2xl p-6">
            <i class="fa-solid fa-circle-check text-emerald-400 text-3xl"></i>
            <h4 class="text-sm font-bold text-white">No submissions pending approval</h4>
            <p class="text-xs text-slate-400">New vendor submissions requiring moderation will appear here.</p>
          </div>
        `;
      } else {
        contentEl.innerHTML = `
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${pendingAds.map(ad => `
              <div class="bg-[#0c233f] border border-[#1b3d6a] rounded-2xl p-4 flex flex-col justify-between space-y-3">
                <div class="space-y-2">
                  <div class="flex items-center justify-between text-xs">
                    <span class="bg-brand/20 border border-brand/40 text-brand font-bold px-2 py-0.5 rounded text-[10px]">
                      ${FH.esc(ad.blockSize)} • ${FH.esc(ad.preset)}
                    </span>
                    <span class="text-[10px] text-slate-400">
                      ${new Date(ad.submittedAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div>
                    <span class="text-xs font-semibold text-slate-400">${FH.esc(ad.spotName)} (${FH.esc(ad.spotArea || 'Dhaka')})</span>
                    <h4 class="text-sm font-bold text-white leading-snug mt-0.5">${FH.esc(ad.headline)}</h4>
                    <p class="text-xs text-slate-300 mt-1">${FH.esc(ad.subtext)}</p>
                  </div>
                  <div class="flex items-center gap-2 text-xs pt-1">
                    <span class="bg-amber-950/80 border border-amber-500/40 text-amber-300 text-[10px] px-2 py-0.5 rounded font-bold">
                      Tag: ${FH.esc(ad.highlightTag || 'None')}
                    </span>
                    ${ad.promoCode ? `<span class="bg-[#07192f] border border-[#1b3d6a] text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono">Code: ${FH.esc(ad.promoCode)}</span>` : ''}
                  </div>
                </div>

                <div class="pt-3 border-t border-[#14355f] flex items-center justify-end gap-2">
                  <button type="button" class="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-950/60 hover:bg-rose-900 border border-rose-500/50 text-rose-300 transition" onclick="FH.adWall.rejectAd('${ad.id}')">
                    <i class="fa-solid fa-xmark mr-1"></i> Reject
                  </button>
                  <button type="button" class="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition flex items-center gap-1" onclick="FH.adWall.approveAd('${ad.id}')">
                    <i class="fa-solid fa-check mr-1"></i> Approve
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }
    } else if (activeAdminTab === 'live') {
      contentEl.innerHTML = `
        <div class="space-y-4">
          <!-- Capacity Cards -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div class="bg-[#0c233f] border border-[#14355f] p-3 rounded-xl">
              <div class="text-[10px] font-bold text-slate-400 uppercase">Hero Mega (2x2)</div>
              <div class="text-lg font-black ${counts['2x2'].live >= counts['2x2'].max ? 'text-amber-400' : 'text-emerald-400'}">${counts['2x2'].live} / ${counts['2x2'].max} Slots</div>
              <div class="w-full bg-[#07192f] h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div class="bg-brand h-full" style="width: ${(counts['2x2'].live / counts['2x2'].max) * 100}%"></div>
              </div>
            </div>
            <div class="bg-[#0c233f] border border-[#14355f] p-3 rounded-xl">
              <div class="text-[10px] font-bold text-slate-400 uppercase">Wide Banner (2x1)</div>
              <div class="text-lg font-black ${counts['2x1'].live >= counts['2x1'].max ? 'text-amber-400' : 'text-emerald-400'}">${counts['2x1'].live} / ${counts['2x1'].max} Slots</div>
              <div class="w-full bg-[#07192f] h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div class="bg-brand h-full" style="width: ${(counts['2x1'].live / counts['2x1'].max) * 100}%"></div>
              </div>
            </div>
            <div class="bg-[#0c233f] border border-[#14355f] p-3 rounded-xl">
              <div class="text-[10px] font-bold text-slate-400 uppercase">Tall Poster (1x2)</div>
              <div class="text-lg font-black ${counts['1x2'].live >= counts['1x2'].max ? 'text-amber-400' : 'text-emerald-400'}">${counts['1x2'].live} / ${counts['1x2'].max} Slots</div>
              <div class="w-full bg-[#07192f] h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div class="bg-brand h-full" style="width: ${(counts['1x2'].live / counts['1x2'].max) * 100}%"></div>
              </div>
            </div>
            <div class="bg-[#0c233f] border border-[#14355f] p-3 rounded-xl">
              <div class="text-[10px] font-bold text-slate-400 uppercase">Square Card (1x1)</div>
              <div class="text-lg font-black ${counts['1x1'].live >= counts['1x1'].max ? 'text-amber-400' : 'text-emerald-400'}">${counts['1x1'].live} / ${counts['1x1'].max} Slots</div>
              <div class="w-full bg-[#07192f] h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div class="bg-brand h-full" style="width: ${(counts['1x1'].live / counts['1x1'].max) * 100}%"></div>
              </div>
            </div>
          </div>

          <!-- Table of Live Ads -->
          <div class="bg-[#0c233f] border border-[#14355f] rounded-2xl overflow-hidden shadow-xl">
            <div class="px-4 py-3 border-b border-[#14355f] flex items-center justify-between">
              <h4 class="text-sm font-bold text-white flex items-center gap-2">
                <i class="fa-solid fa-satellite-dish text-emerald-400"></i> Active Live Ads (${liveAds.length})
              </h4>
              <span class="text-xs text-slate-400">Force expiring an ad immediately promotes the next in queue</span>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-slate-300">
                <thead class="bg-[#07192f] text-[10px] uppercase font-bold text-slate-400 border-b border-[#14355f]">
                  <tr>
                    <th class="p-3">Size & Theme</th>
                    <th class="p-3">Restaurant / Spot</th>
                    <th class="p-3">Headline</th>
                    <th class="p-3">Time Left</th>
                    <th class="p-3 text-right">Moderation Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#14355f]">
                  ${liveAds.map(ad => `
                    <tr class="hover:bg-[#102d50]/50 transition">
                      <td class="p-3 font-semibold">
                        <span class="bg-[#07192f] border border-[#1b3d6a] px-2 py-0.5 rounded font-mono text-[10px]">${FH.esc(ad.blockSize)}</span>
                        <span class="text-[10px] text-slate-400 ml-1">(${FH.esc(ad.preset)})</span>
                      </td>
                      <td class="p-3">
                        <div class="font-bold text-white">${FH.esc(ad.spotName)}</div>
                        <div class="text-[10px] text-slate-400">${FH.esc(ad.spotArea || 'Dhaka')}</div>
                      </td>
                      <td class="p-3 max-w-xs truncate font-medium text-slate-200">
                        ${FH.esc(ad.headline)}
                      </td>
                      <td class="p-3 font-mono font-bold text-emerald-400" data-admin-timer-id="${ad.id}">
                        ${formatCountdown(Math.max(0, (ad.expiresAt || 0) - Date.now()))}
                      </td>
                      <td class="p-3 text-right">
                        <button type="button" class="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-950/70 hover:bg-amber-900 border border-amber-500/50 text-amber-300 transition" onclick="FH.adWall.forceExpireAd('${ad.id}')" title="Immediately expire this ad and trigger rotation">
                          <i class="fa-solid fa-hourglass-end mr-1"></i> Force Expire
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    } else if (activeAdminTab === 'queue') {
      if (queuedAds.length === 0) {
        contentEl.innerHTML = `
          <div class="py-16 text-center space-y-2 bg-[#0c233f] border border-[#14355f] rounded-2xl p-6">
            <i class="fa-solid fa-layer-group text-slate-400 text-3xl"></i>
            <h4 class="text-sm font-bold text-white">Queue is currently empty</h4>
            <p class="text-xs text-slate-400">When active slots for a block size are filled, incoming approved ads wait here.</p>
          </div>
        `;
      } else {
        // Group by blockSize
        const sizes = ['2x2', '2x1', '1x2', '1x1'];
        contentEl.innerHTML = `
          <div class="space-y-5">
            ${sizes.map(size => {
              const inQueue = queuedAds.filter(q => q.blockSize === size);
              return `
                <div class="bg-[#0c233f] border border-[#14355f] rounded-2xl p-4 space-y-3">
                  <div class="flex items-center justify-between border-b border-[#14355f] pb-2">
                    <h4 class="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <span class="w-2 h-2 rounded-full bg-brand"></span>
                      ${size === '2x2' ? 'Hero Mega (2x2)' : size === '2x1' ? 'Wide Banner (2x1)' : size === '1x2' ? 'Tall Poster (1x2)' : 'Square Card (1x1)'} Queue
                    </h4>
                    <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-[#07192f] border border-[#1b3d6a] text-slate-400">
                      ${inQueue.length} Waiting
                    </span>
                  </div>

                  ${inQueue.length === 0 ? `
                    <div class="text-xs text-slate-500 py-2">No ads queued for this size.</div>
                  ` : `
                    <div class="space-y-2">
                      ${inQueue.map((ad, idx) => `
                        <div class="flex items-center justify-between gap-3 bg-[#07192f] border border-[#1b3d6a] rounded-xl p-3">
                          <div class="flex items-center gap-3 min-w-0">
                            <span class="w-7 h-7 rounded-lg bg-brand/20 border border-brand/40 text-brand font-black text-xs flex items-center justify-center shrink-0">
                              #${idx + 1}
                            </span>
                            <div class="min-w-0">
                              <div class="text-xs font-bold text-white truncate">${FH.esc(ad.headline)}</div>
                              <div class="text-[10px] text-slate-400 truncate">${FH.esc(ad.spotName)} • ${FH.esc(ad.category)}</div>
                            </div>
                          </div>
                          <div class="flex items-center gap-2 shrink-0">
                            <button type="button" class="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 transition" onclick="FH.adWall.forcePromoteQueue('${ad.id}')" title="Force promote to Live now">
                              <i class="fa-solid fa-arrow-up mr-1"></i> Make Live
                            </button>
                            <button type="button" class="px-2 py-1 rounded-lg text-xs font-bold bg-rose-950/70 hover:bg-rose-900 border border-rose-500/50 text-rose-300 transition" onclick="FH.adWall.deleteFromQueue('${ad.id}')" title="Remove from queue">
                              <i class="fa-solid fa-trash"></i>
                            </button>
                          </div>
                        </div>
                      `).join('')}
                    </div>
                  `}
                </div>
              `;
            }).join('')}
          </div>
        `;
      }
    }
  }

  // Create Free Banner Ad Modal (with Live Preview)
  function openSubmitModal() {
    const modal = document.querySelector('#modal');
    if (!modal) return;

    // Get current spot options from FH.store
    const spots = (FH.store && FH.store.S && FH.store.S.spots) ? FH.store.S.spots : [];

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    modal.innerHTML = `
      <div class="bg-[#07192f] border border-[#1b3d6a] w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col z-[2100]">
        <!-- Header -->
        <div class="px-5 py-3.5 border-b border-[#14355f] flex items-center justify-between bg-[#0c233f]">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-brand text-white flex items-center justify-center font-black">
              <i class="fa-solid fa-bullhorn text-sm"></i>
            </div>
            <div>
              <h3 class="text-base font-black text-white leading-tight">Create Free 24-Hour Banner Ad</h3>
              <p class="text-[11px] text-slate-400">Promote roadside carts & street food deals across Dhaka</p>
            </div>
          </div>
          <button type="button" class="text-slate-400 hover:text-white text-2xl leading-none p-1" onclick="FH.closeModal()">&times;</button>
        </div>

        <!-- Body: Split Form + Sticky Preview -->
        <div class="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <!-- Left Form Controls (7 cols) -->
            <form id="adSubmitForm" class="lg:col-span-7 space-y-4 text-xs" onsubmit="event.preventDefault(); FH.adWall.handleFormSubmit();">
              <!-- Select Spot -->
              <div>
                <label class="block font-bold text-slate-200 mb-1">Select Restaurant / Roadside Cart</label>
                <select id="formSpotSelect" class="w-full bg-[#0c233f] border border-[#14355f] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-brand">
                  <option value="__custom__">+ Enter Custom Roadside Cart / Vendor</option>
                  ${spots.map(s => `<option value="${s.id}" selected>${FH.esc(s.name)} (${FH.esc(s.type)})</option>`).join('')}
                </select>
              </div>

              <!-- Custom Vendor Name & Area -->
              <div id="formCustomSpotFields" class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label class="block font-bold text-slate-200 mb-1">Vendor / Cart Name</label>
                  <input type="text" id="formCustomName" placeholder="e.g. Bailey Road Khichuri" class="w-full bg-[#0c233f] border border-[#14355f] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-brand">
                </div>
                <div>
                  <label class="block font-bold text-slate-200 mb-1">Location / Area</label>
                  <input type="text" id="formCustomArea" placeholder="e.g. Bailey Road, Dhaka" class="w-full bg-[#0c233f] border border-[#14355f] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-brand">
                </div>
              </div>

              <!-- Block Size Selector -->
              <div>
                <label class="block font-bold text-slate-200 mb-1.5">Choose Block Size & Placement</label>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <label class="cursor-pointer">
                    <input type="radio" name="blockSize" value="1x1" class="peer sr-only" checked>
                    <div class="border border-[#14355f] peer-checked:border-brand peer-checked:bg-brand/10 p-2.5 rounded-xl transition text-center space-y-0.5">
                      <div class="font-bold text-white text-xs">1x1 Card</div>
                      <div class="text-[10px] text-slate-400">Square</div>
                      <div class="text-[9px] text-emerald-400 font-bold" id="slot-avail-1x1">Max 16</div>
                    </div>
                  </label>
                  <label class="cursor-pointer">
                    <input type="radio" name="blockSize" value="2x1" class="peer sr-only">
                    <div class="border border-[#14355f] peer-checked:border-brand peer-checked:bg-brand/10 p-2.5 rounded-xl transition text-center space-y-0.5">
                      <div class="font-bold text-white text-xs">2x1 Banner</div>
                      <div class="text-[10px] text-slate-400">Wide Strip</div>
                      <div class="text-[9px] text-emerald-400 font-bold" id="slot-avail-2x1">Max 6</div>
                    </div>
                  </label>
                  <label class="cursor-pointer">
                    <input type="radio" name="blockSize" value="1x2" class="peer sr-only">
                    <div class="border border-[#14355f] peer-checked:border-brand peer-checked:bg-brand/10 p-2.5 rounded-xl transition text-center space-y-0.5">
                      <div class="font-bold text-white text-xs">1x2 Poster</div>
                      <div class="text-[10px] text-slate-400">Tall Pillar</div>
                      <div class="text-[9px] text-emerald-400 font-bold" id="slot-avail-1x2">Max 4</div>
                    </div>
                  </label>
                  <label class="cursor-pointer">
                    <input type="radio" name="blockSize" value="2x2" class="peer sr-only">
                    <div class="border border-[#14355f] peer-checked:border-brand peer-checked:bg-brand/10 p-2.5 rounded-xl transition text-center space-y-0.5">
                      <div class="font-bold text-white text-xs">2x2 Hero</div>
                      <div class="text-[10px] text-slate-400">Mega Spotlight</div>
                      <div class="text-[9px] text-emerald-400 font-bold" id="slot-avail-2x2">Max 2</div>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Offer Category -->
              <div>
                <label class="block font-bold text-slate-200 mb-1">Offer Category</label>
                <select id="formCategory" class="w-full bg-[#0c233f] border border-[#14355f] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-brand">
                  ${CATEGORIES.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                </select>
              </div>

              <!-- Readymade Banner Presets -->
              <div>
                <label class="block font-bold text-slate-200 mb-1.5">Readymade Banner Style Presets (6 Themes)</label>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  ${PRESETS.map((p, i) => `
                    <label class="cursor-pointer">
                      <input type="radio" name="preset" value="${p.id}" class="peer sr-only" ${i === 0 ? 'checked' : ''}>
                      <div class="border border-[#14355f] peer-checked:border-brand peer-checked:ring-1 peer-checked:ring-brand p-2 rounded-xl transition flex items-center gap-2 bg-[#0c233f]">
                        <span class="w-6 h-6 rounded-md bg-gradient-to-br ${p.sampleBg} flex items-center justify-center text-white text-[10px] shrink-0">
                          <i class="fa-solid ${p.icon}"></i>
                        </span>
                        <div class="min-w-0">
                          <div class="font-bold text-white text-[11px] truncate">${p.name}</div>
                          <div class="text-[9px] text-slate-400 truncate">${p.desc}</div>
                        </div>
                      </div>
                    </label>
                  `).join('')}
                </div>
              </div>

              <!-- Headline & Subtext -->
              <div>
                <label class="block font-bold text-slate-200 mb-1">Promo Headline</label>
                <input type="text" id="formHeadline" required maxlength="60" placeholder="e.g. Buy 1 Get 1 Royal Kacchi Platter" class="w-full bg-[#0c233f] border border-[#14355f] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-brand">
              </div>

              <div>
                <label class="block font-bold text-slate-200 mb-1">Subtext / Offer Details</label>
                <textarea id="formSubtext" rows="2" maxlength="150" placeholder="e.g. Free clay pot borhani with all full platters after 8:00 PM." class="w-full bg-[#0c233f] border border-[#14355f] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-brand"></textarea>
              </div>

              <!-- Highlight Tag & Promo Code -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label class="block font-bold text-slate-200 mb-1">Highlight Badge Tag</label>
                  <input type="text" id="formHighlightTag" placeholder="e.g. 50% OFF, BOGO" value="50% OFF" class="w-full bg-[#0c233f] border border-[#14355f] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-brand">
                  <div class="flex items-center gap-1 mt-1 text-[10px]">
                    <span class="cursor-pointer text-slate-400 hover:text-brand" onclick="document.querySelector('#formHighlightTag').value='30% OFF'; FH.adWall.updateLivePreview();">30% OFF</span>
                    <span>•</span>
                    <span class="cursor-pointer text-slate-400 hover:text-brand" onclick="document.querySelector('#formHighlightTag').value='BOGO'; FH.adWall.updateLivePreview();">BOGO</span>
                    <span>•</span>
                    <span class="cursor-pointer text-slate-400 hover:text-brand" onclick="document.querySelector('#formHighlightTag').value='COMBO ৳199'; FH.adWall.updateLivePreview();">COMBO</span>
                    <span>•</span>
                    <span class="cursor-pointer text-slate-400 hover:text-brand" onclick="document.querySelector('#formHighlightTag').value='HOT DEAL'; FH.adWall.updateLivePreview();">HOT</span>
                  </div>
                </div>

                <div>
                  <label class="block font-bold text-slate-200 mb-1">Promo Code (Optional)</label>
                  <input type="text" id="formPromoCode" placeholder="e.g. KHALAS24" class="w-full bg-[#0c233f] border border-[#14355f] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-brand uppercase font-mono">
                </div>
              </div>
            </form>

            <!-- Right Sticky Live Preview (5 cols) -->
            <div class="lg:col-span-5 bg-[#0c233f] border border-[#14355f] rounded-2xl p-4 sticky top-0 space-y-3">
              <div class="flex items-center justify-between text-xs pb-2 border-b border-[#14355f]">
                <span class="font-extrabold text-white flex items-center gap-1.5">
                  <i class="fa-solid fa-eye text-brand"></i> Live Card Preview
                </span>
                <span class="text-[10px] text-slate-400 font-mono">Simulated Wall Mockup</span>
              </div>

              <!-- Preview Mockup Container -->
              <div class="min-h-[260px] flex items-center justify-center bg-[#07192f] border border-[#14355f] rounded-xl p-3">
                <div id="livePreviewContainer" class="ad-preview-wrapper preview-size-1x1">
                  <!-- Injected via updateLivePreview -->
                </div>
              </div>

              <div class="text-[11px] text-slate-400 bg-[#07192f] p-2.5 rounded-xl border border-[#14355f] space-y-1">
                <div class="font-bold text-slate-200 flex items-center gap-1.5">
                  <i class="fa-solid fa-clock-rotate-left text-amber-400"></i> 24-Hour Automated Expiry Rule
                </div>
                <p>Every live ad stays for exactly 24 hours. If slots are full, it enters the FIFO waiting queue for that block size.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-5 py-3 border-t border-[#14355f] bg-[#0c233f] flex items-center justify-between">
          <div class="text-xs text-slate-400">
            ${autoApproveSetting ? `
              <span class="text-emerald-400 font-bold"><i class="fa-solid fa-bolt"></i> Instant Publish Mode Active</span>
            ` : `
              <span class="text-amber-400 font-bold"><i class="fa-solid fa-shield-halved"></i> Moderation Required Mode</span>
            `}
          </div>
          <div class="flex items-center gap-2">
            <button type="button" class="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-[#07192f] border border-[#14355f] transition" onclick="FH.closeModal()">
              Cancel
            </button>
            <button type="button" class="px-4 py-2 rounded-xl text-xs font-bold bg-brand hover:bg-brand-hover text-white shadow-lg shadow-brand/30 transition flex items-center gap-1.5 active:scale-95" onclick="document.querySelector('#adSubmitForm').requestSubmit()">
              <i class="fa-solid fa-paper-plane"></i> <span>Publish Free Ad (24 Hours)</span>
            </button>
          </div>
        </div>
      </div>
    `;

    // Setup input listeners to refresh live preview in real time
    const inputs = modal.querySelectorAll('input, select, textarea');
    inputs.forEach(inp => inp.addEventListener('input', updateLivePreview));

    // Handle spot select dropdown toggle
    const spotSel = modal.querySelector('#formSpotSelect');
    const customFields = modal.querySelector('#formCustomSpotFields');
    if (spotSel && customFields) {
      spotSel.addEventListener('change', () => {
        if (spotSel.value === '__custom__') {
          customFields.classList.remove('hidden');
        } else {
          customFields.classList.add('hidden');
        }
        updateLivePreview();
      });
      // Initial trigger
      if (spotSel.value !== '__custom__') {
        customFields.classList.add('hidden');
      }
    }

    // Set initial headline based on spot
    if (spots.length > 0) {
      modal.querySelector('#formHeadline').value = `Special Discount at ${spots[0].name}`;
      modal.querySelector('#formSubtext').value = `Enjoy freshly prepared authentic street food combos. Limited time 24h offer!`;
    }

    // Initial Live Preview Render
    updateLivePreview();
  }

  // Update Live Preview Card
  function updateLivePreview() {
    const previewContainer = document.querySelector('#livePreviewContainer');
    if (!previewContainer) return;

    const blockSize = document.querySelector('input[name="blockSize"]:checked')?.value || '1x1';
    const preset = document.querySelector('input[name="preset"]:checked')?.value || 'fire';
    const category = document.querySelector('#formCategory')?.value || 'Discount / % Off';
    const headline = document.querySelector('#formHeadline')?.value || 'Your Promotional Offer Headline';
    const subtext = document.querySelector('#formSubtext')?.value || 'Details about your special food deal or platter combo.';
    const highlightTag = document.querySelector('#formHighlightTag')?.value || 'OFFER';
    const promoCode = document.querySelector('#formPromoCode')?.value || '';

    const spotSel = document.querySelector('#formSpotSelect')?.value;
    let spotName = 'Roadside Food Cart';
    let spotArea = 'Dhaka';

    if (spotSel === '__custom__') {
      spotName = document.querySelector('#formCustomName')?.value || 'Custom Food Cart';
      spotArea = document.querySelector('#formCustomArea')?.value || 'Dhaka';
    } else {
      const spot = (FH.store && FH.store.get) ? FH.store.get(spotSel) : null;
      if (spot) {
        spotName = spot.name;
        spotArea = spot.type || 'Dhaka';
      }
    }

    // Update wrapper size class
    previewContainer.className = `ad-preview-wrapper preview-size-${blockSize}`;

    // Mock Ad Object
    const mockAd = {
      id: 'mock-preview-id',
      spotId: spotSel !== '__custom__' ? spotSel : null,
      spotName,
      spotArea,
      blockSize,
      category,
      preset,
      headline,
      subtext,
      highlightTag,
      promoCode,
      expiresAt: Date.now() + 24 * 3600 * 1000
    };

    previewContainer.innerHTML = renderAdCard(mockAd);
  }

  // Handle Form Submission
  function handleFormSubmit() {
    const blockSize = document.querySelector('input[name="blockSize"]:checked')?.value || '1x1';
    const preset = document.querySelector('input[name="preset"]:checked')?.value || 'fire';
    const category = document.querySelector('#formCategory')?.value || 'Discount / % Off';
    const headline = document.querySelector('#formHeadline')?.value?.trim();
    const subtext = document.querySelector('#formSubtext')?.value?.trim() || '';
    const highlightTag = document.querySelector('#formHighlightTag')?.value?.trim() || 'OFFER';
    const promoCode = document.querySelector('#formPromoCode')?.value?.trim() || null;

    if (!headline) {
      if (FH.toast) FH.toast('Please provide a promotional headline.');
      return;
    }

    const spotSel = document.querySelector('#formSpotSelect')?.value;
    let spotId = null;
    let spotName = 'Roadside Cart';
    let spotArea = 'Dhaka';

    if (spotSel === '__custom__') {
      spotName = document.querySelector('#formCustomName')?.value?.trim() || 'Roadside Food Spot';
      spotArea = document.querySelector('#formCustomArea')?.value?.trim() || 'Dhaka';
    } else {
      spotId = spotSel;
      const spot = (FH.store && FH.store.get) ? FH.store.get(spotSel) : null;
      if (spot) {
        spotName = spot.name;
        spotArea = spot.type || 'Dhaka';
      }
    }

    const now = Date.now();
    const newAd = {
      id: 'ad-' + now + '-' + Math.random().toString(36).substr(2, 6),
      spotId,
      spotName,
      spotArea,
      blockSize,
      category,
      preset,
      headline,
      subtext,
      highlightTag,
      promoCode,
      submittedAt: now,
      approvedAt: null,
      queuedAt: null,
      expiresAt: null
    };

    if (autoApproveSetting) {
      // Auto-Approve: Check if active live slots for this size are available
      const activeCount = liveAds.filter(a => a.blockSize === blockSize).length;
      if (activeCount < LIMITS[blockSize]) {
        newAd.status = 'LIVE';
        newAd.approvedAt = now;
        newAd.expiresAt = now + 24 * 3600 * 1000;
        liveAds.push(newAd);
        if (FH.toast) FH.toast(`Your free 24h ad is now LIVE on the board!`);
      } else {
        newAd.status = 'QUEUED';
        newAd.approvedAt = now;
        newAd.queuedAt = now;
        queuedAds.push(newAd);
        const queuePos = queuedAds.filter(q => q.blockSize === blockSize).length;
        if (FH.toast) FH.toast(`All ${blockSize} live slots are full. Placed at #${queuePos} in the waiting queue!`);
      }
    } else {
      // Manual Admin Moderation Required
      newAd.status = 'PENDING_APPROVAL';
      pendingAds.push(newAd);
      if (FH.toast) FH.toast(`Ad submitted! It has entered the private Admin Moderation Queue.`);
    }

    saveState();
    FH.closeModal();
    renderWall();
    renderAdmin();
  }

  // Admin Actions
  function toggleAutoApprove(checked) {
    autoApproveSetting = Boolean(checked);
    saveState();
    renderAdmin();
    if (FH.toast) {
      FH.toast(autoApproveSetting ? 'Approval Mode: Auto-Publish (Skip Approval) ON' : 'Approval Mode: Require Admin Approval ON');
    }
  }

  function approveAd(adId) {
    const idx = pendingAds.findIndex(a => a.id === adId);
    if (idx === -1) return;

    const ad = pendingAds.splice(idx, 1)[0];
    const now = Date.now();
    const activeCount = liveAds.filter(a => a.blockSize === ad.blockSize).length;

    if (activeCount < LIMITS[ad.blockSize]) {
      ad.status = 'LIVE';
      ad.approvedAt = now;
      ad.expiresAt = now + 24 * 3600 * 1000;
      liveAds.push(ad);
      if (FH.toast) FH.toast(`Approved! "${ad.headline}" (${ad.blockSize}) is now LIVE.`);
    } else {
      ad.status = 'QUEUED';
      ad.approvedAt = now;
      ad.queuedAt = now;
      queuedAds.push(ad);
      const queuePos = queuedAds.filter(q => q.blockSize === ad.blockSize).length;
      if (FH.toast) FH.toast(`Approved! ${ad.blockSize} slots full. Placed at #${queuePos} in waiting queue.`);
    }

    saveState();
    renderAdmin();
    renderWall();
  }

  function rejectAd(adId) {
    const idx = pendingAds.findIndex(a => a.id === adId);
    if (idx !== -1) {
      const removed = pendingAds.splice(idx, 1)[0];
      saveState();
      renderAdmin();
      if (FH.toast) FH.toast(`Rejected ad: "${removed.headline}".`);
    }
  }

  function forceExpireAd(adId) {
    const ad = liveAds.find(a => a.id === adId);
    if (ad) {
      ad.expiresAt = Date.now() - 1000;
      checkExpirations();
    }
  }

  function forcePromoteQueue(adId) {
    const idx = queuedAds.findIndex(q => q.id === adId);
    if (idx === -1) return;

    const ad = queuedAds.splice(idx, 1)[0];
    const now = Date.now();
    ad.status = 'LIVE';
    ad.approvedAt = now;
    ad.expiresAt = now + 24 * 3600 * 1000;
    liveAds.push(ad);

    saveState();
    renderAdmin();
    renderWall();
    if (FH.toast) FH.toast(`Promoted "${ad.headline}" (${ad.blockSize}) to LIVE.`);
  }

  function deleteFromQueue(adId) {
    const idx = queuedAds.findIndex(q => q.id === adId);
    if (idx !== -1) {
      const removed = queuedAds.splice(idx, 1)[0];
      saveState();
      renderAdmin();
      if (FH.toast) FH.toast(`Deleted "${removed.headline}" from queue.`);
    }
  }

  function setAdminTab(tab) {
    activeAdminTab = tab;
    const tabs = document.querySelectorAll('[data-admin-tab]');
    tabs.forEach(t => {
      if (t.getAttribute('data-admin-tab') === tab) {
        t.className = 'px-3 py-1.5 rounded-xl text-xs font-bold bg-brand text-white shadow-md shadow-brand/25 transition flex items-center gap-1.5';
      } else {
        t.className = 'px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-[#0c233f] border border-[#14355f] transition flex items-center gap-1.5';
      }
    });
    renderAdmin();
  }

  function resetSampleSeed() {
    seedInitialData();
    renderWall();
    renderAdmin();
    if (FH.toast) FH.toast('🔄 Re-seeded sample ads data for testing.');
  }

  // Navigation & Routing
  function openPromoWall() {
    location.hash = '#/promo-wall';
  }

  function closePromoWall() {
    if (location.hash === '#/promo-wall' || location.hash === '#promo-wall') {
      location.hash = '';
    } else {
      handleRoute();
    }
  }

  function closeAdmin() {
    if (location.hash === '#/admin' || location.hash === '#admin') {
      location.hash = '';
    } else {
      location.href = '/';
    }
  }

  function handleRoute() {
    const hash = location.hash;
    const pathname = location.pathname;
    const isAdmin = hash === '#/admin' || hash === '#admin' || pathname === '/admin' || pathname.endsWith('/admin');
    const isPromoWall = hash === '#/promo-wall' || hash === '#promo-wall';

    const wall = document.querySelector('#promoWallView');
    const admin = document.querySelector('#adminView');

    if (isAdmin) {
      if (wall) wall.classList.add('hidden');
      if (admin) admin.classList.remove('hidden');
      renderAdmin();
    } else if (isPromoWall) {
      if (admin) admin.classList.add('hidden');
      if (wall) wall.classList.remove('hidden');
      renderWall();
    } else {
      if (wall) wall.classList.add('hidden');
      if (admin) admin.classList.add('hidden');
    }
  }

  // Card Action: View On Map
  function viewOnMap(spotId, spotName, spotArea) {
    closePromoWall();

    // Reset hash if needed
    if (location.hash) {
      try { history.replaceState(null, '', location.pathname); } catch (e) {}
    }

    if (spotId && spotId !== 'null' && spotId !== 'undefined' && FH.store) {
      const spot = FH.store.get(spotId);
      if (spot) {
        FH.store.select(spotId);
        if (FH.map && typeof FH.map.focus === 'function') {
          setTimeout(() => FH.map.focus(spot), 250);
        }
        return;
      }
    }

    // Custom spot or unmapped spot
    if (FH.toast) {
      FH.toast(`${spotName} (${spotArea}) — Roadside spot in Dhaka`);
    }
  }

  // Copy Promo Code
  function copyCode(code) {
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      if (FH.toast) FH.toast(`Copied promo code: ${code}`);
    }).catch(() => {
      if (FH.toast) FH.toast(`Code: ${code}`);
    });
  }

  // Initialize
  function init() {
    loadState();

    // Start 1-second auto-expiry interval
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(checkExpirations, 1000);

    // Initial Route check
    handleRoute();
    window.addEventListener('hashchange', handleRoute);

    // Initial render
    renderWall();
  }

  // Public Interface on FH
  FH.adWall = {
    init,
    openPromoWall,
    closePromoWall,
    closeAdmin,
    openSubmitModal,
    updateLivePreview,
    handleFormSubmit,
    viewOnMap,
    copyCode,
    fastForwardExpiry,
    setFilter(cat) {
      activeFilter = cat;
      renderWall();
    },
    toggleAutoApprove,
    approveAd,
    rejectAd,
    forceExpireAd,
    forcePromoteQueue,
    deleteFromQueue,
    setAdminTab,
    resetSampleSeed
  };

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
