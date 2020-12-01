import { EventEmitter } from 'events';
function getCallback() {
    const callbackFn = () => { };
    const callbackCancelled = {
        canceled: false
    };
    const callbackWithPromise = {
        promise: new Promise(() => { })
    };
    const callbackPromise = {
        [Symbol.toStringTag]: 'Callback',
        then: (onfulfilled, onrejected) => callbackWithPromise.promise.then(onfulfilled, onrejected),
        catch: (onrejected) => callbackWithPromise.promise.catch(onrejected),
        finally: (onfinally) => callbackWithPromise.promise.finally(onfinally)
    };
    const callbackStream = {
        async write() { },
        async end() { }
    };
    const callbackObj = Object.assign(Object.assign(Object.assign(Object.assign({}, callbackCancelled), callbackWithPromise), callbackPromise), callbackStream);
    const callback = Object.assign(callbackFn, callbackObj);
    return callback;
}
class FileOutput {
    constructor(outputPath) {
        this.outputPath = outputPath;
        this.emitter = new EventEmitter();
    }
    async update(builder) {
        if (typeof builder === 'function') {
            const callback = getCallback();
            builder(callback);
        }
        else {
            console.log('write away!', builder);
        }
    }
}
export default FileOutput;
//# sourceMappingURL=index.js.map