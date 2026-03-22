import axios from "axios";
import apiEndpoints from "./apiEndpoints";
import { MessageInstance } from "antd/es/message/interface";
import constants from "../constants";

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
  private messageApi: MessageInstance | null;

  constructor(messageApi?: MessageInstance) {
    this.messageApi = messageApi!;
  }
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
      return this.errHandler(err);
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
      return this.errHandler(err);
    }
  }

  async put(options: PostOptions) {
    let url = apiEndpoints.base + options.endPoint;
    const headers = options.header ?? this.getHeader();
    console.log("Started PUT request to", url);
    console.log("headers");
    console.log(headers);
    console.log("data");
    console.log(options.body);

    try {
      const res = await axios.put(url, options.body, {
        headers: headers,
      });

      console.log("PUT request to", url, "successful");
      console.log(res.data);
      return this.responseHandler(res.data);
    } catch (err) {
      return this.errHandler(err);
    }
  }

  async delete(options: PostOptions) {
    let url = apiEndpoints.base + options.endPoint;
    const headers = options.header ?? this.getHeader();
    console.log("Started DELETE request to", url);
    console.log("headers");
    console.log(headers);
    console.log("data");
    console.log(options.body);

    try {
      const res = await axios.delete(url, {
        headers: headers,
        data: options.body,
      });

      console.log("DELETE request to", url, "successful");
      console.log(res.data);
      return this.responseHandler(res.data);
    } catch (err) {
      return this.errHandler(err);
    }
  }
  showError(error: string) {
    if (this.messageApi) {
      this.messageApi!.open({
        type: "error",
        content: error,
        duration:constants.messageDelayTime,
      });
    }
  }
  errHandler(error: any) {
    if (error.response?.data?.message) {
      this.showError(error.response?.data?.message);
    } else {
      this.showError("An error occured. Try again");
    }
    throw error;
  }
  responseHandler(response: any) {
    return response;
  }
}

export default AxiosHandler;
