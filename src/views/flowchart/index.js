import { parse } from '@babel/parser'
import { transformAstToGraph } from './transform'
import fp from 'lodash/fp'
import {
  ifStatement,
  ifStatement1,
  whileState1,
  doWhileState1,
  switch1,
  forStatement,
  forInStatement,
  forOfStatement,
  threeStatement,
  tryCatchStatement,
  logicalOperator,
  logicalOrOperator
} from './sample'

function transformCodeToAst(codeStr) {
  return parse(codeStr, {
    sourceType: 'module',
    plugins: ['classProperties', 'asyncGenerators', 'jsx', 'typescript']
  })
}
console.log(JSON.stringify(transformCodeToAst(logicalOrOperator)))

function isEmpty(value) {
  let flag = true
  if (Array.isArray(value) && JSON.stringify(value) !== '[]') {
    flag = false
  }
  if (
    Object.prototype.toString.call(value) === '[object Object]' &&
    JSON.stringify(value) !== '{}'
  ) {
    flag = false
  }
  return flag
}
// import { transformGeneralAstToGraph } from './test'
// console.log(transformGeneralAstToGraph(ast))

function isObject(val) {
  return Object.prototype.toString.call(val) == '[object Object]'
}

function isString(val) {
  return typeof val === 'string'
}

function transformNodeToMermaidString({ id, name, shape = 'square', style }) {
  const text = typeof name === 'string' ? name : id

  const shapes = {
    round: `  ${id}("${text}")`,
    circle: `  ${id}(("${text}"))`,
    asymetric: `  ${id}>"${text}"]`,
    rhombus: `  ${id}{"${text}"}`,
    square: ''
  }
  const defaultShape = `${id}["${text}"]`
  return shapes[shape] || defaultShape
}

function transformEdgeToMermaidString({
  from,
  to,
  name,
  type = 'solid',
  arrow = true
}) {
  const text = isString(name) ? name : ''
  // console.log(text)
  const arrowText = arrow ? '>' : ''
  if (fp.isEmpty(text)) {
    switch (type) {
      case 'dotted':
        return `  ${from} -.-${arrowText} ${to}`
      case 'thick':
        return `  ${from} ==${arrowText} ${to}`
      case 'solid':
      default:
        return `  ${from} --${arrowText} ${to}`
    }
  } else {
    switch (type) {
      case 'dotted':
        return `  ${from} -. ${text} .-${arrowText} ${to}`
      case 'thick':
        return `  ${from} == ${text} ==${arrowText} ${to}`
      case 'solid':
      default:
        return `  ${from} -- ${text} --${arrowText} ${to}`
    }
  }
}

function transformGraphFragmentToMermaidString({ nodes, lines, subNodes }) {
  const nodesMermaidStr = nodes.map(transformNodeToMermaidString).join('\n')
  const subNodesMermaidStr = subNodes
    .map(({ id, name, graph }) => {
      return `${id}([" ${name.replace(
        '_',
        ' '
      )}"])\n${transformGraphFragmentToMermaidString(graph)}`
    })
    .join('\n')
  const linesMermaidStr = lines.map(transformEdgeToMermaidString).join('\n')
  return nodesMermaidStr + '\n' + subNodesMermaidStr + '\n' + linesMermaidStr
}

function transformGraphToMermaid({ nodes, lines, subNodes }, direction = 'TD') {
  const mermaidStrPrefix = `graph ${direction}`
  const mermaidContent = transformGraphFragmentToMermaidString({
    nodes,
    lines,
    subNodes
  })
  return mermaidStrPrefix + '\n' + mermaidContent
}

export function getMermain(code) {
  const ast = transformCodeToAst(code)
  const allNodesandLines = transformAstToGraph(ast)
  console.log(allNodesandLines)
  return transformGraphToMermaid(allNodesandLines)
}

