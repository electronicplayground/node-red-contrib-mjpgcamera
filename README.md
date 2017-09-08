# node-red-contrib-mjpgcamera

Node-Red nodes for mjpg-streamer.

Visit https://github.com/jacksonliam/mjpg-streamer for more details.



## mjpg-consumer

A node that consumes a mjpeg stream and outputs the latest saved frame as buffer

<p><b>Stream</b> should be the address of the stream</p>
<p><b>Streaming interval</b> should be the number of seconds between buffer outputs</p>

<p>To enable output send "start" as payload (Can use an inject node or a dashboard switch). To disable, send "stop".</p>
