const http = require('http');
const Koa = require('koa');
const koaBody = require('koa-body').default;
const Router = require('koa-router');
const { faker } = require("@faker-js/faker");
const slow = require('koa-slow');

const app = new Koa();

function createNews() {
  const news = [];

  for (let i = 0; i < 3; i++) {
    const newNewsMessage = {
      id: faker.string.uuid(),
      date: Date.now(),
      text: faker.lorem.sentences( 2 ),
      image: faker.image.urlLoremFlickr({ height: 128, width: 128 })
    };

    news.push(newNewsMessage);
  };

  return news;
}

app.use(async (ctx, next) => {
  const origin = ctx.request.get("Origin");
  if (!origin) {
    return await next();
  }

  const headers = { "Access-Control-Allow-Origin": "*", };

  if (ctx.request.method !== "OPTIONS") {
    ctx.response.set({ ...headers });
    try {
      return await next();
    } catch (e) {
      e.headers = { ...e.headers, ...headers };
      throw e;
    }
  }

  if (ctx.request.get("Access-Control-Request-Method")) {
    ctx.response.set({
      ...headers,
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH",
    });

    if (ctx.request.get("Access-Control-Request-Headers")) {
      ctx.response.set("Access-Control-Allow-Headers", ctx.request.get("Access-Control-Request-Headers"))
    }

    ctx.response.status = 204;
  }
});

app.use(koaBody({
  text: true,
  urlencoded: true,
  miltipart: true,
  json: true,
}));

app.use(slow({
  delay: 5000
}));

const router = new Router();

router.get('/news', async (ctx, next) => {
  const responseMessage = {
    "status": "ok",
    "timestamp": Date.now(),
    "messages": createNews()
  }

  ctx.response.body = responseMessage;

  next();
});

app.use(router.routes()).use(router.allowedMethods());

const port = process.env.PORT || 7070;
const server = http.createServer(app.callback());

server.listen(port, (err) => {
  if (err) {
    console.log(err);

    return;
  }
  console.log("Server is listening to " + port);
});;