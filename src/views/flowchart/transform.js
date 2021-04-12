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
let index = 0

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
  index++
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

function delSemi(str) {
  return str.replace(';', '')
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

function setType(statement) {
  switch (statement.type) {
    case 'File':
      return transformAstToGraph(statement.program)
    case 'Program':
      return transformAstToGraph(statement.body)
    case 'FunctionDeclaration':
      // 函数声明
      console.log('FunctionDeclaration', statement)
      statement.mark = getUuid()
      return {
        nodes: [],
        lines: [],
        entryNodes: [],
        exitNodes: [],
        breakNodes: [],
        subNodes: [
          {
            name: setNodeName(statement, 'function '),
            id: statement.mark,
            shape: 'rhombus',
            graph: transformAstToGraph(statement.body)
          }
        ]
      }
    case 'ExportNamedDeclaration':
      // export
      return transformAstToGraph(statement.declaration)
    case 'FunctionExpression':
      // 函数表达式
      console.log('FunctionExpression')
      statement.mark = getUuid()
      return transformAstToGraph(statement.body)
    case 'ArrowFunctionExpression':
      // 箭头函数
      // 处理数组循环语句
      // if (statement.loop) {
      //   statement.body.loop = statement.loop
      //   statement.body.loopStartId = statement.loopStartId
      // }
      return transformAstToGraph(statement.body)
    case 'BlockStatement':
      // 块{}
      console.log('BlockStatement')
      statement.mark = getUuid()
      // 表明数组fo村换的第一个语句及最后一个语句, 用于确定loop连线的起点和终点
      // if (statement.loop) {
      //   hasBody[statement.loopStartId] = !!statement.body.length
      // }
      // if (statement.loop && statement.body.length) {
      //   statement.body[0].loop = statement.loop
      //   statement.body[0].loopStartId = statement.loopStartId
      //   statement.body[0].loopStart = true
      //   statement.body[statement.body.length - 1].loop = statement.loop
      //   statement.body[statement.body.length - 1].loopStartId =
      //     statement.loopStartId
      //   statement.body[statement.body.length - 1].loopEnd = true
      // }
      return transformAstToGraph(statement.body)
    case 'VariableDeclaration':
      // 变量声明
      console.log('VariableDeclaration')
      statement.mark = getUuid()

      const {
        nodes: initDeclarationNodes,
        lines: initDeclarationLines,
        entryNodes: initDeclarationEntryNodes,
        exitNodes: initDeclarationExitNodes,
        breakNodes: initDeclarationBreakNodes
      } = transformAstToGraph(statement.declarations)
      let variableDeclarationNode = []
      if (!initDeclarationNodes.length) {
        const types = ['FunctionExpression']
        const declarators = statement.declarations.filter(declarator => {
          return !types.includes(declarator.init.type)
        })
        const initDeclarators = {
          ...statement,
          declarations: [...declarators]
        }
        const name = generate(initDeclarators).code

        variableDeclarationNode = [
          {
            id: statement.mark,
            name,
            shape: 'round'
          }
        ]
      }
      return {
        nodes: [...variableDeclarationNode, ...initDeclarationNodes],
        lines: [...initDeclarationLines],
        entryNodes: [...initDeclarationEntryNodes],
        exitNodes: [...initDeclarationExitNodes],
        breakNodes: [...initDeclarationBreakNodes],
        subNodes: []
      }
    case 'VariableDeclarator':
      // 变量声明的描述, id表示变量名称节点, init表示初始值, 可为null
      console.log('VariableDeclarator')
      statement.mark = getUuid()
      // 将变量名保存到init中, 方便赋值
      statement.init.variableName = statement.id.name
      const {
        nodes: VariableDeclaratorNodes,
        lines: VariableDeclaratorLines,
        entryNodes: VariableDeclaratorEntryNodes,
        exitNodes: VariableDeclaratorExitNodes,
        breakNodes: VariableDeclaratorBreakNodes
      } = statement.init ? transformAstToGraph(statement.init) : [...emptyGraph]

      return {
        nodes: [...VariableDeclaratorNodes],
        lines: [...VariableDeclaratorLines],
        entryNodes: [...VariableDeclaratorEntryNodes],
        exitNodes: [...VariableDeclaratorExitNodes],
        breakNodes: [...VariableDeclaratorBreakNodes],
        subNodes: []
      }
    case 'AssignmentExpression':
      // 赋值节点表达式
      console.log('AssignmentExpression')
      statement.mark = getUuid()
      // 用于判断赋值表达式中得return节点的值的前缀
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
            id: statement.mark,
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
      // 表达式语句节点
      console.log('ExpressionStatement')
      statement.mark = getUuid()

      // if (statement.loop) {
      //   statement.expression.loop = statement.loop
      //   statement.expression.loopStartId = statement.loopStartId
      //   if (statement.loopStart) {
      //     statement.expression.loopStart = statement.loopStart
      //   }
      //   if (statement.loopEnd) {
      //     statement.expression.loopEnd = statement.loopEnd
      //   }
      // }
      const {
        nodes: expressionStatNodes,
        lines: expressionStatLines,
        entryNodes: expressionStatEntryNodes,
        exitNodes: expressionStatExitNodes
      } = transformAstToGraph(statement.expression)
      // console.log(transformAstToGraph(statement.expression))
      let expressionStatNode = []
      if (!expressionStatNodes.length) {
        expressionStatNode = [
          {
            id: statement.mark,
            name: generate(statement).code,
            shape: 'round'
          }
        ]
      }
      return {
        nodes: [...expressionStatNode, ...expressionStatNodes],
        lines: [...expressionStatLines],
        entryNodes: [...expressionStatNode, ...expressionStatEntryNodes],
        exitNodes: [...expressionStatNode, ...expressionStatExitNodes],
        breakNodes: [],
        subNodes: []
      }
    case 'SwitchStatement':
      console.log('SwitchStatement')
      statement.mark = getUuid()
      const switchNode = {
        id: statement.mark,
        name: `switch(${generate(statement.discriminant).code})`,
        shape: 'square'
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
    case 'IfStatement':
      // if语句
      console.log('IfStatement')
      statement.mark = getUuid()
      const ifNode = {
        id: statement.mark,
        name: replaceDoubleToSingleQuotes(
          `if(${generate(statement.test).code})`
        ),
        shape: 'square'
      }
      const ifLoopLines = []

      // consequent中的body为数组

      // 处理if为true时的语句 consequent中的body为数组
      const {
        nodes: consequentNodes,
        lines: consequentLines,
        entryNodes: consequentEntryNodes,
        exitNodes: consequentExitNodes
      } = transformAstToGraph(statement.consequent)
      console.log(transformAstToGraph(statement.consequent))

      // 处理if为false的语句 alternate的body为数组
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
      const startLine = []
      // return 的数据就是每次body为数组时的collection
      return {
        nodes: [ifNode, ...consequentNodes, ...alternateNodes],
        lines: [
          ...startLine,
          ...ifLines,
          ...ifLoopLines,
          ...consequentLines,
          ...alternateLines
        ],
        entryNodes: [ifNode],
        exitNodes: [...consequentExitNodes, ...alternateExitNodes],
        breakNodes: [],
        subNodes: []
      }
    case 'CallExpression':
      // 调用表达式 callee标识函数; arguments为数组, 代表参数
      console.error('CallExpression')
      statement.mark = getUuid()
      // 判断是否是forEach, 需要生成一个forEach节点及forEach的回调函数中的第一个语句及最后一个语句
      let arrLoopNode = []
      if (
        statement.callee &&
        arrLoopMethods.includes(statement.callee.property.name)
      ) {
        // statement.arguments.forEach(item => {
        //   item.loop = statement.callee.property.name
        //   item.loopStartId = statement.mark
        // })
        arrLoopNode = [
          {
            id: statement.mark,
            name: generate(statement.callee).code,
            shape: 'square'
          }
        ]
      }
      const callExpressionLine = []

      const {
        nodes: callExpressionNodes,
        lines: callExpressionLines,
        entryNodes: callExpressionEntryNodes,
        exitNodes: callExpressionExitNodes
      } = transformAstToGraph(statement.arguments)
      // 当for循环时, 拿到内部的开始节点和离开节点, 添加连线
      if (arrLoopNode.length) {
        if (callExpressionEntryNodes.length) {
          callExpressionLine.push({
            from: arrLoopNode[0].id,
            to: callExpressionEntryNodes[0].id,
            name: 'do',
            type: 'solid',
            arrow: true
          })
        }
        if (callExpressionExitNodes.length) {
          callExpressionExitNodes.forEach(item => {
            callExpressionLine.push({
              from: item.id,
              to: arrLoopNode[0].id,
              name: 'loop',
              type: 'solid',
              arrow: true
            })
          })
        }
      }
      console.log(callExpressionNodes)
      console.log(callExpressionEntryNodes)
      let callExpressionNode = []
      if (!callExpressionNodes.length) {
        // `${statement.variableName} = ${generate(statement).code}`
        callExpressionNode = [
          {
            id: statement.mark,
            name: `${generate(statement).code}`,
            shape: 'square'
          }
        ]
        // if (statement.loop) {
        // if (statement.loopStart) {
        //   callExpressionLine.push({
        //     from: statement.loopStartId,
        //     to: statement.mark,
        //     name: 'do',
        //     type: 'solid',
        //     arrow: true
        //   })
        // }
        // if (statement.loopEnd) {
        //   callExpressionLine.push({
        //     from: statement.mark,
        //     to: statement.loopStartId,
        //     name: 'loop',
        //     type: 'solid',
        //     arrow: true
        //   })
        // }
        // }
      }
      const entryNodes = [...callExpressionNode]
      // 只有当循环中有值的时候才给该节点添加连线
      if (hasBody[statement.mark]) {
        entryNodes.push(...arrLoopNode)
      }
      if (!arrLoopNode.length) {
        entryNodes.push(...callExpressionEntryNodes)
      }

      return {
        nodes: [...callExpressionNode, ...arrLoopNode, ...callExpressionNodes],
        lines: [...callExpressionLines, ...callExpressionLine],
        entryNodes: entryNodes,
        exitNodes: [...callExpressionNode, ...callExpressionExitNodes],
        breakNodes: [],
        subNodes: []
      }
    case 'ConditionalExpression':
      // 三目运算符 consequent为真, alternate为false时执行的
      console.log('ConditionalExpression')
      statement.mark = getUuid()
      // 增加返回前缀
      if (statement.variableName) {
        statement.consequent.variableName = statement.variableName
        statement.alternate.variableName = statement.variableName
      }
      // 兼容(flag ? obj1 : obj2).name 返回值
      if (statement.property) {
        statement.consequent.property = statement.property
        statement.alternate.property = statement.property
      }

      // 标识return节点
      if (statement.isReturn) {
        statement.consequent.isReturn = statement.isReturn
        statement.alternate.isReturn = statement.isReturn
      }
      // 提前给consequent/alternate节点设置mark属性, 用于生成连线
      statement.consequent.mark = getUuid()
      statement.alternate.mark = getUuid()
      const conditionalNode = {
        id: statement.mark,
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
          to: statement.consequent.mark,
          name: 'true',
          type: 'solid',
          arrow: true
        })
      } else {
        let consequentNodeName = statement.variableName
          ? `${statement.variableName} = ${generate(statement.consequent).code}`
          : generate(statement.consequent).code

        if (statement.property) {
          consequentNodeName = `${consequentNodeName}.${statement.property}`
        }
        if (statement.isReturn) {
          consequentNodeName = `return ${consequentNodeName}`
        }
        conditionConsequentNode = [
          {
            id: statement.consequent.mark,
            name: consequentNodeName,
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
          to: statement.alternate.mark,
          name: 'false',
          type: 'solid',
          arrow: true
        })
      } else {
        let alterNodeName = statement.variableName
          ? `${statement.variableName} = ${generate(statement.alternate).code}`
          : generate(statement.alternate).code
        if (statement.property) {
          alterNodeName = `${alterNodeName}.${statement.property}`
        }
        if (statement.isReturn) {
          alterNodeName = `return ${alterNodeName}`
        }
        conditionAlterNode = [
          {
            id: statement.alternate.mark,
            name: alterNodeName,
            shape: 'square'
          }
        ]
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
    case 'WhileStatement':
      console.log('WhileStatement')
      statement.mark = getUuid()
      const whileNode = {
        id: statement.mark,
        name: `while(${generate(statement.test).code})`,
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
      // if (statement.prevNodeId) {
      //   whileLine.push({
      //     from: statement.prevNodeId,
      //     to: statement.selfId,
      //     name: '',
      //     type: 'solid',
      //     arrow: true
      //   })
      // }
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
      statement.mark = getUuid()
      const doWhileNode = {
        id: statement.mark,
        name: `do while(${generate(statement.test).code})`,
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
      // if (statement.prevNodeId) {
      //   doWhileLine.push({
      //     from: statement.prevNodeId,
      //     to: statement.selfId,
      //     name: '',
      //     type: 'solid',
      //     arrow: true
      //   })
      // }

      return {
        nodes: [doWhileNode, ...doWhileNodes],
        lines: [...doWhileLine, ...thisEdges, ...doWhileLines],
        entryNodes: [...doWhileEntryNodes],
        exitNodes: [doWhileNode],
        breakNodes: [],
        subNodes: []
      }
    case 'ForStatement':
      console.log('ForStatement')
      statement.mark = getUuid()
      const forNode = {
        id: statement.mark,
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
      statement.mark = getUuid()
      const forInNode = {
        id: statement.mark,
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
        exitNodes: [forInNode, ...forInBodyBreakNodes],
        breakNodes: [],
        subNodes: []
      }
    case 'CatchClause':
      return transformAstToGraph(statement.body)
    case 'TryStatement':
      // block: try中执行语句；handler: catch节点; finalizer: finally语句节点
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
    case 'BreakStatement':
      console.log('BreakStatement')
      statement.mark = getUuid()
      const breakNode = {
        id: statement.mark,
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
      // return表达式节点, argument代表返回的内容, 可为null
      console.log('ReturnStatement')
      statement.mark = getUuid()
      if (statement.argument) {
        statement.argument.isReturn = true
      }
      const {
        nodes: returnStatNodes,
        lines: returnStatLines,
        entryNodes: returnStatEntryNodes,
        exitNodes: returnStatExitNodes
        // breakNodes: returnStatBreakNodes,
      } = statement.argument
        ? transformAstToGraph(statement.argument)
        : { ...emptyGraph }
      let returnNode = []
      if (!returnStatNodes.length) {
        returnNode = [
          {
            id: statement.mark,
            name: replaceDoubleToSingleQuotes(generate(statement).code),
            shape: 'asymetric'
          }
        ]
      }
      return {
        nodes: [...returnNode, ...returnStatNodes],
        lines: [...returnStatLines],
        entryNodes: [...returnNode, ...returnStatEntryNodes],
        exitNodes: [...returnStatExitNodes],
        breakNodes: [],
        subNodes: []
      }
    case 'MemberExpression':
      console.log('MemberExpression')
      statement.mark = getUuid()
      // 兼容obj调用时返回obj.name
      if (statement.property) {
        statement.object.property = statement.property.name
      }
      // 标识return节点
      if (statement.isReturn) {
        statement.object.isReturn = statement.isReturn
      }
      return transformAstToGraph(statement.object)
    default:
      // throw new Error(`${statement.type} is not supported`)
      return emptyGraph
  }
}
