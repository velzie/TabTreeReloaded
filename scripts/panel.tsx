var palette = stateful({
  base: "#191724",
  text: "#e0def4"
});

interface Element {
  $: any,
}

type TreeNode = DLComponent<{
  showInsert: boolean,
  handleDrag: Function,
  handleDragEnd: Function,
  parent: TreeNode | null,
  content: string
  children: HTMLLIElement[]
  hoverfx: boolean,
  height: number,
  scrh: number,
  animsecs: number,
  dragging: boolean,
  click: Function,
  rightclick: Function,
  middleclick: Function,
  favicon: string,
  id: number,
  top: () => TreeNode,
  clearInsert: () => void,
  findId: (id: number | null) => TreeNode | null,
}>;

let dumbass_fucking_firefox_clientx: number;
let dumbass_fucking_firefox_clienty: number;

function TreeNode(this: TreeNode) {
  this.hoverfx = false;
  this.dragging = false;

  this.children ??= [];
  this.children.forEach(c => c.$.parent = this);

  let rcolor = "#" + Math.floor(Math.random() * 2 ** (8 * 3)).toString(16);

  let css = styled.new`
  self {
    width:100%;
    user-select:none;
    border-bottom: ${use(this.showInsert, b => b && "5px solid red")};
    background-color: ${use([this.hoverfx, this.dragging], (hover, dragging) => (dragging && rcolor + " !important") || (hover && "grey !important"))};
    padding-left:17px;

    background: url(img/lineto_subnode_s1.png) 7px 8px no-repeat, url(img/line_vertical_s1.png) 6px 0px repeat-y;
    margin-right:4px;
    padding-top: 1px;
    padding-bottom: 1px;
    margin-bottom: -1px;
  }

  .content {
    padding-left:15px;
    background: url(img/node_anchor_no_subnodes_s1.png) 0px -1px no-repeat, url(img/stripes_gray.png) repeat;
  }
  .content > div{
    display: flex;
    align-items: center;
    }
  img {
    margin-right: 2px;
    width:16px;
    height:16px;
  }
`;
  let s = styled.new`
self {

    max-height: ${use(this.height, p => (p != null && p + "px") || "max-content")};
    transition: all ${use(this.animsecs)}s;
    overflow: hidden;
  }
`

  const tgtfromcursor = () => {
    if (!dumbass_fucking_firefox_clientx || !dumbass_fucking_firefox_clienty) return;
    let elm = document.elementsFromPoint(dumbass_fucking_firefox_clientx - 17, dumbass_fucking_firefox_clienty).find(elm => elm.$ && elm.$ instanceof TreeNode)
    if (!elm) return;
    if (elm.$ === this) return;
    return elm.$;
  };

  return (
    <li
      css={css} draggable
      on:dragstart={(e) => {
        e.stopPropagation();
      }}
      on:drag={(e) => {
        e.stopPropagation();
        this.dragging = true;
        this.top().clearInsert();
        if (!this.parent) return;

        let target = tgtfromcursor();
        if (!target) return;

        for (let child of target.children) {
          let rect = child.getBoundingClientRect();
          child.$.showInsert = dumbass_fucking_firefox_clienty > rect.top && dumbass_fucking_firefox_clienty < rect.bottom;
        }
        if (target.children.length == 0) {
          target.hoverfx = true;
        }
      }}
      on:dragend={(e) => {
        e.stopPropagation();
        this.dragging = false;
        this.top().clearInsert();
        if (!this.parent) return;

        let target = tgtfromcursor();
        if (!target) return;

        for (let child of target.children) {
          let rect = child.getBoundingClientRect();
          if (e.clientY < rect.top || e.clientY > rect.bottom) continue;

          this.parent.children = this.parent.children.filter(e => e !== this.root);

          let idx = target.children.findIndex(e => e === child);
          target.children.splice(idx + 1, 0, this.root);

          // i have to do this  precisely three times or it breaks. this is a bug?
          target.children = target.children;
          target.children = target.children;
          target.children = target.children;

          this.parent = target;
          break;
        }

        if (target.children.length === 0) {
          this.parent!.children = this.parent!.children.filter(e => e !== this.root);
          target.children = [this.root];
          this.parent = target;
        }
      }}
      on:click={(e) => {
        e.stopPropagation();
        if (this.height == null || this.height != 0) {
          this.animsecs = 0;
          this.height = this.scrh = this.root.scrollHeight;
          setTimeout(() => {
            this.animsecs = 0.3;
            this.height = 0;
          });
        } else {
          this.height = this.scrh;
        }
      }}>
      <div class="content">
        <div on:click={(e) => {
          e.stopPropagation();
          if (this.click) this.click();
        }}
          on:contextmenu={(e) => {
            e.stopPropagation();
            e.preventDefault();
            if (this.rightclick) this.rightclick();
          }}
          on:auxclick={(e) => {
            e.stopPropagation();
            if (this.rightclick) this.rightclick();
          }}>
          <img
            src={use(this.favicon)}
            on:error={() => {
              this.favicon = "/img/loading.gif";
              setTimeout(() => {
                if (this.favicon = "/img/loading.gif")
                  this.favicon = "/img/icon32.png"// if it's still loading, just use a placeholder
              }, 5000);
            }}
            width="16px" height="32px" />
          {use(this.content)}
        </div>
      </div>
      <ul class="subnodes" css={s}>
        {use(this.children)}
      </ul>
    </li>
  )
}
TreeNode.prototype.top = function() {
  if (this.parent) return this.parent.top();
  return this;
}
TreeNode.prototype.clearInsert = function() {
  this.showInsert = false;
  this.hoverfx = false;
  this.children.forEach(e => e.$.clearInsert());
}
TreeNode.prototype.findId = function(id: number | null) {
  if (id === null) return;
  if (this.id === id) return this;
  return this.children.map(c => c.$.findId(id)).find(c => c);
}

