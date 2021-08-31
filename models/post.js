const Sequelize = require('sequelize');
const db = require('../config/database');
const User = require('./user');

const Post = db.define('Post', {
    title: {
        type: Sequelize.STRING
    },
    content: {
        type: Sequelize.TEXT
    },
    image:{
        type : Sequelize.TEXT
    }
});

Post.belongsTo(User, { as: 'user' })

Post.sync().then(() => {
    console.log('Post Table in sync now');
});

module.exports = Post;