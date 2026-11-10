# Claude AI Guidelines - FoodHub Map

## Project Vision
FoodHub Map is an interactive, hyper-local food discovery SPA built for Bangladesh's food culture. It features Leaflet maps, 1-10 ratings, advance booking, delivery routing, and live spot community chat.

## Coding Principles
1. **Single File / Modular Execution**: Keep HTML/JS clean, avoiding unnecessary external dependencies beyond Tailwind CSS & Leaflet.
2. **Mobile First UI**: Ensure bottom-sheets and side drawers work smoothly on mobile screens.
3. **Rating Standards**: ALWAYS strictly use a 1.0 - 10.0 scale with color thresholds (Emerald >=9.0, Lime >=7.5, Yellow >=5.5, Red <5.5).
4. **Interactive State**: State updates (new chat message, new rating, filter toggle) must reflect immediately on both map markers and sidebar UI.

## Frequently Used Features
- `map.js`: Leaflet pin initialization with custom HTML markers (showing rating badge + logo).
- `booking.js`: Opens booking modal with slot picker & token fee estimator.
- `community.js`: In-memory live chat feed per spot id.
