/* utility functions */

var defaultAddonPrefs;

function generatePassword()
{
  var options;
  var charPool;
  var minisculePool = 'abcdefghijklmnopqrstuvwxyz';
  var majisculePool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var numberPool = '0123456789';
  var symbolPool;

  for (;;)
  {
    options = {
      miniscules: document.getElementById('miniscules').checked,
      majiscules: document.getElementById('majiscules').checked,
      numbers: document.getElementById('numbers').checked,
      lookalikes: document.getElementById('lookalikes').checked,
      symbols: document.getElementById('symbols').checked,
      oksymbols: document.getElementById('oksymbols').value,
      length: Number(document.getElementById('length').value),
    };
    symbolPool = options.oksymbols;

    charPool = '';
    if (options.miniscules)
      charPool += minisculePool;
    if (options.majiscules)
      charPool += majisculePool;
    if (options.numbers)
      charPool += numberPool;
    if (!options.lookalikes)
      charPool = charPool.replace(/[iI1oO0]/g, "");
    if (options.symbols)
      charPool += symbolPool;

    if (charPool)
      break;

    //if the input was screwy, revert to defaults and do it again
    resetToDefaults();
  }

  var password;
  do {
    password = '';
    for (var i = 0; i < options.length; i++)
      password += charPool[Math.floor(Math.random() * charPool.length)];
  } while ((options.miniscules && !(new RegExp('[' + minisculePool + ']', 'g')).exec(password)) ||
           (options.majiscules && !(new RegExp('[' + majisculePool + ']', 'g')).exec(password)) ||
           (options.numbers && !(new RegExp('[' + numberPool + ']', 'g')).exec(password)) ||
           (options.symbols && symbolPool && !(new RegExp('[' + symbolPool.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1') + ']', 'g')).exec(password)))

  document.getElementById('password').textContent = password;
  self.port.emit('clipboardCopy', password);

  Object.keys(options).forEach(function(name) {
    self.port.emit('setAddonPref', name, options[name]);
  });

  //flashy animation for visual feedback
  for (var i = 0; i < options.length; i++) {
    setTimeout(function(i) {
      document.getElementById('styleblock').textContent = '#dots:before{content:"' + new Array(i + 2).join('●') + '"}';
    }, (500 / options.length) * (i + 1), i);
  }
}

function optionsToForm(options)
{
  Object.keys(options).forEach(function(name) {
    switch (typeof(options[name]))
    {
      case 'boolean':
        document.getElementById(name).checked = options[name];
        break;
      case 'string':
      case 'number':
        document.getElementById(name).value = options[name];
        break;
    }
  });
}

function resetToDefaults()
{
  optionsToForm(defaultAddonPrefs);
  document.getElementById('generate1').disabled = false;
  document.getElementById('generate2').disabled = false;
}


/* UI setup and form validation */

document.getElementById('viewSaved').addEventListener('click', function() {
  self.port.emit('viewSavedPasswords');
});

document.getElementById('resetButton').addEventListener('click', resetToDefaults);

function passwordToClipboard() {
  self.port.emit('clipboardCopy', document.getElementById('password').textContent);
}

document.getElementById('clipboardCopy1').addEventListener('click', passwordToClipboard);
document.getElementById('clipboardCopy2').addEventListener('click', passwordToClipboard);

var miniscules = document.getElementById('miniscules');
var majiscules = document.getElementById('majiscules');
var numbers = document.getElementById('numbers');
var symbols = document.getElementById('symbols');
var oksymbols = document.getElementById('oksymbols');
var generate1 = document.getElementById('generate1');
var generate2 = document.getElementById('generate2');

generate1.addEventListener('click', generatePassword);
generate2.addEventListener('click', generatePassword);

function validateForm() {
  var inputIsInvalid = !miniscules.checked && !majiscules.checked && !numbers.checked && (!symbols.checked || !oksymbols.value);
  generate1.disabled = inputIsInvalid;
  generate2.disabled = inputIsInvalid;
}

miniscules.addEventListener('click', validateForm);
majiscules.addEventListener('click', validateForm);
numbers.addEventListener('click', validateForm);
symbols.addEventListener('click', validateForm);
oksymbols.addEventListener('input', validateForm);


/* final setup */

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

  if (!init.browserPrefs['signon.rememberSignons']) {
    var rememberPasswords = document.createElement('div');
    rememberPasswords.className = 'alert alert-warning';
    rememberPasswords.appendChild(document.createRange().createContextualFragment(init.translations.rememberPasswords));
    warnings.appendChild(rememberPasswords);

    document.getElementById('enableRememberPasswords').addEventListener('click', function() {
      self.port.emit('setBrowserPref', 'signon.rememberSignons');
      warnings.removeChild(rememberPasswords);
    });
  }

  if (!init.browserPrefs['services.sync.account']) {
    var signIn = document.createElement('div');
    signIn.className = 'alert alert-warning';
    signIn.appendChild(document.createRange().createContextualFragment(init.translations.signIn));
    warnings.appendChild(signIn);
  }

  if (!init.browserPrefs['services.sync.engine.passwords']) {
    var syncPasswords = document.createElement('div');
    syncPasswords.className = 'alert alert-warning';
    syncPasswords.appendChild(document.createRange().createContextualFragment(init.translations.syncPasswords));
    warnings.appendChild(syncPasswords);

    document.getElementById('enablePasswordSync').addEventListener('click', function() {
      self.port.emit('setBrowserPref', 'services.sync.engine.passwords');
      warnings.removeChild(syncPasswords);
    });
  }

  /* options */

  optionsToForm(init.addonPrefs);
  defaultAddonPrefs = init.defaultAddonPrefs;

  /* show the finished page */

  document.body.style = '';
  generatePassword();
});
