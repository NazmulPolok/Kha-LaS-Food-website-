# খাLaS

Map-based food discovery and community verification for Bangladesh. Plain HTML, Tailwind (CDN), Leaflet, FontAwesome, vanilla JS. No build step.

## Run
Open `index.html` in a browser, or serve the folder: `python -m http.server 8000`.
An internet connection is needed for the CDN libraries and map tiles.

## Features
- **Email-based User Accounts**: Users can register and sign in using their Email ID. Accounts are stored in `localStorage` with quick one-click test account switching.
- **Spot Photos (3 - 5 Pictures)**:
  - Every spot includes **3 to 5 authentic photos** showing food, menu, and dining ambience.
  - Interactive photo slider with thumbnail strip, prev/next navigation, and full-screen Lightbox modal.
  - Adding a new spot enforces **3 to 5 photos** (via device file upload with base64 conversion, web URLs, or quick sample presets).
  - Users can also contribute additional photos to any spot.
  - Sidebar list items show live photo thumbnails and photo counters.
- **Add New Food Spots with Interactive Draggable Pin Map**: Registered users can publish new spots with spot name, categories, type, price, delivery, description, 3-5 photos, and an interactive draggable pin map that automatically calculates exact Latitude and Longitude in real time.
- **Spot Verification / Confirmation System (No Upper Limit, Lower Limit = 25)**:
  - Minimum **25 community confirmations (lower limit)** required to unlock the official **Community Verified** (`✓`) badge.
  - **No upper limit**: as many users as want can confirm and verify any spot (unlimited growth, e.g. 50, 100, 500+).
  - To confirm a spot, an **email account is strictly required**.
  - Users can confirm authentic spots, view all confirming users, or undo their confirmation.
  - Filter toggle to view only verified spots (25+ confirms).
- **Interactive Leaflet Map & Pins**: Pins display ratings and verification badges (verified checkmark vs pending clock icon). Supports click-to-pick coordinates mode.
- **Ratings & Reviews**: 1.0 - 10.0 scale with real-time average calculation.
- **Facility Indicators (Booking & Delivery)**: Displays clear informational badges for Table Booking and Home Delivery. Defaults to "No Booking" and "No Delivery" unless explicitly enabled during spot creation or editing.
- **Edit Added Spots**: Users can edit any spot they created (change name, photos, pin coordinates on map, facilities, description) with changes saving instantly.
- **My Added Spots List**: Header displays "My Spots (X)" button showing total spots created by the user, opening a dedicated management modal with View on Map, Edit, and Delete actions.
- **Live Spot Chat**: In-memory / BroadcastChannel real-time chat between browser tabs.