function App(this: {
  tree: TreeNode,
  activetab: number | null
}) {

  let style = css`
self {
  background-color: ${use(palette.base)};
  color: ${use(palette.text)};
  width: 100%;
  height: 100%;
}
/* self :nth-child(odd){ */
/*   background-color:blue; */
/* } */
`

  this.activetab = null;
  let oldactivetab: number | null = null;

  chrome.runtime.onMessage.addListener(({ type, data }) => {
    if (type === "active") {
      oldactivetab = this.activetab;
      this.activetab = data;
    }

    if (type === "remove") {
      // if (this.activetab === data)
      //   this.activetab = null;

      let node = this.tree.findId(data);
      if (!node || !node.parent) return;
      node.parent.children = node.parent.children.filter(c => c !== node!.root);

    }
    if (type === "tabs") {
      for (const tab of data) {
        let node = this.tree.findId(tab.id);
        if (!node) {
          let activetree = this.tree.findId(this.activetab) || this.tree.findId(oldactivetab);
          if (activetree == null)
            activetree = this.tree;
          node = (<TreeNode
            parent={activetree}
            children={[]}
            id={tab.id}
            click={() => {
              chrome.runtime.sendMessage({
                type: "tab",
                data: {
                  id: tab.id,
                  act: "update",
                  opts: {
                    active: true
                  }
                }
              })
            }}
            rightclick={() => {
              function remove(node: TreeNode) {
                node.children.forEach(c => remove(c.$));
                chrome.runtime.sendMessage({
                  type: "tab",
                  data: {
                    id: node.id,
                    act: "remove"
                  }
                });
              }
              remove(node!);
            }}
            middleclick={() => {

            }}
          />).$;

          activetree.children = [...activetree.children, node!.root as HTMLLIElement];
        }
        if (!node) return;

        node.content = tab.title;
        node.favicon = tab.favIconUrl;
      }
    }
  });
  chrome.runtime.sendMessage({ type: "init" });
  //
  // let cs: any = [];
  // for (let i = 0; i < 4; i++) {
  //   let ccs: any = [];
  //   for (let j = 0; j < 4; j++) {
  //     ccs.push(<TreeNode content={`${i}-${j}`} children={[]} />)
  //   }
  //   cs.push(<TreeNode content={i} children={ccs} />)
  // }
  return (
    <div css={style}>
      <TreeNode bind:this={use(this.tree)} favicon="/img/icon32.png" content="ROOT" />
      <button on:click={() => {
        oldactivetab = null;
        this.activetab = null;
        chrome.runtime.sendMessage({
          type: "tab",
          data: {
            act: "new",
          }
        })
      }}>add tab</button>
    </div>
  )
}


let s = stateful({ app: null });
var app;
window.addEventListener("load", () => {
  document.querySelector("#root")?.appendChild(<App bind:this={use(s.app)} />);
  app = s.app;


})
window.addEventListener("dragover", e => {
  dumbass_fucking_firefox_clientx = e.clientX;
  dumbass_fucking_firefox_clienty = e.clientY;
})
window.addEventListener("contextmenu", e => {
  e.preventDefault();
})


// auto refresh for dev
fetch("http://localhost:3333").catch(() => window.location.reload())
