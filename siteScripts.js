
import { musicLibrary } from "https://codepen.io/ClockBlock/pen/RNwjZWa/script.js";
import $ from "https://esm.sh/jquery";
import "https://esm.sh/jquery-ui";
 
let currentSongIndex = 0;
let currentAlbumSongs = [];
let shuffleMode = false;
let repeatMode = "off";
let activeButton = null;
let isPlaying = false;
let isDragging = false;
const fastForwardInterval = 10;
const rewindInterval = 10;

const progressSlider = document.querySelector(".progress-slider");
const progressBarr = document.querySelector(".progress-bar");
const progressElapsed = document.getElementById("progressElapsed");
const sliderThumb = document.getElementById("sliderThumb");
const timeToolTip = document.getElementById("timeToolTip");
const currentTimeDisplay = document.getElementById("currentTime");
const totalTimeDisplay = document.getElementById("totalTime");
const playPauseButton = document.querySelector("#btnPlayPause");
const btnPlay = document.getElementById("btnPlay");
const btnPause = document.getElementById("btnPause");
const skipForwardButton = document.querySelector(".skip-forward");
const skipBackwardButton = document.querySelector(".skip-backward");
const shuffleButton = document.querySelector(".shuffle");
const repeatButton = document.querySelector(".repeat");
const progressBar = document.createElement("div");
const songInfoIcons = document.querySelectorAll(".song-info-icon");
const dynamicArea = document.getElementById("dynamicArea");
const dynamicAreaBottom = document.getElementById("dynamicAreaBottom");
const similarArtistsPLAYING = document.getElementById("similarArtistsPLAYING");
const navItems = document.querySelectorAll(".cc_sticky-nav-item");



document.addEventListener("DOMContentLoaded", () => { // On page refresh
  document.body.appendChild(progressBar); // Top of page loader
  progressBar.id = "loadingBar";

  randomizeMe(musicLibrary); // Shuffles the Artists
  siteRouter(); // Identifies the page to load
  initQueueManager(); // Loads the Up Next Queue
  initializeFavorites(); // Loads Favorites
  initializePopovers(); // Initializes Similar Artists PopOvers
  loadFavorites();
}); 


