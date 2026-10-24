jQuery(document).ready(function () {
  var current = 0;
  var $audio = jQuery("#player");
  var $playlist = jQuery("#playlist");
  var $tracks = $playlist.find("li a.track");
  var len = $tracks.length;

  $playlist.on("click", "a.track", function (e) {
    e.preventDefault();
    link = jQuery(this);
    current = link.parent().index();
    play(link, $audio[0]);
  });
  $audio[0].addEventListener("play", function (e) {
    var $link = jQuery("li.active > a");
    setTrackMetadata($link);
  });
  $audio[0].addEventListener("ended", function (e) {
    playNext();
  });
  jQuery("a#next").on("click", function (e) {
    e.preventDefault();
    playNext();
  });
  jQuery("a#prev").on("click", function (e) {
    e.preventDefault();
    playPrev();
  });

  function playPrev() {
    current--;
    if (current < 0) {
      current = len - 1;
    }
    link = $playlist.find("a.track")[current];
    play(jQuery(link), $audio[0]);
  }

  function playNext() {
    current++;
    if (current == len) {
      current = 0;
    }
    link = $playlist.find("a.track")[current];
    play(jQuery(link), $audio[0]);
  }

  function setTrackMetadata($link) {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: $link.data("title"),
        artist: $link.data("artist"),
      });
    }
  }

  function play($link, $player) {
    title = $link.text();
    jQuery("#now-playing").text("Now playing: " + title);

    $player.src = $link.attr("href");
    par = $link.parent();
    par.addClass("active").siblings().removeClass("active");
    $player.load();
    $player.play();
  }

  if ("mediaSession" in navigator) {
    navigator.mediaSession.setActionHandler("nexttrack", playNext);
    navigator.mediaSession.setActionHandler("previoustrack", playPrev);
  }
});