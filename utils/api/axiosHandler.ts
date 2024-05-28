import axios from "axios";
import apiEndpoints from "./apiEndpoints";

const apiReturnMessages = {
  passwordEmailMismatch:
    "Email/Phone and password combination does not match any account",
};

interface FetchOptions {
  endPoint: string;
  header?: {};
}

interface PostOptions extends FetchOptions {
  body: {};
}
class AxiosHandler {
 
  getHeader() {
    let userToken = localStorage.getItem(apiEndpoints.tokenSetUrl);
    return {
      Accept: "application/json",
      Authorization: `Bearer ${userToken}`,
    };
  }

  async post(options: PostOptions) {
    let url = apiEndpoints.base + options.endPoint;
    const headers = options.header ?? this.getHeader();
    console.log("Started post request to", url);
    console.log("headers");
    console.log(headers);
    console.log("data");
    console.log(options.body);

    try {
      const res = await axios.post(url, options.body, {
        headers: headers,
      });

      console.log("Post request to", url, "successful");
      console.log(res.data);
      return this.responseHandler(res.data);
    } catch (err) {
      throw err;
    }
  }

  async get(options: FetchOptions) {
    try {
      const url = apiEndpoints.base + options.endPoint;
      const headers = options.header ?? this.getHeader();
      console.log("Started GET request to", url);
      console.log("headers");
      console.log(headers);

      const response = await axios.get(url, {
        headers: headers,
      });
      console.log("GET request to", url, "successful");
      return this.responseHandler(response.data);
    } catch (err) {
      console.error("Error in GET request:", err);
      throw err;
    }
  }

  responseHandler(response: any) {
    if (response.message === apiReturnMessages.passwordEmailMismatch) {
      // Handle specific response message
    }
    return response;
  }
}

export default AxiosHandler;