/////////  R O U T I N G  &  H E L P E R  /////////////
////////////////////////////// Functions //////////////
///////////////////////////////////////////////////////
function clearDynamicArea() {
  dynamicArea.innerHTML = "";
  dynamicAreaBottom.innerHTML = "";
  $("#playlistMGR").addClass("hidden");
}
function setActiveLink(linkId) {
  navItems.forEach((item) => item.classList.remove("active"));
  const activeItem = document.getElementById(linkId)?.parentElement;
  if (activeItem) {
    activeItem.classList.add("active");
  }
}
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function randomizeMe(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
function animateTrackItems() {
  const trackItems = document.querySelectorAll(".trackItem");
  trackItems.forEach((item, index) => {
    setTimeout(() => {
      item.classList.add("visible");
    }, index * 100); // Stagger the animation for each item
  });
}
function populateCollectionDropdown() {
  const dropdowns = document.querySelectorAll(".selectCollection");
  dropdowns.forEach((dropdown) => {
    dropdown.innerHTML = `<option value="" disabled selected>Add to Playlist</option>`; // Default option

    // Add each playlist as an option in the dropdown
    playlists.forEach((playlist) => {
      const option = document.createElement("option");
      option.value = playlist.id;
      option.textContent = playlist.title;
      dropdown.appendChild(option);
    });
  });
}

function siteRouter() {
  siteMap(window.location.pathname, window.location.search);
  siteMapLinks();
  $(window).on("popstate", () => {
    siteMap(window.location.pathname, window.location.search);
  });
}
function siteMap(path, query) {
  switch (path) {


    case "/allArtists":
      executeLoadingSequence();
      clearDynamicArea();
      setActiveLink("showAll");
      scrollToTop();
      loadAllArtists();
      break;

    case "/myCollections":
      executeLoadingSequence();
      clearDynamicArea();
      setActiveLink("myCollections");
      scrollToTop();
      setTimeout(() => {
        $('#playlistMGR').removeClass('hidden').fadeIn(500, () => {
          renderPlaylistGallery();
        });
      }, 2000);
      break;

    case "/artists":
      const params = createDynamicURL(query);
      if (params.artist) {
        const artistName = params.artist.replace(/\./g, " ");
        pushToURL(artistName);
        executeLoadingSequence();
        clearDynamicArea();
        setActiveLink("myCollections");
        scrollToTop();
        loadArtistInfo(artistName);
      } else {
        loadThis("/allArtists");
      }
      break;
  }
}
function siteMapLinks() {
  const goHomeButton = $("#goHome");
  if (goHomeButton.length) {
    goHomeButton.on("click", (event) => {
      event.preventDefault();
      loadThis("/discover");
    });
  }

  const showAllButton = $("#showAll");
  if (showAllButton.length) {
    showAllButton.on("click", (event) => {
      event.preventDefault();
      loadThis("/allArtists");
    });
  }

  const collectionsButton = $("#myCollections");
  if (collectionsButton.length) {
    collectionsButton.on("click", (event) => {
      event.preventDefault();
      loadThis("/myCollections");
    });
  }

  $(document).on("click", ".artistPage", (event) => {
    event.preventDefault();
    const artistName = $(event.target).attr("data-artist");
    if (artistName) {
      const formattedArtistName = artistName.replace(/\s+/g, ".");
      loadThis(`/artists?artist=${formattedArtistName}`);
    }
  });
}
function loadThis(path) {
  window.history.pushState({}, "", path);
  siteMap(path, window.location.search);
}
function setPage(attrs) {
  Object.keys(attrs).forEach((key) => {
    $("body").attr(key, attrs[key]);
  });
}
function resetProgressBar() {
  const progressBar = $("#loadingBar");
  if (progressBar.length) {
    progressBar.css({ transition: "none", width: "0%", opacity: "1" });
    progressBar[0].offsetWidth;
    progressBar.css("transition", "");
  }
}
function startLoading() {
  const progressBar = $("#loadingBar");
  progressBar.fadeIn();
  if (!progressBar.length) return;

  const pauseWidth = randomInt(30, 75);
  const jumpWidth = randomInt(80, 90);

  function updateWidth(width, duration) {
    return new Promise((resolve) => {
      progressBar.css("transition", `width ${duration}ms ease-in-out`);
      progressBar.css("width", `${width}%`);
      setTimeout(resolve, duration);
    });
  }

  async function animateLoading() {
    progressBar.css("opacity", "1");
    await updateWidth(pauseWidth, 2000);
    await updateWidth(jumpWidth, 850);
    await updateWidth(100, 1000);
  }

  animateLoading();
}
function finishLoading() {
  const progressBar = $("#loadingBar");
  if (progressBar.length) {
    progressBar.css("transition", "width 0.75s ease-in-out, opacity 0.75s ease-in-out");
    progressBar.css("width", "100%");
    setTimeout(() => progressBar.fadeOut(750), 750);
    setTimeout(resetProgressBar, 1500);
  }
}
function toggleLoadingOverlay(visible) {
  const loadingOverlay = $("#pageLoader");
  if (loadingOverlay.length) {
    loadingOverlay.toggleClass("visible", visible);
  }
}
function showLoadingOverlay() {
  toggleLoadingOverlay(true);
}
function hideLoadingOverlay() {
  setTimeout(() => toggleLoadingOverlay(false), 1500);
}
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function createDynamicURL(query) {
  const params = {};
  if (query) {
    const queryString = query.substring(1);
    const pairs = queryString.split("&");
    pairs.forEach((pair) => {
      const [key, value] = pair.split("=");
      params[decodeURIComponent(key)] = decodeURIComponent(value || "");
    });
  }
  return params;
}
function pushToURL(artistName) {
  if (!artistName) return;
  const formattedName = artistName.replace(/\s+/g, ".");
  const newURL = `${window.location.origin}/artists?artist=${formattedName}`;
  window.history.pushState({}, "", newURL);
}
function fetchFromURL(query) {
  const params = new URLSearchParams(query);
  const artist = params.get("artist");
  if (artist) {
    return artist.replace(/\./g, " ");
  }
  return null;
}
function executeLoadingSequence() {
  showLoadingOverlay();
  startLoading();
  setTimeout(() => {
    finishLoading();
    hideLoadingOverlay();
  }, 2000);
}

$(document).on("click", "[data-transition='loaders']", function() {
  executeLoadingSequence();
});
//----------------------------------------------------------------





/////////  N O T I F I C A T I O N S  //////////////////
////////////////////////////////////////////////////////
/////////////////////////// T O A S T S  Types /////////
let toastCounter = 0;
let show = {
  notifyMe: notify,
  popUp: {
    showModal: showModal,
    createPlaylistModal: createPlaylistModal
  },
  error: {
    showError: showError
  }
};

function createToast(message, header, undoCallback) {
  toastCounter++;
  let toastId = 'toast-' + toastCounter;
  let toast = $(
    '<div id="' + toastId + '" class="toastElement">' +
      '<div class="toastBody">' +
        '<div class="toastIcon">' +
         header +
        '</div>' +
        '<div class="toastMessage">' +
          '<div class="toastTitle">Notification</div>' +
          '<div class="toastInfo">' + message + '</div>' +
          '<div class="toastActions">' +
            '<button class="buttonOne sm toast-undo">Undo</button>' +
          '</div>' +
        '</div>' +
        '<div class="toastClose">' +
          '<button class="buttonOne ghostButton" aria-label="Close notification">' +
            '<svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">' +
              '<path d="M18.3 5.71L12 12l6.3 6.29-1.42 1.42L10.59 13.41 4.29 19.71 2.87 18.29 9.17 12 2.87 5.71 4.29 4.29l6.3 6.3 6.3-6.3z"></path>' +
            '</svg>' +
          '</button>' +
        '</div>' +
      '</div>' +
      '<div class="timerWrapper" aria-hidden="true">' +
        '<div class="toastTimer"></div>' +
      '</div>' +
    '</div>'
  );
  $('#toastContainer').append(toast);
  toast.hide().fadeIn(400);

  let toastDuration = 5000;
  let timerInterval = 100;
  let timerState = {
    duration: toastDuration,
    interval: timerInterval,
    progress: toastDuration,
    timerId: null,
    startTime: 0,
    remaining: toastDuration,
    isPaused: false
  };

  function cleanupTimer() {
    if (timerState.timerId) {
      clearInterval(timerState.timerId);
      timerState.timerId = null;
    }
  }

  function timerUpdate() {
    let percentage = (timerState.progress / toastDuration) * 100;
    toast.find('.toastTimer').css('width', percentage + '%');
  }

  function startTimer() {
    timerState.startTime = Date.now();
    timerState.isPaused = false;
    timerState.timerId = setInterval(function() {
      let elapsed = Date.now() - timerState.startTime;
      let newRemaining = Math.max(0, timerState.remaining - elapsed);
      timerState.progress = newRemaining;
      timerUpdate();
      if (newRemaining <= 0) {
        cleanupTimer();
        closeToast();
      }
    }, timerInterval);
  }

  function pauseTimer() {
    if (!timerState.isPaused) {
      cleanupTimer();
      timerState.remaining = Math.max(0, timerState.remaining - (Date.now() - timerState.startTime));
      timerState.isPaused = true;
    }
  }

  function resumeTimer() {
    if (timerState.isPaused && timerState.remaining > 0) {
      startTimer();
    }
  }

  function closeToast() {
    toast.fadeOut(400, function() {
      toast.remove();
    });
  }

  toast.on('mouseenter', pauseTimer);
  toast.on('mouseleave', resumeTimer);
  toast.find('.toastClose button').on('click', function(e) {
    e.stopPropagation();
    cleanupTimer();
    closeToast();
  });
  toast.find('.toast-undo').on('click', function(e) {
    e.stopPropagation();
    if (typeof undoCallback === 'function') {
      undoCallback();
    }
    cleanupTimer();
    closeToast();
  });

  startTimer();
}
function notify(type, action, details) {
  let message = '';
  let header = '';
  let undoCallback = details && details.undoCallback ? details.undoCallback : null;

  // Added song to favorites
  if (type === 'favorites') {
    if (action === 'added') {
      header = '<i class="ph-fill ph-heart"></i>';
      message = '<i>' + details.song.title + '</i>' + ' was added to favorites!';
    } 
    else if (action === 'removed') {
      header = '<i class="ph ph-heart"></i>';
      message = '<i>' + details.song.title + '</i>' + ' was removed from favorites!';
    }
  } 

  // Added song to a Playlist
  else if (type === 'playlist') {
    if (action === 'added') {
      header = '<i class="ph ph-music-notes-plus"></i>';
      message = '<i>' + details.song.title + '</i>' + ' was added to your <a href="" class="dynamicURL toastLink playlist" data-dynamic="true" data-collections-drawer="open" data-playlist="' + details.playlistID + '">playlist</a>.';
    } 
    else if (action === 'removed') {
      header = '<i class="ph ph-music-notes-minus"></i>';
      message = '<i>' + details.song.title + '</i>' + ' was removed from your playlist!';
    }
  } 

  // Up Next Queue
  else if (type === 'upNext') {
    if (action === 'added') {
      header = '<i class="ph ph-list-plus"></i>'; // Add an appropriate icon
      message = '<i>' + details.song.title + '</i>' + ' will be played next!';
    } 
    else if (action === 'removed') {
      header = '<i class="ph ph-list-minus"></i>'; // Add an appropriate icon
      message = '<i>' + details.song.title + '</i>' + ' was removed from Queue!';
    }
  } 

  // Playlist create, modify, delete
  else if (type === 'playlistCreate') {
    header = '<i class="ph ph-plus-circle"></i>'; // Add an appropriate icon
    message = 'Playlist "' + details.playlist.title + '" has been created!';
  } 
  else if (type === 'playlistDelete') {
    header = '<i class="ph ph-trash"></i>'; // Add an appropriate icon
    message = 'Playlist "' + details.playlist.title + '" has been deleted!';
  } 
  else if (type === 'playlistUpdate') {
    header = '<i class="ph ph-pencil-circle"></i>'; // Add an appropriate icon
    message = 'Playlist "' + details.playlist.title + '" has been updated!';
  }

  // Call createToast with the correct parameters
  createToast(message, header, undoCallback);
}
function showModal(content, options) {
  options = options || {};
  let overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  let container = document.createElement('div');
  container.className = 'modal-container';

  if (options.title) {
    let titleEl = document.createElement('h2');
    titleEl.className = 'modal-title';
    titleEl.textContent = options.title;
    container.appendChild(titleEl);
  }

  let contentEl = document.createElement('div');
  contentEl.className = 'modal-content';
  if (typeof content === 'string') {
    contentEl.innerHTML = content;
  } else {
    contentEl.appendChild(content);
  }
  container.appendChild(contentEl);

  if (options.buttons && $.isArray(options.buttons)) {
    let btnContainer = document.createElement('div');
    btnContainer.className = 'modal-buttons';
    options.buttons.forEach(function(btnOpt) {
      let btn = document.createElement('button');
      btn.textContent = btnOpt.text;
      btn.className = btnOpt.className || '';
      btn.addEventListener('click', function() {
        if (typeof btnOpt.onClick === 'function') {
          btnOpt.onClick();
        }
        overlay.parentNode.removeChild(overlay);
      });
      btnContainer.appendChild(btn);
    });
    container.appendChild(btnContainer);
  }

  overlay.appendChild(container);
  document.body.appendChild(overlay);
}
function createPlaylistModal(onSubmit) {
  let content = '\
    <div class="modal-form">\
      <label>Playlist Title:</label>\
      <input type="text" id="modalPlaylistTitle" placeholder="Enter title">\
      <label>Description:</label>\
      <textarea id="modalPlaylistDescription" placeholder="Enter description"></textarea>\
    </div>';
  showModal(content, {
    title: 'Create New Playlist',
    buttons: [
      { text: 'Cancel', className: 'btn-cancel' },
      { text: 'Create', className: 'btn-create', onClick: function() {
          let title = document.getElementById('modalPlaylistTitle').value;
          let description = document.getElementById('modalPlaylistDescription').value;
          onSubmit({ title: title, description: description });
        }
      }
    ]
  });
}
function showError(message) {
  let errorToast = document.createElement('div');
  errorToast.className = 'error-toast';
  errorToast.textContent = message;
  document.body.appendChild(errorToast);
  setTimeout(function() {
    errorToast.parentNode.removeChild(errorToast);
  }, 4000);
}




/**
// Example Usage
function addSongToFavorites(song) {
  show.notifyMe("favorites", "added", {
    song: song,
    undoCallback: function() {
      console.log("Undo: removing " + song.title + " from favorites");
    }
  });
}

function addSongToPlaylist(song, playlistID) {
  show.notifyMe("playlist", "added", {
    song: song,
    playlistID: playlistID,
    undoCallback: function() {
      console.log("Undo: removing " + song.title + " from playlist " + playlistID);
    }
  });
}

function handleMissingPlaylistError() {
  show.error.showError("No playlist selected! Please choose a playlist before clicking Save.");
}

function openCreatePlaylistModal() {
  show.popUp.createPlaylistModal(function(playlistData) {
    console.log("Creating playlist with data:", playlistData);
    show.notifyMe("playlistCreate", "added", {
      playlist: { title: playlistData.title }
    });
  });
}
**/
//----------------------------------------------------------------




/////////////////////////////////////////////////////////////////
/////////  M U S I C  P L A Y E R  //////////////////////////////
//////// Android Media Session API /////////////////////////////

setInterval(() => {
 if (currentState === AudioState.PLAYING) {
  updateProgress();
 }
}, 500);

const AudioState = {
 PLAYING: "playing",
 PAUSED: "paused",
 STOPPED: "stopped",
};
const audioElement = new Audio();

let currentState = AudioState.STOPPED;
let songPlaying = null;
let artistPlaying = null;
let albumPlaying = null;

audioElement.playbackRate = 1.0;




function syncMediaSession() {
  if ("setPositionState" in navigator.mediaSession) {
    navigator.mediaSession.setPositionState({
      duration: audioElement.duration,
      playbackRate: audioElement.playbackRate,
      position: audioElement.currentTime,
    });
  }
  updateProgress();
}
function updateProgress() {
  if (!audioElement.duration || isNaN(audioElement.duration)) return;
  if (isNaN(audioElement.currentTime)) return;

  const percent = (audioElement.currentTime / audioElement.duration) * 100;
  progressElapsed.style.width = `${percent}%`;
  sliderThumb.style.left = `${percent}%`;
  currentTimeDisplay.textContent = formatTime(audioElement.currentTime);
  totalTimeDisplay.textContent = formatTime(audioElement.duration);

  syncMediaSession(); // Call this instead of updatePositionState
}


function handleSeekTo(details) {
    audioElement.currentTime = details.seekTime;
    syncMediaSession();
  }



function playSong(song) {
  songPlaying = song.title;
  artistPlaying = song.artist;
  albumPlaying = song.album;

  if (song) {
    audioElement.src = song.downloadPath;
    audioElement
      .play()
      .then(() => syncMediaSession())
      .catch(console.error);
  } else {
    console.error("No Audio File for this song.");
    return;
}

/**
    if (currentlyPlayingSong) {
      currentlyPlayingSong.classList.remove("playing");
    }
    currentSongIndex.classList.add("playing");
    currentlyPlayingSong = currentSongIndex;
**/
    updateUI(song);
    updateMediaSession(song);
    audioElement.addEventListener("ended", handleSongEnd);
  }
function playAudio() {
  audioElement.play();
  currentState = AudioState.PLAYING;
  updateMediaSessionPlaybackState();
  togglePlayPauseIcons();
  syncMediaSession();
}
function pauseAudio() {
  audioElement.pause();
  currentState = AudioState.PAUSED;
  updateMediaSessionPlaybackState();
  togglePlayPauseIcons();
  syncMediaSession();
}



function handleSongEnd() {
  currentState = AudioState.STOPPED;

/**
  if (currentlyPlayingSong) {
    currentlyPlayingSong.classList.remove("playing");
    currentlyPlayingSong = null;
  }
**/
  songCardUpdate();
  songEnd();
}


function songEnd() {
  if (repeatMode === "one") {
    playSong(currentAlbumSongs[currentSongIndex]);
  } else if (queue.length > 0) {
    playNextSong();
  } else if (shuffleMode) {
    currentSongIndex = Math.floor(Math.random() * currentAlbumSongs.length);
    playSong(currentAlbumSongs[currentSongIndex]);
  } else {
    currentSongIndex = (currentSongIndex + 1) % currentAlbumSongs.length;
    if (currentSongIndex === 0 && repeatMode !== "all") {
      stopAudio();
    } else {
      playSong(currentAlbumSongs[currentSongIndex]);
    }
  }
}







function skipForward() {
 if (shuffleMode) {
  currentSongIndex = Math.floor(Math.random() * currentAlbumSongs.length);
 } else {
  currentSongIndex = (currentSongIndex + 1) % currentAlbumSongs.length;
 }
 playSong(currentAlbumSongs[currentSongIndex]);
}
function skipBackward() {
 if (audioElement.currentTime > 3) {
  audioElement.currentTime = 0;
 } else {
  if (shuffleMode) {
   currentSongIndex = Math.floor(Math.random() * currentAlbumSongs.length);
  } else {
   currentSongIndex = (currentSongIndex - 1 + currentAlbumSongs.length) % currentAlbumSongs.length;
  }
  playSong(currentAlbumSongs[currentSongIndex]);
 }
}
function toggleShuffle() {
 shuffleMode = !shuffleMode;
 $("#shuffleButton").toggleClass("active", shuffleMode);
}
function toggleRepeat() {
 switch (repeatMode) {
  case "off":
   repeatMode = "one";
   $("#repeatButton").removeClass("ph-infinity").addClass("ph-number-circle-one active").css("color", "#262626");
   break;
  case "one":
   repeatMode = "all";
   $("#repeatButton").removeClass("ph-number-circle-one").addClass("ph-repeat-once active").css("color", "#262626");
   break;
  case "all":
   repeatMode = "off";
   $("#repeatButton").removeClass("ph-repeat-once active").addClass("ph-infinity");
   break;
 }
}

function seek() {
 const seekTime = (progressSlider.value / 100) * audioElement.duration;
 audioElement.currentTime = seekTime;
}
function startDragging() {
 isDragging = true;
 audioElement.removeEventListener("timeupdate", updateProgress);
}
function stopDragging() {
 if (isDragging) {
  const newTime = (progressElapsed.offsetWidth / progressBarr.offsetWidth) * audioElement.duration;
  audioElement.currentTime = newTime;

  if (currentState === AudioState.PLAYING) {
   audioElement.play();
  }
  audioElement.addEventListener("timeupdate", updateProgress);
  isDragging = false;
 }
}
function handleDragging(e) {
 if (isDragging) {
  updateSlider(e);
 }
}

function stopAudio() {
 audioElement.pause();
 audioElement.currentTime = 0;
 currentState = AudioState.STOPPED;
 updateMediaSessionPlaybackState();
 togglePlayPauseIcons();
}



function handleSeekBackward(details) {
  audioElement.currentTime = Math.max(0, audioElement.currentTime - rewindInterval);
  updateProgress();
 }
function handleSeekForward(details) {
  audioElement.currentTime = Math.min(audioElement.duration, audioElement.currentTime + fastForwardInterval);
  updateProgress();
 }

function updateUI(song) {
 $(".updateSongTitle").text(songPlaying);
 $(".updateArtistName").text(artistPlaying);
 $(".updateAlbumName").text(albumPlaying);

 const albumNowPlaying = albumPlaying.toLowerCase().replace(/\s/g, "");
 const newAlbumCoverUrl = `https://mybeats.cloud/mediaFiles/albumCovers/${albumNowPlaying}.png`;
 $("#nowPlayingArt, #smallAlbumCover").attr("src", newAlbumCoverUrl).attr("alt", albumPlaying);

 $("#download-icon").attr("href", song.downloadPath).attr("download", song.title);
}
function updatePositionState() {
 if ("setPositionState" in navigator.mediaSession) {
  navigator.mediaSession.setPositionState({
   duration: audioElement.duration,
   playbackRate: audioElement.playbackRate,
   position: audioElement.currentTime,
  });
 }
}
function updateMediaSession(song) {
 if ("mediaSession" in navigator) {
  const artworkUrl = `https://mybeats.cloud/mediaFiles/artistPortraits/${artistPlaying.replace(/\s/g, "").toLowerCase()}.png`;
  navigator.mediaSession.metadata = new MediaMetadata({
   title: song.title || "Unknown Title",
   artist: song.artist || "Unknown Artist",
   album: song.album || "Unknown Album",
   artwork: [{ src: artworkUrl, sizes: "512x512", type: "image/png" }],
  });

  updateMediaSessionPlaybackState();

  navigator.mediaSession.setActionHandler("play", playAudio);
  navigator.mediaSession.setActionHandler("pause", pauseAudio);
  navigator.mediaSession.setActionHandler("stop", stopAudio);
  navigator.mediaSession.setActionHandler("previoustrack", skipBackward);
  navigator.mediaSession.setActionHandler("nexttrack", skipForward);
  navigator.mediaSession.setActionHandler("seekbackward", handleSeekBackward);
  navigator.mediaSession.setActionHandler("seekforward", handleSeekForward);
  navigator.mediaSession.setActionHandler("seekto", handleSeekTo);
  navigator.mediaSession.setActionHandler("repeatmode", toggleRepeat);
  navigator.mediaSession.setActionHandler("shufflemode", toggleShuffle);
  navigator.mediaSession.setActionHandler("togglefavorite", () => toggleFavorite(song));
 }
}
function updateMediaSessionPlaybackState() {
 navigator.mediaSession.playbackState = currentState === AudioState.PLAYING ? "playing" : "paused";
}
function togglePlayPauseIcons() {
 if (currentState === AudioState.PLAYING) {
  btnPlay.style.display = "none";
  btnPause.style.display = "inline";
 } else {
  btnPlay.style.display = "inline";
  btnPause.style.display = "none";
 }
}

function formatTime(seconds) {
 const minutes = Math.floor(seconds / 60);
 const remainingSeconds = Math.floor(seconds % 60);
 return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

window.addEventListener("message", (event) => {
 if (event.data && event.data.event === "onStateChange") {
  const state = event.data.info;
  currentState = state === 1 ? AudioState.PLAYING : AudioState.PAUSED;
  updateMediaSessionPlaybackState();
 }
});

audioElement.addEventListener("loadedmetadata", () => {
 totalTimeDisplay.textContent = formatTime(audioElement.duration);
});
audioElement.addEventListener("ratechange", syncMediaSession);
audioElement.addEventListener("ended", () => {
 currentState = AudioState.STOPPED;
 document.querySelectorAll(".song.playing").forEach((songElem) => songElem.classList.remove("playing"));
 togglePlayPauseIcons();
});
audioElement.addEventListener("timeupdate", () => {
  if (currentState === AudioState.PLAYING) {
    syncMediaSession();
  }
});
audioElement.addEventListener("play", () => {
  currentState = AudioState.PLAYING;
  togglePlayPauseIcons();
  syncMediaSession();
});
audioElement.addEventListener("pause", () => {
  currentState = AudioState.PAUSED;
  togglePlayPauseIcons();
  syncMediaSession();
});

audioElement.addEventListener("seeking", syncMediaSession);
playPauseButton.addEventListener("click", () => {
 currentState === AudioState.PLAYING ? pauseAudio() : playAudio();
});
skipForwardButton.addEventListener("click", skipForward);
skipBackwardButton.addEventListener("click", skipBackward);
shuffleButton.addEventListener("click", toggleShuffle);
repeatButton.addEventListener("click", toggleRepeat);
//----------------------------------------------------------------







/////////////////////////////////////////////////////////
/////////  P R I M A R Y  Functions  ////////////////////
/////////////////////////////////////////////////////////
let activeSongElement = null;
var pendingPopoverData = null;

function findSongById(songId) {
  for (const artist of musicLibrary) {
    for (const album of artist.albums) {
      const song = album.songs.find((song) => song.id === songId);
      if (song) {
        return {
          ...song,
          artist: artist.artist,
          album: album.album,
        };
      }
    }
  }
  return null;
}
function discoverMusic() {
  setPage({ "data-page": "home" });
  $("#artistNameTitle").hide();

  const newestArtists = musicLibrary.slice(0, 5);

  setTimeout(() => {
    const dynamicArea = $("#dynamicArea");
    const newestArtistsContainer = $("<div>").attr("id", "newestArtistsContainer");
    dynamicArea.append(newestArtistsContainer);

    newestArtists.forEach((artist) => {
      const artistId = artist.artist.toLowerCase().replace(/\s/g, "");
      const artistDiv = $("<div>")
        .attr("data-transition", "loaders")
        .addClass("newest-artist")
        .html(`<h3>${artist.artist}</h3><div class="artist-albums" id="albums-${artistId}"></div>`);
      newestArtistsContainer.append(artistDiv);

      const artistAlbumsDiv = $(`#albums-${artistId}`);
      artist.albums.forEach((album) => {
        const albumId = album.album.toLowerCase().replace(/\s/g, "");
        const albumDiv = $("<div>")
          .addClass("album-cover")
          .attr("data-album", album.album)
          .html(`<img src="https://mybeats.cloud/mediaFiles/albumCovers/${albumId}.png" alt="${album.album}"><h5>${album.album}</h5>`);

        albumDiv.on("click", () => {
          setTimeout(() => {
            clearDynamicArea();
            loadArtistInfo(artist.artist);
            const songList = $("<div>").attr("id", "song-list");
            dynamicArea.append(songList);
            loadAlbumSongs(album.album, albumDiv);
            $("#artistNameTitle").show().addClass("focusInContract");

            setTimeout(() => {
              const albumButton = $(`button[data-album="${album.album}"]`);
              if (albumButton.length) {
                updateActiveButton(albumButton);
              }
            }, 2000);
          }, 1500);
        });

        artistAlbumsDiv.append(albumDiv);
      });
    });
  }, 1000);
}
function loadAllArtists() {
  setPage({ "data-page": "all", "data-artist": null });
  $("#artistNameTitle").hide();

  setTimeout(() => {
    const dynamicArea = $("#dynamicArea");
    const allArtistsContainer = $("<div>")
      .attr("id", "allArtistsContainer")
      .addClass("gallery visible");
    dynamicArea.append(allArtistsContainer);
    randomizeMe(musicLibrary);

    musicLibrary.forEach((artist) => {
      const artistDiv = $("<div>")
        .addClass("artistPage")
        .attr("data-artist", artist.artist)
        .attr("data-aos", "fade-up");

      const circlePhotoContainer = $("<div>").addClass("circlePhoto");
      const artistImage = $("<img>").attr("src", `https://mybeats.cloud/mediaFiles/artistPortraits/${artist.artist.toLowerCase().replace(/\s/g, "")}.png`).attr("alt", artist.artist);
      circlePhotoContainer.append(artistImage);

      const artistLink = $("<a>")
        .attr("href", "#")
        .attr("data-transition", "loaders")
        .on("click", (event) => {
          event.preventDefault();
          allArtistsContainer.css({ width: "0", transition: "width 1s ease", display: "none" });
          loadArtistInfo(artist.artist);
          const songList = $("<div>").attr("id", "song-list");
          dynamicArea.append(songList);
          $("#artistNameTitle").show();
        });

      const artistNameHeading = $("<h4>").text(artist.artist).addClass("artistItemName");
      artistLink.append(artistNameHeading);
      artistDiv.append(circlePhotoContainer).append(artistLink);
      allArtistsContainer.append(artistDiv);
    });

    console.log("All Artists loaded successfully.");
  }, 1000);

  setActiveLink("showAll");
}
function loadArtistInfo(artistName) {
  setPage({ "data-page": "artist", "data-artist": artistName });
  pushToURL(artistName);
  $("#artistNameTitle").removeClass("artistInfoContent focusInContract").addClass("blurOUT");

  const artist = musicLibrary.find((artist) => artist.artist === artistName);
  const artistContainer = $("<div>")
    .attr("id", "artistDiscography")
    .addClass("artistDiscography");
  clearDynamicArea();
  $("#dynamicArea").append(artistContainer);

  loadPlayingArtistSimilar(artistName);

  setTimeout(() => {
    artistContainer.empty();

    if (artist) {
      artistContainer.html(`
        <div class="desktopStyles">
          <div class="mainalbumcover">
            <img src="https://mybeats.cloud/mediaFiles/artistPortraits/${artistName.toLowerCase().replace(/\s/g, "")}.png" alt="${artistName}">
          </div>
          <div class="scrollingButtons" style="overflow-y: visible;">
            ${artist.albums.map((album) => `<button class="btnAlbums" data-album="${album.album}">${album.album}</button>`).join("")}
          </div>
        </div>
      `);

      $("#artistNameTitle").text(artist.artist);
      setTimeout(() => {
        $("#artistNameTitle").removeClass("blurOUT").addClass("focusInContract");
      }, 2000);

      artistContainer.find(".btnAlbums").on("click", (event) => {
        const albumName = $(event.currentTarget).attr("data-album");
        loadAlbumSongs(albumName, $(event.currentTarget));
      });
    } else {
      console.log("Artist not found");
    }

    scrollToTop();
  }, 1850);

  setActiveLink("artistDiscography");
}
function loadAlbumSongs(albumName, button) {
  let songListContainer = $("#song-list");
  if (songListContainer.length === 0) {
    songListContainer = $("<div>").attr("id", "song-list").addClass("song-list");
    $("#dynamicArea").append(songListContainer);
  }

  songListContainer.find(".song").removeClass("visible");
  populateCollectionDropdown();

  setTimeout(() => {
    songListContainer.empty();
    const artist = musicLibrary.find((artist) => artist.albums.some((album) => album.album === albumName));
    if (!artist) return;

    const album = artist.albums.find((album) => album.album === albumName);
    if (!album) return;

    currentAlbumSongs = album.songs.map((song) => ({ ...song, artist: artist.artist, album: album.album }));

    currentAlbumSongs.forEach((song, index) => {
      const songElement = createElementsSONGS(song, index);
      songListContainer.append(songElement);
      setTimeout(() => songElement.addClass("visible"), 10);
    });

    if (activeButton) activeButton.removeClass("active");
    button.addClass("active");
    activeButton = button;

    loadFavorites();
    animateTrackItems();
  }, 1500);
}
function updateActiveButton($button) {
  if (activeButton) activeButton.removeClass("active");
  $button.addClass("active");
  activeButton = $button;
}
function createElementsSONGS(song, index) {
  const songElement = $("<div>")
    .addClass("song")
    .attr("id", `song${song.id}`)
    .attr("data-id", song.id)
    .attr("data-title", song.title)
    .attr("data-artist", song.artist)
    .attr("data-album", song.album)
    .attr("data-song-id", song.id);

  songElement.html(`

  <div class="heart" id="favourites">
    <i class="ph-fill ph-heart"></i>
  </div>

  <div class="duration">
    <span>${song.duration}</span>
    <i class="ph-fill ph-play-circle"></i>
  </div>

  <div class="title"><h7 class="marquee">${song.title}</h7></div>

  <div class="actions">
    <div class="iconz group relative" title="Add to Playlist">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6" class="w-8 hover:scale-125 duration-200 hover:stroke-blue-500">
        <path
          fill-rule="evenodd"
          d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 9a.75.75 0 0 0-1.5 0v2.25H9a.75.75 0 0 0 0 1.5h2.25V15a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-2.25V9Z"
          clip-rule="evenodd"
        />
      </svg>
      <span
        data-action="addToPlaylist"
        class="absolute -top-14 left-[50%] -translate-x-[50%] z-20 origin-left scale-0 px-3 rounded-lg border border-gray-300 bg-white py-2 text-sm font-bold shadow-md transition-all duration-300 ease-in-out group-hover:scale-100"
      >
        Playlist
      </span>
    </div>

    <div class="iconz group relative" title="Play Next">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6" class="w-8 hover:scale-125 duration-200 hover:stroke-blue-500">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
      </svg>
      <span
        data-action="playNext"
        class="absolute -top-14 left-[50%] -translate-x-[50%] z-20 origin-left scale-0 px-3 rounded-lg border border-gray-300 bg-white py-2 text-sm font-bold shadow-md transition-all duration-300 ease-in-out group-hover:scale-100"
      >
        Play Next
      </span>
    </div>

    <div class="iconz group relative" title="Download">
      <svg stroke-linejoin="round" stroke-linecap="round" stroke-width="2" stroke="currentColor" fill="none" viewBox="0 0 24 24" class="w-8 hover:scale-125 duration-200 hover:stroke-blue-500">
        <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17h16"></path>
      </svg>
      <span
        data-action="download"
        class="absolute -top-14 left-[50%] -translate-x-[50%] z-20 origin-left scale-0 px-3 rounded-lg border border-gray-300 bg-white py-2 text-sm font-bold shadow-md transition-all duration-300 ease-in-out group-hover:scale-100"
      >
        Download
      </span>
    </div>

    <div class="iconz save-offline group relative" data-song-id="${song.id}" data-title="${song.title}" data-url="${song.downloadPath}" title="Offline">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
        <path fill-rule="evenodd" d="M4.5 9.75a6 6 0 0 1 11.573-2.226 3.75 3.75 0 0 1 4.133 4.303A4.5 4.5 0 0 1 18 20.25H6.75a5.25 5.25 0 0 1-2.23-10.004 6.072 6.072 0 0 1-.02-.496Z" clip-rule="evenodd" />
      </svg>
      <span
        data-action="saveOffline"
        class="absolute -top-14 left-[50%] -translate-x-[50%] z-20 origin-left scale-0 px-3 rounded-lg border border-gray-300 bg-white py-2 text-sm font-bold shadow-md transition-all duration-300 ease-in-out group-hover:scale-100"
      >
        Offline
      </span>
    </div>
  </div>

  `);

  addSongElementEventListeners(songElement, song, index);
  return songElement;
}
function addSongElementEventListeners($songElement, song, index) {
  var $iconActions = $songElement.find(".icon-actions");
  var $addToPlaylistIcon = $songElement.find('[data-action="addToPlaylist"]');
  var $addToQueueIcon = $songElement.find('[data-action="playNext"]');
  var $downloadIcon = $songElement.find('[data-action="download"]');
  var $saveOfflineIcon = $songElement.find('[data-action="saveOffline"]');

  $addToPlaylistIcon.on("click", function (event) {
    event.preventDefault();
    popOverPLAY($addToPlaylistIcon, song);
  });

  $addToQueueIcon.on("click", function (event) {
    event.preventDefault();
    addToQueue(song);
  });

  $downloadIcon.on("click", function (event) {
    event.preventDefault();
    event.stopPropagation();

    var $popover = $("<div>").addClass("download-popover").html(`
      <div id="downloadLoading" class="loading">
        <div class="spinner"></div>
        <p>Finding File...</p>
      </div>
      <div id="downloadConfirmation" class="confirmation" style="display:none;">
        <p>Are you sure you want to download this file?</p>
        <button id="confirmDownload">Yes</button>
        <button id="cancelDownload">No</button>
      </div>
    `);
    $("body").append($popover);

    var $loading = $popover.find("#downloadLoading");
    var $confirmation = $popover.find("#downloadConfirmation");

    setTimeout(function () {
      $loading.hide();
      $confirmation.show();

      $popover.find("#confirmDownload").on("click", function () {
        var $link = $("<a>")
          .attr("href", song.downloadPath)
          .attr("download", song.title + ".mp3");
        $("body").append($link);
        $link[0].click();
        $link.remove();
        $popover.remove();
      });

      $popover.find("#cancelDownload").on("click", function () {
        $popover.remove();
      });
    }, 2000);
  });

  $saveOfflineIcon.on("click", function (event) {
    event.preventDefault();
    var songData = { id: song.id, title: song.title, url: song.downloadPath };
    var offlineSongs = JSON.parse(localStorage.getItem("offlineSongs") || "[]");
    var isAlreadySaved = offlineSongs.some(function (savedSong) {
      return savedSong.id === song.id;
    });
    if (!isAlreadySaved) {
      offlineSongs.push(songData);
      localStorage.setItem("offlineSongs", JSON.stringify(offlineSongs));
      songElement.find(".save-offline").append('<span class="offline-check" style="color:green; margin-left:5px;">&#x2714;</span>');
      alert("Song saved for offline playback!");
    } else {
      alert("This song is already saved for offline playback.");
    }
  });

  $songElement.on("click", function (event) {
    event.stopPropagation();
    if (activeSongElement && activeSongElement.is($songElement)) return;
    if (activeSongElement) {
      activeSongElement.find(".icon-actions").removeClass("visible");
    }
    $iconActions.addClass("visible");
    activeSongElement = $songElement;
  });

  $iconActions.on("click", function (event) {
    event.stopPropagation();
  });

  $songElement.on("dblclick", function () {
    currentSongIndex = index;
    playSong(currentAlbumSongs[currentSongIndex]);
  });

  // Clicking anywhere outside hides the icon actions
  $(document).on("click.songActions", function (event) {
    if (activeSongElement && !activeSongElement[0].contains(event.target)) {
      activeSongElement.find(".icon-actions").removeClass("visible");
      activeSongElement = null;
    }
  });
}
function popOverPLAY($button, song, selectedPlaylistId) {
  // Create the popover element with the "popover-content" class and initial "hidden" state.
  var $popover = $("<div>")
    .addClass("popover-content hidden");

  // Build the playlist radio buttons HTML.
  var playlistOptionsHtml = playlists
    .map(function (playlist) {
      var checked = selectedPlaylistId && selectedPlaylistId == playlist.id ? "checked" : "";
      return `
        <div class="radio-button">
          <input type="radio" id="radio${playlist.id}" name="radio-group" value="${playlist.id}" ${checked}>
          <label for="radio${playlist.id}" class="text-white">${playlist.title}</label>
        </div>`;
    })
    .join("");
  // Add the "Create New Playlist" option.
  playlistOptionsHtml += `
        <div class="radio-button">
          <input type="radio" id="createNewPlaylist" name="radio-group" value="new">
          <label for="createNewPlaylist" class="text-white">Create New Playlist</label>
        </div>`;

  $popover.html(`
  

<div id="addToListPop" role="tooltip" class="popover-container">
  <!-- Header -->
  <div class="playlistPopHeader">
    <h3 class="playlistPopTitle">Add to Playlist</h3>
  </div>

  <!-- Body -->
  <div class="playlistPopBody">
${playlistOptionsHtml}
  </div>

  <!-- Footer -->
  <div class="playlistPopFooter">
    <button id="cancelAddToPlaylist" class="button button-cancel">Cancel</button>
    <button id="confirmAddToPlaylist" class="button button-save">Save</button>
  </div>
</div>

  `);

  $("body").append($popover);

  // Position the popover relative to the button.
  function positionPopover() {
    var offset = $button.offset();
    var height = $button.outerHeight();
    $popover.css({
      position: "absolute",
      top: offset.top + height,
      left: offset.left
    });
  }
  positionPopover();
  $(window).on("resize.popover", positionPopover);

  // Allow the element to be positioned before toggling its visibility.
  setTimeout(function () {
    $popover.removeClass("hidden").addClass("visible");
  }, 10);

  // Prevent clicks inside the popover from propagating.
  $popover.on("click", function (e) {
    e.stopPropagation();
  });

  // Modified document click handler: ignore clicks on radio inputs or their labels.
  $(document).on("click.popover", function (e) {
    if (
      $(e.target).closest("input[type='radio']").length > 0 ||
      $(e.target).closest("label[for]").length > 0
    ) {
      return;
    }
    if (
      !$popover.is(e.target) &&
      $popover.has(e.target).length === 0 &&
      !$button.is(e.target)
    ) {
      removePopover();
    }
  });

  var $confirmButton = $popover.find("#confirmAddToPlaylist");
  var $cancelButton = $popover.find("#cancelAddToPlaylist");

  // If a radio is pre-selected, enable the confirm button immediately.
  if (selectedPlaylistId) {
    $confirmButton.prop("disabled", false);
  }

  // When a radio option changes...
  $popover.find("input[name='radio-group']").on("change", function (e) {
    var val = $(this).val();
    if (val === "new") {
      pendingPopoverData = { button: $button, song: song };
      // Toggle the modal overlay using its class (.createModal)
      $(".createModal")
        .removeClass("hidden")
        .addClass("visible");
      removePopover();
    } else {
      $confirmButton.prop("disabled", false);
    }
  });
  

  $confirmButton.on("click", function () {
    var selectedVal = $popover.find("input[name='radio-group']:checked").val();
    if (selectedVal && selectedVal !== "new") {
      addSongToPlaylist(selectedVal, song);
    }
    removePopover();
  });

  $cancelButton.on("click", function () {
    removePopover();
  });

  function removePopover() {
    // Toggle CSS classes for a fade-out effect.
    $popover.removeClass("visible").addClass("hidden");
    // After the transition duration (0.45s), remove the element.
    setTimeout(function () {
      $popover.remove();
    }, 450);
    $(document).off("click.popover");
    $(window).off("resize.popover");
  }
}


$(document).on("playlistCreated", function (e, newPlaylistId) {
  if (pendingPopoverData) {
    var $button = pendingPopoverData.button;
    var song = pendingPopoverData.song;
    pendingPopoverData = null;
    popOverPLAY($button, song, newPlaylistId);
  }
});
//----------------------------------------------------------------






////////////////////////////////////////////////////////
/////////  Similar Artists  ////////////////////////////
////////////////////////////////////////////////////////
function getSimilarArtists(artistName) {
  const artist = musicLibrary.find(a => a.artist === artistName);
  if (artist && artist.similar) {
    const similarArtists = artist.similar.slice();
    randomizeMe(similarArtists);
    return similarArtists;
  }
  return [];
}
function loadPlayingArtistSimilar(artistName) {
  const $playingSimilarArtistsArea = $("<div>", {
    id: "playingSimilarArtistsArea",
    class: "similarArtistsPlayingArea",
  });
  const $scrollAbleInside = $("<div>", { class: "scrollAble" });
  $playingSimilarArtistsArea.append($scrollAbleInside);

  // Create left and right arrow buttons for scrolling
  const $arrowLeft = $("<button>", {
    class: "arrow arrow-left",
    html: `<i class="ph-fill ph-arrow-circle-left"></i>`,
    prop: { disabled: true },
  });
  const $arrowRight = $("<button>", {
    class: "arrow arrow-right",
    html: `<i class="ph-fill ph-arrow-circle-right"></i>`,
  });
  $playingSimilarArtistsArea.append($arrowLeft, $arrowRight);

  // Create a "Load More" button with spinner
  const $loadMoreButton = $("<button>", {
    id: "loadMoreSimilarArtists",
    class: "load-more-btn",
    html: `
      <div role="status" class="spinner invisible"></div>
      Load More
    `,
    prop: { disabled: false },
  });

  const similarArtists = getSimilarArtists(artistName);
  let displayedCount = 0;

  const renderSimilarArtists = () => {
    const rowLimit = 4;
    const maxArtists = 20;
    const toDisplay = similarArtists.slice(displayedCount, displayedCount + rowLimit);
    toDisplay.forEach(similarArtist => {
      const $artistDiv = $("<div>", {
        class: "artistSimilar",
        html: `
          <div class="imgBx">
            <img src="https://mybeats.cloud/mediaFiles/artistPortraits/${similarArtist.toLowerCase().replace(/\s/g, "")}.png" alt="${similarArtist}">
          </div>
          <div class="content">
            <div class="contentBx">
              <h2>${similarArtist}</h2>
            </div>
            <ul class="sci">
              <li style="--i:1">
                <button type="button" data-popover-target="popover" data-popover-artist="${similarArtist}">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 64 64" preserveAspectRatio="xMidYMid meet">
                    <g transform="translate(0,64) scale(0.1,-0.1)" fill="#000000" stroke="none">
                      <path d="M131 572 c-71 -36 -76 -52 -76 -252 0 -200 5 -216 76 -252 50 -26 328 -26 378 0 71 36 76 52 76 252 0 200 -5 216 -76 252 -50 26 -328 26 -378 0z m213 -138 c3 -9 6 -40 6 -69 0 -47 2 -53 24 -59 35 -9 38 -29 10 -70 -42 -62 -97 -57 -137 12 -16 28 -16 32 -1 46 8 9 22 16 30 16 10 0 14 14 14 54 0 67 7 86 30 86 10 0 21 -7 24 -16z"/>
                    </g>
                  </svg>
                </button>
              </li>
              <li style="--i:2">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 256 256">
                  <path d="M128,24A104,104,0,1,0,232,128,104.13,104.13,0,0,0,128,24Zm40,112H136v32a8,8,0,0,1-16,0V136H88a8,8,0,0,1,0-16h32V88a8,8,0,0,1,16,0v32h32a8,8,0,0,1,0,16Z"/>
                </svg>
              </li>
              <li style="--i:3">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 256 256">
                  <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm40.55,110.58-52,36A8,8,0,0,1,104,164V92a8,8,0,0,1,12.55-6.58l52,36a8,8,0,0,1,0,13.16Z"/>
                </svg>
              </li>
            </ul>
          </div>
        `,
      });
      $scrollAbleInside.append($artistDiv);
    });
    displayedCount += toDisplay.length;
    if (displayedCount >= maxArtists || displayedCount >= similarArtists.length) {
      $loadMoreButton.prop("disabled", true);
    }
  };

  // Render an initial batch of similar artists
  renderSimilarArtists();
  renderSimilarArtists();

  $loadMoreButton.on("click", () => {
    const $spinner = $loadMoreButton.find("div[role='status']");
    $spinner.removeClass("invisible");
    setTimeout(() => {
      const previousScrollWidth = $scrollAbleInside[0].scrollWidth;
      renderSimilarArtists();
      setTimeout(() => {
        $scrollAbleInside.animate({ scrollLeft: $scrollAbleInside[0].scrollWidth - previousScrollWidth }, 300);
      }, 0);
      $spinner.addClass("invisible");
    }, 1000);
  });

  // Append the similar artists area and Load More button to your designated container (e.g. dynamicAreaBottom)
  $(dynamicAreaBottom).append($playingSimilarArtistsArea, $loadMoreButton);

  // Set up arrow navigation for horizontal scrolling
  $arrowLeft.on("click", () => {
    $scrollAbleInside.animate({ scrollLeft: "-=" + $scrollAbleInside.width() }, 300);
  });
  $arrowRight.on("click", () => {
    $scrollAbleInside.animate({ scrollLeft: "+=" + $scrollAbleInside.width() }, 300);
  });
  $scrollAbleInside.on("scroll", () => {
    $arrowLeft.prop("disabled", $scrollAbleInside.scrollLeft() === 0);
    $arrowRight.prop("disabled", $scrollAbleInside.scrollLeft() + $scrollAbleInside.width() >= $scrollAbleInside[0].scrollWidth);
  });

  // Initialize popovers for all buttons inside the similar artists area
  initializePopovers();
}

export function initializePopovers() {
  // Helper function: convert numbers to words (for numbers 0–20)
  function numberToWord(num) {
    const words = [
      "Zero", "One", "Two", "Three", "Four", "Five",
      "Six", "Seven", "Eight", "Nine", "Ten", "Eleven",
      "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
      "Seventeen", "Eighteen", "Nineteen", "Twenty"
    ];
    return words[num] || num.toString();
  }

  const popoverTriggers = document.querySelectorAll('[data-popover-target]');

  popoverTriggers.forEach(trigger => {
    trigger.addEventListener('click', (event) => {
      event.stopPropagation();

      // Remove existing popover if any
      const existingPopover = document.getElementById('popover');
      if (existingPopover) {
        existingPopover.remove();
      }

      // Retrieve the artist's name from a data attribute.
      // Use data-popover-artist first, then fallback to data-artist.
      const artistName = trigger.getAttribute('data-popover-artist') ||
                         trigger.getAttribute('data-artist') ||
                         "Unknown Artist";

      // Calculate the album text dynamically based on the number of albums.
      let albumText = "Albums";
      if (typeof musicLibrary !== 'undefined' && Array.isArray(musicLibrary)) {
        const artistData = musicLibrary.find(item => item.artist === artistName);
        if (artistData && Array.isArray(artistData.albums)) {
          const count = artistData.albums.length;
          albumText = numberToWord(count) + " Albums";
        }
      }

      // Create a new popover element
      const popover = document.createElement('div');
      popover.id = 'popover';
      popover.className =
        "popOverGlobal absolute z-10 inline-block w-64 text-sm text-gray-500 transition-opacity duration-300 bg-white border border-gray-200 rounded-lg shadow-sm dark:text-gray-400 dark:bg-gray-800 dark:border-gray-600";
      popover.style.opacity = '1';
      popover.style.visibility = 'visible';

      // Set popover content with dynamic album text and artist name.
      popover.innerHTML = `
        <div class="p-3">
          <div class="flex items-center justify-between mb-2">
            <a href="#">
              <img class="w-10 h-10 rounded-full" src="https://mybeats.cloud/mediaFiles/artistPortraits/${artistName.toLowerCase().replace(/\s/g, "")}.png" alt="${artistName}">
            </a>
            <div>
              <button class="goToButton">
                <span>Artist</span>
                <svg width="20" height="20" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" stroke-linejoin="round" stroke-linecap="round"></path>
                </svg>
              </button>
            </div>
          </div>
          <p class="text-gray-900 dark:text-white popOverTitle">
            <a href="#">${artistName}</a>
          </p>
          <p class="mb-3 text-sm font-normal popOverSubTitle">
            <a href="#" class="hover:underline">${albumText}</a>
          </p>
          <p class="mb-4 text-sm">Open-source contributor. Building <a href="#" class="text-blue-600 dark:text-blue-500 hover:underline">flowbite.com</a>.</p>
          <ul class="flex text-sm">
            <li class="me-2">
              <a href="#" class="hover:underline">
                <span class="font-semibold text-gray-900 dark:text-white">799</span>
                <span>Following</span>
              </a>
            </li>
            <li>
              <a href="#" class="hover:underline">
                <span class="font-semibold text-gray-900 dark:text-white">3,758</span>
                <span>Followers</span>
              </a>
            </li>
          </ul>
        </div>
        <div data-popper-arrow class="popOverArrow" style="position: absolute; width: 8px; height: 8px; background: inherit; transform: rotate(45deg);"></div>
      `;

      document.body.appendChild(popover);

      // Get the arrow element from the popover
      const arrowElement = popover.querySelector('[data-popper-arrow]');

      // Use Floating UI's autoUpdate with arrow middleware to tether the popover to the trigger
      const cleanup = FloatingUIDOM.autoUpdate(trigger, popover, () => {
        FloatingUIDOM.computePosition(trigger, popover, {
          placement: "bottom",
          middleware: [
            FloatingUIDOM.arrow({ element: arrowElement })
          ]
        }).then(({ x, y, placement, middlewareData }) => {
          popover.style.left = `${x}px`;
          popover.style.top = `${y}px`;

          // Position the arrow element based on middleware data
          const staticSide = {
            top: 'bottom',
            right: 'left',
            bottom: 'top',
            left: 'right'
          }[placement.split('-')[0]];

          const arrowData = middlewareData.arrow;
          if (arrowData) {
            Object.assign(arrowElement.style, {
              left: arrowData.x != null ? `${arrowData.x}px` : '',
              top: arrowData.y != null ? `${arrowData.y}px` : '',
              [staticSide]: '-4px'
            });
          }
        });
      });

      // Attach the cleanup function to the popover for later disposal when it is closed
      popover.cleanupAutoUpdate = cleanup;

      // When the "Artist" button is clicked, go to the artist's page using loadArtistInfo
      const goToButton = popover.querySelector('.goToButton');
      goToButton.addEventListener('click', function(event) {
        event.stopPropagation();
        if (typeof loadArtistInfo === 'function') {
          loadArtistInfo(artistName);
        }
        popover.remove();
        if (typeof popover.cleanupAutoUpdate === 'function') {
          popover.cleanupAutoUpdate();
        }
      });

      // Close popover when clicking outside
      document.addEventListener('click', function handleOutsideClick(event) {
        if (!popover.contains(event.target) && !event.target.closest('[data-popover-target]')) {
          popover.classList.add('invisible', 'opacity-0');
          popover.style.opacity = '0';
          popover.style.visibility = 'hidden';

          // Wait for the CSS transition to finish before removing and cleaning up
          setTimeout(() => {
            popover.remove();
            if (typeof popover.cleanupAutoUpdate === 'function') {
              popover.cleanupAutoUpdate();
            }
          }, 300);

          document.removeEventListener('click', handleOutsideClick);
        }
      });
    });
  });
}




//----------------------------------------------------------------






/////////////////////////////////////////////////////////
////////  F A V O R I T E S   ///////////////////////////
/////////////////////////////////////////////////////////
//let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
function isRendering(songData, type) {
  ///////////  If Lists are empty  /////////////////////////
  if (songData.length === 0) {
    const message = type === "favorites" ? "No favorites added." : "No songs in queue.";
    myMusic.innerHTML = `<p>${message}</p>`;
    return;
  }

  ///////////  Favorites and Up Next Queue  ////////////////
  songData.forEach((songOrId) => {
    const song = type === "favorites" ? getSongById(songOrId) : songOrId;
    if (song) {
      const songDiv = document.createElement("div");
      songDiv.classList.add("song", type === "favorites" ? "favoriteSong" : "up-next-song");
      songDiv.setAttribute("data-id", song.id);
      songDiv.innerHTML = `
<span class="title">${song.title}</span>
<span class="artist">${song.artist}</span>
<span class="duration">${song.duration}</span>
`;
      // ... add remove button if needed ...
      myMusic.appendChild(songDiv);
    }
  });
}
function getSongById(songId) {
  for (const artist of musicLibrary) {
    for (const album of artist.albums) {
      const song = album.songs.find((song) => song.id === songId);
      if (song) {
        return {
          ...song,
          artist: artist.artist,
          album: album.album,
        }; // Add artist information
      }
    }
  }
  return null;
}

function removeFromFavorites(songId) {
  const favorites = getFavorites();
  const updatedFavorites = favorites.filter((id) => id !== songId);
  saveFavorites(updatedFavorites);
  displayFavorites();
}
function getFavorites() {
  const favorites = localStorage.getItem("favorites");
  return favorites ? JSON.parse(favorites) : [];
}
function saveFavorites(favorites) {
  localStorage.setItem("favorites", JSON.stringify(favorites));
}
function addSongToFavorites(songId) {
  if (!songId) return;
  
  const favorites = getFavorites();
  if (!favorites.includes(songId)) {
    favorites.push(songId);
    saveFavorites(favorites);
    updateHeartIcon(songId, true);
    displayFavorites();
  }
}
function removeSongFromFavorites(songId) {
  let favorites = getFavorites();
  favorites = favorites.filter((id) => id !== songId);
  saveFavorites(favorites);
  updateHeartIcon(songId, false);
  displayFavorites();
}
function updateHeartIcon(songId, isFavorited) {
  const songElement = document.querySelector(`.song[data-id="${songId}"]`);
  if (songElement) {
    const heart = songElement.querySelector(".heart");
    if (heart) {
      if (isFavorited) {
        heart.classList.add("hearted");
      } else {
        heart.classList.remove("hearted");
      }
    }
  }
}
function handleHeartClick(event) {
  const heartIcon = event.target;
  const songElement = heartIcon.closest(".song");
  if (!songElement) return;
  
  const songId = songElement.getAttribute("data-id");
  if (!songId) return;
  
  if (heartIcon.classList.contains("heart") && !heartIcon.classList.contains("hearted")) {
    addSongToFavorites(songId);
  } else if (heartIcon.classList.contains("hearted")) {
    removeSongFromFavorites(songId);
  }
}
function displayFavorites() {
  const favoritesContainer = document.getElementById("myFavorites");
  if (!favoritesContainer) return;
  
  favoritesContainer.innerHTML = ""; // Clear existing favorites

  const favorites = getFavorites();
  if (favorites.length === 0) {
    favoritesContainer.innerHTML = "<p>No favorites added yet.</p>";
    return;
  }

  // Create a container for the favorite songs
  const favoritesList = document.createElement("div");
  favoritesList.id = "favoritesList";
  favoritesList.className = "space-y-2"; // Match the Up Next Queue styling

  favorites.forEach((songId) => {
    const song = getSongById(songId);
    if (song) {
      const songElement = document.createElement("div");
      songElement.className = "flex items-center justify-between p-2 bg-gray-50 rounded"; // Match the Up Next Queue styling
      songElement.setAttribute("data-song-id", song.id); // Add song ID for double-click event
      songElement.innerHTML = `
<span>${song.title}</span>
<span class="text-gray-500">${song.duration}</span>
`;
      favoritesList.appendChild(songElement);
    }
  });

  favoritesContainer.appendChild(favoritesList);

  // Add double-click event listeners to favorite songs
  const favoriteSongs = document.querySelectorAll("#favoritesList > div");
  favoriteSongs.forEach((songElement) => {
    songElement.addEventListener("dblclick", () => {
      const songId = songElement.getAttribute("data-song-id");
      const song = getSongById(songId); // Find the song by its ID
      if (song) {
        playSong(song); // Play the song
      }
    });
  });
}
function initializeFavorites() {
  // Attach click event listeners to all heart icons
  const heartIcons = document.querySelectorAll(".heart, .hearted");
  heartIcons.forEach((heart) => {
    heart.addEventListener("click", handleHeartClick);
  });

  // Display favorites on page load
  displayFavorites();

  // Update heart icons based on favorites in localStorage
  const favorites = getFavorites();
  favorites.forEach((songId) => {
    updateHeartIcon(songId, true);
  });
}
function toggleFavorite(event) {
  event.stopPropagation();

  const heart = event.currentTarget;
  const songElement = heart.closest(".song");
  if (!songElement) {
    console.error("Song element not found for the clicked heart.");
    return;
  }

  const songId = songElement.getAttribute("data-id");
  const songNameElement = songElement.querySelector(".title");
  const songName = songNameElement ? songNameElement.textContent : "Unknown Song";

  // Safely retrieve favorites
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  if (!Array.isArray(favorites)) {
    favorites = [];
  }

  if (favorites.includes(songId)) {
    // Remove from favorites
    favorites = favorites.filter((id) => id !== songId);
    heart.classList.remove("hearted");
    show.notifyMe("favorites", "removed", {
      song: { title: songName },
      undoCallback: () => {
        console.log(`Undo: adding ${songName} back to favorites`);
        addSongToFavorites(songId);
      },
    });
  } else {
    // Add to favorites
    favorites.push(songId);
    heart.classList.add("hearted");
    show.notifyMe("favorites", "added", {
      song: { title: songName },
      undoCallback: () => {
        console.log(`Undo: removing ${songName} from favorites`);
        removeSongFromFavorites(songId);
      },
    });
  }

  // Update localStorage
  localStorage.setItem("favorites", JSON.stringify(favorites));
  displayFavorites();
}
function loadFavorites() {
  // Safely initialize favorites
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  if (!Array.isArray(favorites)) {
    favorites = [];
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }

  // Iterate over each .song element
  document.querySelectorAll(".song").forEach((song) => {
    const songId = song.getAttribute("data-id");
    const heart = song.querySelector(".heart");

    if (songId && heart) {
      // Update heart state based on favorites
      if (favorites.includes(songId)) {
        heart.classList.add("hearted");
      }

      // Attach the click event listener
      heart.removeEventListener("click", toggleFavorite); // Ensure no duplicate event listeners
      heart.addEventListener("click", toggleFavorite);
    } else {
      console.warn("Missing data-id or .heart element in song:", song);
    }
  });
}
//----------------------------------------------------------------





////////////////////////////////////////////////////////
////////  U P  N E X T  Q U E U E  /////////////////////
////////////////////////////////////////////////////////
let queue = [];

function addToQueue(song) {
  const queueList = document.getElementById("queue");
  const newItem = createQueueItemElement(song);
  queueList.appendChild(newItem);
  saveQueue(queueList);
  updateQueueCount(queueList);
}
function playNextSong() {
  const queueList = document.getElementById("queue");
  if (queueList.children.length > 0) {
    const nextSongElement = queueList.children[0];
    const nextSong = {
      id: nextSongElement.dataset.songId,
      title: nextSongElement.querySelector(".song-title").textContent,
      artist: nextSongElement.querySelector(".song-artist").textContent,
      album: nextSongElement.dataset.album,
      duration: nextSongElement.querySelector(".song-duration").textContent,
      downloadPath: nextSongElement.dataset.downloadPath,
    };
    nextSongElement.remove();
    saveQueue(queueList);
    updateQueueCount(queueList);
    playSong(nextSong);
  } else {
    currentSongIndex = (currentSongIndex + 1) % currentAlbumSongs.length;
    if (currentSongIndex === 0 && repeatMode !== "all") {
      audioElement.pause();
      audioElement.currentTime = 0;
    } else {
      playSong(currentAlbumSongs[currentSongIndex]);
    }
  }
}
function addQueueSongEventListeners() {
  const queueList = document.getElementById("queue");
  queueList.addEventListener("dblclick", (event) => {
    const songElement = event.target.closest(".queue-item");
    if (songElement) {
      const song = {
        id: songElement.dataset.songId,
        title: songElement.querySelector(".song-title").textContent,
        artist: songElement.querySelector(".song-artist").textContent,
        album: songElement.dataset.album,
        duration: songElement.querySelector(".song-duration").textContent,
        downloadPath: songElement.dataset.downloadPath,
      };
      playSong(song);
    }
  });
}
function initQueueManager() {
  const queueList = document.getElementById("queue");
  const clearQueueBtn = document.querySelector(".clear-queue-btn");
  initQueueEventListeners(queueList, clearQueueBtn);
  loadQueue(queueList);
  addQueueSongEventListeners();
}
function initQueueEventListeners(queueList, clearQueueBtn) {
  queueList.addEventListener("dragstart", handleDragStart);
  queueList.addEventListener("dragover", handleDragOver);
  queueList.addEventListener("drop", handleDrop);
  queueList.addEventListener("dragend", handleDragEnd);
  queueList.addEventListener("click", handleRemoveSong);
  clearQueueBtn.addEventListener("click", () => clearQueue(queueList));
}
function handleRemoveSong(e) {
  if (e.target.classList.contains("icon-remove")) {
    const songItem = e.target.closest(".queue-item");
    songItem.remove();
    saveQueue(queueList);
    updateQueueCount(queueList);
  }
}
function clearQueue(queueList) {
  queueList.innerHTML = "";
  saveQueue(queueList);
  updateQueueCount(queueList);
}
function saveQueue(queueList) {
  const queueItems = Array.from(queueList.children).map((item) => ({
    id: item.dataset.songId,
    title: item.querySelector(".song-title").textContent,
    artist: item.querySelector(".song-artist").textContent,
    album: item.dataset.album,
    duration: item.querySelector(".song-duration").textContent,
    downloadPath: item.dataset.downloadPath,
  }));
  localStorage.setItem("musicQueue", JSON.stringify(queueItems));
}
function loadQueue(queueList) {
  const savedQueue = JSON.parse(localStorage.getItem("musicQueue") || "[]");
  savedQueue.forEach((song) => {
    const newItem = createQueueItemElement(song);
    queueList.appendChild(newItem);
  });
  updateQueueCount(queueList);
}
function createQueueItemElement(song) {
  const li = document.createElement("li");
  li.classList.add("queue-item");
  li.setAttribute("draggable", "true");
  li.dataset.songId = song.id;
  li.dataset.album = song.album;
  li.dataset.downloadPath = song.downloadPath;

  li.innerHTML = `
<div class="drag-handle">⋮</div>
<div class="song-thumbnail">
<img src="https://mybeats.cloud/mediaFiles/artistPortraits/${song.artist.toLowerCase().replace(/\s/g, "")}.png" alt="${song.title} Thumbnail">
<div class="hover-overlay">
<i class="icon-remove">✖</i>
</div>
</div>
<div class="song-details">
<h3 class="song-title">${song.title}</h3>
<p class="song-artist">${song.artist}</p>
</div>
<div class="song-duration">${song.duration}</div>
`;

  return li;
}
function updateQueueCount(queueList) {
  const queueCountElement = document.querySelector(".queue-count");
  const currentCount = queueList.children.length;
  queueCountElement.textContent = `(${currentCount} songs)`;
}
function handleDragStart(e) {
  if (!e.target.classList.contains("queue-item")) return;
  e.target.classList.add("dragging");
  e.dataTransfer.setData("text/plain", e.target.dataset.songId);
  e.dataTransfer.effectAllowed = "move";
}
function handleDragOver(e) {
  e.preventDefault();
  const draggedItem = document.querySelector(".dragging");
  const afterElement = getDragAfterElement(queueList, e.clientY);
  if (afterElement) {
    queueList.insertBefore(draggedItem, afterElement);
  } else {
    queueList.appendChild(draggedItem);
  }
}
function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll(".queue-item:not(.dragging)")];
  return draggableElements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    },
    { offset: Number.NEGATIVE_INFINITY }
  ).element;
}
function handleDrop(e) {
  e.preventDefault();
  saveQueue(queueList);
}
function handleDragEnd(e) {
  e.target.classList.remove("dragging");
  updateQueueCount(queueList);
}
//----------------------------------------------------------------






