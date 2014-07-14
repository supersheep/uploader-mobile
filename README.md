# uploader

> File Upload Component


###APIs

####Uploader(elem,config)

construct an uploader with the passing elemement

####config

- `action` url to upload
- `theme` theme for process and show items
- `multipleLen` maximum len of multi length select, exceed will be cut
- `name` name for file field
- `queueTarget` container to put queue items

####.upload(id)

upload file in `id` of the queue

####.remove(id)

remove file in `id` of the queue

###Events

#### select

emits after file selected

- `ev.files` Array<Files> files selected by user

#### add

emits after file added to queue

- `ev.file` File

#### start

emits after file start to upload

- `ev.file` File

#### progress

emits on file progressing

- `ev.file` File
- `ev.loaded` byte loaded
- `ev.total`  total bytes

#### success

emits on file upload success

- `ev.file` File
- `ev.data` json data responsed from server

#### error

emits on error occurs

- `ev.file` File
- `ev.code` Error code
- `ev.message` Error message
- `ev.data` json data that server responsed

#### remove

emits when file removed from queue

- `ev.file` File