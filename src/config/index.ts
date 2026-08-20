import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
    port: process.env.PORT,
    database_url: process.env.DATABASE_URL,
    app_url: process.env.APP_URL,
    google_client_id: process.env.GOOGLE_CLIENT_ID,
    bycrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
    jwt_access_secret: process.env.JWT_ACCESS_SECRET!,
    jwt_refresh_secret: process.env.JWT_REFRESH_SECRET!,
    jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN!,
    jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN!,
    stripe_secret_key: process.env.STRIPE_SECRET_KEY!,
    stripe_price_id: process.env.STRIPE_PRICE_ID!,
    stripe_webhook_secret: process.env.STRIPE_WEBHOOK_SECRET!,
    redis_user: process.env.REDIS_USER!,
    redis_password: process.env.REDIS_PASSWORD!,
    redis_host: process.env.REDIS_HOST!,
    redis_port: process.env.REDIS_PORT!,
    smtp_password: process.env.SMTP_PASSWORD!,
    smtp_user: process.env.SMTP_USER!,
    bkash_base_url: process.env.BKASH_BASE_URL!,
    bkash_username: process.env.BKASH_USERNAME!,
    bkash_password: process.env.BKASH_PASSWORD!,
    bkash_app_key: process.env.BKASH_APP_KEY!,
    bkash_app_secret: process.env.BKASH_APP_SECRET!,
};