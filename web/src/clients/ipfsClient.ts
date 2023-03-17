const BASE_URL = "https://api.pinata.cloud";
export class IpfsClient {
  static async sendRequest(path, method, opts = {}) {
    const response = await fetch(`${BASE_URL}/${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NEXT_IPFS_JWT}`,
      },
      ...opts,
    });
    return response.json();
  }

  static async uploadJson(json) {
    const response = await IpfsClient.sendRequest(
      "pinning/pinJSONToIPFS",
      "POST",
      {
        body: JSON.stringify(json),
      }
    );
    return response.IpfsHash;
  }

  static async get(query) {
    const response = await IpfsClient.sendRequest(
      `data/pinList?includeCount=false?${query}`,
      "GET"
    );

    return response;
  }
}