////////////////////////////////////////////////////////
////////  P L A Y L I S T S  ///////////////////////////
////////////////////////////////////////////////////////
function renderPlaylistGallery() {
    var $gallery = $("#playlistGallery").empty();
    $.each(playlists, function (index, playlist) {
        var $card = $(`
            <div class="playlist-thumbnail bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer">
                <img src="${playlist.coverImage}" alt="${playlist.title}" class="w-full h-48 object-cover">
                <div class="p-4">
                    <h3 class="font-bold text-lg mb-2">${playlist.title}</h3>
                    <p class="text-gray-600 text-sm mb-2">${playlist.description}</p>
                    <div class="flex flex-wrap gap-2">
                        ${playlist.tags.map(tag => `<span class="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">${tag}</span>`).join("")}
                    </div>
                </div>
            </div>
        `).on("click", function () {
            loadPlaylist(playlist.id);
        });
        $gallery.append($card);
    });
}
function toggleDrawer(show) {
    const $drawer = $("#playlistDrawer");
    const $overlay = $("#drawerOverlay");

    if (show) {
        $overlay.removeClass("hidden");
        setTimeout(() => $overlay.addClass("opacity-100 backdrop-blur-sm"), 10);
        $drawer.removeClass("translate-x-full");
    } else {
        $overlay.removeClass("opacity-100 backdrop-blur-sm");
        setTimeout(() => $overlay.addClass("hidden"), 200);
        $drawer.addClass("translate-x-full");
    }
}
function loadPlaylist(playlistId) {
    toggleDrawer(true);

    $("#drawerContent").html(`
    
<div role="status" id="loadingAnimation" class="max-w-sm p-4 border border-gray-200 rounded-sm shadow-sm animate-pulse md:p-6 dark:border-gray-700">
    <div class="flex items-center justify-center h-48 mb-4 bg-gray-300 rounded-sm dark:bg-gray-700">
        <svg class="w-10 h-10 text-gray-200 dark:text-gray-600" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 20">
            <path d="M14.066 0H7v5a2 2 0 0 1-2 2H0v11a1.97 1.97 0 0 0 1.934 2h12.132A1.97 1.97 0 0 0 16 18V2a1.97 1.97 0 0 0-1.934-2ZM10.5 6a1.5 1.5 0 1 1 0 2.999A1.5 1.5 0 0 1 10.5 6Zm2.221 10.515a1 1 0 0 1-.858.485h-8a1 1 0 0 1-.9-1.43L5.6 10.039a.978.978 0 0 1 .936-.57 1 1 0 0 1 .9.632l1.181 2.981.541-1a.945.945 0 0 1 .883-.522 1 1 0 0 1 .879.529l1.832 3.438a1 1 0 0 1-.031.988Z"/>
            <path d="M5 5V.13a2.96 2.96 0 0 0-1.293.749L.879 3.707A2.98 2.98 0 0 0 .13 5H5Z"/>
        </svg>
    </div>
    <div class="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-48 mb-4"></div>
    <div class="h-2 bg-gray-200 rounded-full dark:bg-gray-700 mb-2.5"></div>
    <div class="h-2 bg-gray-200 rounded-full dark:bg-gray-700 mb-2.5"></div>
    <div class="h-2 bg-gray-200 rounded-full dark:bg-gray-700"></div>
    <div class="flex items-center mt-4">
       <svg class="w-10 h-10 me-3 text-gray-200 dark:text-gray-700" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 0a10 10 0 1 0 10 10A10.011 10.011 0 0 0 10 0Zm0 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 13a8.949 8.949 0 0 1-4.951-1.488A3.987 3.987 0 0 1 9 13h2a3.987 3.987 0 0 1 3.951 3.512A8.949 8.949 0 0 1 10 18Z"/>
        </svg>
        <div>
            <div class="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-32 mb-2"></div>
            <div class="w-48 h-2 bg-gray-200 rounded-full dark:bg-gray-700"></div>
        </div>
    </div>
    <span class="sr-only">Loading...</span>
</div>

    `);

    setTimeout(function () {
        var playlist = playlists.find(p => p.id === playlistId);
        if (playlist) {
            $("#loadingAnimation").fadeOut(300, function () {
                $(this).remove();
                $("#drawerContent").html(renderPlaylistView(playlist));
            });
        } else {
            $("#drawerContent").html(`<p class="text-gray-500 p-6">Playlist not found.</p>`);
        }
    }, 1000);
}
function renderPlaylistView(playlist) {
    return `
<div class="playlist-header">
    <button onclick="toggleDrawer(false)" class="close-button">
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
        </svg>
    </button>

</div>

<div class="songsContainer">
    <div class="playlist-info">
        <img src="${playlist.coverImage}" alt="${playlist.title}" class="coverArt">
        <div class="details">
            <h3 contenteditable="true" data-field="title">${playlist.title}</h3>

            <p class="genre">Genre: <span contenteditable="true" data-field="genre">${playlist.genre}</span></p>
            <div class="tags">
                ${playlist.tags.map(tag => `<span class="tag">${tag}</span>`).join("")}
            </div>
        </div>
    </div>

    <button id="editPlaylistBtn">Edit</button>
    <button id="savePlaylistBtn" class="hidden">Save</button>

    
    
    
    
    


        <!-- Description Section -->
        <div class="desc-sec">
            <h3 class="sec-title">Description</h3>
            <p class="desc-text" contenteditable="true" data-field="description">
            ${playlist.description}
            </p>
        </div>

    <div class="songs-section">
        <h4>Songs</h4>
        <div class="songs-list">
            ${
                playlist.songs.length
                    ? playlist.songs.map((song, i) => `
                        <div class="song-item">
                            <div class="drag-handle">⋮</div>
                            <div class="song-thumbnail">
                                <img src="https://mybeats.cloud/mediaFiles/artistPortraits/${song.artist.toLowerCase().replace(/\s/g, "")}.png" alt="${song.title} Thumbnail">
                                <div class="hover-overlay">
                                    <i class="icon-remove">✖</i>
                                </div>
                            </div>
                            <div class="song-details">
                                <h3 class="song-title">${song.title}</h3>
                                <p class="song-artist">${song.artist}</p>
                            </div>
                            <div class="song-duration">${song.duration}</div>
                        </div>
                    `).join("")
                    : '<p class="no-songs">No songs added yet</p>'
            }
        </div>
    </div>




        <!-- Action Buttons -->
        <div class="btn-sec">
            <button class="btn btn-primary">Shuffle</button>
            <button class="btn btn-secondary">Delete</button>
        </div>
    </div>

    
    
    
    
    
    
    
    
    
</div>
    `;
}

