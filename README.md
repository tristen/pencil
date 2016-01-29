pencil.js
---

Super simple JS library that lets users draw on HTML5 canvas elements via
mouse or touch events.

Demo › http://ofagbemi.github.io/pencil.js/

### Quick start

```js
var pencil = new Pencil(document.getElementById('canvas'), {
    pixelSize: 4,
    color: 'orange'
});

pencil.enable();
```
