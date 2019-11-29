const { pathToRegexp } = require("path-to-regexp");
const Scheme = require("async-validator").default;
const signale = require("signale");
const _ = require("lodash");

function parseKey(key) {
  let method = "get";
  let path = key;
  if (/\s+/.test(key)) {
    const splited = key.split(/\s+/);
    method = splited[0].toLowerCase();
    path = splited[1]; // eslint-disable-line
  }

  return {
    method,
    path
  };
}

exports.getHandlePath = function getHandlePath(key, rules) {
  const { method, path } = parseKey(key);
  return {
    method: method.toUpperCase(),
    path,
    re: pathToRegexp(path),
    handler: data => new Scheme(rules).validate(data, { first: true })
  };
};

exports.checkData = async function checkData(req, handlerSchemas) {
  const { url: path, method } = req;
  for (const handlerSchema of handlerSchemas) {
    if (handlerSchema.method === method && handlerSchema.re.test(path)) {
      let body;
      try {
        body = JSON.parse(req.read());
      } catch (error) {
        signale.error(error);
        return "解析body出错";
      }
      if (_.isEmpty(body)) return "body 为空";
      return await handlerSchema
        .handler(body)
        .catch(err => err.errors[0].message);
    }
  }
};
