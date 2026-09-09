# Illustrated worksite revision

The user approved an illustrative, teal-and-warm-earth direction inspired by
the supplied Abeto screenshot, retaining location-based educational navigation.
This is not a reproduction of its assets or a claim of equivalent art fidelity.

The previous transition mounted two complete worlds and applied clipping to
every material. Its capped frame delta extended the transition under load.
The replacement keeps one Terrain mounted, retains a stable forest, and moves
only the worksite vertically by at most 0.8 units over 650 ms. Elapsed wall time
determines completion; pause and reduced-motion preferences skip the motion.

Rendering budget changes: 1,250 candidate trees (previously 2,400), pixel ratio
capped at 1.25 (previously 1.5), shadow map 1,024 (previously 2,048). These reduce
work but are not measured FPS guarantees. Ground geometry still changes with
the mining stage; it is not a continuous excavation simulation.

The camera moves closer, fog starts farther away, trees and built assets use
toon materials, and workshop details include bays, a canopy, pedestrian
markings and simplified workers. No new regulatory or compliance claims added.

## Habitat and settlement pass — 9 September 2026

Ground texture now uses lower contrast and less repetition, with broad meadow
color variation. Deterministic clusters of low-poly shrubs and stones occupy
natural ground; operational roads, facility areas and the pit remain clear.
Two instanced meshes render these habitat details. A third instanced mesh adds
subtle moving river highlights; pause and reduced-motion stop their time updates.
No extra textures or downloaded assets are required.

The village is independent of the worksite reveal and exists in every chapter.
Narrow lanes connect the houses and small garden rows establish inhabited land.
The main landscape, educational navigation and teal/warm-earth palette remain.
This pass does not make an FPS guarantee; browser screenshots verify composition.

Validation: 14 unit tests and TypeScript passed. Active, pre-operation and
post-mining screenshots were captured and visually reviewed. The multi-chapter
browser test exceeded its 180-second budget on both runs (including a smaller
960×720 viewport); it is not recorded as passing. Initial truck positions now
follow their route offsets even when reduced motion prevents animation.
