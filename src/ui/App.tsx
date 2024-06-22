import { deserialize } from "../serde"
import { DNode } from "../types"
import { PropsViewer } from "./inspector/PropsViewer"
import { G, KnownNode, inspectobj, knownnodes } from "./main"

export const App: Component<{}, {}> = function() {
  this.css = `
width: 100%;
height: 100%;
background-color: var(--bg);
color: var(--fg);

.panel {
  padding: 1em;
  min-width: 200px;
}

.title {
  h1 {
    margin: 0.2em;
  }
  img {
    height: 3em;
  }
  border-bottom: 2px solid var(--surface2);
}

#treeview {
  overflow-y: scroll;
  flex: 1;
}

#search {
  padding-left: 1em;
  height: 3.5rem;
  
  input {
    background-color: transparent;
    height: 100%;
    border: none;
    outline: none !important;
font-size: 1rem;

    color: var(--fg);
    width: 100%;


  }
    border-bottom: 2px solid var(--surface2);
}

#inspector {
  border-left: 2px solid var(--surface2);

  pre {
    white-space: pre-wrap;
  
  }
}

#selectedview {
  border-bottom: 2px solid var(--surface2);
  height: 3.5rem;

  .name {
    color: #8573ff;
    font-weight: bold;
  }
}

`

  return <main class="flex col">

    <div class="title panel flex vcenter gap-sm">
      <img src="/img/logo.png" />
      <h1>DevTools</h1>
    </div>

    <div class="flex flex1">
      <div class="flex col">
        <div id="search" class="flex vcenter gap-md">
          <span class="material-symbols-rounded">search</span>
          <input type="text" placeholder="Search" />
        </div>

        <div id="treeview" class="panel">
          {use(G.tree, t => t.map(t =>
            <TreeElement node={t} />
          ))}
        </div>
      </div>

      <div id="inspector" class="flex1">
        <div id="selectedview" class="panel">
          {$if(use(G.selected),
            <div class="flex wbetween">
              <span class="flex gap-sm vcenter pointer">
                <span class="name">{"<"}{use(G.selected?.node.name)}{" />"} </span>
              </span>
              <span class="flex gap-sm pointer">
                <span
                  on:click={() => inspectobj(G.selected.id)}
                  class="material-symbols-rounded">visibility</span>
                <span
                  on:click={() => inspectobj(G.selected.id)}
                  class="material-symbols-rounded">code</span>
              </span>
            </div>
          )}
        </div>
        <PropsViewer bind:target={use(G.selected)} target={null} />
      </div>
    </div>

  </main>
}

const TreeElement: Component<{
  node: KnownNode
}, {
  expanded: boolean
}> = function() {
  this.css = `
user-select: none;
.children {
  margin-left: 1em;
display: none;
}
.name {
  color: #8573ff;
  cursor: pointer;
  font-size: 1rem;
}
.expand {
  cursor: pointer;
  color: var(--fg);
  position: relative;
  top: 50%;
  transform: rotate(-90deg);
  font-size: 1.5rem;
  margin-right: 0.5em;
  margin: 0;

  transition: transform 0.2s;
}

.expanded.expand {
  transform: rotate(0deg);
}

.expanded.children {
  display: block;
}

`
  this.expanded = false;

  return (
    <div>
      <span class={["flex", "vcenter"]}>
        <span class="expand material-symbols-rounded"
          class:expanded={use(this.node.expanded)}
          class:invisible={use(this.node.node.children, t => !t.length)}

          on:click={() => this.node.expanded = !this.node.expanded}>
          arrow_drop_down
        </span>

        <span class="name" on:click={() => G.selected = this.node}>
          {this.node.node.name}
        </span>
      </span>

      <div class="children" class:expanded={use(this.node.expanded)}>
        {use(this.node.node.children, t => t.map(t =>
          <TreeElement node={knownnodes.get(t)!} />
        ))}
      </div>
    </div>
  )
}
