import { parse } from '@babel/parser'
import { transformAstToGraph } from './transform'
import fp from 'lodash/fp'
import {
  ifStatement,
  ifStatement1,
  ifStatement2,
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
  returnStat,
  emptyStat,
  error,
} from './sample'

function transformCodeToAst(codeStr) {
  return parse(codeStr, {
    sourceType: 'module',
    plugins: ['classProperties', 'asyncGenerators', 'jsx', 'typescript'],
  })
}
console.log(JSON.stringify(transformCodeToAst(error)))

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
    square: '',
  }
  const defaultShape = `${id}["${text}"]`
  return shapes[shape] || defaultShape
}

function transformEdgeToMermaidString({
  from,
  to,
  name,
  type = 'solid',
  arrow = true,
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
    subNodes,
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
  end: 88,
  loc: { start: { line: 1, column: 0 }, end: { line: 8, column: 0 } },
  errors: [],
  program: {
    type: 'Program',
    start: 0,
    end: 88,
    loc: { start: { line: 1, column: 0 }, end: { line: 8, column: 0 } },
    sourceType: 'module',
    interpreter: null,
    body: [
      {
        type: 'FunctionDeclaration',
        start: 1,
        end: 87,
        loc: { start: { line: 2, column: 0 }, end: { line: 7, column: 1 } },
        id: {
          type: 'Identifier',
          start: 10,
          end: 15,
          loc: {
            start: { line: 2, column: 9 },
            end: { line: 2, column: 14 },
            identifierName: 'error',
          },
          name: 'error',
        },
        generator: false,
        async: false,
        params: [],
        body: {
          type: 'BlockStatement',
          start: 18,
          end: 87,
          loc: { start: { line: 2, column: 17 }, end: { line: 7, column: 1 } },
          body: [
            {
              type: 'VariableDeclaration',
              start: 58,
              end: 85,
              loc: {
                start: { line: 4, column: 2 },
                end: { line: 6, column: 3 },
              },
              leadingComments: [
                {
                  type: 'CommentLine',
                  value: " throw TypeError('hello error')",
                  start: 22,
                  end: 55,
                  loc: {
                    start: { line: 3, column: 2 },
                    end: { line: 3, column: 35 },
                  },
                },
              ],
              declarations: [
                {
                  type: 'VariableDeclarator',
                  start: 62,
                  end: 85,
                  loc: {
                    start: { line: 4, column: 6 },
                    end: { line: 6, column: 3 },
                  },
                  id: {
                    type: 'Identifier',
                    start: 62,
                    end: 65,
                    loc: {
                      start: { line: 4, column: 6 },
                      end: { line: 4, column: 9 },
                      identifierName: 'obj',
                    },
                    name: 'obj',
                  },
                  init: {
                    type: 'ObjectExpression',
                    start: 68,
                    end: 85,
                    loc: {
                      start: { line: 4, column: 12 },
                      end: { line: 6, column: 3 },
                    },
                    properties: [
                      {
                        type: 'ObjectProperty',
                        start: 74,
                        end: 81,
                        loc: {
                          start: { line: 5, column: 4 },
                          end: { line: 5, column: 11 },
                        },
                        method: false,
                        key: {
                          type: 'Identifier',
                          start: 74,
                          end: 78,
                          loc: {
                            start: { line: 5, column: 4 },
                            end: { line: 5, column: 8 },
                            identifierName: 'name',
                          },
                          name: 'name',
                        },
                        computed: false,
                        shorthand: false,
                        value: {
                          type: 'NumericLiteral',
                          start: 80,
                          end: 81,
                          loc: {
                            start: { line: 5, column: 10 },
                            end: { line: 5, column: 11 },
                          },
                          extra: { rawValue: 1, raw: '1' },
                          value: 1,
                        },
                      },
                    ],
                  },
                },
              ],
              kind: 'var',
            },
          ],
          directives: [],
        },
      },
    ],
    directives: [],
  },
  comments: [
    {
      type: 'CommentLine',
      value: " throw TypeError('hello error')",
      start: 22,
      end: 55,
      loc: { start: { line: 3, column: 2 }, end: { line: 3, column: 35 } },
    },
  ],
}
