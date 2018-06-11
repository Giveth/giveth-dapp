# Input

## Props
| Name                          | Type   | Default  | Required | Description |
| ----------------------------- | ------ | -------- | -------- | ----------- |
| blurDebounceInterval          | Number | 0        | false    |             |
| changeDebounceInterval        | Number | 500      | false    |             |
| [type](#markdown-header-type) | Enum   | 'text'   | false    |             |
| updateOnBlur                  | Bool   | true     | false    |             |
| updateOnChange                | Bool   | true     | false    |             |
| value                         | String | ''       | false    |             |
| onBlur                        | Func   | () => {} | false    |             |
| onKeyDown                     | Func   | () => {} | false    |             |

## Complex Props

### type
Type: _Enum_

**type** should be one of the following values:

| Value          | Type   |
| -------------- | ------ |
| color          | String |
| date           | String |
| datetime       | String |
| datetime-local | String |
| email          | String |
| hidden         | String |
| month          | String |
| number         | String |
| password       | String |
| range          | String |
| search         | String |
| tel            | String |
| text           | String |
| time           | String |
| url            | String |
| week           | String |
