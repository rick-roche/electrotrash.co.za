var $j2 = jQuery.noConflict();
jQuery(document).ready(function () {
  $j2("#page-menu .lavaLampWithImage").lavaLamp({
    fx: "backout",
    speed: 700,
    click: function (event, menuItem) {
      return true;
    },
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
});
