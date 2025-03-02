import { musicLibrary } from "./mediaFiles/songs/musicData.js";

import $ from "https://esm.sh/jquery";
import "https://esm.sh/jquery-ui"; // This includes Sortable

let currentSongIndex = 0;
let currentAlbumSongs = [];
let shuffleMode = false;
let repeatMode = "off";
let activeButton = null;
let isPlaying = false;
let isDragging = false;
const fastForwardInterval = 10;
const rewindInterval = 10;

// Music Player Controls, Seek Slider, Song Times, ETC.
const audioElement = document.querySelector("#audio");
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

document.addEventListener("DOMContentLoaded", () => {
 document.body.appendChild(progressBar);
  progressBar.id = "loadingBar";
  
  randomizeMe(musicLibrary);
  siteRouter();
  initQueueManager();
  initializeFavorites();
  initializePopovers();
  loadPlaylist();
});
//----------------------------------------------------------------


/////////  H E L P E R  Functions  ////////////////
/////////////////////////////////////////////////////////////////
function clearDynamicArea() {
  dynamicArea.innerHTML = "";
  dynamicAreaBottom.innerHTML = "";
}
function activeAlbum(button) {
  if (activeButton) {
    activeButton.classList.remove("active");
  }
  if (button) {
    button.classList.add("active");
    activeButton = button;
  }
}
function randomizeMe(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
function similarArtistsLarge(artistId) {
  const artist = musicLibrary.find((artist) => artist.id === artistId);

  if (artist) {
    const similarArtistIds = artist.similar.map((similarArtistObj) => similarArtistObj.id); // assuming artist.similar stores artist objects with ids
    randomizeMe(similarArtistIds); // Shuffle or randomize the list of IDs
    return similarArtistIds;
  }
  return [];
}
function setActiveLink(linkId) {
  navItems.forEach((item) => item.classList.remove("active"));

  const activeItem = document.getElementById(linkId)?.parentElement;
  if (activeItem) {
    activeItem.classList.add("active");
  }
}
function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}
function triggerRepaint(element) {
  element.offsetHeight;
}
function hideContainersSmoothly() {
  const containers = ["all-artists-container", "similar-artists-container", "artist-info-container"];

  containers.forEach((containerId) => {
    const container = document.getElementById(containerId);
    if (container && container.classList.contains("visible")) {
      container.classList.remove("visible");
      container.classList.add("hidden");
      container.style.transition = "opacity 0.75s";
      container.style.opacity = "0";
      setTimeout(() => {
        container.style.display = "none";
      }, 950);
    }
  });
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
//----------------------------------------------------------------


/////////////////////////////////////////////////////////////////
/////////  M U S I C  P L A Y E R  //////////////////////////////
//////// Android Media Session API //////////////////////////////
let songPlaying = null;
let artistPlaying = null;
let albumPlaying = null;

/////// Actions / Events ///////
///////////////////////////////////////
function playSong(song) {
  if (!song) {
    console.error("No song provided to play.");
    return;
  }

  let songPlaying = song.title;
  let artistPlaying = song.artist;
  let albumPlaying = song.album;

  loadPlayingArtistSimilar();

  $(".song").removeClass("active");
  let $currentSongElement = $(`#song${song.id}`);
  if ($currentSongElement.length) {
    $currentSongElement.addClass("active");
  }

  audioElement.src = song.downloadPath;
  audioElement.play();

  $(".updateSongTitle").text(songPlaying);
  $(".updateArtistName").text(artistPlaying);
  $(".updateAlbumName").text(albumPlaying);

  let albumArtPhoto = $("#nowPlayingArt");
  let albumArtPhotoNAV = $("#smallAlbumCover");
  let albumNowPlaying = albumPlaying.toLowerCase().replace(/\s/g, "");
  let newAlbumCoverUrl = `https://mybeats.cloud/mediaFiles/albumCovers/${albumNowPlaying}.png`;

  if (albumArtPhoto.length) {
    albumArtPhoto.attr("src", newAlbumCoverUrl);
    albumArtPhoto.attr("alt", albumPlaying);
  }
  if (albumArtPhotoNAV.length) {
    albumArtPhotoNAV.attr("src", newAlbumCoverUrl);
    albumArtPhotoNAV.attr("alt", albumPlaying);
  }

  let artistName = artistPlaying.replace(/\s/g, "").toLowerCase();
  let artworkUrl = `https://mybeats.cloud/mediaFiles/artistPortraits/${artistName}.png`;
  updateMediaSession(song, artworkUrl);

  let $downloadIcon = $("#download-icon");
  $downloadIcon.attr("href", song.downloadPath);
  $downloadIcon.attr("download", song.title);

  audioElement.addEventListener("ended", handleSongEnd);
  audioElement.addEventListener("play", () => {
    isPlaying = true;
    songCardUpdate();
  });
}
function handleSongEnd() {
  isPlaying = false;
  $(".song.active").removeClass("active");
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
      audioElement.pause();
      audioElement.currentTime = 0;
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
    audioElement.currentTime = newTime; // Set audio time only when dragging stops

    // Resume playback if it was playing before
    if (!audioElement.paused) {
      audioElement.play();
    }
    audioElement.addEventListener("timeupdate", updateProgress);
    isDragging = false;
  }
}
function handleDragging(e) {
  if (isDragging) {
    updateSlider(e); // Update slider position visually only
  }
}

