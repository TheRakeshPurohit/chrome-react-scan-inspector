
// Signal to the background script that we need injection
chrome.runtime.sendMessage({ action: 'injectReactScan' });
