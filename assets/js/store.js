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
  P('s1',"Sultan's Dine — Dhanmondi",23.7461,90.3752,["Kacchi", "Biryani"],'Indoor',9.4,3420,'৳৳',150,'both','open','+8801700000001','Legendary Kacchi Biryani cooked with fragrant chinigura rice, succulent farm mutton, and saffron potato. Served with rich borhani and shahi jorda.', genConfirms(94, 'foodie'), 'system', ["https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=800&auto=format&fit=crop&q=80"], true),
  P('s2',"Kacchi Bhai — Dhanmondi",23.7428,90.3734,["Kacchi", "Biryani"],'Indoor',9.1,2180,'৳৳',150,'both','open','+8801700000002','Famous Basmati mutton kacchi with signature slow-cooked tenderness, golden boiled egg, salad, and chilled borhani.', genConfirms(78, 'kacchi'), 'system', ["https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=800&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&auto=format&fit=crop&q=80"], true),
  P('s3',"Star Kabab & Restaurant — Dhanmondi",23.7402,90.3748,["Kabab", "Biryani", "Deshi"],'Indoor',8.9,4150,'৳৳',100,'both','open','+8801700000003','Dhaka\'s household favorite for charcoal-grilled seekh kababs, mutton boti, butter naan, mutton leg roast, and creamy faluda.', genConfirms(88, 'star'), 'system', ["https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80"], true),
  P('s4',"Takeout — Dhanmondi",23.7482,90.3756,["Fast Food"],'Indoor',8.8,1890,'৳৳',0,'both','open','+8801700000004','Pioneer of Dhaka gourmet burgers: Beef Cheese Delight, Mushroom Caramel, and twister fries with signature spicy mayo.', genConfirms(65, 'takeout'), 'system', ["https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop&q=80"], false),
  P('s5',"Chillox — Dhanmondi",23.7495,90.3741,["Fast Food"],'Indoor',8.7,2400,'৳৳',0,'both','open','+8801700000005','Juicy smashed beef patties, overloaded melted cheese, buffalo wings, potato wedges, and chilled Oreo milkshakes.', genConfirms(72, 'chillox'), 'system', ["https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800&auto=format&fit=crop&q=80"], false),
  P('s6',"North End Coffee Roasters — Dhanmondi",23.7535,90.3732,["Deshi", "Fast Food"],'Cafe',9.3,1620,'৳৳৳',0,'aggregator','open','+8801700000006','Artisan single-origin Bangladeshi and international pour-over coffee, iced caramel lattes, brownies, and freshly baked cinnamon rolls.', genConfirms(59, 'coffee'), 'system', ["https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80"], false),
  P('s7',"Lakeside Fuchka Cart — Dhanmondi",23.746,90.376,["Deshi"],'Food Cart',8.9,960,'৳',0,'none','open','+8801700000007','Crispy golden fuchka shells packed with spicy yellow peas, grated boiled egg, and served with four custom sour tamarind and mint dips by Dhanmondi Lake.', genConfirms(64, 'fuchka'), 'system', ["https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80"], false),
  P('s8',"Cafe Mehfil — Dhanmondi",23.739,90.375,["Indian", "Deshi"],'Cafe',9.2,780,'৳৳৳',200,'aggregator','open','+8801700000008','Serene heritage ambiance with vintage lamps serving Kolkata-style clay cup matka chai, reshmi kebabs, and handcrafted desserts.', genConfirms(48, 'mehfil'), 'system', ["https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80"], true),
  P('s9',"Sultan's Dine — Gulshan 2",23.7938,90.415,["Kacchi", "Biryani"],'Indoor',9.5,2980,'৳৳',150,'both','open','+8801700000009','Gulshan branch of Sultan\'s Dine, famous for its royal wedding-style aromatic mutton kacchi platter, zafrani borhani, and firni.', genConfirms(92, 'sultan_g'), 'system', ["https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80"], true),
  P('s10',"Nando's — Gulshan 2",23.7925,90.4162,["Fast Food", "Arabic"],'Indoor',9.0,1850,'৳৳৳',300,'both','open','+8801700000010','South African flame-grilled Peri-Peri chicken basted in lemon & herb, medium, or extra hot Peri sauce with spicy rice and coleslaw.', genConfirms(68, 'nandos'), 'system', ["https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800&auto=format&fit=crop&q=80"], true),
  P('s11',"Gloria Jean's Coffees — Gulshan 1",23.7785,90.4152,["Fast Food", "Deshi"],'Cafe',8.9,1420,'৳৳৳',0,'aggregator','open','+8801700000011','Premium international Australian coffeehouse serving handcrafted espresso, Voltage chillers, gourmet sandwiches, and all-day breakfast.', genConfirms(54, 'gloria'), 'system', ["https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&auto=format&fit=crop&q=80"], false),
  P('s12',"Woodhouse Grill — Gulshan 2",23.7885,90.4156,["Fast Food", "Kabab"],'Fine Dining',9.3,890,'৳৳৳৳',600,'vendor','open','+8801700000012','Dhaka\'s premier steakhouse featuring USDA prime ribeye, tenderloin, smoked brisket, mashed potatoes, and house-made truffle butter.', genConfirms(61, 'woodhouse'), 'system', ["https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80"], true),
  P('s13',"Izumi Japanese Kitchen — Gulshan 2",23.7952,90.4192,["Thai", "Chinese"],'Fine Dining',9.5,670,'৳৳৳৳',1000,'none','open','+8801700000013','Serene zen garden setting offering authentic Japanese cuisine: salmon sashimi, nigiri sushi, robata grill, tempura, and wagyu beef.', genConfirms(44, 'izumi'), 'system', ["https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&auto=format&fit=crop&q=80"], true),
  P('s14',"Madchef — Gulshan",23.7798,90.4182,["Fast Food"],'Indoor',8.8,1560,'৳৳',0,'both','open','+8801700000014','Famous for bold gourmet burgers like the Madame Lucy, Dhoni Smash, crispy peri-peri chicken tenders, and loaded cheese fries.', genConfirms(57, 'madchef'), 'system', ["https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop&q=80"], false),
  P('s15',"Baton Rouge — Gulshan 1",23.7802,90.4172,["Buffet", "Indian", "Chinese"],'Buffet',8.6,2100,'৳৳৳',400,'none','open','+8801700000015','Grand buffet dining with over 101 dishes featuring Indian tandoori, kebabs, Thai soups, Chinese dim sum, and extensive dessert counter.', genConfirms(73, 'baton'), 'system', ["https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80"], true),
  P('s16',"Skyline Rooftop Grill — Gulshan",23.793,90.414,["Kabab", "Arabic"],'Rooftop',8.7,950,'৳৳৳৳',500,'vendor','open','+8801700000016','Open-air charcoal grill with 360-degree panoramic skyline views over Gulshan Lake. Live acoustic musical performances every weekend.', genConfirms(52, 'skyline'), 'system', ["https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80"], true),
  P('s17',"Sultan's Dine — Banani",23.792,90.404,["Kacchi", "Biryani"],'Indoor',9.4,2350,'৳৳',150,'both','open','+8801700000017','Banani branch on Road 11 serving traditional slow-cooked mutton kacchi, chicken roast, jorda, and chilled spiced borhani.', genConfirms(85, 'sultan_b'), 'system', ["https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80"], true),
  P('s18',"Star Kabab & Restaurant — Banani",23.7915,90.4038,["Kabab", "Biryani", "Deshi"],'Indoor',9.0,3100,'৳৳',100,'both','open','+8801700000018','Renowned for fresh morning paratha nehari, mutton boti, reshmi kebab, chicken tikka, biryani, and rich kheer.', genConfirms(79, 'star_b'), 'system', ["https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80"], true),
  P('s19',"The Pit Grill — Banani",23.7908,90.4045,["Kabab", "Fast Food"],'Indoor',9.1,1120,'৳৳৳',400,'both','open','+8801700000019','Smoky Texas-style BBQ ribs, grilled T-bone steaks, pulled beef sliders, garlic mashed potatoes, and cream corn.', genConfirms(56, 'pitgrill'), 'system', ["https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80"], true),
  P('s20',"Banani Thai Garden",23.7935,90.4025,["Thai"],'Outdoor',8.8,890,'৳৳৳',300,'aggregator','open','+8801700000020','Tranquil garden dining surrounded by bamboo trees. Signature Tom Yum Goong, Pad Thai, Green Curry, and sticky mango rice.', genConfirms(42, 'thaigarden'), 'system', ["https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&auto=format&fit=crop&q=80"], true),
  P('s21',"Crimson Cup Coffee — Banani",23.7922,90.4055,["Deshi", "Fast Food"],'Cafe',9.2,1350,'৳৳৳',0,'both','open','+8801700000021','American specialty coffee chain in Banani 11 serving handcrafted Mocha Caravellas, frozen smoothies, paninis, and red velvet cake.', genConfirms(63, 'crimson'), 'system', ["https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80"], false),
  P('s22',"Pizza Guy — Banani",23.7912,90.4068,["Fast Food", "Indian"],'Indoor',9.1,990,'৳৳৳',0,'both','open','+8801700000022','Authentic New York style giant slice pizza with crispy foldable crust, pepperoni, mozzarella string pull, and garlic dipping sauce.', genConfirms(51, 'pizzaguy'), 'system', ["https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80"], false),
  P('s23',"Haji Biryani — Nazira Bazar",23.7142,90.4024,["Biryani", "Deshi"],'Street Food',9.5,5800,'৳৳',0,'both','open','+8801700000023','Established in 1939 in Old Dhaka. Authentic mutton tehari cooked in mustard oil, served in traditional dried leaf plates with green chilies.', genConfirms(96, 'haji'), 'system', ["https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80"], false),
  P('s24',"Nanna Biryani — Becharam Deuri",23.7182,90.3988,["Biryani", "Deshi"],'Indoor',9.3,3450,'৳৳',100,'both','open','+8801700000024','Old Dhaka\'s beloved Morog Polao destination, famed for tender chicken quarters in fragrant ghee rice, accompanied by shahi borhani.', genConfirms(82, 'nanna'), 'system', ["https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&auto=format&fit=crop&q=80"], true),
  P('s25',"Beauty Lassi & Faluda — Johnson Road",23.7115,90.4102,["Deshi"],'Street Food',9.6,4900,'৳',0,'none','open','+8801700000025','Serving Dhaka since 1922. Famous sweet yogurt lassi beaten with ice, royal kulfi faluda with noodles & raisins, and refreshing lemon sherbet.', genConfirms(98, 'beauty'), 'system', ["https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&auto=format&fit=crop&q=80"], false),
  P('s26',"Bismillah Kabab Ghor — Nazira Bazar",23.7151,90.4018,["Kabab", "Deshi"],'Street Food',9.2,2850,'৳',0,'none','open','+8801700000026','Old Dhaka\'s late-night sensation: sizzling beef chaap fried in mustard oil, khiri kabab, boti kabab, and hot puffed luchis.', genConfirms(77, 'bismillah'), 'system', ["https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80"], false),
  P('s27',"Grand Nawab — Lalbagh",23.7198,90.3882,["Kacchi", "Biryani"],'Indoor',9.2,1650,'৳৳',150,'both','open','+8801700000027','Situated beside historical Lalbagh Fort. Dum pukht kacchi biryani, badami jorda, shahi tukra, and royal Mughal delicacies.', genConfirms(64, 'nawab'), 'system', ["https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=800&auto=format&fit=crop&q=80"], true),
  P('s28',"Al Razzak Restaurant — Bangshal",23.7175,90.4055,["Biryani", "Deshi", "Kabab"],'Indoor',9.1,2400,'৳৳',100,'both','open','+8801700000028','Iconic Old Dhaka institution famed for mutton gluttony, shahi morog polao, tender mutton rezala, brain fry, and thick tandoor roti.', genConfirms(71, 'razzak'), 'system', ["https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&auto=format&fit=crop&q=80"], true),
  P('s29',"Sultan's Dine — Uttara",23.8682,90.3985,["Kacchi", "Biryani"],'Indoor',9.4,2750,'৳৳',150,'both','open','+8801700000029','Uttara Sector 7 flagship serving royal basmati mutton kacchi, golden roasted chicken, zafrani borhani, and shahi firni.', genConfirms(89, 'sultan_u'), 'system', ["https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80"], true),
  P('s30',"Star Kabab & Restaurant — Uttara",23.8612,90.3992,["Kabab", "Biryani", "Deshi"],'Indoor',9.0,3600,'৳৳',100,'both','open','+8801700000030','Busy Uttara hub for authentic beef and mutton seekh kababs, tandoori chicken, butter naan, mutton leg roast, and fresh morning halwa-puri.', genConfirms(81, 'star_u'), 'system', ["https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80"], true),
  P('s31',"Chillox — Uttara",23.8742,90.3932,["Fast Food"],'Indoor',8.8,1850,'৳৳',0,'both','open','+8801700000031','Gareeb-e-Nawaz favorite for hearty double beef cheese burgers, crispy chicken tenders, loaded wedges, and milkshakes.', genConfirms(66, 'chillox_u'), 'system', ["https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80"], false),
  P('s32',"Dragon Wok — Uttara",23.874,90.399,["Chinese", "Malay", "Thai"],'Buffet',8.6,850,'৳৳',250,'aggregator','open','+8801700000032','Grand Asian lunch and dinner buffet featuring over 35 items including wok noodles, prawn tempura, Thai soups, and dessert assortments.', genConfirms(45, 'dragon'), 'system', ["https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80"], true),
  P('s33',"Secret Recipe — Uttara",23.8635,90.4005,["Fast Food", "Malay"],'Indoor',8.9,1200,'৳৳৳',300,'both','open','+8801700000033','Malaysian international cafe chain renowned for signature cheesecakes, pasta aglio olio, grilled salmon, and Cornish pasties.', genConfirms(58, 'secret'), 'system', ["https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80"], true),
  P('s34',"Mohammadpur Kabab Hub",23.758,90.36,["Kabab", "Turkish"],'Indoor',8.7,1420,'৳৳',200,'both','open','+8801700000034','Authentic seekh, shami, boti kababs, and hot butter-brushed tandoor naan straight out of the clay oven in Mohammadpur.', genConfirms(62, 'kabab_m'), 'system', ["https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80"], true),
  P('s35',"Star Kabab & Restaurant — Mirpur 2",23.8052,90.3621,["Kabab", "Biryani", "Deshi"],'Indoor',8.9,2890,'৳৳',100,'both','open','+8801700000035','Mirpur 2 branch of Star Kabab serving iconic spicy beef boti, mutton khichuri, fresh chicken roast, and sweet curd faluda.', genConfirms(74, 'star_m'), 'system', ["https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80"], true),
  P('s36',"Pizzaburg — Mirpur 10",23.8072,90.3688,["Fast Food"],'Indoor',8.8,2100,'৳',0,'both','open','+8801700000036','Popular youth destination for affordable oven-baked cheesy pizzas, chicken wings, garlic bread, and loaded pasta platters.', genConfirms(69, 'pizzaburg'), 'system', ["https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80"], false),
  P('s37',"Tradition BD — Khilgaon",23.7532,90.4225,["Deshi", "Biryani"],'Indoor',9.0,1650,'৳৳',150,'both','open','+8801700000037','Khilgaon Food Street favorite for traditional Bangladeshi feast: beef bhuna, shutki vorta, duck curry with steamed rice and khichuri.', genConfirms(67, 'tradition'), 'system', ["https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&auto=format&fit=crop&q=80"], true),
  P('s38',"Alfresco — Khilgaon",23.7521,90.4234,["Fast Food", "Thai"],'Indoor',8.9,1480,'৳৳',200,'both','open','+8801700000038','Chic Khilgaon restaurant serving creamy fettuccine Alfredo, spicy Thai chicken sizzler, four-cheese pizza, and strawberry mocktails.', genConfirms(58, 'alfresco'), 'system', ["https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80"], true),
  P('s39',"Kasturi Restaurant — Purana Paltan",23.7312,90.4145,["Deshi"],'Indoor',9.2,3100,'৳৳',150,'both','open','+8801700000039','Dhaka\'s gold standard for authentic Bengali cuisine: freshwater Ilish macher jhol, chitol macher muitha, beef bot bhuna, and 12 varieties of freshly ground vorta.', genConfirms(83, 'kasturi'), 'system', ["https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80"], true),
  P('s40',"Neel Pori Duck Curry — 300 Feet",23.8342,90.4725,["Deshi"],'Outdoor',9.1,2450,'৳৳',0,'none','open','+8801700000040','Famous highway open-air restaurant on 300 Feet Express Highway serving rich spicy duck curry with chui jhal, hot steamed atash chal bhaat, and bamboo chicken.', genConfirms(76, 'neelpori'), 'system', ["https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80"], false),
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
