exports.replaceOld = function replaceOld(source, name, replacement) {
    if (!(name in source))
        return;
    var original = source[name];
    var wrapped = replacement(original);
    if (typeof wrapped === 'function') {
        source[name] = wrapped;
    }
}


function getGlobal() {
    return (isNodeEnv() ? global : typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : {});
}
exports._global = getGlobal

exports.supportsHistory = function supportsHistory() {
    var global = getGlobal();
    var chrome = global.chrome;
    var isChromePackagedApp = chrome && chrome.app && chrome.app.runtime;
    var hasHistoryApi = 'history' in global && !!global.history.pushState && !!global.history.replaceState;
    return !isChromePackagedApp && hasHistoryApi;
}


function isNodeEnv(){
    return Object.prototype.toString.call(typeof process !== 'undefined' ? process : 0) === '[object process]'
}
