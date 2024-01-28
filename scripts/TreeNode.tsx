var dumbass_fucking_firefox_clientx: number;
var dumbass_fucking_firefox_clienty: number;
window.addEventListener("dragover", e => {
  dumbass_fucking_firefox_clientx = e.clientX;
  dumbass_fucking_firefox_clienty = e.clientY;
});

window.addEventListener("contextmenu", e => {
  e.preventDefault();
});



type TreeNode = DLComponent<{
  showInsert: boolean,
  handleDrag: Function,
  handleDragEnd: Function,
  parent: TreeNode | null,
  content: string
  children: HTMLLIElement[]
  hoverfx: boolean,
  height: number | null,
  scrh: number,
  animsecs: number,
  dragging: boolean,
  click: Function,
  rightclick: Function,
  middleclick: Function,
  favicon: string,
  collapsed: boolean,
  activeId: number,
  id: number,
  url: string,
  top: () => TreeNode,
  clearInsert: () => void,
  findId: (id: number | null) => TreeNode | null,
}>;

function TreeNode(this: TreeNode) {
  this.hoverfx = false;
  this.dragging = false;

  this.children ??= [];
  this.children.forEach(c => c.$.parent = this);

  this.css = css`
  self {
    width:100%;
    user-select:none;
    padding-left:17px;

    background: url(img/lineto_subnode_s1.png) 7px 8px no-repeat, url(img/line_vertical_s1.png) 6px 0px repeat-y;
    margin-right:4px;
    padding-top: 1px;
    padding-bottom: 1px;
    margin-bottom: -1px;
    overflow: hidden;
  }

  .content {
    padding-left:15px;
    background-color: ${use(this.activeId, (active) => active === this.id ? palette.raised : "transparent")} !important;
    background: url(img/${use([this.children, this.collapsed], (c, children) => c ? "minimized" : (children.length > 0 ? "unminimized" : "no"))}_children.png) 0px -1px no-repeat;
    color: ${use(this.id, id => id === -1 ? palette.muted : palette.text)}
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

  const tgtfromcursor = () => {
    if (!dumbass_fucking_firefox_clientx || !dumbass_fucking_firefox_clienty) return;
    let elm = document.elementsFromPoint(dumbass_fucking_firefox_clientx - 17, dumbass_fucking_firefox_clienty).find(elm => elm.$ && elm.$ instanceof TreeNode)
    if (!elm) return;
    if (elm.$ === this) return;
    return elm.$;
  };

  let wasInserting: TreeNode;
  let wasHovering: TreeNode;

  let raised = rule`background-color: ${palette.raised} !important`;
  let dragged = rule`background-color: ${palette.highlight} !important`;
  let insert = rule`border-bottom: 5px solid red`;
  return (
    <li
      class={[
        use(this.hoverfx, h => h && raised),
        use(this.dragging, h => h && dragged),
        use(this.showInsert, h => h && insert),
        rule`background-color: transparent;`
      ]}
      draggable
      on:dragstart={(e: DragEvent) => {
        e.stopPropagation();
      }}
      on:drag={(e: DragEvent) => {
        // @ts-expect-error
        wasInserting?.showInsert = false;
        e.stopPropagation();
        this.dragging = true;
        if (!this.parent) return;

        let target = tgtfromcursor();
        if (!target) return;

        for (let child of target.children) {
          let rect = child.getBoundingClientRect();
          if (dumbass_fucking_firefox_clienty > rect.top && dumbass_fucking_firefox_clienty < rect.bottom) {
            child.$.showInsert = true;
            // @ts-expect-error
            wasHovering?.hoverfx = false;
            wasInserting = child.$;
            return;
          }
        }

        // @ts-expect-error
        wasHovering?.hoverfx = false;
        target.hoverfx = true;
        wasHovering = target;
      }}
      on:dragend={(e: DragEvent) => {
        // @ts-expect-error
        wasInserting?.showInsert = false;
        // @ts-expect-error
        wasHovering?.hoverfx = false;
        e.stopPropagation();
        this.dragging = false;
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
          return;
        }

        this.parent!.children = this.parent!.children.filter(e => e !== this.root);
        target.children = [...target.children, this.root];
        this.parent = target;
      }}
      on:click={(e: Event) => {
        e.stopPropagation();
        if (this.children.length < 1) return;
        if (this.height == null || this.height != 0) {
          this.animsecs = 0;
          this.height = this.scrh = this.root.scrollHeight;
          setTimeout(() => {
            this.animsecs = 0.3;
            this.height = 0;
          });
          this.collapsed = true;
        } else {
          this.height = this.scrh;
          this.collapsed = false;
          setTimeout(() => {
            this.height = null;
          }, 500);
        }
      }}>
      <div class="content">
        <div on:click={(e: Event) => {
          e.stopPropagation();
          if (this.click) this.click();
        }}
          on:contextmenu={(e: Event) => {
            e.stopPropagation();
            e.preventDefault();
            if (this.rightclick) this.rightclick();
          }}
          on:auxclick={(e: Event) => {
            e.stopPropagation();
            if (this.rightclick) this.rightclick();
          }}>
          <div if={use(this.collapsed)}>
            [{use(this.children, c => c.length)}]
          </div>
          <img
            src={use(this.favicon)}
            on:error={() => {
              this.favicon = "/img/loading.gif";
              setTimeout(() => {
                if (this.favicon = "/img/loading.gif")
                  this.favicon = "/img/favi.png"// if it's still loading, just use a placeholder
              }, 3000);
            }}
            width="16px" height="32px" />
          {use(this.content)}
        </div>
      </div>
      <ul class={["subnodes", rule`
    max-height: ${use(this.height, p => (p != null && p + "px") || "max-content")};
    transition: all ${use(this.animsecs)}s;
    overflow: hidden;`
      ]}>

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
