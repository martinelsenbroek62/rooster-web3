import IORedis from "ioredis";

class Cache {
  public readonly redis: IORedis;
  private readonly defaultTTL: number;

  constructor(defaultTTL = 60) {
    this.redis =
      process.env.REDIS_LOCALHOST === "true"
        ? new IORedis()
        : new IORedis(6380, process.env.REDIS_HOST || "", {
            password: process.env.REDIS_PASSWORD,
            tls: { servername: process.env.REDIS_HOST },
          });
    this.defaultTTL = defaultTTL;
  }

  public get = async <T>(key: string) => {
    const value = await this.redis.get(key);
    return value !== null ? (JSON.parse(value) as T) : null;
  };

  public set = async (key: string, value: any, ttl?: number) => {
    if (ttl === 0) {
      await this.redis.set(key, JSON.stringify(value));
    } else {
      await this.redis
        .pipeline()
        .set(key, JSON.stringify(value))
        .expire(key, ttl ? ttl : this.defaultTTL)
        .exec();
    }
  };

  public getAsync = async <T>(key: string, callback: () => Promise<T>, ttl?: number) => {
    const value = await this.get<T>(key);
    if (value !== null) {
      return value;
    } else {
      const result = await callback();
      if (result === undefined) {
        return result;
      }
      await this.set(key, result, ttl);
      return result;
    }
  };
}

export const cache = new Cache();
