var buttons = require('sdk/ui/button/action');
var tabs = require("sdk/tabs");

var button = buttons.ActionButton({
  id: "generate-password",
  label: "Generate password",
  icon: {
    /* Raisin pictures are CC-BY-SA-2.5 from Cary Bass, https://commons.wikimedia.org/wiki/File:Single_raisin.jpg */
    "16": "./icon-16.png",
    "32": "./icon-32.png",
    "64": "./icon-64.png"
  },
  onClick: function() {
    tabs.open("chrome://pasa/content/generate.html");
  },
});
