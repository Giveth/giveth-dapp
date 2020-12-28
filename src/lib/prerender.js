export default class Prerender {
  static ready() {
    setTimeout(() => {
      window.prerenderReady = true;
    }, 100);
  }
}
