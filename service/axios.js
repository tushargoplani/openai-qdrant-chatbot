const axios = require("axios");

class AxiosService {
  executeHTTPRequest = async(method, hostname, path, headers, data) => {
    try {
      const { data: responseData } = await axios({
        method,
        url: `${hostname}${path}`,
        headers: headers || { "Content-Type": "application/json" },
        data,
      });
      return responseData;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AxiosService();