
const fs = require("fs");
const path = require("path");

let posts = [];
let categories = [];

function initialize() {
  return new Promise((resolve, reject) => {
    fs.readFile(path.join(__dirname, "data", "posts.json"), "utf8", (err, postData) => {
      if (err) {
        reject("Unable to read posts file");
      }

      posts = JSON.parse(postData);

      fs.readFile(path.join(__dirname, "data", "categories.json"), "utf8", (err, categoryData) => {
        if (err) {
          reject("Unable to read categories file");
        }

        categories = JSON.parse(categoryData);

        resolve();
      });
    });
  });
}

function getAllPosts() {
  return new Promise((resolve, reject) => {
    if (posts.length === 0) {
      reject("No results returned");
    } else {
      resolve(posts);
    }
  });
}

function getPublishedPosts() {
  return new Promise((resolve, reject) => {
    const publishedPosts = posts.filter(post => post.published);
    if (publishedPosts.length > 0) {
      resolve(publishedPosts);
    } else {
      reject("No results returned");
    }
  });
}

function getPublishedPostsByCategory(category) {
  return new Promise((resolve, reject) => {
    const filteredPosts = posts.filter(post => post.category === category && post.published);
    if (filteredPosts.length > 0) {
      resolve(filteredPosts);
    } else {
      reject("No results returned");
    }
  });
}

function getCategories() {
  return new Promise((resolve, reject) => {
    if (categories.length === 0) {
      reject("No results returned");
    } else {
      resolve(categories);
    }
  });
}

function getPostById(id) {
  return new Promise((resolve, reject) => {
    const post = posts.find(post => post.id === id);
    if (post) {
      resolve(post);
    } else {
      reject("No result returned");
    }
  });
}

function getPostsByCategory(category) {
  return new Promise((resolve, reject) => {
    const filteredPosts = posts.filter(post => post.category === category);
    if (filteredPosts.length > 0) {
      resolve(filteredPosts);
    } else {
      reject("No results returned");
    }
  });
}

function getPostsByMinDate(minDate) {
  return new Promise((resolve, reject) => {
    const filteredPosts = posts.filter(post => new Date(post.postDate) >= new Date(minDate));
    if (filteredPosts.length > 0) {
      resolve(filteredPosts);
    } else {
      reject("No results returned");
    }
  });
}

function addPost(postData) {
  return new Promise((resolve, reject) => {
    const newPost = {
      id: posts.length + 1,
      title: postData.title,
      body: postData.body,
      postDate: new Date().toISOString().slice(0, 10),
      category: postData.category,
      published: postData.published || false,
    };

    posts.push(newPost);
    resolve(newPost);
  });
}

module.exports = {
  initialize,
  getAllPosts,
  getPublishedPosts,
  getCategories,
  addPost,
  getPostById,
  getPostsByCategory,
  getPostsByMinDate,
  getPublishedPostsByCategory,
};