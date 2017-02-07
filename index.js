const addonPrefDefinitions = require('./package.json').preferences;
const addonPrefs = require('sdk/simple-prefs').prefs;
const browserPrefs = require('sdk/preferences/service');
const buttons = require('sdk/ui/button/action');
const cm = require('sdk/context-menu');
const clipboard = require('sdk/clipboard');
const l10n = require('sdk/l10n');
const mod = require('sdk/content/mod');
const passwords = require('sdk/passwords');
const self = require('sdk/self');
const style = require('sdk/stylesheet/style');
const tabs = require('sdk/tabs');
const urls = require('sdk/url');
const uuid = require('sdk/util/uuid');

const {Cc, Ci, Cm, Cu, components} = require('chrome');
const componentRegistrar = Cm.QueryInterface(Ci.nsIComponentRegistrar);

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

  url = urls.URL(url);
  if (!url.hostname) return; //about: URIs don't have "hostnames"

  var domains = url.hostname.split('.');

  passwords.search({
    onComplete: function(logins) {
      insertPasswordMenu = cm.Menu({
        contentScript:
          'self.on("click", function(node, data) { \
            node.value = data; \
          });',
        context: cm.SelectorContext('input[type=password]'),
        image: self.data.url('icon-16.png'),
        items: logins.filter(function(login) {
          var loginHostname;
          try {
            loginHostname = urls.URL(login.url).hostname;
          } catch (e) {
            return false;
          }
          switch (domains.length) {
            case 1:
              //hostnames must match exactly
              return (loginHostname == url.hostname);
            case 2:
              //top-level domains must match (e.g. foo.pepsi and bar.pepsi)
              return loginHostname.endsWith('.' + domains[domains.length - 1]);
            default:
              //second-to-last domains must match (e.g. www.amazon.com and www.amazon.ca)
              return (loginHostname.split('.').slice(-2)[0] == domains[domains.length - 2]);
          }
        }).map(function(login) {
          return cm.Item({label: login.url + '    ' + login.username, data: login.password});
        }).sort(function(a, b) {
          //exact prefix+hostname matches float to the top of the list
          if (a.label.startsWith(url.origin) && !b.label.startsWith(url.origin))
            return -1;
          if (!a.label.startsWith(url.origin) && b.label.startsWith(url.origin))
            return 1;

          //otherwise just sort alphabetically
          if (a < b)
            return -1;
          if (a > b)
            return 1;
          return 0;
        }),
        label: l10n.get('insertPasswordLabel'),
      });
    },
  });
}

function destroyInsertPasswordMenu() {
  if (insertPasswordMenu)
    insertPasswordMenu.destroy();
}

tabs.on('ready', function(tab) {
  if (/^about:pasa\??/.test(tab.url)) {
    mod.attach(style.Style({uri: './bootstrap.min.css'}), tab);
    mod.attach(style.Style({uri: './generate.css'}), tab);

    let worker = tab.attach({contentScriptFile: './generate.js'});

    let translations = {};
    [
      'pageTitle',
      'viewSaved',
      'passwordHeader',
      'passwordWarning',
      'clipboardCopy',
      'optionsHeader',
      'resetButton',
      'minisculesLabel',
      'majisculesLabel',
      'numbersLabel',
      'lookalikesLabel',
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

    let defaultAddonPrefs = {};
    addonPrefDefinitions.forEach(function(prefDefinition) {
      defaultAddonPrefs[prefDefinition['name']] = prefDefinition['value'];
    });

    worker.port.emit('init', {
      addonPrefs: addonPrefs,
      browserPrefs: {
        'signon.rememberSignons': browserPrefs.get('signon.rememberSignons'),
        'services.sync.account': browserPrefs.isSet('services.sync.account'),
        'services.sync.engine.passwords': !browserPrefs.isSet('services.sync.engine.passwords'),
      },
      defaultAddonPrefs: defaultAddonPrefs,
      translations: translations,
    });

    worker.port.on('clipboardCopy', function(text) {
      clipboard.set(text, 'text');
    });

    worker.port.on('setAddonPref', function(name, value) {
      addonPrefs[name] = value;
    });

    worker.port.on('setBrowserPref', function(pref) {
      browserPrefs.set(pref, true);
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

//create save password menu
cm.Menu({
  context: cm.SelectorContext('input[type=password]'),
  image: self.data.url('icon-16.png'),
  items: [
    cm.Item({
      contentScript:
        'self.on("context", function(node) { \
          if (!node.value) \
            return false; \
          \
          var inputElements = document.getElementsByTagName("input"); \
          var usernameElement; \
          for (var i = 0; inputElements[i] != node; i++) { \
            if (inputElements[i].type == "text") \
              usernameElement = inputElements[i]; \
          } \
          \
          var username; \
          var usernameField; \
          if (usernameElement) { \
            username = usernameElement.value || " "; \
            usernameField = usernameElement.name; \
          } else { \
            username = " "; \
            usernameField = ""; \
          } \
          \
          this.loginInfo = { \
            prefixAndHostname: node.ownerDocument.location.origin, \
            username: username, \
            usernameField: usernameField, \
            password: node.value, \
            passwordField: node.name, \
          }; \
          \
          /* initialize the label */ \
          self.postMessage(this.loginInfo.prefixAndHostname + "    " + this.loginInfo.username); \
          \
          return true; \
        }); \
        self.on("click", function() { \
          /* save the password */ \
          self.postMessage(this.loginInfo); \
        });',
      label: ' ',
      onMessage: function(message) {
        if (message.prefixAndHostname) { //I would use message instanceof Object, but it's always false
          //save the password
          passwords.store({
            url: message.prefixAndHostname,
            formSubmitURL: message.prefixAndHostname,
            username: message.username,
            password: message.password,
            usernameField: message.usernameField,
            passwordField: message.passwordField,
          });
          //update the insert password menu
          createInsertPasswordMenu(message.prefixAndHostname);
        } else {
          //initialize the label
          this.label = message;
        }
      },
    }),
  ],
  label: l10n.get('savePasswordLabel'),
});
