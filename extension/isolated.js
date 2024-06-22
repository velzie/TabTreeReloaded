// dreamland-devtools content script

// inject script into the main world
let script = document.createElement('script');
script.src = chrome.runtime.getURL('generated/inject.js');
document.documentElement.appendChild(script);


// ... then proxy messages from main world to devtools pane
let port;

window.addEventListener('message', function(event) {
  port = chrome.runtime.connect({ name: 'dreamland-devtools' });

  if (event.source !== window) {
    return;
  }
  var message = event.data;

  if (typeof message !== 'object' || message === null ||
    message.source !== 'dreamland-devtools') {
    return;
  }

  port.postMessage(message);
});

