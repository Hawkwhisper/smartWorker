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