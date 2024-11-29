const fs = require("fs");
const path = require("path");
(async () => {

  console.log("Creating content.js and background.js");

  console.log("Fetching React Scan code...");
  const reactScanContent = await (
    await fetch(
      "https://unpkg.com/react-scan/dist/auto.global.js"
    )
  ).text();

  console.log("Downloaded React Scan code: \n\`" + reactScanContent.substring(0, 100) + "\`...");

  function escapeInlineJs(code) {
    return code
      .replace(/\\/g, "\\\\")
      .replace(/`/g, "\\`")
      .replace(/\${/g, "\\${");
  }
  const escapedReactScan = escapeInlineJs(reactScanContent);

  // Create the content script that will run at document_start
  const contentScript = `
// Signal to the background script that we need injection
chrome.runtime.sendMessage({ action: 'injectReactScan' });
`;

  // Create the background script with toggle functionality
  const backgroundScript = `
// Store the React Scan code
const reactScanCode = \`
  ${escapedReactScan}
  
  // Initialize React Scan
  if (window.ReactScan) {
    window.ReactScan.scan({
      enabled: true,
      log: true
    });
  }
\`;

// Check if scanning should be enabled
async function shouldEnableScan() {
  const { reactScanEnabled } = await chrome.storage.local.get(['reactScanEnabled']);
  return reactScanEnabled ?? true;
}

// Listen for messages
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === 'injectReactScan' && sender.tab) {
    const enabled = await shouldEnableScan();
    if (enabled) {
      chrome.scripting.executeScript({
        target: { tabId: sender.tab.id },
        func: (code) => {
          // Create a script element
          const script = document.createElement('script');
          script.text = code;
          
          // Find the first script tag or append to head if none exists
          const firstScript = document.getElementsByTagName('script')[0];
          if (firstScript) {
            firstScript.parentNode.insertBefore(script, firstScript);
          } else {
            (document.head || document.documentElement).appendChild(script);
          }
          
          // Cleanup
          script.remove();
        },
        args: [reactScanCode],
        world: 'MAIN',
        injectImmediately: true
      })
      .catch(err => console.error('Failed to inject script:', err));
    }
  } else if (message.action === 'toggleReactScan') {
    // Reload the current tab when toggle changes
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
        chrome.tabs.reload(tab.id);
    }
  }
});
`;

  // Write all files
  fs.writeFileSync(path.join(__dirname, "content.js"), contentScript);
  fs.writeFileSync(path.join(__dirname, "background.js"), backgroundScript);
})()
  .then(() => {
    console.log("Successfully created extension files");
  })
  .catch((err) => {
    console.error("Failed to create extension files:", err);
  });