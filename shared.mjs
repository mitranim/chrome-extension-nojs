export const CS      = chrome.contentSettings.javascript
export const CS_ENUM = chrome.contentSettings.JavascriptContentSetting

/*
This extension stores a list of domains for which we've toggled JS.
The storage is Chrome-managed and cloud-synced. We would prefer to
load all Chrome JS/no-JS settings instead, but Chrome does not let
extensions do that. The custom list is a partial solution.
*/
export const STORAGE = chrome.storage.local

/*
https://developer.chrome.com/docs/extensions/reference/api/contentSettings#type-ContentSetting

interface Config {
  primaryPattern: string
  setting: string
}
*/
export const STORAGE_KEY = `confs`

export async function toggleConfig({primaryPattern, setting}) {
  const conf = {
    primaryPattern,
    setting: setting === CS_ENUM.BLOCK ? CS_ENUM.ALLOW : CS_ENUM.BLOCK,
  }

  await Promise.all([
    CS.set(conf),            // Actual JS on/off setting.
    storeConfigUpdate(conf), // Our own storage for options UI.
  ])
}

async function storeConfigUpdate(conf) {
  const data = await STORAGE.get()
  const confs = onlyArr(data?.[STORAGE_KEY]) ?? []

  const ind = confs.findIndex(val => (
    val.primaryPattern === conf.primaryPattern
  ))

  if (ind >= 0) confs[ind] = conf
  else confs.push(conf)

  await STORAGE.set({[STORAGE_KEY]: confs})
}

function onlyArr(val) {return Array.isArray(val) ? val : undefined}
