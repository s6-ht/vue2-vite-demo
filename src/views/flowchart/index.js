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
  logicalOrOperator,
  functionExpression
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
  end: 203,
  loc: { start: { line: 1, column: 0 }, end: { line: 11, column: 0 } },
  errors: [],
  program: {
    type: 'Program',
    start: 0,
    end: 203,
    loc: { start: { line: 1, column: 0 }, end: { line: 11, column: 0 } },
    sourceType: 'module',
    interpreter: null,
    body: [
      {
        type: 'FunctionDeclaration',
        start: 1,
        end: 202,
        loc: { start: { line: 2, column: 0 }, end: { line: 10, column: 1 } },
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
          end: 202,
          loc: { start: { line: 2, column: 29 }, end: { line: 10, column: 1 } },
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
              end: 111,
              loc: {
                start: { line: 6, column: 2 },
                end: { line: 6, column: 19 }
              },
              declarations: [
                {
                  type: 'VariableDeclarator',
                  start: 98,
                  end: 111,
                  loc: {
                    start: { line: 6, column: 6 },
                    end: { line: 6, column: 19 }
                  },
                  id: {
                    type: 'Identifier',
                    start: 98,
                    end: 104,
                    loc: {
                      start: { line: 6, column: 6 },
                      end: { line: 6, column: 12 },
                      identifierName: 'isDemo'
                    },
                    name: 'isDemo'
                  },
                  init: {
                    type: 'BooleanLiteral',
                    start: 107,
                    end: 111,
                    loc: {
                      start: { line: 6, column: 15 },
                      end: { line: 6, column: 19 }
                    },
                    value: true
                  }
                }
              ],
              kind: 'let'
            },
            {
              type: 'ExpressionStatement',
              start: 114,
              end: 125,
              loc: {
                start: { line: 7, column: 2 },
                end: { line: 7, column: 13 }
              },
              expression: {
                type: 'AssignmentExpression',
                start: 114,
                end: 125,
                loc: {
                  start: { line: 7, column: 2 },
                  end: { line: 7, column: 13 }
                },
                operator: '=',
                left: {
                  type: 'Identifier',
                  start: 114,
                  end: 117,
                  loc: {
                    start: { line: 7, column: 2 },
                    end: { line: 7, column: 5 },
                    identifierName: 'let'
                  },
                  name: 'let'
                },
                right: {
                  type: 'BooleanLiteral',
                  start: 121,
                  end: 125,
                  loc: {
                    start: { line: 7, column: 9 },
                    end: { line: 7, column: 13 }
                  },
                  value: true
                }
              }
            },
            {
              type: 'VariableDeclaration',
              start: 128,
              end: 187,
              loc: {
                start: { line: 8, column: 2 },
                end: { line: 8, column: 61 }
              },
              declarations: [
                {
                  type: 'VariableDeclarator',
                  start: 132,
                  end: 187,
                  loc: {
                    start: { line: 8, column: 6 },
                    end: { line: 8, column: 61 }
                  },
                  id: {
                    type: 'Identifier',
                    start: 132,
                    end: 135,
                    loc: {
                      start: { line: 8, column: 6 },
                      end: { line: 8, column: 9 },
                      identifierName: 'res'
                    },
                    name: 'res'
                  },
                  init: {
                    type: 'LogicalExpression',
                    start: 138,
                    end: 187,
                    loc: {
                      start: { line: 8, column: 12 },
                      end: { line: 8, column: 61 }
                    },
                    left: {
                      type: 'LogicalExpression',
                      start: 139,
                      end: 156,
                      loc: {
                        start: { line: 8, column: 13 },
                        end: { line: 8, column: 30 }
                      },
                      extra: { parenthesized: true, parenStart: 138 },
                      left: {
                        type: 'Identifier',
                        start: 139,
                        end: 146,
                        loc: {
                          start: { line: 8, column: 13 },
                          end: { line: 8, column: 20 },
                          identifierName: 'isForce'
                        },
                        name: 'isForce'
                      },
                      operator: '&&',
                      right: {
                        type: 'Identifier',
                        start: 150,
                        end: 156,
                        loc: {
                          start: { line: 8, column: 24 },
                          end: { line: 8, column: 30 },
                          identifierName: 'isNeed'
                        },
                        name: 'isNeed'
                      }
                    },
                    operator: '||',
                    right: {
                      type: 'LogicalExpression',
                      start: 162,
                      end: 186,
                      loc: {
                        start: { line: 8, column: 36 },
                        end: { line: 8, column: 60 }
                      },
                      extra: { parenthesized: true, parenStart: 161 },
                      left: {
                        type: 'LogicalExpression',
                        start: 162,
                        end: 176,
                        loc: {
                          start: { line: 8, column: 36 },
                          end: { line: 8, column: 50 }
                        },
                        left: {
                          type: 'Identifier',
                          start: 162,
                          end: 166,
                          loc: {
                            start: { line: 8, column: 36 },
                            end: { line: 8, column: 40 },
                            identifierName: 'flag'
                          },
                          name: 'flag'
                        },
                        operator: '&&',
                        right: {
                          type: 'Identifier',
                          start: 170,
                          end: 176,
                          loc: {
                            start: { line: 8, column: 44 },
                            end: { line: 8, column: 50 },
                            identifierName: 'isDemo'
                          },
                          name: 'isDemo'
                        }
                      },
                      operator: '&&',
                      right: {
                        type: 'Identifier',
                        start: 180,
                        end: 186,
                        loc: {
                          start: { line: 8, column: 54 },
                          end: { line: 8, column: 60 },
                          identifierName: 'isText'
                        },
                        name: 'isText'
                      }
                    }
                  }
                }
              ],
              kind: 'let'
            },
            {
              type: 'ReturnStatement',
              start: 190,
              end: 200,
              loc: {
                start: { line: 9, column: 2 },
                end: { line: 9, column: 12 }
              },
              argument: {
                type: 'Identifier',
                start: 197,
                end: 200,
                loc: {
                  start: { line: 9, column: 9 },
                  end: { line: 9, column: 12 },
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
