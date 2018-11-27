export default (fn, delay) => {
  let timer = -1;
  let stop = false;
  const poll = async (request, onResult) => {
    const result = await request();
    if (!stop) {
      onResult(result);
      timer = setTimeout(poll.bind(null, request, onResult), delay);
    }
  };
  return (...params) => {
    const { request, onResult } = fn(...params);
    poll(request, onResult);
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  };
};
