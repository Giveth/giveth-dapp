# Contributing to feathers-hooks-common 

We would love for you to contribute code and help make Feathersjs even more productive than it is
today! Here are some guidelines we would like you to follow:

 - [Question or Problem?](#question)
 - [Submission Guidelines](#submit)
 - [Coding Rules](#rules)

## <a name="question"></a> Got a Question or Problem?

If you have questions about how to *use* Feathersjs, you are likely to get effective help from
the community here on [Slack](https://feathersjs.slack.com/messages/general/).

## <a name="submit"></a> Pull Requests (PR)

### <a name="submit-pr"></a> Submitting a Pull Request
Before you submit your Pull Request (PR) consider the following guidelines:

* Search [GitHub](https://github.com/feathersjs/feathers-hooks-common) for an open or closed PR
  that relates to your submission. You don't want to duplicate effort.
* Make your changes in a new git branch:

     ```shell
     git checkout -b my-fix-branch master
     ```

* Create your patch, **including appropriate test cases**.
* Follow our [Coding Rules](#rules).
* Run the full test suite with `npm test` and ensure that all tests pass.
* Commit your changes using a descriptive commit message.

     ```shell
     git commit -a
     ```
  Note: the optional commit `-a` command line option will automatically "add" and "rm" edited files.

* Push your branch to GitHub:

    ```shell
    git push origin my-fix-branch
    ```

* In GitHub, send a pull request.
* If a change is suggested then:
  * Make the required updates.
  * Re-run the test suite to ensure tests are still passing.
  * Rebase your branch and force push to your GitHub repository (this will update your Pull Request):

    ```shell
    git rebase master -i
    git push -f
    ```

That's it! Thank you for your contribution!

### After your pull request is merged

After your pull request is merged, you can safely delete your branch and pull the changes
from the main (upstream) repository:

* Delete the remote branch on GitHub:

    ```shell
    git push origin --delete my-fix-branch
    ```

* Check out the master branch:

    ```shell
    git checkout master -f
    ```

* Delete the local branch:

    ```shell
    git branch -D my-fix-branch
    ```

* Update your master with the latest upstream version:

    ```shell
    git pull --ff upstream master
    ```

## <a name="rules"></a> Code

The most important need is that all code changes and contributions have unit tests.

* Place unit tests in `/test`. They should require their code from `/lib`.
* Unit tests should not require a build step. Feel free to use the latest Nodejs syntax.
* The repo is set up to use Mocha and Chai.
You can use any assertion style but most tests are presently using the assert style.
* `npm test` will build, lint and test.
This command needs to complete successfully before you submit a PR.
* `npm run test:build` will build and test.
* `npm run test:only` will just run the tests.

The build:

* Add your code to `/src`. The build step expands it into `/lib`.
* Babel is set up to use plugin babel-preset-es2015. Add others if your really have to.

Linting and docs:

* The lint step uses ESLint with the AirBnB rule set.
ESLint is the most popular JavaScript linting tool right now,
and AirBnB’s style guide is the most widely-used style guide.
* `npm run eslint` runs the linting.
* Feel free to add JSDoc blocks for your new hooks as that helps us write documentation.
* The code should immediately follow any JSDoc blocks.
* JSDoc blocks are linted.
Follow them by a blank line if you have linting issues, as that stops the block from being linted.
