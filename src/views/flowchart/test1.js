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