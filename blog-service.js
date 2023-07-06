const fs = require('fs');

let posts = [];
let categories = [];

function initialize() {
  return new Promise((resolve, reject) => {
    fs.readFile('./data/posts.json', 'utf8', (err, postData) => {
      if (err) {
        reject('Unable to read posts.json');
        return;
      }

      try {
        posts = JSON.parse(postData);
      } catch (parseError) {
        reject('Error parsing posts.json');
        return;
      }

      fs.readFile('./data/categories.json', 'utf8', (err, categoryData) => {
        if (err) {
          reject('Unable to read categories.json');
          return;
        }

        try {
          categories = JSON.parse(categoryData);
          resolve();
        } catch (parseError) {
          reject('Error parsing categories.json');
        }
      });
    });
  });
}

function getAllPosts() {
  return new Promise((resolve, reject) => {
    if (!posts.length) {
      reject('No posts available');
      return;
    }

    resolve(posts);
  });
}

function getPublishedPosts() {
  return new Promise((resolve, reject) => {
    const publishedPosts = [];
    for (let i = 0; i < posts.length; i++) {
      if (posts[i].published) {
        publishedPosts.push(posts[i]);
      }
    }

    if (!publishedPosts.length) {
      reject('No published posts available');
      return;
    }

    resolve(publishedPosts);
  });
}

function getCategories() {
  return new Promise((resolve, reject) => {
    if (!categories.length) {
      reject('No categories available');
      return;
    }

    resolve(categories);
  });
}

function getPostsByCategory(category) {
  return new Promise((resolve, reject) => {
    const filteredPosts = posts.filter((post) => post.category === category);
    if (filteredPosts.length === 0) {
      reject('No results returned');
      return;
    }

    resolve(filteredPosts);
  });
}

function getPostsByMinDate(minDateStr) {
  return new Promise((resolve, reject) => {
    const minDate = new Date(minDateStr);
    const filteredPosts = posts.filter((post) => new Date(post.postDate) >= minDate);
    if (filteredPosts.length === 0) {
      reject('No results returned');
      return;
    }

    resolve(filteredPosts);
  });
}

function getPostById(id) {
  return new Promise((resolve, reject) => {
    const post = posts.find((post) => post.id === id);
    if (!post) {
      reject('No result returned');
      return;
    }

    resolve(post);
  });
}

const addPost = (postData) => {
  const post = {
    id: getNextId(),
    title: postData.title,
    body: postData.body,
    category: postData.category,
    featureImage: postData.featureImage,
    published: postData.published,
    postDate: new Date().toISOString().slice(0, 10), // Format: YYYY-MM-DD
  };

  posts.push(post);
  return post;
};


module.exports = {
  initialize,
  getAllPosts,
  getPublishedPosts,
  getCategories,
  getPostsByCategory,
  getPostsByMinDate,
  getPostById,
  addPost,
};
