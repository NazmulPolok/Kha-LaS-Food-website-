/* ============================================================
   খাLaS — Internationalization (i18n) Engine (Bangla & English)
   ============================================================ */
(function () {
  window.FH = window.FH || {};

  const STORAGE_LANG = 'foodhub_lang';
  const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

  const DICTIONARY = {
    en: {
      tagline: 'Food craving? Just Kha-LaS!',
      theme_dark: 'Dark',
      theme_light: 'Light',
      ad_wall: 'Free Ad Wall',
      add_spot: 'Add Spot',
      add_cart: 'Add Cart',
      find_near_me: 'Find Near Me',
      hide_spots: 'Hide Spots',
      show_spots: 'Show Food Spots',
      search_placeholder: 'Search spot, food or type...',
      all_types: 'All Types',
      spot_type: 'Spot type',
      min_score: 'Min score',
      delivery: 'Delivery',
      booking: 'Booking',
      no_booking: 'No Booking',
      no_delivery: 'No Delivery',
      confirmed_spot_chip: 'Confirmed Spot (25+)',
      presence_legend: '25+ = Spot Confirmed (Presence)',
      open_now: 'Open',
      closed_now: 'Closed',
      reviews_count: 'reviews',
      spot_single: 'spot',
      spots_plural: 'spots',
      spot_confirmed: 'Spot Confirmed',
      location_pending: 'Location Pending',
      nearest_cart: 'Nearest cart',
      away: 'away',
      directions: 'Directions',
      book_table: 'Book Table',
      order_food: 'Order Food',
      review_food: 'Review Food',
      write_review: 'Write Food & Hygiene Review',
      ground_presence_title: 'Ground Presence Confirmation',
      ground_presence_badge: 'Location Check',
      ground_presence_note: '"Note: This ground confirmation is strictly to state whether the spot is in the 100% correct physical location on the map. It is not a food review."',
      ground_presence_desc: 'Since any user can pin a roadside cart, at least 25 community confirmations are required to prove the cart physically exists here and prevent fake locations.',
      ground_presence_rating: 'Ground Presence Rating',
      ground_rating_sub: 'Rating increases based on 25 community location confirmations',
      ground_verified_msg: 'Spot authenticity verified: {count} foodies have confirmed this cart physically exists here. (Unlimited confirmations)',
      ground_unverified_msg: 'Have you seen this food spot in person? Confirm below to verify its physical presence on the map ({remaining} more needed).',
      confirm_btn_done: 'You confirmed this spot physically exists here (Undo)',
      confirm_btn_action: 'This spot physically exists here — I confirm',
      confirm_btn_login: 'Sign in to confirm physical spot presence',
      separate_review_prompt: 'Separate Food Taste & Hygiene Reviews:',
      give_food_review: 'Review Food',
      confirmed_by_users: 'Confirmed by {count} foodie(s) (No limit)',
      view_list: 'View list',
      added_by: 'Added by:',
      creator: 'Creator',
      edit_spot: 'Edit Spot',
      delete_spot: 'Delete Spot',
      photos_count: 'Photos',
      menu_price: 'Price Range',
      contact_phone: 'Phone',
      address_label: 'Address',
      food_tags_label: 'Cuisines',
      spot_status_label: 'Status',
      food_and_hygiene_reviews: 'Food & Hygiene Reviews',
      food_taste_rating: 'Food Taste & Quality',
      hygiene_rating: 'Cart Hygiene & Cleanliness',
      no_reviews_yet: 'No food reviews yet. Be the first to share your experience!',
      write_review_modal_title: 'Write Food & Hygiene Review',
      taste_score_label: '1. Food Taste & Quality Rating (1 to 5 Stars)',
      hygiene_score_label: '2. Hygiene & Cleanliness Rating (1 to 5 Stars)',
      select_tags_label: '3. Foodie Highlights & Tags',
      comment_label: '4. Your Experience / Review Comment',
      comment_placeholder: 'Write about the food taste, portion size, hygiene, favorite items...',
      submit_review: 'Submit Review',
      submitting: 'Submitting...',
      cancel: 'Cancel',
      save: 'Save',
      auth_title: 'Sign In / Register',
      auth_desc: 'Sign in with your email to confirm spot locations and submit food reviews.',
      email_label: 'Email Address',
      password_label: 'Password',
      name_label: 'Full Name',
      login_btn: 'Sign In',
      signup_btn: 'Create Account',
      logout_btn: 'Sign Out',
      promo_wall_title: 'Free 24h Food Promo Wall',
      promo_wall_sub: 'Promote special discounts, new items, and combo offers free for 24 hours!',
      post_promo_btn: 'Post Offer Free',
      driving_mode: 'Driving',
      walking_mode: 'Walking',
      choose_origin: 'Choose Starting Point',
      my_location_gps: '📍 My Current Location (GPS)',
      destination_label: 'Destination:',
      fastest_route: 'Fastest route to destination',
      walking_route_note: 'Pedestrian & sidewalk route',
      turn_by_turn: 'Turn-by-turn navigation',
      steps_count: 'steps',
      open_gmaps: 'Start in Google Maps',
      route_loading: 'Calculating fastest route...',
      route_failed: 'Live routing temporarily unavailable. Showing direct path.',
      view_directions: 'Directions (Driving & Walking)',
      // Cuisines
      'Kabab': 'Kabab',
      'Biryani': 'Biryani',
      'Kacchi': 'Kacchi',
      'Fast Food': 'Fast Food',
      'Deshi': 'Deshi Food',
      'Indian': 'Indian',
      'Thai': 'Thai',
      'Chinese': 'Chinese',
      'Turkish': 'Turkish',
      'Malay': 'Malay',
      'Arabic': 'Arabic',
      // Types
      'Indoor': 'Indoor',
      'Outdoor': 'Outdoor',
      'Rooftop': 'Rooftop',
      'Street Food': 'Street Food',
      'Food Cart': 'Food Cart',
      'Buffet': 'Buffet',
      'Fine Dining': 'Fine Dining',
      'Cafe': 'Cafe'
    },
    bn: {
      tagline: 'খাবারের খোঁজ? ব্যস, খাLaS!',
      theme_dark: 'ডার্ক',
      theme_light: 'লাইট',
      ad_wall: 'ফ্রি অ্যাড ওয়াল',
      add_spot: 'স্পট যুক্ত করুন',
      add_cart: 'কার্ট যুক্ত করুন',
      find_near_me: 'নিকটবর্তী স্পট খুঁজুন',
      hide_spots: 'লিস্ট লুকান',
      show_spots: 'ফুড স্পট দেখুন',
      search_placeholder: 'রেস্টুরেন্ট, খাবার বা ধরন খুঁজুন...',
      all_types: 'সব ধরন',
      spot_type: 'স্পটের ধরন',
      min_score: 'সর্বনিম্ন স্কোর',
      delivery: 'ডেলিভারি',
      booking: 'বুকিং',
      no_booking: 'বুকিং নেই',
      no_delivery: 'ডেলিভারি নেই',
      confirmed_spot_chip: 'নিশ্চিত স্পট (২৫+)',
      presence_legend: '২৫+ = স্পট নিশ্চিত (উপস্থিতি)',
      open_now: 'খোলা',
      closed_now: 'বন্ধ',
      reviews_count: 'টি রিভিউ',
      spot_single: 'টি স্পট',
      spots_plural: 'টি স্পট',
      spot_confirmed: 'স্পট নিশ্চিত',
      location_pending: 'যাচাই বাকি',
      nearest_cart: 'সবচেয়ে কাছের কার্ট',
      away: 'দূরে',
      directions: 'দিকনির্দেশ',
      book_table: 'টেবিল বুকিং',
      order_food: 'অর্ডার করুন',
      review_food: 'খাবার রিভিউ',
      write_review: 'খাবার ও হাইজিন রিভিউ লিখুন',
      ground_presence_title: 'ম্যাপে স্পট উপস্থিতি নিশ্চিতকরণ',
      ground_presence_badge: 'লোকেশন চেক',
      ground_presence_note: '"নোট: এই নিশ্চিতকরণটি শুধুমাত্র ম্যাপে চিহ্নিত স্থানে স্পটটি বাস্তবে ১০০% সঠিক জায়গায় আছে কি না তা যাচাই করার জন্য। এটি কোনো খাবারের রিভিউ নয়।"',
      ground_presence_desc: 'যেহেতু যে কেউ ম্যাপে নতুন দোকান যুক্ত করতে পারে, তাই ফেক লোকেশন প্রতিরোধে এবং বাস্তবে অস্তিত্ব প্রমাণের জন্য অন্তত ২৫ জন স্থানীয় ব্যবহারকারীর নিশ্চিতকরণ প্রয়োজন।',
      ground_presence_rating: 'গ্রাউন্ড প্রেসেন্স রেটিং',
      ground_rating_sub: 'ম্যাপে ২৫ জনের কনফার্মেশনের উপর ভিত্তি করে রেটিং বৃদ্ধি পায়',
      ground_verified_msg: 'স্পটের সত্যতা প্রমাণিত: {count} জন খাদ্যরসিক নিশ্চিত করেছেন যে এই দোকানটি বাস্তবে ঠিক এই স্থানেই রয়েছে। (কোনো সর্বোচ্চ সীমা নেই)',
      ground_unverified_msg: 'আপনি কি এই স্থানে দোকানটি সশরীরে দেখেছেন? বাস্তবে উপস্থিতি নিশ্চিত করতে নিচে কনফার্ম করুন (আরো {remaining} জন প্রয়োজন)।',
      confirm_btn_done: 'আপনি স্পটটির বাস্তব উপস্থিতি নিশ্চিত করেছেন (Undo)',
      confirm_btn_action: 'দোকানটি বাস্তবে এখানে আছে — আমি কনফার্ম করছি',
      confirm_btn_login: 'লগইন করে স্পটের বাস্তব উপস্থিতি নিশ্চিত করুন',
      separate_review_prompt: 'খাবারের স্বাদ ও পরিচ্ছন্নতার আলাদা রিভিউ:',
      give_food_review: 'খাবার রিভিউ দিন',
      confirmed_by_users: '{count} জন ব্যবহারকারী নিশ্চিত করেছেন (আনলিমিটেড)',
      view_list: 'তালিকা দেখুন',
      added_by: 'যুক্ত করেছেন:',
      creator: 'নির্মাতা',
      edit_spot: 'স্পট এডিট করুন',
      delete_spot: 'স্পট মুছুন',
      photos_count: 'টি ছবি',
      menu_price: 'মূল্যসীমা',
      contact_phone: 'ফোন',
      address_label: 'ঠিকানা',
      food_tags_label: 'কুইজিন / খাবার',
      spot_status_label: 'অবস্থা',
      food_and_hygiene_reviews: 'খাবার ও হাইজিন রিভিউসমূহ',
      food_taste_rating: 'খাবারের স্বাদ ও মান',
      hygiene_rating: 'দোকান ও পরিবেশের পরিচ্ছন্নতা',
      no_reviews_yet: 'এখনও কোনো খাবারের রিভিউ জমা দেওয়া হয়নি। আপনিই প্রথম আপনার অভিজ্ঞতা জানান!',
      write_review_modal_title: 'খাবার ও হাইজিন রিভিউ লিখুন',
      taste_score_label: '১. খাবারের স্বাদ ও কোয়ালিটি রেটিং (১ থেকে ৫ স্টার)',
      hygiene_score_label: '২. হাইজিন ও পরিচ্ছন্নতা রেটিং (১ থেকে ৫ স্টার)',
      select_tags_label: '৩. হাইলাইটস ও ট্যাগ নির্বাচন করুন',
      comment_label: '৪. আপনার মন্তব্য বা অভিজ্ঞতা লিখুন',
      comment_placeholder: 'খাবারের স্বাদ, পরিমাণ, পরিচ্ছন্নতা এবং পছন্দের আইটেম সম্পর্কে লিখুন...',
      submit_review: 'রিভিউ জমা দিন',
      submitting: 'জমা হচ্ছে...',
      cancel: 'বাতিল',
      save: 'সংরক্ষণ করুন',
      auth_title: 'লগইন / রেজিস্টার',
      auth_desc: 'স্পটের অবস্থান নিশ্চিত করতে ও রিভিউ দিতে ইমেইল দিয়ে সাইন ইন করুন।',
      email_label: 'ইমেইল অ্যাড্রেস',
      password_label: 'পাসওয়ার্ড',
      name_label: 'পূর্ণ নাম',
      login_btn: 'লগইন করুন',
      signup_btn: 'অ্যাকাউন্ট খুলুন',
      logout_btn: 'লগআউট',
      promo_wall_title: 'ফ্রি ২৪ ঘণ্টার ফুড অফার বোর্ড',
      promo_wall_sub: 'আপনার রেস্টুরেন্টের যেকোনো বিশেষ ছাড়, নতুন খাবার বা কম্বো অফার ২৪ ঘণ্টার জন্য ফ্রি পোস্ট করুন!',
      post_promo_btn: 'অফার পোস্ট করুন (ফ্রি)',
      driving_mode: 'গাড়ি (Driving)',
      walking_mode: 'হাঁটা (Walking)',
      choose_origin: 'শুরুর স্থান নির্বাচন করুন',
      my_location_gps: '📍 আমার বর্তমান লোকেশন (GPS)',
      destination_label: 'গন্তব্য:',
      fastest_route: 'সবচেয়ে দ্রুত ও সুবিধাজনক রুট',
      walking_route_note: 'হাঁটার ও ফুটপাত পথ',
      turn_by_turn: 'ধাপে ধাপে দিকনির্দেশনা',
      steps_count: 'টি ধাপ',
      open_gmaps: 'গুগল ম্যাপে শুরু করুন',
      route_loading: 'সবচেয়ে দ্রুত রুট বের করা হচ্ছে...',
      route_failed: 'লাইভ রুট পাওয়া যায়নি। সরাসরি পথ প্রদর্শিত হচ্ছে।',
      view_directions: 'দিকনির্দেশ (গাড়ি ও হাঁটার রুট)',
      // Cuisines
      'Kabab': 'কাবাব',
      'Biryani': 'বিরিয়ানি',
      'Kacchi': 'কাচ্চি',
      'Fast Food': 'ফাস্ট ফুড',
      'Deshi': 'দেশি খাবার',
      'Indian': 'ইন্ডিয়ান',
      'Thai': 'থাই',
      'Chinese': 'চাইনিজ',
      'Turkish': 'তুর্কি',
      'Malay': 'মালয়',
      'Arabic': 'অ্যারাবিক',
      // Types
      'Indoor': 'ইনডোর',
      'Outdoor': 'আউটডোর',
      'Rooftop': 'রুফটপ',
      'Street Food': 'স্ট্রিট ফুড',
      'Food Cart': 'ফুড কার্ট',
      'Buffet': 'বুফে',
      'Fine Dining': 'ফাইন ডাইনিং',
      'Cafe': 'ক্যাফে'
    }
  };

  FH.i18n = {
    get() {
      try {
        return localStorage.getItem(STORAGE_LANG) || 'bn';
      } catch (e) {
        return 'bn';
      }
    },

    set(lang) {
      if (lang !== 'bn' && lang !== 'en') lang = 'bn';
      try {
        localStorage.setItem(STORAGE_LANG, lang);
      } catch (e) {}

      document.documentElement.setAttribute('lang', lang);

      // Update Header language toggle button text and label
      const btnText = document.getElementById('lang-toggle-text');
      const btn = document.getElementById('btn-lang-toggle');
      if (btnText) {
        // Displays 'বাং' when in English, 'EN' when in Bangla
        btnText.textContent = lang === 'bn' ? 'EN' : 'বাং';
      }
      if (btn) {
        btn.setAttribute('title', lang === 'bn' ? 'Switch to English' : 'বাংলায় পরিবর্তন করুন');
      }

      this.apply();
    },

    toggle() {
      const next = this.get() === 'bn' ? 'en' : 'bn';
      this.set(next);
      if (typeof FH.toast === 'function') {
        FH.toast(next === 'bn' ? 'ভাষা পরিবর্তন করা হয়েছে: বাংলা' : 'Language switched to English');
      }
    },

    t(key, fallback = '') {
      const current = this.get();
      const dict = DICTIONARY[current] || DICTIONARY.en;
      if (dict && dict[key] != null) return dict[key];
      const enDict = DICTIONARY.en;
      if (enDict && enDict[key] != null) return enDict[key];
      return fallback || key;
    },

    num(val) {
      if (val == null) return '';
      const s = String(val);
      if (this.get() !== 'bn') return s;
      return s.replace(/[0-9]/g, d => BENGALI_DIGITS[Number(d)]);
    },

    apply() {
      // 1. Static DOM elements marked with data-i18n
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const text = this.t(key);
        if (text) el.textContent = text;
      });

      // 2. Placeholders
      document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        const text = this.t(key);
        if (text) el.placeholder = text;
      });

      // 3. Titles / tooltips
      document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        const text = this.t(key);
        if (text) el.title = text;
      });

      // 4. Update Header Subtitle
      const sub = document.querySelector('#header-subtitle');
      if (sub) sub.textContent = this.t('tagline');

      // 5. Update Theme toggle text
      const themeText = document.querySelector('#theme-toggle-text');
      if (themeText && FH.theme) {
        const mode = FH.theme.get();
        themeText.textContent = this.t(mode === 'light' ? 'theme_light' : 'theme_dark');
      }

      // 6. Update Near Me label
      const nearLabel = document.querySelector('[data-near-label]');
      if (nearLabel) nearLabel.textContent = this.t('find_near_me');

      // 7. Update Add Cart label
      const quickAddLabel = document.querySelector('#btn-quick-add span');
      if (quickAddLabel) quickAddLabel.textContent = this.t('add_cart');

      // 8. Re-mount sidebar filters with translated labels
      const filtersEl = document.getElementById('filters');
      if (filtersEl && FH.filters && typeof FH.filters.mount === 'function') {
        const qEl = document.getElementById('q');
        const qVal = qEl ? qEl.value : '';
        FH.filters.mount(filtersEl);
        if (qVal && document.getElementById('q')) {
          document.getElementById('q').value = qVal;
        }
      }

      // 9. Re-render Spot list with translated badges, cards, and counts
      if (FH.store && typeof FH.store.emit === 'function') {
        FH.store.emit();
      }

      // 10. Update spot details modal if currently open
      if (FH.store && FH.store.S && FH.store.S.sel && window.FH_reopenSelectedModal) {
        window.FH_reopenSelectedModal();
      }
    },

    init() {
      const current = this.get();
      this.set(current);
    }
  };

  // Global helper shortcuts
  FH.t = (k, f) => FH.i18n.t(k, f);
  FH.num = n => FH.i18n.num(n);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => FH.i18n.init());
  } else {
    FH.i18n.init();
  }
})();
