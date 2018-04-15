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

STORAGE.get(STORAGE_KEY, onStorage)

chrome.storage.onChanged.addListener(onStorageChange)

/**
 * UI
 */

function ui({[STORAGE_KEY]: configs}) {
  if (!Array.isArray(configs)) configs = []

  if (!configs.length) {
    return (
      E('div', {className: 'padding-0x5 gaps-1-v', style: {textAlign: 'center'}},
        E('h1', null, E('b', null, 'The NoJS rule list is empty')),
        E('div', null, 'Whitelist or blacklist websites by clicking the extension button'))
    )
  }

  return (
    E('div', null,
      E('table', {className: 'cell-space-0x5'},
        E('thead', null,
          E('tr', null,
            E('td', null, E('h1', null, 'Pattern')),
            E('td', null, E('h1', null, 'Setting')),
            E('td', null, E('h1', null, 'Toggle')))),
        E('tbody', null, configs.map(config => (
          E('tr', null,
            E('td', null, E('code', null, config.primaryPattern)),
            E('td', null, config.setting),
            E('td', null,
              E('button',
                {
                  type: 'button',
                  className: 'btn',
                  onclick: toggleConfig.bind(null, config),
                },
                'toggle'))))))),
      E('div', {className: 'padding-0x5'},
        E('button',
          {type: 'button', className: 'btn', onclick: removeAllSettings},
          'Remove All')))
  )
}

/**
 * Logic
 */

function onStorage(stored) {
  renderTo(document.body, ui(stored))
}

function onStorageChange(changes) {
  if (STORAGE_KEY in changes) onStorage(mapVals(changes, getNewValue))
}

function getNewValue({newValue}) {return newValue}

function removeAllSettings() {
  CS.clear()
  STORAGE.remove(STORAGE_KEY)
}

async function toggleConfig(oldConfig) {
  const isEnabled = oldConfig.setting === CS_ENUM.ALLOW
  const newConfig = {
    primaryPattern: oldConfig.primaryPattern,
    setting: isEnabled ? CS_ENUM.BLOCK : CS_ENUM.ALLOW,
  }
  await invoke(CS.set, newConfig)
  await cacheConfig(newConfig)
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

function renderTo(node, child) {
  while (node.firstChild) node.firstChild.remove()
  if (child) node.appendChild(child)
}

function E() {return createElement(...arguments)}

function createElement(type, props) {
  if (!isString(type) && !isFunction(type)) {
    throw TypeError(`Element type must be a string or a function, got: ${type}`)
  }
  if (props != null) validate(props, isDict)
  const children = toFlatNodeList(slice(arguments, 2))
  if (isFunction(type)) return type(patch(props, {children}))
  const elem = document.createElement(type)
  setProps(elem, props)
  for (let i = -1; ++i < children.length;) elem.appendChild(children[i])
  return elem
}

function toFlatNodeList(list) {
  return list.reduce(concatNodes, [])
}

function concatNodes(list, value) {
  return list.concat(isArray(value) ? toFlatNodeList(value) : toNode(value))
}

function setProps(elem, props) {
  for (const name in props) {
    const value = props[name]
    if (name === 'style') {
      Object.assign(elem.style, value)
    }
    else if (isBooleanAttr(name)) {
      if (value) elem.setAttribute(name, '')
    }
    else if (/^on[A-z]/.test(name)) {
      const eventName = name.slice(2)
      elem.addEventListener(eventName, value)
    }
    else {
      elem[name] = value
    }
  }
}

function isBooleanAttr(value) {
  return (
    value === 'aria-current' ||
    value === 'aria-pressed' ||
    value === 'autofocus' ||
    value === 'checked' ||
    value === 'disabled'
  )
}

function toNode(value) {
  return isInstance(value, Node)
    ? value
    : !isComplex(value) && value != null
    ? new Text(value)
    : new Comment(value)
}

function isString(value) {
  return typeof value === 'string'
}

function isFunction(value) {
  return typeof value === 'function'
}

function isDict(value) {
  return isObject(value) && isPlainPrototype(Object.getPrototypeOf(value))
}

function isPlainPrototype(value) {
  return value === null || value === Object.prototype
}

function isArray(value) {
  return isInstance(value, Array)
}

function isComplex(value) {
  return isObject(value) || isFunction(value)
}

function isObject(value) {
  return value !== null && typeof value === 'object'
}

function isInstance(value, Class) {
  return isComplex(value) && value instanceof Class
}

function validate(value, test) {
  if (!test(value)) throw Error(`Expected ${show(value)} to satisfy test ${show(test)}`)
}

function show(value) {
  return (
    isFunction(value) && value.name
    ? value.name
    : isArray(value) || isDict(value)
    ? JSON.stringify(value)
    : String(value)
  )
}

function slice() {
  return Array.prototype.slice.call.apply(Array.prototype.slice, arguments)
}

function mapVals(value, fun) {
  validate(fun, isFunction)
  const out = {}
  for (const key in value) out[key] = fun(value[key], key)
  return out
}

function patch() {
  const out = Object.assign({}, ...arguments)
  for (const key in out) if (out[key] == null) delete out[key]
  return out
}

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
