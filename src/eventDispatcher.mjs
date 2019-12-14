import process from "process";

const observers = {};

export const listen = (eventName, handler) => {
  if (!observers[eventName]) {
    observers[eventName] = [handler];
  } else {
    observers[eventName] = [
      ...observers[eventName],
      handler,
    ];
  }
};

const dispatchNow = (eventName, ...args) =>
  observers[eventName].forEach((observer) => {
    try {
      observer(...args);
    } catch {}
  });

export const dispatch = (eventName, ...args) => {
  if (observers[eventName])
    dispatchNow(eventName, ...args);
};
