var palette = stateful({
  base: "#191724",
  surface: "#26233a",
  raised: "#524f67",
  text: "#e0def4",
  muted: "#6e6a86",
  highlight: "#c4a7e7",
});

chrome.storage.local.get("palette", (stored: any) => {
  if (!stored.palette) return;
  Object.assign(palette, stored.palette);
})

const App: Component<{}, {
  tree: TreeNode,
  activetab: number | null,
  oldactivetab: number | null,
}> = function() {
  this.css = css`
self {
  background-color: ${use(palette.base)};
  color: ${use(palette.text)};
  width: 100%;
  height: 100%;
  overflow:hidden;
  display: flex;
  flex-direction: column;
}
#treecontainer{
  height:100%;
  overflow: scroll;
  scrollbar-width: none;
}
`

  this.activetab = null;
  this.oldactivetab = null;


  const save = () => {
    function ser(tree) {
      return {
        url: tree.url,
        favicon: tree.favicon,
        title: tree.content,
        children: tree.children.map(c => ser(c.$))
      }
    }
    chrome.storage.local.set({ root: ser(this.tree) });
    chrome.storage.local.set({ palette: { ...palette } }); // fixes firefox bug
  }

  let waitontabnode: TreeNode | null = null;


  const makenode = (id, parent) => {
    let node;
    return node = (<TreeNode
      parent={parent}
      children={[]}
      bind:activeId={use(this.activetab)}
      id={id}
      click={() => {
        if (node.$.id === -1) {
          chrome.runtime.sendMessage({
            type: "tab",
            data: {
              act: "new",
              opts: { url: node.$.url },
            }
          })
          waitontabnode = node.$;
        } else {
          chrome.runtime.sendMessage({
            type: "tab",
            data: {
              id: node.$.id,
              act: "update",
              opts: {
                active: true
              }
            }
          })
        }
      }}
      rightclick={() => {
        function remove(node: TreeNode) {
          node.children.forEach(c => remove(c.$));
          if (node.id === -1) return;
          chrome.runtime.sendMessage({
            type: "tab",
            data: {
              id: node.id,
              act: "remove"
            }
          });
        }
        remove(node.$);
        node.$.parent.children = node.$.parent.children.filter(p => p != node.$.root);
      }}
      middleclick={() => {

      }}
    />)
  };


  setInterval(save, 1000);
  chrome.runtime.onMessage.addListener(({ type, data }) => {
    if (type === "active") {
      this.oldactivetab = this.activetab;
      this.activetab = data;
    }

    if (type === "remove") {
      let node = this.tree.findId(data);
      if (!node || !node.parent) return;
      node.parent.children = node.parent.children.filter(c => c !== node!.root);

    }
    if (type === "tabs") {
      for (const tab of data) {
        let node = this.tree.findId(tab.id);
        if (!node) {
          if (waitontabnode) {
            waitontabnode.id = tab.id;
            waitontabnode = null;
            continue;
          }

          let activetree = this.tree.findId(this.activetab) || this.tree.findId(this.oldactivetab);
          if (activetree == null)
            activetree = this.tree;
          node = makenode(tab.id, activetree).$;

          activetree.children = [...activetree.children, node!.root as HTMLLIElement];
        }
        if (!node) return;

        node.content = tab.title;
        node.favicon = tab.favIconUrl;
        node.url = tab.url;
      }
    }
  });
  chrome.runtime.sendMessage({ type: "init" });

  const de = (ser, tree) => {
    let node = makenode(-1, tree);

    node.$.url = ser.url;
    node.$.favicon = ser.favicon;
    node.$.content = ser.title;

    for (const r of ser.children) {
      de(r, node.$);
    }

    tree.children = [...tree.children, node];
  }
  chrome.storage.local.get("root", (({ root }) => {
    if (!root) return;
    for (const r of root.children) {
      de(r, this.tree);
    }
  }));

  return (
    <div>
      <Toolbar />
      <div id="treecontainer">
        <TreeNode bind:this={use(this.tree)} id={-1} favicon="/img/icon32.png" content="Tab Tree" />
      </div>
    </div>
  )
}
