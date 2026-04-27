import * as a from './js/all.mjs'
import * as p from './js/prax.mjs'
import {CS, CS_ENUM, STORAGE, STORAGE_KEY, toggleConfig} from './shared.mjs'
import {E} from './util.mjs'

chrome.storage.onChanged.addListener(onStorageChange)

onStorage(await getConfs())

function onStorage(confs) {E(document.body, {chi: drawPage(confs)})}

async function onStorageChange(src) {onStorage(await getConfs())}

async function getConfs() {
  const data = await STORAGE.get()
  return a.laxArr(data?.[STORAGE_KEY])
}

function drawPage(confs) {
  confs = a.laxArr(confs)

  if (!confs.length) {
    return E.div({
      class: `pad-0x5 gap-ver-1`,
      style: {textAlign: `center`},
      chi: [
        E.h1(E.b`The NoJS rule list is empty`),
        E.div`Enable or disable JS on websites by clicking the extension button.`,
      ]
    })
  }

  return [
    E.table([
      E.thead(E.tr([
        E.td(E.h1`pattern`),
        E.td(E.h1`setting`),
        E.td(E.h1`action`),
      ])),
      E.tbody(confs.map(drawConf)),
    ]),
    E.div({
      class: `pad-0x5`,
      chi: E.button({
        type: `button`,
        onclick: clearStorage,
        chi: `remove all`,
      }),
    }),
  ]
}

function drawConf(conf) {
  return E.tr([
    E.td(E.code(conf.primaryPattern)),
    E.td([
      conf.setting,
      (
        conf.setting === CS_ENUM.BLOCK
        ? ` ❌`
        : conf.setting === CS_ENUM.ALLOW
        ? ` ✅`
        : undefined
      ),
    ]),
    E.td(E.button({
      type: `button`,
      onclick: a.bind(toggleConfig, conf),
      chi: `toggle`,
    })),
  ])
}

function clearStorage() {
  return Promise.all([
    CS.clear({}),
    STORAGE.remove(STORAGE_KEY),
  ])
}
