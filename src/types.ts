
declare global {
  interface Window {
    _DREAMLAND_DEVTOOLS: {
      XREF: Record<string, any>
      INIT: () => void
      WATCH: (id: string) => void
      UNWATCH: (id: string) => void,
      sendTree: () => void,
      toid: (object: any) => string
    },
    DREAMLAND_SECRET_DEV_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: any
  }
}


export type DNode = {
  name: string;
  id: string;
  children: string[];
  state: string;
}

type NodeinfoMessage = {
  type: 'nodeinfo',
  nodes: DNode[]
}

type ObjectinfoMessage = {
  type: 'objectinfo',
  objects: {
    id: string,
    object: string
  }[]
}

type SetrootsMessage = {
  type: 'setroots',
  roots: string[]
}

export type Message = NodeinfoMessage | ObjectinfoMessage | SetrootsMessage

