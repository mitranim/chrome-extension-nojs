import {CS, toggleConfig} from './shared.mjs'

const MENU_ID   = `nojs_chrome_js_settings`
const RE_CHROME = /^chrome:/
const RE_FILE   = /^file:/
const RE_IP     = /^[A-z]+:\/\/\/?(\d+.\d+.\d+.\d+)[\s/?#:]/
const RE_DNS    = /^[A-z]+:\/\/\/?([^\s/?#:]+)/

chrome.runtime.onInstalled.addListener(onInstall)
chrome.contextMenus.onClicked.addListener(onContextItemClick)
chrome.action.onClicked.addListener(onExtensionClick)
chrome.commands.onCommand.addListener(onCommand)

function onInstall() {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: `Chrome JS settings`,
    contexts: [`action`], // RMB on extension icon in toolbar.
  })
}

function onContextItemClick({menuItemId}) {
  if (menuItemId === MENU_ID) {
    chrome.tabs.create({url: `chrome://settings/content/javascript`})
  }
}

async function onCommand(name) {
  if (name !== `nojs_toggle`) return
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  })
  await onExtensionClick(tab)
}

async function onExtensionClick(tab) {
  const {url, id} = tab
  if (RE_CHROME.test(url)) return

  const pattern = urlPattern(url)
  if (!pattern) return

  await Promise.all([
    chrome.tabs.reload(id),
    toggleConfig({
      primaryPattern: pattern,
      ...await CS.get({primaryUrl: url})
    }),
  ])
}

function urlPattern(url) {
  if (RE_FILE.test(url)) return url

  let mat = url.match(RE_IP)
  if (mat) return `*://${mat[1]}/*`

  mat = url.match(RE_DNS)
  if (mat) return `*://*.${mat[1]}/*`

  return undefined
}
