
*** eddyystop:
DONE - ? wrapper hook to conditionally run a nested hook. iff()
DONE - build and coverage badges. Feathersjs accts on Travis & Coverall? 

- merge the validate... hooks.
if the last param in the called fcn defn is provided and is a fcn, then assume cb.
else check if a promise is returned.
- ? memoization for hooks.populate
- ? unit test softDelete. Would first require very large changes to feathers-tests-app-user.
Else test on a 'live' db.
- https://github.com/MichaelErmer/feathers-populate-hook
- look at this. executes a series of hooks.
function runHooksUnless(checkerFn, hooks) {
  return (hook) => {
    const check = checkerFn(hook);

    if (check && typeof check.then === 'function') {
      return check.then(runUnless);
    } else {
      return runUnless(check);
    }

    function runUnless(shouldNotRun) {
      return shouldNotRun ? hook : runHooks();
    }

    function runHooks() {
      return Promise.mapSeries(hooks, (hookFn) => {
        return hookFn(hook);
      })
      .then(() => hook);
    }
  }
}