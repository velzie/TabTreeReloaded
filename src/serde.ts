import { toid } from "./injected/util";

export function serialize(target: Stateful<any>) {
  let serstack = {};
  let vpointercount = 0;

  let ser = (tgt: any) => {
    let obj = {
      stateful: vpointercount == 0 ? false : isStateful(tgt),
      values: {},
      id: toid(tgt)
    }
    let i = vpointercount++
    serstack[i] = obj

    for (let key in tgt) {
      let value = tgt[key]

      if (isDLPtr(value)) continue // i don"t think we should be serializing pointers?
      switch (typeof value) {
        case 'string':
        case 'number':
        case 'boolean':
        case 'undefined':
          obj.values[key] = JSON.stringify(value)
          break

        case 'object':
          if (value === null) {
            obj.values[key] = "null"
            break
          }
          if (value instanceof Array) {
            obj.values[key] = value.map((v) => {
              if (typeof v === 'object') {
                return ser(v)
              } else {
                return JSON.stringify(v)
              }
            })
            break
          } else {
            if (value.__proto__ === Object.prototype) {
              obj.values[key] = ser(value);
            } else if (value instanceof Text) {
              obj.values[key] = {
                type: "textnode",
                text: value.textContent,
                id: toid(value),
              }
            } else if (value instanceof Element) {
              obj.values[key] = {
                type: "element",
                tag: value.tagName,
                id: toid(value),
              }
            } else {
              obj.values[key] = {
                type: "class",
                constructor: value.constructor.name,
                id: toid(value)
              }
            }
          }
          break

        case 'symbol':
          obj.values[key] = {
            type: "symbol",
            description: value.description
          }
          break
        case 'function':
          obj.values[key] = {
            type: "function",
            name: value.name,
            id: toid(value)
          }
          break
        case 'bigint':
          obj.values[key] = {
            type: "bigint",
            value: value.toString()
          }
          break
      }
    }

    return i
  }
  ser(target)

  let string = JSON.stringify(serstack)
  return string;
}

export function deserialize(target: string) {
  let destack = JSON.parse(target)
  let objcache = {}

  let de = (i) => {
    if (objcache[i]) return objcache[i]
    let obj = destack[i]
    let tgt = {}
    for (let key in obj.values) {
      let value = obj.values[key]
      if (typeof value === 'string') {
        tgt[key] = JSON.parse(value)
      } else if (typeof value === 'number') {
        tgt[key] = de(value)
      } else if (value instanceof Array) {
        tgt[key] = value.map((v) => {
          if (typeof v === 'string') {
            return JSON.parse(v)
          } else {
            return de(v)
          }
        })
      } else {
        tgt[key] = value
      }
    }

    let newobj = obj.stateful ? $state(tgt) : tgt
    objcache[i] = newobj
    return newobj
  }

  return de(0)
}
