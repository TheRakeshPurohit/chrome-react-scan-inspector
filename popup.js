  
  // Initialize popup
  document.addEventListener('DOMContentLoaded', async () => {
    const toggle = document.getElementById('toggleScan');
    const statusText = document.getElementById('reactStatus');
    
    // Load initial state
    const { reactScanEnabled } = await chrome.storage.local.get(['reactScanEnabled']);
    toggle.checked = reactScanEnabled ?? true;
  
    // Handle toggle changes
    toggle.addEventListener('change', async () => {
      const enabled = toggle.checked;
      await chrome.storage.local.set({ reactScanEnabled: enabled });
      
      // Notify background script and reload the page
      chrome.runtime.sendMessage({ 
        action: 'toggleReactScan', 
        enabled: enabled 
      }, async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          chrome.tabs.reload(tab.id);
        }
      });
    });
  });