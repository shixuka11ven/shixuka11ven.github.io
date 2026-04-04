# Design System Specification

## 1. Overview & Creative North Star: "The Velvet Nocturne"

The Creative North Star for this design system is **"The Velvet Nocturne."** It is an intentional departure from the sterile, high-brightness interfaces of the modern web, moving instead toward a digital experience that feels like a curated gallery at midnight. Inspired by nighttime urban photography—where deep shadows are punctuated by soft, neon-hued glows—this system prioritizes atmosphere, depth, and sophistication.

To break the "template" look, designers must embrace **intentional asymmetry** and **high-contrast typography scales**. We do not build flat grids; we build environments. By overlapping glassmorphic containers and using expansive white space, we create a layout that feels editorial and premium, rather than utilitarian. The interface should feel as comfortable and immersive as ambient music.

---

## 2. Colors & Surface Philosophy

The color palette is built on a foundation of absolute depth, utilizing a range of dark neutrals and royal violets to simulate the layers of a night sky.

### The Palette
*   **Primary Background:** `surface_container_lowest` (#0e0e0e) or `background` (#131313).
*   **Accents:** `primary` (#d1bcff) and `primary_container` (#2e1065) for deep, royal purple gradients.
*   **Typography:** `on_surface` (#e5e2e1) for standard text and `pure white` (#FFFFFF) for high-impact headlines.

### The "No-Line" Rule
**Explicit Instruction:** Prohibit the use of 1px solid borders for sectioning or containment. Boundaries must be defined solely through background color shifts. Use `surface_container_low` sections sitting on a `surface` background to define distinct areas. 

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—stacked sheets of frosted glass. 
*   **Level 0:** `surface_dim` (#131313) - The canvas.
*   **Level 1:** `surface_container_low` (#1c1b1b) - Main content sections.
*   **Level 2:** `surface_container_high` (#2a2a2a) - Interactive cards and nested elements.

### The "Glass & Gradient" Rule
To achieve a signature look, floating elements (modals, dropdowns, navigation bars) must use **Glassmorphism**. Apply a semi-transparent `primary_container` (#2e1065) with a background blur of at least 20px. 

### Signature Textures
Main CTAs and Hero backgrounds should never be flat. Use subtle linear gradients transitioning from `primary_container` (#2E1065) to `surface_container_lowest` (#0E0E0E) at a 45-degree angle to provide "visual soul."

---

## 3. Typography: Editorial Authority

We use a dual-font strategy to balance character with readability.

*   **Display & Headlines (Epilogue):** Used for large-scale storytelling. The tight tracking and modern geometric feel of Epilogue in `display-lg` (3.5rem) or `headline-lg` (2rem) provides a bold, authoritative editorial voice.
*   **Body & UI Labels (Inter):** Used for functional clarity. Inter’s high x-height ensures that even at `body-sm` (0.75rem), metadata remains legible against the dark background.

**Hierarchy Tip:** Use `on_primary_container` (#987ed4) for sub-headers to create a soft, tonal relationship between the text and the purple accents.

---

## 4. Elevation & Depth

Hierarchy is achieved through **Tonal Layering** rather than structural lines.

*   **The Layering Principle:** Place a `surface_container_highest` card on a `surface_container_low` section. The slight shift in luminosity creates a soft, natural lift.
*   **Ambient Shadows:** For floating elements, use extra-diffused shadows. 
    *   *Shadow Color:* A tinted version of the background (e.g., #050505 at 40% opacity).
    *   *Blur:* 40px – 60px to mimic the way light falls in a dark urban environment.
*   **The Violet Glow:** Selection states and high-priority active elements should feature a subtle `outer-glow` using the `primary` (#d1bcff) token at 10-15% opacity.
*   **Ghost Border Fallback:** If a border is required for accessibility, use the `outline_variant` (#494550) at 15% opacity. Never use 100% opaque borders.

---

## 5. Components

### Buttons
*   **Primary:** `ROUND_FULL` (9999px). Background: Gradient of `primary_container` to `primary_fixed_variant`. Text: `pure white`. 
*   **Secondary:** `ROUND_FULL`. Glassmorphic background with a `ghost border` (#494550 at 20%).
*   **Interaction:** On hover, increase the "Violet Glow" intensity.

### Input Fields
*   **Styling:** Forgo the traditional box. Use a `surface_container_highest` fill with `ROUND_FULL` corners.
*   **Focus State:** A 1px glow using `primary` (#d1bcff). Helper text should use `on_surface_variant` (#cbc4d2).

### Cards & Lists
*   **Cards:** Use `ROUND_LG` (2rem) for standard cards and `ROUND_FULL` for small notification pills.
*   **The Divider Rule:** Strictly forbid divider lines. Separate list items using vertical white space (use `1.5rem` minimum) or a alternating tonal shift between `surface_container_low` and `surface_container_lowest`.

### Added Component: The Archive Grain
To enhance the "Nocturnal Archive" feel, apply a very low-opacity (.02) noise texture overlay to the entire background layer to simulate film grain from nighttime photography.

---

## 6. Do's and Don'ts

### Do
*   **DO** use extreme white space. The "Archive" feel requires room to breathe.
*   **DO** use `ROUND_FULL` for all interactive triggers (buttons, chips, toggles).
*   **DO** utilize the `tertiary` (#fdb78e) accent sparingly for "Error" or "Warning" states to mimic the warm amber of streetlights.

### Don't
*   **DON'T** use pure grey shadows; shadows must be "inked" with the deep purple of the background.
*   **DON'T** use sharp corners. Even the largest containers should have a minimum of `ROUND_LG` (2rem).
*   **DON'T** use high-contrast white text for everything. Reserve `pure white` for headers and use `on_surface_variant` for secondary text to maintain the moody atmosphere.