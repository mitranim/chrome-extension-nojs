import * as a from './js/all.mjs'
import * as p from './js/prax.mjs'

// TODO: drop when the library supports this out of the box.
export const E = new Proxy(p.Ren.main.E, {
  get(fun, key) {return draw.bind(fun, key)},

  apply(fun, self, [tar, src]) {
    if (a.isDict(src)) return fun(tar, src)
    return fun(tar, {chi: src})
  },
})

function draw(tar, src) {
  if (a.isDict(src)) return this(tar, src)
  return this(tar, {chi: src})
}
