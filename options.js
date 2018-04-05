'use strict'

const storage = chrome.storage.local



main()



function main() {
  storage.get('javascriptContentSettings', onStorage)
  chrome.storage.onChanged.addListener(onStorageChange)
}

function onStorage(stored) {
  renderTo(document.body, ui(stored))
}

function onStorageChange(changes) {
  if ('javascriptContentSettings' in changes) {
    onStorage(mapVals(changes, getNewValue))
  }
}




function ui({javascriptContentSettings = []}) {
  if (!javascriptContentSettings || !javascriptContentSettings.length) {
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
        E('tbody', null,
          javascriptContentSettings.map(setting => (
            E('tr', null,
              E('td', null, E('code', null, setting.primaryPattern)),
              E('td', null, setting.setting),
              E('td', null,
                E('button',
                  {
                    type: 'button',
                    className: 'btn',
                    onclick: toggleSetting.bind(null, setting),
                  },
                  'toggle'))))))),
      E('div', {className: 'padding-0x5'},
        E('button',
          {type: 'button', className: 'btn', onclick: removeAllSettings},
          'Remove All')))
  )
}





function removeAllSettings() {
  chrome.contentSettings.javascript.clear({}, () => {
    storage.remove('javascriptContentSettings')
  })
}

function toggleSetting({primaryPattern, setting}) {
  const {BLOCK, ALLOW} = chrome.contentSettings.JavascriptContentSetting

  const newSetting = setting === BLOCK ? ALLOW : BLOCK

  chrome.contentSettings.javascript.set({primaryPattern, setting: newSetting}, () => {
    storage.get('javascriptContentSettings', ({javascriptContentSettings}) => {
      if (!Array.isArray(javascriptContentSettings)) {
        javascriptContentSettings = []
      }

      const entry = javascriptContentSettings.find(setting => (
        setting.primaryPattern === primaryPattern
      ))

      if (entry) {
        entry.setting = newSetting
      }
      else {
        javascriptContentSettings.push({primaryPattern, setting})
      }

      storage.set({javascriptContentSettings})
    })
  })
}




function renderTo(node, child) {
  while (node.firstChild) node.firstChild.remove()
  if (child) node.appendChild(child)
}

function getNewValue({newValue}) {return newValue}



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

const booleanAttrs = [
  'aria-current',
  'aria-pressed',
  'autofocus',
  'checked',
  'disabled',
]

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

function slice() {
  return Array.prototype.slice.call.apply(Array.prototype.slice, arguments)
}

function mapVals(value, fun) {
  validate(fun, isFunction)
  const out = {}
  for (const key in value) out[key] = fun(value[key], key)
  return out
}


self.log   = console.log.bind(console)
self.info  = console.info.bind(console)
self.debug = console.debug.bind(console)
self.warn  = console.warn.bind(console)
self.error = console.error.bind(console)
self.clear = console.clear.bind(console)
