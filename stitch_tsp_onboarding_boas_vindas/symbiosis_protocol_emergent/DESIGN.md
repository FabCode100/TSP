# Design System: The Emergent Twin Protocol

## 1. Overview & Creative North Star
**Creative North Star: The Celestial Archivist**
This design system rejects the "app-as-a-utility" aesthetic in favor of "app-as-an-artifact." The interface should feel like a high-end digital telescope or a rare manuscript: precise, authoritative, and deeply atmospheric. 

We achieve this through **Intentional Asymmetry** and **Tonal Depth**. By placing high-precision monospace data (`DM Mono`) alongside the elegant, sweeping curves of `Cormorant Garamond`, we create a tension between human intuition and machine logic. We break the standard grid by using generous "void" spaces (OLED Black) and overlapping elements that suggest a UI that is "emerging" rather than just static.

---

## 2. Colors: The Pulse and the Void
The palette is built on a foundation of absolute darkness, allowing the accents to feel like light sources rather than flat colors.

| Token | Hex | Role |
| :--- | :--- | :--- |
| `surface` | #050508 | The Void. Deepest OLED black for maximum contrast. |
| `primary` (Pulse) | #7B9CFF | Action and Life. Used for the 'Emergent Twin' active state. |
| `secondary` (Synapse) | #A78BFA | Connection. Used for progress and secondary interactions. |
| `on-surface` (Signal) | #E8E4D9 | The Narrative. Warm off-white for all primary reading. |
| `surface-container` | #131317 | Subtle elevation for cards and sheets. |

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to define sections. Traditional borders clutter the "Emergent" aesthetic. Boundaries must be defined solely through:
1.  **Background Shifts:** Use `surface-container-low` (#1B1B1F) against the `surface` (#050508) background.
2.  **Negative Space:** Use the Spacing Scale (specifically `8` to `12`) to separate content clusters.

### The Glass & Gradient Rule
For the 'Twin' FAB and high-priority action cards, utilize **Glassmorphism**. Apply a background blur (20px-40px) to semi-transparent variations of `primary-container` (#7B9CFF at 15% opacity). This creates a "frosted lens" effect that feels premium and integrated into the OLED background.

---

## 3. Typography: The Editorial Scale
Typography is our primary tool for hierarchy. We use a "High-Contrast Scale" to ensure the interface feels like a luxury publication.

*   **Display & Headlines (`Cormorant Garamond`):** Use for "Emergent Twin" status and feature titles. It should be large, airy, and elegant. 
    *   *Constraint:* Never use All-Caps for this typeface.
*   **Body (`Instrument Serif`):** Use for narrative descriptions and activation details. It provides a more legible, modern serif experience than the display font while maintaining the editorial soul.
*   **Labels & Stats (`DM Mono`):** Use for all technical data, progress percentages, and criteria lists. 
    *   *Constraint:* Always use uppercase for `label-sm` to evoke a "system readout" feel.

---

## 4. Elevation & Depth: Tonal Layering
In this system, depth is "grown," not "stamped."

*   **The Layering Principle:** Avoid traditional shadows. To lift a card, place a `surface-container-high` (#2A292E) element onto the `surface` (#050508). The high contrast between the OLED black and the deep grey creates a natural, sophisticated lift.
*   **Ambient Shadows:** If a floating element (like a Bottom Sheet) requires a shadow, use a large blur (40px) with the shadow color set to a 10% opacity version of `primary` (#7B9CFF). This mimics a "glow" rather than a drop-shadow.
*   **The Ghost Border Fallback:** If a boundary is strictly required for accessibility, use the `outline-variant` (#444652) at **15% opacity**. It should be felt, not seen.

---

## 5. Components: The Protocol Elements

### The Twin FAB (Signature Component)
The core interaction point for the feature.
*   **Locked State:** `surface-container` background, 40% opacity. Icon: `lock`. No pulse animation.
*   **Active State:** Two overlapping stroke circles (1px thickness). The inner circle is `primary` (Pulse), the outer is `secondary` (Synapse). Apply a continuous, slow scale animation (1.0 to 1.1) to create a "breathing" effect.

### Action Cards
*   **Geometry:** `xl` (1.5rem / 24px) corner radius. 
*   **Style:** No borders. Use `surface-container-low` (#1B1B1F).
*   **Interaction:** On press, the card should transition to `surface-container-highest` (#353439) with a 2px "Ghost Border" glow in `primary`.

### Progress & Criteria Lists
*   **The Progress Bar:** A ultra-thin (2px) line. The "unfilled" portion is `surface-variant`. The "filled" portion is a gradient from `primary` to `secondary`.
*   **Criteria Items:** Use `DM Mono` for the text. 
    *   *Complete:* A `primary` pulse dot (4px circle) next to the text.
    *   *Incomplete:* A `surface-variant` hollow circle (4px).
    *   *Prohibition:* Do not use standard heavy checkmark icons; they are too "corporate."

### Activation Bottom Sheets
*   **Appearance:** `surface-container` background with a `32px` top-corner radius.
*   **Backdrop:** When active, the background must dim using a "Natural Blur" (backdrop-filter: blur(10px)) rather than a simple black overlay.

---

## 6. Do's and Don'ts

### Do
*   **Do** use extreme typography scale. A very large Title next to a very small Monospace label creates a signature "high-end" look.
*   **Do** embrace the OLED black. Let elements "float" in the void.
*   **Do** use `1.5` and `2` spacing tokens to let content breathe.

### Don't
*   **Don't** use pure white (#FFFFFF). Always use `on-surface` (#E8E4D9) to prevent eye strain and maintain the "Signal" warmth.
*   **Don't** use standard Material Design ripples. Use subtle opacity fades (0.1s duration) for touch feedback.
*   **Don't** use dividers. If you feel you need a divider, add 12px of vertical space instead. If it still feels cluttered, you have too much content on the screen.