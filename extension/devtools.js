chrome.devtools.panels.create("Dreamland", "/img/logo.png", "panel.html", panel => {
  console.log("Panel created", panel);
});

chrome.devtools.panels.create("this html boring ah hell", "/img/logo.png", "surf.html", panel => {
  console.log("Panel created", panel);
});
