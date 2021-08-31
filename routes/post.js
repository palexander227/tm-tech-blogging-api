const express = require('express');
const router = express.Router()
const Post = require('../models/post');
const Comment = require('../models/comment');
const User = require('../models/user');
const path = require('path');
const passport = require('passport')
const Sequelize = require('sequelize');
require('../config/passport')(passport)

// Add Post
router.post('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {

        let files = undefined;
        if (req._fileparser) {
            files = req._fileparser.upstreams.length
                ? req.file("postImage")
                : undefined;
        }
        let fileName = '';
        if(files){
            files.upload({
                adapter: require('skipper-s3'),
                key: process.env.BUCKET_KEY,
                secret: process.env.BUCKET_SECRET,
                bucket: process.env.BUCKET_NAME,
                maxBytes: 10000000, 
                dirname: '',
            }, async (err, uploadedImg) => {
                if (err) return res.status(400).send({ err });
                fileName = `https://thoughtmuseum-image-hosting.s3.us-east-2.amazonaws.com/${uploadedImg[0].fd}`;
                const post = await Post.create({
                    title: req.body.title,
                    content: req.body.content,
                    userId: req.user.id,
                    image:fileName
                });
                res.status(201).send({ message: 'Post created', post });
                //res.status(200).send({message: 'uploaded successfully...', data: {url: uploadedImg[0].fd}});
            })
        }else{
            const post = await Post.create({
                title: req.body.title,
                content: req.body.content,
                userId: req.user.id,
                image:fileName
            });
            res.status(201).send({ message: 'Post created', post });
        }

        
    }
    catch (err) {
        if (err.name === 'SequelizeForeignKeyConstraintError')
            res.status(500).send({ message: 'User ID is invalid' })
        else
            res.status(500).send({ message: 'Error creating Post details' })
    }
})

// Update post
router.put('/:postid', passport.authenticate('jwt', { session: false }), async (req, res) => {
    const { postid } = req.params;

    try {
        const post = await Post.findByPk(postid, {
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ['firstName', 'lastName']
                }
            ]
        });
        if (post) {
            post.title = req.body.title
            post.content = req.body.content
            await post.save();
            res.status(200).send({ message: 'Post updated successfully', post });
        }
        else {
            res.status(200).send({ message: 'Post not found' });
        }
    }
    catch (err) {
        res.status(500).send({ message: 'Error updating post details' })
    }
})

// Delete post
router.delete('/:postid', passport.authenticate('jwt', { session: false }), async (req, res) => {
    const { postid } = req.params;

    try {
        const post = await Post.findByPk(postid);
        if (post) {
            post.destroy();
            res.status(200).send({ message: 'Post deleted successfully' });
        }
        else {
            res.status(200).send({ message: 'Post not found' });
        }
    }
    catch (err) {
        res.status(500).send({ message: 'Error deleting post details' })
    }
})

// Editor file upload
router.post('/file_upload', function(req, res) {
    let files = undefined;
    if (req._fileparser) {
        files = req._fileparser.upstreams.length
            ? req.file("upload")
            : undefined;
    }
    files.upload({
        adapter: require('skipper-s3'),
        key: process.env.BUCKET_KEY,
        secret: process.env.BUCKET_SECRET,
        bucket: process.env.BUCKET_NAME,
        maxBytes: 10000000, 
        dirname: '',
    }, async (err, uploadedImg) => {
        if (err) return res.status(400).send({ err });
        const mediaPath = `https://thoughtmuseum-image-hosting.s3.us-east-2.amazonaws.com/${uploadedImg[0].fd}`;
        res.send({uploaded: true, url: mediaPath});
    })
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message });
});

// Get posts
router.get('/allpost', async (req, res) => {
    try {
        const pageLimit = 10;
        const pageNo = req.query.pageNo?req.query.pageNo:1;
        const userId = req.query.userId?req.query.userId:null;
        const search = req.query.search;
        let condition;
        const query = {
            limit: pageLimit,
            offset:((pageNo - 1) * pageLimit),
            include: [
                {
                    model: User, 
                    as: "user",
                    attributes: ['firstName', 'lastName']
                }
            ]
        };
        if (userId && userId !== 'null') {
            condition = {userId: userId};
        }
        if (search) {
            const searchQuery = {
                title: {
                    [Sequelize.Op.like]: '%'+search+'%'
                }
            }
            condition = condition ? {...condition, ...searchQuery} : searchQuery
            
        }
        console.log(condition)
        if (condition) {
            query.where = condition;
        }
        const {count, rows: posts} = await Post.findAndCountAll(query);
        res.status(200).send({ message: '', posts, count })
    }
    catch (err) {
        console.log(err)
        res.status(500).send({ message: 'Some error occured while fetching posts' })
    }
})

// Get single post
router.get('/:postid', async (req, res) => {
    const { postid } = req.params;
    try {
        const post = await Post.findByPk(postid, {
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ['firstName', 'lastName', ['id', 'userId']]
                }
            ]
        });
        res.status(200).send({ message: '', post })
    }
    catch (err) {
        console.log(err)
        res.status(500).send({ message: 'Some error occured while fetching posts' })
    }
})

module.exports = router
