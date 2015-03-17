const buttons = require('sdk/ui/button/action');
const cm = require("sdk/context-menu");
const l10n = require('sdk/l10n');
const self = require('sdk/self');
const tabs = require('sdk/tabs');
const urls = require("sdk/url");
const uuid = require('sdk/util/uuid');

const {Cc, Ci, Cm, Cu, components} = require('chrome');
const clipboard = Cc['@mozilla.org/widget/clipboardhelper;1'].getService(Ci.nsIClipboardHelper);
const componentRegistrar = Cm.QueryInterface(Ci.nsIComponentRegistrar);
const loginManager = Cc["@mozilla.org/login-manager;1"].getService(Ci.nsILoginManager);
const preferences = Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefBranch);

Cu.import('resource://gre/modules/XPCOMUtils.jsm');


/* about URI helpers */

var aboutClassMetadata = [];

function registerAboutUri(sitename, dataTarget, isSubResource) {
  if (isSubResource)
    sitename += '/' + dataTarget;

  function About() {}
  About.prototype = {
    classDescription: 'about:' + sitename,
    contractID: '@mozilla.org/network/protocol/about;1?what=' + sitename,
    classID: components.ID(uuid.uuid()),
    QueryInterface: XPCOMUtils.generateQI([Ci.nsIAboutModule]),

    getURIFlags: function(aURI) {
      return Ci.nsIAboutModule.ALLOW_SCRIPT;
    },

    newChannel: function(aURI) {
      let ios = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService);
      let channel = ios.newChannel(self.data.url(dataTarget), null, null);
      channel.originalURI = aURI;
      return channel;
    }
  };

  let aboutFactory = XPCOMUtils.generateNSGetFactory([About])(About.prototype.classID);

  componentRegistrar.registerFactory(
    About.prototype.classID,
    About.prototype.classDescription,
    About.prototype.contractID,
    aboutFactory
  );

  aboutClassMetadata[sitename] = {
    classID: About.prototype.classID,
    factory: aboutFactory,
  };
}

function unregisterAboutUris() {
  aboutClassMetadata.forEach(function(sitename) {
    componentRegistrar.unregisterFactory(aboutClassMetadata[sitename].classID, aboutClassMetadata[sitename].factory);
  });
  aboutClassMetadata = [];
}


/* main code */

exports.main = function(options, callbacks) {
  registerAboutUri('pasa', 'generate.html');
  registerAboutUri('pasa', 'bootstrap.min.css', true);
  registerAboutUri('pasa', 'icon-16.png', true);

  buttons.ActionButton({
    id: 'pasa',
    label: l10n.get('buttonLabel'),
    icon: {
      /* Raisin pictures are CC-BY-SA-2.5 from Cary Bass, https://commons.wikimedia.org/wiki/File:Single_raisin.jpg */
      '16': './icon-16.png',
      '32': './icon-32.png',
      '64': './icon-64.png',
    },
    onClick: function() {
      tabs.open('about:pasa');
    },
  });
};

exports.onUnload = unregisterAboutUris;

var insertPasswordMenu;

function createInsertPasswordMenu(url) {
  destroyInsertPasswordMenu();
  if (!url) return;

  var hostname = urls.URL(url).hostname;
  var domains = hostname.split('.');

  insertPasswordMenu = cm.Menu({
    contentScript:
      'self.on("click", function(node, data) { \
        node.value = data; \
      });',
    context: cm.SelectorContext('input[type=password]'),
    image: self.data.url('icon-16.png'),
    items: loginManager.getAllLogins({}, {}).filter(function(login) {
      switch (domains.length) {
        case 1:
          //hostnames must match exactly
          return (login.hostname == hostname);
        case 2:
          //top-level domains must match (e.g. foo.pepsi and bar.pepsi)
          return login.hostname.endsWith('.' + domains[domains.length - 1]);
        default:
          //second-to-last domains must match (e.g. www.amazon.com and www.amazon.ca)
          return (login.hostname.split('.').slice(-2)[0] == domains[domains.length - 2]);
      }
    }).map(function(login) {
      return cm.Item({label: login.hostname + '    ' + login.username, data: login.password});
    }),
    label: l10n.get('insertPasswordLabel'),
  });
}

function destroyInsertPasswordMenu() {
  if (insertPasswordMenu)
    insertPasswordMenu.destroy();
}

tabs.on('ready', function(tab) {
  if (/^about:pasa\??/.test(tab.url)) {
    let worker = tab.attach({contentScriptFile: self.data.url('generate.js')});

    let translations = {};
    [
      'pageTitle',
      'viewSaved',
      'passwordHeader',
      'passwordWarning',
      'clipboardCopy',
      'optionsHeader',
      'minisculeLabel',
      'majisculeLabel',
      'numbersLabel',
      'symbolsLabel',
      'lengthLabel',
      'generate',
      'rememberPasswords',
      'signIn',
      'syncPasswords',
    ]
    .forEach(function(id) {
      translations[id] = l10n.get(id);
    });

    worker.port.emit('init', {
      translations: translations,
      preferences: {
        'signon.rememberSignons': preferences.getBoolPref('signon.rememberSignons'),
        'services.sync.account': preferences.prefHasUserValue('services.sync.account'),
        'services.sync.engine.passwords': !preferences.prefHasUserValue('services.sync.engine.passwords'),
      }
    });

    worker.port.on('clipboardCopy', function(text) {
      clipboard.copyString(text);
    });

    worker.port.on('setPref', function(pref) {
      preferences.setBoolPref(pref, true);
    });

    worker.port.on('viewSavedPasswords', function() {
      tabs.open('chrome://passwordmgr/content/passwordManager.xul');
    });
  } else {
    createInsertPasswordMenu(tab.url);
  }
});

tabs.on('activate', function(tab) {
  createInsertPasswordMenu(tab.url);
});

tabs.on('deactivate', destroyInsertPasswordMenu);
