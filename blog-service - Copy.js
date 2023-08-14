const { Sequelize, DataTypes } = require("sequelize");
var sequelize = new Sequelize(
  "dyzlaeek",
  "dyzlaeek",
  "hNE3cDpkOfNIgxMncTa82WUkQf2xpLWy",
  {
    host: "stampy.db.elephantsql.com",
    dialect: "postgres",
    port: 5432,
    dialectOptions: {
      ssl: { rejectUnauthorized: false },
    },
    query: { raw: true },
  }
);

const Post = sequelize.define("Post", {
  body: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  postDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  featureImage: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  published: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
});

const Category = sequelize.define("Category", {
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

// Define the "belongsTo" relationship
Post.belongsTo(Category, { foreignKey: "category" });

module.exports = {
  Post,
  Category,
};

function initialize() {
  return new Promise((resolve, reject) => {
    sequelize
      .sync()
      .then(() => {
        console.log("Database synchronization successful.");
        resolve();
      })
      .catch((error) => {
        console.error("Unable to sync the database:", error);
        reject("Unable to sync the database");
      });
  });
}

function getAllPosts() {
  return new Promise((resolve, reject) => {
    Post.findAll()
      .then((posts) => {
        resolve(posts);
      })
      .catch((error) => {
        console.error("Error fetching posts:", error);
        reject("Error fetching posts");
      });
  });
}

function getPostsByCategory(category) {
  return new Promise((resolve, reject) => {
    Post.findAll({
      where: {
        category: category,
      },
    })
      .then((posts) => {
        resolve(posts);
      })
      .catch((error) => {
        console.error("Error fetching posts by category:", error);
        reject("Error fetching posts by category");
      });
  });
}

function getPostsByMinDate(minDateStr) {
  return new Promise((resolve, reject) => {
    Post.findAll({
      where: {
        postDate: {
          [Op.gte]: new Date(minDateStr),
        },
      },
    })
      .then((posts) => {
        resolve(posts);
      })
      .catch((error) => {
        console.error("Error fetching posts by minDate:", error);
        reject("Error fetching posts by minDate");
      });
  });
}

function getPostById(id) {
  return new Promise((resolve, reject) => {
    Post.findAll({
      where: {
        id: id,
      },
    })
      .then((posts) => {
        if (posts.length > 0) {
          resolve(posts[0]);
        } else {
          reject("No results returned");
        }
      })
      .catch((error) => {
        console.error("Error fetching post by ID:", error);
        reject("Error fetching post by ID");
      });
  });
}

function addPost(postData) {
  postData.published = !!postData.published;

  for (const prop in postData) {
    if (postData[prop] === "") {
      postData[prop] = null;
    }
  }

  postData.postDate = new Date();

  return new Promise((resolve, reject) => {
    Post.create(postData)
      .then(() => {
        resolve();
      })
      .catch((error) => {
        console.error("Error adding post:", error);
        reject("Unable to create post");
      });
  });
}

function getPublishedPosts() {
  return new Promise((resolve, reject) => {
    Post.findAll({
      where: {
        published: true,
      },
    })
      .then((posts) => {
        resolve(posts);
      })
      .catch((error) => {
        console.error("Error fetching published posts:", error);
        reject("Error fetching published posts");
      });
  });
}

function getPublishedPostsByCategory(category) {
  return new Promise((resolve, reject) => {
    Post.findAll({
      where: {
        published: true,
        category: category,
      },
    })
      .then((posts) => {
        resolve(posts);
      })
      .catch((error) => {
        console.error("Error fetching published posts by category:", error);
        reject("Error fetching published posts by category");
      });
  });
}

function getCategories() {
  return new Promise((resolve, reject) => {
    Category.findAll()
      .then((categories) => {
        resolve(categories);
      })
      .catch((error) => {
        console.error("Error fetching categories:", error);
        reject("Error fetching categories");
      });
  });
}
function addCategory(categoryData) {
  return new Promise((resolve, reject) => {
    // Replace any blank values with null
    for (let key in categoryData) {
      if (categoryData[key] === "") {
        categoryData[key] = null;
      }
    }

    // Create the category using Category.create()
    Category.create(categoryData)
      .then((createdCategory) => {
        resolve(createdCategory);
      })
      .catch((error) => {
        reject("Unable to create category");
      });
  });
}

function deleteCategoryById(id) {
  return new Promise((resolve, reject) => {
    // Use Category.destroy() to delete the category by id
    Category.destroy({ where: { id: id } })
      .then((rowsDeleted) => {
        if (rowsDeleted > 0) {
          resolve("Category deleted successfully");
        } else {
          reject("Category not found");
        }
      })
      .catch((error) => {
        reject("Unable to delete category");
      });
  });
}
const deletePostById = (id) => {
  return new Promise((resolve, reject) => {
    Post.destroy({ where: { id } })
      .then((deletedRows) => {
        if (deletedRows > 0) {
          resolve();
        } else {
          reject(new Error("Post not found"));
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
};

module.exports = {
  initialize,
  getAllPosts,
  getPostsByCategory,
  getPostsByMinDate,
  getPostById,
  addPost,
  getPublishedPosts,
  getPublishedPostsByCategory,
  getCategories,
  addCategory,
  deletePostById,
  deleteCategoryById,
  deletePostById,
};
