import { EventEmitter } from 'events';
function getCallback() {
    const callbackFn = () => { };
    const callbackCancelled = {
        canceled: false
    };
    const callbackWithPromise = {
        promise: new Promise(() => { })
    };
    const callback = Object.assign(callbackFn, callbackCancelled, callbackWithPromise, {
        [Symbol.toStringTag]: 'Callback',
        then: (onfulfilled, onrejected) => callbackWithPromise.promise.then(onfulfilled, onrejected),
        catch: (onrejected) => callbackWithPromise.promise.catch(onrejected),
        finally: (onfinally) => callbackWithPromise.promise.finally(onfinally)
    });
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