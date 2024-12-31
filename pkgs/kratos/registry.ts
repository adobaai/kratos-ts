/**
 * Represents an instance of a service in a discovery system.
 */
export interface Instance {
  /**
   * The unique identifier of the service instance as registered.
   *
   * @example "instance-123"
   */
  id: string;

  /**
   * The name of the service as registered.
   *
   * @example "user-service"
   */
  name: string;

  /**
   * The version of the service.
   * This typically refers to the version of the compiled binary or codebase.
   *
   * @example "1.0.0"
   */
  version: string;

  /**
   * Metadata associated with the service instance.
   * It is a key-value pair where both keys and values are strings.
   *
   * @example { "env": "production", "region": "us-east-1" }
   */
  metadata: Record<string, string>;

  /**
   * An array of endpoint addresses for the service instance.
   * Each endpoint is represented as a URL string.
   *
   * @example ["http://127.0.0.1:8000", "grpc://127.0.0.1:9000?isSecure=false"]
   */
  endpoints: string[];
}

/**
 * Discovery is a service discovery interface.
 * It provides methods to retrieve service instances and create watchers.
 */
export interface Discovery {
  /**
   * Returns the service instances in memory according to the service name.
   *
   * @param name - The name of the service to look up.
   * @returns A promise that resolves to an array of service instances.
   */
  getService(name: string): Promise<Instance[]>;

  /**
   * Creates a watcher according to the service name.
   *
   * @param name - The name of the service to watch.
   * @returns A promise that resolves to a watcher instance.
   */
  watch(name: string): Promise<Watcher>;
}

/**
 * Watcher is a service watcher interface.
 */
export interface Watcher {
  /**
   * Retrieves the list of service instances in the following cases:
   * 1. The first time the watcher is invoked and the service instance list is not empty.
   * 2. Any changes to the service instances are detected.
   *
   * If neither condition is met, the method blocks until it is canceled.
   */
  next(): AsyncGenerator<Instance[]>;

  /**
   * Stops the watcher and releases any resources.
   *
   * @returns A promise that resolves when the watcher has been stopped or rejects with an error.
   */
  stop(): Promise<void>;
}
