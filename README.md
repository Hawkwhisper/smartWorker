# About
This basically makes it a bit easier to use node cluster, while including some very useful extras, such as being able to share variable data between all workers.

You can read more about the standard node cluster here: https://nodejs.org/api/cluster.html

## Why cluster?
Cluster allows you to host web servers on the same port for each task, meaning you end up with a very well optimized NET server, be it a database,
express server or anything that uses TCP, really.

## Why smartWorker?
Honestly, this is a small script I wrote mainly for myself since I use cluster all the time. It just allows you to group everything together in a more organized way.

### EXAMPLE
Import the script as WorkerGroup
```js
const WorkerGroup = require('./deps/smartWorker');
```

Now we're going to call a function from WorkerGroup which initializes the workflow.
```js
WorkerGroup.init(4, handler_task, worker_task);
```
The first argument is a number, it represents how many tasks we want to spawn, it's easier to think
of this as 'threads', although we don't really have any direct control over which thread actually handles the task,
thats mostly left up to the operating system / kernel.

handler_task is the task that basically handles the workers. It's the same as "cluster.isMaster". 
worker_task is the task that the workers will run. It passes an **argument** called "worker", which allows you to
identify the worker.

All together, you get this:
```js
const WorkerGroup = require('./deps/smartWorker');
WorkerGroup.init(4, () => {
    //Use Term.shareData to read shared thread data
}, (worker) => {
    switch (worker) {
        case 0:
            //Task running on process 0
            break;
        case 1:
            //Task running on process 1
            break;
        case 2:
            //Task running on process 2
            break;
        case 3:
            //Task running on process 3
            break;
    }
})
```

As you can see, we can use a switch statement to conditionally tell what thread to do what.

### Useful Addons
You can use `WorkerGroup.onNewMessage` inside of init to handle what happens when a worker sends the command, `WorkerGroup.sendToMain`

 ***handler task functions***
 WorkerGroup.onNewMessage -> Handles new messages sent from worker tasks.
    : Usage: `WorkerGroup.onNewMessage = function(...args) {...}`
 WorkerGroup.setShareData(*key*, *value*) -> Sets a value for all the threads running.
    : Usage: `WorkerGroup.setShareData('time', new Date(Date.now()))`;

 ***worker task functions/variables***
 WorkerGroup.workerId -> Returns the ID of the worker in question
    : Usage: `console.log(WorkerGroup.workerId);`
 WorkerGroup.sendToMain(*data*) -> Sends a message to the handler task.
    : Usage: `WorkerGroup.sendToMain({command:'hello'})`;
 WorkerGroup.setShareData(*key*, *value*) -> Sets a value for all the threads running.
    : Usage: `WorkerGroup.setShareData('time', new Date(Date.now()))`;

## Example App
This is an example app using this to create a simple express server.
```js
const WorkerGroup = require('./deps/smartWorker');
WorkerGroup.init(require('os').cpus().length, () => {
    console.log(`Core process started.`)

    //For this tiny example, we're going to monitor how many connections
    //each worker has.
    var totalConnections = 0;
    WorkerGroup.onNewMessage = msg => {
        totalConnections++;
        console.log(msg, 'Total: ', totalConnections);
    }

}, (worker) => {
    const express = require('express')
    const app = express()
    const port = 3000

    var connections = 0;

    app.get('/', (req, res) => {
        connections++;
        WorkerGroup.setShareData(`worker_${worker}_connections`, connections);
        WorkerGroup.sendToMain(`Worker ${worker} has a new connection! that totals ${connections}.`);
        res.sendFile(`./public/index.html`)
    })

    app.listen(port, () => {
    })
})
```

Now we have a super optimized server!
