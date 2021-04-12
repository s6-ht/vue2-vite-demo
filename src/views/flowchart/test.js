import generate from '@babel/generator'
import fp from 'lodash/fp'

const emptyGraph = {
  nodes: [],
  lines: [],
  entryNodes: [],
  exitNodes: [],
  subNodes: [],
  breakNodes: []
}

const line = {
  form: '',
  to: '',
  name: '',
  type: '',
  arrw: true
}

const arrLoopMethods = ['forEach']
const hasBody = {}

function getUuid() {
  var s = []
  var hexDigits = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  for (var i = 0; i < 36; i++) {
    s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1)
  }
  s[14] = '4'
  s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1)
  s[8] = s[13] = s[18] = s[23] = '-'
  const uuid = s.join('')
  return uuid.substr(0, 8)
}

function isNullOrUndefined(val) {
  if (val === null || val === undefined) {
    return true
  }
  return false
}

function setNodeName(statement, prefix) {
  const text = isNullOrUndefined(statement.id)
    ? getUuid()
    : generate(statement.id).code
  return `${prefix}${text}`
}

// 将name中的双引号用单引号代替
function replaceDoubleToSingleQuotes(str) {
  return str.replace(/(")/g, "'")
}

export function transformAstToGraph(ast) {
  if (Array.isArray(ast)) {
    return transformStatementSequenceToGraph(ast)
  } else {
    return setType(ast)
  }
}
let assignmentPrefix = ''

function transformStatementSequenceToGraph(statements) {
  const collection = statements.map(statement => transformAstToGraph(statement))
  return collection.reduce(
    (
      { nodes, subNodes, entryNodes, exitNodes, breakNodes, lines },
      {
        nodes: currentNodes,
        lines: currentLines,
        subNodes: currentSubNodes,
        entryNodes: currentEntryNodes,
        breakNodes: currentBreakNodes,
        exitNodes: currentExitNodes
      }
    ) => {
      // console.log([
      //   ...lines,
      //   ...currentLines,
      //   ...fp.flatten(
      //     fp.map(
      //       exitNode =>
      //         fp.map(
      //           entryNode => ({
      //             from: exitNode.id,
      //             to: entryNode.id,
      //             name: '',
      //             type: 'solid',
      //             arrow: true
      //           }),
      //           currentEntryNodes
      //         ),
      //       exitNodes
      //     )
      //   )
      // ])
      // console.log([...nodes, ...currentNodes])
      // console.log(fp.isEmpty(entryNodes) ? currentEntryNodes : entryNodes)
      // console.log(currentExitNodes)
      // console.log([...subNodes, ...currentSubNodes])

      return {
        nodes: [...nodes, ...currentNodes],
        lines: [
          ...lines,
          ...currentLines,
          // 加入exitNodes是否生成与下级的连线
          ...fp.flatten(
            exitNodes.map(exitNode =>
              currentEntryNodes.map(entryNode => ({
                from: exitNode.id,
                to: entryNode.id,
                name: entryNode.condition,
                type: 'solid',
                arrow: true
              }))
            )
          )
        ],
        entryNodes: fp.isEmpty(entryNodes) ? currentEntryNodes : entryNodes,
        exitNodes: currentExitNodes,
        breakNodes: [...breakNodes, ...currentBreakNodes],
        subNodes: [...subNodes, ...currentSubNodes]
      }
    },
    {
      ...emptyGraph
    }
  )
}

function getLines(arr, text, fromNodeId) {
  return arr.map(node => {
    return {
      from: fromNodeId,
      to: node.id,
      name: text,
      type: 'solid',
      arrow: true
    }
  })
}

function delSemi(str) {
  return str.replace(';', '')
}

function setType(statement) {
  switch (statement.type) {
    case 'File':
      return transformAstToGraph(statement.program)
    // body为数组
    case 'CommentLine':
      return emptyGraph
    case 'TSTypeAliasDeclaration':
      return emptyGraph

    case 'Program':
      return transformAstToGraph(statement.body)
    case 'ClassBody':
      return transformAstToGraph(statement.body)
    case 'ClassProperty':
      const classPropertyNode = {
        id: getUuid(),
        name: replaceDoubleToSingleQuotes(generate(statement).code),
        shape: 'round'
      }
      return {
        nodes: [classPropertyNode],
        lines: [],
        entryNodes: [],
        exitNodes: [],
        breakNodes: [],
        subNodes: []
      }

    case 'FunctionDeclaration':
      console.log('function')
      // 设置标识父级id, 用于确定连线起始点
      statement.selfId = getUuid()
      if (statement.body.type === 'BlockStatement') {
        statement.body.prevNodeId = statement.selfId
      }
      return {
        nodes: [],
        lines: [],
        entryNodes: [],
        exitNodes: [],
        breakNodes: [],
        subNodes: [
          {
            name: setNodeName(statement, 'function_'),
            id: statement.selfId,
            shape: 'rhombus',
            graph: transformAstToGraph(statement.body)
          }
        ]
      }
    case 'Identifier':
      return emptyGraph
    // function 声明后面的{ body  为数组
    case 'BlockStatement':
      console.error('BlockStatement')
      // 表明数组fo村换的第一个语句及最后一个语句, 用于确定loop连线的起点和终点
      if (statement.loop) {
        hasBody[statement.loopStartId] = !!statement.body.length
      }
      if (statement.loop && statement.body.length) {
        statement.body[0].loop = statement.loop
        statement.body[0].loopStartId = statement.loopStartId
        statement.body[0].loopStart = true
        statement.body[statement.body.length - 1].loop = statement.loop
        statement.body[statement.body.length - 1].loopStartId =
          statement.loopStartId
        statement.body[statement.body.length - 1].loopEnd = true
      }
      if (
        statement.prevNodeId &&
        Array.isArray(statement.body) &&
        statement.body.length
      ) {
        statement.body[0].prevNodeId = statement.prevNodeId
      }
      // 处理赋值表达式中的return值得前缀 html = () => {return 1} --> html = 1
      if (statement.prefix) {
        statement.body.forEach(item => {
          item.prefix = statement.prefix
        })
      }
      return transformAstToGraph(statement.body)
    case 'ArrowFunctionExpression':
      console.error('ArrowFunctionExpression')
      // 处理数组循环语句
      if (statement.loop) {
        statement.body.loop = statement.loop
        statement.body.loopStartId = statement.loopStartId
      }

      if (statement.prefix) {
        statement.body.prefix = statement.prefix
      }
      return transformAstToGraph(statement.body)
    case 'AssignmentExpression':
      // 赋值节点表达式
      console.log('AssignmentExpression')
      statement.selfId = getUuid()
      // 用于判断赋值表达式中得return节点的值的前缀
      statement.right.prefix = statement.left.name + statement.operator
      assignmentPrefix = statement.left.name + statement.operator
      // console.error(statement.right.prefix)
      // 三目运算符返回值的前缀 let res = flag ? 1 : 2  ---> let res =
      if (statement.right.type === 'ConditionalExpression') {
        statement.right.variableName = generate(statement.left).code
      }
      const {
        nodes: assignmentExpressionNodes,
        lines: assignmentExpressionLines,
        entryNodes: assignmentExpressionEntryNodes,
        exitNodes: assignmentExpressionExitNodes
      } = transformAstToGraph(statement.right)
      console.error(assignmentExpressionNodes)
      let assignmentExpressionNode = []
      // 如果内部没有额外的节点返回, 生成一个该节点
      if (!assignmentExpressionNodes.length) {
        assignmentExpressionNode = [
          {
            id: statement.selfId,
            name: generate(statement).code,
            shape: 'round'
          }
        ]
      }
      return {
        nodes: [...assignmentExpressionNode, ...assignmentExpressionNodes],
        lines: [...assignmentExpressionLines],
        entryNodes: [
          ...assignmentExpressionNode,
          ...assignmentExpressionEntryNodes
        ],
        exitNodes: [
          ...assignmentExpressionNode,
          ...assignmentExpressionExitNodes
        ],
        breakNodes: [],
        subNodes: []
      }
    case 'ExpressionStatement':
      console.error('ExpressionStatement')
      statement.selfId = getUuid()
      // 处理数组的循环语句
      if (statement.loop) {
        statement.expression.loop = statement.loop
        statement.expression.loopStartId = statement.loopStartId
        if (statement.loopStart) {
          statement.expression.loopStart = statement.loopStart
        }
        if (statement.loopEnd) {
          statement.expression.loopEnd = statement.loopEnd
        }
      }
      const {
        nodes: expressionStatNodes,
        lines: expressionStatLines,
        entryNodes: expressionStatEntryNodes,
        exitNodes: expressionStatExitNodes
      } = transformAstToGraph(statement.expression)
      let expressionNode = []
      if (!expressionStatNodes.length) {
        expressionNode = [
          {
            id: statement.selfId,
            name: generate(statement).code,
            shape: 'round'
          }
        ]
      }
      const expressionLine = []
      // if (statement.prevNodeId) {
      //   expressionLine.push({
      //     from: statement.prevNodeId,
      //     to: statement.selfId,
      //     name: '',
      //     type: 'solid',
      //     arrow: true
      //   })
      // }
      return {
        nodes: [...expressionNode, ...expressionStatNodes],
        lines: [...expressionLine, ...expressionStatLines],
        entryNodes: [...expressionNode, ...expressionStatEntryNodes],
        exitNodes: [...expressionNode, ...expressionStatExitNodes],
        breakNodes: [],
        subNodes: []
      }
    case 'IfStatement':
      // 找到其上一个节点, 与当前节点建立连线
      console.error('IfStatement', statement)
      statement.selfId = getUuid()
      const ifNode = {
        id: statement.selfId,
        name: replaceDoubleToSingleQuotes(
          `if(${generate(statement.test).code})`
        ),
        shape: 'square'
      }
      if (statement.prefix) {
        if (statement.consequent) {
          statement.consequent.body.forEach(item => {
            item.prefix = statement.prefix
          })
        }
        if (statement.alternate) {
          statement.alternate.body.forEach(item => {
            item.prefix = statement.prefix
          })
        }
      }
      // 处理if为true时的语句 consequent中的body为数组
      if (statement.consequent) {
        if (statement.loop) {
          statement.consequent.loop = statement.loop
          statement.consequent.loopStartId = statement.loopStartId
        }
      }
      if (statement.alternate) {
        if (statement.loop) {
          statement.alternate.loop = statement.loop
          statement.alternate.loopStartId = statement.loopStartId
        }
      }
      const {
        nodes: consequentNodes,
        lines: consequentLines,
        entryNodes: consequentEntryNodes,
        exitNodes: consequentExitNodes
      } = transformAstToGraph(statement.consequent)

      // // 处理if为false的语句 alternate的body为数组
      const {
        nodes: alternateNodes,
        lines: alternateLines,
        entryNodes: alternateEntryNodes,
        exitNodes: alternateExitNodes
      } = !isNullOrUndefined(statement.alternate)
        ? transformAstToGraph(statement.alternate)
        : {
            nodes: [],
            lines: [],
            entryNodes: [],
            exitNodes: [ifNode],
            breakNodes: []
          }
      const ifLines = [
        ...getLines(consequentEntryNodes, 'true', ifNode.id),
        ...getLines(alternateEntryNodes, 'false', ifNode.id)
      ]
      // let loopStartLine = []
      // if(statement.loopStart) {
      //   loopStartLine.push({

      //   })
      // }
      const startLine = []
      if (statement.prevNodeId) {
        startLine.push({
          from: statement.prevNodeId,
          to: statement.selfId,
          name: '',
          type: 'solid',
          arrow: true
        })
      }
      // return 的数据就是每次body为数组时的collection
      return {
        nodes: [ifNode, ...consequentNodes, ...alternateNodes],
        lines: [
          ...startLine,
          ...ifLines,
          ...consequentLines,
          ...alternateLines
        ],
        entryNodes: [ifNode],
        exitNodes: [...consequentExitNodes, ...alternateExitNodes],
        breakNodes: [],
        subNodes: []
      }
    case 'ForStatement':
      console.log('ForStatement')
      statement.selfId = getUuid()
      const forNode = {
        id: statement.selfId,
        name: replaceDoubleToSingleQuotes(
          `for (${generate(statement.init).code})`
        ),
        shape: 'square'
      }
      const {
        nodes: forBodyNodes,
        lines: forBodyLines,
        entryNodes: forBodyEntryNodes,
        exitNodes: forBodyExitNodes,
        breakNodes: forBodyBreakNodes
      } = transformAstToGraph(statement.body)

      const forLines = [
        ...fp.map(
          node => ({
            from: forNode.id,
            to: node.id,
            name: generate(statement.test).code,
            type: 'solid',
            arrow: true
          }),
          forBodyEntryNodes
        ),
        ...fp.map(
          node => ({
            from: node.id,
            to: forNode.id,
            name: generate(statement.update).code,
            type: 'solid',
            arrow: true
          }),
          forBodyExitNodes
        )
      ]

      return {
        nodes: [forNode, ...forBodyNodes],
        lines: [...forLines, ...forBodyLines],
        entryNodes: [forNode],
        exitNodes: [...forBodyBreakNodes, forNode],
        breakNodes: [],
        subNodes: []
      }
    case 'ForInStatement':
    case 'ForOfStatement':
      console.log('ForOfStatement')
      statement.selfId = getUuid()
      const forInNode = {
        id: statement.selfId,
        name: delSemi(
          replaceDoubleToSingleQuotes(
            `for (${generate(statement.left).code} in ${
              generate(statement.right).code
            })`
          )
        ),
        shape: 'square'
      }
      const {
        nodes: forInBodyNodes,
        lines: forInBodyLines,
        entryNodes: forInBodyEntryNodes,
        exitNodes: forInBodyExitNodes,
        breakNodes: forInBodyBreakNodes
      } = transformAstToGraph(statement.body)

      const forInLines = [
        ...forInBodyEntryNodes.map(node => ({
          from: forInNode.id,
          to: node.id,
          name: 'do',
          type: 'solid',
          arrow: true
        })),
        ...forInBodyExitNodes.map(node => ({
          from: node.id,
          to: forInNode.id,
          name: 'loop',
          type: 'solid',
          arrow: true
        }))
      ]

      return {
        nodes: [forInNode, ...forInBodyNodes],
        lines: [...forInLines, ...forInBodyLines],
        entryNodes: [forInNode],
        exitNodes: [...forInBodyBreakNodes, forInNode],
        breakNodes: [],
        subNodes: []
      }
    case 'CatchClause':
      return transformAstToGraph(statement.body)
    case 'TryStatement':
      console.log('TryStatement')
      const {
        nodes: blockNodes,
        lines: blockLines,
        entryNodes: blockEntryNodes,
        exitNodes: blockExitNodes,
        breakNodes: blockBreakNodes,
        subNodes: blockSubNodes
      } = fp.isObject(statement.block)
        ? transformAstToGraph(statement.block)
        : emptyGraph
      const {
        nodes: finalizerNodes,
        lines: finalizerEdges,
        entryNodes: finalizerEntryNodes,
        exitNodes: finalizerExitNodes,
        breakNodes: finalizerBreakNodes,
        subNodes: finalizerSubGraphs
      } = fp.isObject(statement.finalizer)
        ? transformAstToGraph(statement.finalizer)
        : emptyGraph
      const {
        nodes: handlerNodes,
        lines: handlerEdges,
        entryNodes: handlerEntryNodes,
        exitNodes: handlerExitNodes,
        breakNodes: handlerBreakNodes,
        subNodes: handlerSubGraphs
      } = fp.isObject(statement.handler)
        ? transformAstToGraph(statement.handler)
        : emptyGraph
      const blockToFinallyEdges = fp.isObject(statement.finalizer)
        ? fp.flatten(
            blockExitNodes.map(blockExitNode => {
              return finalizerEntryNodes.map(finalizerEntryNode => {
                return {
                  from: blockExitNode.id,
                  to: finalizerEntryNode.id,
                  name: '',
                  type: 'solid',
                  arrow: true
                }
              })
            })
          )
        : []
      const handlerToFinallyEdges = fp.isObject(statement.finalizer)
        ? fp.flatten(
            handlerExitNodes.map(handlerExitNode => {
              return finalizerEntryNodes.map(finalizerEntryNode => {
                return {
                  from: handlerExitNode.id,
                  to: finalizerEntryNode.id,
                  name: '',
                  type: 'solid',
                  arrow: true
                }
              })
            })
          )
        : []
      const blockToHandlerEdges = fp.isObject(statement.handler)
        ? fp.flatten(
            blockNodes.map(blockNode => {
              return handlerEntryNodes.map(handlerEntryNode => {
                return {
                  from: blockNode.id,
                  to: handlerEntryNode.id,
                  name: 'error',
                  type: 'dotted',
                  arrow: true
                }
              })
            })
          )
        : []
      return {
        nodes: [],
        lines: [
          ...blockToFinallyEdges,
          ...handlerToFinallyEdges,
          ...blockToHandlerEdges
        ],
        entryNodes: [...blockEntryNodes],
        exitNodes: fp.isObject(statement.finalizer)
          ? [...finalizerExitNodes]
          : [...blockExitNodes],
        breakNodes: [...finalizerBreakNodes, ...blockBreakNodes],
        subNodes: [
          ...(fp.isObject(statement.block)
            ? [
                {
                  name: 'try',
                  id: getUuid(),
                  graph: {
                    nodes: blockNodes,
                    lines: blockLines,
                    entryNodes: blockEntryNodes,
                    exitNodes: blockExitNodes,
                    breakNodes: blockBreakNodes,
                    subNodes: blockSubNodes
                  }
                }
              ]
            : []),
          ...(fp.isObject(statement.finalizer)
            ? [
                {
                  name: 'finally',
                  id: getUuid(),
                  graph: {
                    nodes: finalizerNodes,
                    lines: finalizerEdges,
                    entryNodes: finalizerEntryNodes,
                    exitNodes: finalizerExitNodes,
                    breakNodes: finalizerBreakNodes,
                    subNodes: finalizerSubGraphs
                  }
                }
              ]
            : []),
          ...(fp.isObject(statement.handler)
            ? [
                {
                  name: 'catch',
                  id: getUuid(),
                  graph: {
                    nodes: handlerNodes,
                    lines: handlerEdges,
                    entryNodes: handlerEntryNodes,
                    exitNodes: handlerExitNodes,
                    breakNodes: handlerBreakNodes,
                    subNodes: handlerSubGraphs
                  }
                }
              ]
            : [])
        ]
      }
    case 'WhileStatement':
      console.log('WhileStatement')
      statement.selfId = getUuid()
      const whileNode = {
        id: statement.selfId,
        name: `while ${generate(statement.test).code}`,
        shape: 'rhombus'
      }
      const {
        nodes: bodyNodes,
        lines: bodyLines,
        entryNodes: bodyEntryNodes,
        exitNodes: bodyExitNodes
      } = transformAstToGraph(statement.body)

      const whileLines = [
        ...getLines(bodyEntryNodes, 'do', whileNode.id),
        ...bodyExitNodes.map(node => {
          return {
            from: node.id,
            to: whileNode.id,
            name: 'loop',
            type: 'solid',
            arrow: true
          }
        })
      ]

      const whileLine = []
      if (statement.prevNodeId) {
        whileLine.push({
          from: statement.prevNodeId,
          to: statement.selfId,
          name: '',
          type: 'solid',
          arrow: true
        })
      }
      return {
        nodes: [whileNode, ...bodyNodes],
        lines: [...whileLine, ...whileLines, ...bodyLines],
        entryNodes: [whileNode],
        exitNodes: [whileNode],
        breakNodes: [],
        subNodes: []
      }
    case 'DoWhileStatement':
      console.log('DoWhileStatement')
      statement.selfId = getUuid()
      const doWhileNode = {
        id: statement.selfId,
        name: `do while ${generate(statement.test).code}`,
        shape: 'rhombus'
      }
      const {
        nodes: doWhileNodes,
        lines: doWhileLines,
        entryNodes: doWhileEntryNodes,
        exitNodes: doWhileExitNodes
      } = transformAstToGraph(statement.body)

      const thisEdges = [
        ...doWhileExitNodes.map(node => {
          return {
            to: doWhileNode.id,
            from: node.id,
            name: 'do',
            type: 'solid',
            arrow: true
          }
        }),
        ...doWhileEntryNodes.map(node => {
          return {
            to: node.id,
            from: doWhileNode.id,
            name: 'loop',
            type: 'solid',
            arrow: true
          }
        })
      ]

      const doWhileLine = []
      if (statement.prevNodeId) {
        doWhileLine.push({
          from: statement.prevNodeId,
          to: statement.selfId,
          name: '',
          type: 'solid',
          arrow: true
        })
      }

      return {
        nodes: [doWhileNode, ...doWhileNodes],
        lines: [...doWhileLine, ...thisEdges, ...doWhileLines],
        entryNodes: [...doWhileEntryNodes],
        exitNodes: [doWhileNode],
        breakNodes: [],
        subNodes: []
      }
    case 'FunctionExpression':
      return transformAstToGraph(statement.body)
    case 'VariableDeclarator':
      console.log('VariableDeclarator')
      const conditionTypes = [
        'ConditionalExpression',
        'LogicalExpression',
        'FunctionExpression',
        'ArrowFunctionExpression'
      ]
      statement.init.variableName = statement.id.name
      if (!conditionTypes.includes(statement.init.type)) {
        return { ...emptyGraph }
      } else {
        const {
          nodes: declaratorBodyNodes,
          lines: declaratorBodyLines,
          entryNodes: declaratorBodyEntryNodes,
          exitNodes: declaratorBodyExitNodes,
          breakNodes: declaratorBodyBreakNodes
        } = transformAstToGraph(statement.init)
        return {
          nodes: [...declaratorBodyNodes],
          lines: [...declaratorBodyLines],
          entryNodes: [...declaratorBodyEntryNodes],
          exitNodes: [...declaratorBodyExitNodes],
          breakNodes: [...declaratorBodyBreakNodes],
          subNodes: []
        }
      }
    case 'VariableDeclaration':
      console.log('VariableDeclaration')
      statement.selfId = getUuid()
      const types = [
        'ConditionalExpression',
        'FunctionExpression',
        'ArrowFunctionExpression'
      ]
      const literalsDeclarators = statement.declarations.filter(declarator => {
        return !types.includes(declarator.init.type)
      })
      const literalsDeclarations = {
        ...statement,
        declarations: [...literalsDeclarators]
      }
      const name = generate(literalsDeclarations).code
      const {
        nodes: initNodes,
        lines: initLines,
        entryNodes: initEntryNodes,
        exitNodes: initExitNodes,
        breakNodes: initBreakNodes
      } = transformAstToGraph(statement.declarations)
      const variableNode = {
        id: statement.selfId,
        name,
        shape: 'round'
      }
      // 兼容三目运算符等表达式
      let literalsNodes = [variableNode]
      if (initNodes.length) {
        literalsNodes = []
      }
      return {
        nodes: [...literalsNodes, ...initNodes],
        lines: [...initLines],
        entryNodes: [...literalsNodes, ...initEntryNodes],
        exitNodes: [...literalsNodes, ...initExitNodes],
        breakNodes: [...initBreakNodes],
        subNodes: []
      }
    case 'SwitchStatement':
      console.log('SwitchStatement')
      statement.selfId = getUuid()
      const switchNode = {
        id: statement.selfId,
        name: `switch ${generate(statement.discriminant).code} `,
        shape: 'rhombus'
      }
      const scopeGraph = statement.cases.reduce(
        (
          { nodes, lines, entryNodes, exitNodes, breakNodes },
          caseAstElement
        ) => {
          const {
            nodes: caseNodes,
            lines: caseLines,
            entryNodes: caseEntryNodes,
            exitNodes: caseExitNodes,
            breakNodes: caseBreakNodes
          } = transformAstToGraph(caseAstElement.consequent)
          const caseEntryLines = caseEntryNodes.map(node => ({
            from: switchNode.id,
            to: node.id,
            name: fp.isEmpty(caseAstElement.test)
              ? 'default'
              : `case ${generate(caseAstElement.test).code}`,
            type: 'solid',
            arrow: true
          }))

          const caseFollowLines = fp.flatten(
            exitNodes.map(exitNode =>
              caseEntryNodes.map(entryNode => ({
                from: exitNode.id,
                to: entryNode.id,
                name: '',
                type: 'solid',
                arrow: true
              }))
            )
          )
          return {
            nodes: [...nodes, ...caseNodes],
            lines: fp.compact([
              ...lines,
              ...caseLines,
              ...caseEntryLines,
              ...caseFollowLines
            ]),
            entryNodes: [...entryNodes],
            exitNodes: [...caseExitNodes],
            breakNodes: [...breakNodes, ...caseBreakNodes]
          }
        },
        {
          nodes: [switchNode],
          lines: [],
          entryNodes: [switchNode],
          exitNodes: [],
          breakNodes: []
        }
      )

      return {
        nodes: [...scopeGraph.nodes],
        lines: [...scopeGraph.lines],
        entryNodes: [...scopeGraph.entryNodes],
        exitNodes: [...scopeGraph.breakNodes],
        breakNodes: [],
        subNodes: []
      }
    case 'BreakStatement':
      console.log('BreakStatement')
      statement.selfId = getUuid()
      const breakNode = {
        id: statement.selfId,
        name: generate(statement).code,
        shape: 'square'
      }
      return {
        nodes: [breakNode],
        lines: [],
        entryNodes: [breakNode],
        exitNodes: [],
        breakNodes: [breakNode],
        subNodes: []
      }
    case 'ReturnStatement':
      console.log('ReturnStatement')
      console.error(statement.prefix)
      let returnNode = []
      let returnExitNodes = []
      if (statement.prefix) {
        returnNode = [
          {
            id: getUuid(),
            name:
              statement.prefix +
              replaceDoubleToSingleQuotes(generate(statement).code),
            shape: 'square',
            style: { fill: '#99FF99' }
          }
        ]
        returnExitNodes = [...returnNode]
      } else {
        returnNode = [
          {
            id: getUuid(),
            name: replaceDoubleToSingleQuotes(generate(statement).code),
            shape: 'asymetric',
            style: { fill: '#99FF99' }
          }
        ]
      }
      return {
        nodes: [...returnNode],
        lines: [],
        entryNodes: [...returnNode],
        exitNodes: [...returnExitNodes],
        breakNodes: [],
        subNodes: []
      }
    // case 'MemberExpression':
    //   console.error('MemberExpression')
    //   statement.selfId = getUuid()
    //   console.log(statement)
    //   const memberExpressionNode = {
    //     id: statement.selfId,
    //     name: `${statement.variableName} = ${generate(statement).code}`,
    //     shape: 'square'
    //   }
    //   return {
    //     nodes: [memberExpressionNode],
    //     lines: [],
    //     entryNodes: [memberExpressionNode],
    //     exitNodes: [memberExpressionNode],
    //     breakNodes: [],
    //     subNodes: []
    //   }
    case 'CallExpression':
      // 函数调用
      console.error('CallExpression')
      statement.selfId = getUuid()
      // 判断是否是数组forEach等, 是的话, 要生成一个节点及循环的连线
      let arrLoopNode = []
      if (
        statement.callee &&
        arrLoopMethods.includes(statement.callee.property.name)
      ) {
        statement.arguments.forEach(item => {
          item.loop = statement.callee.property.name
          item.loopStartId = statement.selfId
        })
        arrLoopNode = [
          {
            id: statement.selfId,
            name: generate(statement.callee).code,
            shape: 'square'
          }
        ]
      }
      if (statement.prefix) {
        statement.arguments.forEach(item => {
          item.prefix = statement.prefix
        })
      }
      const {
        nodes: callExpressionNodes,
        lines: callExpressionLines,
        entryNodes: callExpressionEntryNodes,
        exitNodes: callExpressionExitNodes
      } = transformAstToGraph(statement.arguments)
      let callExpressionNode = []
      const callExpressionLine = []
      if (!callExpressionNodes.length) {
        // `${statement.variableName} = ${generate(statement).code}`
        callExpressionNode = [
          {
            id: statement.selfId,
            name: `${generate(statement).code}`,
            shape: 'square'
          }
        ]
        if (statement.loop) {
          if (statement.loopStart) {
            callExpressionLine.push({
              from: statement.loopStartId,
              to: statement.selfId,
              name: 'do',
              type: 'solid',
              arrow: true
            })
          }
          if (statement.loopEnd) {
            callExpressionLine.push({
              from: statement.selfId,
              to: statement.loopStartId,
              name: 'loop',
              type: 'solid',
              arrow: true
            })
          }
        }
      }
      const entryNodes = [...callExpressionNode]
      // 只有当循环中有值的时候才给该节点添加连线
      if (hasBody[statement.selfId]) {
        entryNodes.push(...arrLoopNode)
      }
      if (!arrLoopNode.length) {
        entryNodes.push(...callExpressionEntryNodes)
      }

      return {
        nodes: [...callExpressionNode, ...callExpressionNodes, ...arrLoopNode],
        lines: [...callExpressionLines, ...callExpressionLine],
        entryNodes: entryNodes,
        exitNodes: [...callExpressionNode, ...callExpressionExitNodes],
        breakNodes: [],
        subNodes: []
      }
    case 'ConditionalExpression':
      console.log('三目运算符')
      statement.selfId = getUuid()
      statement.consequent.variableName = statement.variableName
      statement.alternate.variableName = statement.variableName
      // 提前给consequent/alternate节点设置selfId属性, 用于生成连线
      statement.consequent.selfId = getUuid()
      statement.alternate.selfId = getUuid()
      const conditionalNode = {
        id: statement.selfId,
        name: replaceDoubleToSingleQuotes(`${generate(statement.test).code}`),
        shape: 'square'
      }
      const conditionLines = []
      let leftConditionNodes = []
      let leftConditionLines = []
      let rightConditionNodes = []
      let rightConditionLines = []
      let conditionConsequentNode = []
      let conditionAlterNode = []
      let leftEntryNodes = []
      let rightEntryNodes = []
      let leftExitNodes = []
      let rightExitNodes = []
      const conditionExpressionTypes = [
        'ConditionalExpression',
        'CallExpression',
        'MemberExpression'
      ]
      if (conditionExpressionTypes.includes(statement.consequent.type)) {
        ;({
          nodes: leftConditionNodes,
          lines: leftConditionLines,
          entryNodes: leftEntryNodes,
          exitNodes: leftExitNodes
        } = transformAstToGraph(statement.consequent))
        conditionLines.push({
          from: conditionalNode.id,
          to: statement.consequent.selfId,
          name: 'true',
          type: 'solid',
          arrow: true
        })
        console.error(leftEntryNodes)
      } else {
        conditionConsequentNode = [
          {
            id: statement.consequent.selfId,
            name: `${statement.variableName} = ${
              generate(statement.consequent).code
            }`,
            shape: 'square'
          }
        ]
        conditionLines.push({
          from: conditionalNode.id,
          to: conditionConsequentNode[0].id,
          name: 'true',
          type: 'solid',
          arrow: true
        })
      }
      if (conditionExpressionTypes.includes(statement.alternate.type)) {
        ;({
          nodes: rightConditionNodes,
          lines: rightConditionLines,
          entryNodes: rightEntryNodes,
          exitNodes: rightExitNodes
        } = transformAstToGraph(statement.alternate))
        conditionLines.push({
          from: conditionalNode.id,
          to: statement.alternate.selfId,
          name: 'false',
          type: 'solid',
          arrow: true
        })
        console.error(rightEntryNodes)
      } else {
        conditionAlterNode = [
          {
            id: statement.alternate.selfId,
            name: `${statement.variableName} = ${
              generate(statement.alternate).code
            }`,
            shape: 'square'
          }
        ]
        console.error(conditionAlterNode)
        conditionLines.push({
          from: conditionalNode.id,
          to: conditionAlterNode[0].id,
          name: 'false',
          type: 'solid',
          arrow: true
        })
      }
      return {
        nodes: [
          conditionalNode,
          ...conditionConsequentNode,
          ...conditionAlterNode,
          ...leftConditionNodes,
          ...rightConditionNodes
        ],
        lines: [
          ...conditionLines,
          ...leftConditionLines,
          ...rightConditionLines
        ],
        entryNodes: [conditionalNode],
        exitNodes: [
          ...conditionConsequentNode,
          ...conditionAlterNode,
          ...leftExitNodes,
          ...rightExitNodes
        ],
        breakNodes: [],
        subNodes: []
      }
    case 'LogicalExpression':
      console.log('LogicalExpression')
      return emptyGraph
    // statement.left.variableName = statement.variableName
    // statement.right.variableName = statement.variableName
    // statement.left.nextOperator = statement.operator
    // statement.right.nextOperator = statement.operator
    // const orOperator = '||'
    // const andOperator = '&&'
    // statement.selfId = getUuid()
    // let leftLogicalNode = []
    // let rightLogicalNode = []
    // let leftLogicalNodes = []
    // let leftLogicalLines = []
    // let rightLogicalNodes = []
    // let rightLogicalLines = []
    // let leftLogicalExitNodes = []
    // let rightLogicalEntryNodes = []
    // let leftLogicalEntryNodes = []
    // let rightLogicalExitNodes = []
    // let leftJudgeNodes = []
    // let rightJudgeNodes = []

    // // if (statement.operator === orOperator) {
    // if (statement.left.type === 'LogicalExpression') {
    //   // 属于第一层的statement.left中的right对象都加上标识
    //   statement.left.right.entry = 'left'
    //   ;({
    //     nodes: leftLogicalNodes,
    //     lines: leftLogicalLines,
    //     entryNodes: leftLogicalEntryNodes,
    //     exitNodes: leftLogicalExitNodes
    //   } = transformAstToGraph(statement.left))
    //   console.error(transformAstToGraph(statement.left))
    // } else {
    //   // 只处理第一层左侧的
    //   if (
    //     statement.extra &&
    //     statement.extra.parenthesized &&
    //     statement.nextOperator === orOperator
    //   ) {
    //   } else {
    //     leftLogicalNode = [
    //       {
    //         id: getUuid(),
    //         name: `${statement.variableName} = ${statement.left.name ||
    //           statement.left.value}`,
    //         shape: 'square'
    //       }
    //     ]
    //   }
    //   leftJudgeNodes = [
    //     {
    //       id: getUuid(),
    //       name: `${statement.left.name || statement.left.value}`,
    //       shape: 'square'
    //     }
    //   ]
    // }

    // if (statement.right.type === 'LogicalExpression') {
    //   ;({
    //     nodes: rightLogicalNodes,
    //     lines: rightLogicalLines,
    //     entryNodes: rightLogicalEntryNodes,
    //     exitNodes: rightLogicalExitNodes
    //   } = transformAstToGraph(statement.right))
    // } else {
    //   console.error(
    //     statement,
    //     `${statement.right.name || statement.right.value}`
    //   )
    //   rightLogicalNode = [
    //     {
    //       id: getUuid(),
    //       name: `${statement.variableName} = ${statement.right.name ||
    //         statement.right.value}`,
    //       shape: 'square'
    //     }
    //   ]
    //   // 最后一个节点不作为判断节点, 直接返回
    //   if (!statement.entry) {
    //     rightJudgeNodes = [
    //       {
    //         id: getUuid(),
    //         name: `${statement.right.name || statement.right.value}`,
    //         shape: 'square'
    //       }
    //     ]
    //   }
    // }
    // console.error([
    //   ...leftLogicalNode,
    //   ...rightLogicalNode,
    //   ...leftJudgeNodes,
    //   ...rightJudgeNodes,
    //   ...leftLogicalNodes,
    //   ...rightLogicalNodes
    // ])
    // return {
    //   nodes: [
    //     ...leftLogicalNode,
    //     ...rightLogicalNode,
    //     ...leftJudgeNodes,
    //     ...rightJudgeNodes,
    //     ...leftLogicalNodes,
    //     ...rightLogicalNodes
    //   ],
    //   lines: [],
    //   entryNodes: [],
    //   exitNodes: [],
    //   breakNodes: [],
    //   subNodes: []
    // }
    default:
      return emptyGraph
  }
}
