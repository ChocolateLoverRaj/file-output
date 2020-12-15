<a name="file-outputManage reading, writing, and updating files.module_"></a>

## file-outputManage reading, writing, and updating files.

* [file-outputManage reading, writing, and updating files.](#file-outputManage reading, writing, and updating files.module_)
    * [~FileOutput](#file-outputManage reading, writing, and updating files.module_..FileOutput)
        * [new FileOutput(outputPath, options)](#new_file-outputManage reading, writing, and updating files.module_..FileOutput_new)
        * [.update(builder)](#file-outputManage reading, writing, and updating files.module_..FileOutput+update) ⇒ <code>Promise</code>
        * [.read()](#file-outputManage reading, writing, and updating files.module_..FileOutput+read) ⇒ <code>Promise</code>
        * [.readStream()](#file-outputManage reading, writing, and updating files.module_..FileOutput+readStream) ⇒ <code>ReadStream</code> \| <code>PassThrough</code>
        * [.destroy(unlinkFile)](#file-outputManage reading, writing, and updating files.module_..FileOutput+destroy)

<a name="file-outputManage reading, writing, and updating files.module_..FileOutput"></a>

### file-outputManage reading, writing, and updating files.~FileOutput
FileOutput class

**Kind**: inner class of [<code>file-outputManage reading, writing, and updating files.</code>](#file-outputManage reading, writing, and updating files.module_)  

* [~FileOutput](#file-outputManage reading, writing, and updating files.module_..FileOutput)
    * [new FileOutput(outputPath, options)](#new_file-outputManage reading, writing, and updating files.module_..FileOutput_new)
    * [.update(builder)](#file-outputManage reading, writing, and updating files.module_..FileOutput+update) ⇒ <code>Promise</code>
    * [.read()](#file-outputManage reading, writing, and updating files.module_..FileOutput+read) ⇒ <code>Promise</code>
    * [.readStream()](#file-outputManage reading, writing, and updating files.module_..FileOutput+readStream) ⇒ <code>ReadStream</code> \| <code>PassThrough</code>
    * [.destroy(unlinkFile)](#file-outputManage reading, writing, and updating files.module_..FileOutput+destroy)

<a name="new_file-outputManage reading, writing, and updating files.module_..FileOutput_new"></a>

#### new FileOutput(outputPath, options)

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| outputPath | <code>string</code> |  | Path to the file being written to and read from. |
| options | <code>object</code> |  | Options about the current file. |
| options.fileDoesNotExist | <code>boolean</code> | <code>false</code> | Set to true for better performance when calling the destroy method if you know for sure the file doesn't exist. |
| options.readExisting | <code>boolean</code> | <code>true</code> | Whether or not it's okay to read previous content of file. |

<a name="file-outputManage reading, writing, and updating files.module_..FileOutput+update"></a>

#### fileOutput.update(builder) ⇒ <code>Promise</code>
Asynchronously write to file.Any of these methods are acceptable:- Directly call with a string or Uint8Array or readable stream- Function which returns a string or Uint8Array or readable stream- Function which returns a promise resolving a string or Uint8Array- Calling callback given to function- Writing or piping to callback

**Kind**: instance method of [<code>FileOutput</code>](#file-outputManage reading, writing, and updating files.module_..FileOutput)  
**Fulfil**: <code>void</code>  

| Param | Description |
| --- | --- |
| builder | Either a string, Uint8Array, promise, or function. See description. |

<a name="file-outputManage reading, writing, and updating files.module_..FileOutput+read"></a>

#### fileOutput.read() ⇒ <code>Promise</code>
Get a string promise of file contents.

**Kind**: instance method of [<code>FileOutput</code>](#file-outputManage reading, writing, and updating files.module_..FileOutput)  
**Fulfil**: <code>string</code> The contents of the file in utf8.  
<a name="file-outputManage reading, writing, and updating files.module_..FileOutput+readStream"></a>

#### fileOutput.readStream() ⇒ <code>ReadStream</code> \| <code>PassThrough</code>
Get a readable stream of file contents.

**Kind**: instance method of [<code>FileOutput</code>](#file-outputManage reading, writing, and updating files.module_..FileOutput)  
<a name="file-outputManage reading, writing, and updating files.module_..FileOutput+destroy"></a>

#### fileOutput.destroy(unlinkFile)
Cancel update and unlink the file if it exists.

**Kind**: instance method of [<code>FileOutput</code>](#file-outputManage reading, writing, and updating files.module_..FileOutput)  

| Param | Default | Description |
| --- | --- | --- |
| unlinkFile | <code>true</code> | Whether or not to unlink file if it exists. |

