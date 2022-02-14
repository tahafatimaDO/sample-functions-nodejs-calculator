const expeval = require("expression-eval");
const { createClient } = require("redis");
const key = "counter";

async function main(args) {
  const redis = createClient({url: process.env.DATABASE_URL})
  // const redis = createClient({url: args.DATABASE_URL_PARAM})

  return redis
    .connect()
    .then(() => {
      let expr = args['text']
      let result = evaluate(expr);
      return redis
        .get(key)
        .then((reply) => {
          return updateAndReply(redis, asCount(reply), result);
        })
        .catch((err) => {
          return updateAndReply(redis, 0, result);
        });
    })
    .catch((err) => {
      console.log("ERROR : ", err);
      return err;
    })
    .finally(() => {
      redis.disconnect();
    });
}

function evaluate(exprStr) {
  try {
    let ast = expeval.parse(exprStr);
    return expeval.eval(ast);
  } catch {
    return "error evaluating expression";
  }
}
function asCount(s) {
  if (Number.isInteger(s)) {
    return s;
  }
  let v = parseInt(s, 10);
  return isNaN(v) ? 0 : v;
}

function updateAndReply(redis, count, text) {
  return redis
    .set(key, count + 1)
    .then(() => {
      return { count: count, result: text };
    })
    .catch((err) => {
      return { count: count, result: text };
    });
}

exports.main = main
