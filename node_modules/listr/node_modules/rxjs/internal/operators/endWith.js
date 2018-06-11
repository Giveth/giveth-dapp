"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fromArray_1 = require("../observable/fromArray");
var scalar_1 = require("../observable/scalar");
var empty_1 = require("../observable/empty");
var concat_1 = require("../observable/concat");
var isScheduler_1 = require("../util/isScheduler");
/* tslint:enable:max-line-length */
/**
 * Returns an Observable that emits the items you specify as arguments after it finishes emitting
 * items emitted by the source Observable.
 *
 * @param {...T} values - Items you want the modified Observable to emit last.
 * @param {Scheduler} [scheduler] - A {@link IScheduler} to use for scheduling
 * the emissions of the `next` notifications.
 * @return {Observable} An Observable that emits the items emitted by the source Observable
 *  and then emits the items in the specified Iterable.
 * @method endWith
 * @owner Observable
 */
function endWith() {
    var array = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        array[_i] = arguments[_i];
    }
    return function (source) {
        var scheduler = array[array.length - 1];
        if (isScheduler_1.isScheduler(scheduler)) {
            array.pop();
        }
        else {
            scheduler = null;
        }
        var len = array.length;
        if (len === 1 && !scheduler) {
            return concat_1.concat(source, scalar_1.scalar(array[0]));
        }
        else if (len > 0) {
            return concat_1.concat(source, fromArray_1.fromArray(array, scheduler));
        }
        else {
            return concat_1.concat(source, empty_1.empty(scheduler));
        }
    };
}
exports.endWith = endWith;
//# sourceMappingURL=endWith.js.map