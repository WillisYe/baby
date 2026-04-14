// 此文件更改后不会自动生效，需重新运行npm run unocss
import { defineConfig, presetUno, toEscapedSelector, presetIcons } from 'unocss'

// 支持bd-1px-solid-#DDDDDD，border-width默认px为单位，border-style可用首字母简写，border-color可省略#
// 支持bdl-,bdr-,bdt-,bdb-,bdx-,bdy-;bd需放在最后，否则都会匹配到bd
function getValBorder (arr) {
  var result = arr.join(' ')
  if (arr.length == 3) {
      var [width, style, color] = arr
      if (/^\d+$/.test(width)) {
          width = width + 'px'
      }
      var styles = 'none|hidden|dashed|dotted|solid|double|groove|ridge|inset|outset|initial|inherit'.split('|')
      if (!styles.includes(style)) {
          style = styles.find(item => item.startsWith(style)) || style
      }
      if (!color.startsWith('#')) {
          if (/^([0-9a-fA-F]{3}){1,2}$/.test(color)) {
              color = '#' + color
          }
      }
      result = `${width} ${style} ${color}`
  }
  return result
}

function getValBorders (selector) {
  var arr = selector.split('-')
  var key = arr[1]
  var map = {
    bdl: ['border-left'],
    bdr: ['border-right'],
    bdt: ['border-top'],
    bdb: ['border-bottom'],
    bdx: ['border-left', 'border-right'],
    bdy: ['border-top', 'border-bottom'],
    bd: ['border'],
  }
  var keys = map[key]
  if (keys) {
    var styles = keys.map(item => `${item}: ${getValBorder(arr.slice(2))};`)
    var stylesStr = styles.join(' ')
    return stylesStr
  }
}