/////// UI Changes ///////
///////////////////////////////////////
function updateTitle(song) {
  if (song && song.title && song.artist) {
    document.title = `${song.title} - ${song.artist}`;
  } else {
    document.title = "MyBeats Ã‚Â® Music Streaming";
  }
}
function songCardUpdate() {
  const largeAlbumCover = document.getElementById("largeAlbumCover");
  const smallAlbumCover = document.getElementById("smallAlbumCover");
  const songCardTitle = document.getElementById("songCardTitle");
  const songCardArtist = document.getElementById("songCardArtist");
  const songCardAlbum = document.getElementById("songCardAlbum");

  const albumCoverURL = `https://mybeats.cloud/mediaFiles/artistPortraits/${artistPlaying.toLowerCase().replace(/\s/g, "")}.png`;

  largeAlbumCover.src = albumCoverURL;
  smallAlbumCover.src = albumCoverURL;

  songCardTitle.textContent = songPlaying;
  songCardArtist.textContent = artistPlaying;
  songCardAlbum.textContent = albumPlaying;
}
function updateMediaSession(song, artworkUrl) {
  if ("mediaSession" in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title || "Unknown Title",
      artist: song.artist || "Unknown Artist",
      album: song.album || "Unknown Album",
      artwork: [
        {
          src: artworkUrl,
          sizes: "512x512",
          type: "image/png",
        },
      ],
    });

    updateMediaSessionPlaybackState();

    navigator.mediaSession.setActionHandler("play", () => {
      audioElement.play();
      isPlaying = true;
      updateProgress();
      updateMediaSessionPlaybackState();
      togglePlayPauseIcons();
    });
    navigator.mediaSession.setActionHandler("pause", () => {
      audioElement.pause();
      isPlaying = false;
      updateProgress();
      updateMediaSessionPlaybackState();
      togglePlayPauseIcons();
    });
    navigator.mediaSession.setActionHandler("previoustrack", skipBackward);
    navigator.mediaSession.setActionHandler("nexttrack", skipForward);
    navigator.mediaSession.setActionHandler("stop", () => {
      audioElement.pause();
      audioElement.currentTime = 0; // Reset to the beginning
      isPlaying = false;
      updateMediaSessionPlaybackState();
      togglePlayPauseIcons();
      updateProgress();
    });
    navigator.mediaSession.setActionHandler("seekbackward", () => {
      audioElement.currentTime = Math.max(0, audioElement.currentTime - rewindInterval);
      updateProgress();
    });
    navigator.mediaSession.setActionHandler("seekforward", () => {
      audioElement.currentTime = Math.min(audioElement.duration, audioElement.currentTime + fastForwardInterval);
      updateProgress();
    });
    navigator.mediaSession.setActionHandler("seekto", (details) => {
      if (details.fastSeek && "fastSeek" in audioElement) {
        audioElement.fastSeek(details.seekTime);
      } else {
        audioElement.currentTime = details.seekTime;
      }
      updateProgress();
    });
    navigator.mediaSession.setActionHandler("repeatmode", toggleRepeat);
    navigator.mediaSession.setActionHandler("shufflemode", toggleShuffle);
    navigator.mediaSession.setActionHandler("togglefavorite", () => {
      toggleFavorite(song);
    });
  }
}
function updateMediaSessionPlaybackState() {
  navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
}
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}
function updateProgress() {
  if (!audioElement.duration) return; // Prevent NaN issues if no duration is set

  // Force real-time update for Android Media Session
  const currentTime = !audioElement.paused ? audioElement.currentTime : audioElement.currentTime;
  const duration = audioElement.duration;

  // Calculate progress percentage
  const percent = (currentTime / duration) * 100;

  // Update slider
  progressElapsed.style.width = `${percent}%`;
  sliderThumb.style.left = `${percent}%`;

  // Update time displays
  currentTimeDisplay.textContent = formatTime(currentTime);
  totalTimeDisplay.textContent = formatTime(duration);

  // Sync with Media Session (if applicable)
  if ("mediaSession" in navigator) {
    navigator.mediaSession.setPositionState({
      duration: audioElement.duration,
      playbackRate: audioElement.playbackRate,
      position: audioElement.currentTime,
    });
  }
}
function updateSlider(e) {
  const rect = progressBarr.getBoundingClientRect();
  let offsetX = e.clientX - rect.left;
  offsetX = Math.max(0, Math.min(offsetX, rect.width));

  const progressPercent = (offsetX / rect.width) * 100;

  // Update slider and progress bar immediately
  progressElapsed.style.width = `${progressPercent}%`;
  sliderThumb.style.left = `${progressPercent}%`;

  // Update tooltip
  const totalDuration = audioElement.duration;
  const currentTime = (progressPercent / 100) * totalDuration;
  timeToolTip.textContent = formatTime(currentTime);
  timeToolTip.style.left = `${progressPercent}%`;

  return currentTime;
}
function togglePlayPauseIcons() {
  if (audioElement.paused) {
    btnPlay.style.display = "inline";
    btnPause.style.display = "none";
  } else {
    btnPlay.style.display = "none";
    btnPause.style.display = "inline";
  }
  updateMediaSessionPlaybackState();
}

audioElement.addEventListener("play", togglePlayPauseIcons);
audioElement.addEventListener("pause", togglePlayPauseIcons);
audioElement.addEventListener("loadedmetadata", () => {
  // Update the total time display when metadata is loaded
  totalTimeDisplay.textContent = formatTime(audioElement.duration);
});
audioElement.addEventListener("ended", () => {
  document.querySelectorAll(".song.active").forEach((songElem) => songElem.classList.remove("active"));
  togglePlayPauseIcons();
});
audioElement.addEventListener("timeupdate", updateProgress);

progressSlider.addEventListener("mousedown", (e) => {
  startDragging();
  updateSlider(e);
});
document.addEventListener("mousemove", handleDragging);
document.addEventListener("mouseup", () => {
  stopDragging();
});
playPauseButton.addEventListener("click", () => {
  if (audioElement.paused) {
    audioElement.play();
  } else {
    audioElement.pause();
  }
  togglePlayPauseIcons();
});
skipForwardButton.addEventListener("click", skipForward);
skipBackwardButton.addEventListener("click", skipBackward);
shuffleButton.addEventListener("click", toggleShuffle);
repeatButton.addEventListener("click", toggleRepeat);
//----------------------------------------------------------------


