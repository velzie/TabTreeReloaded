var devmode, DEVMODESEDHERE = 1;
var app;

window.addEventListener("load", () => {
  let root = <App />;

  app = root.$;
  document.querySelector("#root")?.appendChild(root);
})

if (devmode) {
  // auto refresh for dev
  fetch("http://localhost:3333").catch(() => window.location.reload());
}
