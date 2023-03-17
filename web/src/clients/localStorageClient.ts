export class LocalStorageClient {
  static keyPrefix() {
    return `billblock:${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}`;
  }
  static async get(key) {
    const value = localStorage.getItem(
      `${LocalStorageClient.keyPrefix()}:${key}`
    );
    return value ? JSON.parse(value) : null;
  }

  static async set(key, value) {
    localStorage.setItem(
      `${LocalStorageClient.keyPrefix()}:${key}`,
      JSON.stringify(value)
    );
  }
}
