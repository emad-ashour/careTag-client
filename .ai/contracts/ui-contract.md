# CareTag UI/UX Master Contract (High-Contrast Edition)

## 1. Core Philosophy
The CareTag design system prioritizes absolute clarity, high-contrast readability, and accessibility. It relies on sharp borders, deep text colors, and generous white space to prevent visual fatigue for mechanics in poor lighting and car owners in bright sunlight.

## 2. Design Tokens

### Colors (High-Contrast Enforced)
Strictly adhere to this limited palette. DO NOT use light or muted grays for readable text.
* **Primary Brand (Forest Green):** `#0D7A41` (Used for primary buttons, active states, map pins, and highlighted icons).
* **Primary Background (Pure White):** `#FFFFFF` (Used for the main app background).
* **Surface Cards (Crisp Off-White):** `#F1F5F9` (Used for separating list items and vehicle specs).
* **Highlight Background (Mint Light):** `#E8F5E9` (Used for subtle active states or alert banners).
* **Text Primary (Deep Slate/Near Black):** `#0F172A` (Used for all headings, main data points, and vehicle names. Ensures maximum sharpness).
* **Text Secondary (Solid Charcoal):** `#334155` (Used for subtitles, timestamps, and placeholders. DO NOT use lighter grays to prevent blurriness).
* **Crisp Borders (Slate Outline):** `#CBD5E1` (Used for inputs, card borders, and dividers instead of blurry drop shadows).

### Typography & Legibility
* **Font Family:** Use a clean, modern sans-serif (`Inter`, `SF Pro Display`, or `Roboto`).
* **Font Weights (CRITICAL):** Never use `Light` or `Thin` font weights. Use `Regular` (400) for standard body text, `Medium` (500) for secondary text/subtitles to maintain crispness, and `Bold` (700) for headings.
* **Headings:** Distinct and prominent (e.g., `font-bold`, `text-xl` to `text-3xl`).
* **Body:** Highly legible (e.g., `text-sm` or `text-base`).

### Spacing & Borders
* **Border Radius (Buttons):** Fully rounded "pill" shapes (`rounded-full` or `borderRadius: 9999`).
* **Border Radius (Cards & Inputs):** Soft rounded corners (`rounded-xl` or `borderRadius: 12`).
* **Shadows:** Avoid heavy, diffuse drop shadows. Rely on the `#CBD5E1` border color for crisp visual separation of elements.
* **Spacing:** Use generous padding (`p-4` or `p-6`) to ensure oversized touch targets for mechanics.

## 3. Component Architecture Rules

### Buttons
* **Primary Action Button:** Must stretch across the bottom of the screen (or container), use the Primary Forest Green background, white bold text, and a fully rounded pill shape.
* **Secondary/Tertiary Buttons:** Use text-only or crisply outlined buttons in Primary Green or Deep Slate.

### Inputs & Forms
* Search bars and location inputs must have a sharp `#CBD5E1` border with deeply rounded corners. 
* Icons inside inputs should be tinted Primary Green or Deep Slate.
* Placeholder text must use the `#334155` color for high visibility.

### Map Interfaces
* **Map Style:** Minimalist, high-contrast light-themed map.
* **Markers:** Use custom markers consisting of a Primary Green circle/teardrop with a sharp, clear white internal icon.

## 4. Framework Implementations

* **For Next.js / Tailwind (Admin/Web):** Map these tokens directly into `tailwind.config.js`. Remove any default Tailwind shadows (`shadow-md`, `shadow-lg`) and replace them with border utility classes (`border border-slate-300`).
* **For React Native (Agency/Client Apps):** Update the central `theme.ts` file to reflect these darker text hex codes and remove elevation/shadow props, favoring explicit border styling for clarity.