import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import {
  transformAstToGraph,
  fnComplexity,
  judgeNodeComplexity
} from "./transform";
import fp from "lodash/fp";
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
  test1,
  forEach,
  functionTest,
  returnStat,
  emptyStat,
  error,
  classTest
} from "./sample";

function transformCodeToAst(codeStr) {
  return parse(codeStr, {
    sourceType: "module",
    plugins: ["classProperties", "asyncGenerators", "jsx", "typescript"]
  });
}
// console.log(JSON.stringify(transformCodeToAst(test1.toString())));

function isEmpty(value) {
  let flag = true;
  if (Array.isArray(value) && JSON.stringify(value) !== "[]") {
    flag = false;
  }
  if (
    Object.prototype.toString.call(value) === "[object Object]" &&
    JSON.stringify(value) !== "{}"
  ) {
    flag = false;
  }
  return flag;
}
// import { transformGeneralAstToGraph } from './test'
// console.log(transformGeneralAstToGraph(ast))

function isObject(val) {
  return Object.prototype.toString.call(val) == "[object Object]";
}

function isString(val) {
  return typeof val === "string";
}

function transformNodeToMermaidString({ id, name, shape = "square", style }) {
  const text = typeof name === "string" ? name : id;

  const shapes = {
    round: `  ${id}("${text}")`,
    circle: `  ${id}(("${text}"))`,
    asymetric: `  ${id}>"${text}"]`,
    rhombus: `  ${id}{"${text}"}`,
    square: ""
  };
  const defaultShape = `${id}["${text}"]`;
  return shapes[shape] || defaultShape;
}

function transformEdgeToMermaidString({
  from,
  to,
  name,
  type = "solid",
  arrow = true
}) {
  const text = isString(name) ? name : "";
  // console.log(text)
  const arrowText = arrow ? ">" : "";
  if (fp.isEmpty(text)) {
    switch (type) {
      case "dotted":
        return `  ${from} -.-${arrowText} ${to}`;
      case "thick":
        return `  ${from} ==${arrowText} ${to}`;
      case "solid":
      default:
        return `  ${from} --${arrowText} ${to}`;
    }
  } else {
    switch (type) {
      case "dotted":
        return `  ${from} -. ${text} .-${arrowText} ${to}`;
      case "thick":
        return `  ${from} == ${text} ==${arrowText} ${to}`;
      case "solid":
      default:
        return `  ${from} -- ${text} --${arrowText} ${to}`;
    }
  }
}

function transformGraphFragmentToMermaidString({ nodes, lines, subNodes }) {
  const nodesMermaidStr = nodes.map(transformNodeToMermaidString).join("\n");
  const subNodesMermaidStr = subNodes
    .map(({ id, name, graph }) => {
      return (
        `subgraph ${name.replace("_", " ")}\n` +
        transformGraphFragmentToMermaidString(graph) +
        `\nend`
      );
      // return `subgraph ${id}([" ${name.replace(
      //   "_",
      //   " "
      // )}"])\n${transformGraphFragmentToMermaidString(graph)}`;
    })
    .join("\n");
  const linesMermaidStr = lines.map(transformEdgeToMermaidString).join("\n");
  return nodesMermaidStr + "\n" + subNodesMermaidStr + "\n" + linesMermaidStr;
}

function transformGraphToMermaid({ nodes, lines, subNodes }, direction = "TD") {
  const mermaidStrPrefix = `graph ${direction}`;
  const mermaidContent = transformGraphFragmentToMermaidString({
    nodes,
    lines,
    subNodes
  });
  return mermaidStrPrefix + "\n" + mermaidContent;
}
// console.log(traverse);
// export function getMermain(code) {
const ast = transformCodeToAst(test1);
// let res = transformAstToGraph(ast);
transformAstToGraph(ast);
console.log(fnComplexity);
console.log(judgeNodeComplexity);

// export function getFuncsComplexity(code) {
//   const fileContentAst = getCodeAst(code)
//   transformAstToGraph(fileContentAst)
//   let funs = { ...functionDeclaratioinObj }
//   let modules = { ...judgeNodes }
//   // 下一次执行的时候清空上次的内容, 防止内容重复
//   functionDeclaratioinObj = {}
//   judgeNodes = {}
//   setComplexity(funs)
//   setComplexity(modules)
//   return { funs, modules }
// }

