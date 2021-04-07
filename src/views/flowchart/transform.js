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

const allJudgeNodes = []

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
  return uuid
}

function isNullOrUndefined(val) {
  if (val === null || val === undefined) {
    return true
  }
  return false
}

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

function makeIdFromAstNode(astNode) {
  return `froml${astNode.loc.start.line}c${astNode.loc.start.column}tol${astNode.loc.end.line}c${astNode.loc.end.column}`
}

function setNodeName(statement, prefix) {
  const text = isNullOrUndefined(statement.id)
    ? makeIdFromAstNode(statement)
    : generate(statement.id).code
  return `${prefix}${text}`
}

// 将name中的双引号用单引号代替
function replaceDoubleToSingleQuotes(str) {
  return str.replace(/(")/g, "'")
}

function isObject(val) {
  return Object.prototype.toString.call(val) == '[object Object]'
}

export function transformAstToGraph(ast) {
  if (Array.isArray(ast)) {
    return transformStatementSequenceToGraph(ast)
  } else {
    return setType(ast)
  }
}

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
    case 'Program':
      return transformAstToGraph(statement.body)
    case 'FunctionDeclaration':
      console.log('function')
      // 设置标识父级id, 用于确定连线起始点
      statement.selfId = makeIdFromAstNode(statement)
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
    // function 声明后面的{ body  为数组
    case 'BlockStatement':
      if (
        statement.prevNodeId &&
        Array.isArray(statement.body) &&
        statement.body.length
      ) {
        statement.body[0].prevNodeId = statement.prevNodeId
      }
      return transformAstToGraph(statement.body)
    case 'ExpressionStatement':
      console.log('ExpressionStatement')
      statement.selfId = makeIdFromAstNode(statement)
      const expressionNode = {
        id: statement.selfId,
        name: generate(statement).code,
        shape: 'round'
      }
      const expressionLine = []
      if (statement.prevNodeId) {
        expressionLine.push({
          from: statement.prevNodeId,
          to: statement.selfId,
          name: '',
          type: 'solid',
          arrow: true
        })
      }
      return {
        nodes: [expressionNode],
        lines: [...expressionLine],
        entryNodes: [expressionNode],
        exitNodes: [expressionNode],
        breakNodes: [],
        subNodes: []
      }
    case 'IfStatement':
      // 找到其上一个节点, 与当前节点建立连线
      console.log('if')
      statement.selfId = makeIdFromAstNode(statement)
      const ifNode = {
        id: statement.selfId,
        name: replaceDoubleToSingleQuotes(
          `if(${generate(statement.test).code})`
        ),
        shape: 'rhombus'
      }
      // 处理if为true时的语句 consequent中的body为数组
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
            breakNodes: [],
            breakNodes: []
          }
      const ifLines = [
        ...getLines(consequentEntryNodes, 'true', ifNode.id),
        ...getLines(alternateEntryNodes, 'false', ifNode.id)
      ]
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
        subNodes: []
      }
    case 'ForStatement':
      console.log('for')
      statement.selfId = makeIdFromAstNode(statement)
      // ; ${
      //   generate(statement.test).code
      // } ; ${generate(statement.update).code}
      const forNode = {
        id: statement.selfId,
        name: replaceDoubleToSingleQuotes(
          `for (${generate(statement.init).code})`
        ),
        shape: 'rhombus'
      }
      console.log(forNode)
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
      console.log('for...in')
      statement.selfId = makeIdFromAstNode(statement)
      const forInNode = {
        id: statement.selfId,
        name: delSemi(
          replaceDoubleToSingleQuotes(
            `for (${generate(statement.left).code} in ${
              generate(statement.right).code
            })`
          )
        ),
        shape: 'rhombus'
      }
      console.log(forInNode)
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
      console.log('try')
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
                  id: makeIdFromAstNode(statement.block),
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
                  id: makeIdFromAstNode(statement.finalizer),
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
                  id: makeIdFromAstNode(statement.handler),
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
      console.log('WhileStatement', statement)
      statement.selfId = makeIdFromAstNode(statement)
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
      console.log('do...while')
      statement.selfId = makeIdFromAstNode(statement)
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
    case 'VariableDeclarator':
      console.log('VariableDeclarator')
      const declaratornode = {
        id: makeIdFromAstNode(statement),
        name: replaceDoubleToSingleQuotes(generate(statement).code),
        shape: 'round'
      }
      const conditionTypes = ['ConditionalExpression', 'LogicalExpression']
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
        // console.log(transformAstToGraph(statement.init))
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
      statement.selfId = makeIdFromAstNode(statement)
      const types = ['ConditionalExpression']
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
      console.log(initNodes.length)
      console.log(literalsNodes)
      return {
        nodes: [...literalsNodes, ...initNodes],
        lines: [...initLines],
        entryNodes: [...literalsNodes, ...initEntryNodes],
        exitNodes: [...literalsNodes, ...initExitNodes],
        breakNodes: [...initBreakNodes],
        subNodes: []
      }
    case 'SwitchStatement':
      // debugger
      console.log('switch')
      statement.selfId = makeIdFromAstNode(statement)
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
      console.log('break')
      statement.selfId = makeIdFromAstNode(statement)
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
      console.log('return')
      const returnNode = {
        id: makeIdFromAstNode(statement),
        name: replaceDoubleToSingleQuotes(generate(statement).code),
        shape: 'asymetric',
        style: { fill: '#99FF99' }
      }
      return {
        nodes: [returnNode],
        lines: [],
        entryNodes: [returnNode],
        exitNodes: [],
        breakNodes: [],
        subNodes: []
      }
    case 'ConditionalExpression':
      console.log('三目运算符')
      console.log(statement)
      statement.selfId = makeIdFromAstNode(statement)
      const conditionalNode = {
        id: statement.selfId,
        name: replaceDoubleToSingleQuotes(`${generate(statement.test).code}`),
        shape: 'rhombus'
      }
      // console.log(conditionalNode)

      const conditionConseQuentNode = {
        name: `${statement.variableName} = ${statement.consequent.value}`,
        id: makeIdFromAstNode(statement.consequent),
        shape: 'square'
      }
      // console.log(conditionConseQuentNode)
      // // // 处理if为false的语句 alternate的body为数组
      const conditionAlterNode = {
        name: `${statement.variableName} = ${statement.alternate.value}`,
        id: makeIdFromAstNode(statement.alternate),
        shape: 'square'
      }

      console.log(conditionAlterNode)
      const conditionLines = [
        ...getLines([conditionConseQuentNode], 'true', conditionalNode.id),
        ...getLines([conditionAlterNode], 'false', conditionalNode.id)
      ]
      // console.log(conditionLines)
      return {
        nodes: [
          conditionalNode,
          ...[conditionConseQuentNode],
          ...[conditionAlterNode]
        ],
        lines: [...conditionLines],
        entryNodes: [conditionalNode],
        exitNodes: [...[conditionConseQuentNode], ...[conditionAlterNode]],
        breakNodes: [],
        subNodes: []
      }
    case 'LogicalExpression':
      console.log('LogicalExpression')
      statement.left.variableName = statement.variableName
      statement.right.variableName = statement.variableName
      statement.selfId = makeIdFromAstNode(statement)
      const orOperator = '||'
      const andOperator = '&&'
      let leftNode = []
      let rightNode = []
      let leftNodes = []
      let leftLines = []
      let rightNodes = []
      let rightLines = []
      let exitLeftNodes = []
      let entryRightNodes = []
      let entryLeftNodes = []
      let exitRightNodes = []
      let leftJudgeNode = []
      let rightJudgeNode = []
      const newLines = []
      // 处理有括号的情况
      if (statement.extra && statement.extra.parenthesized) {
        if (statement.left.type === 'LogicalExpression') {
          // 兼容逻辑运算符的最后一个值不需要生成判断节点
          statement.left.isLastNode = true
          ;({
            nodes: leftNodes,
            lines: leftLines,
            entryNodes: entryLeftNodes,
            exitNodes: exitLeftNodes
          } = transformAstToGraph(statement.left))
        } else {
          // 为false的节点
          // leftNode = [
          //   {
          //     id: getUuid(),
          //     name: `${statement.variableName} = ${statement.left.name ||
          //       statement.left.value}`,
          //     shape: 'square'
          //   }
          // ]
          // console.error(leftNode)

          // 判断节点
          leftJudgeNode = [
            {
              id: getUuid(),
              name: statement.left.name || statement.left.value,
              shape: 'square'
            }
          ]
          console.error(leftJudgeNode)
          // if (statement.operator === andOperator) {
          //   newLines.push({
          //     from: leftJudgeNode[0].id,
          //     to: leftNode[0].id,
          //     name: 'false',
          //     type: 'solid',
          //     arrow: true
          //   })
          // } else if (statement.operator === orOperator) {
          //   newLines.push({
          //     from: leftJudgeNode[0].id,
          //     to: leftNode[0].id,
          //     name: 'true',
          //     type: 'solid',
          //     arrow: true
          //   })
          // }
          allJudgeNodes.push(leftJudgeNode[0])
        }

        if (statement.right.type === 'LogicalExpression') {
          console.log('right LogicalExpression')
          ;({
            nodes: rightNodes,
            lines: rightLines,
            entryNodes: entryRightNodes,
            exitNodes: exitRightNodes
          } = transformAstToGraph(statement.right))
        } else {
          rightNode = [
            {
              id: getUuid(),
              name: `${statement.variableName} = ${statement.right.name ||
                statement.right.value}`,
              shape: 'square'
            }
          ]
          console.error(rightNode)
          if (statement.isLastNode) {
            rightJudgeNode = [
              {
                id: getUuid(),
                name: statement.right.name || statement.right.value,
                shape: 'square'
              }
            ]

            // if (statement.operator === andOperator) {
            //   newLines.push({
            //     from: rightJudgeNode[0].id,
            //     to: rightNode[0].id,
            //     name: 'false',
            //     type: 'solid',
            //     arrow: true
            //   })
            // } else if (statement.operator === orOperator) {
            //   newLines.push({
            //     from: rightJudgeNode[0].id,
            //     to: rightNode[0].id,
            //     name: 'true',
            //     type: 'solid',
            //     arrow: true
            //   })
            // }
            console.error(rightJudgeNode)
            allJudgeNodes.push(rightJudgeNode[0])
          } else {
            allJudgeNodes.push(rightNode[0])
          }
        }
        // for (let i = 0; i < allJudgeNodes.length - 1; i++) {
        //   if (statement.operator === andOperator) {
        //     newLines.push({
        //       from: allJudgeNodes[i].id,
        //       to: allJudgeNodes[i + 1].id,
        //       name: 'true',
        //       type: 'solid',
        //       arrow: true
        //     })
        //   } else if (statement.operator === orOperator) {
        //     newLines.push({
        //       from: allJudgeNodes[i].id,
        //       to: allJudgeNodes[i + 1].id,
        //       name: 'false',
        //       type: 'solid',
        //       arrow: true
        //     })
        //   }
        // }
        // if (statement.operator === andOperator) {
        //   leftLines = leftLines.filter(item => item.name === 'false')
        //   rightLines = rightLines.filter(item => item.name === 'false')
        // } else if (statement.operator === orOperator) {
        //   leftLines = leftLines.filter(item => item.name === 'true')
        //   rightLines = rightLines.filter(item => item.name === 'true')
        // }
      } else {
        if (statement.left.type === 'LogicalExpression') {
          // 兼容逻辑运算符的最后一个值不需要生成判断节点
          statement.left.isLastNode = true
          ;({
            nodes: leftNodes,
            lines: leftLines,
            entryNodes: entryLeftNodes,
            exitNodes: exitLeftNodes
          } = transformAstToGraph(statement.left))
        } else {
          // 为false的节点
          leftNode = [
            {
              id: getUuid(),
              name: `${statement.variableName} = ${statement.left.name ||
                statement.left.value}`,
              shape: 'square'
            }
          ]

          // 判断节点
          leftJudgeNode = [
            {
              id: getUuid(),
              name: statement.left.name || statement.left.value,
              shape: 'square'
            }
          ]
          if (statement.operator === andOperator) {
            newLines.push({
              from: leftJudgeNode[0].id,
              to: leftNode[0].id,
              name: 'false',
              type: 'solid',
              arrow: true
            })
          } else if (statement.operator === orOperator) {
            newLines.push({
              from: leftJudgeNode[0].id,
              to: leftNode[0].id,
              name: 'true',
              type: 'solid',
              arrow: true
            })
          }
          allJudgeNodes.push(leftJudgeNode[0])
        }
        // right
        if (statement.right.type === 'LogicalExpression') {
          console.log('right LogicalExpression')
          ;({
            nodes: rightNodes,
            lines: rightLines,
            entryNodes: entryRightNodes,
            exitNodes: exitRightNodes
          } = transformAstToGraph(statement.right))
        } else {
          rightNode = [
            {
              id: getUuid(),
              name: `${statement.variableName} = ${statement.right.name ||
                statement.right.value}`,
              shape: 'square'
            }
          ]
          if (statement.isLastNode) {
            rightJudgeNode = [
              {
                id: getUuid(),
                name: statement.right.name || statement.right.value,
                shape: 'square'
              }
            ]

            if (statement.operator === andOperator) {
              newLines.push({
                from: rightJudgeNode[0].id,
                to: rightNode[0].id,
                name: 'false',
                type: 'solid',
                arrow: true
              })
            } else if (statement.operator === orOperator) {
              newLines.push({
                from: rightJudgeNode[0].id,
                to: rightNode[0].id,
                name: 'true',
                type: 'solid',
                arrow: true
              })
            }

            allJudgeNodes.push(rightJudgeNode[0])
          } else {
            allJudgeNodes.push(rightNode[0])
          }
        }
        for (let i = 0; i < allJudgeNodes.length - 1; i++) {
          if (statement.operator === andOperator) {
            newLines.push({
              from: allJudgeNodes[i].id,
              to: allJudgeNodes[i + 1].id,
              name: 'true',
              type: 'solid',
              arrow: true
            })
          } else if (statement.operator === orOperator) {
            newLines.push({
              from: allJudgeNodes[i].id,
              to: allJudgeNodes[i + 1].id,
              name: 'false',
              type: 'solid',
              arrow: true
            })
          }
        }
        if (statement.operator === andOperator) {
          leftLines = leftLines.filter(item => item.name === 'false')
          rightLines = rightLines.filter(item => item.name === 'false')
        } else if (statement.operator === orOperator) {
          leftLines = leftLines.filter(item => item.name === 'true')
          rightLines = rightLines.filter(item => item.name === 'true')
        }
      }
      return {
        nodes: [
          ...leftNode,
          ...rightNode,
          ...leftJudgeNode,
          ...rightJudgeNode,
          ...leftNodes,
          ...rightNodes
        ],
        lines: [...leftLines, ...rightLines, ...newLines],
        entryNodes: [...leftJudgeNode, ...entryLeftNodes, ...entryRightNodes],
        exitNodes: [
          ...leftNode,
          ...rightNode,
          ...exitLeftNodes,
          ...exitRightNodes
        ],
        breakNodes: [],
        subNodes: []
      }
    default:
      break
  }
}
