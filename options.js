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

function gui({[STORAGE_KEY]: configs}) {
    if (!Array.isArray(configs)) configs = []

    if (!configs.length) {
        return (
            h('div', {className: 'padding-0x5 gaps-1-v', style: {textAlign: 'center'}},
                h('h1', null, h('b', null, 'The NoJS rule list is empty')),
                h('div', null, 'Whitelist or blacklist websites by clicking the extension button'))
        )
    }

    return (
        h('div', null,
            h('table', {className: 'cell-space-0x5'},
                h('thead', null,
                    h('tr', null,
                        h('td', null, h('h1', null, 'Pattern')),
                        h('td', null, h('h1', null, 'Setting')),
                        h('td', null, h('h1', null, 'Toggle')))),
                h('tbody', null, configs.map(config => (
                    h('tr', null,
                        h('td', null, h('code', null, config.primaryPattern)),
                        h('td', null, config.setting),
                        h('td', null,
                            h('button',
                                {
                                    type: 'button',
                                    className: 'btn',
                                    onclick: toggleConfig.bind(null, config),
                                },
                                'toggle'))))))),
            h('div', {className: 'padding-0x5'},
                h('button',
                    {type: 'button', className: 'btn', onclick: removeAllSettings},
                    'Remove All')))
    )
}

/**
 * Logic
 */

function onStorage(stored) {
    renderTo(document.body, gui(stored))
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
    await new Promise(done => CS.set(newConfig, done))
    await cacheConfig(newConfig)
}

async function cacheConfig(config) {
    let {[STORAGE_KEY]: configs} = await new Promise(done => STORAGE.get(STORAGE_KEY, done))
    if (!Array.isArray(configs)) configs = []

    const index = configs.findIndex(({primaryPattern}) => (
        primaryPattern === config.primaryPattern
    ))
    if (index === -1) configs.push(config)
    else configs[index] = config

    await new Promise(done => STORAGE.set({[STORAGE_KEY]: configs}, done))
}

/**
 * Utils
 */

function renderTo(node, child) {
    while (node.firstChild) node.firstChild.remove()
    if (child) node.appendChild(child)
}

function h() {return createElement(...arguments)}

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

/**
 * REPL
 */

self.log   = console.log.bind(console)
self.info  = console.info.bind(console)
self.debug = console.debug.bind(console)
self.warn  = console.warn.bind(console)
self.error = console.error.bind(console)
self.clear = console.clear.bind(console)
