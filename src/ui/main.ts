import "dreamland/dev";
import { App } from "./App";
import { DNode, Message } from "../types";
import { deserialize } from "../serde";

let devmode = 1;

export const G = $state({
  tree: [] as KnownNode[],
  selected: null! as KnownNode
})


export async function exec(code: string): Promise<any> {
  return new Promise((res) => chrome.devtools.inspectedWindow.eval(code, res));
}


window.addEventListener("load", async () => {
  let app = h(App);
  (window as any).app = app;
  document.body.appendChild(app);


  exec(`_DREAMLAND_DEVTOOLS.INIT()`);
  setTimeout(() => exec(`_DREAMLAND_DEVTOOLS.sendTree()`), 1000);
});


export function inspectobj(id: string) {
  exec(`inspect(_DREAMLAND_DEVTOOLS.XREF['${id}'])`);
}
export function WATCH(id: string) {
  exec(`_DREAMLAND_DEVTOOLS.WATCH('${id}')`);
}


if (devmode) {
  // auto refresh for dev
  fetch("http://localhost:3333").catch(() => window.location.reload());
}



export type KnownNode = Stateful<{
  id: string
  expanded: boolean
  node: DNode
}>

export let knownnodes: Map<string, KnownNode> = new Map();

export type KnownObject = Stateful<{
  id: string
  object: any
}>

export let knownobjects: Map<string, KnownObject> = new Map();


chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener((message: Message) => {
    switch (message.type) {
      case "nodeinfo":
        for (let node of message.nodes) {
          if (knownnodes.has(node.id)) {
            let knownnode = knownnodes.get(node.id)!;
            knownnode.node = node;
          } else {
            knownnodes.set(node.id, $state({
              id: node.id,
              expanded: false,
              node
            }));
          }
        }
        break;
      case "objectinfo":
        console.log("objectinfo", message.objects);
        for (let object of message.objects) {
          window.k = knownobjects;
          if (knownobjects.has(object.id)) {
            knownobjects.get(object.id)!.object = deserialize(object.object);
          } else {
            knownobjects.set(object.id, $state({
              id: object.id,
              object: deserialize(object.object)
            }));
          }
        }
        break;
      case "setroots":
        G.tree = message.roots.map((id) => knownnodes.get(id)!);
        break;
    }
  });
});

chrome.devtools.panels.elements.onSelectionChanged.addListener(async () => {
  let id: string = await exec(`_DREAMLAND_DEVTOOLS.toid($0)`);

  let node = knownnodes.get(id);
  if (node) {
    G.selected = node;
  }

});
