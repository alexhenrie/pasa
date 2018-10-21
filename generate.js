/* common variables */

var defaultOptions = {
  miniscules: true,
  majiscules: true,
  numbers: true,
  lookalikes: false,
  symbols: false,
  oksymbols: '@#$%&-+*!?/.',
  length: 10,
};

var warnings = document.getElementById('warnings');
var invisiblePassword = document.getElementById('invisiblePassword')
var visiblePassword = document.getElementById('visiblePassword')
var clipboardCopy1 = document.getElementById('clipboardCopy1')
var clipboardCopy2 = document.getElementById('clipboardCopy2')
var reset = document.getElementById('reset');
var miniscules = document.getElementById('miniscules');
var majiscules = document.getElementById('majiscules');
var numbers = document.getElementById('numbers');
var symbols = document.getElementById('symbols');
var oksymbols = document.getElementById('oksymbols');
var generate1 = document.getElementById('generate1');
var generate2 = document.getElementById('generate2');


/* common functions */

function passwordToClipboard() {
  invisiblePassword.value = visiblePassword.textContent;
  invisiblePassword.select();
  document.execCommand('copy');
}

function optionsToForm(options)
{
  Object.keys(options).forEach((name) => {
    var el = document.getElementById(name);
    if (!el) return;
    switch (typeof(options[name]))
    {
      case 'boolean':
        el.checked = options[name];
        break;
      case 'string':
      case 'number':
        el.value = options[name];
        break;
    }
  });
}

function resetToDefaults() {
  optionsToForm(defaultOptions);
  generate1.disabled = false;
  generate2.disabled = false;
}

function generatePassword() {
  var options;
  var charPool;
  var minisculePool = 'abcdefghijklmnopqrstuvwxyz';
  var majisculePool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var numberPool = '0123456789';
  var symbolPool;

  for (;;) {
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
      charPool = charPool.replace(/[Il1O0]/g, "");
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

  visiblePassword.textContent = password;
  passwordToClipboard();

  browser.storage.local.set(options);

  //flashy animation for visual feedback
  for (var i = 0; i < options.length; i++) {
    setTimeout((i) => {
      document.getElementById('styleblock').textContent = '#dots::before{content:"' + new Array(i + 2).join('●') + '"}';
    }, (500 / options.length) * (i + 1), i);
  }
}


/* UI setup and form validation */

function validateForm() {
  var inputIsInvalid = !miniscules.checked && !majiscules.checked && !numbers.checked && (!symbols.checked || !oksymbols.value);
  generate1.disabled = inputIsInvalid;
  generate2.disabled = inputIsInvalid;
}

clipboardCopy1.addEventListener('click', passwordToClipboard);
clipboardCopy2.addEventListener('click', passwordToClipboard);

reset.addEventListener('click', resetToDefaults);

miniscules.addEventListener('click', validateForm);
majiscules.addEventListener('click', validateForm);
numbers.addEventListener('click', validateForm);
symbols.addEventListener('click', validateForm);
oksymbols.addEventListener('input', validateForm);

oksymbols.addEventListener('input', () => {
  symbols.checked = true;
});

generate1.addEventListener('click', generatePassword);
generate2.addEventListener('click', generatePassword);


/* localization */

document.title = browser.i18n.getMessage('pageTitle');

[
  'passwordHeader',
  'passwordWarning',
  'optionsHeader',
  'reset',
  'minisculesLabel',
  'majisculesLabel',
  'numbersLabel',
  'lookalikesLabel',
  'symbolsLabel',
  'lengthLabel',
].forEach((id) => {
  document.getElementById(id).appendChild(document.createRange().createContextualFragment(browser.i18n.getMessage(id)));
});

clipboardCopy1.textContent = browser.i18n.getMessage('clipboardCopy');
clipboardCopy2.textContent = browser.i18n.getMessage('clipboardCopy');

generate1.textContent = browser.i18n.getMessage('generate');
generate2.textContent = browser.i18n.getMessage('generate');


/* warnings */

browser.privacy.services.passwordSavingEnabled.get({}).then((passwordSavingEnabled) => {
  if (!passwordSavingEnabled.value) {
    var rememberPasswords = document.createElement('div');
    rememberPasswords.className = 'alert alert-warning';
    rememberPasswords.appendChild(
      document.createRange().createContextualFragment(browser.i18n.getMessage('rememberPasswords'))
    )
    warnings.appendChild(rememberPasswords);

    document.getElementById('enableRememberPasswords').addEventListener('click', () => {
      browser.privacy.services.passwordSavingEnabled.set({value: true});
      warnings.removeChild(rememberPasswords);
    });
  }
});


/* get options and show the finished page  */

browser.storage.local.get(Object.keys(defaultOptions)).then((userOptions) => {
  optionsToForm(Object.assign({}, defaultOptions, userOptions));
  document.body.style = '';
  generatePassword();
});
