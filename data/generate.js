/* initial setup */

self.port.on('init', function(init) {
  /* localization */

  document.title = init.translations.pageTitle;

  Object.keys(init.translations).forEach(function(id)
  {
    var element = document.getElementById(id);
    if (element)
      element.appendChild(document.createRange().createContextualFragment(init.translations[id]));
  });

  document.getElementById('clipboardCopy1').textContent = init.translations.clipboardCopy;
  document.getElementById('clipboardCopy2').textContent = init.translations.clipboardCopy;

  document.getElementById('generate1').value = init.translations.generate;
  document.getElementById('generate2').textContent = init.translations.generate;

  /* warnings */

  var warnings = document.getElementById('warnings');

  if (!init.preferences['signon.rememberSignons']) {
    var rememberPasswords = document.createElement('div');
    rememberPasswords.className = 'alert alert-warning';
    rememberPasswords.appendChild(document.createRange().createContextualFragment(init.translations.rememberPasswords));
    warnings.appendChild(rememberPasswords);

    document.getElementById('enableRememberPasswords').addEventListener('click', function() {
      self.port.emit('setPref', 'signon.rememberSignons');
      warnings.removeChild(rememberPasswords);
    });
  }

  if (!init.preferences['services.sync.account']) {
    var signIn = document.createElement('div');
    signIn.className = 'alert alert-warning';
    signIn.appendChild(document.createRange().createContextualFragment(init.translations.signIn));
    warnings.appendChild(signIn);
  }

  if (!init.preferences['services.sync.engine.passwords']) {
    var syncPasswords = document.createElement('div');
    syncPasswords.className = 'alert alert-warning';
    syncPasswords.appendChild(document.createRange().createContextualFragment(init.translations.syncPasswords));
    warnings.appendChild(syncPasswords);

    document.getElementById('enablePasswordSync').addEventListener('click', function() {
      self.port.emit('setPref', 'services.sync.engine.passwords');
      warnings.removeChild(syncPasswords);
    });
  }

  /* show the finished page */

  document.body.style = '';
});


/* password generation */

var useDefaults = (location.href.indexOf('?') == -1);
var params;
var charPool;
var minisculePool = 'abcdefghijklmnopqrstuvwxyz';
var majisculePool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
var numberPool = '0123456789';
var symbolPool;

function populateCharPool() {
  params = {};
  function applyCheckboxParam(name) {
    if (useDefaults) {
      params[name] = document.getElementById(name).hasAttribute('checked');
    } else {
      params[name] = location.href.indexOf(name + '=on') != -1;
    }
    document.getElementById(name).checked = params[name] ? true : false;
  }
  applyCheckboxParam('miniscule');
  applyCheckboxParam('majiscule');
  applyCheckboxParam('numbers');
  applyCheckboxParam('symbols');

  symbolPool = decodeURIComponent((/oksymbols=([^&]+)/g.exec(location.href) || ["", ""])[1]);

  charPool = '';
  if (params['miniscule'])
    charPool += minisculePool;
  if (params['majiscule'])
    charPool += majisculePool;
  if (params['numbers'])
    charPool += numberPool;
  if (params['symbols'])
    charPool += symbolPool;
}

populateCharPool();

//if the input was screwy, revert to defaults
if (!charPool) {
  useDefaults = true;
  document.getElementById('generate1').disabled = false;
  document.getElementById('generate2').disabled = false;
  populateCharPool();
}

if (symbolPool)
  document.getElementById('oksymbols').value = symbolPool;

var length = (/length=([^&]+)/g.exec(location.href) || ['', ''])[1];
if (length)
    document.getElementById('length').value = length;
length = document.getElementById('length').value;

var password;
do {
  password = '';
  for (var i = 0; i < length; i++)
    password += charPool[Math.floor(Math.random() * charPool.length)];
} while ((params['miniscule'] && !(new RegExp('[' + minisculePool + ']', 'g')).exec(password)) ||
         (params['majiscule'] && !(new RegExp('[' + majisculePool + ']', 'g')).exec(password)) ||
         (params['numbers'] && !(new RegExp('[' + numberPool + ']', 'g')).exec(password)) ||
         (params['symbols'] && symbolPool && !(new RegExp('[' + symbolPool.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1') + ']', 'g')).exec(password)))

document.getElementById('password').textContent = password;
self.port.emit('clipboardCopy', password);

//flashy animation for visual feedback
for (var i = 0; i < length; i++) {
  setTimeout(function(i) {
    document.getElementById('styleblock').textContent = '#dots:before{content:"' + new Array(i + 2).join('●') + '"}';
  }, (500 / length) * (i + 1), i);
}


/* UI setup and form validation */

document.getElementById('viewSaved').addEventListener('click', function() {
  self.port.emit('viewSavedPasswords');
});

function passwordToClipboard() {
  self.port.emit('clipboardCopy', document.getElementById('password').textContent);
}

document.getElementById('clipboardCopy1').addEventListener('click', passwordToClipboard);
document.getElementById('clipboardCopy2').addEventListener('click', passwordToClipboard);

var miniscule = document.getElementById('miniscule');
var majiscule = document.getElementById('majiscule');
var numbers = document.getElementById('numbers');
var symbols = document.getElementById('symbols');
var oksymbols = document.getElementById('oksymbols');

function validateForm() {
  var inputIsInvalid = !miniscule.checked && !majiscule.checked && !numbers.checked && (!symbols.checked || !oksymbols.value);
  document.getElementById('generate1').disabled = inputIsInvalid;
  document.getElementById('generate2').disabled = inputIsInvalid;
}

miniscule.addEventListener('click', validateForm);
majiscule.addEventListener('click', validateForm);
numbers.addEventListener('click', validateForm);
symbols.addEventListener('click', validateForm);
oksymbols.addEventListener('input', validateForm);
