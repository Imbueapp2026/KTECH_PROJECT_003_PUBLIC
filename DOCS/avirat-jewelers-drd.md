# Avirat Jewelers — Design Requirements Document (DRD)

**Version:** 1.0
**Scope:** This document governs the public site's visual and interaction language. It does not change the existing data model, APIs, database schema, or feature scope.

**Inspiration sources:** Swarovski (India), Cluely, Breitling — referenced for UI/UX direction only. No copy, imagery, layout code, or brand assets are to be reproduced from these sites; only the underlying design *principles* are adapted below, translated into Avirat Jewelers' own visual language and content.

---

## 1. What each inspiration source contributes

### 1.1 Swarovski — merchandising & product-grid discipline
- Product-forward grid layouts where the item itself (not decoration) carries the visual weight — large, clean product photography with generous negative space around each piece
- Confident use of a tight, refined color palette rather than many colors competing for attention
- Category navigation that feels editorial rather than utilitarian — categories presented as curated collections, not a flat dropdown list
- **Adapt for us as:** the catalog grid and product cards should let the jewelry photography be the hero; category cards (already spec'd) should feel like curated entry points, not a plain filter list

### 1.2 Cluely — bold, confident, high-contrast modern interface
- Strong typographic hierarchy — a small number of very deliberate type sizes, not a gradient of similar ones
- High-contrast, minimal-chrome interface; UI elements recede so content/message is what's read first
- Punchy, direct microcopy and confident whitespace use rather than dense information walls
- **Adapt for us as:** the BentoGrid homepage (already spec'd) should lean into this confidence — big, bold tile labels, minimal UI decoration around them, strong contrast between tiles rather than a busy, evenly-weighted grid

### 1.3 Breitling — immersive, editorial luxury depth
- Cinematic, large-format imagery with generous full-bleed sections
- Restrained UI chrome — navigation and controls stay quiet so imagery and product story dominate
- Dark/rich sectional backgrounds used deliberately to create mood shifts between sections, rather than one flat background throughout
- Editorial pacing — sections feel like a story being told (heritage, craft, product) rather than a flat product listing
- **Adapt for us as:** the "Our Collection" page and product detail pages should have moments of full-bleed imagery and editorial pacing, not just a dense grid; hallmark certification and craftsmanship details (already in the product schema) are the natural place to bring in this storytelling feel — a trust/craft narrative around certified purity, not just a spec sheet

---

## 2. Synthesized Design Principles for Avirat Jewelers

1. **Product photography is the hero.** Every layout decision should protect space around product imagery rather than crowding it with UI chrome — echoes Swarovski's grid discipline and Breitling's imagery-first sections.
2. **Confidence over density.** Fewer, bolder statements per screen (large type, deliberate whitespace) rather than packing in information — echoes Cluely's typographic confidence.
3. **Editorial pacing on discovery surfaces.** The homepage BentoGrid and Our Collection page should feel like a curated journey (arrival → collection → craft story → contact), not a flat directory — echoes Breitling's storytelling pacing.
4. **Restrained, quiet UI chrome.** Navigation, buttons, and controls stay visually quiet (the auto-hide header already spec'd fits this) so product content and photography carry the visual weight.
5. **Trust through craft detail, presented with care.** Hallmark certification and purity details shouldn't read like a spec table — present them with the same editorial care as Breitling presents watch craftsmanship, within Avirat's existing serif/gold/rose palette.

---

## 3. Applied to Existing Spec'd Surfaces

*(No new features are introduced here; the principles apply to existing public-site surfaces.)*

| Public site surface | Design direction |
|---|---|
| **Header** | Keep it minimal and quiet; navigation reveals should be subtle, not flashy — Cluely-style restraint, not decoration for its own sake |
| **Homepage BentoGrid** | Use confident tile typography; let product photography dominate tiles, with strong contrast between areas |
| **Our Collection page** | Give offer and category content generous imagery-led treatment; consider an editorial banner before the category grid |
| **Catalog grid** | Keep card proportions consistent, use generous gutters, and let product photography lead |
| **Product detail page** | Present hallmark certification, description, and imagery with editorial pacing rather than a cramped specification block |
| **Colors/type** | Preserve the existing dusty rose, charcoal, champagne gold, serif, and grotesque pairing; this DRD adds or overrides no tokens |

---

## 4. What this DRD explicitly does NOT change

- No new pages, features, tables, or API endpoints — pure UI/interaction direction on top of the existing public-site scope
- No new color tokens or fonts — the existing palette stays as the system of record
- No content, imagery, or code copied from Swarovski, Cluely, or Breitling — inspiration is principle-level only
- These editorial and luxury principles apply to the **public site only**

---

## 5. Open Questions

1. Does the client want the "editorial pacing" direction (full-bleed imagery moments, storytelling sections) on the Our Collection and product detail pages, or would that add production overhead (requires higher-quality/more numerous photography) beyond what the client can realistically supply per product?
2. Should the craft-story treatment (hallmark/purity presented editorially) be a shared template across all products, or does it need per-category variation (e.g. bangles vs. rings might have different "story" framing)?
