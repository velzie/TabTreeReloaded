import { deserialize } from "../../serde"
import { DNode } from "../../types"
import { KnownNode, KnownObject, WATCH, exec, inspectobj, knownobjects } from "../main"

const ValueEditor: Component<{
  value: any
  onchange: (value: any) => void
}, {
  editing: boolean
  valueelm: HTMLElement
  editvalue: string
}> = function() {
  this.css = `
.string {
  color: yellow;
}
.number {
  color: lightblue;
}
.boolean {
  color: lightgreen;
}
.undefined {
  color: gray;
}
.function {
  color: lightcoral;
}
.element {
  color: var(--info);
}

  `

  useChange(this.value, () => {
    switch (typeof this.value) {
      case "string":
        this.valueelm = <span class="string">"{this.value.replaceAll("\n", "\\n")}"</span>;
        break;
      case "number":
        this.valueelm = <span class="number">{this.value}</span>;
        break;
      case "boolean":
        this.valueelm = <span class="boolean">{this.value ? "true" : "false"}</span>;
        break;
      case "undefined":
        this.valueelm = <span class="undefined">undefined</span>;
        break;
      case "object":
        if (this.value === null) {
          this.valueelm = <span class="undefined">null</span>;
          return;
        }

        if (this.value instanceof Array) {
          this.valueelm = <span class="array">[...]</span>
          return;
        }

        switch (this.value.type) {
          case "function":
            let name = this.value.name || "anonymous";
            this.valueelm = <span class="function pointer" on:click={(ev) => {
              inspectobj(this.value.id)
              ev.stopPropagation();
            }}>{name}()</span>;
            break;
          case "class":
            this.valueelm = <span class="object">{this.value.constructor}</span>;
            break
          case "textnode":
            this.valueelm = <span class="string pointer"
              on:click={(ev) => {
                inspectobj(this.value.id)
                ev.stopPropagation();
              }}
            >(TextNode) "{this.value.text}"</span>;
            break;
          case "element":
            this.valueelm = <span class="element pointer"
              on:click={(ev) => {
                inspectobj(this.value.id)
                ev.stopPropagation();
              }}>{"<"}{this.value.tag.toLowerCase()} {" />"}</span>;
            break;
        }
        break;

    }
  });

  return (
    <span on:click={() => {
      if (this.editing) return;
      this.editing = true
      this.editvalue = this.value;
    }}>
      {$if(use(this.editing),
        <input type="text" bind:value={use(this.editvalue)} on:change={() => {
          this.editing = false;

          let value: any = this.editvalue;

          let num = parseFloat(this.editvalue);
          if (!isNaN(num)) {
            value = num;
          }

          let bool = this.editvalue === "true" || this.editvalue === "false";
          if (bool) {
            value = this.editvalue === "true";
          }

          if (this.editvalue === "undefined") {
            value = undefined;
          }

          if (this.editvalue === "null") {
            value = null;
          }

          this.onchange(value);

        }} />,
        <span>{use(this.valueelm)}</span>
      )}
    </span>
  )
}
function deepEqual(obj1, obj2) {
  // Base case: If both objects are identical, return true.
  if (obj1 === obj2) {
    return true;
  }
  // Check if both objects are objects and not null.
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 === null || obj2 === null) {
    return false;
  }
  // Get the keys of both objects.
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  // Check if the number of keys is the same.
  if (keys1.length !== keys2.length) {
    return false;
  }
  // Iterate through the keys and compare their values recursively.
  for (const key of keys1) {
    if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
      return false;
    }
  }
  // If all checks pass, the objects are deep equal.
  return true;
}

const ValueViewer: Component<{
  key: string
  value: any
  id: string
}, {
  new: boolean
}> = function() {
  this.css = `
.key {
  color: var(--info);
  font-family: monospace;

  animation: color 1s;
}
.value {
  color: var(--fg);
  font-family: monospace;
}

.new {
  color: var(--accent);
}
`

  let existing;
  let first = true;
  useChange(this.value, v => {
    if (deepEqual(v, existing)) {
      return;
    }
    if (first) {
      first = false;
      return;
    }

    existing = v;

    this.new = true;
    setTimeout(() => this.new = false, 1000);
  });

  return (
    <div>
      <span class="key" class:new={use(this.new)}>{this.key}: </span>
      <span class="value">
        <ValueEditor onchange={v => {
          exec(`_DREAMLAND_DEVTOOLS.XREF['${this.id}']['${this.key}'] = ${JSON.stringify(v)}`);
        }} value={this.value} bind:value={use(this.value)} /></span>
    </div>
  )
}

export const PropsViewer: Component<{
  target: KnownNode | null
}, {
  targetobject: KnownObject | null
  fields: ComponentElement<typeof ValueViewer>[],
}> = function() {
  this.css = `
  padding: 1em;
  border-bottom: 2px solid var(--surface2);
h3 {
  margin: 0;
  padding: 0;
  margin-bottom: 0.5em;
}
`


  this.fields = [];

  let oldtarget = this.target;
  useChange(this.target, p => {
    if (p === oldtarget) return;
    oldtarget = p;
    this.fields = [];
    this.targetobject = p?.node.state ? knownobjects.get(p.node.state)! : null;
    if (p?.node.state) {
      WATCH(p.node.state);
    }
  });

  useChange(this.targetobject?.object, p => {
    if (!p) {
      this.fields = [];
      return;
    }

    for (let field of this.fields) {
      if (!(field.$.key in p)) {
        field.remove();
        this.fields = this.fields.filter(t => t !== field);
      }
    }

    for (let k in p) {
      let v = p[k];
      let existing = this.fields.find(t => t.$.key == k);
      if (existing) {
        existing.$.value = v;
      } else {
        // if (k === "root" || k === "children" || k == "css" || k == "outlet") continue;
        this.fields = [
          ...this.fields,
          <ValueViewer id={this.target!.node.state} key={k} value={v} />
        ];
      }
    }

  })

  return (
    <div>
      {$if(use(this.target), <h3>Props</h3>)}
      {use(this.fields)}
    </div>
  )
}
