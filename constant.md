- Programs: 根节点
- Identifier: 标识符, 自定义的名称, 如变量名、函数名、属性名等；
- RegExpLiteral: 正则字面量的值
- NullLiteral: null字面量
- StringLiteral: 字符串字面量的值
- BooleanLiteral: 布尔字面量的值
- NumericLiteral: 数值字面量的值
- ExpressionStatement: 表达式语句节点。eg(a = a + 1)
- BlockStatement: 块语句节点（{}）
- EmptyStatement: 空语句
- DebuggerStatement: debugger语句
- WithStatement: with语句, object表示with要使用的那个对象, body是对应with后边要执行的语句
- ReturnStatement: return 语句, argument为一个表达式, 代表返回的内容
- LabeledStatement: lable语句, 多用于精确的使用嵌套循环中的continue和break。eg:
```javascript
loop: for(let i = 0; i < len; i++) {
  for (let j = 0; j < min; j++) {
      break loop;
  }
}
```
- BreakStatement: break语句
- ContinueStatement: continue语句

### 判断
- IfStatement: if语句, consequent表示if命中后内容, alternate表示else或者else if的内容
- SwitchStatement: switch语句, discriminant表示switch的变量, cases属性是一个case数组, 表示所有的case


### exceptions
- ThrowStatement: throw语句
- TryStatement: try...catch语句, handler为catch处理的内容, finalizer为finally内容; block为try的执行语句
- CatchClause: catch节点, body为catch后的执行语句

### loop
- WhileStatement: while语句
- DoWhileStatement: do...while语句
- ForStatement: for语句
- ForInStatement: for...in语句
- ForOfStatement: for...of语句

### declarations
- FunctionDeclaration: 函数声明
- VariableDeclaration: 变量声明, declarations表示声明的多个描述
- VariableDeclarator: 变量声明的描述, id为变量名称节点, init表示初始值的表达式, 可为null

### Expressions
- Super: 父类关键字
- Import: import语句
- ThisExpression: this
- ArrowFunctionExpression: 箭头函数表达式
- YieldExpression: yield表达式
- AwaitExpression: await表达式
- ArrayExpression: 数组表达式
- ObjectExpression: 对象表达式
- ObjectMember
- ObjectProperty: 对象的属性名
- ObjectMethod
- FunctionExpression: 函数表达式
- UnaryExpression: 一元运算表达式节点, operator表示运算符, prefix表示是否为前缀运算符, argument是要执行运算的表达式
- UpdateExpression: 更新操作符表达式。eg: ++


### binary operations
- BinaryExpression: 二元操作符表达式
- AssignmentExpression: 赋值表达式
- LogicalExpression: 逻辑运算符表达式
- SpreadElement: 扩展运算符
- MemberExpression: 属性成员表达式。eg: foo.bar
- BindExpression
- ConditionalExpression: 三元表达式
- CallExpression: 函数调用表达式, callee属性是一个表达式节点, arguments是函数参数
- NewExpression: new 表达式
- SequenceExpression: 序列表达式。eg: var a, b
- DoExpression
- ObjectPatterns: 对象解构模式
- ArrayPattern: 数组解构模式
- RestElement: 剩余参数解构模式
- AssignmentPattern: 默认赋值模式，数组解析、对象解析、函数参数默认值使用

### class
- ClassBody
- ClassMethod
- ClassPrivateMethod
- ClassProperty
- ClassPrivateProperty
- ClassDeclaration
- ClassExpression
- MetaProperty

### Modules
- ModuleDeclaration
- ModuleSpecifier
- ImportDeclaration
- ImportSpecifier
- ImportDefaultSpecifier
- ImportNamespaceSpecifier
- ExportNamedDeclaration
- ExportSpecifier
- ExportDefaultDeclaration
- ExportAllDeclaration


参考：
- https://github.com/babel/babylon/blob/master/ast/spec.md#nullliteral
- https://segmentfault.com/a/1190000018532745