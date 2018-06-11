# `<File />`

The `<File />` component wraps an `<input type="file" />`.

This component is very similar to the other `<Input />` components, but instead of returning the `input` element's `value` (which contains a [fake path](http://stackoverflow.com/questions/4851595/how-to-resolve-the-c-fakepath) for security reasons), it returns a [HTML5 FileList](https://developer.mozilla.org/en-US/docs/Web/API/FileList) as the component's value.

What you do with the returned `FileList` is completely up to you! See [this issue](https://github.com/christianalfoni/formsy-react/issues/126) for discussion on a `formsy-react` best practice for this.

As a guide, you might use [`FormData.append`](https://developer.mozilla.org/en-US/docs/FileGuide/FileUpDown) or [`FileReader.readAsDataURL`](https://developer.mozilla.org/en-US/docs/Web/API/FileReader/readAsDataURL) and then upload using `XMLHttpRequest`.