function createPlaylist(title, description, genre, tags, coverImage) {
    var newPlaylist = {
        id: Date.now(),
        title: title,
        description: description,
        genre: genre,
        tags: tags,
        coverImage: coverImage || "/api/placeholder/300/300",
        songs: [],
    };
    playlists.push(newPlaylist);
    localStorage.setItem("playlists", JSON.stringify(playlists));
    $("#createPlaylistModal").addClass("hidden");
    resetCreateForm();
    renderPlaylistGallery();
    return newPlaylist;
}
function addSongToPlaylist(playlistId, song) {
  var playlist = playlists.find(function (p) {
    return p.id === parseInt(playlistId);
  });
  if (playlist) {
    playlist.songs.push({
      id: song.id,
      title: song.title,
      artist: song.artist,
      album: song.album,
      duration: song.duration || "3:35",
      downloadPath: song.downloadPath,
    });
    localStorage.setItem("playlists", JSON.stringify(playlists));
    renderPlaylistGallery();
    show.notifyMe("playlist", "added", {
      song: song,
      playlistID: playlistId,
      undoCallback: function () {
        console.log("Undo: removing " + song.title + " from playlist " + playlistID);
      },
    });
  } else {
    console.error("Playlist not found");
  }
}

function enableInlineEditing() {
    var playlistId = parseInt($("#playlistView").attr("data-playlist-id"));
    var $title = $('[data-field="title"]').attr("contenteditable", true)
        .addClass("border border-blue-300 rounded px-2 focus:outline-none focus:border-blue-500");
    var $description = $('[data-field="description"]').attr("contenteditable", true)
        .addClass("border border-blue-300 rounded px-2 focus:outline-none focus:border-blue-500");
    var currentGenre = $('[data-field="genre"]').text();
    var $genreSelect = $(`
        <select class="border border-gray-300 rounded px-2 py-1">
            <option value="pop" ${currentGenre === "pop" ? "selected" : ""}>Pop</option>
            <option value="rock" ${currentGenre === "rock" ? "selected" : ""}>Rock</option>
            <option value="jazz" ${currentGenre === "jazz" ? "selected" : ""}>Jazz</option>
            <option value="classical" ${currentGenre === "classical" ? "selected" : ""}>Classical</option>
            <option value="electronic" ${currentGenre === "electronic" ? "selected" : ""}>Electronic</option>
            <option value="hip-hop" ${currentGenre === "hip-hop" ? "selected" : ""}>Hip Hop</option>
        </select>
    `);
    $('[data-field="genre"]').replaceWith($genreSelect);
}
function savePlaylistChanges() {
    var playlistId = parseInt($("#playlistView").attr("data-playlist-id"));
    var playlist = playlists.find(function (p) {
        return p.id === playlistId;
    });
    if (playlist) {
        playlist.title = $('[data-field="title"]').text().trim();
        playlist.description = $('[data-field="description"]').text().trim();
        playlist.genre = $("select").val();
        localStorage.setItem("playlists", JSON.stringify(playlists));
        $("[contenteditable]").removeAttr("contenteditable").removeClass("border border-blue-300 rounded px-2 focus:outline-none focus:border-blue-500");
        var $genreText = $('<span data-field="genre">' + $("select").val() + "</span>");
        $("select").replaceWith($genreText);
        $("#playlistTitle").text(playlist.title);
        renderPlaylistGallery();
    }
}
function resetCreateForm() {
    $("#playlistTitleInput").val("");
    $("#playlistDescriptionInput").val("");
    $("#genreSelect").val("");
    $("#tagContainer").empty();
    $("#tagInput").val("");
    $("#coverUpload").val("");
}


