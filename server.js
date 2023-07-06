/*********************************************************************************
 * WEB322 – Assignment 04
 * I declare that this assignment is my own work in accordance with Seneca Academic Policy.
 * No part of this assignment has been copied manually or electronically from any other source
 * (including web sites) or distributed to other students.
 *
 * Name: __________Yatin rana___________ Student ID: _____167501212_________ Date:7/6/23 ________________
 *
 * Cyclic Web App URL:https://unusual-teal-waistcoat.cyclic.app/blog
 *
 * GitHub Repository URL: __https://github.com/yatin2211/Web322-app_____
 *
 ********************************************************************************/


const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const exphbs = require("express-handlebars");
const path = require("path");
const stripJs = require("strip-js");
const blogService = require("./blog-service.js");

const app = express();

app.use(express.static("public"));

app.use(function (req, res, next) {
  let route = req.path.substring(1);
  app.locals.activeRoute =
    "/" +
    (isNaN(route.split("/")[1])
      ? route.replace(/\/(?!.*)/, "")
      : route.replace(/\/(.*)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
});

app.engine(
  ".hbs",
  exphbs.engine({
    extname: ".hbs",
    helpers: {
      navLink: function (url, options) {
        return (
          "<li" +
          (url == app.locals.activeRoute ? ' class="active" ' : "") +
          '><a href="' +
          url +
          '">' +
          options.fn(this) +
          "</a></li>"
        );
      },
      equal: function (lvalue, rvalue, options) {
        if (arguments.length < 3)
          throw new Error("Handlebars Helper equal needs 2 parameters");
        if (lvalue != rvalue) {
          return options.inverse(this);
        } else {
          return options.fn(this);
        }
      },
      safeHTML: function (context) {
        return stripJs(context);
      },
    },
  })
);
app.set("view engine", ".hbs");

cloudinary.config({
  cloud_name: "dis6og4lc",
  api_key: "145446994168569",
  api_secret: "SBVfa_1AV6fyYyaoputexhGiqXg",
  secure: true,
});
const upload = multer();

const HTTP_PORT = process.env.PORT || 8080;

app.get("/", (req, res) => {
  res.redirect("/blog");
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/blog", async (req, res) => {
  let viewData = {};
  try {
    let posts = [];
    if (req.query.category) {
      posts = await blogService.getPublishedPostsByCategory(req.query.category);
    } else {
      posts = await blogService.getPublishedPosts();
    }
    posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));
    viewData.posts = posts;
    viewData.post = posts[0];
  } catch (err) {
    viewData.message = "no results";
  }
  try {
    let categories = await blogService.getCategories();
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
  }
  res.render("blog", { data: viewData });
});

app.get("/posts", (req, res) => {
  if (req.query.category) {
    blogService
      .getPostsByCategory(req.query.category)
      .then((data) => {
        res.render("posts", { posts: data });
      })
      .catch((err) => {
        res.render("posts", { message: "no results" });
      });
  } else if (req.query.minDate) {
    blogService
      .getPostsByMinDate(req.query.minDate)
      .then((data) => {
        res.render("posts", { posts: data });
      })
      .catch((err) => {
        res.render("posts", { message: "no results" });
      });
  } else {
    blogService
      .getAllPosts()
      .then((data) => {
        res.render("posts", { posts: data });
      })
      .catch((err) => {
        res.render("posts", { message: "no results" });
      });
  }
});

app.post("/posts/add", upload.single("featureImage"), (req, res) => {
  let streamUpload = (req) => {
    return new Promise((resolve, reject) => {
      let stream = cloudinary.uploader.upload_stream((error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      });

      streamifier.createReadStream(req.file.buffer).pipe(stream);
    });
  };

  async function uploadImage(req) {
    try {
      let uploadedImage = await streamUpload(req);
      req.body.featureImage = uploadedImage.url;
      let postObject = {
        body: req.body.body,
        title: req.body.title,
        postDate: new Date().toISOString().slice(0, 10),
        category: req.body.category,
        featureImage: req.body.featureImage,
        published: req.body.published === "true",
      };

      await blogService.addPost(postObject);

      res.redirect("/posts");
    } catch (err) {
      res.send(err);
    }
  }

  uploadImage(req);
});

app.get("/posts/add", (req, res) => {
  res.render("addPost");
});

app.get("/post/:value", (req, res) => {
  blogService
    .getPostById(req.params.value)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.send(err);
    });
});

app.get("/categories", (req, res) => {
  blogService
    .getCategories()
    .then((data) => {
      res.render("categories", { categories: data });
    })
    .catch((err) => {
      res.render("categories", { message: "no results" });
    });
});

app.get('/blog/:id', async (req, res) => {
  let viewData = {};
  try {
    let posts = [];
    if (req.query.category) {
      posts = await blogService.getPublishedPostsByCategory(req.query.category);
    } else {
      posts = await blogService.getPublishedPosts();
    }
    posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));
    viewData.posts = posts;
  } catch (err) {
    viewData.message = "no results";
  }
  try {
    viewData.post = await blogService.getPostById(req.params.id);
  } catch (err) {
    viewData.message = "no results"; 
  }
  try {
    let categories = await blogService.getCategories();
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
  }
  res.render("blog", { data: viewData });
});

app.listen(HTTP_PORT, () => {
  console.log(`Server listening on port ${HTTP_PORT}`);
});