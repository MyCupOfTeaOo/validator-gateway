const signale = require("signale");

signale.config({
  displayFilename: true,
  displayTimestamp: true
});

const httpProxy = require("http-proxy");
const request = require("request");
const { getHandlePath, checkData } = require("./utils.js");

const target = process.env.proxyHost || "http://localhost:8000";
const generalPath = process.env.generalPath || "http://localhost:8000";
const apiPrefix = process.env.apiPrefix || "/api";

signale.debug(`代理地址: ${target}`);

const handlerSchemas = [];

const interactive = new signale.Signale({ interactive: true });
interactive.await("获取源数据配置中");

request.get(
  `${generalPath}${apiPrefix}/general/api/rules`,
  (error, response, body) => {
    if (error) signale.error(error);
    else {
      const data = JSON.parse(body);
      if (data.code === 200) {
        for (const api of data.data) {
          const handlerData = getHandlePath(api.path, api.rules);
          handlerSchemas.push(handlerData);
        }
        interactive.success("加载源数据成功");
      } else {
        signale.error(`加载源数据失败: ${data.msg}`);
      }
    }
  }
);

const proxy = httpProxy.createProxyServer({ target }).listen(8001);

const checkErrorCode = "checkError";

//
// Listen for the `error` event on `proxy`.
proxy.on("error", function(err, req, res) {
  if (err !== checkErrorCode) {
    signale.error(err);
    res.writeHead(500, {
      "Content-Type": "text/plain"
    });
    res.end(
      "Something went wrong. And we are reporting a custom error message."
    );
  }
});

//
// Listen for the `proxyRes` event on `proxy`.
//
proxy.on("proxyReq", async function(proxyRes, req, res) {
  const errMsg = await checkData(req, handlerSchemas);
  if (errMsg) {
    signale.error(req.method, req.url, errMsg);
    res.writeHead(400, {
      "Content-Type": "text/plain"
    });
    res.end(errMsg);
    proxyRes.destroy(checkErrorCode);
    proxyRes.abort();
  }
});
