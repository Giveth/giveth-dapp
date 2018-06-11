# Change Log

## [v3.7.3](https://github.com/feathersjs/feathers-hooks-common/tree/v3.7.3) (2017-09-17)
[Full Changelog](https://github.com/feathersjs/feathers-hooks-common/compare/v3.7.2...v3.7.3)

**Implemented enhancements:**

- no need for populate in softDelete [\#253](https://github.com/feathersjs/feathers-hooks-common/pull/253) ([superbarne](https://github.com/superbarne))
- Allow schema IDs in first parameter of validateSchema [\#251](https://github.com/feathersjs/feathers-hooks-common/pull/251) ([CypherAlmasy](https://github.com/CypherAlmasy))

**Fixed bugs:**

- no need for populate in softDelete [\#253](https://github.com/feathersjs/feathers-hooks-common/pull/253) ([superbarne](https://github.com/superbarne))

**Closed issues:**

- serialize running twice [\#255](https://github.com/feathersjs/feathers-hooks-common/issues/255)
- An in-range update of feathers is breaking the build 🚨 [\#249](https://github.com/feathersjs/feathers-hooks-common/issues/249)

**Merged pull requests:**

- Add babel-polyfill and package-lock.json [\#250](https://github.com/feathersjs/feathers-hooks-common/pull/250) ([daffl](https://github.com/daffl))

## [v3.7.2](https://github.com/feathersjs/feathers-hooks-common/tree/v3.7.2) (2017-08-23)
[Full Changelog](https://github.com/feathersjs/feathers-hooks-common/compare/v3.7.1...v3.7.2)

**Implemented enhancements:**

- Fix \_include being overwritten with empty array [\#246](https://github.com/feathersjs/feathers-hooks-common/pull/246) ([rodeyseijkens](https://github.com/rodeyseijkens))

**Closed issues:**

- Support $search in query syntax [\#141](https://github.com/feathersjs/feathers-hooks-common/issues/141)
- Look into the Babel transpiling issue in a section of populate hook. [\#116](https://github.com/feathersjs/feathers-hooks-common/issues/116)

**Merged pull requests:**

- Update debug to the latest version 🚀 [\#244](https://github.com/feathersjs/feathers-hooks-common/pull/244) ([greenkeeper[bot]](https://github.com/apps/greenkeeper))

## [v3.7.1](https://github.com/feathersjs/feathers-hooks-common/tree/v3.7.1) (2017-08-07)
[Full Changelog](https://github.com/feathersjs/feathers-hooks-common/compare/v3.7.0...v3.7.1)

**Fixed bugs:**

- Correct falsy provider handling [\#243](https://github.com/feathersjs/feathers-hooks-common/pull/243) ([adamvr](https://github.com/adamvr))

## [v3.7.0](https://github.com/feathersjs/feathers-hooks-common/tree/v3.7.0) (2017-08-06)
[Full Changelog](https://github.com/feathersjs/feathers-hooks-common/compare/v3.6.1...v3.7.0)

**Implemented enhancements:**

- Add top level provider option to populate hook [\#239](https://github.com/feathersjs/feathers-hooks-common/pull/239) ([adamvr](https://github.com/adamvr))

**Closed issues:**

- Insert commonhook into a function. [\#241](https://github.com/feathersjs/feathers-hooks-common/issues/241)
- Get user is called 4 times in main usage case instead of 1 [\#164](https://github.com/feathersjs/feathers-hooks-common/issues/164)

## [v3.6.1](https://github.com/feathersjs/feathers-hooks-common/tree/v3.6.1) (2017-07-27)
[Full Changelog](https://github.com/feathersjs/feathers-hooks-common/compare/v3.6.0...v3.6.1)

**Implemented enhancements:**

- Made `populate` hook friendlier to `thenifyHook` util [\#233](https://github.com/feathersjs/feathers-hooks-common/pull/233) ([eddyystop](https://github.com/eddyystop))

**Fixed bugs:**

- Fixed 2 issues with validateSchema [\#234](https://github.com/feathersjs/feathers-hooks-common/pull/234) ([eddyystop](https://github.com/eddyystop))

## [v3.6.0](https://github.com/feathersjs/feathers-hooks-common/tree/v3.6.0) (2017-07-27)
[Full Changelog](https://github.com/feathersjs/feathers-hooks-common/compare/v3.5.5...v3.6.0)

**Implemented enhancements:**

- Added hook utility thenifyHook [\#232](https://github.com/feathersjs/feathers-hooks-common/pull/232) ([eddyystop](https://github.com/eddyystop))

**Closed issues:**

- How to break and return a value to client in before hook [\#231](https://github.com/feathersjs/feathers-hooks-common/issues/231)
- Store `deleted` \(soft-delete\) fields as a date instead of a boolean [\#228](https://github.com/feathersjs/feathers-hooks-common/issues/228)
- populate: hook.params.user is not populated in child items [\#220](https://github.com/feathersjs/feathers-hooks-common/issues/220)

**Merged pull requests:**

- Update sift to the latest version 🚀 [\#230](https://github.com/feathersjs/feathers-hooks-common/pull/230) ([greenkeeper[bot]](https://github.com/apps/greenkeeper))

## [v3.5.5](https://github.com/feathersjs/feathers-hooks-common/tree/v3.5.5) (2017-06-20)
[Full Changelog](https://github.com/feathersjs/feathers-hooks-common/compare/v3.5.3...v3.5.5)

**Fixed bugs:**

- Updated stashBefore so it clones context.data rather than references it. [\#219](https://github.com/feathersjs/feathers-hooks-common/pull/219) ([eddyystop](https://github.com/eddyystop))

**Closed issues:**

- Setting useInnerPopulate to false causes child schema to populate [\#218](https://github.com/feathersjs/feathers-hooks-common/issues/218)

## [v3.5.3](https://github.com/feathersjs/feathers-hooks-common/tree/v3.5.3) (2017-06-19)
[Full Changelog](https://github.com/feathersjs/feathers-hooks-common/compare/v3.5.2...v3.5.3)

## [v3.5.2](https://github.com/feathersjs/feathers-hooks-common/tree/v3.5.2) (2017-06-19)
[Full Changelog](https://github.com/feathersjs/feathers-hooks-common/compare/v3.5.1...v3.5.2)

**Fixed bugs:**

- Update populate.js [\#206](https://github.com/feathersjs/feathers-hooks-common/pull/206) ([Creiger](https://github.com/Creiger))

**Closed issues:**

- Unpin ajv dependency so Greenkeeper can move to 5.1.6 once ajv fixes its issue. [\#213](https://github.com/feathersjs/feathers-hooks-common/issues/213)
- An in-range update of ajv is breaking the build 🚨 [\#211](https://github.com/feathersjs/feathers-hooks-common/issues/211)
- Gain access to the current hook object inside the validateSchema async validator [\#209](https://github.com/feathersjs/feathers-hooks-common/issues/209)

**Merged pull requests:**

- Unpin AJV dependency [\#216](https://github.com/feathersjs/feathers-hooks-common/pull/216) ([daffl](https://github.com/daffl))
- Update ajv to the latest version 🚀 [\#215](https://github.com/feathersjs/feathers-hooks-common/pull/215) ([greenkeeper[bot]](https://github.com/apps/greenkeeper))
- fix: pin ajv to 5.1.5 [\#212](https://github.com/feathersjs/feathers-hooks-common/pull/212) ([eddyystop](https://github.com/eddyystop))

## [v3.5.1](https://github.com/feathersjs/feathers-hooks-common/tree/v3.5.1) (2017-05-30)
[Full Changelog](https://github.com/feathersjs/feathers-hooks-common/compare/v3.5.0...v3.5.1)

**Implemented enhancements:**

- Add defer Hook [\#67](https://github.com/feathersjs/feathers-hooks-common/issues/67)

**Fixed bugs:**

- add missing `feathers-hooks` dependency [\#202](https://github.com/feathersjs/feathers-hooks-common/pull/202) ([ahdinosaur](https://github.com/ahdinosaur))

**Closed issues:**

- Question: Way to skip hooks? [\#204](https://github.com/feathersjs/feathers-hooks-common/issues/204)

**Merged pull requests:**

- Changed tests for chai 4.0.0 [\#205](https://github.com/feathersjs/feathers-hooks-common/pull/205) ([eddyystop](https://github.com/eddyystop))

## [v3.5.0](https://github.com/feathersjs/feathers-hooks-common/tree/v3.5.0) (2017-05-24)
[Full Changelog](https://github.com/feathersjs/feathers-hooks-common/compare/v3.3.3...v3.5.0)

## [v3.3.3](https://github.com/feathersjs/feathers-hooks-common/tree/v3.3.3) (2017-05-24)
[Full Changelog](https://github.com/feathersjs/feathers-hooks-common/compare/v3.4.0...v3.3.3)

## [v3.4.0](https://github.com/feathersjs/feathers-hooks-common/tree/v3.4.0) (2017-05-24)
[Full Changelog](https://github.com/feathersjs/feathers-hooks-common/compare/v3.3.2...v3.4.0)

**Implemented enhancements:**

- Make childField and parentField optional to support custom queries [\#187](https://github.com/feathersjs/feathers-hooks-common/issues/187)
- Allow parents to enable populate on their direct children  [\#186](https://github.com/feathersjs/feathers-hooks-common/issues/186)
- convert date for db adapters [\#153](https://github.com/feathersjs/feathers-hooks-common/issues/153)
- Added stashBefore hook to stash current value of record before [\#199](https://github.com/feathersjs/feathers-hooks-common/pull/199) ([eddyystop](https://github.com/eddyystop))
- Added tests in populate for non related field joins [\#195](https://github.com/feathersjs/feathers-hooks-common/pull/195) ([eddyystop](https://github.com/eddyystop))
- Enhanced populate so parentField and childField are optional [\#194](https://github.com/feathersjs/feathers-hooks-common/pull/194) ([eddyystop](https://github.com/eddyystop))
- Improved code quality of populate [\#193](https://github.com/feathersjs/feathers-hooks-common/pull/193) ([eddyystop](https://github.com/eddyystop))
- Added useInnerPopulate option to populate [\#192](https://github.com/feathersjs/feathers-hooks-common/pull/192) ([eddyystop](https://github.com/eddyystop))
- Improved code quality of "populate" [\#190](https://github.com/feathersjs/feathers-hooks-common/pull/190) ([eddyystop](https://github.com/eddyystop))

**Fixed bugs:**

- Resolved issues in softDelete caused by pull \#163 [\#197](https://github.com/feathersjs/feathers-hooks-common/pull/197) ([eddyystop](https://github.com/eddyystop))
- Fixed populate issue with recursive include [\#191](https://github.com/feathersjs/feathers-hooks-common/pull/191) ([eddyystop](https://github.com/eddyystop))
- Fix params-from-client import statement [\#189](https://github.com/feathersjs/feathers-hooks-common/pull/189) ([mxgr7](https://github.com/mxgr7))

**Closed issues:**

- Should discard and populate first make a copy of the result objects? [\#150](https://github.com/feathersjs/feathers-hooks-common/issues/150)

**Merged pull requests:**

- Changed hook =\> context in hooks referred to in The Basics [\#200](https://github.com/feathersjs/feathers-hooks-common/pull/200) ([eddyystop](https://github.com/eddyystop))
- Small text edits in tests [\#198](https://github.com/feathersjs/feathers-hooks-common/pull/198) ([eddyystop](https://github.com/eddyystop))
- Deprecated client tests in favor of params-from-client tests [\#196](https://github.com/feathersjs/feathers-hooks-common/pull/196) ([eddyystop](https://github.com/eddyystop))

## [v3.3.2](https://github.com/feathersjs/feathers-hooks-common/tree/v3.3.2) (2017-05-09)
[Full Changelog](https://github.com/feathersjs/feathers-hooks-common/compare/v3.3.1...v3.3.2)

## [v3.3.1](https://github.com/feathersjs/feathers-hooks-common/tree/v3.3.1) (2017-05-09)
[Full Changelog](https://github.com/feathersjs/feathers-hooks-common/compare/v3.3.0...v3.3.1)

## [v3.3.0](https://github.com/feathersjs/feathers-hooks-common/tree/v3.3.0) (2017-05-09)
[Full Changelog](https://github.com/feathersjs/feathers-hooks-common/compare/v3.2.0...v3.3.0)

**Implemented enhancements:**

- Add hook to post-filter results [\#178](https://github.com/feathersjs/feathers-hooks-common/issues/178)
- softDelete fix for double 'get' call is not ideal [\#163](https://github.com/feathersjs/feathers-hooks-common/issues/163)
- \[feature request\] validateSchema receives ajv instance instead of Ajv constructor [\#154](https://github.com/feathersjs/feathers-hooks-common/issues/154)
- debug hook doesn't log error on error hook [\#152](https://github.com/feathersjs/feathers-hooks-common/issues/152)
- Populate should throw upon detecting an ORM result. [\#144](https://github.com/feathersjs/feathers-hooks-common/issues/144)
- Populate should allow empty relationship field [\#138](https://github.com/feathersjs/feathers-hooks-common/issues/138)
- Populate should error when related entity is not found [\#135](https://github.com/feathersjs/feathers-hooks-common/issues/135)
- populate should set provider to null [\#134](https://github.com/feathersjs/feathers-hooks-common/issues/134)
- Added sifter hook - filter result with mongodb queries [\#182](https://github.com/feathersjs/feathers-hooks-common/pull/182) ([eddyystop](https://github.com/eddyystop))
- Added setNow hook [\#181](https://github.com/feathersjs/feathers-hooks-common/pull/181) ([eddyystop](https://github.com/eddyystop))
- Added paramsForServer util & paramsFromClient hook. Issues \#123 [\#177](https://github.com/feathersjs/feathers-hooks-common/pull/177) ([eddyystop](https://github.com/eddyystop))
- enable array syntax for `iff`, `iff-else` and `when` [\#176](https://github.com/feathersjs/feathers-hooks-common/pull/176) ([beeplin](https://github.com/beeplin))
- Added preventChanges before patch hook [\#175](https://github.com/feathersjs/feathers-hooks-common/pull/175) ([eddyystop](https://github.com/eddyystop))
- Added existsByDot util in preparaion for leaveAlone hook [\#174](https://github.com/feathersjs/feathers-hooks-common/pull/174) ([eddyystop](https://github.com/eddyystop))
- Added provider to populate schema. Issue \#134 [\#172](https://github.com/feathersjs/feathers-hooks-common/pull/172) ([eddyystop](https://github.com/eddyystop))
- Fixed populate to return \[\] or null if no joined records found. Issue… [\#171](https://github.com/feathersjs/feathers-hooks-common/pull/171) ([eddyystop](https://github.com/eddyystop))
- Allow undefined parentField in populate. Issue \#138 [\#170](https://github.com/feathersjs/feathers-hooks-common/pull/170) ([eddyystop](https://github.com/eddyystop))
- Populate thows if ORM found. Issue \#144 [\#169](https://github.com/feathersjs/feathers-hooks-common/pull/169) ([eddyystop](https://github.com/eddyystop))
- Fixed debug hook issue \#152 [\#167](https://github.com/feathersjs/feathers-hooks-common/pull/167) ([eddyystop](https://github.com/eddyystop))
- Fixed softDelete issues \#147, \#163 [\#166](https://github.com/feathersjs/feathers-hooks-common/pull/166) ([eddyystop](https://github.com/eddyystop))
- Add async schema validation support [\#159](https://github.com/feathersjs/feathers-hooks-common/pull/159) ([TheBeastOfCaerbannog](https://github.com/TheBeastOfCaerbannog))

**Fixed bugs:**

- serialize mutates the given schema [\#158](https://github.com/feathersjs/feathers-hooks-common/issues/158)
- Make softDelete more rugged [\#147](https://github.com/feathersjs/feathers-hooks-common/issues/147)
- Using iff with restrictToOwner [\#140](https://github.com/feathersjs/feathers-hooks-common/issues/140)
- Edited shift hook text [\#183](https://github.com/feathersjs/feathers-hooks-common/pull/183) ([eddyystop](https://github.com/eddyystop))
- Fixed reported param issue in serialize. Issue \#158 [\#173](https://github.com/feathersjs/feathers-hooks-common/pull/173) ([eddyystop](https://github.com/eddyystop))
- Removed unneeded console.log's in verifySchema [\#168](https://github.com/feathersjs/feathers-hooks-common/pull/168) ([eddyystop](https://github.com/eddyystop))
- Fixes 'homepage' in package.json [\#165](https://github.com/feathersjs/feathers-hooks-common/pull/165) ([cpsubrian](https://github.com/cpsubrian))

**Closed issues:**

- Consolidate setCreatedAt and setUpdatedAt hooks to a more generic hook [\#129](https://github.com/feathersjs/feathers-hooks-common/issues/129)
- Add array traversal to `pluck` hook [\#126](https://github.com/feathersjs/feathers-hooks-common/issues/126)
- Add a client-side hook which formats client params for server-side `client` hook. [\#123](https://github.com/feathersjs/feathers-hooks-common/issues/123)
- Filter returned items keeping those that satisfy some criteria [\#77](https://github.com/feathersjs/feathers-hooks-common/issues/77)

## [v3.2.0](https://github.com/feathersjs/feathers-hooks-common/tree/v3.2.0) (2017-05-01)
[Full Changelog](https://github.com/feathersjs/feathers-hooks-common/compare/v3.1.0...v3.2.0)

## [v3.1.0](https://github.com/feathersjs/feathers-hooks-common/tree/v3.1.0) (2017-05-01)
[Full Changelog](https://github.com/feathersjs/feathers-hooks-common/compare/v3.0.0...v3.1.0)

**Implemented enhancements:**

- Soft delete doubles calls for service.get [\#161](https://github.com/feathersjs/feathers-hooks-common/issues/161)
- test for validate-schema with ajv instance passed [\#162](https://github.com/feathersjs/feathers-hooks-common/pull/162) ([beeplin](https://github.com/beeplin))
- Soft delete will call service.get only once [\#160](https://github.com/feathersjs/feathers-hooks-common/pull/160) ([NikitaVlaznev](https://github.com/NikitaVlaznev))

**Merged pull requests:**

- Update ajv to the latest version 🚀 [\#157](https://github.com/feathersjs/feathers-hooks-common/pull/157) ([greenkeeper[bot]](https://github.com/apps/greenkeeper))
- Update semistandard to the latest version 🚀 [\#156](https://github.com/feathersjs/feathers-hooks-common/pull/156) ([greenkeeper[bot]](https://github.com/apps/greenkeeper))
- validateSchema's 2nd parameter can be ajv instance [\#155](https://github.com/feathersjs/feathers-hooks-common/pull/155) ([beeplin](https://github.com/beeplin))
- Update feathers-hooks to the latest version 🚀 [\#151](https://github.com/feathersjs/feathers-hooks-common/pull/151) ([greenkeeper[bot]](https://github.com/apps/greenkeeper))
- Update dependencies to enable Greenkeeper 🌴 [\#148](https://github.com/feathersjs/feathers-hooks-common/pull/148) ([greenkeeper[bot]](https://github.com/apps/greenkeeper))

## [v3.0.0](https://github.com/feathersjs/feathers-hooks-common/tree/v3.0.0) (2017-04-08)
[Full Changelog](https://github.com/feathersjs/feathers-hooks-common/compare/v3.0.0-pre.1...v3.0.0)

**Closed issues:**

- Set model relations for sequelize [\#69](https://github.com/feathersjs/feathers-hooks-common/issues/69)

**Merged pull requests:**

- Avoided side-effect of client [\#137](https://github.com/feathersjs/feathers-hooks-common/pull/137) ([eddyystop](https://github.com/eddyystop))
- Update README.md [\#127](https://github.com/feathersjs/feathers-hooks-common/pull/127) ([j2L4e](https://github.com/j2L4e))
- Changed reference to correct replacement hook. [\#124](https://github.com/feathersjs/feathers-hooks-common/pull/124) ([eddyystop](https://github.com/eddyystop))

## [v3.0.0-pre.1](https://github.com/feathersjs/feathers-hooks-common/tree/v3.0.0-pre.1) (2017-02-02)
[Full Changelog](https://github.com/feathersjs/feathers-hooks-common/compare/v2.0.3...v3.0.0-pre.1)

**Implemented enhancements:**

- New populate support `setByDot`  [\#85](https://github.com/feathersjs/feathers-hooks-common/issues/85)
- "if else" hook [\#53](https://github.com/feathersjs/feathers-hooks-common/issues/53)
- Validate hook too limited [\#50](https://github.com/feathersjs/feathers-hooks-common/issues/50)
- Normalize hook.result from mongoose and sequelize [\#39](https://github.com/feathersjs/feathers-hooks-common/issues/39)
- utility hook to trim data [\#37](https://github.com/feathersjs/feathers-hooks-common/issues/37)
-  Sanitize strings to prevent XSS attacks, remove HTML and \<script\> tags. [\#35](https://github.com/feathersjs/feathers-hooks-common/issues/35)
- Disable multi-record patch and update [\#29](https://github.com/feathersjs/feathers-hooks-common/issues/29)
- disable hook seems to have wrong true/false logic [\#28](https://github.com/feathersjs/feathers-hooks-common/issues/28)
- Distinct Search hook [\#16](https://github.com/feathersjs/feathers-hooks-common/issues/16)

**Closed issues:**

- Wrong provider logic in some places [\#121](https://github.com/feathersjs/feathers-hooks-common/issues/121)
- Populate need a test for schema:function\(\){} [\#117](https://github.com/feathersjs/feathers-hooks-common/issues/117)
- Deprecate remove for delete [\#115](https://github.com/feathersjs/feathers-hooks-common/issues/115)
- Let populate ensure its schema was meant for the service its being used with [\#101](https://github.com/feathersjs/feathers-hooks-common/issues/101)
- Can I feed the populate hook an id from a separate join table ? [\#100](https://github.com/feathersjs/feathers-hooks-common/issues/100)
- Disable hook: remove last param being a predicate func. [\#98](https://github.com/feathersjs/feathers-hooks-common/issues/98)
- Option {paginate: false} for populate hook [\#95](https://github.com/feathersjs/feathers-hooks-common/issues/95)
- Populate hook clobbers pagination total [\#93](https://github.com/feathersjs/feathers-hooks-common/issues/93)
- Migration guide for deprecations [\#91](https://github.com/feathersjs/feathers-hooks-common/issues/91)
- getByDot throws TypeError if undefined obj is passed as first argument [\#87](https://github.com/feathersjs/feathers-hooks-common/issues/87)
- Populate hook: parentField and childField are confusing [\#86](https://github.com/feathersjs/feathers-hooks-common/issues/86)
- Change response code [\#80](https://github.com/feathersjs/feathers-hooks-common/issues/80)
- use a slug instead of id in service methods [\#79](https://github.com/feathersjs/feathers-hooks-common/issues/79)
- Read service using a slug instead of just \_id [\#78](https://github.com/feathersjs/feathers-hooks-common/issues/78)
- v2.0.3 isn't published on NPM [\#74](https://github.com/feathersjs/feathers-hooks-common/issues/74)
- Make conditional hooks compatible with unless [\#70](https://github.com/feathersjs/feathers-hooks-common/issues/70)
- Improve setByDot [\#58](https://github.com/feathersjs/feathers-hooks-common/issues/58)
- Remove doc for each hook from README [\#54](https://github.com/feathersjs/feathers-hooks-common/issues/54)
- Example to add to docs [\#43](https://github.com/feathersjs/feathers-hooks-common/issues/43)
- doc some PRs [\#41](https://github.com/feathersjs/feathers-hooks-common/issues/41)
- Should each hook be in their own repository? [\#31](https://github.com/feathersjs/feathers-hooks-common/issues/31)

**Merged pull requests:**

- Prepare for 3.0.0 prerelease [\#122](https://github.com/feathersjs/feathers-hooks-common/pull/122) ([daffl](https://github.com/daffl))
- Added discard hook to deprecate the remove hook. [\#120](https://github.com/feathersjs/feathers-hooks-common/pull/120) ([eddyystop](https://github.com/eddyystop))
- Added tests that populate's options.schema may be a function [\#119](https://github.com/feathersjs/feathers-hooks-common/pull/119) ([eddyystop](https://github.com/eddyystop))
- Dep remove [\#118](https://github.com/feathersjs/feathers-hooks-common/pull/118) ([eddyystop](https://github.com/eddyystop))
- Bump dependencies; Use shx [\#114](https://github.com/feathersjs/feathers-hooks-common/pull/114) ([eddyystop](https://github.com/eddyystop))
- Changed populate so it throws if option.schema not an object [\#112](https://github.com/feathersjs/feathers-hooks-common/pull/112) ([eddyystop](https://github.com/eddyystop))
- Added disableMultiItemChange hook, throws if id===null for update, patch, remove [\#110](https://github.com/feathersjs/feathers-hooks-common/pull/110) ([eddyystop](https://github.com/eddyystop))
- Enhanced validate hook [\#109](https://github.com/feathersjs/feathers-hooks-common/pull/109) ([eddyystop](https://github.com/eddyystop))
- Added disallow hook to start to deprecate disable hook. [\#108](https://github.com/feathersjs/feathers-hooks-common/pull/108) ([eddyystop](https://github.com/eddyystop))
- Added dot notation support for nameAs option in populate & dePopulate hooks [\#107](https://github.com/feathersjs/feathers-hooks-common/pull/107) ([eddyystop](https://github.com/eddyystop))
- Deprecated setByDot usage for deleting props. Converted hooks to deleteByDot [\#106](https://github.com/feathersjs/feathers-hooks-common/pull/106) ([eddyystop](https://github.com/eddyystop))
- Added deleteByDot util to support dot notation for populate nameAs option [\#105](https://github.com/feathersjs/feathers-hooks-common/pull/105) ([eddyystop](https://github.com/eddyystop))
- Fixed bug in replaceItems involving hook.result.total [\#104](https://github.com/feathersjs/feathers-hooks-common/pull/104) ([eddyystop](https://github.com/eddyystop))
- Populate 3 [\#103](https://github.com/feathersjs/feathers-hooks-common/pull/103) ([eddyystop](https://github.com/eddyystop))
- Flatten tests [\#102](https://github.com/feathersjs/feathers-hooks-common/pull/102) ([eddyystop](https://github.com/eddyystop))
- Split services hooks into individual files [\#97](https://github.com/feathersjs/feathers-hooks-common/pull/97) ([eddyystop](https://github.com/eddyystop))
- Finish split of filters/ and permissions/. Prepare hooks/ for split. [\#94](https://github.com/feathersjs/feathers-hooks-common/pull/94) ([eddyystop](https://github.com/eddyystop))
- Break out filter and permission modules by hook [\#92](https://github.com/feathersjs/feathers-hooks-common/pull/92) ([eddyystop](https://github.com/eddyystop))
- Switching over to reorganized hook modules [\#90](https://github.com/feathersjs/feathers-hooks-common/pull/90) ([eddyystop](https://github.com/eddyystop))
- Working around another Babel-core 6.17.0 transpilation error in iffElse [\#89](https://github.com/feathersjs/feathers-hooks-common/pull/89) ([eddyystop](https://github.com/eddyystop))
- Allowing populate include:{...} to act like include:\[{...}\] [\#88](https://github.com/feathersjs/feathers-hooks-common/pull/88) ([eddyystop](https://github.com/eddyystop))
- Fixed 6.17.0 Babel transpiling error [\#84](https://github.com/feathersjs/feathers-hooks-common/pull/84) ([eddyystop](https://github.com/eddyystop))
- Update all dependencies 🌴 [\#82](https://github.com/feathersjs/feathers-hooks-common/pull/82) ([greenkeeperio-bot](https://github.com/greenkeeperio-bot))
- Created support for event filter and permission hooks. Reorganized service hooks because of this. [\#75](https://github.com/feathersjs/feathers-hooks-common/pull/75) ([eddyystop](https://github.com/eddyystop))
- Traverse and change hook.data .result .query or hook.anyObj [\#73](https://github.com/feathersjs/feathers-hooks-common/pull/73) ([eddyystop](https://github.com/eddyystop))
- Fix JSDoc for disable hook [\#72](https://github.com/feathersjs/feathers-hooks-common/pull/72) ([bertho-zero](https://github.com/bertho-zero))
- Fixed comments in every & some [\#71](https://github.com/feathersjs/feathers-hooks-common/pull/71) ([eddyystop](https://github.com/eddyystop))
- Added validateSchema hook to validate JSON objects [\#68](https://github.com/feathersjs/feathers-hooks-common/pull/68) ([eddyystop](https://github.com/eddyystop))
- adding unless hook [\#66](https://github.com/feathersjs/feathers-hooks-common/pull/66) ([ekryski](https://github.com/ekryski))
- add $client hook [\#65](https://github.com/feathersjs/feathers-hooks-common/pull/65) ([eddyystop](https://github.com/eddyystop))
- adding when alias for iff [\#64](https://github.com/feathersjs/feathers-hooks-common/pull/64) ([ekryski](https://github.com/ekryski))
- adding an every hook [\#63](https://github.com/feathersjs/feathers-hooks-common/pull/63) ([ekryski](https://github.com/ekryski))
- Added new populate, dePopulate, serialze hooks. [\#62](https://github.com/feathersjs/feathers-hooks-common/pull/62) ([eddyystop](https://github.com/eddyystop))
- adding a some hook [\#61](https://github.com/feathersjs/feathers-hooks-common/pull/61) ([ekryski](https://github.com/ekryski))
- Removed all the hook documentation from the README [\#60](https://github.com/feathersjs/feathers-hooks-common/pull/60) ([eddyystop](https://github.com/eddyystop))
- Improved perf on the most common usage of getByDot, setByDot [\#59](https://github.com/feathersjs/feathers-hooks-common/pull/59) ([eddyystop](https://github.com/eddyystop))
- Added support for iff\(\).else\(hook1, hook2, ...\) [\#57](https://github.com/feathersjs/feathers-hooks-common/pull/57) ([eddyystop](https://github.com/eddyystop))
- Added a hook to execute a set of hooks [\#56](https://github.com/feathersjs/feathers-hooks-common/pull/56) ([eddyystop](https://github.com/eddyystop))
- Added tests to cover 2 reported issues [\#55](https://github.com/feathersjs/feathers-hooks-common/pull/55) ([eddyystop](https://github.com/eddyystop))

## [v2.0.3](https://github.com/feathersjs/feathers-hooks-common/tree/v2.0.3) (2016-11-29)
[Full Changelog](https://github.com/feathersjs/feathers-hooks-common/compare/v2.0.2...v2.0.3)

**Closed issues:**

- Validate sync function do nothing [\#49](https://github.com/feathersjs/feathers-hooks-common/issues/49)
- softDelete "Cannot read property 'hasOwnProperty' of undefined" [\#48](https://github.com/feathersjs/feathers-hooks-common/issues/48)
- softDelete undefined.patch issue [\#44](https://github.com/feathersjs/feathers-hooks-common/issues/44)
- Support an array of hooks [\#19](https://github.com/feathersjs/feathers-hooks-common/issues/19)

**Merged pull requests:**

- Added support for multiple hooks in iff\(\) [\#52](https://github.com/feathersjs/feathers-hooks-common/pull/52) ([eddyystop](https://github.com/eddyystop))

## [v2.0.2](https://github.com/feathersjs/feathers-hooks-common/tree/v2.0.2) (2016-11-28)
[Full Changelog](https://github.com/feathersjs/feathers-hooks-common/compare/v2.0.1...v2.0.2)

**Implemented enhancements:**

- Consider: allow $select in params query when get [\#32](https://github.com/feathersjs/feathers-hooks-common/issues/32)
- Allow softDelete on all methods [\#30](https://github.com/feathersjs/feathers-hooks-common/issues/30)

**Closed issues:**

- Hooks shouldn't be arrow functions [\#47](https://github.com/feathersjs/feathers-hooks-common/issues/47)
- Proposal for permissions in populate++ [\#42](https://github.com/feathersjs/feathers-hooks-common/issues/42)
- Proposal for populates++ hook [\#38](https://github.com/feathersjs/feathers-hooks-common/issues/38)
- Support more complex populates [\#23](https://github.com/feathersjs/feathers-hooks-common/issues/23)
- Support users\[\].password notation in remove to loop through arrays [\#21](https://github.com/feathersjs/feathers-hooks-common/issues/21)
- Use changelog generator [\#9](https://github.com/feathersjs/feathers-hooks-common/issues/9)

**Merged pull requests:**

- Rewrote softDelete to properly handle all methods [\#51](https://github.com/feathersjs/feathers-hooks-common/pull/51) ([eddyystop](https://github.com/eddyystop))
- fix setUpdatedAt and setCreatedAt [\#46](https://github.com/feathersjs/feathers-hooks-common/pull/46) ([alerosa](https://github.com/alerosa))
- Fix \#30 \(allow all hooks\) and \#44 \(arrow function can't reference this\) [\#45](https://github.com/feathersjs/feathers-hooks-common/pull/45) ([KidkArolis](https://github.com/KidkArolis))
- Fix softDelete error on 'find' [\#40](https://github.com/feathersjs/feathers-hooks-common/pull/40) ([jojobyte](https://github.com/jojobyte))

## [v2.0.1](https://github.com/feathersjs/feathers-hooks-common/tree/v2.0.1) (2016-11-04)
[Full Changelog](https://github.com/feathersjs/feathers-hooks-common/compare/v2.0.0...v2.0.1)

**Closed issues:**

- Funcs in promisify.js [\#18](https://github.com/feathersjs/feathers-hooks-common/issues/18)
- Add performance/logging hook [\#14](https://github.com/feathersjs/feathers-hooks-common/issues/14)
- Standardize scripts [\#13](https://github.com/feathersjs/feathers-hooks-common/issues/13)

**Merged pull requests:**

- Fix bug in populate, sending wrong params [\#34](https://github.com/feathersjs/feathers-hooks-common/pull/34) ([danieledler](https://github.com/danieledler))
- Fix error in populate hook description example [\#33](https://github.com/feathersjs/feathers-hooks-common/pull/33) ([danieledler](https://github.com/danieledler))
- Update to latest plugin infrastructure [\#27](https://github.com/feathersjs/feathers-hooks-common/pull/27) ([daffl](https://github.com/daffl))

## [v2.0.0](https://github.com/feathersjs/feathers-hooks-common/tree/v2.0.0) (2016-10-29)
[Full Changelog](https://github.com/feathersjs/feathers-hooks-common/compare/v1.7.2...v2.0.0)

**Closed issues:**

- Add to doc that JS can create array of hooks [\#20](https://github.com/feathersjs/feathers-hooks-common/issues/20)
- Remove Node 4 hacks [\#17](https://github.com/feathersjs/feathers-hooks-common/issues/17)
- Sanitize query in hooks [\#15](https://github.com/feathersjs/feathers-hooks-common/issues/15)
- Do Code Climate analysis again [\#11](https://github.com/feathersjs/feathers-hooks-common/issues/11)
- Run CI with Node 4, 6 and latest [\#10](https://github.com/feathersjs/feathers-hooks-common/issues/10)
- Change linting from AirBnB to semistandard [\#8](https://github.com/feathersjs/feathers-hooks-common/issues/8)
- Change test names from \*\_spec.js to \*.test.js [\#7](https://github.com/feathersjs/feathers-hooks-common/issues/7)
- Update to latest plugin infrastructure [\#4](https://github.com/feathersjs/feathers-hooks-common/issues/4)

**Merged pull requests:**

- Remove dependency on feathers-authentication [\#26](https://github.com/feathersjs/feathers-hooks-common/pull/26) ([daffl](https://github.com/daffl))
- Added promiseToCallback, perhaps more rugged than Feathers' code [\#25](https://github.com/feathersjs/feathers-hooks-common/pull/25) ([eddyystop](https://github.com/eddyystop))
- Removed overly complex promisify function wrappers [\#24](https://github.com/feathersjs/feathers-hooks-common/pull/24) ([eddyystop](https://github.com/eddyystop))
- Remove the lib/ folder [\#22](https://github.com/feathersjs/feathers-hooks-common/pull/22) ([daffl](https://github.com/daffl))
- Fixed tests which had failed in Node 4 [\#12](https://github.com/feathersjs/feathers-hooks-common/pull/12) ([eddyystop](https://github.com/eddyystop))
- Switched from AirBnB to semistandard [\#6](https://github.com/feathersjs/feathers-hooks-common/pull/6) ([eddyystop](https://github.com/eddyystop))
- Rename test files to Feathers standard [\#5](https://github.com/feathersjs/feathers-hooks-common/pull/5) ([eddyystop](https://github.com/eddyystop))

## [v1.7.2](https://github.com/feathersjs/feathers-hooks-common/tree/v1.7.2) (2016-10-07)
[Full Changelog](https://github.com/feathersjs/feathers-hooks-common/compare/v1.7.1...v1.7.2)

**Closed issues:**

- what's the realtionship between this and feathers-hooks? [\#3](https://github.com/feathersjs/feathers-hooks-common/issues/3)

## [v1.7.1](https://github.com/feathersjs/feathers-hooks-common/tree/v1.7.1) (2016-10-06)
[Full Changelog](https://github.com/feathersjs/feathers-hooks-common/compare/v1.7.0...v1.7.1)

## [v1.7.0](https://github.com/feathersjs/feathers-hooks-common/tree/v1.7.0) (2016-10-04)
[Full Changelog](https://github.com/feathersjs/feathers-hooks-common/compare/v1.6.2...v1.7.0)

## [v1.6.2](https://github.com/feathersjs/feathers-hooks-common/tree/v1.6.2) (2016-10-03)
[Full Changelog](https://github.com/feathersjs/feathers-hooks-common/compare/v1.6.1...v1.6.2)

## [v1.6.1](https://github.com/feathersjs/feathers-hooks-common/tree/v1.6.1) (2016-10-02)
[Full Changelog](https://github.com/feathersjs/feathers-hooks-common/compare/v1.6.0...v1.6.1)

## [v1.6.0](https://github.com/feathersjs/feathers-hooks-common/tree/v1.6.0) (2016-10-02)
[Full Changelog](https://github.com/feathersjs/feathers-hooks-common/compare/v1.5.8...v1.6.0)

## [v1.5.8](https://github.com/feathersjs/feathers-hooks-common/tree/v1.5.8) (2016-09-14)
[Full Changelog](https://github.com/feathersjs/feathers-hooks-common/compare/v1.5.7...v1.5.8)

**Merged pull requests:**

- Fix typo in README.md [\#2](https://github.com/feathersjs/feathers-hooks-common/pull/2) ([bedeoverend](https://github.com/bedeoverend))

## [v1.5.7](https://github.com/feathersjs/feathers-hooks-common/tree/v1.5.7) (2016-09-13)
[Full Changelog](https://github.com/feathersjs/feathers-hooks-common/compare/v1.5.6...v1.5.7)

## [v1.5.6](https://github.com/feathersjs/feathers-hooks-common/tree/v1.5.6) (2016-09-12)
[Full Changelog](https://github.com/feathersjs/feathers-hooks-common/compare/v1.5.5...v1.5.6)

## [v1.5.5](https://github.com/feathersjs/feathers-hooks-common/tree/v1.5.5) (2016-09-12)
[Full Changelog](https://github.com/feathersjs/feathers-hooks-common/compare/v1.5.4...v1.5.5)

## [v1.5.4](https://github.com/feathersjs/feathers-hooks-common/tree/v1.5.4) (2016-09-12)
[Full Changelog](https://github.com/feathersjs/feathers-hooks-common/compare/v1.5.3...v1.5.4)

## [v1.5.3](https://github.com/feathersjs/feathers-hooks-common/tree/v1.5.3) (2016-09-11)
[Full Changelog](https://github.com/feathersjs/feathers-hooks-common/compare/v1.5.2...v1.5.3)

**Closed issues:**

- Typo in Readme [\#1](https://github.com/feathersjs/feathers-hooks-common/issues/1)

## [v1.5.2](https://github.com/feathersjs/feathers-hooks-common/tree/v1.5.2) (2016-09-08)
[Full Changelog](https://github.com/feathersjs/feathers-hooks-common/compare/v1.5.1...v1.5.2)

## [v1.5.1](https://github.com/feathersjs/feathers-hooks-common/tree/v1.5.1) (2016-08-20)
[Full Changelog](https://github.com/feathersjs/feathers-hooks-common/compare/v1.5.0...v1.5.1)

## [v1.5.0](https://github.com/feathersjs/feathers-hooks-common/tree/v1.5.0) (2016-08-20)
[Full Changelog](https://github.com/feathersjs/feathers-hooks-common/compare/v1.4.1...v1.5.0)

## [v1.4.1](https://github.com/feathersjs/feathers-hooks-common/tree/v1.4.1) (2016-08-19)
[Full Changelog](https://github.com/feathersjs/feathers-hooks-common/compare/v1.4.0...v1.4.1)

## [v1.4.0](https://github.com/feathersjs/feathers-hooks-common/tree/v1.4.0) (2016-08-19)
[Full Changelog](https://github.com/feathersjs/feathers-hooks-common/compare/v1.3.1...v1.4.0)

## [v1.3.1](https://github.com/feathersjs/feathers-hooks-common/tree/v1.3.1) (2016-08-18)
[Full Changelog](https://github.com/feathersjs/feathers-hooks-common/compare/v1.3.0...v1.3.1)

## [v1.3.0](https://github.com/feathersjs/feathers-hooks-common/tree/v1.3.0) (2016-08-18)


\* *This Change Log was automatically generated by [github_changelog_generator](https://github.com/skywinder/Github-Changelog-Generator)*