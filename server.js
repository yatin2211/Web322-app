/*********************************************************************************
 * WEB322 – Assignment 05
 * I declare that this assignment is my own work in accordance with Seneca Academic Policy.
 * No part of this assignment has been copied manually or electronically from any other source
 * (including web sites) or distributed to other students.
 *
 * Name: __________Yatin rana___________ Student ID: _____167501212_________ Date:7/26/23 ________________
 *
 * Cyclic Web App URL:https://unusual-teal-waistcoat.cyclic.app/about
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
      formatDate: function(dateObj){
        let year = dateObj.getFullYear();
        let month = (dateObj.getMonth() + 1).toString();
        let day = dateObj.getDate().toString();
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2,'0')}`;
        },
      }
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
  // Declare an object to store properties for the view
  let viewData = {};
  try {
    // declare empty array to hold "post" objects
    let posts = [];
    // if there's a "category" query, filter the returned posts by category
    if (req.query.category) {
      // Obtain the published "posts" by category
      posts = await blogData.getPublishedPostsByCategory(req.query.category);
    } else {
      // Obtain the published "posts"
      posts = await blogData.getPublishedPosts();
    }
    // sort the published posts by postDate
    posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));
    // get the latest post from the front of the list (element 0)
    let post = posts[0];
    // store the "posts" and "post" data in the viewData object (to be passed to the view)
    viewData.posts = posts;
    viewData.post = post;
  } catch (err) {
    viewData.message = "No results found.";
  }
  try {
    // Obtain the full list of "categories"
    let categories = await blogData.getCategories();
    // store the "categories" data in the viewData object (to be passed to the view)
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "No results found.";
  }

  // render the "blog" view with all of the data (viewData)
  res.render("blog", { data: viewData });
});


app.get("/posts", (req, res) => {
  // Checking if a category was provided
  if (req.query.category) {
    getPostsByCategory(req.query.category)
      .then((data) => {
        res.render("posts", { posts: data });
      })
      // Error Handling
      .catch((err) => {
        res.render("posts", { message: "No results found." });
      });
  }

  // Checking if a minimum date is provided
  else if (req.query.minDate) {
    getPostsByMinDate(req.query.minDate)
      .then((data) => {
        res.render("posts", { posts: data });
      })
      // Error Handling
      .catch((err) => {
        res.render("posts", { message: "No results found." });
      });
  }

  // Checking whether no specification queries were provided
  else {
    getAllPosts()
      .then((data) => {
        res.render("posts", { posts: data });
      })
      // Error Handling
      .catch((err) => {
        res.render("posts", { message: "No results found." });
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
    // Error Handler
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

app.get("/categories/add", (req, res) => {
  res.render("addCategory");
});

app.post("/categories/add", (req, res) => {
  let categoryData = req.body;
  for (let key in categoryData) {
      if (categoryData[key] === "") {
          categoryData[key] = null;
      }
  }

  addCategory(categoryData)
      .then(() => {
          res.redirect("/categories");
      })
      .catch((error) => {
          res.status(500).send("Unable to add category");
      });
});

app.get("/categories/delete/:id", (req, res) => {
  let categoryId = req.params.id;

  deleteCategoryById(categoryId)
      .then(() => {
          res.redirect("/categories");
      })
      .catch((error) => {
          res.status(500).send("Unable to Remove Category / Category not found");
      });
});

app.get("/posts/delete/:id", (req, res) => {
  let postId = req.params.id;

  deletePostById(postId)
      .then(() => {
          res.redirect("/posts");
      })
      .catch((error) => {
          res.status(500).send("Unable to Remove Post / Post not found");
      });
});
app.get("/posts/delete/:id", (req, res) => {
  let postId = req.params.id;

  deletePostById(postId)
    .then(() => {
      res.redirect("/posts");
    })
    .catch((error) => {
      res.status(500).send("Unable to Remove Post / Post not found");
    });
});



app.use((req, res) => {
  res.status(404).render("404");
});


initialize().then(() => {

  app.listen(HTTP_PORT, () => {
    console.log("Express http server listening on: " + HTTP_PORT);
  });
});
