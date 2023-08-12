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



const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const stripJs = require('strip-js');

const blog = require('./blog-service');
const authData = require('./auth-service');
const clientSessions = require('client-sessions');
const app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.use(clientSessions({
    cookieName: "session",
    secret: "secret",
    duration: 2 * 60 * 1000,
    activeDuration: 1000 * 60
}));

app.use(function (req, res, next) {
    res.locals.session = req.session;
    next();
});

function ensureLogin(req, res, next) {
    if (!req.session.user) {
        res.redirect("/login");
    }
    else {
        next();
    }
}

// Handlebar setup and custom helpers
app.engine('.hbs', exphbs.engine({
    extname: '.hbs',
    helpers: {
        navLink: function (url, options) {
            return '<li' +
                ((url == app.locals.activeRoute) ? ' class="active" ' : '') +
                '><a href="' + url + '">' + options.fn(this) + '</a></li>';
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
        formatDate: function (dateObj) {
            let year = dateObj.getFullYear();
            let month = (dateObj.getMonth() + 1).toString();
            let day = dateObj.getDate().toString();
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
    }
}));
app.set('view engine', '.hbs');


cloudinary.config({
  cloud_name: "dis6og4lc",
  api_key: "145446994168569",
  api_secret: "SBVfa_1AV6fyYyaoputexhGiqXg",
  secure: true,
});

const upload = multer();

// View Path settings
var path = require('path');
var views = path.join(__dirname, 'views');

// Starting Server
blog.initialize()
    .then(authData.initialize)
    .then(function () {
        app.listen(process.env.PORT || 8080, () => {
            console.log("Server Started at port 8080");
        })
    }).catch(function (err) {
        console.log("unable to start server: " + err);
    });


app.use(express.static('public'));

// Set Active Route Style
app.use(function (req, res, next) {
    let route = req.path.substring(1);
    app.locals.activeRoute = (route == "/") ? "/" : "/" + route.replace(/\/(.*)/, "");
    app.locals.viewingCategory = req.query.category;
    next();
});

// Routes
app.get('/', (req, res) => {
    res.redirect('/blog');
});

app.get('/about', (req, res) => {
    res.render('about')
});

// Post Routes
app.get('/posts/add', ensureLogin, (req, res) => {
    blog.getCategories().then((data) => {
        res.render('addPost', {
            categories: data
        });
    }).catch((err) => {
        res.render('addPost', {
            categories: []
        });
    })
});

app.get('/posts', ensureLogin, (req, res) => {
    if (req.query.category) {
        blog.getPostsByCategory(req.query.category).then((data) => {
            if (data.length > 0) {
                res.render('posts', {
                    posts: data
                })
            } else {
                res.render('posts', { message: "No Results" });
            }
        }).catch((err) => {
            res.render("posts", { message: "No results" });
        })
    } else if (req.query.minDate) {
        blog.getPostsByMinDate(req.query.minDate).then((data) => {
            if (data.length > 0) {
                res.render('posts', {
                    posts: data
                })
            } else {
                res.render('posts', { message: "No Results" });
            }
        }).catch((err) => {
            res.render("posts", { message: "No results" });
        })
    } else {
        blog.getAllPosts().then((data) => {
            if (data.length > 0) {
                res.render('posts', {
                    posts: data
                })
            } else {
                res.render('posts', { message: "No Results" });
            }
        })
            .catch((err) => {
                res.render("posts", { message: "No results" });
            })
    }
})

app.get('/posts/:id', ensureLogin, (req, res) => {
    blog.getPostsById(req.params.id).then((data) => {
        res.json(data)
    })
        .catch((err) => {
            res.json({
                message: "No results"
            });
        })
})


app.post('/posts/add', ensureLogin, upload.single("featureImage"), (req, res) => {
    if (req.file) {
        let streamUpload = (req) => {
            return new Promise((resolve, reject) => {
                let stream = cloudinary.uploader.upload_stream(
                    (error, result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(error);
                        }
                    }
                );
                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
        };
        async function upload(req) {
            let result = await streamUpload(req);
            console.log(result);
            return result;
        }
        upload(req).then((uploaded) => {
            processPost(uploaded.url);
        });
    } else {
        processPost("");
    }

    function processPost(imageUrl) {
        req.body.featureImage = imageUrl;
        blog.addPost(req.body).then(() => {
            res.redirect('/posts');
        })
    }
})

app.get('/post/delete/:id', ensureLogin, (req, res) => {
    blog.deletePostById(req.params.id).then(() => {
        res.redirect('/posts');
    }).catch((err) => {
        res.status(500).render('posts', { message: "Unable to delete Post/ Post not Found" });
    })
});

// Blog Routes

app.get('/blog/:id', async (req, res) => {

    // Declare an object to store properties for the view
    let viewData = {};

    try {

        // declare empty array to hold "post" objects
        let posts = [];

        // if there's a "category" query, filter the returned posts by category
        if (req.query.category) {
            // Obtain the published "posts" by category
            posts = await blog.getPublishedPostsByCategory(req.query.category);
        } else {
            // Obtain the published "posts"
            posts = await blog.getPublishedPosts();
        }

        // sort the published posts by postDate
        posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

        // store the "posts" and "post" data in the viewData object (to be passed to the view)
        viewData.posts = posts;

    } catch (err) {
        viewData.message = "no results";
    }

    try {
        // Obtain the post by "id"
        posts = await blog.getPostById(req.params.id);
        let post = posts[0];
        viewData.post = post;
    } catch (err) {
        viewData.message = "no results";
    }


    try {
        // Obtain the full list of "categories"
        let categories = await blog.getCategories();

        // store the "categories" data in the viewData object (to be passed to the view)
        viewData.categories = categories;
    } catch (err) {
        viewData.categoriesMessage = "no results"
    }
    console.log(viewData);

    // render the "blog" view with all of the data (viewData)
    res.render("blog", { data: viewData })
});

app.get('/blog', async (req, res) => {

    // Declare an object to store properties for the view
    let viewData = {};

    try {

        // declare empty array to hold "post" objects
        let posts = [];

        // if there's a "category" query, filter the returned posts by category
        if (req.query.category) {
            // Obtain the published "posts" by category
            posts = await blog.getPublishedPostsByCategory(req.query.category);
        } else {
            // Obtain the published "posts"
            posts = await blog.getPublishedPosts();
        }

        // sort the published posts by postDate
        posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

        // get the latest post from the front of the list (element 0)
        let post = posts[0];

        // store the "posts" and "post" data in the viewData object (to be passed to the view)
        viewData.posts = posts;
        viewData.post = post;

    } catch (err) {
        viewData.message = "no results";
    }

    try {
        // Obtain the full list of "categories"
        let categories = await blog.getCategories();

        // store the "categories" data in the viewData object (to be passed to the view)
        viewData.categories = categories;
    } catch (err) {
        viewData.categoriesMessage = "no results"
    }
    // render the "blog" view with all of the data (viewData)
    res.render("blog", { data: viewData })

});

// Category Routes

app.get('/categories', ensureLogin, (req, res) => {
    blog.getCategories().then((data) => {
        if (data.length > 0) {
            res.render('categories', {
                categories: data
            })
        } else {
            res.render('categories', { message: "No results" });
        }

    })
        .catch((err) => {
            res.render('categories', {
                message: "No results"
            });
        })
})

app.get('/categories/add', ensureLogin, (req, res) => {
    res.render('addCategory');
});

app.post('/categories/add', ensureLogin, (req, res) => {
    console.log(req);
    blog.addCategory(req.body).then(() => {
        res.redirect('/categories');
    }).catch((err) => {
        res.render('categories', { message: 'Unable to add Category' });
    })
});

app.get('/categories/delete/:id', ensureLogin, (req, res) => {
    blog.deleteCategoryById(req.params.id).then(() => {
        res.redirect('/categories');
    }).catch((err) => {
        res.render('categories', { message: "Unable to delete Category" });
    })
});


// Login Route

app.get("/login", (req, res) => {
    res.render('login');
});

app.get("/register", (req, res) => {
    res.render('register');
});

app.post("/register", (req, res) => {
    authData.registerUser(req.body)
        .then(() => {
            res.render('register', { successMessage: "User Created" });
        })
        .catch((err) => {
            res.render('register', {
                errorMessage: err,
                userName: req.body.userName
            });
        })
});

app.post("/login", (req, res) => {
    req.body.userAgent = req.get('User-Agent');

    authData.checkUser(req.body).then((user) => {
        req.session.user = {
            "userName": user.userName,
            "email": user.email,
            "loginHistory": user.loginHistory
        }
        res.redirect('/posts');
    })
        .catch((err) => {
            res.render('login', {
                errorMessage: err,
                userName: req.body.userName
            });
        })
});

app.get('/logout', (req, res) => {
    req.session.reset();
    res.redirect('/login');
});

app.get('/userHistory', (req, res) => {
    res.render('userHistory');
})
// 404 page
app.use((req, res) => {
    res.status(404).render('404')
});
