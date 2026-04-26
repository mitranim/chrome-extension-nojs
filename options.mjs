import * as a from './js/all.mjs'
import * as p from './js/prax.mjs'
import {CS, STORAGE, STORAGE_KEY, toggleConfig} from './shared.mjs'

const {E} = p.Ren.main

onStorage(await getConfs())

chrome.storage.onChanged.addListener(onStorageChange)

async function getConfs() {
  const data = (await STORAGE.get(STORAGE_KEY))
  return data?.[STORAGE_KEY]
}

async function onStorage(confs) {E(document.body, {chi: Main(confs)})}

async function onStorageChange(src) {onStorage(await getConfs())}

function Main(confs) {
  confs = a.laxArr(confs)

  if (!confs.length) {
    return E(`div`, {
      class: `pad-0x5 gap-ver-1`,
      style: {textAlign: `center`},
      chi: [
        E(`h1`, {chi: E(`b`, {chi: `The NoJS rule list is empty`})}),
        E(`div`, {chi: `Enable or disable JS on websites by clicking the extension button.`}),
      ],
    })
  }

  return [
    E(`table`, {
      chi: [
        E(`thead`, {
          chi: E(`tr`, {
            chi: [
              E(`td`, {chi: E(`h1`, {chi: `pattern`})}),
              E(`td`, {chi: E(`h1`, {chi: `setting`})}),
              E(`td`, {chi: E(`h1`, {chi: `toggle`})}),
            ],
          }),
        }),
        E(`tbody`, {chi: confs.map(Conf)}),
      ],
    }),
    E(`div`, {
      class: `pad-0x5`,
      chi: E(`button`, {
        type: `button`,
        class: `btn`,
        onclick: clearStorage,
        chi: `Remove All`,
      }),
    }),
  ]
}

function Conf(conf) {
  return E(`tr`, {
    chi: [
      E(`td`, {chi: E(`code`, {chi: conf.primaryPattern})}),
      E(`td`, {chi: conf.setting}),
      E(`td`, {
        chi: E(`button`, {
          type: `button`,
          class: `btn`,
          onclick: a.bind(toggleConfig, conf),
          chi: `toggle`,
        }),
      }),
    ],
  })
}

async function clearStorage() {
  await Promise.all([
    CS.clear({}),
    STORAGE.remove(STORAGE_KEY),
  ])
}
