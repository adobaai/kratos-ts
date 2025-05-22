import { Etcd3, Watcher as EWatcher, IEvent } from "etcd3";

import {
  Discovery,
  Instance,
  Watcher as RegistryWatcher,
} from "@adobaai/kratos/registry";

import { PromiseChannel } from "./channel";

export class Registry implements Discovery {
  private client: Etcd3;
  private namespace: string;

  constructor(namespace: string) {
    this.namespace = namespace;
    this.client = new Etcd3({
      hosts: process.env.ETCD_NODES?.split(",") ?? "",
      auth: {
        username: process.env.ETCD_USERNAME ?? "",
        password: process.env.ETCD_PASSWORD ?? "",
      },
    });
  }

  close() {
    this.client.close();
  }

  async getService(name: string): Promise<Instance[]> {
    return await Registry.getService(this.client, this.keyPrefix(name));
  }

  async watch(name: string): Promise<RegistryWatcher> {
    return await new Watcher(this.keyPrefix(name), this.client).watch();
  }

  private keyPrefix(name: string): string {
    return `${this.namespace}/${name}/`;
  }

  static async getService(client: Etcd3, key: string): Promise<Instance[]> {
    const ins = await client.getAll().prefix(key).json();
    return Object.values(ins) as Instance[];
  }
}

/**
 * Watcher class for observing changes in Etcd keys.
 */
class Watcher implements RegistryWatcher {
  private prefix: string;
  private client: Etcd3;
  private first: boolean;
  private watcher?: EWatcher;
  private chan = new PromiseChannel<IEvent>();
  private instances = new Map<string, Instance>();

  constructor(prefix: string, client: Etcd3) {
    this.prefix = prefix;
    this.client = client;
    this.first = true;
  }

  /**
   * Starts watching.
   */
  async watch(): Promise<Watcher> {
    this.watcher = await this.client.watch().prefix(this.prefix).create();
    this.watcher
      .on("data", (res) => {
        res.events.forEach((e) => {
          this.chan.send(e);
        });
      })
      .on("disconnected", (res) => {
        console.log("got disconnected", res);
      })
      .on("error", async (res) => {
        console.log("got err, starting rewatch", res);
        await this.watcher?.cancel();
        this.watch();
      });
    return this;
  }

  /**
   * Retrieves the next set of service instances.
   */
  async *next(): AsyncGenerator<Instance[]> {
    if (this.first) {
      this.first = false;
      const ins = await this.getInstances();
      ins.forEach((it) => {
        this.instances.set(it.id, it);
      });
      yield Array.from(this.instances.values());
    }

    for await (const event of this.chan.receive()) {
      switch (event.type) {
        case "Delete":
          const id = event.kv.key.toString().replace(this.prefix, "");
          this.instances.delete(id);
          break;
        case "Put":
          const it = JSON.parse(event.kv.value.toString()) as Instance;
          this.instances.set(it.id, it);
          break;
      }
      yield Array.from(this.instances.values());
    }
  }

  /**
   * Stops the watcher.
   */
  async stop(): Promise<void> {
    await this.watcher?.cancel();
  }

  /**
   * Retrieves the current set of service instances from Etcd.
   */
  private async getInstances(): Promise<Instance[]> {
    return await Registry.getService(this.client, this.prefix);
  }
}
