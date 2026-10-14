# Heat unit visuals (Unit 1)

Self-contained SVG diagrams and `heat-demos.js` mini-demos for HKDSE Heat lessons.

## Paths
Reference from flat lesson HTML as `images/heat/<file>`.
For nested publish (`lessons/<slug>/index.html`), either copy this folder beside each lesson or rewrite to `../../images/heat/`.

## Interactive demos (`heat-demos.js`)
Loaded with `<script src="images/heat/heat-demos.js" defer></script>`.
Demos start when their step becomes `.active` (`data-demo` attribute).

Demo ids: `thermoCal`, `particleTemp`, `conduction`, `convection`, `radiation`, `evaporation`, `boyle`, `moleculeBox`.
