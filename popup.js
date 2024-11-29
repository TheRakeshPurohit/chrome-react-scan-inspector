async function checkForReact() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return false;
  
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => !!(window.__REACT_DEVTOOLS_GLOBAL_HOOK__)
    });
  
    return result.result;
  }
  
  // Initialize popup
  document.addEventListener('DOMContentLoaded', async () => {
    const toggle = document.getElementById('toggleScan');
    const statusText = document.getElementById('reactStatus');
    
    // Load initial state
    const { reactScanEnabled } = await chrome.storage.local.get(['reactScanEnabled']);
    toggle.checked = reactScanEnabled ?? true;
  
    // Check for React
    try {
      const hasReact = await checkForReact();
      statusText.textContent = hasReact 
        ? 'React detected! Ready to scan.' 
        : 'No React detected on this page.';
      toggle.disabled = !hasReact;
    } catch (err) {
      statusText.textContent = 'Unable to check React status.';
      toggle.disabled = true;
    }
  
    // Handle toggle changes
    toggle.addEventListener('change', () => {
      const enabled = toggle.checked;
      chrome.storage.local.set({ reactScanEnabled: enabled });
      
      // Notify background script
      chrome.runtime.sendMessage({ 
        action: 'toggleReactScan', 
        enabled: enabled 
      });
    });
  });