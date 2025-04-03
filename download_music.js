/* 这是一个示例脚本，用于下载示例音乐文件 */
powershell -Command \
Invoke-WebRequest
-Uri
https://file-examples.com/wp-content/uploads/2017/11/file_example_MP3_700KB.mp3
-OutFile
vue-frontend/public/music/background.mp3
\