$("#myCollections").on("click", function () {
    $("#playlistGallery").removeClass("hidden");
    renderPlaylistGallery();
});
$("#createPlaylistBtn").on("click", function () {
    $("#createPlaylistModal").removeClass("hidden");
});
$("#addTagBtn").on("click", function () {
    var tagText = $("#tagInput").val().trim();
    if (tagText) {
        var $tagElement = $(`
            <span class="tag inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                ${tagText}
                <button class="ml-2 text-blue-600 hover:text-blue-800">×</button>
            </span>
        `);
        $tagElement.find("button").on("click", function () {
            $tagElement.remove();
        });
        $("#tagContainer").append($tagElement);
        $("#tagInput").val("");
    }
});
$("#tagInput").on("keypress", function (e) {
    if (e.which === 13) {
        e.preventDefault();
        $("#addTagBtn").trigger("click");
    }
});
$("#confirmCreateBtn").on("click", function () {
    var title = $("#playlistTitleInput").val().trim();
    if (!title) {
        alert("Playlist title is required!");
        return;
    }
    var description = $("#playlistDescriptionInput").val().trim();
    var genre = $("#genreSelect").val();
    var tags = [];
    $("#tagContainer .tag").each(function () {
        tags.push($(this).contents().first().text().trim());
    });
    var $fileInput = $("#coverUpload");
    var file = $fileInput[0].files[0];
    if (file) {
        var reader = new FileReader();
        reader.onload = function (e) {
            createPlaylist(title, description, genre, tags, e.target.result);
        };
        reader.onerror = function () {
            alert("Failed to load cover image!");
        };
        reader.readAsDataURL(file);
    } else {
        createPlaylist(title, description, genre, tags);
    }
});
$("#cancelCreateBtn").on("click", function () {
    $("#createPlaylistModal").addClass("hidden");
    resetCreateForm();
});

