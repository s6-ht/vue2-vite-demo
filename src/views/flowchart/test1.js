console.log('LogicalExpression')
statement.left.variableName = statement.variableName
statement.right.variableName = statement.variableName
statement.selfId = makeIdFromAstNode(statement)
const logicalNode = {}
const orOperator = '||'
const andOperator = '&&'
const logicalLines = []
let leftNode = {}
let rightNode = {}
let leftNodes = []
let leftLines = []
let rightNodes = []
let rightLines = []
let exitLeftNodes = []
let exitRightNodes = []
let entryLeftNodes = []
let entryRightNodes = []
let judgeLeftNode = {}
const rightNodeId = makeIdFromAstNode(statement.right)
const rightJudgeId = makeIdFromAstNode(statement)
if (statement.operator === andOperator) {
  if (statement.left.type === 'LogicalExpression') {
    // 兼容逻辑运算符的最后一个值不需要生成判断节点
    statement.left.isJudge = true
    ;({
      nodes: leftNodes,
      lines: leftLines,
      entryNodes: entryLeftNodes,
      exitNodes: exitLeftNodes
    } = transformAstToGraph(statement.left))
    console.log(transformAstToGraph(statement.left))
  } else {
    // 为false的节点
    leftNode = {
      id: makeIdFromAstNode(statement.left),
      name: `${statement.variableName} = ${statement.left.name ||
        statement.left.value}`,
      shape: 'square'
    }
    // 判断节点
    judgeLeftNode = {
      id: new Date().getTime(),
      name: statement.left.name || statement.left.value,
      shape: 'square'
    }
    leftNodes.push(leftNode, judgeLeftNode)
    logicalLines.push(
      {
        from: judgeLeftNode.id,
        to: leftNode.id,
        name: 'false',
        type: 'solid',
        arrow: true
      },
      {
        from: judgeLeftNode.id,
        to: rightJudgeId,
        name: 'true',
        type: 'solid',
        arrow: true
      }
    )
  }

  if (statement.right.type === 'LogicalExpression') {
    ;({
      nodes: rightNodes,
      lines: rightLines,
      entryNodes: entryRightNodes,
      exitNodes: exitRightNodes
    } = transformAstToGraph(statement.right))
  } else {
    // 为false的节点
    rightNode = {
      id: rightNodeId,
      name: `${statement.variableName} = ${statement.right.name ||
        statement.right.value}`,
      shape: 'square'
    }
    rightNodes = [rightNode]
    // 判断节点
    let rightJudgeNode
    if (statement.isJudge) {
      rightJudgeNode = {
        id: rightJudgeId,
        name: statement.right.name || statement.right.value,
        shape: 'square'
      }
      tempFormId = rightJudgeNode.id
      rightNodes.push(rightJudgeNode)
      logicalLines.push({
        from: rightJudgeNode.id,
        to: rightNode.id,
        name: 'false',
        type: 'solid',
        arrow: true
      })
    }

    if (!rightJudgeNode) {
      logicalLines.push({
        from: tempFormId,
        to: rightNode.id,
        name: 'true',
        type: 'solid',
        arrow: true
      })
    }
  }
}
const exitNodes = []
if (JSON.stringify(leftNode) !== '{}') {
  exitNodes.push(leftNode)
}
if (JSON.stringify(rightNode) !== '{') {
  exitNodes.push(rightNode)
}

const entryNodes = []
if (JSON.stringify(judgeLeftNode) !== '{}') {
  entryNodes.push(judgeLeftNode)
}
return {
  nodes: [...leftNodes, ...rightNodes],
  lines: [...logicalLines, ...leftLines, ...rightLines],
  entryNodes: [...entryNodes, ...entryRightNodes, ...entryLeftNodes],
  exitNodes: [...exitNodes, ...exitRightNodes, ...exitLeftNodes],
  breakNodes: [],
  subNodes: []
}
