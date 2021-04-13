// 函数声明/函数表达式/箭头函数
// function fn() {}

// var fn = function () {
//   console.log(1)

// var fn = () => {
//   console.log(2)
// }
// export function createServer() {
//   console.log(3)
// }

const functionTest = `
export async function createServer() {
  console.log(3) 
}
`

const threeStat = `
function threeStat() {
  const b = 'test'
  const res = val ? (isNeed ? (isFlag ? 5 : 6) : 10) : isDemo ? 6 : 2
  return 44
}
`

const returnStat = `
function returnTest() {
  return (flag ? obj1 : obj2).name
  }
`

const ifStatement = `
function test() {
  var b = 5
  if (a == "1") {
    return 1
  } else {
    return 2
  }
  var a = 3
}
`

// var a = 3
// }
const ifStatement1 = `
  function test2(x, y) {
    var a = 1
    if(x < y) {
      return 'x'
    }
    var b = 2
  }
`

const ifStatement2 = `
  function test2(x, y) {
    if(x < y) {
      console.log(1)
    } else if (x === y) {
      console.log(33)
    } else {
      console.log(2)
    }
    return 5
  }
`

const whileState1 = `
  function while1() {
    let x = 1
    let y = 0
    while(x < 5) {
      y++
    }
    return y
  }
`
const doWhileState1 = `
  function while1() {
    var a, b
    do {
      y++
    } while(x < 5)
    return y
  }
`

const switch1 = `
  function switchCase1(type) {
    let res = ''
    switch(type) {
      case 'y':
        res = 'y'
        break
      case 'N':
        res = 'N'
        break
      default: 
        break
    }
    return
  }
`

const forStatement = `
  function for1() {
    let res = 0
    for(let i = 0; i < 5; i++) {
      res++
    }
    return res
  }
`
const forInStatement = `
function forIn() {
  var obj = { a: 1, b: 2, c: 3 }

  for (var prop in obj) {
    console.log(2)
    console.log(3)
  }
  return res
}
`
const forOfStatement = `
function forOf() {
  let iterable = [10, 20, 30];
  let res = 0
  for (let value of iterable) {
    res += value
}
  return res
}
`
const tryCatchStatement = `
function tryCatch() {
  let res = 0
  try {
    res = 10
    return res
  } catch (error) {
    console.error(error);
  }
}
`

const logicalOperator = `
function logicalOperator() {
  let res = flag && isForce
  return res
}
`

// let res = (isForce && isNeed) || (flag && isDemo && isText)
// return res
const logicalOrOperator = `
function logicalOrOperator() {
  for(let i = 0; i < 5; i++) {

    continue 
  }
}`

const error = `
function error() {
  // throw TypeError('hello error')
  var obj = {
    name: 1
  }
}
`

const emptyStat = `
function emptyStat() {
  var a = [];
}
`

const functionExpression = `
  const functionExpression = function () {
    var a = 1
    console.log(1)
    console.log(2)
  }
`
const arrowFn = `
  const arrowFn = function () {
    var a = 1
    console.log(1)
    console.log(2)
  }
`

const classTest = `
  class ClassTest {
    consturcotr(options) {
      this.options = options
    }
  }
`
// console.log(1)
// console.log(2)

// let arr = [1, 2, 3]

// const array1 = [1, 30, 39, 29, 10, 13];

// let falg = array1.every((currentValue) => currentValue < 40)
// let filterArr = array1.filter((item) => {
//   return 1
// })
// let falg1 = array1.every((currentValue) => currentValue < 40)
// return 5

// array1.forEach(item => {
//   console.log(436534)
// })

// let index = array1.find(function () {
//     return element => element > 10
// })
const forEach = `
function arrayForEach() {
    let index = array1.map(function () {
      return element => element > 10
  })
  return 1
  }
`

const test = `
   function test555() {
     
      html = html.replace(
        /(<link.+?href="|<script.+?src="|<img.+?src=")(.+?)"/g,
        (m, $1, $2) => {
          if ($2.indexOf('https://') !== -1) {
            return $1 + $2
          } else {
            return $1
          }
        }
      )
      return html
    
    }
`

export {
  ifStatement,
  ifStatement1,
  ifStatement2,
  whileState1,
  doWhileState1,
  switch1,
  forStatement,
  forInStatement,
  forOfStatement,
  tryCatchStatement,
  threeStat,
  logicalOperator,
  logicalOrOperator,
  functionExpression,
  arrowFn,
  test,
  forEach,
  functionTest,
  returnStat,
  error,
  emptyStat,
  classTest,
}
