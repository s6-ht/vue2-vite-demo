const eventMaps = ['click'],        //目前只有点击事件,后期如需拓展在数组中添加对应的事件名称
tagArr = ['a','button','li','span'],        //标签数组,在该数组中的满足条上报条件
historyFunc = ['pushState','replaceState']    

export default class Monitor {
    constructor(options) {
       this.isRouteChange = false     //路由是否触发的标志
       this.eventFunc = eventFunc.bind(this)        //点击事件变量存储
       this.handleHashChange = handleHashChange.bind(this)   //路由监听事件变量存储
       this.timer = null  
       this.reportData = {
           data:[]  
       }  //上报数据 
       this.pageBehavior = {}    //单页数据行为对象
       this.events = []          //事件集合收集
       this.curPageUrl = this.getLocationHref()   //当前页面url
       options.user_id = options.username+'-'+this.getTimestamp()    //生成唯一的用户id
       this.reportData = Object.assign(options,this.reportData)

       this.handleError()
    //    this.handleEvent()
    //    this.handleRoute()

       //对传入参数做判断
       if(this.judgeIsSend(options)){
            this.sendData()
       }

    }

    //判断是否上报数据
    judgeIsSend(options){
        //未登录情况不上报数据条件
        if(options.app_id === '' && options.username === '' && options.is_login === false && options.create_at === ''){
            return false
        }
        return true
    }

    //处理错误事件
    handleError() {
        // let errorObj = {},    //错误对象
        // _this = this,
        // url = ''
        window.addEventListener('error',function(e){
            console.log(e, 'sdk listen error')
            // if(!e.cancelable){
            //     //资源加载错误 
            //     const { localName,href,src } = e.target
            //     let sourceUrl = ''
            //     if(localName === 'link'){
            //         sourceUrl = href
            //     }else{
            //         sourceUrl = src
            //     }
    
            //     errorObj = {
            //         type:e.type,
            //         desc:sourceUrl,     //报错资源
            //         trigger_time:_this.getTimestamp()
            //     }
            // }else{
            //     //脚本错误
            //     if(!e.filename)  return false     // 没有报错脚本不上报
    
            //     errorObj = {
            //         type:e.type,
            //         desc:e.message,     //报错信息
            //         trigger_time:_this.getTimestamp()
            //     }
            // }
            // console.log(errorObj)

            // url = window.location.pathname+window.location.hash
            // if(url === _this.curPageUrl){
            //     _this.events.push(errorObj)
            // }
            // console.log(_this.events)
            // console.log(_this.reportData)
        },true)
        // return _this.reportData
    }

    //处理点击事件
    handleEvent() {
        eventMaps.forEach(event => {
            document.addEventListener(event,this.eventFunc)
        })
    }

    //处理路由事件
    handleRoute(){
        this.handleHash()
        this.handleHistory()
    }

    //处理hash路由-[重写hashchange]
    handleHash(){
        window.addEventListener("hashchange", this.handleHashChange, false)
    }

    //路由变化push到数据结构的相关操作
    handleRouteData(parsedFrom,parsedTo){
        this.curPageUrl = parsedTo         
        this.events = []
        this.events.push(
            {
                type:'route-leave',
                desc:parsedFrom,
                trigger_time:this.getTimestamp()
            },
            {
                type:'route-enter',
                desc:parsedTo,
                trigger_time:this.getTimestamp()
            }
        )
        console.log(this.events)
        this.pageBehavior = {
            page_name_from:parsedFrom,
            page_url_from:parsedFrom, 
            page_name_to:parsedTo,
            page_url_to:parsedTo, 
            visit_page_time:this.getTimestamp(),
            exit_page_time:'',
            events:this.events
        }
        if(this.reportData.monitor_page_url.length === 0){
            this.reportData.data.push(this.pageBehavior) 
        }else{
            this.reportData.monitor_page_url.forEach(item=>{
                if(item === parsedFrom || item === parsedTo){
                    this.reportData.data.push(this.pageBehavior) 
                }else{
                    return;
                }
            })
        }  
        // this.reportData.data.push(this.pageBehavior)   
        for(let i=0;i<this.reportData.data.length-1;i++){
            if(this.reportData.data[i].page_url_to === this.reportData.data[i+1].page_url_from){
                this.reportData.data[i].exit_page_time = this.reportData.data[i+1].visit_page_time
            }
        }  
        console.log(this.reportData)
    }

    //处理history路由-[pushState、replaceState]
    handleHistory(){
        let _this = this
        window.addEventListener('popstate',function(e){
            console.log(e)
            _this.handleRouteData(_this.getLocationHref(),document.location)
        },false)

        historyFunc.forEach(history => {
            window.history[history] = function(data,title,url){
                // console.log(data,title,url)
                _this.handleRouteData(_this.getLocationHref(),url)
            }
        })
    }
       
    //上报数据
    sendData() {
        // clearInterval(this.timer)
        // this.timer = setInterval(()=>{
        //     console.log(this.reportData)
        //     let data = JSON.stringify(this.reportData)
        //     new Image().src = `./blank.gif?data=${data}`
        // },1000)   //时长需修改

        //blank.gif是一个真实的图片，1px * 1px的空白图
    }

    //获取当前时间毫秒数
    getTimestamp() {
        return Date.now()
    }

    //获取url
    getLocationHref() {
        if (typeof document === 'undefined' || document.location == null)
            return '';
        return this.parseUrlToObj(document.location.href).relative;
    }

    //url解析
    parseUrlToObj(url) {
        if (!url) {
            return {};
        }
        var match = url.match(/^(([^:\/?#]+):)?(\/\/([^\/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?$/);
        if (!match) {
            return {};
        }
        var query = match[6] || '';
        var fragment = match[8] || '';
        return {
            host: match[4],
            path: match[5],
            protocol: match[2],
            relative: match[5] + query + fragment
        };
    }
}

function eventFunc(e){
    console.log(e)
    let target = e.target,   //DOM节点
        type = e.type,        //类型
        tagName = target.localName,   //标签名
        clickObj = {}

    //在指定标签集合中的才收集数据
    if(tagArr.includes(tagName)){
        clickObj = {
            type,
            desc:target.innerHTML ? target.innerHTML : target.className,  //标签内容-图标取class[暂时这样处理]
            trigger_time:this.getTimestamp()   
        }
        console.log(clickObj)

        //点击时并未触发路由，默认from为空,to到当前页面
        if(!this.isRouteChange){
            this.handleRouteData('',this.getLocationHref())
            this.isRouteChange = true
        }

        if(this.getLocationHref() === this.curPageUrl){
            this.events.push(clickObj)
        }
        console.log(this.reportData)
    }
}

function handleHashChange(e){
    this.isRouteChange = true
    // console.log(e)
    let from = e.oldURL,to = e.newURL 
    var parsedFrom = this.parseUrlToObj(from).relative
    var parsedTo = this.parseUrlToObj(to).relative
    console.log(parsedFrom,parsedTo)

    this.handleRouteData(parsedFrom,parsedTo)
}