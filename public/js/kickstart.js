requirejs.config({
    "baseUrl": "js",
    "paths": {
      "jquery": "//code.jquery.com/jquery-2.0.0",
	  "bootstrap": "bootstrap",
	  "socket.io": "/socket.io/socket.io"
    },
	"shim": {
		"bootstrap": {
			"dep":["jquery"]
		},
		"socket.io": {
			"exports":"io"
		}
	}
});

// Load the main app module to start the app
requirejs(["hammer"]);