///////////////////////////////////////////////////////////////
/////////  P R I M A R Y  Functions  //////////////////////////
///////////////////////////////////////////////////////////////
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
  artistNameTitle.style.display = "none";
  const newestArtists = musicLibrary.slice(0, 5);

  setTimeout(() => {
    const dynamicArea = document.getElementById("dynamicArea");
    const newestArtistsContainer = document.createElement("div");
    newestArtistsContainer.id = "newestArtistsContainer";
    dynamicArea.appendChild(newestArtistsContainer);

    newestArtists.forEach((artist) => {
      const artistId = artist.artist.toLowerCase().replace(/\s/g, "");
      const artistDiv = document.createElement("div");
      artistDiv.setAttribute("data-transition", "loaders");
      artistDiv.className = "newest-artist";
      artistDiv.innerHTML = `<h3>${artist.artist}</h3><div class="artist-albums" id="albums-${artistId}"></div>`;
      newestArtistsContainer.appendChild(artistDiv);

      const artistAlbumsDiv = document.getElementById(`albums-${artistId}`);
      artist.albums.forEach((album) => {
        const albumId = album.album.toLowerCase().replace(/\s/g, "");
        const albumDiv = document.createElement("div");
        albumDiv.className = "album-cover";
        albumDiv.setAttribute("data-album", album.album);
        albumDiv.innerHTML = `<img src="https://mybeats.cloud/mediaFiles/albumCovers/${albumId}.png" alt="${album.album}"><h5>${album.album}</h5>`;

        albumDiv.addEventListener("click", () => {
          setTimeout(() => {
            clearDynamicArea();
            loadArtistInfo(artist.artist);
            const songList = document.createElement("div");
            songList.id = "song-list";
            dynamicArea.appendChild(songList);
            loadAlbumSongs(album.album, albumDiv);
            artistNameTitle.style.display = "block";
            artistNameTitle.classList.add("focusInContract");

            // Modified this part to update the active button
            setTimeout(() => {
              const albumButton = document.querySelector(`button[data-album="${album.album}"]`);
              if (albumButton) {
                updateActiveButton(albumButton);
              }
            }, 2000); // Increased timeout to ensure buttons are rendered
          }, 1500);
        });

        artistAlbumsDiv.appendChild(albumDiv);
      });
    });
  }, 1000);
}
function loadAllArtists() {
  setPage({ "data-page": "all", "data-artist": null });
  artistNameTitle.style.display = "none";

  setTimeout(() => {
    const dynamicArea = document.getElementById("dynamicArea");
    const allArtistsContainer = document.createElement("div");
    allArtistsContainer.id = "allArtistsContainer";
    allArtistsContainer.className = "gallery visible";
    dynamicArea.appendChild(allArtistsContainer);
    randomizeMe(musicLibrary);

    musicLibrary.forEach((artist) => {
      const artistDiv = document.createElement("div");
      artistDiv.className = "artistPage";
      artistDiv.setAttribute("data-artist", artist.artist);
      artistDiv.setAttribute("data-aos", "fade-up");

      // Create the circular photo container
      const circlePhotoContainer = document.createElement("div");
      circlePhotoContainer.className = "circlePhoto";

      // Create the image element
      const artistImage = document.createElement("img");
      artistImage.src = `https://mybeats.cloud/mediaFiles/artistPortraits/${artist.artist.toLowerCase().replace(/\s/g, "")}.png`;
      artistImage.alt = artist.artist;

      // Append the image to the circular container
      circlePhotoContainer.appendChild(artistImage);

      // Create the artist link
      const artistLink = document.createElement("a");
      artistLink.href = "#";
      artistLink.setAttribute("data-transition", "loaders");
      artistLink.addEventListener("click", (event) => {
        event.preventDefault();
        allArtistsContainer.style.width = "0";
        allArtistsContainer.style.transition = "width 1s ease";
        allArtistsContainer.style.display = "none";
        loadArtistInfo(artist.artist);
        const songList = document.createElement("div");
        songList.id = "song-list";
        dynamicArea.appendChild(songList);
        artistNameTitle.style.display = "block";
      });

      // Create the artist name heading
      const artistNameHeading = document.createElement("h4");
      artistNameHeading.innerText = artist.artist;
      artistNameHeading.className = "artistItemName";

      // Append elements to the artist div
      artistLink.appendChild(artistNameHeading);
      artistDiv.appendChild(circlePhotoContainer); // Append the circular container
      artistDiv.appendChild(artistLink);
      allArtistsContainer.appendChild(artistDiv);
    });

    console.log("All Artists loaded successfully.");
  }, 1000);

  setActiveLink("showAll");
}
function loadArtistInfo(artistName) {
  setPage({ "data-page": "artist", "data-artist": artistName });
  pushToURL(artistName);
  artistNameTitle.classList.remove("artistInfoContent", "focusInContract");
  artistNameTitle.classList.add("blurOUT");

  const artist = musicLibrary.find((artist) => artist.artist === artistName);
  const artistContainer = document.createElement("div");
  artistContainer.id = "artistDiscography";
  artistContainer.classList.add("artistDiscography");
  clearDynamicArea();
  dynamicArea.appendChild(artistContainer);

  loadPlayingArtistSimilar(artistName);

  setTimeout(() => {
    artistContainer.innerHTML = "";

    if (artist) {
      artistContainer.innerHTML = `
        <div class="desktopStyles">
          <div class="mainalbumcover">
            <img src="https://mybeats.cloud/mediaFiles/artistPortraits/${artistName.toLowerCase().replace(/\s/g, "")}.png" alt="${artistName}">
          </div>
          <div class="scrollingButtons" style="overflow-y: visible;">
            ${artist.albums.map((album) => `<button class="btnAlbums" data-album="${album.album}">${album.album}</button>`).join("")}
          </div>
        </div>
      `;

      artistNameTitle.textContent = artist.artist;
      setTimeout(() => {
        artistNameTitle.classList.remove("blurOUT");
        artistNameTitle.classList.add("focusInContract");
      }, 2000);

      const albumButtons = artistContainer.querySelectorAll(".btnAlbums");
      albumButtons.forEach((button) => {
        button.addEventListener("click", (event) => {
          const albumName = event.currentTarget.getAttribute("data-album");
          loadAlbumSongs(albumName, event.currentTarget);
        });
      });
    } else {
      console.log("Artist not found");
    }

    scrollToTop();
  }, 1850);

  setActiveLink("artistDiscography");
}
function loadAlbumSongs(albumName, button) {
  const songListContainer = document.getElementById("song-list");
  const currentSongs = songListContainer.querySelectorAll(".song");
  currentSongs.forEach((song) => song.classList.remove("visible"));
  populateCollectionDropdown();

  setTimeout(() => {
    songListContainer.innerHTML = "";
    const artist = musicLibrary.find((artist) => artist.albums.some((album) => album.album === albumName));
    if (!artist) return;

    const album = artist.albums.find((album) => album.album === albumName);
    if (!album) return;

    currentAlbumSongs = album.songs.map((song) => ({ ...song, artist: artist.artist, album: album.album }));

    currentAlbumSongs.forEach((song, index) => {
      const songElement = createElementsSONGS(song, index);
      songListContainer.appendChild(songElement);
      setTimeout(() => songElement.classList.add("visible"), 10);
    });

    if (activeButton) activeButton.classList.remove("active");
    button.classList.add("active");
    activeButton = button;

    loadFavorites();
    animateTrackItems();
  }, 500);
}

