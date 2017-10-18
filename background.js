'use strict'

const storage = chrome.storage.local



main()



function main() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'goto-js-settings',
      title: 'Chrome JavaScript Settings',
      contexts: ['browser_action'],
    })
  })

  chrome.contextMenus.onClicked.addListener(onContextItemClick)

  chrome.browserAction.onClicked.addListener(onExtensionClick)
}



function onContextItemClick({menuItemId}) {
  if (menuItemId === 'goto-js-settings') {
    chrome.tabs.create({
      url: 'chrome://settings/content/javascript'
    })
  }
}


function onExtensionClick(tab) {
  const {url, id} = tab

  if (chromeRegex.test(url)) return

  const pattern = fileUrlRegex.test(url)
    ? url
    : getDomain(url) && `*://*.${getDomain(url)}/*`

  if (!pattern) return

  chrome.contentSettings.javascript.get({primaryUrl: url}, ({setting: value}) => {
    const {BLOCK, ALLOW} = chrome.contentSettings.JavascriptContentSetting
    const setting = {primaryPattern: pattern, setting: value === BLOCK ? ALLOW : BLOCK}
    chrome.contentSettings.javascript.set(setting, () => {
      storage.get('javascriptContentSettings', upsertSetting.bind(null, setting))
      chrome.tabs.reload(id)
    })
  })
}


function upsertSetting(setting, {javascriptContentSettings}) {
  if (!Array.isArray(javascriptContentSettings)) {
    javascriptContentSettings = []
  }

  const index = javascriptContentSettings.findIndex(({primaryPattern}) => (
    primaryPattern === setting.primaryPattern
  ))

  if (index !== -1) javascriptContentSettings[index] = setting
  else javascriptContentSettings.push(setting)

  storage.set({javascriptContentSettings})
}


function getDomain(url) {
  const match = url.match(domainExtractionRegex)
  return match && match[1]
}

const fileUrlRegex = /^file:/

const domainExtractionRegex = /^[A-z]+:\/\/\/?([^\s/?#:]+)/

const chromeRegex = /^chrome:/


// self.log   = console.log.bind(console)
// self.info  = console.info.bind(console)
// self.debug = console.debug.bind(console)
// self.warn  = console.warn.bind(console)
// self.error = console.error.bind(console)
// self.clear = console.clear.bind(console)
