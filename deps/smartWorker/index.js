const cluster = require('cluster');
module.exports.master = cluster.isMaster;

/**
 * Initializes a smart worker interface which allows shared data
 * between workers, creating a powerful and effective environment.
 * 
 * @example
 * const WorkerGroup = require('./deps/smartWorker');
 * WorkerGroup.init(4, () => {
 *     //Use WorkerGroup.shareData to read shared thread data
 * }, (worker) => {
 *     switch (worker) {
 *         case 0:
 *             //Task running on process 0
 *             break;
 *         case 1:
 *             //Task running on process 1
 *             break;
 *         case 2:
 *             //Task running on process 2
 *             break;
 *         case 3:
 *             //Task running on process 3
 *             break;
 *     }
 * })
 * @param {*} workerCount Amount of processes to spawn
 * @param {*} masterFunction The core that handles all responses from the workers.
 * @param {*} workerFunctions The code the workers all execute.
 */
module.exports.init = function (workerCount = 4, masterFunction = function () { }, workerFunctions = function () { }) {
    if (cluster.isMaster) {
        /**
         * This section creates the workers
         */
        const workers = [];

        module.exports.shareData = {};
        module.exports.onNewMessage = msg => { }

        /**
         * Sets a variable (key) to a value(value) that all workers
         * can read/see.
         * 
         * @param {string} key 
         * @param {*} value 
         */
        module.exports.setShareData = function (key, value) {
            module.exports.shareData[key] = value;
            workers.forEach(worker => {
                worker.send({ command: 'setNewShareData', newData: module.exports.shareData })
            });
        }

        /**
         * Create the workers
         */
        while (workerCount--) {
            const fork = cluster.fork();
            fork.send({ command: 'setNewShareData', newData: {} })
            fork.on('message', task => {
                switch (task.command) {
                    case `setNewShareData`:
                        module.exports.setShareData(task.newData.key, task.newData.value)
                        break;
                }
            })
            workers[workerCount] = fork;
        }

        /**
         * Link each worker worker the worker array 
         * so they have access to us via
         * module exports cpuList
         */
        workers.forEach((t, i) => {
            t.send({ command: 'setUid', newData: i })
            t.send({ command: 'linkWorkers', newData: workers })
            t.on('message', msg => {
                if (msg.cp) {
                    module.exports.onNewMessage(msg.cp)
                }
            });
        })
        masterFunction.call(this, arguments);


    } else {
        /**
         * Initialize a workerId export
         */
        module.exports.workerId = 0;
        process.on('message', task => {
            switch (task.command) {
                /**
                 * Initialize shared data
                 */
                case 'setNewShareData':
                    module.exports.shareData = task.newData;
                    break;
                /**
                * Set the tread worker ID
                */
                case 'setUid':
                    module.exports.workerId = task.newData;
                    module.exports.sendToMain = function (data) {
                        process.send({ cp: data });
                    }
                    workerFunctions.call(this, task.newData);
                    break;
                /**
                 * Links the cpuList export to new data
                 */
                case 'linkWorkers':
                    module.exports.cpuList = task.newData;
                    break;
            }
        })

        /**
         * Adjusts a value in the shared data section.
         * This change will affect all running workers.
         * @param {*} key 
         * @param {*} value 
         */
        module.exports.setShareData = function (key, value) {
            process.send({ command: `setNewShareData`, newData: { key, value } });
        }


    }
};