$("#drawerContent").on("click", "#backToGallery", function () {
    $("#playlistView").addClass("hidden");
    $("#playlistGallery").removeClass("hidden");
});
$("#drawerContent").on("click", "#editPlaylistBtn", function () {
    $(this).addClass("hidden");
    $("#savePlaylistBtn").removeClass("hidden");
    enableInlineEditing();
});
$("#drawerContent").on("click", "#savePlaylistBtn", function () {
    $(this).addClass("hidden");
    $("#editPlaylistBtn").removeClass("hidden");
    savePlaylistChanges();
});
$("#drawerContent").on("click", "#addSongBtn", function () {
    var songTitle = prompt("Enter song title:");
    var songArtist = prompt("Enter song artist:");
    if (songTitle && songArtist) {
        var playlistId = parseInt($("#playlistView").attr("data-playlist-id"));
        var playlist = playlists.find(function (p) {
            return p.id === playlistId;
        });
        if (playlist) {
            playlist.songs.push({
                id: Date.now(),
                title: songTitle,
                artist: songArtist,
                duration: "3:00",
            });
            localStorage.setItem("playlists", JSON.stringify(playlists));
            renderPlaylistView(playlist);
        }
    }
});

$("body").append(`
    <div id="drawerOverlay" class="fixed inset-0 bg-black bg-opacity-50 hidden transition-opacity z-40"></div>
    <div id="playlistDrawer" class="fixed inset-y-0 right-0 w-96 bg-white shadow-lg transform translate-x-full transition-transform z-50">
        <div class="relative h-full flex flex-col p-6">
            <button onclick="toggleDrawer(false)" class="absolute top-4 left-4 text-gray-500 hover:text-gray-700">
                <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
            <div id="drawerContent" class="flex-grow p-6"></div>
        </div>
    </div>
`);
$("#playlistGallery").addClass("hidden");
$(document).on("click", function (e) {
    if (!$(e.target).closest("#playlistDrawer, .playlist-thumbnail").length) {
        toggleDrawer(false);
    }
});
$(document).on("keydown", function (e) {
    if (e.key === "Escape") {
        $("#createPlaylistModal").addClass("hidden");
        resetCreateForm();
    }
});
var playlists = JSON.parse(localStorage.getItem("playlists") || "[]");
var $dropZone = $("#coverUpload").parent();
$dropZone.on("dragover", function (e) {
    e.preventDefault();
    $dropZone.addClass("bg-blue-50");
}).on("dragleave", function (e) {
    e.preventDefault();
    $dropZone.removeClass("bg-blue-50");
}).on("drop", function (e) {
    e.preventDefault();
    $dropZone.removeClass("bg-blue-50");
    var files = e.originalEvent.dataTransfer.files;
    if (files.length && files[0].type.startsWith("image/")) {
        $("#coverUpload")[0].files = files;
    } else {
        alert("Please drop an image file!");
    }
});
//----------------------------------------------------------------






/**
 * 
 * 
 * 
 * 
 *
 *  IGNORE LOGIC BELOW THIS LINE PLEASE 
**/
///////////////////////////////////////////////////
/////////  W O R K I N G   O N   //////////////////
///////////////////////////////////////////////////
