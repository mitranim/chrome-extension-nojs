'use strict'

// Storage for per-domain JS configs.
const CS = chrome.contentSettings.javascript
const CS_ENUM = chrome.contentSettings.JavascriptContentSetting

// We cache known pattens and their configs because we can't query
// `chrome.contentSettings.javascript` for ALL of them.
const STORAGE = chrome.storage.local
const STORAGE_KEY = 'javascriptContentSettings'

/**
 * Init
 */

chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
        id: 'goto-js-settings',
        title: 'Chrome JavaScript Settings',
        contexts: ['browser_action'],
    })
})

chrome.contextMenus.onClicked.addListener(onContextItemClick)

chrome.browserAction.onClicked.addListener(onExtensionClick)

/**
 * Logic
 */

function onContextItemClick({menuItemId}) {
    if (menuItemId === 'goto-js-settings') {
        chrome.tabs.create({
            url: 'chrome://settings/content/javascript'
        })
    }
}

async function onExtensionClick(tab) {
    const {url, id} = tab

    const pattern = chromeRegex.test(url)
        ? null
        : fileRegex.test(url)
        ? url
        : url.match(ipRegex)
        ? `*://${url.match(ipRegex)[1]}/*`
        : url.match(dnsRegex)
        ? `*://*.${url.match(dnsRegex)[1]}/*`
        : null

    if (!pattern) return

    const config = await toggleConfig(url, pattern)
    chrome.tabs.reload(id)
    cacheConfig(config)
}

async function toggleConfig(url, pattern) {
    const config = await invoke(CS.get, {primaryUrl: url})
    const isEnabled = config.setting === CS_ENUM.ALLOW
    const newConfig = {primaryPattern: pattern, setting: isEnabled ? CS_ENUM.BLOCK : CS_ENUM.ALLOW}
    await invoke(CS.set, newConfig)
    return newConfig
}

async function cacheConfig(config) {
    let {[STORAGE_KEY]: configs} = await invoke(STORAGE.get, STORAGE_KEY)
    if (!Array.isArray(configs)) configs = []

    const index = configs.findIndex(({primaryPattern}) => (
        primaryPattern === config.primaryPattern
    ))
    if (index === -1) configs.push(config)
    else configs[index] = config

    await invoke(STORAGE.set, {[STORAGE_KEY]: configs})
}

/**
 * Utils
 */

const chromeRegex = /^chrome:/
const fileRegex = /^file:/
const ipRegex = /^[A-z]+:\/\/\/?(\d+.\d+.\d+.\d+)[\s/?#:]/
const dnsRegex = /^[A-z]+:\/\/\/?([^\s/?#:]+)/

function invoke(fun, ...args) {
    return new Promise(resolve => {fun(...args, resolve)})
}

/**
 * REPL
 */

self.log   = console.log.bind(console)
self.info  = console.info.bind(console)
self.debug = console.debug.bind(console)
self.warn  = console.warn.bind(console)
self.error = console.error.bind(console)
self.clear = console.clear.bind(console)
