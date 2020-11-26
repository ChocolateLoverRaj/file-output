import { EventEmitter, once } from 'events';
import { PassThrough } from 'stream';
import { writeFile } from 'fs/promises';
class Canceler extends PassThrough {
    constructor(emitter) {
        super();
        this[Symbol.toStringTag] = 'Manager';
        this.canceled = false;
        this.promise = once(emitter, 'cancel').then(() => {
            this.canceled = true;
        });
    }
    then(onfulfilled, onrejected) {
        return this.promise.then(onfulfilled, onrejected);
    }
    catch(onrejected) {
        return this.promise.then(onrejected);
    }
    finally(onfinally) {
        return this.promise.finally(onfinally);
    }
}
class FileOutput {
    constructor(outputPath) {
        this.outputPath = outputPath;
        this.emitter = new EventEmitter();
    }
    async update(builder) {
        if (typeof builder === 'function') {
            const canceler = new Canceler(this.emitter);
            builder(canceler);
        }
        else {
            await writeFile(this.outputPath, builder);
        }
    }
}
export default FileOutput;
//# sourceMappingURL=index.js.map