function createElementsSONGS(song, index) {
  const songElement = document.createElement("div");
  songElement.classList.add("song");
  songElement.id = `song${song.id}`;
  songElement.dataset.id = song.id;
  songElement.dataset.title = song.title;
  songElement.dataset.artist = song.artist;
  songElement.dataset.album = song.album;
  songElement.setAttribute("data-song-id", song.id);

  songElement.innerHTML = `
    <div class="songInner">
      <div class="body">
        <div class="songInfo heart" id="favourites"><i class="ph-fill ph-heart"></i></div>
        <div class="songInfo duration">${song.duration || "3:35"}</div>
        <div class="songInfo title"><h7 class="marquee">${song.title}</h7></div>
        <div class="icon-actions">
          <div class="icon" title="Add to Playlist" data-action="addToPlaylist"><i class="ph-fill ph-plus-circle"></i></div>
          <div class="icon" title="Play Next" data-action="playNext"><i class="ph-fill ph-check-circle"></i></div>
          <div class="icon" title="Download" data-action="download"><i class="material-symbols-outlined">download</i></div>
          <div class="icon save-offline" data-song-id="${song.id}" data-title="${song.title}" data-url="${song.downloadPath}" title="Offline" data-action="saveOffline"><i class="material-symbols-outlined">download_for_offline</i></div>
        </div>
      </div>
      <div class="moreMenu">
        <button id="songsMoreMenuBTN${song.id}" class="songsMoreMenuBTN" type="button"><i class="ph-fill ph-dots-three-outline"></i></button>
      </div>
    </div>
  `;

  addSongElementEventListeners(songElement, song, index);
  return songElement;
}
function addSongElementEventListeners(songElement, song, index) {
  const moreMenuBTN = songElement.querySelector(".songsMoreMenuBTN");
  const iconActions = songElement.querySelector(".icon-actions");

  moreMenuBTN.addEventListener("click", (event) => {
    event.stopPropagation();
    const isVisible = iconActions.classList.contains("visible");
    closeAllMenus();
    if (!isVisible) iconActions.classList.add("visible");
    else iconActions.classList.remove("visible");
  });

  const addToPlaylistIcon = songElement.querySelector(`[data-action="addToPlaylist"]`);
  addToPlaylistIcon.addEventListener("click", (event) => {
    event.preventDefault();
    popOverPLAY(addToPlaylistIcon, song);
  });

  const addToQueueIcon = songElement.querySelector(`[data-action="playNext"]`);
  addToQueueIcon.addEventListener("click", (event) => {
    event.preventDefault();
    addToQueue(song);
  });

  const downloadIcon = songElement.querySelector(`[data-action="download"]`);
  downloadIcon.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    const popover = document.createElement("div");
    popover.className = "download-popover";
    popover.innerHTML = `
      <div id="downloadLoading" class="loading">
        <div class="spinner"></div>
        <p>Finding File...</p>
      </div>
      <div id="downloadConfirmation" class="confirmation">
        <p>Are you sure you want to download this file?</p>
        <button id="confirmDownload">Yes</button>
        <button id="cancelDownload">No</button>
      </div>
    `;
    document.body.appendChild(popover);

    const loading = popover.querySelector("#downloadLoading");
    const confirmation = popover.querySelector("#downloadConfirmation");
    loading.style.display = "block";
    confirmation.style.display = "none";

    setTimeout(() => {
      loading.style.display = "none";
      confirmation.style.display = "block";

      const confirmButton = popover.querySelector("#confirmDownload");
      confirmButton.addEventListener("click", () => {
        const link = document.createElement("a");
        link.href = song.downloadPath;
        link.download = `${song.title}.mp3`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        popover.remove();
      });

      const cancelButton = popover.querySelector("#cancelDownload");
      cancelButton.addEventListener("click", () => {
        popover.remove();
      });
    }, 2000);
  });

  const saveOfflineIcon = songElement.querySelector(`[data-action="saveOffline"]`);
  saveOfflineIcon.addEventListener("click", (event) => {
    event.preventDefault();
    const songData = { id: song.id, title: song.title, url: song.downloadPath };
    const offlineSongs = JSON.parse(localStorage.getItem("offlineSongs") || "[]");
    const isAlreadySaved = offlineSongs.some((savedSong) => savedSong.id === song.id);

    if (!isAlreadySaved) {
      offlineSongs.push(songData);
      localStorage.setItem("offlineSongs", JSON.stringify(offlineSongs));
      alert("Song saved for offline playback!");
    } else {
      alert("This song is already saved for offline playback.");
    }
  });

  songElement.addEventListener("dblclick", () => {
    currentSongIndex = index;
    playSong(currentAlbumSongs[currentSongIndex]);
  });
}
function updateActiveButton(button) {
  if (activeButton) activeButton.classList.remove("active");
  button.classList.add("active");
  activeButton = button;
}
function closeAllMenus() {
  document.querySelectorAll(".icon-actions").forEach((menu) => menu.classList.remove("visible"));
}
function popOverPLAY(button, song) {
  const popoverContent = document.createElement("div");
  popoverContent.classList.add("popover-content");
  popoverContent.innerHTML = `
    <div class="popover-playlist-options">
      <h5>Add to Playlist</h5><br>
      <i class="material-symbols-outlined">playlist_add_circle</i>
      <div class="playlist-options">
        ${playlists
          .map(
            (playlist) => `
          <div class="radio-button">
            <input type="radio" id="radio${playlist.id}" name="radio-group" value="${playlist.id}">
            <label for="radio${playlist.id}">${playlist.title}</label>
          </div>
        `
          )
          .join("")}
      </div>
      <button id="confirmAddToPlaylist">Save</button>
    </div>
  `;

  document.body.appendChild(popoverContent);

  const cleanup = FloatingUIDOM.autoUpdate(button, popoverContent, () => {
    FloatingUIDOM.computePosition(button, popoverContent, { placement: "bottom", middleware: [] }).then(({ x, y }) => {
      Object.assign(popoverContent.style, { left: `${x}px`, top: `${y}px`, position: "absolute" });
    });
  });

  popoverContent.querySelector("#confirmAddToPlaylist").addEventListener("click", () => {
    const selectedPlaylistId = popoverContent.querySelector("input[name='radio-group']:checked")?.value;
    if (selectedPlaylistId) {
      addSongToPlaylist(selectedPlaylistId, song);
      alert(`Added ${song.title} to playlist!`);
    } else {
      alert("Please select a playlist.");
    }
    popoverContent.remove();
    cleanup();
  });

  setTimeout(() => {
    document.addEventListener(
      "click",
      (e) => {
        if (!popoverContent.contains(e.target) && e.target !== button) {
          popoverContent.remove();
          cleanup();
        }
      },
      { once: true }
    );
  }, 0);
}
//----------------------------------------------------------------


