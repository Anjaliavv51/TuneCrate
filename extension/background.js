// Background script for the Chrome extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Dark Music Player extension installed');
});

// Keep the extension alive and maintain audio state
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'keepAlive') {
    sendResponse({ status: 'alive' });
    return;
  }

  // Ensure an offscreen document exists when we need persistent audio playback
  if (request.action === 'ensureOffscreenAndPlay') {
    (async function () {
      try {
        try {
          var offscreenUrl = chrome.runtime.getURL('offscreen.html');

          if (chrome.offscreen && chrome.offscreen.hasDocument) {
            var has = await chrome.offscreen.hasDocument();

            if (!has) {
              await chrome.offscreen.createDocument({ url: offscreenUrl, reasons: ['AUDIO_PLAYBACK'], justification: 'Play audio when popup is closed' });
            }
          } else if (chrome.offscreen && chrome.offscreen.createDocument) {
            await chrome.offscreen.createDocument({ url: offscreenUrl, reasons: ['AUDIO_PLAYBACK'], justification: 'Play audio when popup is closed' });
          }

          // small delay to let offscreen document initialize and register listeners
          await new Promise(function (res) { setTimeout(res, 350); });

          // forward play command to offscreen page and await reply
          var response = await new Promise(function (resolve) {
            try {
              chrome.runtime.sendMessage({ action: 'offscreenPlay', trackKey: request.trackKey }, function (resp) {
                resolve(resp);
              });
            } catch (e) {
              resolve({ status: 'error', error: String(e) });
            }
          });

          if (response && response.status === 'playing') {
            sendResponse({ status: 'ok' });
          } else if (response && response.status === 'missing') {
            sendResponse({ status: 'missing' });
          } else {
            sendResponse({ status: 'error', error: response && response.error });
          }
        } catch (err) {
          console.error('Offscreen create/play error:', err);
          sendResponse({ status: 'error', error: String(err) });
        }
      } catch (err) {
        console.error('Failed to create/offscreen or play:', err);
        sendResponse({ status: 'error', error: String(err) });
      }
    })();

    return true; // will respond asynchronously
  }

  // Forward generic offscreen control messages (pause/volume/seek/stop) to offscreen
  if (request.action && request.action.indexOf && request.action.indexOf('offscreen') === 0) {
    chrome.runtime.sendMessage(request, function (resp) {
      // no-op: forwarding
    });
    sendResponse({ status: 'forwarded' });
    return;
  }
});

// Manage extension state
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.musicPlayerState) {
    console.log('Music player state updated:', changes.musicPlayerState.newValue);
  }
});
