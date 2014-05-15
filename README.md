# uploader

> 文件上传组件


###APIs

####Uploader(elem,config)

construct an uploader with the passing elemement

####config

- `config.action` url to upload
- `config.blah` blah blah

####.upload(index)

upload file in `index` of the queue

####.cancel(index)

cancel file in `index` of the queue, or the current uploading file

####.remove(index)

remove file in `index` of the queue

####.stop

stop uploading


###Events

#### select

选择完文件后触发

- `ev.files` 文件完文件后返回的文件数据

#### add

向队列添加文件后触发

- `ev.index` 文件在队列中的索引值
- `ev.file` 文件数据

#### start

开始上传后触发

- `ev.index` 要上传的文件在队列中的索引值
- `ev.file` 文件数据

#### progress

正在上传中时触发，这个事件在iframe上传方式中不存在

- `ev.file` 文件数据
- `ev.loaded`  已经加载完成的字节数
- `ev.total`  文件总字节数

#### complete

上传成功后触发

- `ev.index` 上传中的文件在队列中的索引值
- `ev.file` 文件数据
- `ev.result` 服务器返回的数据

#### success

上传成功后触发

- `ev.index` 上传中的文件在队列中的索引值
- `ev.file` 文件数据
- `ev.result` 服务器返回的数据

### cancel

取消上传后触发

- `ev.index` 上传中的文件在队列中的索引值

#### error
    
发生错误时触发

- `ev.index` 上传中的文件在队列中的索引值
- `ev.file` 文件数据
- `ev.result` 服务器端返回的数据
- `ev.status` 服务器端返回的状态码，status如果是-1，说明是前端验证返回的失败

#### queueComplete

批量上传成功后触发

#### remove

从队列中删除文件后触发

- `ev.index` 文件在队列中的索引值
- `ev.file` 文件数据