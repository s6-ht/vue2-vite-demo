import generate from "@babel/generator";
import fp from "lodash/fp";

const emptyGraph = {
  nodes: [],
  lines: [],
  entryNodes: [],
  exitNodes: [],
  subNodes: [],
  breakNodes: []
};

const line = {
  form: "",
  to: "",
  name: "",
  type: "",
  arrw: true
};

const arrLoopMethods = [
  "forEach",
  "every",
  "filter",
  "find",
  "flatMap",
  "from",
  "map",
  "some",
  "sort"
];

function getUuid() {
  var s = [];
  var hexDigits = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (var i = 0; i < 36; i++) {
    s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
  }
  s[14] = "4";
  s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);
  s[8] = s[13] = s[18] = s[23] = "-";
  const uuid = s.join("");
  return uuid.substr(0, 8);
}

function isNullOrUndefined(val) {
  if (val === null || val === undefined) {
    return true;
  }
  return false;
}

function setNodeName(statement, prefix) {
  const text = isNullOrUndefined(statement.id)
    ? getUuid()
    : generate(statement.id).code;
  return `${prefix}${text}`;
}

// 将name中的双引号用单引号代替
function replaceDoubleToSingleQuotes(str) {
  return str.replace(/("|`)/g, "'");
}

export function transformAstToGraph(ast) {
  if (Array.isArray(ast)) {
    return transformStatementSequenceToGraph(ast);
  } else {
    return setType(ast);
  }
}

export let functionDeclaratioinObj = {};
export let judgeNodes = {};

function transformStatementSequenceToGraph(statements) {
  const collection = statements.map(statement =>
    transformAstToGraph(statement)
  );
  let result = collection.reduce(
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
      // console.log(currentEntryNodes)
      return {
        nodes: [...nodes, ...currentNodes],
        lines: [
          ...lines,
          ...currentLines,
          // 当前项的离开节点与下一项的开始节点生成连线
          ...fp.flatten(
            exitNodes.map(exitNode =>
              currentEntryNodes.map(entryNode => ({
                from: exitNode.id,
                to: entryNode.id,
                name: entryNode.condition,
                type: "solid",
                arrow: true
              }))
            )
          )
        ],
        entryNodes: fp.isEmpty(entryNodes) ? currentEntryNodes : entryNodes,
        exitNodes: currentExitNodes,
        breakNodes: [...breakNodes, ...currentBreakNodes],
        subNodes: [...subNodes, ...currentSubNodes]
      };
    },
    {
      ...emptyGraph
    }
  );
  // 记录函数声明的节点和连线
  return result;
}

function delSemi(str) {
  return str.replace(";", "");
}

function getLines(arr, text, fromNodeId) {
  return arr.map(node => {
    return {
      from: fromNodeId,
      to: node.id,
      name: text,
      type: "solid",
      arrow: true
    };
  });
}

function setType(statement) {
  // 不生成注释节点
  if (statement.leadingComments && statement.leadingComments.length) {
    statement.leadingComments = null;
  }
  try {
    switch (statement.type) {
      case "File":
        return transformAstToGraph(statement.program);
      case "Program":
        return transformAstToGraph(statement.body);
      case "FunctionDeclaration":
        // console.error("FunctionDeclaration");
        // 函数声明
        // console.log('FunctionDeclaration', statement)
        // TODO: 当一个函数中含有另外一个函数时, 需要区分这个函数属于在哪一个函数之中
        // TODO： 记录每个一函数声明的位置, 存一个数组, 遇到下一个函数声明时, 与这个数组里面的进行比较
        statement.mark = getUuid();
        if (statement.body.type === "BlockStatement") {
          statement.body.parentType = statement.type;
        }
        let graph = transformAstToGraph(statement.body);
        let curAllNodes = [];
        let curAllLines = [];
        for (let key in functionDeclaratioinObj) {
          if (
            functionDeclaratioinObj[key].start.line >
              statement.loc.start.line &&
            functionDeclaratioinObj[key].end.line < statement.loc.end.line
          ) {
            curAllLines.push(...functionDeclaratioinObj[key].lines);
            curAllNodes.push(...functionDeclaratioinObj[key].nodes);
          }
        }

        if (!functionDeclaratioinObj[statement.mark]) {
          functionDeclaratioinObj = {
            ...functionDeclaratioinObj,
            [statement.mark]: {
              start: statement.loc.start,
              end: statement.loc.end,
              lines: [...graph.lines, ...curAllLines],
              nodes: [...graph.nodes, ...curAllNodes]
            }
          };
        }
        // console.error(functionDeclaratioinObj);

        return {
          nodes: [],
          lines: [],
          entryNodes: [...graph.entryNodes],
          exitNodes: [...graph.exitNodes],
          breakNodes: [],
          subNodes: [
            {
              name: replaceDoubleToSingleQuotes(
                setNodeName(statement, "function ")
              ),
              id: statement.mark,
              shape: "rhombus",
              graph: graph
            }
          ]
        };
      case "ExportNamedDeclaration":
        // export
        return transformAstToGraph(statement.declaration);
      case "FunctionExpression":
        // 函数表达式
        // console.error("FunctionExpression");

        statement.mark = getUuid();
        if (statement.body.type === "BlockStatement") {
          statement.body.parentType = statement.type;
        }
        let funcExpressionGraph = transformAstToGraph(statement.body);
        let curFuncExpressionAllNodes = [];
        let curFuncExpressionAllLines = [];
        for (let key in functionDeclaratioinObj) {
          if (
            functionDeclaratioinObj[key].start.line >
              statement.loc.start.line &&
            functionDeclaratioinObj[key].end.line < statement.loc.end.line
          ) {
            curFuncExpressionAllLines.push(
              ...functionDeclaratioinObj[key].lines
            );
            curFuncExpressionAllNodes.push(
              ...functionDeclaratioinObj[key].nodes
            );
          }
        }

        if (!functionDeclaratioinObj[statement.mark]) {
          functionDeclaratioinObj = {
            ...functionDeclaratioinObj,
            [statement.mark]: {
              start: statement.loc.start,
              end: statement.loc.end,
              lines: [
                ...funcExpressionGraph.lines,
                ...curFuncExpressionAllLines
              ],
              nodes: [
                ...funcExpressionGraph.nodes,
                ...curFuncExpressionAllNodes
              ]
            }
          };
        }
        // console.error(functionDeclaratioinObj);

        return {
          nodes: [],
          lines: [],
          entryNodes: [...funcExpressionGraph.entryNodes],
          exitNodes: [...funcExpressionGraph.exitNodes],
          breakNodes: [],
          subNodes: [
            {
              name: replaceDoubleToSingleQuotes(
                setNodeName(statement, "function ")
              ),
              id: statement.mark,
              shape: "rhombus",
              graph: funcExpressionGraph
            }
          ]
        };
      // return transformAstToGraph(statement.body);
      case "ArrowFunctionExpression":
        // console.log(transformAstToGraph(statement.body))
        statement.mark = getUuid();
        if (statement.body.type === "BlockStatement") {
          statement.body.parentType = statement.type;
        }
        let arrowFuncExpressionGraph = transformAstToGraph(statement.body);
        let curArrowFuncExpressionAllNodes = [];
        let curArrowFuncExpressionAllLines = [];
        for (let key in functionDeclaratioinObj) {
          if (
            functionDeclaratioinObj[key].start.line >
              statement.loc.start.line &&
            functionDeclaratioinObj[key].end.line < statement.loc.end.line
          ) {
            curArrowFuncExpressionAllLines.push(
              ...functionDeclaratioinObj[key].lines
            );
            curArrowFuncExpressionAllNodes.push(
              ...functionDeclaratioinObj[key].nodes
            );
          }
        }

        if (!functionDeclaratioinObj[statement.mark]) {
          functionDeclaratioinObj = {
            ...functionDeclaratioinObj,
            [statement.mark]: {
              start: statement.loc.start,
              end: statement.loc.end,
              lines: [
                ...arrowFuncExpressionGraph.lines,
                ...curArrowFuncExpressionAllLines
              ],
              nodes: [
                ...arrowFuncExpressionGraph.nodes,
                ...curArrowFuncExpressionAllNodes
              ]
            }
          };
        }
        // console.error(functionDeclaratioinObj);

        return {
          nodes: [],
          lines: [],
          entryNodes: [...arrowFuncExpressionGraph.entryNodes],
          exitNodes: [...arrowFuncExpressionGraph.exitNodes],
          breakNodes: [],
          subNodes: [
            {
              name: replaceDoubleToSingleQuotes(
                setNodeName(statement, "function ")
              ),
              id: statement.mark,
              shape: "rhombus",
              graph: arrowFuncExpressionGraph
            }
          ]
        };
      // return transformAstToGraph(statement.body);
      case "BlockStatement":
        // 块{}
        // console.log('BlockStatement')
        statement.mark = getUuid();
        if (statement.parentType) {
          statement.body.forEach(item => {
            item.parentType = statement.parentType;
          });
        }

        return transformAstToGraph(statement.body);
      case "VariableDeclaration":
        // 变量声明
        // console.error("VariableDeclaration");
        statement.mark = getUuid();

        const {
          nodes: initDeclarationNodes,
          lines: initDeclarationLines,
          entryNodes: initDeclarationEntryNodes,
          exitNodes: initDeclarationExitNodes,
          breakNodes: initDeclarationBreakNodes,
          subNodes: initDeclarationSubnodes
        } = transformAstToGraph(statement.declarations);

        let variableDeclarationNode = [];
        if (!initDeclarationNodes.length && !initDeclarationSubnodes.length) {
          const types = ["FunctionExpression"];
          const declarators = statement.declarations.filter(declarator => {
            return !declarator.init || !types.includes(declarator.init.type);
          });
          let initDeclarators = {
            ...statement,
            declarations: [...declarators]
          };
          // 防止注释生成节点

          const name = replaceDoubleToSingleQuotes(
            generate(initDeclarators).code
          );

          variableDeclarationNode = [
            {
              id: statement.mark,
              name,
              shape: "round"
            }
          ];
        }
        // console.log([...variableDeclarationNode, ...initDeclarationExitNodes])
        return {
          nodes: [...variableDeclarationNode, ...initDeclarationNodes],
          lines: [...initDeclarationLines],
          entryNodes: [
            ...variableDeclarationNode,
            ...initDeclarationEntryNodes
          ],
          exitNodes: [...variableDeclarationNode, ...initDeclarationExitNodes],
          breakNodes: [...initDeclarationBreakNodes],
          subNodes: [...initDeclarationSubnodes]
        };
      case "VariableDeclarator":
        // 变量声明的描述, id表示变量名称节点, init表示初始值, 可为null(eg: 只声明未赋值)
        statement.mark = getUuid();
        // 将变量名保存到init中, 方便赋值
        if (statement.init) {
          statement.init.variableName = statement.id.name;
          if (statement.init.type === "LogicalExpression") {
            statement.init.right.isRightNode = true;
            if (
              statement.init.left.extra &&
              statement.init.left.extra.parenthesized
            ) {
              statement.init.left.right.isRightNode = true;
            } else {
              statement.init.left.isRightNode = true;
            }
          }
        }
        const {
          nodes: VariableDeclaratorNodes,
          lines: VariableDeclaratorLines,
          entryNodes: VariableDeclaratorEntryNodes,
          exitNodes: VariableDeclaratorExitNodes,
          breakNodes: VariableDeclaratorBreakNodes,
          subNodes: VariableDeclaratorSubnodes
        } = statement.init ? transformAstToGraph(statement.init) : emptyGraph;
        // console.error(transformAstToGraph(statement.init));
        return {
          nodes: [...VariableDeclaratorNodes],
          lines: [...VariableDeclaratorLines],
          entryNodes: [...VariableDeclaratorEntryNodes],
          exitNodes: [...VariableDeclaratorExitNodes],
          breakNodes: [...VariableDeclaratorBreakNodes],
          subNodes: [...VariableDeclaratorSubnodes]
        };
      case "AssignmentExpression":
        // 赋值节点表达式
        statement.mark = getUuid();
        // 用于判断赋值表达式中得return节点的值的前缀
        // 三目运算符返回值的前缀 let res = flag ? 1 : 2  ---> let res =
        if (statement.right.type === "ConditionalExpression") {
          statement.right.variableName = generate(statement.left).code;
        }
        const {
          nodes: assignmentExpressionNodes,
          lines: assignmentExpressionLines,
          entryNodes: assignmentExpressionEntryNodes,
          exitNodes: assignmentExpressionExitNodes
        } = transformAstToGraph(statement.right);
        // console.error(assignmentExpressionNodes)
        let assignmentExpressionNode = [];
        // 如果内部没有额外的节点返回, 生成一个该节点
        if (!assignmentExpressionNodes.length) {
          assignmentExpressionNode = [
            {
              id: statement.mark,
              name: replaceDoubleToSingleQuotes(generate(statement).code),
              shape: "round"
            }
          ];
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
        };
      case "ExpressionStatement":
        // 表达式语句节点
        statement.mark = getUuid();

        const {
          nodes: expressionStatNodes,
          lines: expressionStatLines,
          entryNodes: expressionStatEntryNodes,
          exitNodes: expressionStatExitNodes
        } = transformAstToGraph(statement.expression);
        let expressionStatNode = [];
        if (!expressionStatNodes.length) {
          expressionStatNode = [
            {
              id: statement.mark,
              name: replaceDoubleToSingleQuotes(generate(statement).code),
              shape: "round"
            }
          ];
        }
        return {
          nodes: [...expressionStatNode, ...expressionStatNodes],
          lines: [...expressionStatLines],
          entryNodes: [...expressionStatNode, ...expressionStatEntryNodes],
          exitNodes: [...expressionStatNode, ...expressionStatExitNodes],
          breakNodes: [],
          subNodes: []
        };
      case "LogicalExpression":
        // console.log("LogicalExpression", statement);
        statement.mark = getUuid();
        statement.left.mark = getUuid();
        statement.right.mark = getUuid();
        if (statement.variableName) {
          statement.left.variableName = statement.variableName;
          statement.right.variableName = statement.variableName;
        }
        let logicalLeftNodes = [];
        let logicalRightNodes = [];
        let logicalLeftNode = [];
        let logicalRightNode = [];
        if (statement.left.type === "LogicalExpression") {
          console.log(statement);
          if (statement.left.isRightNode) {
            // 属于右边的内容，但是含有括号时, 左边的节点不生成
            if (!statement.left.extra || !statement.left.extra.parenthesized) {
              statement.left.left.isRightNode = true;
            }

            statement.left.right.isRightNode = true;
          }
          // if (statement.left.extra && statement.left.extra.parenthesized) {
          //   // 标识left左边存在的最后一个节点(如果存在括号，则表示括号中的所有节点)
          //   statement.left.right.isLeftLastNode = true;
          // }
          // if(statement.left.left.extra && statement.left.left.extra.parenthesized) {

          // }
          ({ nodes: logicalLeftNodes } = transformAstToGraph(statement.left));
        } else {
          console.log(statement.left.name, statement.left.isRightNode);
          logicalLeftNode = [
            {
              id: statement.left.mark,
              name: statement.left.name,
              shape: "square"
            }
          ];
          // if (statement.isRight) {
          // if (statement.extra && statement.extra.parenthesized) {
          // logicalLeftNode.push({
          //   id: getUuid(),
          //   name: `${statement.variableName} = ${statement.left.name}`
          // });
          // }
          // }
        }

        if (statement.right.type === "LogicalExpression") {
          // 存在括号, 括号里面的节点都需要生成res=
          // console.log(statement);
          if (statement.right.isRightNode) {
            if (
              !statement.right.extra ||
              !statement.right.extra.parenthesized
            ) {
            }
            statement.right.left.isRightNode = true;
            statement.right.right.isRightNode = true;
          }
          ({ nodes: logicalRightNodes } = transformAstToGraph(statement.right));
        } else {
          console.log(statement.right.name, statement.right.isRightNode);
          logicalRightNode = [
            {
              id: statement.right.mark,
              name: statement.right.name,
              shape: "square"
            }
          ];
          // if (statement.parentOperator) {
          // logicalRightNode.push({
          //   id: getUuid(),
          //   name: `${statement.variableName} = ${statement.right.name}`,
          //   shape: "square"
          // });
          // }
        }

        return {
          nodes: [
            ...logicalLeftNode,
            ...logicalLeftNodes,
            ...logicalRightNodes,
            ...logicalRightNode
          ],
          lines: [],
          entryNodes: [],
          exitNodes: [],
          breakNodes: [],
          subNodes: []
        };
      case "SwitchStatement":
        // console.log('SwitchStatement')
        statement.mark = getUuid();
        const switchNode = {
          id: statement.mark,
          name: replaceDoubleToSingleQuotes(
            `switch(${generate(statement.discriminant).code})`
          ),
          shape: "square"
        };
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
            } = transformAstToGraph(caseAstElement.consequent);
            const caseEntryLines = caseEntryNodes.map(node => ({
              from: switchNode.id,
              to: node.id,
              name: replaceDoubleToSingleQuotes(
                fp.isEmpty(caseAstElement.test)
                  ? "default"
                  : `case ${generate(caseAstElement.test).code}`
              ),
              type: "solid",
              arrow: true
            }));

            const caseFollowLines = fp.flatten(
              exitNodes.map(exitNode =>
                caseEntryNodes.map(entryNode => ({
                  from: exitNode.id,
                  to: entryNode.id,
                  name: "",
                  type: "solid",
                  arrow: true
                }))
              )
            );
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
            };
          },
          {
            nodes: [switchNode],
            lines: [],
            entryNodes: [switchNode],
            exitNodes: [],
            breakNodes: []
          }
        );
        if (!judgeNodes[statement.mark]) {
          let childItem = {};
          for (let item in judgeNodes) {
            let node = judgeNodes[item];
            if (
              node.start.line > statement.loc.start.line &&
              node.end.line <= statement.loc.end.line
            ) {
              childItem[node.mark] = node;
              delete judgeNodes[item];
            }
          }
          let childNodes = { ...childItem };
          if (childNodes.child) {
            Object.assign(childNodes, { ...childNodes.child });
          }
          judgeNodes[statement.mark] = {
            type: "SwitchStatement",
            start: statement.loc.start,
            end: statement.loc.end,
            mark: statement.mark,
            child: childNodes,
            nodes: [...scopeGraph.nodes],
            lines: [...scopeGraph.lines]
          };
        }
        return {
          nodes: [...scopeGraph.nodes],
          lines: [...scopeGraph.lines],
          entryNodes: [...scopeGraph.entryNodes],
          exitNodes: [...scopeGraph.breakNodes],
          breakNodes: [],
          subNodes: []
        };
      case "IfStatement":
        // if语句
        // console.log('IfStatement')
        statement.mark = getUuid();
        const ifNode = {
          id: statement.mark,
          name: replaceDoubleToSingleQuotes(
            `if(${generate(statement.test).code})`
          ),
          shape: "square"
        };

        // consequent中的body为数组
        // 处理if为true时的语句 consequent中的body为数组
        const {
          nodes: consequentNodes,
          lines: consequentLines,
          entryNodes: consequentEntryNodes,
          exitNodes: consequentExitNodes
        } = transformAstToGraph(statement.consequent);
        // console.log(transformAstToGraph(statement.consequent))

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
            };
        const ifLines = [
          ...getLines(consequentEntryNodes, "true", ifNode.id),
          ...getLines(alternateEntryNodes, "false", ifNode.id)
        ];
        const startLine = [];
        // return 的数据就是每次body为数组时的collection
        // 根据位置进行判断, 如果节点的位置位于当前节点的区域内，删除该节点
        if (!judgeNodes[statement.mark]) {
          let childItem = {};
          for (let item in judgeNodes) {
            let node = judgeNodes[item];
            if (
              node.start.line > statement.loc.start.line &&
              node.end.line <= statement.loc.end.line
            ) {
              childItem[node.mark] = node;
              delete judgeNodes[item];
            }
          }
          let childNodes = { ...childItem };
          if (childNodes.child) {
            Object.assign(childNodes, { ...childNodes.child });
          }
          judgeNodes[statement.mark] = {
            type: "IfStatement",
            start: statement.loc.start,
            end: statement.loc.end,
            mark: statement.mark,
            child: childNodes,
            nodes: [ifNode, ...consequentNodes, ...alternateNodes],
            lines: [
              ...startLine,
              ...ifLines,
              ...consequentLines,
              ...alternateLines
            ]
          };
        }
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
        };
      case "CallExpression":
        // 调用表达式 callee标识函数; arguments为数组, 代表参数
        // console.error('CallExpression', statement)
        statement.mark = getUuid();
        // 判断是否是forEach, 需要生成一个forEach节点及forEach的回调函数中的第一个语句及最后一个语句
        let arrLoopNode = [];
        // if (
        //   statement.callee &&
        //   statement.callee.property &&
        //   arrLoopMethods.includes(statement.callee.property.name)
        // ) {
        //   let name = generate(statement.callee).code;
        //   if (statement.variableName) {
        //     name = `${statement.variableName} = ${name}`;
        //   }
        //   arrLoopNode = [
        //     {
        //       id: statement.mark,
        //       name: replaceDoubleToSingleQuotes(name),
        //       shape: "square"
        //     }
        //   ];
        // }
        const callExpressionLine = [];

        const {
          nodes: callExpressionNodes,
          lines: callExpressionLines,
          entryNodes: callExpressionEntryNodes,
          exitNodes: callExpressionExitNodes
        } = transformAstToGraph(statement.arguments);
        console.log(transformAstToGraph(statement.arguments));
        // 当for循环时, 拿到内部的开始节点和离开节点, 添加连线
        if (arrLoopNode.length) {
          if (callExpressionEntryNodes.length) {
            callExpressionLine.push({
              from: arrLoopNode[0].id,
              to: callExpressionEntryNodes[0].id,
              name: "do",
              type: "solid",
              arrow: true
            });
          }
          if (callExpressionExitNodes.length) {
            callExpressionExitNodes.forEach(item => {
              callExpressionLine.push({
                from: item.id,
                to: arrLoopNode[0].id,
                name: "loop",
                type: "solid",
                arrow: true
              });
            });
          }
        }
        // console.log(callExpressionExitNodes)
        // console.log(callExpressionEntryNodes)
        let callExpressionNode = [];
        if (!callExpressionNodes.length) {
          // `${statement.variableName} = ${generate(statement).code}`
          callExpressionNode = [
            {
              id: statement.mark,
              name: replaceDoubleToSingleQuotes(`${generate(statement).code}`),
              shape: "square"
            }
          ];
        }
        // 当存在循环节点时, 控制当前节点子节点的entry和exit节点, 避免产生多余的连线
        const entryNodes = [...callExpressionNode, ...arrLoopNode];

        if (!arrLoopNode.length) {
          entryNodes.push(...callExpressionEntryNodes);
        }

        // console.log(entryNodes)

        const exitNodes = [...callExpressionNode, ...arrLoopNode];

        if (!arrLoopNode.length) {
          exitNodes.push(...callExpressionExitNodes);
        }

        return {
          nodes: [
            ...callExpressionNode,
            ...arrLoopNode,
            ...callExpressionNodes
          ],
          lines: [...callExpressionLines, ...callExpressionLine],
          entryNodes: entryNodes,
          exitNodes: exitNodes,
          breakNodes: [],
          subNodes: []
        };
      case "ConditionalExpression":
        // 三目运算符 consequent为真, alternate为false时执行的
        // console.log('ConditionalExpression')
        statement.mark = getUuid();
        // 增加返回前缀
        if (statement.variableName) {
          statement.consequent.variableName = statement.variableName;
          statement.alternate.variableName = statement.variableName;
        }
        // 兼容(flag ? obj1 : obj2).name 返回值
        if (statement.property) {
          statement.consequent.property = statement.property;
          statement.alternate.property = statement.property;
        }

        // 标识return节点
        if (statement.isReturn) {
          statement.consequent.isReturn = statement.isReturn;
          statement.alternate.isReturn = statement.isReturn;
        }
        // 提前给consequent/alternate节点设置mark属性, 用于生成连线
        statement.consequent.mark = getUuid();
        statement.alternate.mark = getUuid();
        const conditionalNode = {
          id: statement.mark,
          name: replaceDoubleToSingleQuotes(`${generate(statement.test).code}`),
          shape: "square"
        };
        const conditionLines = [];
        let leftConditionNodes = [];
        let leftConditionLines = [];
        let rightConditionNodes = [];
        let rightConditionLines = [];
        let conditionConsequentNode = [];
        let conditionAlterNode = [];
        let leftEntryNodes = [];
        let rightEntryNodes = [];
        let leftExitNodes = [];
        let rightExitNodes = [];
        const conditionExpressionTypes = [
          "ConditionalExpression",
          "CallExpression",
          "MemberExpression"
        ];
        if (conditionExpressionTypes.includes(statement.consequent.type)) {
          ({
            nodes: leftConditionNodes,
            lines: leftConditionLines,
            entryNodes: leftEntryNodes,
            exitNodes: leftExitNodes
          } = transformAstToGraph(statement.consequent));
          conditionLines.push({
            from: conditionalNode.id,
            to: statement.consequent.mark,
            name: "true",
            type: "solid",
            arrow: true
          });
        } else {
          let consequentNodeName = statement.variableName
            ? `${statement.variableName} = ${
                generate(statement.consequent).code
              }`
            : generate(statement.consequent).code;

          if (statement.property) {
            consequentNodeName = `${consequentNodeName}.${statement.property}`;
          }
          if (statement.isReturn) {
            consequentNodeName = `return ${consequentNodeName}`;
          }
          conditionConsequentNode = [
            {
              id: statement.consequent.mark,
              name: replaceDoubleToSingleQuotes(consequentNodeName),
              shape: "square"
            }
          ];
          conditionLines.push({
            from: conditionalNode.id,
            to: conditionConsequentNode[0].id,
            name: "true",
            type: "solid",
            arrow: true
          });
        }
        if (conditionExpressionTypes.includes(statement.alternate.type)) {
          ({
            nodes: rightConditionNodes,
            lines: rightConditionLines,
            entryNodes: rightEntryNodes,
            exitNodes: rightExitNodes
          } = transformAstToGraph(statement.alternate));

          conditionLines.push({
            from: conditionalNode.id,
            to: statement.alternate.mark,
            name: "false",
            type: "solid",
            arrow: true
          });
        } else {
          let alterNodeName = statement.variableName
            ? `${statement.variableName} = ${
                generate(statement.alternate).code
              }`
            : generate(statement.alternate).code;
          if (statement.property) {
            alterNodeName = `${alterNodeName}.${statement.property}`;
          }
          if (statement.isReturn) {
            alterNodeName = `return ${alterNodeName}`;
          }
          conditionAlterNode = [
            {
              id: statement.alternate.mark,
              name: replaceDoubleToSingleQuotes(alterNodeName),
              shape: "square"
            }
          ];
          conditionLines.push({
            from: conditionalNode.id,
            to: conditionAlterNode[0].id,
            name: "false",
            type: "solid",
            arrow: true
          });
        }
        if (!judgeNodes[statement.mark]) {
          let childItem = {};
          for (let item in judgeNodes) {
            let node = judgeNodes[item];
            if (
              node.start.line > statement.loc.start.line &&
              node.end.line <= statement.loc.end.line
            ) {
              childItem[node.mark] = node;
              delete judgeNodes[item];
            }
          }
          let childNodes = { ...childItem };
          if (childNodes.child) {
            Object.assign(childNodes, { ...childNodes.child });
          }
          judgeNodes[statement.mark] = {
            type: "ConditionalExpression",
            start: statement.loc.start,
            end: statement.loc.end,
            mark: statement.mark,
            child: childNodes,
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
            ]
          };
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
        };
      case "WhileStatement":
        // console.log('WhileStatement')
        statement.mark = getUuid();
        const whileNode = {
          id: statement.mark,
          name: replaceDoubleToSingleQuotes(
            `while(${generate(statement.test).code})`
          ),
          shape: "rhombus"
        };
        const {
          nodes: bodyNodes,
          lines: bodyLines,
          entryNodes: bodyEntryNodes,
          exitNodes: bodyExitNodes
        } = transformAstToGraph(statement.body);

        const whileLines = [
          ...getLines(bodyEntryNodes, "do", whileNode.id),
          ...bodyExitNodes.map(node => {
            return {
              from: node.id,
              to: whileNode.id,
              name: "loop",
              type: "solid",
              arrow: true
            };
          })
        ];

        const whileLine = [];
        // if (statement.prevNodeId) {
        //   whileLine.push({
        //     from: statement.prevNodeId,
        //     to: statement.selfId,
        //     name: '',
        //     type: 'solid',
        //     arrow: true
        //   })
        // }
        if (!judgeNodes[statement.mark]) {
          let childItem = {};
          for (let item in judgeNodes) {
            let node = judgeNodes[item];
            if (
              node.start.line > statement.loc.start.line &&
              node.end.line <= statement.loc.end.line
            ) {
              childItem[node.mark] = node;
              delete judgeNodes[item];
            }
          }
          let childNodes = { ...childItem };
          if (childNodes.child) {
            Object.assign(childNodes, { ...childNodes.child });
          }
          judgeNodes[statement.mark] = {
            type: "WhileStatement",
            start: statement.loc.start,
            end: statement.loc.end,
            mark: statement.mark,
            child: childNodes,
            nodes: [whileNode, ...bodyNodes],
            lines: [...whileLine, ...whileLines, ...bodyLines]
          };
        }
        return {
          nodes: [whileNode, ...bodyNodes],
          lines: [...whileLine, ...whileLines, ...bodyLines],
          entryNodes: [whileNode, ...bodyEntryNodes],
          exitNodes: [whileNode, ...bodyExitNodes],
          breakNodes: [],
          subNodes: []
        };
      case "DoWhileStatement":
        // console.log('DoWhileStatement')
        statement.mark = getUuid();
        const doWhileNode = {
          id: statement.mark,
          name: replaceDoubleToSingleQuotes(
            `do while(${generate(statement.test).code})`
          ),
          shape: "rhombus"
        };
        const {
          nodes: doWhileNodes,
          lines: doWhileLines,
          entryNodes: doWhileEntryNodes,
          exitNodes: doWhileExitNodes
        } = transformAstToGraph(statement.body);

        const thisEdges = [
          ...doWhileExitNodes.map(node => {
            return {
              to: doWhileNode.id,
              from: node.id,
              name: "do",
              type: "solid",
              arrow: true
            };
          }),
          ...doWhileEntryNodes.map(node => {
            return {
              to: node.id,
              from: doWhileNode.id,
              name: "loop",
              type: "solid",
              arrow: true
            };
          })
        ];

        const doWhileLine = [];
        if (!judgeNodes[statement.mark]) {
          let childItem = {};
          for (let item in judgeNodes) {
            let node = judgeNodes[item];
            if (
              node.start.line > statement.loc.start.line &&
              node.end.line <= statement.loc.end.line
            ) {
              childItem[node.mark] = node;
              delete judgeNodes[item];
            }
          }
          let childNodes = { ...childItem };
          if (childNodes.child) {
            Object.assign(childNodes, { ...childNodes.child });
          }
          judgeNodes[statement.mark] = {
            type: "DoWhileStatement",
            start: statement.loc.start,
            end: statement.loc.end,
            mark: statement.mark,
            child: childNodes,
            nodes: [doWhileNode, ...doWhileNodes],
            lines: [...doWhileLine, ...thisEdges, ...doWhileLines]
          };
        }

        return {
          nodes: [doWhileNode, ...doWhileNodes],
          lines: [...doWhileLine, ...thisEdges, ...doWhileLines],
          entryNodes: [...doWhileEntryNodes],
          exitNodes: [doWhileNode],
          breakNodes: [],
          subNodes: []
        };
      case "ForStatement":
        // console.log('ForStatement')
        statement.mark = getUuid();
        const forNode = {
          id: statement.mark,
          name: replaceDoubleToSingleQuotes(
            `for (${generate(statement.init).code})`
          ),
          shape: "square"
        };
        const {
          nodes: forBodyNodes,
          lines: forBodyLines,
          entryNodes: forBodyEntryNodes,
          exitNodes: forBodyExitNodes,
          breakNodes: forBodyBreakNodes
        } = transformAstToGraph(statement.body);

        const forLines = [
          ...fp.map(
            node => ({
              from: forNode.id,
              to: node.id,
              name: generate(statement.test).code,
              type: "solid",
              arrow: true
            }),
            forBodyEntryNodes
          ),
          ...fp.map(
            node => ({
              from: node.id,
              to: forNode.id,
              name: generate(statement.update).code,
              type: "solid",
              arrow: true
            }),
            forBodyExitNodes
          )
        ];
        if (!judgeNodes[statement.mark]) {
          let childItem = {};
          for (let item in judgeNodes) {
            let node = judgeNodes[item];
            if (
              node.start.line > statement.loc.start.line &&
              node.end.line <= statement.loc.end.line
            ) {
              childItem[node.mark] = node;
              delete judgeNodes[item];
            }
          }
          let childNodes = { ...childItem };
          if (childNodes.child) {
            Object.assign(childNodes, { ...childNodes.child });
          }
          judgeNodes[statement.mark] = {
            type: "ForStatement",
            start: statement.loc.start,
            end: statement.loc.end,
            mark: statement.mark,
            child: childNodes,
            nodes: [forNode, ...forBodyNodes],
            lines: [...forLines, ...forBodyLines]
          };
        }

        return {
          nodes: [forNode, ...forBodyNodes],
          lines: [...forLines, ...forBodyLines],
          entryNodes: [forNode],
          exitNodes: [...forBodyBreakNodes, forNode],
          breakNodes: [],
          subNodes: []
        };
      case "ForInStatement":
      case "ForOfStatement":
        // console.log('ForOfStatement')
        statement.mark = getUuid();
        const forInNode = {
          id: statement.mark,
          name: delSemi(
            replaceDoubleToSingleQuotes(
              `for (${generate(statement.left).code} in ${
                generate(statement.right).code
              })`
            )
          ),
          shape: "square"
        };
        const {
          nodes: forInBodyNodes,
          lines: forInBodyLines,
          entryNodes: forInBodyEntryNodes,
          exitNodes: forInBodyExitNodes,
          breakNodes: forInBodyBreakNodes
        } = transformAstToGraph(statement.body);

        const forInLines = [
          ...forInBodyEntryNodes.map(node => ({
            from: forInNode.id,
            to: node.id,
            name: "do",
            type: "solid",
            arrow: true
          })),
          ...forInBodyExitNodes.map(node => ({
            from: node.id,
            to: forInNode.id,
            name: "loop",
            type: "solid",
            arrow: true
          }))
        ];

        return {
          nodes: [forInNode, ...forInBodyNodes],
          lines: [...forInLines, ...forInBodyLines],
          entryNodes: [forInNode],
          exitNodes: [forInNode, ...forInBodyBreakNodes],
          breakNodes: [],
          subNodes: []
        };
      case "CatchClause":
        return transformAstToGraph(statement.body);
      case "TryStatement":
        // block: try中执行语句；handler: catch节点; finalizer: finally语句节点
        // console.log('TryStatement')
        const {
          nodes: blockNodes,
          lines: blockLines,
          entryNodes: blockEntryNodes,
          exitNodes: blockExitNodes,
          breakNodes: blockBreakNodes,
          subNodes: blockSubNodes
        } = fp.isObject(statement.block)
          ? transformAstToGraph(statement.block)
          : emptyGraph;
        const {
          nodes: finalizerNodes,
          lines: finalizerEdges,
          entryNodes: finalizerEntryNodes,
          exitNodes: finalizerExitNodes,
          breakNodes: finalizerBreakNodes,
          subNodes: finalizerSubGraphs
        } = fp.isObject(statement.finalizer)
          ? transformAstToGraph(statement.finalizer)
          : emptyGraph;
        const {
          nodes: handlerNodes,
          lines: handlerEdges,
          entryNodes: handlerEntryNodes,
          exitNodes: handlerExitNodes,
          breakNodes: handlerBreakNodes,
          subNodes: handlerSubGraphs
        } = fp.isObject(statement.handler)
          ? transformAstToGraph(statement.handler)
          : emptyGraph;
        const blockToFinallyEdges = fp.isObject(statement.finalizer)
          ? fp.flatten(
              blockExitNodes.map(blockExitNode => {
                return finalizerEntryNodes.map(finalizerEntryNode => {
                  return {
                    from: blockExitNode.id,
                    to: finalizerEntryNode.id,
                    name: "",
                    type: "solid",
                    arrow: true
                  };
                });
              })
            )
          : [];
        const handlerToFinallyEdges = fp.isObject(statement.finalizer)
          ? fp.flatten(
              handlerExitNodes.map(handlerExitNode => {
                return finalizerEntryNodes.map(finalizerEntryNode => {
                  return {
                    from: handlerExitNode.id,
                    to: finalizerEntryNode.id,
                    name: "",
                    type: "solid",
                    arrow: true
                  };
                });
              })
            )
          : [];
        const blockToHandlerEdges = fp.isObject(statement.handler)
          ? fp.flatten(
              blockNodes.map(blockNode => {
                return handlerEntryNodes.map(handlerEntryNode => {
                  return {
                    from: blockNode.id,
                    to: handlerEntryNode.id,
                    name: "error",
                    type: "dotted",
                    arrow: true
                  };
                });
              })
            )
          : [];
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
                    name: "try",
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
                    name: "finally",
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
                    name: "catch",
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
        };
      case "BreakStatement":
        // console.log('BreakStatement')
        statement.mark = getUuid();
        const breakNode = {
          id: statement.mark,
          name: replaceDoubleToSingleQuotes(generate(statement).code),
          shape: "square"
        };
        return {
          nodes: [breakNode],
          lines: [],
          entryNodes: [breakNode],
          exitNodes: [],
          breakNodes: [breakNode],
          subNodes: []
        };
      case "ReturnStatement":
        // return表达式节点, argument代表返回的内容, 可为null
        // console.log('ReturnStatement')
        statement.mark = getUuid();
        if (statement.argument) {
          statement.argument.isReturn = true;
        }
        const {
          nodes: returnStatNodes,
          lines: returnStatLines,
          entryNodes: returnStatEntryNodes,
          exitNodes: returnStatExitNodes
          // breakNodes: returnStatBreakNodes,
        } = statement.argument
          ? transformAstToGraph(statement.argument)
          : { ...emptyGraph };
        let returnNode = [];
        if (!returnStatNodes.length) {
          returnNode = [
            {
              id: statement.mark,
              name: replaceDoubleToSingleQuotes(generate(statement).code),
              shape: "asymetric"
            }
          ];
        }
        // 如果不是赋值表达式中的return语句, 则该节点不能向外部连线(连线只进不出, 因此不能作为离开节点)
        // ...returnNode,
        return {
          nodes: [...returnNode, ...returnStatNodes],
          lines: [...returnStatLines],
          entryNodes: [...returnNode, ...returnStatEntryNodes],
          exitNodes: [...returnStatExitNodes],
          breakNodes: [],
          subNodes: []
        };
      case "MemberExpression":
        // console.log('MemberExpression')
        statement.mark = getUuid();
        // 兼容obj调用时返回obj.name
        if (statement.property) {
          statement.object.property = statement.property.name;
        }
        // 标识return节点
        if (statement.isReturn) {
          statement.object.isReturn = statement.isReturn;
        }
        return transformAstToGraph(statement.object);
      case "ThrowStatement":
        // 该节点只能作为进入节点, 不能作为from节点(因为遇到该节点之后, 直接跳出程序)
        statement.mark = getUuid();
        const throwNode = {
          id: statement.mark,
          name: replaceDoubleToSingleQuotes(generate(statement).code),
          shape: "square"
        };
        return {
          nodes: [throwNode],
          lines: [],
          entryNodes: [throwNode],
          exitNodes: [],
          breakNodes: [],
          subNodes: []
        };
      case "BinaryExpression":
        // 二元运算表达式节点
        statement.mark = getUuid();
        const binaryNode = {
          id: statement.mark,
          name: replaceDoubleToSingleQuotes(generate(statement).code),
          shape: "square"
        };
        return {
          nodes: [binaryNode],
          lines: [],
          entryNodes: [binaryNode],
          exitNodes: [binaryNode],
          breakNodes: [],
          subNodes: []
        };
      default:
        // throw new Error(`${statement.type} is not supported`)
        return emptyGraph;
    }
  } catch (e) {
    console.error(e);
  }
}
