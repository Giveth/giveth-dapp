# Common Component Props

## Props
| Name                                             | Type    | Default      | Required | Description |
| ------------------------------------------------ | ------- | ------------ | -------- | ----------- |
| onChange                                         | Func    | () => {}     | false    |             |
| onSetValue                                       | Func    | () => {}     | false    |             |
| isPristine                                       | Func    |              | true     |             |
| [errorMessages](#markdown-header-error-messages) | Arrayof | []           | false    |             |
| help                                             | String  | null         | false    |             |
| label                                            | Node    | null         | false    |             |
| [layout](#markdown-header-layout)                | Enum    | 'horizontal' | false    |             |
| showErrors                                       | Bool    | true         | false    |             |

## Complex Props

### errorMessages
Type: _Arrayof_

**errorMessages** is an array of the following type:
node
--------------------------------------------------------------------------------

### layout
Type: _Enum_

**layout** should be one of the following values:

| Value       | Type   |
| ----------- | ------ |
| horizontal  | String |
| vertical    | String |
| elementOnly | String |
