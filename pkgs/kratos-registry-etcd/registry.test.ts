import { afterAll, describe, expect, it } from "@jest/globals";
import { Etcd3 } from "etcd3";

import { Registry } from "./registry";

describe("registry", () => {
  const reg = new Registry("discovery");
  const serviceName = "spiderman";

  it("getService", async () => {
    const ins = await reg.getService(serviceName);
    expect(ins).toHaveLength(1);
    expect(ins[0].name).toEqual(serviceName);
    expect(ins[0].version).toHaveLength(8);
    expect(ins[0].endpoints).toHaveLength(2);
  });
});

describe("event", () => {
  const prefix = "/hello";
  const client = new Etcd3({
    hosts: process.env.ETCD_NODES?.split(",") ?? "",
    auth: {
      username: process.env.ETCD_USERNAME ?? "",
      password: process.env.ETCD_PASSWORD ?? "",
    },
  });

  afterAll(() => {
    client.close();
  });

  const waits = new Array<Promise<void>>();

  it("kv", async () => {
    const watcher = await client.watch().prefix(prefix).create();
    var putCount = 0;
    var delCount = 0;
    watcher.on("data", (res) => {
      res.events.forEach((e) => {
        if (e.type === "Put") {
          putCount++;
          expect(e.kv.value.toString()).toBe("my god1");
        } else {
          delCount++;
          expect(e.kv.value.length).toBe(0);
        }
      });
    });

    await client.put(prefix).value("my god1");
    await client.delete().key(prefix);

    waits.push(watcher.cancel());
    expect(putCount).toBe(1);
    expect(delCount).toBe(1);
  }, 8000);

  it("lease", async () => {
    const watcher = await client.watch().prefix(prefix).create();
    var putCount = 0;
    var delCount = 0;
    watcher.on("data", (res) => {
      res.events.forEach((e) => {
        if (e.type === "Put") {
          putCount++;
        } else {
          delCount++;
        }
      });
    });

    await client.lease(1, { autoKeepAlive: false }).put(prefix).value("my god1");
    await new Promise((resolve) => setTimeout(resolve, 1000));

    waits.push(watcher.cancel());
    expect(putCount).toBe(1);
    expect(delCount).toBe(1);
  }, 8000);

  Promise.all(waits);
});
