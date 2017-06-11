var MjpegCamera = require('mjpeg-camera');
var util = require('util');
var Stream = require('stream');

/**
 *  @param {Object} options
 *    @param {Function=} options.transform
 *    @param {String=} options.ext
 *    @param {Boolean=} options.onData
 *    @param {Object=} options.context
 */

function StreamPipe(options) {
  options = options || {};

  this.transform = options.transform || function(data) { return data; };

  this.writable = true;
  this.context = options.context;
  this.filter = options.filter || function() { return true; };

  this.onData = options.onData;
}
util.inherits(StreamPipe, Stream);

StreamPipe.prototype.write = function(data) {

  // If the data doesn't pass the filter, return
  if (!this.filter(data)) return;
  // Transform the data before write
  var transformedData = this.transform.call(this.context, data);
  // Write data
  if (this.onData != null && this.onData != undefined)
  {
    this.onData.call(this.context,transformedData);
  }
};


StreamPipe.prototype.end = function(data) {
  this.write(data);
  this.writable = false;
};

StreamPipe.prototype.destroy = function() {
  this.writable = false;
};



module.exports = function(RED) {
    function MjpgConsumer(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        var streamPipe;
        var camera;
        var sendData = false;
        var isCameraOn = false;

        this.on('input', function(msg) {
          console.log("input");

            if (streamPipe == null){
              console.log("create streampipe");
              streamPipe = new StreamPipe({
                    transform: function(frame) {
                      //console.log(frame);
                      return frame.data;
                    },
                    onData: function(data){
                      //console.log("ondata");
                      //console.log(data);
                      console.log(sendData);
                      if (sendData == true)
                        console.log("send data");
                        var msg = {};
                        msg.payload = data;
                        node.send(msg);
                        sendData = false;
                        stopCamera();
                    }
                  });
            }

            if (camera == null){
              // Create an MjpegCamera instance
              camera = new MjpegCamera({
                /*name: 'backdoor',
                user: 'admin',
                password: 'wordup',
                url: 'http://192.168.7.1/video',
                motion: true*/
                url: config.stream,
                motion: false
              });
            }

           if (msg.payload == true){

              startCamera();
            // Pipe frames to our fileWriter so we gather jpeg frames into the /frames folder
              camera.pipe(streamPipe);
              sendData = true;
              //startRecording();
            }
            else {
              stopCamera();
              sendData = false;
            }

            //node.send(msg);
        });

        var startCamera = function(){

            if (isCameraOn)
                return;

            console.log("start recording");
            isCameraOn = true;

            camera.start();


            /*setTimeout(() => {
            child.kill(); // does not terminate the node process in the shell
            }, 5000);*/
        }

        var stopCamera = function(){
          console.log("stop recording")
          camera.stop();
          isCameraOn = false;
        }

        this.on('close', function(){
          console.log("closing");
          if (camera != null) {
              camera.stop();
          }

        })

    }
    RED.nodes.registerType("mjpg-consumer",MjpgConsumer);
}
