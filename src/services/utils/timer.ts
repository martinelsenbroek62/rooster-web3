export class Timer {
  fn: () => Promise<void>;
  t: number;
  timerObj: NodeJS.Timer | null;

  constructor(fn: () => Promise<void>, t: number) {
    this.fn = fn;
    this.t = t;
    this.timerObj = setInterval(this.fn, this.t);
  }

  stop = () => {
    if (this.timerObj) {
      clearInterval(this.timerObj);
      this.timerObj = null;
    }
    return this;
  };

  start = () => {
    if (!this.timerObj) {
      this.timerObj = setInterval(this.fn, this.t);
    }
    return this;
  };
}

export const delay = (ms: number): Promise<PromiseConstructor> =>
  new Promise((resolve) => setTimeout(resolve, ms));
