function Toolbar(this: DLComponent<{
  showsettings: boolean,
}>) {
  this.css = css`
  self {
    position:sticky;
    top:0;
    display: flex;
    flex-direction: column;

    background-color: ${use(palette.surface)};
    width:100%;

    border-bottom-left-radius: 15px;
    border-bottom-right-radius: 15px;
    display: flex;
    align-items: center;
  }

  #toolbar {
    width:100%;
    display: flex;
    align-items: center;
    justify-content: space-evenly;
    padding-top: 0.5em;
    padding-bottom: 0.5em;
  }

  button {
    background-color: ${use(palette.raised)};
    padding: 0.4em;
    border: none;
    border-radius: 5px;
    color: ${use(palette.text)};
  }

  #settings{
    display: ${use(this.showsettings, s => s && "flex" || "none")};
    flex-direction:column;
    padding-bottom:3em;
    width: fit-content;
  }
  h1{
    font-size:30px;
  }
`

  return (
    <div>
      <div id="toolbar">
        <button on:click={() => {
          app.oldactivetab = null;
          app.activetab = null;
          chrome.runtime.sendMessage({
            type: "tab",
            data: {
              act: "new",
              opts: {},
            }
          })
        }}>New Tab</button>
        <button on:click={() => {
          this.showsettings = !this.showsettings;
        }}>Settings</button>
      </div>
      <div id="settings">
        <h1>settings</h1>
        <br />
        <button on:click={resetdata}>Reset Saved Data</button>
        <br />
        <button on:click={savedata}>Save Data to JSON</button>
        <br />
        <button on:click={loaddata}>Load Data from JSON</button>

        <Input bind:value={use(palette.base)}>Base Color:</Input>
        <Input bind:value={use(palette.raised)}>Raised Color:</Input>
        <Input bind:value={use(palette.text)}>Text Color:</Input>
        <Input bind:value={use(palette.surface)}>Surface Color:</Input>
        <Input bind:value={use(palette.muted)}>Muted Color:</Input>
        <Input bind:value={use(palette.highlight)}>Highlight Color:</Input>
      </div>
    </div>
  )
}

function Input(this: DLComponent<{
  value: string
}>, slot) {
  this.css = css`
self {
  display: flex;
  justify-content: left;
  align-items: center;
}
input {
  outline: none;
  border: none;
  width:75px;
  padding: 0.3em;
  border-radius: 5px;

  background-color: ${use(palette.raised)};
  color: ${use(palette.text)};
}
.text {
  padding: 1em;
  text-align: left;
  padding-left: 0;
  font-size:14px;
}
`


  return (
    <div>
      <div class="text">{slot}</div>
      <input bind:value={use(this.value)} />
    </div>
  )
}


function savedata() {
  chrome.storage.local.get(["root", "palette"], data => {
    let elm = <a href={"data:application/json," + encodeURIComponent(JSON.stringify(data))} download="tabtreereloaded-save.json" />

    document.body.appendChild(elm);
    elm.click();
    elm.remove();
  });

}
function loaddata() {
  const reader = new FileReader();

  let elm = <input type="file" accept="application/json" on:change={() => {
    let file = elm.files[0];
    if (!file) return;
    reader.onload = (e) => {
      try {
        let data = JSON.parse(e.target?.result as string);
        chrome.storage.local.set(data, () => {
          location.reload();
        });
      } catch (e) {
        console.error(e);
        alert("error uploading file");
      }
    };
    reader.readAsText(file);
  }} />

  document.body.appendChild(elm);
  elm.click();
  elm.remove();
}
function resetdata() {
  chrome.storage.local.clear();
  location.reload();
}
