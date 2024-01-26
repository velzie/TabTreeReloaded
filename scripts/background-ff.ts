(() => {

  chrome.tabs.query({ url: chrome.runtime.getURL("panel.html") }, tabs => {
    if (tabs.length > 0) return;
    chrome.windows.create({
      url: chrome.runtime.getURL("panel.html"),
      type: "popup",
      focused: true,
    });
  })
  function refresh() {
    chrome.tabs.query({
      windowType: "normal"
    }, tabs => {
      chrome.runtime.sendMessage({
        type: "tabs",
        data: tabs,
      })
    });
  }

  chrome.tabs.onCreated.addListener(() => {
    refresh();
  });
  chrome.tabs.onUpdated.addListener(() => {
    refresh();
  })
  chrome.tabs.onActivated.addListener(({ tabId }) => {
    refresh();
    setTimeout(() => {
      chrome.runtime.sendMessage({
        type: "active",
        data: tabId,
      })
    })
  })
  chrome.tabs.onRemoved.addListener(id => {
    chrome.runtime.sendMessage({
      type: "remove",
      data: id,
    })
  });
  chrome.runtime.onMessage.addListener(({ type, data }) => {
    switch (type) {
      case "init":
        refresh();
        break;
      case "tab":
        const { act, id, opts } = data;
        switch (act) {
          case "update":
            chrome.tabs.update(id, opts);
            break;
          case "remove":
            chrome.tabs.remove(id);
            break;
          case "new":
            chrome.tabs.create({});
            break;
        }
        break;
    }
  });

})();
