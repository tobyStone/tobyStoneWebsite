export const timeoutManager = {
    timeouts: [],
    intervals: [],

    setTimeout: function (cb, delay) {
        const id = setTimeout(() => {
            cb();
            this.clearTimeout(id); // Cleanup after execution
        }, delay);
        this.timeouts.push(id);
        return id;
    },

    clearTimeout: function (id) {
        clearTimeout(id);
        this.timeouts = this.timeouts.filter(t => t !== id);
    },

    setInterval: function (cb, delay) {
        const id = setInterval(cb, delay);
        this.intervals.push(id);
        return id;
    },

    clearInterval: function (id) {
        clearInterval(id);
        this.intervals = this.intervals.filter(i => i !== id);
    },

    clearAll: function () {
        this.timeouts.forEach(id => clearTimeout(id));
        this.timeouts = [];
        this.intervals.forEach(id => clearInterval(id));
        this.intervals = [];
    }
};