export default defineConfig({
  cli: {
    entry: {
      patterns: './src/**/*.{vue,nvue}',
      outFile: './src/static/uno.css'
    },
  },
  presets: [
    presetUno({
      preflight: true,
      // prefix: ['tw-'],
    }),
  ],
  /**
   * 小程序环境下，css类名中有特殊字符时会出现报错；
   * 考虑到使用到特殊字符的场景比较少，方案之一就是需要用到特殊符号的类名都自定义规则
   * tw-w-p20 -> width: 20%
   * tw-h-p20 -> height: 20%
   * tw-color-f00 -> color: #f00
   * tw-color-ff0000 -> color: #ff0000
   * tw-bg-f00 -> background-color: #f00
   * important-tw-bg-f00 ->  background-color: #f00 !important
   * tw-translate-p50 -> transform: translate(50%, 50%)
   * tw-translate-p-50 -> transform: translate(-50%, -50%)
   * tw-translate-y-p50 -> transform: translateY(50%)
   * tw-translate-y-p-50 -> transform: translateY(-50%)
   */
  rules: [
    [/^tw-bd(l|r|t|b|x|y)?-(.+)$/, (...args) => {
      // toEscapedSelector：当selector中有特殊字符时转义用的，一般用不到
      var selector = toEscapedSelector(args[0][0])
      return `${selector} { ${getValBorders(selector)} } `
    }],
    // 只匹配tw-color-000，不匹配tw-color-#000
    // 只匹配tw-bg-000，不匹配tw-bg-#000
    [/^tw-(color|bg)-(?!#)([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/, ([$1, $2, $3], { rawSelector, currentSelector, variantHandlers, theme }) => {
      const attribute = {bg: 'background-color', color: 'color'}[$2]

      if (rawSelector.startsWith('important')) {
        $3 = '#' + $3 +' !important'
      } else if (rawSelector.startsWith('!')) {
        rawSelector = rawSelector.replace(/^!/, '\\!')
        $3 = '#' + $3 +' !important'
      } else {
        $3 = '#' + $3
      }
      return `.${rawSelector} { ${attribute}: ${ $3 }; } `
    }],
    [/^tw-(w|h)-p(.+)$/, ([$1, $2, $3], { rawSelector, currentSelector, variantHandlers, theme }) => {
      const attribute = {w: 'width', h: 'height'}[$2]
      if (rawSelector.startsWith('important')) {
        $3 += '% !important'
      } else if (rawSelector.startsWith('!')) {
        $3 += '% !important'
        rawSelector = rawSelector.replace(/^!/, '\\!')
      } else {
        $3 += '%'
      }

      return `.${rawSelector} { ${attribute}: ${ $3 }; } `
    }],
    [/^tw-border-rd-p(.+)$/, (...args) => {
      // toEscapedSelector：当selector中有特殊字符时转义用的，一般用不到
      var selector = toEscapedSelector(args[0][0])
      var value = args[0][1].replace('p', '')
      return `${selector} { border-radius: ${value}%; } `
    }],
    [/^tw-translate-p(.+)$/, (...args) => {
      // toEscapedSelector：当selector中有特殊字符时转义用的，一般用不到
      var selector = toEscapedSelector(args[0][0])
      var value = args[0][1].replace('p', '')
      return `${selector} { transform: translate(${value}%, ${value}%) } `
    }],
    [/^tw-translate-y-p(.+)$/, (...args) => {
      // toEscapedSelector：当selector中有特殊字符时转义用的，一般用不到
      var selector = toEscapedSelector(args[0][0])
      var value = args[0][1].replace('p', '')
      return `${selector} { transform: translateY(${value}%) } `
    }],
    // top: 50%;
    [/^tw-top-p(.+)$/, (...args) => {
      // toEscapedSelector：当selector中有特殊字符时转义用的，一般用不到
      var selector = toEscapedSelector(args[0][0])
      var value = args[0][1].replace('p', '')
      return `${selector} { top: ${value}% } `
    }],
    // left: 50%;
    [/^tw-left-p(.+)$/, (...args) => {
      // toEscapedSelector：当selector中有特殊字符时转义用的，一般用不到
      var selector = toEscapedSelector(args[0][0])
      var value = args[0][1].replace('p', '')
      return `${selector} { left: ${value}% } `
    }],
    // bottom: 50%;
    [/^tw-bottom-p(.+)$/, (...args) => {
      // toEscapedSelector：当selector中有特殊字符时转义用的，一般用不到
      var selector = toEscapedSelector(args[0][0])
      var value = args[0][1].replace('p', '')
      return `${selector} { bottom: ${value}% } `
    }],
    // right: 50%;
    [/^tw-right-p(.+)$/, (...args) => {
      // toEscapedSelector：当selector中有特殊字符时转义用的，一般用不到
      var selector = toEscapedSelector(args[0][0])
      var value = args[0][1].replace('p', '')
      return `${selector} { right: ${value}% } `
    }],
    // padding-bottom: 100%;
    [/^tw-pb-p(.+)$/, (...args) => {
      // toEscapedSelector：当selector中有特殊字符时转义用的，一般用不到
      var selector = toEscapedSelector(args[0][0])
      var value = args[0][1].replace('p', '')
      return `${selector} { padding-bottom: ${value}% } `
    }],
    // line-height: 100%;
    [/^tw-line-height-p(.+)$/, (...args) => {
      // toEscapedSelector：当selector中有特殊字符时转义用的，一般用不到
      var selector = toEscapedSelector(args[0][0])
      var value = args[0][1].replace('p', '')
      return `${selector} { line-height: ${value}% } `
    }],
  ],
  // 快捷方式
  shortcuts: {
    // 布局
    'flex-center': 'flex items-center justify-center',
    'flex-between': 'flex items-center justify-between',
    'flex-col-center': 'flex flex-col items-center justify-center',
    // 间距
    'p-4': 'p-4',
    'px-4': 'px-4',
    'py-2': 'py-2',
    // 圆角
    'rounded-lg': 'rounded-lg',
    'rounded-full': 'rounded-full',
    // 阴影
    'shadow-sm': 'shadow-sm',
    'shadow-md': 'shadow-md',
    // 文字
    'text-primary': 'text-primary',
    'text-gray': 'text-gray-500',
    // 按钮
    'btn': 'px-4 py-2 rounded-lg bg-primary text-white font-medium',
    'btn-danger': 'px-4 py-2 rounded-lg bg-danger text-white font-medium',
  },
})