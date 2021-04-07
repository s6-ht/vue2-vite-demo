const ifStatement = `
function test() {
  if (a == "1") {
    return 1
  } else {
    return 2
  }
}
`

const ifStatement1 = `
  function test2(x, y) {
    if(x < y) {
      return 'x'
    }
    console.log(2)
  }
`

const ifStatement2 = `
  function test2(x, y) {
    console.log(3)
    if(x < y) {
      console.log(1)
    } else if (x === y) {
      console.log(33)
    } else {
      console.log(2)
    }
    console.log(555)
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
    console.log(1)
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
    console.log('obj.' + prop + ' = ' + obj[prop])
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
const threeStatement = `
function threeStatement() {
  let val = false
  let res = val ? 5 : 9
  return res
}
`

const logicalOperator = `
function logicalOperator() {
  let flag = true
  let isForce = false
  let isDemo = true
  let isNeed = false
  let res = flag && isForce && isDemo && (isNeed && 10)
  return res
}
`
const logicalOrOperator = `
function logicalOrOperator() {
  let flag = true
  let isForce = false
  let isNeed = true
  let res = (isForce && isNeed) || flag
  return res
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
  threeStatement,
  logicalOperator,
  logicalOrOperator
}
