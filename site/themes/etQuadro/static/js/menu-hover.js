var $j2 = jQuery.noConflict();
var etThemeInitialized = false;

function initEtTheme() {
  if (etThemeInitialized) {
    return;
  }
  etThemeInitialized = true;

  $j2("#page-menu .lavaLampWithImage").lavaLamp({
    fx: "backout",
    speed: 700,
    click: function (event, menuItem) {
      return true;
    }
  });

  $j2(".widget ul li").each(function () {
    $j2(this).hover(
      function () {
        $j2(this).addClass("hover");
      },
      function () {
        $j2(this).removeClass("hover");
      }
    );
  });

  if ($j2.fn.cycle && $j2("#featured-post .featured-item").length > 1) {
    $j2("#featured-post").cycle({
      fx: "fade",
      speed: 700,
      timeout: 5000,
      pause: 0,
      next: "#featured-next",
      prev: "#featured-prev"
    });
  }
}

if (document.readyState === "loading") {
  jQuery(document).ready(initEtTheme);
} else {
  initEtTheme();
}
