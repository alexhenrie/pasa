browser.browserAction.onClicked.addListener(() => {
  browser.tabs.create({url: browser.extension.getURL('generate.html')});
});
