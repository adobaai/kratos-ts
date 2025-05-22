type Resolver<T> = (value: T) => void;

/**
 * A channel implemented using promise.
 */
export class PromiseChannel<T> {
  private queue: T[] = [];
  private resolvers: Resolver<T>[] = [];
  private closed = false;

  send(value: T): void {
    if (this.closed) {
      throw new Error("Channel is closed");
    }

    if (this.resolvers.length > 0) {
      const resolve = this.resolvers.shift()!;
      resolve(value);
    } else {
      this.queue.push(value);
    }
  }

  async *receive(): AsyncGenerator<T> {
    while (!this.closed || this.queue.length > 0) {
      if (this.queue.length > 0) {
        yield this.queue.shift()!;
      } else {
        // If the queue is empty, it creates a promise, stores its resolver in resolvers,
        // and waits for the producer to send a value.
        const value = await new Promise<T>((resolve) => this.resolvers.push(resolve));
        if (value != undefined) {
          yield value;
        }
      }
    }
  }

  close(): void {
    this.closed = true;
    this.resolvers.forEach((resolve) => resolve(undefined as never));
    this.resolvers = [];
  }
}
