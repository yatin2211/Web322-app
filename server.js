/*********************************************************************************
 * WEB322 – Assignment 04
 * I declare that this assignment is my own work in accordance with Seneca Academic Policy.
 * No part of this assignment has been copied manually or electronically from any other source
 * (including web sites) or distributed to other students.
 *
 * Name: __________Yatin rana___________ Student ID: _____167501212_________ Date:7/6/23 ________________
 *
 * Cyclic Web App URL:
 *
 * GitHub Repository URL: __https://github.com/yatin2211/Web322-app_____
 *
 ********************************************************************************/

const express = require("express");
const multer = require("multer");
const exphbs = require("express-handlebars");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const path = require("path");
const blogData = require("./blog-service");
const stripJs = require('strip-js');

const app = express();

app.use(express.static("public"));
const hbs = exphbs.create({
  helpers: {
    safeHTML: function(context) {
      return new exphbs.SafeString(stripJs(context));
    }
  }
});
app.engine(
  'hbs',
  exphbs({
    defaultLayout: 'main',
    extname: '.hbs',
    helpers: {
      safeHTML: function(context) {
        return new exphbs.SafeString(stripJs(context));
      }
    }
  })
);

app.engine(
  ".hbs",
  exphbs({
    extname: ".hbs",
    helpers: {
      navLink: function (url, options) {
        return (
          '<li' +
          ((url == app.locals.activeRoute) ? ' class="active" ' : '') +
          '><a href="' +
          url +
          '">' +
          options.fn(this) +
          '</a></li>'
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
app.set("views", path.join(__dirname, "views"));


cloudinary.config({
  cloud_name: "dim1rhbtf",
  api_key: "164953244556485",
  api_secret: "d6v_khnEy5PpmM_6va6eZwfyYn8",
  secure: true,
});

const upload = multer();

const HTTP_PORT = process.env.PORT || 8080;

app.use(function(req,res,next){
  let route = req.path.substring(1);
  app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
  });

  app.get("/", (req, res) => {
    res.redirect("/blog");
  });
  
app.get("/about", (req, res) => {
  res.render("about");
});


app.get('/blog', async (req, res) => {

  // Declare an object to store properties for the view
  let viewData = {};

  try{

      // declare empty array to hold "post" objects
      let posts = [];

      // if there's a "category" query, filter the returned posts by category
      if(req.query.category){
          // Obtain the published "posts" by category
          posts = await blogData.getPublishedPostsByCategory(req.query.category);
      }else{
          // Obtain the published "posts"
          posts = await blogData.getPublishedPosts();
      }

      // sort the published posts by postDate
      posts.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));

      // get the latest post from the front of the list (element 0)
      let post = posts[0]; 

      // store the "posts" and "post" data in the viewData object (to be passed to the view)
      viewData.posts = posts;
      viewData.post = post;

  }catch(err){
      viewData.message = "no results";
  }

  try{
      // Obtain the full list of "categories"
      let categories = await blogData.getCategories();

      // store the "categories" data in the viewData object (to be passed to the view)
      viewData.categories = categories;
  }catch(err){
      viewData.categoriesMessage = "no results"
  }

  // render the "blog" view with all of the data (viewData)
  res.render("blog", {data: viewData})

});
app.get('/blog/:id', async (req, res) => {

  // Declare an object to store properties for the view
  let viewData = {};

  try{

      // declare empty array to hold "post" objects
      let posts = [];

      // if there's a "category" query, filter the returned posts by category
      if(req.query.category){
          // Obtain the published "posts" by category
          posts = await blogData.getPublishedPostsByCategory(req.query.category);
      }else{
          // Obtain the published "posts"
          posts = await blogData.getPublishedPosts();
      }

      // sort the published posts by postDate
      posts.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));

      // store the "posts" and "post" data in the viewData object (to be passed to the view)
      viewData.posts = posts;

  }catch(err){
      viewData.message = "no results";
  }

  try{
      // Obtain the post by "id"
      viewData.post = await blogData.getPostById(req.params.id);
  }catch(err){
      viewData.message = "no results"; 
  }

  try{
      // Obtain the full list of "categories"
      let categories = await blogData.getCategories();

      // store the "categories" data in the viewData object (to be passed to the view)
      viewData.categories = categories;
  }catch(err){
      viewData.categoriesMessage = "no results"
  }

  // render the "blog" view with all of the data (viewData)
  res.render("blog", {data: viewData})
});

app.get("/posts", (req, res) => {
  if (req.query.category) {
    const category = req.query.category;
    blogService.getPostsByCategory(category)
      .then((posts) => {
        if (posts.length > 0) {
          res.render("posts", { posts });
        } else {
          res.render("posts", { message: "no results" });
        }
      })
      .catch((error) => {
        res.render("posts", { message: "no results" });
      });
  } else if (req.query.minDate) {
    const minDateStr = req.query.minDate;
    blogService.getPostsByMinDate(minDateStr)
      .then((posts) => {
        if (posts.length > 0) {
          res.render("posts", { posts });
        } else {
          res.render("posts", { message: "no results" });
        }
      })
      .catch((error) => {
        res.render("posts", { message: "no results" });
      });
  } else {
    blogService.getAllPosts()
      .then((posts) => {
        if (posts.length > 0) {
          res.render("posts", { posts });
        } else {
          res.render("posts", { message: "no results" });
        }
      })
      .catch((error) => {
        res.render("posts", { message: "no results" });
      });
  }
});


app.get("/posts/add", (req, res) => {
  res.render("addPost");
});

app.post("/posts/add", upload.single("featureImage"), (req, res) => {
  if (req.file) {
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
      console.log(result);
      return result;
    }

    upload(req)
      .then((uploaded) => {
        processPost(uploaded.url);
      })
      .catch((error) => {
        console.log("Error uploading image:", error);
        processPost("");
      });
  } else {
    processPost("");
  }

  function processPost(imageUrl) {
    const postData = {
      title: req.body.title,
      body: req.body.body,
      category: req.body.category,
      featureImage: imageUrl,
      published: req.body.published === "true",
    };

    blogService.addPost(postData)
      .then((addedPost) => {
        res.redirect("/posts");
      })
      .catch((error) => {
        res.status(500).json({ error });
      });
  }
});

app.get("/post/:value", (req, res) => {
  const postId = parseInt(req.params.value);
  blogService.getPostById(postId)
    .then((post) => {
      res.json(post);
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
});
app.get("/categories", (req, res) => {
  blogService.getCategories()
    .then((categories) => {
      res.render("categories", { categories });
    })
    .catch((error) => {
      res.render("categories", { message: "no results" });
    });
});



blogService.initialize()
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log("Express http server listening on: " + HTTP_PORT);
    });
  })
  .catch((error) => {
    console.log("Error initializing blog service:", error);
  });
