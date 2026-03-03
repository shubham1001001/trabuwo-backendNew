const axios = require("axios");
const config = require("config");
const redisService = require("../../services/redis");
const logger = require("../../config/logger");
const { handleAxiosError } = require("../../utils/axiosError");
const { ExternalServiceError } = require("../../utils/errors");

const shiprocketAxios = axios.create({
  baseURL: config.get("shiprocket.baseUrl"),
  timeout: config.get("shiprocket.timeout"),
  headers: {
    "Content-Type": "application/json",
  },
});

const getTokenFromAPI = async () => {
  try {
    const response = await axios.post(
      `${config.get("shiprocket.baseUrl")}/external/auth/login`,
      {
        email: config.get("shiprocket.email"),
        password: config.get("shiprocket.password"),
      },
      {
        timeout: config.get("shiprocket.timeout"),
      }
    );

    if (response.data && response.data.token) {
      const tokenData = {
        token: response.data.token,
        expiresAt: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
      };

      await redisService.set(
        config.get("shiprocket.tokenKey"),
        tokenData,
        config.get("shiprocket.tokenTtl")
      );

      logger.info("Shiprocket token refreshed successfully");
      return response.data.token;
    }

    throw new ExternalServiceError(
      "Invalid response from Shiprocket auth API",
      "SHIPROCKET"
    );
  } catch (error) {
    handleAxiosError(
      error,
      "SHIPROCKET_AUTH",
      "Failed to authenticate with Shiprocket",
      ExternalServiceError
    );
  }
};

const getOrRefreshToken = async () => {
  try {
    // const tokenData = await redisService.get(config.get("shiprocket.tokenKey"));

    const tokenData = { token: config.get("shiprocket.token") };
    return tokenData.token;
    // if (tokenData && tokenData.token) {
    //   const expiresAt = new Date(tokenData.expiresAt);
    //   const now = new Date();
    //   const bufferTime = 60 * 60 * 1000;

    //   if (expiresAt.getTime() > now.getTime() + bufferTime) {
    //     return tokenData.token;
    //   }
    // }

    // return await getTokenFromAPI();
  } catch (error) {
    logger.error("Error getting Shiprocket token:", error);
    throw new ExternalServiceError(
      "Failed to get Shiprocket authentication token",
      "SHIPROCKET"
    );
  }
};

shiprocketAxios.interceptors.request.use(
  async (config) => {
    try {
      const token = await getOrRefreshToken();
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    } catch (error) {
      logger.error("Error in Shiprocket request interceptor:", error);
      throw error;
    }
  },
  (error) => {
    logger.error("Shiprocket request interceptor error:", error);
    return Promise.reject(error);
  }
);

shiprocketAxios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      logger.info("Shiprocket token expired, refreshing...");

      try {
        await redisService.del(config.get("shiprocket.tokenKey"));
        const newToken = await getTokenFromAPI();
        error.config.headers.Authorization = `Bearer ${newToken}`;
        return shiprocketAxios.request(error.config);
      } catch (refreshError) {
        logger.error("Failed to refresh Shiprocket token:", refreshError);
        throw new ExternalServiceError(
          "Failed to refresh Shiprocket authentication token",
          "SHIPROCKET"
        );
      }
    }

    return Promise.reject(error);
  }
);

module.exports = shiprocketAxios;