let obj = {
  type: "File",
  start: 0,
  end: 71,
  loc: { start: { line: 1, column: 0 }, end: { line: 7, column: 0 } },
  errors: [],
  program: {
    type: "Program",
    start: 0,
    end: 71,
    loc: { start: { line: 1, column: 0 }, end: { line: 7, column: 0 } },
    sourceType: "module",
    interpreter: null,
    body: [
      {
        type: "FunctionDeclaration",
        start: 1,
        end: 70,
        loc: { start: { line: 2, column: 0 }, end: { line: 6, column: 1 } },
        id: {
          type: "Identifier",
          start: 10,
          end: 22,
          loc: {
            start: { line: 2, column: 9 },
            end: { line: 2, column: 21 },
            identifierName: "arrayForEach"
          },
          name: "arrayForEach"
        },
        generator: false,
        async: false,
        params: [],
        body: {
          type: "BlockStatement",
          start: 25,
          end: 70,
          loc: { start: { line: 2, column: 24 }, end: { line: 6, column: 1 } },
          body: [
            {
              type: "ExpressionStatement",
              start: 29,
              end: 68,
              loc: {
                start: { line: 3, column: 2 },
                end: { line: 5, column: 2 }
              },
              expression: {
                type: "CallExpression",
                start: 29,
                end: 68,
                loc: {
                  start: { line: 3, column: 2 },
                  end: { line: 5, column: 2 }
                },
                callee: {
                  type: "MemberExpression",
                  start: 29,
                  end: 43,
                  loc: {
                    start: { line: 3, column: 2 },
                    end: { line: 3, column: 16 }
                  },
                  object: {
                    type: "Identifier",
                    start: 29,
                    end: 35,
                    loc: {
                      start: { line: 3, column: 2 },
                      end: { line: 3, column: 8 },
                      identifierName: "array1"
                    },
                    name: "array1"
                  },
                  computed: false,
                  property: {
                    type: "Identifier",
                    start: 36,
                    end: 43,
                    loc: {
                      start: { line: 3, column: 9 },
                      end: { line: 3, column: 16 },
                      identifierName: "forEach"
                    },
                    name: "forEach"
                  }
                },
                arguments: [
                  {
                    type: "ArrowFunctionExpression",
                    start: 44,
                    end: 67,
                    loc: {
                      start: { line: 3, column: 17 },
                      end: { line: 5, column: 1 }
                    },
                    id: null,
                    generator: false,
                    async: false,
                    params: [
                      {
                        type: "Identifier",
                        start: 44,
                        end: 48,
                        loc: {
                          start: { line: 3, column: 17 },
                          end: { line: 3, column: 21 },
                          identifierName: "item"
                        },
                        name: "item"
                      }
                    ],
                    body: {
                      type: "BlockStatement",
                      start: 52,
                      end: 67,
                      loc: {
                        start: { line: 3, column: 25 },
                        end: { line: 5, column: 1 }
                      },
                      body: [
                        {
                          type: "VariableDeclaration",
                          start: 56,
                          end: 65,
                          loc: {
                            start: { line: 4, column: 2 },
                            end: { line: 4, column: 11 }
                          },
                          declarations: [
                            {
                              type: "VariableDeclarator",
                              start: 60,
                              end: 65,
                              loc: {
                                start: { line: 4, column: 6 },
                                end: { line: 4, column: 11 }
                              },
                              id: {
                                type: "Identifier",
                                start: 60,
                                end: 61,
                                loc: {
                                  start: { line: 4, column: 6 },
                                  end: { line: 4, column: 7 },
                                  identifierName: "a"
                                },
                                name: "a"
                              },
                              init: {
                                type: "NumericLiteral",
                                start: 64,
                                end: 65,
                                loc: {
                                  start: { line: 4, column: 10 },
                                  end: { line: 4, column: 11 }
                                },
                                extra: { rawValue: 1, raw: "1" },
                                value: 1
                              }
                            }
                          ],
                          kind: "var"
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
};
