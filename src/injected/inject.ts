import { serialize } from "../serde";
import { DNode } from "../types";
import { nodeids, send, toid } from "./util";

function findComponents(list: Element[], node: Element) {
  for (let child of node.children) {
    if (child.$) {
      list.push(child);
    } else {
      findComponents(list, child);
    }
  }
}

let localnodeinfo: Record<string, DNode> = {};[];


function nodeinfo(node: DLElement<any>): DNode {
  let components = [];
  findComponents(components, node);


  let state = node.$;
  let id = toid(node);
  return {
    name: node.getAttribute("data-component")!,
    id,
    state: toid(state),
    children: components.map(toid)
  }
}


function buildTree(node: HTMLElement): string {

  let info = nodeinfo(node);
  localnodeinfo[info.id] = info;

  for (let child of info.children) {
    let node = nodeids[child];
    buildTree(node);
  }

  return info.id;
}

function sendTree() {
  let rootcomponents = [];
  findComponents(rootcomponents, document.body);

  let roots = rootcomponents.map(buildTree);

  send({
    type: "nodeinfo",
    nodes: Object.values(localnodeinfo)
  });

  let objectinfo: any = [];
  for (let node of Object.values(localnodeinfo)) {
    objectinfo.push({
      id: node.state,
      object: serialize(nodeids[node.state])
    });
  }
  send({
    type: "objectinfo",
    objects: objectinfo
  })

  send({
    type: "setroots",
    roots
  });
}

let observer = new MutationObserver((mutations) => {
  console.log("resending tree...");
  sendTree();
});

let watchers: (() => void)[] = [];

let initialized = false;
window._DREAMLAND_DEVTOOLS = {
  XREF: nodeids,
  INIT() {
    if (initialized) return;
    initialized = true;
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    sendTree();
  },
  WATCH(id) {
    const { LISTENERS } = window.DREAMLAND_SECRET_DEV_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
    let state: any = this.XREF[id];
    if (!isStateful(state)) return;

    let watch = () => {
      send({
        type: "objectinfo",
        objects: [{
          id,
          object: serialize(state)
        }]
      })
    }

    watchers.push(watch);
    state[LISTENERS].push(watch);
  },
  UNWATCH(id) {
    const { LISTENERS } = window.DREAMLAND_SECRET_DEV_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
    let state: any = this.XREF[id];
    if (!isDLPtr(state)) return;

    for (let watch of watchers) {
      let index = state[LISTENERS].indexOf(watch);
      if (index !== -1) {
        state[LISTENERS].splice(index, 1);
      }
    }
  },
  sendTree,
  toid
}
