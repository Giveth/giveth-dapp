export default class Prerender {
  static ready() {
    setTimeout(() => {
      window.prerenderReady = true;
    }, 100);
    console.log('Prerender is ready');
  }
}
