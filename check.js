const { pathToRegexp } = require("path-to-regexp");
const Schema = require("async-validator").default;
const signale = require("signale");
const { createFunc } = require("tea-eval");
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

function genLinkValid(dataLinkValid) {
  try {
    const func = createFunc(dataLinkValid.handleExpr, ["data"]);
    const safeFunc = function(data) {
      try {
        return func(data);
      } catch (error) {
        console.error("校验器异常", dataLinkValid, error);
        return "校验器异常,请联系管理员修改错误的表达式";
      }
    };
    return safeFunc;
  } catch (error) {
    signale.error("表达式异常", dataLinkValid, error);
    return `校验器异常,请联系管理员修改错误的表达式`;
  }
}

exports.getHandlePath = function getHandlePath(
  key,
  rules,
  dataLinkValids = []
) {
  const { method, path } = parseKey(key);
  const schema = new Schema(rules);
  const linkFuncs = dataLinkValids.map(dataLinkValid =>
    genLinkValid(dataLinkValid)
  );
  return {
    method: method.toUpperCase(),
    path,
    re: pathToRegexp(path),
    handler: data => {
      let linkError;
      for (linkFunc of linkFuncs) {
        linkError = linkFunc(data);
        if (linkError)
          return Promise.reject({ errors: [{ message: linkError }] });
      }
      return schema.validate(data, { first: true });
    }
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
