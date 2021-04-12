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
  threeStat,
  tryCatchStatement,
  logicalOperator,
  logicalOrOperator,
  functionExpression,
  test,
  forEach,
  functionTest,
  returnStat
} from './sample'

function transformCodeToAst(codeStr) {
  return parse(codeStr, {
    sourceType: 'module',
    plugins: ['classProperties', 'asyncGenerators', 'jsx', 'typescript']
  })
}
console.log(JSON.stringify(transformCodeToAst(forEach)))

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

const judgeNodes = ['']

const obj = {
  type: 'File',
  start: 0,
  end: 179,
  loc: { start: { line: 1, column: 0 }, end: { line: 12, column: 0 } },
  errors: [],
  program: {
    type: 'Program',
    start: 0,
    end: 179,
    loc: { start: { line: 1, column: 0 }, end: { line: 12, column: 0 } },
    sourceType: 'module',
    interpreter: null,
    body: [
      {
        type: 'FunctionDeclaration',
        start: 3,
        end: 178,
        loc: { start: { line: 2, column: 2 }, end: { line: 11, column: 3 } },
        id: {
          type: 'Identifier',
          start: 12,
          end: 24,
          loc: {
            start: { line: 2, column: 11 },
            end: { line: 2, column: 23 },
            identifierName: 'arrayForEach'
          },
          name: 'arrayForEach'
        },
        generator: false,
        async: false,
        params: [],
        body: {
          type: 'BlockStatement',
          start: 27,
          end: 178,
          loc: { start: { line: 2, column: 26 }, end: { line: 11, column: 3 } },
          body: [
            {
              type: 'ExpressionStatement',
              start: 57,
              end: 174,
              loc: {
                start: { line: 4, column: 4 },
                end: { line: 10, column: 6 }
              },
              expression: {
                type: 'CallExpression',
                start: 57,
                end: 174,
                loc: {
                  start: { line: 4, column: 4 },
                  end: { line: 10, column: 6 }
                },
                callee: {
                  type: 'MemberExpression',
                  start: 57,
                  end: 68,
                  loc: {
                    start: { line: 4, column: 4 },
                    end: { line: 4, column: 15 }
                  },
                  object: {
                    type: 'Identifier',
                    start: 57,
                    end: 60,
                    loc: {
                      start: { line: 4, column: 4 },
                      end: { line: 4, column: 7 },
                      identifierName: 'arr'
                    },
                    name: 'arr'
                  },
                  computed: false,
                  property: {
                    type: 'Identifier',
                    start: 61,
                    end: 68,
                    loc: {
                      start: { line: 4, column: 8 },
                      end: { line: 4, column: 15 },
                      identifierName: 'forEach'
                    },
                    name: 'forEach'
                  }
                },
                // 遇到forEach后, 如果存在回调函数,需要找到内部循环开始及结束节点
                arguments: [
                  {
                    type: 'ArrowFunctionExpression',
                    start: 69,
                    end: 173,
                    loc: {
                      start: { line: 4, column: 16 },
                      end: { line: 10, column: 5 }
                    },
                    id: null,
                    generator: false,
                    async: false,
                    params: [
                      {
                        type: 'Identifier',
                        start: 69,
                        end: 71,
                        loc: {
                          start: { line: 4, column: 16 },
                          end: { line: 4, column: 18 },
                          identifierName: 'el'
                        },
                        name: 'el'
                      }
                    ],
                    body: {
                      // 标记
                      type: 'BlockStatement',
                      start: 75,
                      end: 173,
                      loc: {
                        start: { line: 4, column: 22 },
                        end: { line: 10, column: 5 }
                      },
                      body: [
                        {
                          type: 'IfStatement',
                          start: 83,
                          end: 167,
                          loc: {
                            start: { line: 5, column: 6 },
                            end: { line: 9, column: 7 }
                          },
                          test: {
                            type: 'BinaryExpression',
                            start: 87,
                            end: 95,
                            loc: {
                              start: { line: 5, column: 10 },
                              end: { line: 5, column: 18 }
                            },
                            left: {
                              type: 'Identifier',
                              start: 87,
                              end: 88,
                              loc: {
                                start: { line: 5, column: 10 },
                                end: { line: 5, column: 11 },
                                identifierName: 'a'
                              },
                              name: 'a'
                            },
                            operator: '==',
                            right: {
                              type: 'StringLiteral',
                              start: 92,
                              end: 95,
                              loc: {
                                start: { line: 5, column: 15 },
                                end: { line: 5, column: 18 }
                              },
                              extra: { rawValue: '1', raw: '"1"' },
                              value: '1'
                            }
                          },
                          consequent: {
                            type: 'BlockStatement',
                            start: 97,
                            end: 129,
                            loc: {
                              start: { line: 5, column: 20 },
                              end: { line: 7, column: 7 }
                            },
                            body: [
                              {
                                type: 'ExpressionStatement',
                                start: 107,
                                end: 121,
                                loc: {
                                  start: { line: 6, column: 8 },
                                  end: { line: 6, column: 22 }
                                },
                                expression: {
                                  type: 'CallExpression',
                                  start: 107,
                                  end: 121,
                                  loc: {
                                    start: { line: 6, column: 8 },
                                    end: { line: 6, column: 22 }
                                  },
                                  callee: {
                                    type: 'MemberExpression',
                                    start: 107,
                                    end: 118,
                                    loc: {
                                      start: { line: 6, column: 8 },
                                      end: { line: 6, column: 19 }
                                    },
                                    object: {
                                      type: 'Identifier',
                                      start: 107,
                                      end: 114,
                                      loc: {
                                        start: { line: 6, column: 8 },
                                        end: { line: 6, column: 15 },
                                        identifierName: 'console'
                                      },
                                      name: 'console'
                                    },
                                    computed: false,
                                    property: {
                                      type: 'Identifier',
                                      start: 115,
                                      end: 118,
                                      loc: {
                                        start: { line: 6, column: 16 },
                                        end: { line: 6, column: 19 },
                                        identifierName: 'log'
                                      },
                                      name: 'log'
                                    }
                                  },
                                  arguments: [
                                    {
                                      type: 'NumericLiteral',
                                      start: 119,
                                      end: 120,
                                      loc: {
                                        start: { line: 6, column: 20 },
                                        end: { line: 6, column: 21 }
                                      },
                                      extra: { rawValue: 1, raw: '1' },
                                      value: 1
                                    }
                                  ]
                                }
                              }
                            ],
                            directives: []
                          },
                          alternate: {
                            type: 'BlockStatement',
                            start: 135,
                            end: 167,
                            loc: {
                              start: { line: 7, column: 13 },
                              end: { line: 9, column: 7 }
                            },
                            body: [
                              {
                                type: 'ExpressionStatement',
                                start: 145,
                                end: 159,
                                loc: {
                                  start: { line: 8, column: 8 },
                                  end: { line: 8, column: 22 }
                                },
                                expression: {
                                  type: 'CallExpression',
                                  start: 145,
                                  end: 159,
                                  loc: {
                                    start: { line: 8, column: 8 },
                                    end: { line: 8, column: 22 }
                                  },
                                  callee: {
                                    type: 'MemberExpression',
                                    start: 145,
                                    end: 156,
                                    loc: {
                                      start: { line: 8, column: 8 },
                                      end: { line: 8, column: 19 }
                                    },
                                    object: {
                                      type: 'Identifier',
                                      start: 145,
                                      end: 152,
                                      loc: {
                                        start: { line: 8, column: 8 },
                                        end: { line: 8, column: 15 },
                                        identifierName: 'console'
                                      },
                                      name: 'console'
                                    },
                                    computed: false,
                                    property: {
                                      type: 'Identifier',
                                      start: 153,
                                      end: 156,
                                      loc: {
                                        start: { line: 8, column: 16 },
                                        end: { line: 8, column: 19 },
                                        identifierName: 'log'
                                      },
                                      name: 'log'
                                    }
                                  },
                                  arguments: [
                                    {
                                      type: 'NumericLiteral',
                                      start: 157,
                                      end: 158,
                                      loc: {
                                        start: { line: 8, column: 20 },
                                        end: { line: 8, column: 21 }
                                      },
                                      extra: { rawValue: 2, raw: '2' },
                                      value: 2
                                    }
                                  ]
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
          ],
          directives: []
        }
      }
    ],
    directives: []
  },
  comments: []
}
