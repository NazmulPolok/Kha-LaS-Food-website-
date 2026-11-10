# AI Agent Directives - FoodHub Map System

## Core Responsibility
Maintain, extend, and debug the FoodHub Map application context. Ensure zero regression across map pins, search logic, dynamic modal popups, and user action workflows.

## System Boundaries & Logic Rules
1. **Restaurant Categories**: Indoor, Outdoor, Rooftop, Street Food, Food Cart, Buffet, Fine Dining, Cafe.
2. **Food Taxonomy**: Biryani, Kacchi, Kabab, Fast Food, Deshi, Indian, Thai, Chinese, Malay, Arabic, Turkish.
3. **Feature Toggles**:
   - Advance Booking IS NOT available for Street Food/Carts (disable button dynamically).
   - Delivery Options support 2 models: "Direct Vendor Call" & "Aggregator Deep-link" (Foodpanda/Pathao).
4. **Chat Logic**:
   - Each spot has a `spotId` message bucket.
   - User handles default to anonymous foodie tags if not specified.
