import { Message } from "../types";

export let nodeids = {};


export function toid(object: any): string {
  let id = Object.keys(nodeids).find(key => nodeids[key] === object);
  if (!id) {
    id = Math.random().toString(36).substring(7);
    nodeids[id] = object;
  }
  return id;
}



export function send(message: Message) {
  window.postMessage({
    source: 'dreamland-devtools',
    ...message
  }, '*');
}
