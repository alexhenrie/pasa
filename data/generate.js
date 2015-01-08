/* warnings */

self.port.on('notifyPreferences', function(preferences) {
  if (!preferences['signon.rememberSignons']) {
    var div = document.createElement('div');
    div.className = 'alert alert-warning';
    div.textContent = 'Firefox does not currently ask to remember passwords. ';

    var a = document.createElement('a');
    a.href = '';
    a.textContent = 'Click here to fix that.';
    a.addEventListener('click', function() {
      self.port.emit('setPref', 'signon.rememberSignons');
    });

    div.appendChild(a);
    document.getElementById('warnings').appendChild(div);
  }

  if (!preferences['services.sync.account']) {
    var div = document.createElement('div');
    div.className = 'alert alert-warning';
    div.textContent = 'Your passwords saved in Firefox are not currently backed up via Firefox Sync because you are not currently signed in to Firefox Sync. ';

    var a = document.createElement('a');
    a.href = 'about:accounts';
    a.target = '_new';
    a.textContent = 'Sign in to Firefox Sync';

    div.appendChild(a);
    div.appendChild(document.createTextNode(' to back up your passwords automatically.'));
    document.getElementById('warnings').appendChild(div);
  }

  if (!preferences['services.sync.engine.passwords']) {
    var div = document.createElement('div');
    div.className = 'alert alert-warning';
    div.textContent = 'Your passwords saved in Firefox are not currently backed up via Firefox Sync because password sync is turned off. ';

    var a = document.createElement('a');
    a.href = '';
    a.textContent = 'Click here to fix that.';
    a.addEventListener('click', function() {
      self.port.emit('setPref', 'services.sync.engine.passwords');
    });

    div.appendChild(a);
    document.getElementById('warnings').appendChild(div);
  }
});


/* password generation */

var useDefaults = (location.href.indexOf('?') == -1);

var params = {};
function applyCheckboxParam(name) {
  if (useDefaults) {
    params[name] = document.getElementById(name).checked;
  } else {
    params[name] = location.href.indexOf(name + '=on') != -1;
    document.getElementById(name).checked = params[name] ? true : false;
  }
}
applyCheckboxParam('miniscule');
applyCheckboxParam('majiscule');
applyCheckboxParam('numbers');
applyCheckboxParam('symbols');

var minisculePool = 'abcdefghijklmnopqrstuvwxyz';
var majisculePool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
var numberPool = '0123456789';
var symbolPool = decodeURIComponent((/oksymbols=([^&]+)/g.exec(location.href) || ["", ""])[1]);

var charPool = '';
if (params['miniscule'])
  charPool += minisculePool;
if (params['majiscule'])
  charPool += majisculePool;
if (params['numbers'])
  charPool += numberPool;
if (params['symbols'])
  charPool += symbolPool;

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

document.getElementById('viewsaved').addEventListener('click', function() {
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
