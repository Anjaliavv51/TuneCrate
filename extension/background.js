// Background script for the Chrome extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Dark Music Player extension installed');
});

// Keep the extension alive and maintain audio state
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'keepAlive') {
    sendResponse({ status: 'alive' });
  }
});

// Manage extension state
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.musicPlayerState) {
    console.log('Music player state updated:', changes.musicPlayerState.newValue);
  }
});
