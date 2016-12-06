
let startAt;

const start = () => {
  startAt = new Date();
};

const cancel = () => {
  startAt = null;
};

const stop = () => {
  if (!startAt) return 0;
  const time = new Date() - startAt;
  startAt = null;
  return time;
};

export default {
  start,
  cancel,
  stop
};
