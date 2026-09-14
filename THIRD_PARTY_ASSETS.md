# Munaffa third-party visual assets

The immersive website currently uses 1K glTF furniture assets whose identifiers correspond to Poly Haven models. Poly Haven publishes its assets under CC0. The current build loads these particular 1K files through the public `Teetertater/Floorplan2Walkthru` GitHub mirror while the product is being developed.

## Furniture used in `components/HospitalityWorld.tsx`

| Munaffa key | Asset identifier | License source |
| --- | --- | --- |
| armchair | `ArmChair_01` | Poly Haven — CC0 |
| modernChair | `modern_arm_chair_01` | Poly Haven — CC0 |
| sofa | `sofa_02` | Poly Haven — CC0 |
| sofaAlt | `sofa_03` | Poly Haven — CC0 |
| coffeeTable | `modern_coffee_table_01` | Poly Haven — CC0 |
| sideTable | `side_table_01` | Poly Haven — CC0 |
| diningChair | `dining_chair_02` | Poly Haven — CC0 |
| diningTable | `round_wooden_table_01` | Poly Haven — CC0 |
| shelves | `steel_frame_shelves_01` | Poly Haven — CC0 |
| displayShelves | `wooden_display_shelves_01` | Poly Haven — CC0 |
| console | `ClassicConsole_01` | Poly Haven — CC0 |
| stool | `metal_stool_01` | Poly Haven — CC0 |
| officeDesk | `metal_office_desk` | Poly Haven — CC0 |

Primary source: https://polyhaven.com/models
License: https://polyhaven.com/license
Development mirror: https://github.com/Teetertater/Floorplan2Walkthru

## Environment lighting

`warm_restaurant_1k.hdr` — Poly Haven, CC0.

Primary asset page: https://polyhaven.com/a/warm_restaurant

## Production asset-hosting requirement

The current development build references public third-party URLs. Before substantial production traffic:

1. Download the exact CC0 source assets from Poly Haven rather than depending on a development mirror.
2. Keep the source/license manifest with the project.
3. Convert/optimize the models for the web (Meshopt/Draco where appropriate and KTX2/Basis textures).
4. Host the final assets in a Munaffa-controlled CDN/object store with long-lived immutable cache headers.
5. Keep a low-quality mobile set and a non-WebGL fallback.

Even where attribution is not legally required by CC0, this file should remain as an internal provenance record.
