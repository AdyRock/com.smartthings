const Homey = require('homey');

module.exports = [

    {
        method: 'GET',
        path: '/',
        public: true,
        fn: async function (args, callback) {
            //const result = await Homey.app.getSomething( args );
            console.log("Get: ", args)

            // callback follows ( err, result )
            const result = "OK";
            callback(null, result);

            // access /?foo=bar as args.query.foo
        }
    },
    {
        method: 'GET',
        path: '/getLog/',
        fn: async function (args, callback) {
            return callback(null, Homey.app.diagLog);
        }
    },
    {
        method: 'GET',
        path: '/getDetect/',
        fn: async function (args, callback) {
            return callback(null, Homey.app.detectedDevices);
        }
    },

    {
        method: 'GET',
        path: '/webhook',
        public: true,
        fn: async function (args, callback) {
            //const result = await Homey.app.getSomething( args );
            console.log("Get: ", args)

            // callback follows ( err, result )
            const result = "OK";
            callback(null, result);

            // access /?foo=bar as args.query.foo
        }
    },

    {
        method: 'POST',
        path: '/clearLog/',
        fn: function (args, callback) {
            Homey.app.diagLog = "";
            return callback(null, "ok");
        }
    },
    {
        method: 'POST',
        path: '/',
        public: true,
        fn: function (args, callback) {
            //const result = Homey.app.addSomething( args );
            console.log("Post: ", args)

            var response = "";
            const result = response;
            console.log("Post Reply: ", result)
            if (result instanceof Error) return callback(result);
            return callback(null, result);
        }
    },

    {
        method: 'POST',
        path: '/webhook',
        public: true,
        fn: function (args, callback) {
            //const result = Homey.app.addSomething( args );
            console.log("Post: ", args)

            var response = "";
            if (args.body.pingData && args.body.pingData.challenge) {
                response = {
                    "pingData": {
                        "challenge": args.body.pingData.challenge
                    }

                }
            }
            const result = response;
            console.log("Post Reply: ", result)
            if (result instanceof Error) return callback(result);
            return callback(null, result);
        }
    },

    {
        method: 'PUT',
        path: '/webhook',
        public: true,
        fn: function (args, callback) {
            //const result = Homey.app.updateSomething( args );
            console.log("Put: ", args)
            if (result instanceof Error) return callback(result);
            return callback(null, result);
        }
    },

    {
        method: 'DELETE',
        path: '/webhook',
        public: true,
        fn: function (args, callback) {
            //const result = Homey.app.deleteSomething( args );
            console.log("Delete: ", args)
            if (result instanceof Error) return callback(result);
            return callback(null, result);
        }
    }

]