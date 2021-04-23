const defaultNodeComplexity = {
  complexity: 0
};

export let fnComplexity = {};
export let judgeNodeComplexity = {};

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

function isObject(value) {
  const type = Object.prototype.toString.call(value);
  return type === "[object Object]" && JSON.stringify(value) !== "{}";
}

export function transformAstToGraph(ast) {
  if (Array.isArray(ast)) {
    return transformStatementSequenceToGraph(ast);
  } else {
    return setType(ast);
  }
}

function transformStatementSequenceToGraph(statements) {
  const collection = statements.map(statement =>
    transformAstToGraph(statement)
  );
  let result = collection.reduce(
    ({ complexity }, { complexity: curComplexity }) => {
      return {
        complexity: complexity + curComplexity
      };
    },
    defaultNodeComplexity
  );
  return result;
}

function getFnDeclareComplexity(statement, complexity) {
  if (!fnComplexity[statement.mark]) {
    fnComplexity[statement.mark] = {
      name: statement.id.name,
      start: statement.loc.start,
      end: statement.loc.end,
      complexity
    };
  }
}

function getJudgeNodeComplexity(statement, complexity) {
  for (let key in judgeNodeComplexity) {
    let item = judgeNodeComplexity[key];
    if (
      item.start.line > statement.loc.start.line &&
      item.end.line <= statement.loc.end.line
    ) {
      statement.complexity++;
      delete judgeNodeComplexity[key];
    }
  }
  if (!judgeNodeComplexity[statement.mark]) {
    judgeNodeComplexity[statement.mark] = {
      start: statement.loc.start,
      end: statement.loc.end,
      complexity
    };
  }
}

function setType(statement) {
  try {
    switch (statement.type) {
      case "FunctionDeclaration":
        statement.mark = getUuid();
        let fnDeclareComplexity = transformAstToGraph(statement.body);
        getFnDeclareComplexity(statement, fnDeclareComplexity.complexity);
        return fnDeclareComplexity;
      case "FunctionExpression":
        statement.mark = getUuid();
        let fnExpressComplexity = transformAstToGraph(statement.body);
        getFnDeclareComplexity(statement, fnExpressComplexity.complexity);
        return fnExpressComplexity;
      case "ArrowFunctionExpression":
        statement.mark = getUuid();
        let arrowComplexity = transformAstToGraph(statement.body);
        getFnDeclareComplexity(statement, arrowComplexity.complexity);
        return arrowComplexity;

      case "VariableDeclarator":
        const variableComplexity = statement.init
          ? transformAstToGraph(statement.init)
          : defaultNodeComplexity;
        return variableComplexity;
      case "AssignmentExpression":
        const { complexity: assignComplexity } = transformAstToGraph(
          statement.right
        );
        return {
          complexity: assignComplexity
        };
      case "ExpressionStatement":
        // 表达式语句节点
        const { complexity: expressionComplexity } = transformAstToGraph(
          statement.expression
        );
        return {
          complexity: expressionComplexity
        };
      case "LogicalExpression":
        statement.mark = getUuid();
        const { complexity: logicalLeftComplexity } = transformAstToGraph(
          statement.left
        );
        const { complexity: logicalRightComplexity } = transformAstToGraph(
          statement.right
        );

        let logicalComplexity =
          logicalLeftComplexity + logicalRightComplexity + 1;
        getJudgeNodeComplexity(statement, logicalComplexity);
        return {
          complexity: logicalComplexity
        };
      case "SwitchStatement":
        statement.mark = getUuid();
        const scopeGraph = statement.cases.reduce(
          ({ complexity }, caseAstElement) => {
            const { complexity: caseComplexity } = transformAstToGraph(
              caseAstElement.consequent
            );
            return {
              complexity: caseComplexity + complexity + 1
            };
          },
          defaultNodeComplexity
        );
        let caseComplexity = scopeGraph.complexity
          ? scopeGraph.complexity - 1
          : 0;
        getJudgeNodeComplexity(statement, caseComplexity);
        return {
          complexity: caseComplexity
        };
      case "IfStatement":
        statement.mark = getUuid();
        const { complexity: IfConComplexity } = transformAstToGraph(
          statement.consequent
        );
        const { complexity: IfAltComplexity } = statement.alternate
          ? transformAstToGraph(statement.alternate)
          : defaultNodeComplexity;
        let ifComplexity = IfConComplexity + IfAltComplexity + 1;
        getJudgeNodeComplexity(statement, ifComplexity);

        return {
          complexity: ifComplexity
        };
      case "CallExpression":
        const { complexity: callComplexity } = transformAstToGraph(
          statement.arguments
        );
        return {
          complexity: callComplexity
        };
      case "ConditionalExpression":
        // 三目运算符 consequent为真, alternate为false时执行的
        statement.mark = getUuid();
        const { complexity: conditionConComplexity } = transformAstToGraph(
          statement.consequent
        );
        const { complexity: conditionAltComplexity } = transformAstToGraph(
          statement.alternate
        );
        let conditionComplexity =
          conditionConComplexity + conditionAltComplexity + 1;
        getJudgeNodeComplexity(statement, conditionComplexity);
        return {
          complexity: conditionComplexity
        };
      case "WhileStatement":
        const { complexity: whileComplexity } = transformAstToGraph(
          statement.body
        );
        return {
          complexity: whileComplexity + 1
        };
      case "DoWhileStatement":
        const { complexity: doWhileComplexity } = transformAstToGraph(
          statement.body
        );
        return {
          complexity: doWhileComplexity + 1
        };
      case "ForStatement":
        const { complexity: forComplexity } = transformAstToGraph(
          statement.body
        );
        return {
          complexity: forComplexity + 1
        };
      case "ForInStatement":
      case "ForOfStatement":
        const { complexity: forInComplexity } = transformAstToGraph(
          statement.body
        );
        return {
          complexity: forInComplexity + 1
        };
      case "TryStatement":
        const { complexity: blockComplexity } = isObject(statement.block)
          ? transformAstToGraph(statement.block)
          : defaultNodeComplexity;
        const { complexity: finalizerComplexity } = isObject(
          statement.finalizer
        )
          ? transformAstToGraph(statement.finalizer)
          : defaultNodeComplexity;
        const { complexity: handlerComplexity } = isObject(statement.handler)
          ? transformAstToGraph(statement.handler)
          : defaultNodeComplexity;
        return {
          complexity:
            blockComplexity + finalizerComplexity + handlerComplexity + 1
        };
      case "ReturnStatement":
        const returnComplexity = statement.argument
          ? transformAstToGraph(statement.argument)
          : defaultNodeComplexity;
        return returnComplexity;
      case "ExportNamedDeclaration":
        return transformAstToGraph(statement.declaration);
      case "VariableDeclaration":
        return transformAstToGraph(statement.declarations);
      case "MemberExpression":
        return transformAstToGraph(statement.object);
      case "File":
        return transformAstToGraph(statement.program);
      case "CatchClause":
      case "BlockStatement":
      case "Program":
        return transformAstToGraph(statement.body);
      case "BreakStatement":
      case "ThrowStatement":
      case "BinaryExpression":
      default:
        return defaultNodeComplexity;
    }
  } catch (e) {
    console.error(e);
  }
}