///////////////////////////////////////////////////////////////
/////////  R O U T I N G  Functions  //////////////////////////
///////////////////////////////////////////////////////////////
function siteRouter() {
  siteMap(window.location.pathname, window.location.search);
  siteMapLinks();
  window.addEventListener("popstate", (event) => {
    siteMap(window.location.pathname, window.location.search);
  });
}
function siteMap(path, query) {
  switch (path) {
    case "/discover":
      executeLoadingSequence();
      clearDynamicArea();
      $("#playlistMGR").addClass("hidden");
      setActiveLink("goHome");
      scrollToTop();
      discoverMusic();
      break;

    case "/allArtists":
      executeLoadingSequence();
      clearDynamicArea();
      $("#playlistMGR").addClass("hidden");
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
        $("#playlistMGR").removeClass("hidden");
        $("#playlistMGR").fadeIn(500, () => {
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
        setActiveLink("artistDiscography");
        scrollToTop();
        loadArtistInfo(artistName);
      } else {
        loadThis("/allArtists");
      }
      break;

    default:
      loadThis("/discover");
      break;
  }
}
function siteMapLinks() {
  const goHomeButton = document.getElementById("goHome");
  if (goHomeButton) {
    goHomeButton.addEventListener("click", (event) => {
      event.preventDefault();
      loadThis("/discover");
    });
  }
  const showAllButton = document.getElementById("showAll");
  if (showAllButton) {
    showAllButton.addEventListener("click", (event) => {
      event.preventDefault();
      loadThis("/allArtists");
    });
  }
  const collectionsButton = document.getElementById("myCollections");
  if (collectionsButton) {
    collectionsButton.addEventListener("click", (event) => {
      event.preventDefault();
      loadThis("/myCollections");
    });
  }

  document.addEventListener("click", (event) => {
    if (event.target && event.target.classList.contains("artistPage")) {
      event.preventDefault();
      const artistName = event.target.getAttribute("data-artist");
      if (artistName) {
        // Replace spaces with periods for the URL
        const formattedArtistName = artistName.replace(/\s+/g, ".");
        loadThis(`/artists?artist=${formattedArtistName}`);
      }
    }
  });
}
function loadThis(path) {
  window.history.pushState({}, "", path);
  siteMap(path, window.location.search);
}
function setPage(attrs) {
  Object.keys(attrs).forEach((key) => {
    document.body.setAttribute(key, attrs[key]);
  });
}

/////// L O A D I N G Animations ///////
///////////////////////////////////////
$(document).on("click", "[data-transition='loaders']", function () {
  executeLoadingSequence();
});
function executeLoadingSequence() {
  showLoadingOverlay();
  startLoading();
  setTimeout(() => {
    finishLoading();
    hideLoadingOverlay();
  }, 2000);
}
function resetProgressBar() {
  const progressBar = document.getElementById("loadingBar");
  if (progressBar) {
    progressBar.style.transition = "none";
    progressBar.style.width = "0%";
    progressBar.style.opacity = "1";
    progressBar.offsetWidth; // Force reflow
    progressBar.style.transition = "";
  }
}
function startLoading() {
  const progressBar = document.getElementById("loadingBar");
  if (!progressBar) return;

  const pauseWidth = randomInt(30, 75);
  const jumpWidth = randomInt(80, 90);

  function updateWidth(width, duration) {
    return new Promise((resolve) => {
      progressBar.style.transition = `width ${duration}ms ease-in-out`;
      progressBar.style.width = `${width}%`;
      setTimeout(resolve, duration);
    });
  }

  async function animateLoading() {
    progressBar.style.opacity = "1";
    await updateWidth(pauseWidth, 2000);
    await updateWidth(jumpWidth, 850);
    await updateWidth(100, 1000);
  }

  animateLoading();
}
function finishLoading() {
  const progressBar = document.getElementById("loadingBar");
  if (progressBar) {
    progressBar.style.transition = "width 0.75s ease-in-out, opacity 0.75s ease-in-out";
    progressBar.style.width = "100%";

    setTimeout(() => {
      progressBar.style.opacity = "0";
    }, 750);

    setTimeout(resetProgressBar, 1500);
  }
}
function showLoadingOverlay() {
  toggleLoadingOverlay(true);
}
function hideLoadingOverlay() {
  setTimeout(() => toggleLoadingOverlay(false), 1500);
}
function toggleLoadingOverlay(visible) {
  const loadingOverlay = document.getElementById("pageLoader");
  if (loadingOverlay) {
    loadingOverlay.classList.toggle("visible", visible);
  }
}

///////// HELPER Functions /////////////
///////////////////////////////////////
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

  // Replace spaces with periods
  const formattedName = artistName.replace(/\s+/g, ".");
  const newURL = `${window.location.origin}/artists?artist=${formattedName}`;

  window.history.pushState({}, "", newURL);
}
function fetchFromURL(query) {
  const params = new URLSearchParams(query);
  const artist = params.get("artist");
  if (artist) {
    // Replace periods with spaces
    return artist.replace(/\./g, " ");
  }
  return null; // Return null if no Artist exists
}
//----------------------------------------------------------------


