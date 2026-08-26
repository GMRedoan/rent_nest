import config from "../config";
import { redisClient } from "./redis";
import { AppError } from "../utils/AppError";
import httpStatus from "http-status";

export const getBkashIdToken = async () => {
    try {
            const idTokenKey = "bkash: idToken";
            const refreshTokenKey = "bkash: refreshToken";
            let BkashIdToken = await redisClient.get(idTokenKey);
            const BkashIdTokenTTL = await redisClient.ttl(idTokenKey);
            let BkashRefreshToken = await redisClient.get(refreshTokenKey);
            let BkashRefreshTokenTTL = await redisClient.ttl(refreshTokenKey);

            // console.log({
            //     BkashIdToken,
            //     BkashIdTokenTTL,
            //     BkashRefreshToken,
            //     BkashRefreshTokenTTL
            // })

            if (
              (BkashIdTokenTTL <= 600 || !BkashIdToken) &&
              BkashRefreshToken &&
              BkashRefreshTokenTTL > 600
            ) {
              const refreshTokenRes = await fetch(
                `${config.bkash_base_url}/tokenized/checkout/token/refresh`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    username: config.bkash_username,
                    password: config.bkash_password,
                  },
                  body: JSON.stringify({
                    app_key: config.bkash_app_key,
                    app_secret: config.bkash_app_secret,
                    refresh_token: BkashRefreshToken,
                  }),
                },
              );
              if (!refreshTokenRes.ok) {
                throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, "failed to get bkash id token");
              }
              const bkashRefreshTokenResult = await refreshTokenRes.json();
              BkashIdToken = bkashRefreshTokenResult.id_token as string;
              await redisClient.set(idTokenKey, BkashIdToken, {
                expiration: {
                  type: "EX",
                  value: 60 * 60,
                },
              });
              return BkashIdToken;
            }

            if (BkashIdTokenTTL > 600) {
              return BkashIdToken;
            }

            const res = await fetch(
              `${config.bkash_base_url}/tokenized/checkout/token/grant`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Accept: "application/json",
                  username: config.bkash_username,
                  password: config.bkash_password,
                },
                body: JSON.stringify({
                  app_key: config.bkash_app_key,
                  app_secret: config.bkash_app_secret,
                }),
              },
            );

            if (!res.ok) {
              throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, "failed to get bkash id token");
            }
            const result = await res.json();
            await redisClient.set(idTokenKey, result.id_token, {
              expiration: {
                type: "EX",
                value: 60 * 60,
              },
            });
            await redisClient.set(refreshTokenKey, result.refresh_token, {
              expiration: {
                type: "EX",
                value: 60 * 60 * 24 * 28,
              },
            });
            BkashIdToken = result.id_token;
            return BkashIdToken;
    } catch (error: any) {
        throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
    }
  };
