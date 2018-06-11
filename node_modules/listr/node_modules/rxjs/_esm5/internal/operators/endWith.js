/** PURE_IMPORTS_START _observable_fromArray,_observable_scalar,_observable_empty,_observable_concat,_util_isScheduler PURE_IMPORTS_END */
import { fromArray } from '../observable/fromArray';
import { scalar } from '../observable/scalar';
import { empty } from '../observable/empty';
import { concat as concatStatic } from '../observable/concat';
import { isScheduler } from '../util/isScheduler';
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
export function endWith() {
    var array = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        array[_i] = arguments[_i];
    }
    return function (source) {
        var scheduler = array[array.length - 1];
        if (isScheduler(scheduler)) {
            array.pop();
        }
        else {
            scheduler = null;
        }
        var len = array.length;
        if (len === 1 && !scheduler) {
            return concatStatic(source, scalar(array[0]));
        }
        else if (len > 0) {
            return concatStatic(source, fromArray(array, scheduler));
        }
        else {
            return concatStatic(source, empty(scheduler));
        }
    };
}
//# sourceMappingURL=endWith.js.map