/////////////////////////////////////////////////////////////
/////////  Similar Artists  /////////////////////////////////
/////////////////////////////////////////////////////////////
function getSimilarArtists(artistName) {
  const artist = musicLibrary.find((artist) => artist.artist === artistName);

  if (artist) {
    const similarArtists = artist.similar.slice();
    randomizeMe(similarArtists);
    return similarArtists;
  }
  return [];
}
function loadPlayingArtistSimilar(artistName) {
  const playingSimilarArtistsArea = document.createElement("div");
  playingSimilarArtistsArea.id = "playingSimilarArtistsArea";
  playingSimilarArtistsArea.classList.add("similarArtistsPlayingArea");

  const scrollAbleInside = document.createElement("div");
  scrollAbleInside.classList = "scrollAble";

  playingSimilarArtistsArea.appendChild(scrollAbleInside);

  // Create left and right arrow buttons
  const arrowLeft = document.createElement("button");
  arrowLeft.classList.add("arrow", "arrow-left");
  arrowLeft.innerHTML = `<i class="ph-fill ph-arrow-circle-left"></i>`;
  arrowLeft.disabled = true; // Initially disabled

  const arrowRight = document.createElement("button");
  arrowRight.classList.add("arrow", "arrow-right");
  arrowRight.innerHTML = `<i class="ph-fill ph-arrow-circle-right"></i>`;

  playingSimilarArtistsArea.appendChild(arrowLeft);
  playingSimilarArtistsArea.appendChild(arrowRight);

  // Create the Load More button with the spinner
  const loadMoreButton = document.createElement("button");
  loadMoreButton.id = "loadMoreSimilarArtists";
  loadMoreButton.classList.add(
    "inline-block",
    "rounded-full",
    "bg-green-500",
    "text-neutral-50",
    "shadow-[0_4px_9px_-4px_rgba(51,45,45,0.7)]",
    "hover:bg-green-600",
    "hover:shadow-[0_8px_9px_-4px_rgba(51,45,45,0.2),0_4px_18px_0_rgba(51,45,45,0.1)]",
    "focus:bg-green-800",
    "focus:shadow-[0_8px_9px_-4px_rgba(51,45,45,0.2),0_4px_18px_0_rgba(51,45,45,0.1)]",
    "active:bg-green-700",
    "active:shadow-[0_8px_9px_-4px_rgba(51,45,45,0.2),0_4px_18px_0_rgba(51,45,45,0.1)]",
    "px-6",
    "pb-2",
    "pt-2.5",
    "text-s",
    "font-medium",
    "uppercase",
    "leading-normal",
    "transition",
    "duration-150",
    "ease-in-out",
    "focus:outline-none",
    "focus:ring-0"
  );
  loadMoreButton.innerHTML = `
    <div role="status" class="inline-block h-3 w-3 mr-2 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] invisible">
      <span class="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
    </div>
    Load More
  `;
  loadMoreButton.disabled = false;

  const similarArtists = getSimilarArtists(artistName);
  let displayedCount = 0;

  // Create a single popover element
  const popover = document.createElement("div");
  popover.id = "popover";
  popover.setAttribute("role", "tooltip");
  popover.classList.add(
    "popOverGlobal",
    "absolute",
    "z-10",
    "invisible",
    "inline-block",
    "w-64",
    "text-sm",
    "text-gray-500",
    "transition-opacity",
    "duration-300",
    "bg-white",
    "border",
    "border-gray-200",
    "rounded-lg",
    "shadow-sm",
    "opacity-0",
    "dark:text-gray-400",
    "dark:bg-gray-800",
    "dark:border-gray-600"
  );
  document.body.appendChild(popover); // Append the popover to the body

  const renderSimilarArtists = () => {
    const rowLimit = 4;
    const maxArtists = 20;
    const toDisplay = similarArtists.slice(displayedCount, displayedCount + rowLimit);

    toDisplay.forEach((similarArtist) => {
      const artistDiv = document.createElement("div");
      artistDiv.className = "artistSimilar";
      artistDiv.innerHTML = `
        <div class="imgBx">
          <img src="https://mybeats.cloud/mediaFiles/artistPortraits/${similarArtist.toLowerCase().replace(/\s/g, "")}.png" alt="${similarArtist.toLowerCase().replace(/\s/g, "")}">
        </div>
        <div class="content">
          <div class="contentBx">
            <h2>${similarArtist}</h2>
          </div>

          <ul class="sci">
            <li style="--i:1">
              <button type="button" data-popover-target="popover" data-popover-trigger="click" data-artist="${similarArtist}">
                <i class="ph-bold ph-user"></i>
              </button>
            </li>
            <li style="--i:2">
              <i class="ph-bold ph-user"></i>
            </li>
            <li style="--i:3">
              <i class="ph-bold ph-user"></i>
            </li>
          </ul>
        </div>
      `;

      scrollAbleInside.appendChild(artistDiv);
    });

    displayedCount += toDisplay.length;

    if (displayedCount >= maxArtists || displayedCount >= similarArtists.length) {
      loadMoreButton.disabled = true;
    }
  };

  renderSimilarArtists();
  renderSimilarArtists();

  loadMoreButton.addEventListener("click", () => {
    const spinner = loadMoreButton.querySelector("div[role='status']");
    spinner.classList.remove("invisible"); // Show the spinner

    setTimeout(() => {
      const previousScrollWidth = scrollAbleInside.scrollWidth; // Store the scroll width before loading more artists
      renderSimilarArtists(); // Load more artists

      // Smoothly scroll to the right after loading more artists
      setTimeout(() => {
        scrollAbleInside.scrollBy({
          left: scrollAbleInside.scrollWidth - previousScrollWidth, // Scroll by the difference in width
          behavior: "smooth",
        });
      }, 0); // Use a small timeout to ensure the DOM updates before scrolling

      spinner.classList.add("invisible"); // Hide the spinner after loading
    }, 1000); // Wait for 2 seconds before rendering more artists
  });

  dynamicAreaBottom.appendChild(playingSimilarArtistsArea);
  dynamicAreaBottom.appendChild(loadMoreButton);

  // Initialize popovers after rendering
  initializePopovers();

  // Scroll event listeners
  arrowLeft.addEventListener("click", () => {
    scrollAbleInside.scrollBy({
      left: -scrollAbleInside.clientWidth,
      behavior: "smooth",
    });
  });

  arrowRight.addEventListener("click", () => {
    scrollAbleInside.scrollBy({
      left: scrollAbleInside.clientWidth,
      behavior: "smooth",
    });
  });

  scrollAbleInside.addEventListener("scroll", () => {
    arrowLeft.disabled = scrollAbleInside.scrollLeft === 0;
    arrowRight.disabled = scrollAbleInside.scrollLeft + scrollAbleInside.clientWidth >= scrollAbleInside.scrollWidth;
  });
}
function initializePopovers() {
  const popoverTriggers = document.querySelectorAll("[data-popover-target]");

  popoverTriggers.forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.stopPropagation();

      // Remove existing popover if any
      const existingPopover = document.getElementById("popover");
      if (existingPopover) {
        existingPopover.remove();
      }

      // Create a new popover
      const popover = document.createElement("div");
      popover.id = "popover";
      popover.className = "popOverGlobal";

      const artist = trigger.getAttribute("data-artist");
      const rect = trigger.getBoundingClientRect();

      popover.innerHTML = `
        <div class="p-3">
          <div class="flex items-center justify-between mb-2">
            <a href="#">
              <img class="w-10 h-10 rounded-full" src="https://mybeats.cloud/mediaFiles/albumCovers/thesearch.png" alt="Jese Leos">
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
            <a href="#">${artist}</a>
          </p>
          <p class="mb-3 text-sm font-normal popOverSubTitle">
            <a href="#" class="hover:underline">Three Albums</a>
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
        <div data-popper-arrow></div>
      `;

      document.body.appendChild(popover);

      popover.style.position = "absolute";
      popover.style.top = `${rect.bottom + window.scrollY}px`;
      popover.style.left = `${rect.left + window.scrollX}px`;

      // Show popover
      popover.classList.remove("invisible", "opacity-0");

      // Close when clicking outside
      document.addEventListener("click", handleOutsideClick);

      function handleOutsideClick(event) {
        if (!popover.contains(event.target) && !event.target.closest("[data-popover-target]")) {
          popover.classList.add("invisible", "opacity-0");

          // Wait for animation (optional) then remove
          setTimeout(() => {
            popover.remove();
          }, 300); // Adjust time as per CSS transition duration

          document.removeEventListener("click", handleOutsideClick);
        }
      }
    });
  });
}
//----------------------------------------------------------------


