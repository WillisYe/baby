// functions/_middleware.ts
import proxyflare from "@flaregun-net/proxyflare-for-pages";

const routes = [
  {
    // 匹配所有以 /webdav/ 开头的请求
    from: { pattern: "https://baby-3qp.pages.dev/webdav/*" },
    // 将这些请求转发到坚果云的真实地址，并移除 /webdav 路径前缀
    to: { url: "https://dav.jianguoyun.com" },
  },
];

export const onRequest = (context) => {
  return proxyflare({
    config: { routes },
  })(context);
};