const obj = {
  type: 'File',
  start: 0,
  end: 147,
  loc: { start: { line: 1, column: 0 }, end: { line: 9, column: 0 } },
  errors: [],
  program: {
    type: 'Program',
    start: 0,
    end: 147,
    loc: { start: { line: 1, column: 0 }, end: { line: 9, column: 0 } },
    sourceType: 'module',
    interpreter: null,
    body: [
      {
        type: 'FunctionDeclaration',
        start: 1,
        end: 146,
        loc: { start: { line: 2, column: 0 }, end: { line: 8, column: 1 } },
        id: {
          type: 'Identifier',
          start: 10,
          end: 27,
          loc: {
            start: { line: 2, column: 9 },
            end: { line: 2, column: 26 },
            identifierName: 'logicalOrOperator'
          },
          name: 'logicalOrOperator'
        },
        generator: false,
        async: false,
        params: [],
        body: {
          type: 'BlockStatement',
          start: 30,
          end: 146,
          loc: { start: { line: 2, column: 29 }, end: { line: 8, column: 1 } },
          body: [
            {
              type: 'VariableDeclaration',
              start: 34,
              end: 49,
              loc: {
                start: { line: 3, column: 2 },
                end: { line: 3, column: 17 }
              },
              declarations: [
                {
                  type: 'VariableDeclarator',
                  start: 38,
                  end: 49,
                  loc: {
                    start: { line: 3, column: 6 },
                    end: { line: 3, column: 17 }
                  },
                  id: {
                    type: 'Identifier',
                    start: 38,
                    end: 42,
                    loc: {
                      start: { line: 3, column: 6 },
                      end: { line: 3, column: 10 },
                      identifierName: 'flag'
                    },
                    name: 'flag'
                  },
                  init: {
                    type: 'BooleanLiteral',
                    start: 45,
                    end: 49,
                    loc: {
                      start: { line: 3, column: 13 },
                      end: { line: 3, column: 17 }
                    },
                    value: true
                  }
                }
              ],
              kind: 'let'
            },
            {
              type: 'VariableDeclaration',
              start: 52,
              end: 71,
              loc: {
                start: { line: 4, column: 2 },
                end: { line: 4, column: 21 }
              },
              declarations: [
                {
                  type: 'VariableDeclarator',
                  start: 56,
                  end: 71,
                  loc: {
                    start: { line: 4, column: 6 },
                    end: { line: 4, column: 21 }
                  },
                  id: {
                    type: 'Identifier',
                    start: 56,
                    end: 63,
                    loc: {
                      start: { line: 4, column: 6 },
                      end: { line: 4, column: 13 },
                      identifierName: 'isForce'
                    },
                    name: 'isForce'
                  },
                  init: {
                    type: 'BooleanLiteral',
                    start: 66,
                    end: 71,
                    loc: {
                      start: { line: 4, column: 16 },
                      end: { line: 4, column: 21 }
                    },
                    value: false
                  }
                }
              ],
              kind: 'let'
            },
            {
              type: 'VariableDeclaration',
              start: 74,
              end: 91,
              loc: {
                start: { line: 5, column: 2 },
                end: { line: 5, column: 19 }
              },
              declarations: [
                {
                  type: 'VariableDeclarator',
                  start: 78,
                  end: 91,
                  loc: {
                    start: { line: 5, column: 6 },
                    end: { line: 5, column: 19 }
                  },
                  id: {
                    type: 'Identifier',
                    start: 78,
                    end: 84,
                    loc: {
                      start: { line: 5, column: 6 },
                      end: { line: 5, column: 12 },
                      identifierName: 'isNeed'
                    },
                    name: 'isNeed'
                  },
                  init: {
                    type: 'BooleanLiteral',
                    start: 87,
                    end: 91,
                    loc: {
                      start: { line: 5, column: 15 },
                      end: { line: 5, column: 19 }
                    },
                    value: true
                  }
                }
              ],
              kind: 'let'
            },
            {
              type: 'VariableDeclaration',
              start: 94,
              end: 131,
              loc: {
                start: { line: 6, column: 2 },
                end: { line: 6, column: 39 }
              },
              declarations: [
                {
                  type: 'VariableDeclarator',
                  start: 98,
                  end: 131,
                  loc: {
                    start: { line: 6, column: 6 },
                    end: { line: 6, column: 39 }
                  },
                  id: {
                    type: 'Identifier',
                    start: 98,
                    end: 101,
                    loc: {
                      start: { line: 6, column: 6 },
                      end: { line: 6, column: 9 },
                      identifierName: 'res'
                    },
                    name: 'res'
                  },
                  init: {
                    type: 'LogicalExpression',
                    start: 104,
                    end: 131,
                    loc: {
                      start: { line: 6, column: 12 },
                      end: { line: 6, column: 39 }
                    },
                    left: {
                      type: 'LogicalExpression',
                      start: 105,
                      end: 122,
                      loc: {
                        start: { line: 6, column: 13 },
                        end: { line: 6, column: 30 }
                      },
                      extra: { parenthesized: true, parenStart: 104 },
                      left: {
                        type: 'Identifier',
                        start: 105,
                        end: 112,
                        loc: {
                          start: { line: 6, column: 13 },
                          end: { line: 6, column: 20 },
                          identifierName: 'isForce'
                        },
                        name: 'isForce'
                      },
                      operator: '&&',
                      right: {
                        type: 'Identifier',
                        start: 116,
                        end: 122,
                        loc: {
                          start: { line: 6, column: 24 },
                          end: { line: 6, column: 30 },
                          identifierName: 'isNeed'
                        },
                        name: 'isNeed'
                      }
                    },
                    operator: '||',
                    right: {
                      type: 'Identifier',
                      start: 127,
                      end: 131,
                      loc: {
                        start: { line: 6, column: 35 },
                        end: { line: 6, column: 39 },
                        identifierName: 'flag'
                      },
                      name: 'flag'
                    }
                  }
                }
              ],
              kind: 'let'
            },
            {
              type: 'ReturnStatement',
              start: 134,
              end: 144,
              loc: {
                start: { line: 7, column: 2 },
                end: { line: 7, column: 12 }
              },
              argument: {
                type: 'Identifier',
                start: 141,
                end: 144,
                loc: {
                  start: { line: 7, column: 9 },
                  end: { line: 7, column: 12 },
                  identifierName: 'res'
                },
                name: 'res'
              }
            }
          ],
          directives: []
        }
      }
    ],
    directives: []
  },
  comments: []
}