//////////////////////////////////////////////////////////////
/////////  F A V O R I T E S   ///////////////////////////////
//////////////////////////////////////////////////////////////
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
    const song = type === "favorites" ? findSongById(songOrId) : songOrId;
    if (song) {
      const songDiv = document.createElement("div");
      songDiv.classList.add("song", type === "favorites" ? "favoriteSong" : "up-next-song");
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
  } else {
    // Add to favorites
    favorites.push(songId);
    heart.classList.add("hearted");

    // Show toast notification
    const toastId = `toast-${songId}`;
    const toastHtml = `
    <div id="${toastId}" class="toast toastFAVs" role="alert" aria-live="assertive" aria-atomic="true">
    <div class="toastFAVs-banner">Added to Favorites!</div>
    <div class="toastFAVs-content">
    <span class="toastFAVs-message">${songName} <br>
    <span class="toastFAVs-message-smaller">Undo</span>
    </span>
    <span class="toastFAVs-timestamp">Just Now</span>
    </div>
    </div>
    `;

    const toastContainer = document.getElementById("toastContainer");
    if (toastContainer) {
      toastContainer.insertAdjacentHTML("beforeend", toastHtml);

      const favoriteToast = new bootstrap.Toast(document.getElementById(toastId), {
        autohide: true,
        delay: 9500,
      });
      favoriteToast.show();

      setTimeout(() => {
        const toastElement = document.getElementById(toastId);
        if (toastElement) {
          toastElement.classList.add("puff-out-ver");
        }
      }, 7500);
    } else {
      console.warn("Toast container not found. Cannot show notification.");
    }
  }

  // Update localStorage
  localStorage.setItem("favorites", JSON.stringify(favorites));
  addSongToFavorites();
  displayFavorites();
}
function removeFromFavorites(songId) {
  const index = favorites.findIndex((song) => song.id === songId);
  if (index > -1) {
    favorites.splice(index, 1);
    myLibrary("favorites", favorites);
  }
}
function getFavorites() {
  const favorites = localStorage.getItem("favorites");
  return favorites ? JSON.parse(favorites) : [];
}
function saveFavorites(favorites) {
  localStorage.setItem("favorites", JSON.stringify(favorites));
}
function addSongToFavorites(songId) {
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
        heart.classList.remove("heart");
        heart.classList.add("hearted");
      } else {
        heart.classList.remove("hearted");
        heart.classList.add("heart");
      }
    }
  }
}
function handleHeartClick(event) {
  const heartIcon = event.target;
  if (heartIcon.classList.contains("heart")) {
    const songElement = heartIcon.closest(".song");
    const songId = songElement.getAttribute("data-id");
    addSongToFavorites(songId);
  } else if (heartIcon.classList.contains("hearted")) {
    const songElement = heartIcon.closest(".song");
    const songId = songElement.getAttribute("data-id");
    removeSongFromFavorites(songId);
  }
}
function displayFavorites() {
  const favoritesContainer = document.getElementById("myFavorites");
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
      const song = findSongById(songId); // Find the song by its ID
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
//----------------------------------------------------------------


/////////////////////////////////////////////////////////////
/////////  U P  N E X T  Q U E U E  /////////////////////////
/////////////////////////////////////////////////////////////
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


/////////////////////////////////////////////////////////////
/////////  P L A Y L I S T S  ///////////////////////////////
/////////////////////////////////////////////////////////////
let playlists = JSON.parse(localStorage.getItem("playlists") || "[]");

function resetCreateForm() {
  $("#playlistTitleInput").val("");
  $("#playlistDescriptionInput").val("");
  $("#genreSelect").val("");
  $("#tagContainer").empty();
  $("#tagInput").val("");
  $("#coverUpload").val("");
}
function createPlaylist(title, description, genre, tags, coverImage) {
  const newPlaylist = {
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
}
function renderPlaylistGallery() {
  const $gallery = $("#playlistGallery").empty();
  $.each(playlists, function (index, playlist) {
    const $card = $(`
                <div class="playlist-thumbnail bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer">
                    <img src="${playlist.coverImage}" alt="${playlist.title}" class="w-full h-48 object-cover">
                    <div class="p-4">
                        <h3 class="font-bold text-lg mb-2">${playlist.title}</h3>
                        <p class="text-gray-600 text-sm mb-2">${playlist.description}</p>
                        <div class="flex flex-wrap gap-2">
                            ${playlist.tags.map((tag) => `<span class="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">${tag}</span>`).join("")}
                        </div>
                    </div>
                </div>
            `).on("click", function () {
      loadPlaylist(playlist.id);
    });
    $gallery.append($card);
  });
}
function loadPlaylist(playlistId) {
  $("#playlistGallery").addClass("hidden");
  $("#playlistView").removeClass("hidden").html(`
            <div class="flex justify-center items-center h-64">
                <svg class="loading w-12 h-12 text-blue-600" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
        `);
  setTimeout(function () {
    const playlist = playlists.find(function (p) {
      return p.id === playlistId;
    });
    if (playlist) {
      renderPlaylistView(playlist);
    } else {
      alert("Playlist not found!");
      $("#playlistView").addClass("hidden");
      $("#playlistGallery").removeClass("hidden");
    }
  }, 1000);
}
function renderPlaylistView(playlist) {
  $("#playlistView").attr("data-playlist-id", playlist.id).html(`
    <div class="flex items-center mb-6">
      <button id="backToGallery" class="mr-4 text-gray-600 hover:text-gray-800">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
        </svg>
      </button>
      <h2 class="text-2xl font-bold text-gray-800" id="playlistTitle">${playlist.title}</h2>
      <button id="editPlaylistBtn" class="ml-4 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300">Edit</button>
      <button id="savePlaylistBtn" class="ml-4 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 hidden">Save</button>
    </div>
    <div id="playlistDetails" class="bg-white rounded-lg shadow-lg p-6">
      <div class="flex mb-6">
        <img src="${playlist.coverImage}" alt="${playlist.title}" class="w-48 h-48 object-cover rounded-lg">
        <div class="ml-6">
          <h3 class="text-xl font-bold mb-2" data-field="title">${playlist.title}</h3>
          <p class="text-gray-600 mb-4" data-field="description">${playlist.description}</p>
          <p class="text-sm text-gray-500 mb-2">Genre: <span data-field="genre">${playlist.genre}</span></p>
          <div class="flex flex-wrap gap-2">
            ${playlist.tags.map((tag) => `<span class="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">${tag}</span>`).join("")}
          </div>
        </div>
      </div>
      <div class="border-t pt-4">
        <h4 class="font-bold mb-4">Songs</h4>
        <div class="space-y-2" id="playlistSongs">
          ${
            playlist.songs.length
              ? playlist.songs
                  .map(
                    (song, i) => `
            <div class="flex items-center justify-between p-2 bg-gray-50 rounded" data-song-id="${song.id}">
              <span>${i + 1}. ${song.title}</span>
              <span class="text-gray-500">${song.duration}</span>
            </div>
          `
                  )
                  .join("")
              : '<p class="text-gray-500">No songs added yet</p>'
          }
        </div>
        <button id="addSongBtn" class="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300">Add Song</button>
      </div>
    </div>
  `);

  // Add double-click event listeners to playlist songs
  const playlistSongs = document.querySelectorAll("#playlistSongs > div");
  playlistSongs.forEach((songElement) => {
    songElement.addEventListener("dblclick", () => {
      const songId = songElement.getAttribute("data-song-id");
      const song = findSongById(songId); // Find the song by its ID
      if (song) {
        playSong(song); // Play the song
      }
    });
  });
}
function enableInlineEditing() {
  const playlistId = parseInt($("#playlistView").attr("data-playlist-id"));
  const $title = $('[data-field="title"]').attr("contenteditable", true).addClass("border border-blue-300 rounded px-2 focus:outline-none focus:border-blue-500");
  const $description = $('[data-field="description"]').attr("contenteditable", true).addClass("border border-blue-300 rounded px-2 focus:outline-none focus:border-blue-500");
  const currentGenre = $('[data-field="genre"]').text();
  const $genreSelect = $(`
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
  const playlistId = parseInt($("#playlistView").attr("data-playlist-id"));
  const playlist = playlists.find(function (p) {
    return p.id === playlistId;
  });
  if (playlist) {
    playlist.title = $('[data-field="title"]').text().trim();
    playlist.description = $('[data-field="description"]').text().trim();
    playlist.genre = $("select").val();
    localStorage.setItem("playlists", JSON.stringify(playlists));
    $("[contenteditable]").removeAttr("contenteditable").removeClass("border border-blue-300 rounded px-2 focus:outline-none focus:border-blue-500");
    const $genreText = $('<span data-field="genre">' + $("select").val() + "</span>");
    $("select").replaceWith($genreText);
    $("#playlistTitle").text(playlist.title);
    renderPlaylistGallery();
  }
}
function addSongToPlaylist(playlistId, song) {
  const playlist = playlists.find((p) => p.id === parseInt(playlistId));
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
    renderPlaylistGallery(); // Refresh the playlist gallery if needed
  } else {
    console.error("Playlist not found");
  }
}

$("#playlistGallery").addClass("hidden");
$("#myCollections").on("click", function () {
  $("#playlistGallery").removeClass("hidden");
  renderPlaylistGallery();
});
$("#createPlaylistBtn").on("click", function () {
  $("#createPlaylistModal").removeClass("hidden");
});
$("#cancelCreateBtn").on("click", function () {
  $("#createPlaylistModal").addClass("hidden");
  resetCreateForm();
});
$("#addTagBtn").on("click", function () {
  const tagText = $("#tagInput").val().trim();
  if (tagText) {
    const $tagElement = $(`
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
$("#confirmCreateBtn").on("click", function () {
  const title = $("#playlistTitleInput").val().trim();
  if (!title) {
    alert("Playlist title is required!");
    return;
  }
  const description = $("#playlistDescriptionInput").val().trim();
  const genre = $("#genreSelect").val();
  const tags = [];
  $("#tagContainer .tag").each(function () {
    tags.push($(this).contents().first().text().trim());
  });
  const $fileInput = $("#coverUpload");
  const file = $fileInput[0].files[0];
  if (file) {
    const reader = new FileReader();
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
$("#playlistView").on("click", "#backToGallery", function () {
  $("#playlistView").addClass("hidden");
  $("#playlistGallery").removeClass("hidden");
});
$("#playlistView").on("click", "#editPlaylistBtn", function () {
  $(this).addClass("hidden");
  $("#savePlaylistBtn").removeClass("hidden");
  enableInlineEditing();
});
$("#playlistView").on("click", "#savePlaylistBtn", function () {
  $(this).addClass("hidden");
  $("#editPlaylistBtn").removeClass("hidden");
  savePlaylistChanges();
});
$("#playlistView").on("click", "#addSongBtn", function () {
  const songTitle = prompt("Enter song title:");
  const songArtist = prompt("Enter song artist:");
  if (songTitle && songArtist) {
    const playlistId = parseInt($("#playlistView").attr("data-playlist-id"));
    const playlist = playlists.find(function (p) {
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
$("#tagInput").on("keypress", function (e) {
  if (e.which === 13) {
    e.preventDefault();
    $("#addTagBtn").trigger("click");
  }
});
$(document).on("keydown", function (e) {
  if (e.key === "Escape") {
    $("#createPlaylistModal").addClass("hidden");
    resetCreateForm();
  }
});

const $dropZone = $("#coverUpload").parent();
$dropZone
  .on("dragover", function (e) {
    e.preventDefault();
    $dropZone.addClass("bg-blue-50");
  })
  .on("dragleave", function (e) {
    e.preventDefault();
    $dropZone.removeClass("bg-blue-50");
  })
  .on("drop", function (e) {
    e.preventDefault();
    $dropZone.removeClass("bg-blue-50");
    const files = e.originalEvent.dataTransfer.files;
    if (files.length && files[0].type.startsWith("image/")) {
      $("#coverUpload")[0].files = files;
    } else {
      alert("Please drop an image file!");
    }
  });
//----------------------------------------------------------------





//////////////////////////////////////////////////////////////
/////////  S E R V I C E  W O R K E R  ///////////////////////
//////////////////////////////////////////////////////////////
document.addEventListener("DOMContentLoaded", () => {
  if ("launchQueue" in window && "files" in LaunchParams.prototype) {
    launchQueue.setConsumer(async (launchParams) => {
      const fileHandles = launchParams.files;
      if (!fileHandles.length) return;

      const fileHandle = fileHandles[0];
      const file = await fileHandle.getFile();

      clearDynamicArea();
      loadAudioPlayer(file);
    });
  }
});
function loadAudioPlayer(file) {
  const dynamicArea = document.getElementById("dynamicArea");

  const content = `
  <div class="music-container">
  <h2>Play Your Offline Music or Discover New Music Here</h2>
  </div>
  <style>
  .music-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 20px;
  background: #f0f0f0;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin-top: 20px;
  }
  h2 {
  font-family: 'Arial', sans-serif;
  font-size: 24px;
  color: #333;
  margin-bottom: 15px;
  }
  audio {
  width: 80%;
  max-width: 500px;
  }
  </style>
  `;

  dynamicArea.innerHTML = content;

  const audioElement = document.querySelector("#audio");
  audioElement.src = URL.createObjectURL(file);
  audioElement.play().catch((err) => console.error("Audio playback error:", err));
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./serviceWorker.js")
      .then((registration) => {
        console.log("ServiceWorker registration successful with scope: ", registration.scope);
      })
      .catch((error) => {
        console.log("ServiceWorker registration failed: ", error);
      });
  });

  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data.type === "OPEN_FILE") {
      const fileArrayBuffer = event.data.file;
      const fileName = event.data.fileName;
      playAudioFile(fileArrayBuffer, fileName);
    }
  });
}

function playAudioFile(fileArrayBuffer, fileName) {
  const blob = new Blob([fileArrayBuffer], { type: "audio/mp3" });
  const url = URL.createObjectURL(blob);

  const audioPlayer = document.getElementById("audio");
  audioPlayer.src = url;
  audioPlayer.play();

  console.log(`Playing: ${fileName}`);
}
navigator.serviceWorker.addEventListener("message", (event) => {
  if (event.data.type === "OPEN_FILE") {
    const fileUrl = event.data.url;
    const fileName = event.data.name;

    // Use the file URL in your music player
    const audioPlayer = document.getElementById("audio");
    audioPlayer.src = fileUrl;
    audioPlayer.play();

    // Optionally, display the file name
    //   document.getElementById('file-name').textContent = `Now Playing: ${fileName}`;
  }
});
