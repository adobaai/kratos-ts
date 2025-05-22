import { describe, expect, it } from "@jest/globals";

import { PromiseChannel } from "./channel";

describe("builtin", () => {
  it("promise", async () => {
    const expected = "world";
    var it = await new Promise((resolve) => {
      console.log("enter promise");
      resolve(expected);
    });
    expect(it).toEqual(expected);
  });
});

describe("channel", () => {
  it("promise", async () => {
    const channel = new PromiseChannel<number>();

    // Producer
    (async () => {
      for (let i = 0; i < 5; i++) {
        channel.send(i);
        await new Promise((r) => setTimeout(r, 100)); // Simulate work
      }
      channel.close();
    })();

    // Consumer
    const values: number[] = [];
    for await (const value of channel.receive()) {
      values.push(value);
    }
    expect(values).toHaveLength(5);
  });
});
