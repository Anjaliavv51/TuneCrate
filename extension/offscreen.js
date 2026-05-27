(function () {
  console.log('offscreen: initialized');
  var DB_NAME = 'tune-crate-library';
  var DB_VERSION = 1;
  var DB_STORE = 'tracks';

  function openLibraryDb() {
    return new Promise(function (resolve, reject) {
      if (!window.indexedDB) {
        resolve(null);
        return;
      }

      var request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = function (event) {
        var database = event.target.result;

        if (!database.objectStoreNames.contains(DB_STORE)) {
          database.createObjectStore(DB_STORE, { keyPath: 'key' });
        }
      };

      request.onsuccess = function (event) {
        resolve(event.target.result);
      };

      request.onerror = function () {
        reject(request.error);
      };
    });
  }

  function dbGetTrack(database, key) {
    return new Promise(function (resolve, reject) {
      if (!database) {
        resolve(null);
        return;
      }

      var transaction = database.transaction(DB_STORE, 'readonly');
      var store = transaction.objectStore(DB_STORE);
      var request = store.get(key);

      request.onsuccess = function () {
        resolve(request.result || null);
      };

      request.onerror = function () {
        reject(request.error);
      };
    });
  }

  var audio = document.getElementById('offscreenAudio');
  var currentBlobUrl = null;

  function revokeCurrentUrl() {
    if (currentBlobUrl) {
      try { URL.revokeObjectURL(currentBlobUrl); } catch (e) {}
      currentBlobUrl = null;
    }
  }

  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log('offscreen: received message', request);
    (async function () {
      try {
        if (!request || !request.action) {
          sendResponse({ status: 'ignored' });
          return;
        }

        if (request.action === 'offscreenPlay') {
          var key = request.trackKey;
          var db = await openLibraryDb();
          var record = db ? await dbGetTrack(db, key) : null;

          if (!record) {
            sendResponse({ status: 'missing' });
            return;
          }

          var blob = record.blob instanceof Blob ? record.blob : new Blob([record.blob], { type: record.type || 'audio/mpeg' });

          revokeCurrentUrl();
          currentBlobUrl = URL.createObjectURL(blob);
          audio.src = currentBlobUrl;
          await audio.play();
          console.log('offscreen: playing', key);
          sendResponse({ status: 'playing' });
          return;
        }

        if (request.action === 'offscreenPause') {
          audio.pause();
          console.log('offscreen: paused');
          sendResponse({ status: 'paused' });
          return;
        }

        if (request.action === 'offscreenSetVolume') {
          var v = Number(request.volume) || 0;
          audio.volume = Math.max(0, Math.min(1, v));
          console.log('offscreen: volume set', audio.volume);
          sendResponse({ status: 'volumeSet', volume: audio.volume });
          return;
        }

        if (request.action === 'offscreenSeek') {
          var t = Number(request.time) || 0;
          try { audio.currentTime = t; } catch (e) {}
          console.log('offscreen: seek', t);
          sendResponse({ status: 'seeked', time: audio.currentTime });
          return;
        }

        if (request.action === 'offscreenStop') {
          audio.pause();
          revokeCurrentUrl();
          audio.removeAttribute('src');
          console.log('offscreen: stopped');
          sendResponse({ status: 'stopped' });
          return;
        }

        sendResponse({ status: 'unknown' });
      } catch (err) {
        sendResponse({ status: 'error', error: String(err) });
      }
    })();

    return true; // indicate async response
  });

  // keep the document alive while audio is playing (best-effort)
  audio.addEventListener('ended', function () {
    // do nothing; offscreen can remain until explicitly closed
  });

}());
