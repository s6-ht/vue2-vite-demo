<template>
  <div id="mermaid" class="mermaid">{{ parseCode }}</div>
</template>

<script>
import mermaid from 'mermaid'
import { getMermain } from './index'
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
  tryCatchStatement,
  threeStatement,
  logicalOperator,
  logicalOrOperator,
  functionExpression
} from './sample'
// import './testIndex'
export default {
  name: 'VueMermaid',
  data() {
    return {
      parseCode: ''
    }
  },
  mounted() {
    // getMermain(ifStatement1)
    this.load()
  },
  methods: {
    load() {
      //     ifStatement,
      // ifStatement1,
      // ifStatement2,
      // whileState1,
      // doWhileState1,
      // switch1,
      // forStatement,
      // forInStatement,
      // forOfStatement,
      // tryCatchStatement,
      // threeStatement
      this.parseCode = getMermain(logicalOrOperator)
      //       this.parseCode = `graph TD

      // froml2c0tol7c1([" function logicalOperator"])
      //   froml3c2tol3c17("let flag = true;")
      //   froml4c2tol4c21("let isForce = false;")
      // froml5c12tol5c27["res = flag"]
      // froml5c12tol5c16["flag"]
      // froml5c12tol5c27["res = isForce"]
      // froml5c20tol5c27["isForce"]
      // froml5c12tol5c33["res = 10"]
      //   froml6c2tol6c12>"return res;"]

      //   froml3c2tol3c17 --> froml4c2tol4c21`
      console.log(this.parseCode)
      const container = document.getElementById('mermaid')
      if (this.parseCode && container) {
        container.removeAttribute('data-processed')
        container.replaceChild(
          document.createTextNode(this.parseCode),
          container.firstChild
        )
        try {
          mermaid.init(this.parseCode, container)
        } catch (error) {
          console.log(error)
        }
      }
    }
  }
}
</script>

<style></style>
