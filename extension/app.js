(function () {
  var STORAGE_STATE_KEY = 'musicPlayerState';
  var STORAGE_PLAYLIST_KEY = 'musicPlaylist';
  var DB_NAME = 'tune-crate-library';
  var DB_VERSION = 1;
  var DB_STORE = 'tracks';
  var FLOATING_SYMBOLS = ['♪', '♫', '♬', '🎵', '🎶', '🎼'];
  var hasChromeStorage = typeof chrome !== 'undefined' && chrome && chrome.storage && chrome.storage.local;

  function getStoredData(keys) {
    if (hasChromeStorage) {
      return new Promise(function (resolve) {
        chrome.storage.local.get(keys, function (result) {
          resolve(result || {});
        });
      });
    }

    var result = {};

    for (var index = 0; index < keys.length; index += 1) {
      var key = keys[index];
      var rawValue = localStorage.getItem(key);

      if (rawValue !== null) {
        try {
          result[key] = JSON.parse(rawValue);
        } catch (error) {
          result[key] = rawValue;
        }
      }
    }

    return Promise.resolve(result);
  }

  function setStoredData(data) {
    if (hasChromeStorage) {
      return new Promise(function (resolve) {
        chrome.storage.local.set(data, function () {
          resolve();
        });
      });
    }

    Object.keys(data).forEach(function (key) {
      localStorage.setItem(key, JSON.stringify(data[key]));
    });

    return Promise.resolve();
  }

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

  function dbReadAllTracks(database) {
    return new Promise(function (resolve, reject) {
      if (!database) {
        resolve([]);
        return;
      }

      var transaction = database.transaction(DB_STORE, 'readonly');
      var store = transaction.objectStore(DB_STORE);
      var request = store.getAll();

      request.onsuccess = function () {
        resolve(request.result || []);
      };

      request.onerror = function () {
        reject(request.error);
      };
    });
  }

  function dbPutTrack(database, record) {
    return new Promise(function (resolve, reject) {
      if (!database) {
        resolve();
        return;
      }

      var transaction = database.transaction(DB_STORE, 'readwrite');
      var store = transaction.objectStore(DB_STORE);
      var request = store.put(record);

      request.onsuccess = function () {
        resolve();
      };

      request.onerror = function () {
        reject(request.error);
      };
    });
  }

  function makeTrackKey(file) {
    return [file.name, file.size, file.lastModified || 0].join('|');
  }

  function formatTrackName(name) {
    return name.replace(/\.[^/.]+$/, '');
  }

  function clampVolume(value) {
    var numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
      return 0;
    }

    return Math.min(100, Math.max(0, numericValue));
  }

  function MusicPlayer() {
    this.audio = document.getElementById('audioPlayer');
    this.fileInput = document.getElementById('fileInput');
    this.playBtn = document.getElementById('playBtn');
    this.prevBtn = document.getElementById('prevBtn');
    this.nextBtn = document.getElementById('nextBtn');
    this.progressBar = document.getElementById('progressBar');
    this.progressFill = document.getElementById('progressFill');
    this.volumeSlider = document.getElementById('volumeSlider');
    this.volumeValue = document.getElementById('volumeValue');
    this.trackTitle = document.getElementById('trackTitle');
    this.trackDuration = document.getElementById('trackDuration');
    this.loopBtn = document.getElementById('loopBtn');
    this.shuffleBtn = document.getElementById('shuffleBtn');
    this.status = document.getElementById('status');
    this.backgroundAnimation = document.getElementById('backgroundAnimation');

    this.isPlaying = false;
    this.currentTrack = null;
    this.playlist = [];
    this.currentIndex = 0;
    this.isLooping = false;
    this.isShuffling = false;
    this.statusTimer = null;
    this.backgroundTimer = null;
    this.db = null;
    this.storageReady = false;

    this.attachEventListeners();
    this.createBackgroundAnimation();
    this.loadState();
    this.loadLibrary();
  }

  MusicPlayer.prototype.attachEventListeners = function () {
    var self = this;

    this.fileInput.addEventListener('change', function (event) {
      self.handleFileSelect(event);
    });

    this.playBtn.addEventListener('click', function () {
      self.togglePlay();
    });

    this.prevBtn.addEventListener('click', function () {
      self.previousTrack();
    });

    this.nextBtn.addEventListener('click', function () {
      self.nextTrack();
    });

    this.progressBar.addEventListener('click', function (event) {
      self.seekTo(event);
    });

    this.volumeSlider.addEventListener('input', function (event) {
      self.setVolume(event.target.value);
    });

    this.loopBtn.addEventListener('click', function () {
      self.toggleLoop();
    });

    this.shuffleBtn.addEventListener('click', function () {
      self.toggleShuffle();
    });

    this.audio.addEventListener('timeupdate', function () {
      self.updateProgress();
    });

    this.audio.addEventListener('ended', function () {
      self.handleTrackEnd();
    });

    this.audio.addEventListener('loadedmetadata', function () {
      self.updateDuration();
    });

    this.audio.addEventListener('error', function (event) {
      self.handleError(event);
    });

    window.addEventListener('beforeunload', function () {
      self.dispose();
    });
  };

  MusicPlayer.prototype.createBackgroundAnimation = function () {
    var self = this;

    if (!this.backgroundAnimation) {
      return;
    }

    this.backgroundTimer = window.setInterval(function () {
      var symbol = document.createElement('div');

      symbol.className = 'music-symbol';
      symbol.textContent = FLOATING_SYMBOLS[Math.floor(Math.random() * FLOATING_SYMBOLS.length)];
      symbol.style.left = Math.random() * 100 + '%';
      symbol.style.animationDelay = Math.random() * 2 + 's';
      symbol.style.fontSize = Math.random() * 10 + 15 + 'px';

      self.backgroundAnimation.appendChild(symbol);

      window.setTimeout(function () {
        if (symbol.parentNode) {
          symbol.parentNode.removeChild(symbol);
        }
      }, 8000);
    }, 1000);
  };

  MusicPlayer.prototype.handleFileSelect = function (event) {
    var files = Array.prototype.slice.call(event.target.files || []);

    if (!files.length) {
      return;
    }

    var addedCount = 0;
    var firstNewIndex = this.playlist.length;
    var self = this;
    var pending = [];

    for (var index = 0; index < files.length; index += 1) {
      var file = files[index];

      if (!(file.type.indexOf('audio/') === 0 || file.type.indexOf('video/') === 0)) {
        continue;
      }

      var trackKey = makeTrackKey(file);
      var existingTrack = this.playlist.find(function (track) {
        return track.key === trackKey;
      });

      if (existingTrack) {
        continue;
      }

      (function (selectedFile, selectedKey) {
        pending.push(
          self.storeTrack(selectedFile, selectedKey).then(function (record) {
            self.playlist.push(record);
            addedCount += 1;
          })
        );
      }(file, trackKey));
    }

    Promise.all(pending).then(function () {
      if (addedCount > 0) {
        self.savePlaylist();

        if (!self.currentTrack && self.playlist.length > 0) {
          self.currentIndex = firstNewIndex;
          self.loadTrack(self.currentIndex);
        }

        self.updateStatus('Added ' + addedCount + ' song(s). Total: ' + self.playlist.length);
      } else {
        self.updateStatus('No new songs added (already saved or invalid files)');
      }

      self.fileInput.value = '';
    }).catch(function () {
      self.updateStatus('Unable to save one or more files');
      self.fileInput.value = '';
    });
  };

  MusicPlayer.prototype.storeTrack = function (file, trackKey) {
    var self = this;

    return openLibraryDb().then(function (database) {
      self.db = database || self.db;

      if (!self.db) {
        return Promise.reject(new Error('IndexedDB unavailable'));
      }

      return dbPutTrack(self.db, {
        key: trackKey,
        name: file.name,
        size: file.size,
        lastModified: file.lastModified || 0,
        type: file.type,
        duration: null,
        id: Date.now() + Math.random(),
        blob: file
      }).then(function () {
        return {
          key: trackKey,
          name: file.name,
          size: file.size,
          lastModified: file.lastModified || 0,
          type: file.type,
          duration: null,
          id: Date.now() + Math.random(),
          blob: file,
          url: URL.createObjectURL(file)
        };
      });
    }).catch(function () {
      return {
        key: trackKey,
        name: file.name,
        size: file.size,
        lastModified: file.lastModified || 0,
        type: file.type,
        duration: null,
        id: Date.now() + Math.random(),
        blob: file,
        url: URL.createObjectURL(file)
      };
    });

    this.fileInput.value = '';
  };

  MusicPlayer.prototype.loadTrack = function (index) {
    if (index < 0 || index >= this.playlist.length) {
      return;
    }

    this.currentIndex = index;
    this.currentTrack = this.playlist[index];
    this.audio.src = this.currentTrack.url;
    this.trackTitle.textContent = formatTrackName(this.currentTrack.name);
    this.progressFill.style.width = '0%';
    this.trackDuration.textContent = '00:00 / 00:00';
    this.updateStatus('Loaded: ' + this.currentTrack.name);
    this.saveState();
  };

  MusicPlayer.prototype.togglePlay = function () {
    if (!this.currentTrack) {
      if (this.playlist.length > 0) {
        this.loadTrack(0);
      } else {
        this.updateStatus('Please add music files first');
        return;
      }
    }

    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  };

  MusicPlayer.prototype.play = function () {
    var self = this;

    // Try to create an offscreen audio player and play from there so playback survives popup close
    try {
      if (typeof chrome !== 'undefined' && chrome && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ action: 'ensureOffscreenAndPlay', trackKey: this.currentTrack.key }, function (response) {
          if (response && response.status === 'ok') {
            self.isPlaying = true;
            self.playBtn.textContent = '⏸';
            self.updateStatus('Playing: ' + self.currentTrack.name);
            self.saveState();
          } else {
            // fallback to local audio if offscreen unavailable
            self.audio.play().then(function () {
              self.isPlaying = true;
              self.playBtn.textContent = '⏸';
              self.updateStatus('Playing: ' + self.currentTrack.name);
              self.saveState();
            }).catch(function (error) {
              console.error('Error playing audio:', error);
              self.updateStatus('Error playing audio');
            });
          }
        });
      } else {
        this.audio.play().then(function () {
          self.isPlaying = true;
          self.playBtn.textContent = '⏸';
          self.updateStatus('Playing: ' + self.currentTrack.name);
          self.saveState();
        }).catch(function (error) {
          console.error('Error playing audio:', error);
          self.updateStatus('Error playing audio');
        });
      }
    } catch (err) {
      console.error('Play fallback error', err);
    }
  };

  MusicPlayer.prototype.pause = function () {
    var self = this;

    // forward pause to offscreen if present
    try {
      if (typeof chrome !== 'undefined' && chrome && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ action: 'offscreenPause' }, function () {
          // best-effort
        });
      }
    } catch (e) {}

    try { this.audio.pause(); } catch (e) {}
    this.isPlaying = false;
    this.playBtn.textContent = '▶';
    this.updateStatus('Paused');
    this.saveState();
  };

  MusicPlayer.prototype.previousTrack = function () {
    if (this.playlist.length === 0) {
      return;
    }

    if (this.isShuffling) {
      this.currentIndex = Math.floor(Math.random() * this.playlist.length);
    } else {
      this.currentIndex = this.currentIndex > 0 ? this.currentIndex - 1 : this.playlist.length - 1;
    }

    this.loadTrack(this.currentIndex);

    if (this.isPlaying) {
      this.play();
    }
  };

  MusicPlayer.prototype.nextTrack = function () {
    if (this.playlist.length === 0) {
      return;
    }

    if (this.isShuffling) {
      this.currentIndex = Math.floor(Math.random() * this.playlist.length);
    } else {
      this.currentIndex = this.currentIndex < this.playlist.length - 1 ? this.currentIndex + 1 : 0;
    }

    this.loadTrack(this.currentIndex);

    if (this.isPlaying) {
      this.play();
    }
  };

  MusicPlayer.prototype.seekTo = function (event) {
    if (!this.currentTrack) {
      return;
    }

    var rect = this.progressBar.getBoundingClientRect();
    var percent = (event.clientX - rect.left) / rect.width;
    var newTime = percent * this.audio.duration;

    if (Number.isFinite(newTime)) {
      this.audio.currentTime = newTime;
    }
  };

  MusicPlayer.prototype.setVolume = function (value) {
    var normalizedValue = clampVolume(value);
    this.audio.volume = normalizedValue / 100;
    this.volumeSlider.value = String(normalizedValue);
    this.volumeValue.textContent = normalizedValue + '%';

    // forward volume to offscreen (best-effort)
    try {
      if (typeof chrome !== 'undefined' && chrome && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ action: 'offscreenSetVolume', volume: (normalizedValue / 100) }, function () {});
      }
    } catch (e) {}

    this.saveState();
  };

  MusicPlayer.prototype.toggleLoop = function () {
    this.isLooping = !this.isLooping;
    this.audio.loop = this.isLooping;
    this.loopBtn.classList.toggle('active', this.isLooping);
    this.loopBtn.setAttribute('aria-pressed', String(this.isLooping));
    this.updateStatus(this.isLooping ? 'Loop enabled' : 'Loop disabled');
    this.saveState();
  };

  MusicPlayer.prototype.toggleShuffle = function () {
    this.isShuffling = !this.isShuffling;
    this.shuffleBtn.classList.toggle('active', this.isShuffling);
    this.shuffleBtn.setAttribute('aria-pressed', String(this.isShuffling));
    this.updateStatus(this.isShuffling ? 'Shuffle enabled' : 'Shuffle disabled');
    this.saveState();
  };

  MusicPlayer.prototype.updateProgress = function () {
    if (!this.audio.duration) {
      return;
    }

    var percent = this.audio.currentTime / this.audio.duration * 100;
    this.progressFill.style.width = percent + '%';
    this.progressBar.setAttribute('aria-valuenow', String(Math.round(percent)));
    this.trackDuration.textContent = this.formatTime(this.audio.currentTime) + ' / ' + this.formatTime(this.audio.duration);
  };

  MusicPlayer.prototype.updateDuration = function () {
    if (this.audio.duration && this.currentTrack) {
      this.trackDuration.textContent = '00:00 / ' + this.formatTime(this.audio.duration);
      this.currentTrack.duration = this.audio.duration;
      this.savePlaylist();
    }
  };

  MusicPlayer.prototype.handleTrackEnd = function () {
    if (this.isLooping) {
      return;
    }

    if (this.playlist.length > 1) {
      this.nextTrack();
    } else {
      this.isPlaying = false;
      this.playBtn.textContent = '▶';
      this.updateStatus('Playlist finished');
    }
  };

  MusicPlayer.prototype.handleError = function () {
    console.error('Audio error');
    this.updateStatus('Error loading audio file');
    this.isPlaying = false;
    this.playBtn.textContent = '▶';
  };

  MusicPlayer.prototype.formatTime = function (seconds) {
    if (!Number.isFinite(seconds)) {
      return '00:00';
    }

    var mins = Math.floor(seconds / 60);
    var secs = Math.floor(seconds % 60);

    return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
  };

  MusicPlayer.prototype.updateStatus = function (message) {
    var self = this;

    this.status.textContent = message;

    if (this.statusTimer) {
      window.clearTimeout(this.statusTimer);
    }

    this.statusTimer = window.setTimeout(function () {
      if (self.isPlaying && self.currentTrack) {
        self.status.textContent = 'Playing: ' + self.currentTrack.name;
      } else if (self.playlist.length > 0) {
        self.status.textContent = 'Ready - ' + self.playlist.length + ' song(s) loaded';
      } else {
        self.status.textContent = 'Ready to add music files';
      }
    }, 3000);
  };

  MusicPlayer.prototype.saveState = function () {
    var state = {
      isPlaying: this.isPlaying,
      currentTime: this.audio.currentTime,
      volume: this.audio.volume,
      isLooping: this.isLooping,
      isShuffling: this.isShuffling,
      currentIndex: this.currentIndex,
      trackName: this.currentTrack ? this.currentTrack.name : null
    };

    setStoredData({
      [STORAGE_STATE_KEY]: state
    });
  };

  MusicPlayer.prototype.savePlaylist = function () {
    var playlistData = this.playlist.map(function (track) {
      return {
        key: track.key,
        name: track.name,
        size: track.size,
        lastModified: track.lastModified,
        type: track.type,
        duration: track.duration,
        id: track.id
      };
    });

    setStoredData({
      [STORAGE_PLAYLIST_KEY]: playlistData
    });
  };

  MusicPlayer.prototype.loadPlaylist = function () {
    var self = this;

    getStoredData([STORAGE_PLAYLIST_KEY]).then(function (result) {
      if (result[STORAGE_PLAYLIST_KEY] && result[STORAGE_PLAYLIST_KEY].length > 0) {
        self.updateStatus('Previously had ' + result[STORAGE_PLAYLIST_KEY].length + ' songs loaded. Please re-add files.');
      }
    });
  };

  MusicPlayer.prototype.loadLibrary = function () {
    var self = this;

    openLibraryDb().then(function (database) {
      self.db = database;

      return dbReadAllTracks(database);
    }).then(function (records) {
      if (!records || records.length === 0) {
        self.storageReady = true;
        return;
      }

      self.playlist = records.map(function (record) {
        var blob = record.blob instanceof Blob ? record.blob : new Blob([record.blob], { type: record.type || 'audio/mpeg' });

        return {
          key: record.key,
          name: record.name,
          size: record.size,
          lastModified: record.lastModified || 0,
          type: record.type || blob.type,
          duration: record.duration || null,
          id: record.id,
          blob: blob,
          url: URL.createObjectURL(blob)
        };
      });

      self.storageReady = true;

      if (self.playlist.length > 0) {
        self.updateStatus('Restored ' + self.playlist.length + ' saved song(s).');

        if (!self.currentTrack) {
          self.currentIndex = Math.min(self.currentIndex, self.playlist.length - 1);
          self.loadTrack(self.currentIndex);
          self.pause();
        }
      }
    }).catch(function () {
      self.storageReady = true;
    });
  };

  MusicPlayer.prototype.loadState = function () {
    var self = this;

    getStoredData([STORAGE_STATE_KEY]).then(function (result) {
      var state = result[STORAGE_STATE_KEY];

      if (!state) {
        return;
      }

      self.volumeSlider.value = String(Math.round((state.volume || 0.7) * 100));
      self.setVolume(self.volumeSlider.value);

      self.isLooping = Boolean(state.isLooping);
      self.audio.loop = self.isLooping;
      self.loopBtn.classList.toggle('active', self.isLooping);
      self.loopBtn.setAttribute('aria-pressed', String(self.isLooping));

      self.isShuffling = Boolean(state.isShuffling);
      self.shuffleBtn.classList.toggle('active', self.isShuffling);
      self.shuffleBtn.setAttribute('aria-pressed', String(self.isShuffling));

      if (Number.isInteger(state.currentIndex)) {
        self.currentIndex = state.currentIndex;
      }
    });
  };

  MusicPlayer.prototype.dispose = function () {
    if (this.backgroundTimer) {
      window.clearInterval(this.backgroundTimer);
      this.backgroundTimer = null;
    }

    for (var index = 0; index < this.playlist.length; index += 1) {
      if (this.playlist[index] && this.playlist[index].url) {
        URL.revokeObjectURL(this.playlist[index].url);
      }
    }

    if (this.db && typeof this.db.close === 'function') {
      this.db.close();
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    window.musicPlayer = new MusicPlayer();
  });
}());
