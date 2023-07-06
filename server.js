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
const blogData = require("./blog-service.js");
const {initialize,getAllPosts,getCategories,addPost,getPostById,getPostsByCategory,getPostsByMinDate,} = require("./blog-service.js");

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
  cloud_name: "dtjzbh27c",
  api_key: "352185835558593",
  api_secret: "XWtpK6nUkH_eDPJIwyaGDNvo1F0",
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
      posts = await blogData.getPublishedPostsByCategory(req.query.category);
    } else {
      posts = await blogData.getPublishedPosts();
    }
    posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));
    let post = posts[0];
    viewData.posts = posts;
    viewData.post = post;
  } catch (err) {
    viewData.message = "no results";
  }
  try {
    let categories = await blogData.getCategories();
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
  }

  res.render("blog", { data: viewData });
});

app.get("/posts", (req, res) => {
  if (req.query.category) {
    getPostsByCategory(req.query.category)
      .then((data) => {
        res.render("posts", { posts: data });
      })
      .catch((err) => {
        res.render("posts", { message: "no results" });
      });
  } else if (req.query.minDate) {
    getPostsByMinDate(req.query.minDate)
      .then((data) => {
        res.render("posts", { posts: data });
      })
      .catch((err) => {
        res.render("posts", { message: "no results" });
      });
  } else {
    getAllPosts()
      .then((data) => {
        res.render("posts", { posts: data });
      })
      .catch((err) => {
        res.render("posts", { message: "no results" });
      });
  }
});

app.get("/posts/add", (req, res) => {
  res.render("addPost");
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

  async function upload(req) {
    let result = await streamUpload(req);
    return result;
  }

  upload(req)
    .then((uploaded) => {
      req.body.featureImage = uploaded.url;
      let postObject = {};

      postObject.body = req.body.body;
      postObject.title = req.body.title;
      postObject.postDate = new Date().toISOString().slice(0, 10);
      postObject.category = req.body.category;
      postObject.featureImage = req.body.featureImage;
      postObject.published = req.body.published;

      if (postObject.title) {
        addPost(postObject);
      }
      res.redirect("/posts");
    })
    .catch((err) => {
      res.send(err);
    });
});

app.get("/post/:value", (req, res) => {
  getPostById(req.params.value)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.send(err);
    });
});

app.get("/categories", (req, res) => {
  getCategories()
    .then((data) => {
      res.render("categories", { categories: data });
    })
    .catch((err) => {
      res.render("categories", { message: "no results" });
    });
});

app.get('/blog/:id', async (req, res) => {
  let viewData = {};
  try{
      let posts = [];
      if(req.query.category){
          posts = await blogData.getPublishedPostsByCategory(req.query.category);
      }else{
          posts = await blogData.getPublishedPosts();
      }
      posts.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));
      viewData.posts = posts;
  }catch(err){
      viewData.message = "no results";
  }
  try{
      viewData.post = await blogData.getPostById(req.params.id);
  }catch(err){
      viewData.message = "no results"; 
  }
  try{
      let categories = await blogData.getCategories();
      viewData.categories = categories;
  }catch(err){
      viewData.categoriesMessage = "no results";
  }

  res.render('blog', { data: viewData });
});

app.listen(HTTP_PORT, () => {
  console.log(`Server is listening on port ${HTTP_PORT}`);
});

Please note that I’ve maintained the original structure and logic of the code, but I removed the comments as per your request.