/* ============================================================
   খাLaS — Runtime configuration
   ------------------------------------------------------------
   Mapbox's public token is optional. Database settings stay on the server
   in DATABASE_URL and are never exposed to browser JavaScript.

   See docs/SETUP.md for step-by-step instructions.
   ============================================================ */
window.FH_CONFIG = {
  /* Mapbox — https://account.mapbox.com/access-tokens/ */
  MAPBOX_TOKEN: '',

  /* Optional map styling (you can point these at your own Mapbox styles) */
  MAP_STYLE_DARK: 'mapbox://styles/mapbox/dark-v11',
  MAP_STYLE_LIGHT: 'mapbox://styles/mapbox/light-v11',

  /* Default map centre: Dhaka, Bangladesh [lng, lat] */
  DEFAULT_CENTER: [90.395, 23.775],
  DEFAULT_ZOOM: 12,

  /* Distance search radius is unlimited; this only controls the map fit padding */
  NEAR_ME_MAX_ZOOM: 15
};
