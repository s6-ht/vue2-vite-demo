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
  functionExpression,
  test
} from './sample'

function transformCodeToAst(codeStr) {
  return parse(codeStr, {
    sourceType: 'module',
    plugins: ['classProperties', 'asyncGenerators', 'jsx', 'typescript']
  })
}
console.log(JSON.stringify(transformCodeToAst(test)))

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
  end: 260,
  loc: { start: { line: 1, column: 0 }, end: { line: 15, column: 0 } },
  errors: [],
  program: {
    type: 'Program',
    start: 0,
    end: 260,
    loc: { start: { line: 1, column: 0 }, end: { line: 15, column: 0 } },
    sourceType: 'module',
    interpreter: null,
    body: [
      {
        type: 'FunctionDeclaration',
        start: 4,
        end: 259,
        loc: { start: { line: 2, column: 3 }, end: { line: 14, column: 5 } },
        id: {
          type: 'Identifier',
          start: 13,
          end: 20,
          loc: {
            start: { line: 2, column: 12 },
            end: { line: 2, column: 19 },
            identifierName: 'test555'
          },
          name: 'test555'
        },
        generator: false,
        async: false,
        params: [],
        body: {
          type: 'BlockStatement',
          start: 23,
          end: 259,
          loc: { start: { line: 2, column: 22 }, end: { line: 14, column: 5 } },
          body: [
            {
              type: 'ExpressionStatement',
              start: 31,
              end: 235,
              loc: {
                start: { line: 3, column: 6 },
                end: { line: 12, column: 7 }
              },
              expression: {
                type: 'AssignmentExpression',
                start: 31,
                end: 235,
                loc: {
                  start: { line: 3, column: 6 },
                  end: { line: 12, column: 7 }
                },
                operator: '=',
                left: {
                  type: 'Identifier',
                  start: 31,
                  end: 35,
                  loc: {
                    start: { line: 3, column: 6 },
                    end: { line: 3, column: 10 },
                    identifierName: 'html'
                  },
                  name: 'html'
                },
                right: {
                  type: 'CallExpression',
                  start: 38,
                  end: 235,
                  loc: {
                    start: { line: 3, column: 13 },
                    end: { line: 12, column: 7 }
                  },
                  callee: {
                    type: 'MemberExpression',
                    start: 38,
                    end: 50,
                    loc: {
                      start: { line: 3, column: 13 },
                      end: { line: 3, column: 25 }
                    },
                    object: {
                      type: 'Identifier',
                      start: 38,
                      end: 42,
                      loc: {
                        start: { line: 3, column: 13 },
                        end: { line: 3, column: 17 },
                        identifierName: 'html'
                      },
                      name: 'html'
                    },
                    computed: false,
                    property: {
                      type: 'Identifier',
                      start: 43,
                      end: 50,
                      loc: {
                        start: { line: 3, column: 18 },
                        end: { line: 3, column: 25 },
                        identifierName: 'replace'
                      },
                      name: 'replace'
                    }
                  },
                  arguments: [
                    {
                      type: 'RegExpLiteral',
                      start: 60,
                      end: 64,
                      loc: {
                        start: { line: 4, column: 8 },
                        end: { line: 4, column: 12 }
                      },
                      extra: { raw: '/a/g' },
                      pattern: 'a',
                      flags: 'g'
                    },
                    {
                      type: 'ArrowFunctionExpression',
                      start: 74,
                      end: 227,
                      loc: {
                        start: { line: 5, column: 8 },
                        end: { line: 11, column: 9 }
                      },
                      id: null,
                      generator: false,
                      async: false,
                      params: [
                        {
                          type: 'Identifier',
                          start: 75,
                          end: 76,
                          loc: {
                            start: { line: 5, column: 9 },
                            end: { line: 5, column: 10 },
                            identifierName: 'm'
                          },
                          name: 'm'
                        },
                        {
                          type: 'Identifier',
                          start: 78,
                          end: 80,
                          loc: {
                            start: { line: 5, column: 12 },
                            end: { line: 5, column: 14 },
                            identifierName: '$1'
                          },
                          name: '$1'
                        },
                        {
                          type: 'Identifier',
                          start: 82,
                          end: 84,
                          loc: {
                            start: { line: 5, column: 16 },
                            end: { line: 5, column: 18 },
                            identifierName: '$2'
                          },
                          name: '$2'
                        }
                      ],
                      body: {
                        type: 'BlockStatement',
                        start: 89,
                        end: 227,
                        loc: {
                          start: { line: 5, column: 23 },
                          end: { line: 11, column: 9 }
                        },
                        body: [
                          {
                            type: 'IfStatement',
                            start: 101,
                            end: 217,
                            loc: {
                              start: { line: 6, column: 10 },
                              end: { line: 10, column: 11 }
                            },
                            test: {
                              type: 'BinaryExpression',
                              start: 105,
                              end: 134,
                              loc: {
                                start: { line: 6, column: 14 },
                                end: { line: 6, column: 43 }
                              },
                              left: {
                                type: 'CallExpression',
                                start: 105,
                                end: 127,
                                loc: {
                                  start: { line: 6, column: 14 },
                                  end: { line: 6, column: 36 }
                                },
                                callee: {
                                  type: 'MemberExpression',
                                  start: 105,
                                  end: 115,
                                  loc: {
                                    start: { line: 6, column: 14 },
                                    end: { line: 6, column: 24 }
                                  },
                                  object: {
                                    type: 'Identifier',
                                    start: 105,
                                    end: 107,
                                    loc: {
                                      start: { line: 6, column: 14 },
                                      end: { line: 6, column: 16 },
                                      identifierName: '$2'
                                    },
                                    name: '$2'
                                  },
                                  computed: false,
                                  property: {
                                    type: 'Identifier',
                                    start: 108,
                                    end: 115,
                                    loc: {
                                      start: { line: 6, column: 17 },
                                      end: { line: 6, column: 24 },
                                      identifierName: 'indexOf'
                                    },
                                    name: 'indexOf'
                                  }
                                },
                                arguments: [
                                  {
                                    type: 'StringLiteral',
                                    start: 116,
                                    end: 126,
                                    loc: {
                                      start: { line: 6, column: 25 },
                                      end: { line: 6, column: 35 }
                                    },
                                    extra: {
                                      rawValue: 'https://',
                                      raw: "'https://'"
                                    },
                                    value: 'https://'
                                  }
                                ]
                              },
                              operator: '!==',
                              right: {
                                type: 'UnaryExpression',
                                start: 132,
                                end: 134,
                                loc: {
                                  start: { line: 6, column: 41 },
                                  end: { line: 6, column: 43 }
                                },
                                operator: '-',
                                prefix: true,
                                argument: {
                                  type: 'NumericLiteral',
                                  start: 133,
                                  end: 134,
                                  loc: {
                                    start: { line: 6, column: 42 },
                                    end: { line: 6, column: 43 }
                                  },
                                  extra: { rawValue: 1, raw: '1' },
                                  value: 1
                                }
                              }
                            },
                            consequent: {
                              type: 'BlockStatement',
                              start: 136,
                              end: 176,
                              loc: {
                                start: { line: 6, column: 45 },
                                end: { line: 8, column: 11 }
                              },
                              body: [
                                {
                                  type: 'ReturnStatement',
                                  start: 150,
                                  end: 164,
                                  loc: {
                                    start: { line: 7, column: 12 },
                                    end: { line: 7, column: 26 }
                                  },
                                  argument: {
                                    type: 'BinaryExpression',
                                    start: 157,
                                    end: 164,
                                    loc: {
                                      start: { line: 7, column: 19 },
                                      end: { line: 7, column: 26 }
                                    },
                                    left: {
                                      type: 'Identifier',
                                      start: 157,
                                      end: 159,
                                      loc: {
                                        start: { line: 7, column: 19 },
                                        end: { line: 7, column: 21 },
                                        identifierName: '$1'
                                      },
                                      name: '$1'
                                    },
                                    operator: '+',
                                    right: {
                                      type: 'Identifier',
                                      start: 162,
                                      end: 164,
                                      loc: {
                                        start: { line: 7, column: 24 },
                                        end: { line: 7, column: 26 },
                                        identifierName: '$2'
                                      },
                                      name: '$2'
                                    }
                                  }
                                }
                              ],
                              directives: []
                            },
                            alternate: {
                              type: 'BlockStatement',
                              start: 182,
                              end: 217,
                              loc: {
                                start: { line: 8, column: 17 },
                                end: { line: 10, column: 11 }
                              },
                              body: [
                                {
                                  type: 'ReturnStatement',
                                  start: 196,
                                  end: 205,
                                  loc: {
                                    start: { line: 9, column: 12 },
                                    end: { line: 9, column: 21 }
                                  },
                                  argument: {
                                    type: 'Identifier',
                                    start: 203,
                                    end: 205,
                                    loc: {
                                      start: { line: 9, column: 19 },
                                      end: { line: 9, column: 21 },
                                      identifierName: '$1'
                                    },
                                    name: '$1'
                                  }
                                }
                              ],
                              directives: []
                            }
                          }
                        ],
                        directives: []
                      }
                    }
                  ]
                }
              }
            },
            {
              type: 'ReturnStatement',
              start: 242,
              end: 253,
              loc: {
                start: { line: 13, column: 6 },
                end: { line: 13, column: 17 }
              },
              argument: {
                type: 'Identifier',
                start: 249,
                end: 253,
                loc: {
                  start: { line: 13, column: 13 },
                  end: { line: 13, column: 17 },
                  identifierName: 'html'
                },
                name: 'html'
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
